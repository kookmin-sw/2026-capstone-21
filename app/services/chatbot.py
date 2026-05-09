from __future__ import annotations
from typing import Optional, Union, List, Dict
import requests
import openai  
from app.db.database import SessionLocal
from app.db.models import ChatwootLog, Influencer
from app.services.recommendation import RecommendationEngine
from app.utils.setting_config import settings

# 설정 정보
DEFAULT_QUESTION_TYPE = "일반"
END_CONVERSATION_TEXT = "대화 종료"
QUESTION_TYPE_SELECTION_MESSAGE = (
    "대화가 종료되었습니다.\n\n"
    "새로운 질문을 시작하려면 질문 유형을 다시 선택해 주세요.\n"
    "- 인플루언서 추천\n"
    "- 사이트 이용 관련"
)

class ChatbotService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.headers = {"api_access_token": settings.API_ACCESS_TOKEN}

    def _get_chatwoot_help_center_articles(self):
        """Chatwoot의 Help Center 아티클들을 가져와 지식 베이스로 활용"""
        urls = []
        if settings.CHATWOOT_HELP_CENTER_ARTICLES_URL:
            urls.append(settings.CHATWOOT_HELP_CENTER_ARTICLES_URL)
        if settings.CHATWOOT_BASE_URL and settings.CHATWOOT_PORTAL_ID:
            urls.append(f"{settings.CHATWOOT_BASE_URL}/portals/{settings.CHATWOOT_PORTAL_ID}/articles")
        if settings.CHATWOOT_BASE_URL:
            urls.append(f"{settings.CHATWOOT_BASE_URL}/articles")

        try:
            for url in urls:
                res = requests.get(url, headers=self.headers, timeout=5)
                if res.status_code != 200:
                    print(f"⚠️ Help Center 문서 로드 실패: {res.status_code} {url}")
                    continue

                articles = self._extract_articles_from_response(res.json())
                if articles:
                    return articles
        except Exception as e:
            print(f"⚠️ 지식 베이스 로드 실패: {e}")
        return self._fallback_help_center_articles()

    def _extract_articles_from_response(self, data):
        if isinstance(data, list):
            return data

        if not isinstance(data, dict):
            return []

        payload = data.get("payload", data)
        if isinstance(payload, list):
            return payload

        if isinstance(payload, dict):
            for key in ("articles", "items", "data"):
                articles = payload.get(key)
                if isinstance(articles, list):
                    return articles

        return []

    def _fallback_help_center_articles(self) -> list[dict]:
        return [
            {
                "title": "회원가입 및 로그인 안내",
                "content": (
                    "로그인은 화면의 로그인 창에서 가입한 이메일과 비밀번호를 입력해 진행합니다. "
                    "계정이 없다면 회원가입을 먼저 완료한 뒤 로그인할 수 있습니다. "
                    "로그인이 되지 않으면 이메일 주소와 비밀번호 입력값을 다시 확인하고, "
                    "이미 가입된 계정인지 확인해 주세요."
                ),
            },
            {
                "title": "My Picks의 기능 안내",
                "content": (
                    "My Picks는 관심 있는 인플루언서를 저장해 두는 목록입니다. "
                    "인플루언서 카드나 상세 화면에서 별표 또는 찜 기능을 사용하면 My Picks에 저장됩니다. "
                    "저장한 인플루언서는 My Picks 화면에서 다시 확인할 수 있고, 메모를 남겨 관리할 수 있습니다."
                ),
            },
            {
                "title": "인플루언서 추천 기능 안내",
                "content": (
                    "인플루언서 추천 기능은 쇼핑몰이나 브랜드의 분위기, 카테고리, 원하는 스타일을 바탕으로 "
                    "적합한 인플루언서를 찾아주는 기능입니다. 추천받기 검색창에 원하는 조건을 자연어로 입력하면 "
                    "AI 매칭 점수와 스타일 키워드를 참고해 추천 결과를 제공합니다."
                ),
            },
            {
                "title": "Find Influencers의 기능 안내",
                "content": (
                    "Find Influencers는 등록된 인플루언서 목록을 탐색하는 화면입니다. "
                    "검색창과 필터를 사용해 이름, 카테고리, 스타일 키워드 등으로 인플루언서를 찾을 수 있습니다. "
                    "인플루언서 카드에서는 프로필, 팔로워 수, 게시물 수, Grade Score, 스타일 정보를 확인할 수 있습니다."
                ),
            },
            {
                "title": "Data Insights의 기능 안내",
                "content": (
                    "Data Insights는 서비스 내 인플루언서와 사용자 선택 데이터를 시각적으로 확인하는 화면입니다. "
                    "전체 인플루언서 수, 협업 완료 수, 일자별 추이, 카테고리별 분포도 같은 지표를 확인할 수 있습니다. "
                    "Grade Score와 비교 지표를 통해 인플루언서 성과를 분석하는 데 활용합니다."
                ),
            },
        ]

    def _format_help_center_articles(self, articles: list[dict]) -> str:
        return "\n".join([f"제목: {a.get('title', '').strip()}\n내용: {a.get('content', '').strip()}" for a in articles])

    def _find_help_center_matches(self, question_content: str, articles: list[dict]) -> list[dict]:
        normalized_question = question_content.strip().lower()
        if not normalized_question:
            return []

        matches: list[dict] = []
        for article in articles:
            title = str(article.get('title', '')).lower()
            content = str(article.get('content', '')).lower()
            if self._is_help_doc_relevant(title) or self._is_help_doc_relevant(content):
                matches.append(article)

        return matches

    def _is_help_doc_relevant(self, target: str) -> bool:
        keywords = [
            "로그인",
            "회원가입",
            "비밀번호",
            "아이디",
            "접속",
            "가입",
            "필터",
            
            "별표",
            "찜",
            "my picks",
            "마이픽",
            "메모",
            "저장",
            "data insights",
            "grade score",
            "인플루언서 비교",
            "카테고리별 분포도",
            "인플루언서 카드",
            "find influencers"
        ]
        return any(keyword in target for keyword in keywords if keyword)

    def process_and_reply(self, conversation_id: int, question_content: str, question_type: str, user_id: int = 1):
        with SessionLocal() as db:
            self.db = db
            if not question_type or question_type == "일반":
                last_log = db.query(ChatwootLog).filter(
                    ChatwootLog.conversation_id == conversation_id,
                    ChatwootLog.question_type != "일반"
                ).order_by(ChatwootLog.id.desc()).first()
                
                if last_log:
                    question_type = last_log.question_type

            # 질문 내용에 따라 question_type 재분류 (이미 설정된 타입이라도)
            if self._is_influencer_recommendation_question(question_content):
                question_type = "인플루언서 추천"
            elif self._is_site_use_question(question_content):
                question_type = "사이트 이용 관련"
            elif question_type == "일반":
                # 일반 질문으로 유지
                pass

            # 1. 환각 방지를 위한 매우 엄격한 시스템 프롬프트 설정
            system_role = (
                "당신은 쇼핑몰 브랜드와 인플루언서를 매칭해주는 서비스 '링크디매치'의 전문 상담원입니다.\n"
                "가장 중요한 규칙: 반드시 제공된 [참고 데이터] 내의 정보만을 사용하여 답변하세요.\n"
                "참고 데이터에는 Chatwoot Help Center의 다음 제목의 문서가 포함됩니다: '회원가입 및 로그인 안내', 'My Picks의 기능 안내', '인플루언서 추천 기능 안내', 'Find Influencers의 기능 안내', 'Data Insights의 기능 안내'.\n"
                "질문에 답이 이 문서들에 있다면, 반드시 그 문서의 내용을 그대로 사용하여 구체적으로 답변하세요.\n"
                "문서에 없는 내용은 절대 사용하지 마세요. 답을 찾을 수 없으면 반드시 '죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다.'라고만 답하세요."
            )
            context_data=""

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
                    self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다.")
                    return

            # --- [CASE 2] 사이트 이용 관련 질문 (RAG 방식) ---
            elif question_type == "사이트 이용 관련":
                help_articles = self._get_chatwoot_help_center_articles()
                if not help_articles:
                    self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다.")
                    return

                relevant_articles = self._select_relevant_help_center_articles(question_content, help_articles)
                if not relevant_articles:
                    self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다.")
                    return

                context_data = f"\n[서비스 이용 안내 문서]\n{self._format_help_center_articles(relevant_articles)}"
                system_role += "\n제공된 이용 안내 문서 외의 외부 지식은 절대 사용하지 마세요."

            else:
                self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다.")
                return

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

    def _reset_conversation(self, conversation_id: int):
        """대화 종료 시 질문 유형을 초기 상태로 되돌리고 시작 안내를 보냄"""
        self._update_conversation_question_type(conversation_id, DEFAULT_QUESTION_TYPE)
        self._complete_process(conversation_id, QUESTION_TYPE_SELECTION_MESSAGE)
        self._resolve_conversation(conversation_id)

    def _is_site_use_question(self, question_content: str) -> bool:
        """일반 질문 중 사이트 이용 관련 키워드가 포함된 경우 자동으로 분류합니다."""
        if not question_content:
            return False
        normalized = question_content.strip().lower()
        keywords = [
            "로그인",
            "회원가입",
            "회원",
            "비밀번호",
            "아이디",
            "접속",
            "사이트 이용",
            "이용 방법",
            "사용 방법",
            "가입",
            "인증",
            "find influencers",
            "search influencers",
            "필터",
            "추천받기 검색창",
            "추천받기",
            "추천",
            "별표 기능",
            "별표",
            "찜",
            "my picks",
            "마이 픽",
            "마이픽",
            "마이픽스",
            "메모",
            "저장",
            "데이터 인사이트",
            "data insights",
            "grade score",
            "인플루언서 비교",
            "카테고리별 분포도",
            "추천받기 검색창",
            "인플루언서 카드",
            "인플루언서 메모",
        ]
        return any(keyword in normalized for keyword in keywords)

    def _is_influencer_recommendation_question(self, question_content: str) -> bool:
        """질문이 인플루언서 추천 관련인지 확인합니다."""
        if not question_content:
            return False
        normalized = question_content.strip().lower()
        keywords = [
            "인플루언서 추천",
            "추천해줘",
            "추천해주세요",
            "맞는 인플루언서",
            "어떤 인플루언서",
            "인플루언서 찾아줘",
            "인플루언서 추천해줘",
            "인플루언서 추천해주세요",
            "인플루언서 추천받기",
            "추천받기",
            "ai 추천",
            "ai 매칭",
            "맞춤 추천",
            "추천 방식",
            "추천 결과",
            "추천 목록",
            "인플루언서 리스트",
            "인플루언서 목록",
            "인플루언서 검색",
            "인플루언서 찾기",
            "인플루언서 분석",
            "인플루언서 등급",
            "grade score",
            "매칭 점수",
            "스타일 키워드",
        ]
        return any(keyword in normalized for keyword in keywords)

    def _select_relevant_help_center_articles(self, question_content: str, articles: list[dict]) -> list[dict]:
        normalized_question = question_content.strip().lower()
        if not normalized_question:
            return []

        mapped_titles = self._map_question_to_document_titles(normalized_question)
        if mapped_titles:
            matched_articles: list[dict] = []
            for article in articles:
                title = str(article.get('title', '')).lower()
                if any(mapped_title in title for mapped_title in mapped_titles):
                    matched_articles.append(article)
            if matched_articles:
                return matched_articles

        matches: list[dict] = []
        keyword_list = self._site_use_keywords()
        for article in articles:
            title = str(article.get('title', '')).lower()
            content = str(article.get('content', '')).lower()
            if any(keyword in title or keyword in content for keyword in keyword_list):
                matches.append(article)

        return matches

    def _map_question_to_document_titles(self, normalized_question: str) -> list[str]:
        mapping = {
            "회원가입 및 로그인 안내": [
                "로그인",
                "회원가입",
                "비밀번호",
                "아이디",
                "계정",
                "가입",
                "인증",
                "잘 안돼",
                "로그인 안",
                "로그인 안돼",
                "로그인 안돼요",
                "로그인 실패",
                "로그인 오류",
                "로그인 안 됨",
                "회원가입 안돼",
                "회원가입 실패",
                "회원가입 오류",
                "계정 생성",
                "sign up",
                "login",
            ],
            "My Picks의 기능 안내": [
                "my picks",
                "마이 픽",
                "마이픽",
                "마이픽스",
                "별표",
                "찜",
                "저장",
                "저장한",
                "저장된",
                "메모",
                "메모 기능",
                "메모 어디",
                "메모가 어디",
                "메모 확인",
                "마이픽스에",
                "My Picks에",
                "My Picks는",
                "My Picks 뭐",
                "북마크"
            ],
            "Find Influencers의 기능 안내": [
                "find influencers",
                "search influencers",
                "필터",
                "검색",
                "검색창",
                "검색창에",
                "무드",
                "카테고리",
                "추천받기 검색창",
                "인플루언서 카드",
                "인플루언서 검색",
                "기능",
                "어떻게 검색",
                "검색 어떻게",
                "필터 누르면",
                "인플루언서 찾기",
                "인플루언서 찾는 방법",
                "인플루언서 검색 방법",
                "인플루언서 목록",
                "인플루언서 리스트",
                "인플루언서 확인",
                "인플루언서 계정",
                "인플루언서 이름",
                "인플루언서 팔로워",
                "인플루언서 카테고리",
                "인플루언서 스타일",
            ],
            "인플루언서 추천 기능 안내": [
                "추천받기",
                "추천",
                "ai",
                "매칭",
                "무드",
                "카테고리",
                "맞춤 추천",
                "추천 방식",
            ],
            "Data Insights의 기능 안내": [
                "data insights",
                "grade score",
                "인플루언서 비교",
                "카테고리별 분포도",
                "분석",
                "통계",
                "랭킹",
                "점수",
                "보고서",
            ],
        }

        matched_titles: list[str] = []
        for title, keywords in mapping.items():
            if any(keyword in normalized_question for keyword in keywords):
                matched_titles.append(title.lower())
        return matched_titles

    def _site_use_keywords(self) -> list[str]:
        return [
            "로그인",
            "회원가입",
            "회원",
            "비밀번호",
            "아이디",
            "접속",
            "사이트 이용",
            "이용 방법",
            "사용 방법",
            "가입",
            "인증",
            "로그인 안돼",
            "로그인 실패",
            "로그인 오류",
            "회원가입 안돼",
            "회원가입 실패",
            "필터",
            "추천받기",
            "추천",
            "별표",
            "찜",
            "my picks",
            "마이 픽",
            "마이픽",
            "마이픽스",
            "메모",
            "메모 기능",
            "메모 어디",
            "저장",
            "저장한",
            "저장된",
            "데이터 인사이트",
            "data insights",
            "grade score",
            "인플루언서 비교",
            "카테고리별 분포도",
            "인플루언서 카드",
            "인플루언서 메모",
            "검색",
            "검색창",
            "무드",
            "카테고리",
            "분석",
            "통계",
        ]

    def _update_conversation_question_type(self, conversation_id: int, question_type: str):
        url = f"{settings.CHATWOOT_BASE_URL}/conversations/{conversation_id}/custom_attributes"
        payload = {"custom_attributes": {"question_type": question_type}}
        try:
            res = requests.post(url, json=payload, headers=self.headers)
            res.raise_for_status()
        except Exception as e:
            print(f"❌ Chatwoot 질문 유형 초기화 실패: {e}")

    def _resolve_conversation(self, conversation_id: int):
        url = f"{settings.CHATWOOT_BASE_URL}/conversations/{conversation_id}/toggle_status"
        payload = {"status": "resolved"}
        try:
            res = requests.post(url, json=payload, headers=self.headers)
            res.raise_for_status()
        except Exception as e:
            print(f"❌ Chatwoot 대화 종료 처리 실패: {e}")

    def _send_to_chatwoot(self, conversation_id: int, content: str):
        url = f"{settings.CHATWOOT_BASE_URL}/conversations/{conversation_id}/messages"
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
