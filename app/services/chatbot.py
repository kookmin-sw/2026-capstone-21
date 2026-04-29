import os
import requests
import openai
from sqlalchemy.orm import Session
from app.db.models import ChatwootLog, Influencer
from app.services.recommendation import RecommendationEngine

# 설정 정보
CHATWOOT_BASE_URL = "https://app.chatwoot.com/api/v1/accounts/3"
CHATWOOT_ACCESS_TOKEN = "SeMTEDcy24cnh6GzsmxMMNCL"

class ChatbotService:
    def __init__(self, db: Session):
        self.db = db
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.headers = {"api_access_token": "Bearer SeMTEDcy24cnh6GzsmxMMNCL"}

    def _get_chatwoot_help_center_articles(self):
        """Chatwoot의 Help Center 아티클들을 가져와 지식 베이스로 활용"""
        # 실제 Chatwoot API 엔드포인트 (아티클 리스트 조회)
        url = f"{CHATWOOT_BASE_URL}/articles"
        try:
            res = requests.get(url, headers=self.headers)
            if res.status_code == 200:
                articles = res.json().get('payload', [])
                # 아티클들의 제목과 내용을 텍스트로 합침
                return "\n".join([f"제목: {a['title']}\n내용: {a['content']}" for a in articles])
        except Exception as e:
            print(f"⚠️ 지식 베이스 로드 실패: {e}")
        return "이용 안내 문서가 비어있습니다."

    def process_and_reply(self, conversation_id: int, question_content: str, question_type: str, user_id: int = 1):
        context_data = ""
        system_role = "당신은 쇼핑몰 브랜드와 인플루언서를 매칭해주는 서비스 '링크디매치'의 전문 상담원입니다."

        # --- [CASE 1] 인플루언서 추천/분석 관련 질문 ---
        if question_type == "인플루언서 추천":
            engine = RecommendationEngine(self.db)
            recs = engine.recommend(user_id=user_id, query_text=question_content, top_k=3)
            
            if recs:
                context_data = "\n[추천된 인플루언서 정보]\n"
                for r in recs:
                    inf = self.db.query(Influencer).filter(Influencer.influencer_id == r['influencer_id']).first()
                    context_data += (f"- ID: {inf.username}, 등급: {inf.grade_score}, "
                                    f"주요스타일: {inf.style_keywords_text}, "
                                    f"AI 매칭 점수: {r['score']:.2f}\n")
                
                system_role += ("\n제공된 추천 데이터를 바탕으로 사용자에게 최적의 인플루언서를 제안하세요. "
                               "단순히 리스트만 주지 말고, 왜 이 브랜드 무드에 적합한지 'AI 매칭 점수'와 '스타일 키워드'를 인용하여 "
                               "자연스럽게 설명해주세요. 추천 이유를 묻는다면 데이터에 기반해 논리적으로 답하세요.")

        # --- [CASE 2] 사이트 이용 관련 질문 (RAG 유사 방식) ---
        elif question_type == "사이트 이용 관련":
            help_docs = self._get_chatwoot_help_center_articles()
            context_data = f"\n[서비스 이용 안내 문서]\n{help_docs}"
            system_role += ("\n제공된 이용 안내 문서를 바탕으로 사용자의 질문에 정확하게 답변하세요. "
                           "문서에 없는 내용은 함부로 추측하지 말고 상담원 연결을 제안하세요.")

        # --- GPT API 호출 ---
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_role},
                {"role": "user", "content": f"질문: {question_content}\n\n참고 데이터: {context_data}"}
            ]
        )
        ai_answer = response.choices[0].message.content

        # 결과 발송 및 로그 기록
        self._send_to_chatwoot(conversation_id, ai_answer)
        self._update_log(conversation_id, ai_answer)

    def _send_to_chatwoot(self, conversation_id: int, content: str):
        url = f"{CHATWOOT_BASE_URL}/conversations/{conversation_id}/messages"
        payload = {"content": content, "message_type": "outgoing", "private": False}
        res = requests.post(url, json=payload, headers=self.headers)
        print(f"DEBUG: Status Code: {res.status_code}")
        print(f"DEBUG: Response Body: {res.text}") # 401 에러의 구체적 이유가 적혀있을 수 있습니다.
        res.raise_for_status()

    def _update_log(self, conversation_id: int, answer: str):
        log = self.db.query(ChatwootLog).filter(ChatwootLog.conversation_id == conversation_id).order_by(ChatwootLog.id.desc()).first()
        if log:
            log.answer_content = answer
            self.db.commit()