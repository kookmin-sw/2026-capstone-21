from __future__ import annotations

import os
import numpy as np
import traceback

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
    print("--- [DEBUG] LFM 모델 업데이트 시작 ---", flush=True)
    
    try:
        # 사용자 액션 로그 기반 LightFM 학습
        # 1. 로그 데이터 가져오기
        logs = db.query(UserActionLog).all()
        active_infs = db.query(Influencer.influencer_id).filter(Influencer.is_active == True).all()
        inf_ids = [row.influencer_id for row in active_infs]

        if not logs or not inf_ids:
            print(f"--- [DEBUG] 학습 데이터 부족: logs({len(logs)}), infs({len(inf_ids)})", flush=True)
            return

        user_list = list(set(l.user_id for l in logs))
        user_map = {uid: i for i, uid in enumerate(user_list)}
        inf_map = {iid: i for i, iid in enumerate(inf_ids)}

        u_indices = [user_map[l.user_id] for l in logs if l.influencer_id in inf_map]
        i_indices = [inf_map[l.influencer_id] for l in logs if l.influencer_id in inf_map]
        rewards = [l.reward for l in logs if l.influencer_id in inf_map]

        if not u_indices:
            print("--- [DEBUG] 유효한 Interaction 데이터가 없습니다.", flush=True)
            return

        interaction_matrix = coo_matrix(
            (rewards, (u_indices, i_indices)),
            shape=(len(user_list), len(inf_ids))
        )

        # 2. 모델 학습
        new_model = LightFM(loss="warp", no_components=30)
        new_model.fit(interaction_matrix, epochs=10)
        
        # 3. 전역 변수 교체 (Atomic하게 교체됨)
        LATEST_LFM_MODEL = new_model
        LATEST_USER_MAP = user_map
        LATEST_INF_MAP = inf_map
    
    except Exception as e: 
        print(f"--- [DEBUG] LFM 업데이트 중 에러: {e}", flush=True)
        traceback.print_exc()


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
        try:
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
        except Exception as e:
            print(f"--- [DEBUG] Bandit 로드 실패: {e}", flush=True)
            return np.ones(self.n_actions), np.ones(self.n_actions)

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
            local_model_path = "./model_cache"

            if os.path.exists(local_model_path):
                print(f"--- [DEBUG] Local 모델 사용: {local_model_path}", flush=True)
                model_name = "BAAI/bge-m3"
                GLOBAL_MODEL = SentenceTransformer(model_name, cache_folder="./model_cache")
            else:
                print(f"--- [DEBUG] Local 모델 없음. 다운로드 시도: {settings.EMBEDDING_MODEL}", flush=True)
                GLOBAL_MODEL = SentenceTransformer(settings.EMBEDDING_MODEL)

            print("--- [DEBUG] SentenceTransformer 로딩 완료", flush=True)
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
        print(f"--- [DEBUG] recommend() 시작: user={user_id}, query='{query_text}'", flush=True)

        # 유저의 쇼핑몰 분위기 설명을 쿼리에 합침
        from app.db.models import User
        user = self.db.query(User).filter(User.user_id == user_id).first()
        if user and user.mall_description:
            query_text = f"{query_text} [쇼핑몰 분위기: {user.mall_description}]"
            print(f"--- [DEBUG] mall_description 반영: {user.mall_description[:50]}...", flush=True)

        # [STEP 1] 사용자 입력 문장 임베딩
        try:
            query_vec = (
                self.model.encode([query_text], normalize_embeddings=True)
                .astype("float32")[0]
                .tolist()
            )
            print(f"--- [DEBUG] 임베딩 완료 (dim: {len(query_vec)})", flush=True)
        except Exception as e:
            print(f"--- [DEBUG] 임베딩 생성 실패: {e}", flush=True)
            return []

        # [STEP 2] pgvector 기반 코사인 유사도 검색 (PostgreSQL 문법으로 수정)
        # pgvector의 <=> 연산자는 코사인 거리를 의미하므로, 1에서 빼주면 유사도가 됩니다.
        sql = text("""
                SELECT 
                    e.influencer_id, 
                    1 - (e.embedding_vector <=> CAST(:q_vec AS vector)) AS similarity,
                    i.grade_score
                FROM influencer_embedding e
                JOIN influencer i ON e.influencer_id = i.influencer_id
                WHERE i.is_active = TRUE
                ORDER BY similarity DESC
                LIMIT :limit
            """)


        print(f"DEBUG: query_vec len = {len(query_vec)}") # 1024여야 함

        try:
            rows = self.db.execute(
                sql,
                {
                    "q_vec": np.array(query_vec, dtype=np.float32).tolist(),
                    "limit": top_k * 10
                }
            ).fetchall()
            print(f"--- [DEBUG] SQL 검색 성공: {len(rows)}개 후보군 확보", flush=True)

        except Exception as e:
            print(f"--- [DEBUG] SQL 실행 에러 (pgvector): {e}", flush=True)
            traceback.print_exc()
            return []

        if not rows:
            print("--- [DEBUG] 검색된 후보군이 없습니다.", flush=True)
            return []

        # [STEP 3] Bandit 가중치 선택
        try:
            (w_vector, w_lfm, w_grade), action_idx = self.bandit.select_action()
            print(f"--- [DEBUG] Bandit 가중치 적용: {action_idx}", flush=True)
        except Exception as e:
            print(f"--- [DEBUG] Bandit 선택 에러, 기본값 적용: {e}", flush=True)
            w_vector, w_lfm, w_grade, action_idx = 0.5, 0.3, 0.2, 0

        # [STEP 4] LightFM 개인화 점수 계산
        global LATEST_LFM_MODEL, LATEST_USER_MAP, LATEST_INF_MAP
        lfm_score_map = {}
        
        # LFM 모델 로딩 상태 확인용 디버깅
        if not LATEST_LFM_MODEL:
            print("--- [DEBUG] LFM 모델이 로드되지 않았습니다. 개인화 점수 제외.", flush=True)
        elif user_id not in LATEST_USER_MAP:
            print(f"--- [DEBUG] 사용자 {user_id}의 활동 기록이 모델에 없습니다. 개인화 점수 제외.", flush=True)

        if (LATEST_LFM_MODEL and LATEST_USER_MAP and LATEST_INF_MAP and user_id in LATEST_USER_MAP):
            try:
                u_idx = LATEST_USER_MAP[user_id]
                candidate_inf_ids = [row.influencer_id for row in rows]
                valid_candidate_ids = [iid for iid in candidate_inf_ids if iid in LATEST_INF_MAP]

                if valid_candidate_ids:
                    inf_matrix_indices = np.array([LATEST_INF_MAP[iid] for iid in valid_candidate_ids])
                    raw_scores = LATEST_LFM_MODEL.predict(u_idx, inf_matrix_indices)
                    lfm_score_map = {iid: float(score) for iid, score in zip(valid_candidate_ids, expit(raw_scores))}
                    print(f"--- [DEBUG] LFM 개인화 점수 적용 완료 ({len(lfm_score_map)}개)", flush=True)
            except Exception as e:
                print(f"--- [DEBUG] LFM 점수 계산 에러: {e}", flush=True)

        # [STEP 5] Hybrid Scoring
        results = []
        for row in rows:
            inf_id = row.influencer_id
            similarity_score = float(row.similarity or 0.0)
            personalization_score = lfm_score_map.get(inf_id, 0.5)
            grade_score = (float(row.grade_score) / 5.0) if row.grade_score else 0.2

            final_score = (similarity_score * w_vector + personalization_score * w_lfm + grade_score * w_grade)

            results.append({
                "influencer_id": inf_id,
                "similarity_score": similarity_score,
                "personalization_score": personalization_score,
                "grade_score": grade_score,
                "final_score": final_score,
                "score": final_score,
                "action_idx": action_idx
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        print(f"--- [DEBUG] 최종 추천 목록 {len(results[:top_k])}개 생성 완료", flush=True)
        return results[:top_k]