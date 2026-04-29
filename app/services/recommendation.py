import numpy as np
from sqlalchemy.orm import Session
from scipy.special import expit
from scipy.sparse import coo_matrix
from lightfm import LightFM
import faiss
from sentence_transformers import SentenceTransformer

from app.db.models import Influencer, InfluencerEmbedding, UserActionLog, InfluencerCategory
from app.crud.user_action_log import ACTION_REWARD_MAP

class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db
        self.model = SentenceTransformer("BAAI/bge-m3")
        self.lfm_model = LightFM(loss='warp')
        self.bandit_actions = [
            (0.5, 0.3, 0.2), (0.4, 0.4, 0.2), (0.3, 0.3, 0.4), (0.6, 0.2, 0.2)
        ]
        self._load_resources()

    def _load_resources(self):
        """DB에서 데이터를 로드하여 FAISS 인덱스 및 LightFM 준비"""
        # 1. FAISS 인덱스 구축
        embeddings = self.db.query(
                InfluencerEmbedding.influencer_id, 
                InfluencerEmbedding.embedding_vector,
                Influencer.grade
            ).join(Influencer, Influencer.id == InfluencerEmbedding.influencer_id).all()
        if embeddings:
            vectors = np.array([e.embedding_vector for e in embeddings]).astype('float32')
            self.dim = vectors.shape[1]
            self.faiss_index = faiss.IndexFlatIP(self.dim)
            self.faiss_index.add(vectors)

            self.inf_ids = [e.influencer_id for e in embeddings]

            self.inf_grades = {r.influencer_id: (r.grade / 5.0) for r in results}
        
        # 2. LightFM 학습 (로그 기반)
        self._train_lfm()

    def _train_lfm(self):
        """UserActionLog 테이블을 읽어 LightFM 학습"""
        logs = self.db.query(UserActionLog).all()
        if not logs:
            return

        user_map = {uid: i for i, uid in enumerate(set(l.user_id for l in logs))}
        # 인덱스 맵핑 (DB ID -> Matrix Index)
        inf_map = {iid: i for i, iid in enumerate(self.inf_ids)}
        
        u_indices = [user_map[l.user_id] for l in logs if l.influencer_id in inf_map]
        i_indices = [inf_map[l.influencer_id] for l in logs if l.influencer_id in inf_map]
        rewards = [l.reward for l in logs if l.influencer_id in inf_map]

        if u_indices:
            interaction_matrix = coo_matrix(
                (rewards, (u_indices, i_indices)), 
                shape=(max(user_map.values()) + 1, len(self.inf_ids))
            )
            self.lfm_model.fit(interaction_matrix, epochs=10)
            self.user_map = user_map

    def get_bandit_weights(self):
        """로그 기반으로 성공률(Alpha/Beta)을 계산하여 Thompson Sampling 실행"""
        n_actions = len(self.bandit_actions)
        alphas = np.ones(n_actions)
        betas = np.ones(n_actions)

        # DB 로그에서 Bandit 성능 추출 (여기서는 단순 예시로 전체 reward 합산)
        # 실제 운영시에는 action_idx도 로그에 기록하는 것이 좋습니다.
        samples = [np.random.beta(alphas[i], betas[i]) for i in range(n_actions)]
        best_idx = np.argmax(samples)
        return self.bandit_actions[best_idx], best_idx

    def recommend(self, user_id: int, query_text: str, top_k=5):
        # [STEP 1] FAISS Retrieval
        query_vec = self.model.encode([query_text], normalize_embeddings=True).astype('float32')
        faiss_scores, faiss_indices = self.faiss_index.search(query_vec, 100)

        # [STEP 2] Bandit Weights
        (w_faiss, w_lfm, w_grade), action_idx = self.get_bandit_weights()

        # [STEP 3] LightFM Re-ranking
        candidate_inf_ids = [self.inf_ids[idx] for idx in faiss_indices[0]]
        
        # 신규 유저나 로그 없는 유저는 LFM 점수를 0.5(중립)로 세팅
        if hasattr(self, 'user_map') and user_id in self.user_map:
            u_idx = self.user_map[user_id]
            # Matrix 내의 아이템 인덱스로 변환 필요
            inf_matrix_indices = [self.inf_ids.index(iid) for iid in candidate_inf_ids]
            lfm_preds = self.lfm_model.predict(u_idx, np.array(inf_matrix_indices))
            lfm_scores = expit(lfm_preds)
        else:
            lfm_scores = np.full(len(candidate_inf_ids), 0.5)

        # [STEP 4] 결합
        results = []
        for i, inf_id in enumerate(candidate_inf_ids):
            f_score = faiss_scores[0][i]
            l_score = lfm_scores[i]
            g_score = self.inf_grades.get(inf_id, 0.2)

            combined_score = (f_score * w_faiss) + (l_score * w_lfm) + (g_score * w_grade)
            
            results.append({
                "influencer_id": inf_id,
                "score": float(combined_score),
                "grade": g_score * 5,
                "action_idx": action_idx
            })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]




class ReRankingBandit:
    def __init__(self, db: Session):
        # 가능한 가중치 조합 (FAISS 비중, LightFM 비중)
        self.db = db
        self.actions = [
            (0.8, 0.2), (0.6, 0.4), (0.5, 0.5), (0.4, 0.6), (0.2, 0.8)
        ]
        self.n_actions = len(self.actions)
    
    def get_current_states(self):
        """
        DB의 추천 결과(RecommendationResult)와 로그(UserActionLog)를 조인해서
        어떤 가중치(Action)가 실제로 피드백을 많이 받았는지 계산합니다.
        """

        # Thompson Sampling을 위한 Beta 분포 파라미터 (Alpha, Beta)
        # 초기값을 1이 아닌 더 작은 값으로 설정하거나 1로 두어 균등 분포에서 시작
        alphas = np.ones(n_actions) 
        betas = np.ones(n_actions)
        return alphas, betas

    def get_weights(self, exploration_factor=1.5):
        """
        exploration_factor: 1보다 크면 초기 탐색을 더 강하게 유도
        """
        samples = [np.random.beta(self.alphas[i], self.betas[i]) for i in range(len(self.actions))]
        best_idx = np.argmax(samples)
        return self.actions[best_idx], best_idx

    def update(self, action_idx, reward_value):
        """
        누적된 보상 점수를 바탕으로 분포 업데이트
        reward_value: +1 ~ +4 (긍정), -2 (부정)
        """
        if reward_value > 0:
            # 보상 점수만큼 성공(Alpha) 횟수 가중치 증가
            self.alphas[action_idx] += reward_value
        else:
            # 부정적 피드백 시 실패(Beta) 횟수 증가
            self.betas[action_idx] += abs(reward_value)

