from __future__ import annotations
from typing import Optional, Union, List, Dict
import numpy as np
import faiss
from sqlalchemy.orm import Session
from scipy.special import expit
from scipy.sparse import coo_matrix
from lightfm import LightFM
from sentence_transformers import SentenceTransformer

from app.db.models import Influencer, InfluencerEmbedding, UserActionLog, BanditStatus, RecommendationRun
from app.utils.setting_config import settings

# 파일 상단 import 아래에 추가
GLOBAL_MODEL = None
LATEST_LFM_MODEL = None
LATEST_USER_MAP = None
LATEST_INF_MAP = None

def update_global_lfm_model(db: Session):
    # 이 함수를 10분마다 혹은 특정 주기로 실행=
    global LATEST_LFM_MODEL, LATEST_USER_MAP, LATEST_INF_MAP
    
    # 사용자 액션 로그 기반 LightFM 학습
    # 1. 로그 데이터 가져오기
    logs = db.query(UserActionLog).all()
    active_infs = db.query(Influencer.influencer_id).filter(Influencer.is_active == True).all()
    inf_ids = [row.influencer_id for row in active_infs]

    if not logs or not inf_ids:
        return

    user_list = list(set(l.user_id for l in logs))
    user_map = {uid: i for i, uid in enumerate(user_list)}
    inf_map = {iid: i for i, iid in enumerate(inf_ids)}

    u_indices = [user_map[l.user_id] for l in logs if l.influencer_id in inf_map]
    i_indices = [inf_map[l.influencer_id] for l in logs if l.influencer_id in inf_map]
    rewards = [l.reward for l in logs if l.influencer_id in inf_map]

    if not u_indices:
        return
    interaction_matrix = coo_matrix(
        (rewards, (u_indices, i_indices)),
        shape=(len(user_list), len(inf_ids))
    )

    # 2. 모델 학습
    new_model = LightFM(loss="warp")
    new_model.fit(interaction_matrix, epochs=10)
    
    # 3. 전역 변수 교체 (Atomic하게 교체됨)
    LATEST_LFM_MODEL = new_model
    LATEST_USER_MAP = user_map
    LATEST_INF_MAP = inf_map


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
        #현재 Bandit의 학습 상태(Alpha, Beta)를 로드합니다.
        stats = self.db.query(BanditStatus).order_by(BanditStatus.action_idx).all()
        
        if not stats: # 데이터 없을 때
            alphas = np.ones(self.n_actions)
            betas = np.ones(self.n_actions)
            for i in range(self.n_actions):
                self.db.add(BanditStatus(action_idx=i, alpha=1.0, beta=1.0))
            self.db.commit()
            return alphas, betas
    
        # 3. DB에 저장된 값 리턴
        alphas = np.array([s.alpha for s in stats])
        betas = np.array([s.beta for s in stats])
        return alphas, betas

    def select_action(self):
        """Thompson Sampling을 통해 최적의 가중치 조합 선택"""
        samples = [np.random.beta(self.alphas[i], self.betas[i]) for i in range(self.n_actions)]
        action_idx = np.argmax(samples)
        return self.actions[action_idx], action_idx

    def update(self, action_idx, reward):
        status = self.db.query(BanditStatus).filter(BanditStatus.action_idx == action_idx).first()
        if status:
            if reward > 0:
                status.alphas[action_idx] += reward
            else:
                status.betas[action_idx] += abs(reward)
            self.db.commit()

# --- 2. 추천 엔진 클래스 (메인 로직 담당) ---
class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

        # SentenceTransformer는 한 번만 로딩
        global GLOBAL_MODEL
        if GLOBAL_MODEL is None:
            GLOBAL_MODEL = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.model = GLOBAL_MODEL

        # LightFM도 한 번만 생성
        global GLOBAL_LFM_MODEL
        if GLOBAL_LFM_MODEL is None:
            GLOBAL_LFM_MODEL = LightFM(loss="warp")
        self.lfm_model = GLOBAL_LFM_MODEL

        self.bandit = ReRankingBandit(db)

        self.inf_ids = []
        self.inf_grades = {}
        self.faiss_index = None
        self.user_map = {}

        self._load_resources()

    def recommend(self, user_id: int, query_text: str, top_k=5):
        """최종 추천 수행"""
        if not self.faiss_index:
            return []

        # [STEP 1] 벡터 유사도 기반 검색
        query_vec = self.model.encode([query_text], normalize_embeddings=True).astype('float32')
        sql = """
            SELECT 
                e.influencer_id, 
                1 - VECTOR_DISTANCE(e.embedding_vector, :q_vec, 'COSINE') AS similarity,
                i.grade_score
            FROM influencer_embedding e
            JOIN influencer i ON e.influencer_id = i.influencer_id
            WHERE i.is_active = TRUE
            ORDER BY similarity DESC
            LIMIT :limit
        """
        results = self.db.execute(text(sql), {"q_vec": str(query_vec), "limit": top_k * 10}).fetchall()

        # [STEP 2] Bandit 가중치 선택
        (w_faiss, w_lfm, w_grade), action_idx = self.bandit.select_action()

        # [STEP 3] 점수 결합 (Hybrid Scoring)
        candidate_inf_ids = [row.influencer_id for row in results]
        query_similarity_map = {row.influencer_id: float(row.similarity) for row in results}
        query_grade_map = {row.influencer_id: (float(row.grade_score) / 5.0 if row.grade_score else 0.2) for row in results}

        # LightFM 개인화 점수 계산
        global LATEST_LFM_MODEL, LATEST_USER_MAP
        if LATEST_LFM_MODEL and LATEST_USER_MAP and user_id in LATEST_USER_MAP:
            u_idx = LATEST_USER_MAP[user_id]
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
                "score": float(final_score),

                "action_idx": action_idx # 추천 실행 시 어떤 가중치가 쓰였는지 함께 리턴
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]