from __future__ import annotations

from typing import List, Dict
import json
import numpy as np

from sqlalchemy import text
from sqlalchemy.orm import Session
from scipy.special import expit
from scipy.sparse import coo_matrix
from lightfm import LightFM
from sentence_transformers import SentenceTransformer

from app.db.models import Influencer, UserActionLog, BanditStatus
from app.utils.setting_config import settings

# 파일 상단 import 아래에 추가
GLOBAL_MODEL = None
LATEST_LFM_MODEL = None
LATEST_USER_MAP = None
LATEST_INF_MAP = None

def update_global_lfm_model(db: Session):
    # 이 함수를 10분마다 혹은 특정 주기로 실행
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
        # 가능한 가중치 조합 (Vector Similarity 비중, LightFM 비중, Grade 비중)
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
        action_idx = int(np.argmax(samples))
        return self.actions[action_idx], action_idx

    def update(self, action_idx, reward):
        status = self.db.query(BanditStatus).filter(BanditStatus.action_idx == action_idx).first()
        if status:
            if reward > 0:
                status.alpha += reward
            else:
                status.beta += abs(reward)
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

        # 기존 GLOBAL_LFM_MODEL / self.lfm_model 제거
        # LightFM 자체를 제거한 것이 아니라,
        # update_global_lfm_model()에서 학습된 LATEST_LFM_MODEL을 recommend()에서 직접 사용함
        self.bandit = ReRankingBandit(db)

        # self.inf_ids, self.inf_grades, self.faiss_index, self.user_map 제거
        # 기존 _load_resources()는 FAISS 인덱스/캐시 로딩 용도로 보이므로
        # MySQL VECTOR_DISTANCE 방식에서는 사용하지 않음

    def recommend(self, user_id: int, query_text: str, top_k=5):
        """최종 추천 수행"""

        # [STEP 1] 사용자 입력 문장 임베딩
        query_vec = (
            self.model.encode([query_text], normalize_embeddings=True)
            .astype("float32")[0]
            .tolist()
        )

        # MySQL / MariaDB VECTOR_DISTANCE에 넘기기 위해
        # numpy array가 아니라 JSON 배열 문자열로 변환
        query_vec_str = json.dumps(query_vec)

        # [STEP 2] 벡터 유사도 기반 검색
        sql = text("""
            SELECT 
                e.influencer_id, 
                1 - VECTOR_DISTANCE(e.embedding_vector, :q_vec, 'COSINE') AS similarity,
                i.grade_score
            FROM influencer_embedding e
            JOIN influencer i ON e.influencer_id = i.influencer_id
            WHERE i.is_active = TRUE
            ORDER BY similarity DESC
            LIMIT :limit
        """)

        rows = self.db.execute(
            sql,
            {
                "q_vec": query_vec_str,
                "limit": top_k * 10
            }
        ).fetchall()

        if not rows:
            return []

        # [STEP 3] Bandit 가중치 선택
        (w_vector, w_lfm, w_grade), action_idx = self.bandit.select_action()

        # [STEP 4] 점수 결합을 위한 후보 정보 정리
        candidate_inf_ids = [row.influencer_id for row in rows]

        query_similarity_map = {row.influencer_id: float(row.similarity or 0.0) for row in rows}
        query_grade_map = {row.influencer_id: (float(row.grade_score) / 5.0 if row.grade_score is not None else 0.2) for row in rows}

        # LightFM 개인화 점수 계산
        global LATEST_LFM_MODEL, LATEST_USER_MAP, LATEST_INF_MAP
        
        if (
            LATEST_LFM_MODEL is not None
            and LATEST_USER_MAP is not None
            and LATEST_INF_MAP is not None
            and user_id in LATEST_USER_MAP
        ):
            u_idx = LATEST_USER_MAP[user_id]

            # 기존 self.inf_ids.index(iid) 대신
            # LightFM 학습 시 생성한 LATEST_INF_MAP 사용
            valid_candidate_ids = [
                iid for iid in candidate_inf_ids
                if iid in LATEST_INF_MAP
            ]

            if valid_candidate_ids:
                inf_matrix_indices = np.array([
                    LATEST_INF_MAP[iid]
                    for iid in valid_candidate_ids
                ])

                raw_scores = LATEST_LFM_MODEL.predict(
                    u_idx,
                    inf_matrix_indices
                )

                lfm_score_map = {
                    iid: float(score)
                    for iid, score in zip(
                        valid_candidate_ids,
                        expit(raw_scores)
                    )
                }
            else:
                lfm_score_map = {}
        else:
            # 기존처럼 LightFM 모델/사용자 정보가 없으면 기본값 0.5 사용
            lfm_score_map = {}

        # [STEP 6] Hybrid Scoring
        results: List[Dict] = []

        for inf_id in candidate_inf_ids:
            # 기존 faiss_scores[0][i] 대신 VECTOR_DISTANCE 결과 similarity 사용
            similarity_score = query_similarity_map.get(inf_id, 0.0)

            personalization_score = lfm_score_map.get(inf_id, 0.5)
            grade_score = query_grade_map.get(inf_id, 0.2)

            final_score = (
                similarity_score * w_vector +
                personalization_score * w_lfm +
                grade_score * w_grade
            )

            results.append({
                "influencer_id": inf_id,
                "similarity_score": float(similarity_score),
                "personalization_score": float(personalization_score),
                "grade_score": float(grade_score),
                "final_score": float(final_score),
                "score": float(final_score),

                # 추천 실행 시 어떤 가중치가 쓰였는지 함께 리턴
                "action_idx": action_idx
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]