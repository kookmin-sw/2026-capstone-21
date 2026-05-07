from __future__ import annotations
from typing import Optional, Union, List, Dict
import numpy as np
import faiss
from sqlalchemy.orm import Session
from scipy.special import expit
from scipy.sparse import coo_matrix
from lightfm import LightFM
from sentence_transformers import SentenceTransformer

from app.db.models import Influencer, InfluencerEmbedding, UserActionLog, RecommendationRun
from app.utils.setting_config import settings

# --- 1. Bandit 로직 클래스 (독립적인 의사결정 담당) ---
class ReRankingBandit:
    def __init__(self, db: Session):
        self.db = db
        # 가능한 가중치 조합 (FAISS 비중, LightFM 비중, Grade 비중)
        self.actions = [
            (0.5, 0.3, 0.2), 
            (0.4, 0.4, 0.2), 
            (0.3, 0.3, 0.4), 
            (0.6, 0.2, 0.2)
        ]
        self.n_actions = len(self.actions)
        
        # Alpha, Beta 파라미터 초기화 (AttributeError 방지)
        self.alphas, self.betas = self._load_bandit_stats()

    def _load_bandit_stats(self):
        """
        DB 로그 등을 분석해 현재 Bandit의 학습 상태(Alpha, Beta)를 로드합니다.
        현 단계에서는 단순화를 위해 기본값(1, 1)에서 시작하거나 
        추후 DB 테이블에서 값을 읽어오도록 확장 가능합니다.
        """
        return np.ones(self.n_actions), np.ones(self.n_actions)

    def select_action(self):
        """Thompson Sampling을 통해 최적의 가중치 조합 선택"""
        samples = [np.random.beta(self.alphas[i], self.betas[i]) for i in range(self.n_actions)]
        action_idx = np.argmax(samples)
        return self.actions[action_idx], action_idx

    def update(self, action_idx, reward):
        """피드백(Reward)에 따라 파라미터 업데이트"""
        if reward > 0:
            self.alphas[action_idx] += reward
        else:
            self.betas[action_idx] += abs(reward)

# --- 2. 추천 엔진 클래스 (메인 로직 담당) ---
class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.lfm_model = LightFM(loss='warp')
        self.bandit = ReRankingBandit(db) # Bandit 클래스 주입
        
        # 리소스 초기화
        self.inf_ids = []
        self.inf_grades = {}
        self.faiss_index = None
        self.user_map = {}
        
        self._load_resources()

    def _load_resources(self):
        """FAISS 인덱스 구축 및 LightFM 사전 학습"""
        # 1. 인플루언서 임베딩 로드
        # ✅ is_active=True인 인플루언서만 로딩
        embeddings = (
            self.db.query(
                InfluencerEmbedding.influencer_id,
                InfluencerEmbedding.embedding_vector,
                Influencer.grade_score
            )
            .join(Influencer, Influencer.influencer_id == InfluencerEmbedding.influencer_id)
            .filter(Influencer.is_active.is_(True))
            .all()
        )

        if embeddings:
            vectors = np.array([e.embedding_vector for e in embeddings]).astype('float32')
            self.faiss_index = faiss.IndexFlatIP(vectors.shape[1])
            self.faiss_index.add(vectors)
            
            self.inf_ids = [e.influencer_id for e in embeddings]
            self.inf_grades = {e.influencer_id: (e.grade_score / 5.0 if e.grade_score else 0.2) for e in embeddings}

        # 2. LightFM 학습
        # self._train_lfm()

    def _train_lfm(self):
        """사용자 액션 로그 기반 LightFM 학습"""
        logs = self.db.query(UserActionLog).all()
        if not logs or not self.inf_ids:
            return

        user_list = list(set(l.user_id for l in logs))
        self.user_map = {uid: i for i, uid in enumerate(user_list)}
        inf_map = {iid: i for i, iid in enumerate(self.inf_ids)}

        u_indices = [self.user_map[l.user_id] for l in logs if l.influencer_id in inf_map]
        i_indices = [inf_map[l.influencer_id] for l in logs if l.influencer_id in inf_map]
        rewards = [l.reward for l in logs if l.influencer_id in inf_map]

        if u_indices:
            interaction_matrix = coo_matrix(
                (rewards, (u_indices, i_indices)),
                shape=(len(user_list), len(self.inf_ids))
            )
            self.lfm_model.fit(interaction_matrix, epochs=10)

    def recommend(self, user_id: int, query_text: str, top_k=5):
        """최종 추천 수행"""
        if not self.faiss_index:
            return []

        # [STEP 1] FAISS 검색 (Candidate Retrieval)
        query_vec = self.model.encode([query_text], normalize_embeddings=True).astype('float32')
        search_k = min(top_k, len(self.inf_ids))
        faiss_scores, faiss_indices = self.faiss_index.search(query_vec, search_k)

        # [STEP 2] Bandit 가중치 선택
        (w_faiss, w_lfm, w_grade), action_idx = self.bandit.select_action()

        # [STEP 3] 점수 결합 (Hybrid Scoring)
        candidate_inf_ids = [self.inf_ids[idx] for idx in faiss_indices[0]]
        
        # LightFM 개인화 점수 계산
        if user_id in self.user_map:
            u_idx = self.user_map[user_id]
            inf_matrix_indices = [self.inf_ids.index(iid) for iid in candidate_inf_ids]
            lfm_scores = expit(self.lfm_model.predict(u_idx, np.array(inf_matrix_indices)))
        else:
            lfm_scores = np.full(len(candidate_inf_ids), 0.5)

        results = []
        for i, inf_id in enumerate(candidate_inf_ids):
            similarity_score = float(faiss_scores[0][i])
            personalization_score = float(lfm_scores[i])
            grade_score = float(self.inf_grades.get(inf_id, 0.2))

            final_score = (
                similarity_score * w_faiss +
                personalization_score * w_lfm +
                grade_score * w_grade
            )

            results.append({
                "influencer_id": inf_id,
                "similarity_score": similarity_score,
                "personalization_score": personalization_score,
                "grade_score": grade_score,
                "final_score": float(final_score),

                # 기존 router/frontend 호환용
                "score": float(final_score),

                "action_idx": action_idx # 추천 실행 시 어떤 가중치가 쓰였는지 함께 리턴
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]