import os
import requests
import openai 
from app.db.database import SessionLocal
from app.db.models import ChatwootLog, Influencer
from app.services.recommendation import RecommendationEngine

# 설정 정보
CHATWOOT_BASE_URL = os.getenv("CHATWOOT_BASE_URL")
API_ACCESS_TOKEN = os.getenv("API_ACCESS_TOKEN")

class ChatbotService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.headers = {"api_access_token": API_ACCESS_TOKEN}

    def _get_chatwoot_help_center_articles(self):
        """Chatwoot의 Help Center 아티클들을 가져와 지식 베이스로 활용"""
        url = f"{CHATWOOT_BASE_URL}/articles"
        try:
            res = requests.get(url, headers=self.headers)
            if res.status_code == 200:
                articles = res.json().get('payload', [])
                if not articles:
                    return None
                # 아티클들의 제목과 내용을 텍스트로 합침
                answer = "\n".join([f"제목: {a['title']}\n내용: {a['content']}" for a in articles])
                print(f"✅ {len(articles)}개의 아티클: {answer}")
                return answer
        except Exception as e:
            print(f"⚠️ 지식 베이스 로드 실패: {e}")
        return None

    def process_and_reply(self, conversation_id: int, question_content: str, question_type: str, user_id: int = 1):
        with SessionLocal() as db:
            self.db = db
            context_data = ""
            
            # 1. 환각 방지를 위한 매우 엄격한 시스템 프롬프트 설정
            system_role = (
                "당신은 쇼핑몰 브랜드와 인플루언서를 매칭해주는 서비스 '링크디매치'의 전문 상담원입니다.\n"
                "가장 중요한 규칙: 반드시 제공된 [참고 데이터] 내의 정보만을 사용하여 답변하세요.\n"
                "만약 질문에 대한 답이 데이터에 없다면, 절대 지어내지 마세요. "
                "대신 반드시 다음과 같이 답변하세요: '죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다. "
                "추가적인 도움이 필요하시면 상담원 연결을 요청해 주세요.'"
            )

            # --- [CASE 1] 인플루언서 추천/분석 관련 질문 ---
            if question_type == "인플루언서 추천":
                engine = RecommendationEngine(db)
                recs = engine.recommend(user_id=user_id, query_text=question_content, top_k=3)
                
                if recs:
                    context_data = "\n[추천된 인플루언서 정보]\n"
                    for r in recs:
                        inf = db.query(Influencer).filter(Influencer.influencer_id == r['influencer_id']).first()
                        if inf:
                            context_data += (f"- ID: {inf.username}, 등급: {inf.grade_score}, "
                                            f"주요스타일: {inf.style_keywords_text}, "
                                            f"AI 매칭 점수: {r['score']:.2f}\n")
                    
                    system_role += (
                        "\n제공된 추천 데이터를 바탕으로 사용자에게 최적의 인플루언서를 제안하세요. "
                        "왜 이 브랜드 무드에 적합한지 'AI 매칭 점수'와 '스타일 키워드'를 인용하여 논리적으로 설명하세요."
                    )
                else:
                    self._complete_process(conversation_id, "현재 조건에 맞는 인플루언서 추천 결과가 없습니다. 조금 더 구체적인 스타일을 입력해 주시겠어요?")
                    return

            # --- [CASE 2] 사이트 이용 관련 질문 (RAG 방식) ---
            elif question_type == "사이트 이용 관련":
                help_docs = self._get_chatwoot_help_center_articles()
                
                # 문서가 없으면 GPT 호출 없이 즉시 답변 (환각 원천 차단)
                if not help_docs:
                    self._complete_process(conversation_id, "죄송합니다. 현재 이용 안내 문서를 불러올 수 없습니다. 상담원 연결을 통해 도와드리겠습니다.")
                    return

                context_data = f"\n[서비스 이용 안내 문서]\n{help_docs}"
                system_role += "\n제공된 이용 안내 문서 외의 외부 지식은 절대 사용하지 마세요."

            # --- GPT API 호출 (검증된 설정 적용) ---
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_role},
                        {"role": "user", "content": f"질문: {question_content}\n\n참고 데이터: {context_data}"}
                    ],
                    temperature=0.0,  # 사실 기반 답변을 위한 설정
                    max_tokens=800
                )
                ai_answer = response.choices[0].message.content
            except Exception as e:
                print(f"❌ GPT API 호출 실패: {e}")
                ai_answer = "시스템 오류로 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."

            self._complete_process(conversation_id, ai_answer)

    def _complete_process(self, conversation_id: int, ai_answer: str):
        """결과 발송 및 로그 기록 공통 로직"""
        self._send_to_chatwoot(conversation_id, ai_answer)
        self._update_log(conversation_id, ai_answer)

    def _send_to_chatwoot(self, conversation_id: int, content: str):
        url = f"{CHATWOOT_BASE_URL}/conversations/{conversation_id}/messages"
        payload = {"content": content, "message_type": "outgoing", "private": False}
        try:
            res = requests.post(url, json=payload, headers=self.headers)
            res.raise_for_status()
        except Exception as e:
            print(f"❌ Chatwoot 메시지 전송 실패: {e}")

    def _update_log(self, conversation_id: int, answer: str):
        log = self.db.query(ChatwootLog).filter(ChatwootLog.conversation_id == conversation_id).order_by(ChatwootLog.id.desc()).first()
        if log:
            log.answer_content = answer
            self.db.commit()
