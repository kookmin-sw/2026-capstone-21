from __future__ import annotations
from typing import Optional, Union, List, Dict, Any
import requests
import openai  
from sqlalchemy.orm import joinedload
from app.db.database import SessionLocal
from app.db.models import ChatwootLog, Influencer, InfluencerCategory
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
RECOMMENDATION_EMPTY_MESSAGE = (
    "입력해 주신 조건에 맞는 인플루언서를 아직 찾지 못했습니다.\n\n"
    "브랜드/쇼핑몰 카테고리, 원하는 콘텐츠 분위기, 타깃 고객, 제품 특징을 조금 더 구체적으로 적어주시면 "
    "더 정확하게 추천해 드릴게요."
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
                "title": "챗봇 및 상담원 이용 안내",
                "content": (
                    "1. 챗봇은 어떤 기능을 제공하나요?: 인플루언서 추천과 사이트 이용 안내를 제공합니다.\n"
                    "2. 챗봇은 어디에서 사용할 수 있나요?: 화면 우측 하단의 보라색 채팅 버튼을 클릭하여 사용할 수 있습니다.\n"
                    "3. 챗봇은 로그인 없이 사용할 수 있나요?: 게스트 모드로 이용 가능하지만 브라우저를 종료하면 대화 기록이 삭제될 수 있습니다.\n"
                    "4. 챗봇에서 인플루언서 추천도 가능한가요?: \"인플루언서 추천\" 대화를 선택하면 AI 추천 기능을 사용할 수 있습니다.\n"
                    "5. 챗봇이 답변을 이상하게 하는 경우 어떻게 하나요?: 브랜드 분위기나 원하는 조건을 더 구체적으로 입력하면 더 정확한 답변을 받을 수 있습니다.\n"
                    "6. 대화 기록은 저장되나요?: 로그인 상태에서는 이전 대화 기록과 Chat History를 확인할 수 있습니다.\n"
                    "7. 사이트 이용 관련 질문도 가능한가요?: 로그인, 추천 기능, 점수, My Picks, Data Insights 등 서비스 이용 관련 질문을 문의할 수 있습니다."
                ),
            },
            {
                "title": "My Picks의 기능 안내",
                "content": (
                    "1. My Picks는 무엇인가요?: 관심 있는 인플루언서를 저장하고 관리할 수 있는 즐겨찾기 기능입니다.\n"
                    "2. My Picks에는 어떻게 저장하나요?: 추천 결과 카드 또는 인플루언서 프로필에서 별(★) 아이콘을 클릭하면 저장할 수 있습니다.\n"
                    "3. 저장한 인플루언서는 어디에서 확인하나요?: 상단 메뉴의 My Picks 페이지에서 확인할 수 있습니다.\n"
                    "4. 관심목록은 자동 저장되나요?: 로그인 상태에서는 관심목록이 자동 저장됩니다.\n"
                    "5. 메모 기능은 무엇인가요?: 각 인플루언서에 협업 관련 메모를 작성할 수 있는 기능입니다.\n"
                    "6. 메모에는 어떤 내용을 작성하나요?: 메모하고 싶은 내용을 기록할 수 있습니다.\n"
                    "7. 카테고리별 보기 기능은 무엇인가요?: 저장된 인플루언서를 카테고리별로 그룹화하여 확인할 수 있는 기능입니다."
                ),
            },
            {
                "title": "Data Insights의 기능 안내",
                "content": (
                    "1. Data Insights에서는 무엇을 확인할 수 있나요?: 인플루언서들의 정보를 종합적으로 확인할 수 있습니다. 카테고리별 분포도와 Grade Score 순위별 인플루언서를 확인 가능합니다.\n"
                    "2. Grade Score는 무엇인가요?: Grade Score는 인플루언서의 팔로워 수, 반응도, 활동성을 종합 분석하여 인플루언서의 가치를 등급화한 지표입니다.\n"
                    "3. 인플루언서 비교 기능은 무엇인가요?: 두 인플루언서의 팔로워 수, 게시물 수, 카테고리, Grade Score를 비교하여 확인할 수 있습니다.\n"
                    "4. 카테고리별 분석은 어떻게 확인하나요?: Data Insights 화면에서 카테고리별 분포도를 통해 분야별 인플루언서 현황을 확인할 수 있습니다.\n"
                    "5. 어떤 항목을 비교할 수 있나요?: 팔로워 수, 게시물 수, 카테고리, Grade Score, 스타일 키워드 등을 비교할 수 있습니다."
                ),
            },
            {
                "title": "추천 결과와 점수 안내",
                "content": (
                    "추천 점수는 무엇인가요?: 추천 점수는 인플루언서와 브랜드 간의 적합도를 분석하여 계산된 종합 점수입니다.\n"
                    "Grade Score는 무엇인가요?: Grade Score는 인플루언서의 팔로워 수, 반응도, 활동성을 종합 분석하여 계산한 등급 점수입니다.\n"
                    "유사도 점수는 무엇인가요?: 사용자가 입력한 브랜드 설명과 인플루언서 특성이 얼마나 유사한지 분석한 점수입니다.\n"
                    "개인화 점수는 무엇인가요?: 사용자의 관심목록, 선택 기록, 활동 데이터를 기반으로 계산되는 맞춤형 추천 점수입니다.\n"
                    "추천 결과는 어떤 기준으로 정렬되나요?: 추천 결과는 유사도 점수, 개인화 점수, Grade Score를 종합 분석하여 높은 순서대로 정렬됩니다.\n"
                    "추천 이유 보기는 무엇인가요?: \"추천 이유 보기\" 버튼을 클릭하면 AI가 해당 인플루언서를 추천한 이유를 자연어 설명으로 제공합니다.\n"
                    "Grade Score가 높으면 무조건 좋은 인플루언서인가요?: Grade Score가 높더라도 브랜드 분위기와 타겟 고객에 맞는 인플루언서인지 함께 확인하는 것이 중요합니다.\n"
                    "추천 점수가 낮게 나오는 이유는 무엇인가요?: 입력한 브랜드 특성과 인플루언서 데이터 간의 유사도가 낮을 경우 추천 점수가 낮게 계산될 수 있습니다."
                ),
            },
            {
                "title": "My Page 및 추천 이력 안내",
                "content": (
                    "My Page에서는 무엇을 할 수 있나요?: 사용자 프로필 수정, 쇼핑몰 URL 등록, 쇼핑몰 분위기 분석, 추천 이력 확인 기능을 이용할 수 있습니다.\n"
                    "My Page는 어디에서 들어가나요?: 상단 메뉴의 \"My\" 탭에서 접근할 수 있습니다.\n"
                    "프로필 수정은 어떻게 하나요?: 이름, 쇼핑몰 이름, 쇼핑몰 URL 등을 수정한 뒤 \"저장\" 버튼을 클릭하면 변경 내용이 저장됩니다.\n"
                    "쇼핑몰 URL 분석은 무엇인가요?: 쇼핑몰 주소를 기반으로 AI가 브랜드 분위기와 스타일 키워드를 자동 분석하는 기능입니다.\n"
                    "쇼핑몰 분위기 분석 결과는 어디에 사용되나요?: 분석 결과는 이후 인플루언서 추천 시 자동 반영되어 추천 정확도를 높이는 데 활용됩니다.\n"
                    "추천 이력은 무엇인가요?: 이전에 실행한 추천 결과 기록을 다시 확인할 수 있는 기능입니다.\n"
                    "이전 추천 결과는 어디에서 확인하나요?: My Page 하단의 추천 이력 목록에서 확인할 수 있습니다.\n"
                    "추천 이력을 클릭하면 어떻게 되나요?: 해당 추천의 상세 결과 페이지로 이동하여 이전 추천 결과를 다시 확인할 수 있습니다.\n"
                    "쇼핑몰 URL을 등록하지 않아도 추천 기능을 사용할 수 있나요?: 가능합니다. 다만 쇼핑몰 URL 분석을 함께 사용하면 더 정확한 추천 결과를 받을 수 있습니다."
                ),
            },
            {
                "title": "인플루언서 추천 기능 안내",
                "content": (
                    "AI 인플루언서 추천은 무엇인가요?: 사용자가 입력한 상품 정보, 브랜드 분위기, 타겟 고객 정보를 기반으로 AI가 적합한 인플루언서를 추천하는 기능입니다.\n"
                    "인플루언서 추천은 어디에서 이용하나요?: 상단 메뉴의 Recommend 페이지 또는 챗봇의 \"인플루언서 추천\" 대화에서 이용할 수 있습니다.\n"
                    "어떤 방식으로 입력하면 추천 정확도가 높아지나요?: 브랜드 분위기, 타겟 연령층, 제품 특징 등을 구체적으로 입력할수록 추천 정확도가 높아집니다. 예시: \"20대 여성 대상 감성 패션 브랜드\", \"따뜻한 우드톤 인테리어 소품\", \"비건 뷰티 브랜드에 어울리는 인플루언서\"\n"
                    "추천 결과에는 어떤 정보가 표시되나요?: 추천 결과 카드에는 프로필 이미지, 인플루언서 이름, 팔로워 수, 카테고리, 추천 점수 등이 표시됩니다.\n"
                    "추천 결과는 저장되나요?: 추천 실행 기록은 자동 저장되며 My Page에서 이전 추천 결과를 다시 확인할 수 있습니다.\n"
                    "추천 결과가 적게 나오거나 없으면 어떻게 하나요?: 입력 조건이 너무 제한적일 경우 결과가 적게 나올 수 있습니다. 카테고리나 팔로워 조건을 완화하거나 더 일반적인 키워드로 다시 입력해보세요."
                ),
            },
            {
                "title": "상담원 안내",
                "content": (
                    "평일 10시 ~ 11시\n"
                    "평일 13시 30분 ~ 16시 입니다.\n"
                    "잠시 기다려주시면 확인 후 답장 드리겠습니다.\n"
                    "급한 문의는 \"dev_pickple@gmail.com\" 메일로 보내주세요. 감사합니다."
                ),
            },
            {
                "title": "회원가입 및 로그인 안내",
                "content": (
                    "1. 회원가입은 어떻게 하나요?: 좌측 상단의 [Get Started] 버튼을 누른 뒤 하단의 [Sign up]을 클릭하세요. 올바른 이메일 형식과 비밀번호를 입력하여 회원가입할 수 있습니다.\n"
                    "2. 로그인은 어떻게 하나요?: 우측 상단의 [Login] 버튼을 클릭한 뒤 가입한 이메일과 비밀번호를 입력하여 로그인할 수 있습니다.\n"
                    "3. 비밀번호 조건은 무엇인가요?: 비밀번호는 8~50자 사이여야 하며, 영문, 숫자, 특수문자를 모두 포함해야 합니다.\n"
                    "4. 계정이 없으면 어떻게 하나요?: 로그인 화면 하단의 [Sign up] 버튼을 눌러 새 계정을 생성할 수 있습니다."
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
            "파인드 인플루언서",
            "북마크",
            "별표",
            "찜",
            "my picks",
            "마이픽",
            "마이픽스",
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
            try:
                if not question_type or question_type == "일반":
                    last_log = db.query(ChatwootLog).filter(
                        ChatwootLog.conversation_id == conversation_id,
                        ChatwootLog.question_type != "일반"
                    ).order_by(ChatwootLog.id.desc()).first()
                    
                    if last_log:
                        question_type = last_log.question_type

                # 질문 내용에 따라 question_type 재분류 (이미 설정된 타입이라도)
                is_site = self._is_site_use_question(question_content)
                is_recommendation = self._is_influencer_recommendation_question(question_content)

                if is_site and is_recommendation:
                    # 충돌 시 GPT로 의도 판별
                    question_type = self._classify_intent_with_gpt(question_content)
                elif is_recommendation:
                    question_type = "인플루언서 추천"
                elif is_site:
                    question_type = "사이트 이용 관련"
                elif question_type == "일반":
                    # 일반 질문으로 유지
                    pass

                # 1. 환각 방지를 위한 매우 엄격한 시스템 프롬프트 설정
                system_role = (
                    "당신은 쇼핑몰 브랜드와 인플루언서를 매칭해주는 서비스 '링크디매치'의 전문 상담원입니다.\n"
                    "가장 중요한 규칙: 반드시 제공된 [참고 데이터] 내의 정보만을 사용하여 답변하세요.\n"
                    "참고 데이터에는 Chatwoot Help Center의 다음 제목의 문서가 포함됩니다: '챗봇 및 상담원 이용 안내', 'My Picks의 기능 안내', 'Data Insights의 기능 안내', '추천 결과와 점수 안내', 'My Page 및 추천 이력 안내', '인플루언서 추천 기능 안내', '상담원 안내', '회원가입 및 로그인 안내'.\n"
                    "질문에 답이 이 문서들에 있다면, 반드시 그 문서의 내용을 그대로 사용하여 구체적으로 답변하세요.\n"
                    "문서에 없는 내용은 절대 사용하지 마세요. 답을 찾을 수 없으면 반드시 '죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다. 문의는 dev_pickple@gmail.com 로 해주시기 바랍니다.'라고만 답하세요."
                )
                context_data=""

                # --- [CASE 1] 인플루언서 추천/분석 관련 질문 ---
                if question_type == "인플루언서 추천":
                    ai_answer = self._build_influencer_recommendation_answer(
                        user_id=user_id,
                        question_content=question_content,
                        conversation_id=conversation_id,
                    )
                    self._complete_process(conversation_id, ai_answer)
                    return

                # --- [CASE 2] 사이트 이용 관련 질문 (RAG 방식) ---
                elif question_type == "사이트 이용 관련":
                    help_articles = self._get_chatwoot_help_center_articles()
                    if not help_articles:
                        self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다. 문의는 dev_pickple@gmail.com 로 해주시기 바랍니다.")
                        return

                    relevant_articles = self._select_relevant_help_center_articles(question_content, help_articles)
                    if not relevant_articles:
                        self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다. 문의는 dev_pickple@gmail.com 로 해주시기 바랍니다.")
                        return

                    keyword_answer = self._keyword_only_answer(question_content)
                    if keyword_answer:
                        self._complete_process(conversation_id, keyword_answer)
                        return

                    context_data = f"\n[서비스 이용 안내 문서]\n{self._format_help_center_articles(relevant_articles)}"
                    system_role += "\n제공된 이용 안내 문서 외의 외부 지식은 절대 사용하지 마세요."

                else:
                    self._complete_process(conversation_id, "죄송합니다. 해당 내용은 이용 안내 문서에 등록되어 있지 않습니다. 문의는 dev_pickple@gmail.com 로 해주시기 바랍니다.")
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
            except Exception as e:
                db.rollback()
                print(f"❌ 챗봇 처리 실패: {e}")
                self._complete_process(conversation_id, "시스템 오류로 답변을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.")

    def _enhance_query_with_history(self, conversation_id: int, current_question: str) -> str:
        """대화 히스토리를 기반으로 누적 선호를 반영한 개선된 추천 쿼리를 생성합니다."""
        if not conversation_id:
            return current_question

        # 같은 conversation의 이전 추천 관련 대화 조회 (최근 10개)
        history_logs = (
            self.db.query(ChatwootLog)
            .filter(
                ChatwootLog.conversation_id == conversation_id,
                ChatwootLog.question_type == "인플루언서 추천",
            )
            .order_by(ChatwootLog.id.desc())
            .limit(10)
            .all()
        )

        if len(history_logs) <= 1:
            return current_question

        # 히스토리를 시간순으로 정렬 (현재 질문 제외)
        past_logs = sorted(history_logs[1:], key=lambda x: x.id)
        history_text = "\n".join(
            f"유저: {log.question_content}\n봇: {log.answer_content or ''}"
            for log in past_logs[-5:]  # 최근 5개만
        )

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "당신은 인플루언서 추천 검색 쿼리를 개선하는 도우미입니다.\n"
                            "아래 대화 히스토리와 현재 질문을 보고, 유저의 누적된 선호(카테고리, 분위기, 팔로워 규모, 스타일 등)를 "
                            "반영하여 추천 엔진에 전달할 하나의 검색 쿼리 문장을 생성하세요.\n"
                            "검색 쿼리만 출력하세요. 설명이나 부가 텍스트는 불필요합니다."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"[이전 대화]\n{history_text}\n\n[현재 질문]\n{current_question}",
                    },
                ],
                temperature=0.0,
                max_tokens=200,
            )
            enhanced = response.choices[0].message.content.strip()
            print(f"--- [DEBUG] 쿼리 개선: '{current_question}' → '{enhanced}'", flush=True)
            return enhanced
        except Exception as e:
            print(f"⚠️ 쿼리 개선 실패, 원본 사용: {e}")
            return current_question

    def _complete_process(self, conversation_id: int, ai_answer: str):
        """결과 발송 및 로그 기록 공통 로직"""
        self._send_to_chatwoot(conversation_id, ai_answer)
        self._update_log(conversation_id, ai_answer)

    def _build_influencer_recommendation_answer(self, user_id: int, question_content: str, conversation_id: int = None) -> str:
        """추천 엔진 결과를 Chatwoot에서 읽기 좋은 텍스트 답변으로 변환합니다."""
        from app.db.models import RecommendationRun, RecommendationResult, MallInput

        # 대화 히스토리 기반 쿼리 개선
        enhanced_query = self._enhance_query_with_history(conversation_id, question_content)

        try:
            engine = RecommendationEngine(self.db)
            recommendations = engine.recommend(user_id=user_id, query_text=enhanced_query, top_k=5)
        except Exception as e:
            print(f"❌ 인플루언서 추천 생성 실패: {e}")
            return "시스템 오류로 추천 결과를 생성하지 못했습니다. 잠시 후 다시 시도해 주세요."

        if not recommendations:
            return RECOMMENDATION_EMPTY_MESSAGE

        # MallInput 생성 및 RecommendationRun 저장
        run_id = None
        try:
            mall_input = MallInput(user_id=user_id, input_text=enhanced_query)
            self.db.add(mall_input)
            self.db.flush()

            new_run = RecommendationRun(
                input_id=mall_input.input_id,
                user_id=user_id,
                applied_action_idx=recommendations[0].get("action_idx", 0),
                status="completed",
            )
            self.db.add(new_run)
            self.db.flush()
            run_id = new_run.run_id

            for i, rec in enumerate(recommendations):
                self.db.add(RecommendationResult(
                    run_id=run_id,
                    influencer_id=rec["influencer_id"],
                    similarity_score=rec.get("similarity_score"),
                    grade_score=rec.get("grade_score"),
                    personalization_score=rec.get("personalization_score"),
                    final_score=rec["score"],
                    rank_no=i + 1,
                ))
            self.db.commit()
        except Exception as e:
            print(f"⚠️ 추천 결과 저장 실패: {e}")
            self.db.rollback()

        rec_by_id = {rec["influencer_id"]: rec for rec in recommendations}
        influencers = (
            self.db.query(Influencer)
            .options(
                joinedload(Influencer.influencer_categories).joinedload(
                    InfluencerCategory.category
                )
            )
            .filter(Influencer.influencer_id.in_(list(rec_by_id.keys())))
            .filter(Influencer.is_active.is_(True))
            .all()
        )
        influencer_by_id = {inf.influencer_id: inf for inf in influencers}

        lines = [
            "입력해 주신 조건을 기준으로 적합도가 높은 인플루언서를 추천해 드릴게요.",
            "",
        ]

        rank_no = 1
        for rec in recommendations[:5]:
            influencer = influencer_by_id.get(rec["influencer_id"])
            if not influencer:
                continue

            profile_name = self._format_influencer_name(influencer)
            category = self._primary_category_name(influencer) or "카테고리 미지정"
            followers = self._format_count(influencer.followers_count)
            grade = self._format_grade_score(influencer.grade_score)
            keywords = self._format_style_keywords(influencer)
            score = round(float(rec.get("score", 0.0)) * 100, 1)

            lines.append(f"{rank_no}. {profile_name}")
            lines.append(f"- 추천 점수: {score}점")
            lines.append(f"- 카테고리: {category} / 팔로워: {followers} / Grade Score: {grade}")
            if keywords:
                lines.append(f"- 스타일 키워드: {keywords}")
            if influencer.profile_url:
                lines.append(f"- 프로필: {influencer.profile_url}")
            lines.append("")
            rank_no += 1

        if rank_no == 1:
            return RECOMMENDATION_EMPTY_MESSAGE

        lines.append(
            "더 정확한 추천이 필요하면 제품명, 브랜드 분위기, 원하는 카테고리나 콘텐츠 스타일을 함께 알려주세요."
        )
        if run_id:
            lines.append(f"\n[추천 결과 전체보기](/recommendation/{run_id})")
        return "\n".join(lines).strip()

    def _format_influencer_name(self, influencer: Influencer) -> str:
        username = f"@{influencer.username}" if influencer.username else "이름 미상"
        if influencer.full_name:
            return f"{username} ({influencer.full_name})"
        return username

    def _primary_category_name(self, influencer: Influencer) -> Optional[str]:
        for influencer_category in influencer.influencer_categories:
            if influencer_category.priority == 1 and influencer_category.category:
                return influencer_category.category.category_name
        return None

    def _format_count(self, value: Optional[int]) -> str:
        if value is None:
            return "정보 없음"
        return f"{value:,}명"

    def _format_grade_score(self, value: Optional[float]) -> str:
        if value is None:
            return "정보 없음"
        return f"{value:.1f}"

    def _format_style_keywords(self, influencer: Influencer) -> str:
        keywords = self._extract_style_keywords(influencer.style_keywords_json)
        if not keywords and influencer.style_keywords_text:
            keywords = [
                keyword.strip()
                for keyword in influencer.style_keywords_text.replace("#", "").split(",")
                if keyword.strip()
            ]
        return ", ".join(keywords[:5])

    def _extract_style_keywords(self, raw_keywords: Any) -> list[str]:
        if isinstance(raw_keywords, list):
            return [str(keyword).strip() for keyword in raw_keywords if str(keyword).strip()]

        if isinstance(raw_keywords, dict):
            keywords: list[str] = []
            for value in raw_keywords.values():
                if isinstance(value, list):
                    keywords.extend(str(keyword).strip() for keyword in value if str(keyword).strip())
                elif value:
                    keywords.append(str(value).strip())
            return keywords

        if isinstance(raw_keywords, str):
            return [keyword.strip() for keyword in raw_keywords.split(",") if keyword.strip()]

        return []

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
            "파인드 인플루언서",
            "인플루언서 탐색",
            "인플루언서 검색",
            "인플루언서 찾기",
            "search influencers",
            "필터",
            "추천받기 검색창",
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
            "그레이드 스코어",
            "등급 점수",
            "인플루언서 비교",
            "카테고리별 분포도",
            "인플루언서 카드",
            "인플루언서 메모",
            "상담원 연결",
            "상담원",
            "챗봇",
            "채팅",
            "대화 기록",
            "chat history",
            "게스트",
            "추천 점수",
            "유사도 점수",
            "개인화 점수",
            "추천 이유",
            "my page",
            "마이페이지",
            "마이 페이지",
            "프로필 수정",
            "쇼핑몰 url",
            "쇼핑몰 분석",
            "추천 이력",
            "이전 추천",
            "추천 기록",
        ]
        return any(keyword in normalized for keyword in keywords)

    def _is_influencer_recommendation_question(self, question_content: str) -> bool:
        """질문이 인플루언서 추천 관련인지 확인합니다."""
        if not question_content:
            return False
        normalized = question_content.strip().lower()
        support_keywords = ["상담원", "문의", "help", "support", "연결", "질문"]
        if any(keyword in normalized for keyword in support_keywords):
            return False
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
            "ai 추천",
            "ai 매칭",
            "맞춤 추천",
            "추천 방식",
            "추천 결과",
            "추천 목록",
            "인플루언서 분석",
            "매칭 점수",
        ]
        if any(keyword in normalized for keyword in keywords):
            return True

        # 상품/브랜드 설명 패턴 감지 — 키워드 없이 상품 정보만 입력한 경우
        product_indicators = [
            "분위기", "스타일", "용품", "제품", "상품", "브랜드",
            "쇼핑몰", "의류", "패션", "뷰티", "화장품", "코스메틱",
            "식품", "건강", "다이어트", "홈", "인테리어", "가구",
            "전자", "디지털", "키즈", "유아", "반려동물", "펫",
            "스포츠", "아웃도어", "여행", "리빙", "주방", "청소",
            "악세사리", "주얼리", "가방", "신발", "향수",
        ]
        if any(indicator in normalized for indicator in product_indicators):
            # 사이트 이용 관련 키워드가 함께 있으면 제외
            site_exclusions = [
                "로그인", "회원가입", "비밀번호", "접속", "가입",
                "이용 방법", "사용 방법", "어떻게 사용", "어떻게 이용",
            ]
            if any(exc in normalized for exc in site_exclusions):
                return False
            return True

        return False

    def _classify_intent_with_gpt(self, question_content: str) -> str:
        """키워드 충돌 시 GPT로 사용자 의도를 판별합니다."""
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "사용자의 질문 의도를 분류하세요. 반드시 다음 중 하나만 출력하세요:\n"
                            "- 인플루언서 추천: 상품/브랜드에 맞는 인플루언서를 찾거나 추천받으려는 의도\n"
                            "- 사이트 이용 관련: 서비스 기능 사용법, 로그인, 회원가입 등 사이트 이용에 대한 질문\n"
                            "답변은 '인플루언서 추천' 또는 '사이트 이용 관련' 중 하나만 출력하세요."
                        ),
                    },
                    {"role": "user", "content": question_content},
                ],
                temperature=0.0,
                max_tokens=20,
            )
            result = response.choices[0].message.content.strip()
            if "추천" in result:
                return "인플루언서 추천"
            return "사이트 이용 관련"
        except Exception as e:
            print(f"⚠️ GPT 의도 분류 실패, 추천으로 폴백: {e}")
            return "인플루언서 추천"

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

    def _keyword_only_answer(self, question_content: str) -> Optional[str]:
        normalized = question_content.strip().lower()
        grade_score_keywords = {
            "grade score",
            "gradescore",
            "그레이드 스코어",
            "그레이드스코어",
            "등급 점수",
        }
        if normalized in grade_score_keywords:
            return (
                "Grade Score는 인플루언서의 팔로워 수, 반응도, 활동성을 종합 분석하여 "
                "인플루언서의 가치를 등급화한 지표입니다.\n\n"
                "Data Insights 화면에서 Grade Score 순위별 인플루언서를 확인할 수 있으며, "
                "인플루언서 비교 기능에서도 Grade Score를 비교할 수 있습니다."
            )

        return None

    def _map_question_to_document_titles(self, normalized_question: str) -> list[str]:
        mapping = {
            "챗봇 및 상담원 이용 안내": [
                "챗봇",
                "채팅",
                "채팅 버튼",
                "대화 기록",
                "chat history",
                "게스트",
                "게스트 모드",
                "챗봇 기능",
                "챗봇 사용",
                "챗봇 어디",
                "챗봇 추천",
                "답변이 이상",
                "이상하게",
            ],
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
                "get started",
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
                "북마크",
                "관심목록",
                "즐겨찾기",
                "카테고리별 보기",
            ],
            "Data Insights의 기능 안내": [
                "data insights",
                "데이터 인사이트",
                "인플루언서 비교",
                "카테고리별 분포도",
                "분포도",
                "분석",
                "통계",
                "랭킹",
                "순위",
            ],
            "추천 결과와 점수 안내": [
                "추천 점수",
                "grade score",
                "그레이드 스코어",
                "등급 점수",
                "유사도 점수",
                "개인화 점수",
                "점수",
                "정렬",
                "추천 이유",
                "추천 이유 보기",
                "점수가 낮",
                "점수 낮",
            ],
            "My Page 및 추천 이력 안내": [
                "my page",
                "마이페이지",
                "마이 페이지",
                "프로필 수정",
                "프로필",
                "쇼핑몰 url",
                "쇼핑몰 분석",
                "쇼핑몰 분위기",
                "추천 이력",
                "이전 추천",
                "추천 기록",
                "추천 결과 확인",
                "my 탭",
            ],
            "인플루언서 추천 기능 안내": [
                "추천받기",
                "추천 기능",
                "ai 추천",
                "ai 매칭",
                "맞춤 추천",
                "추천 방식",
                "recommend",
                "추천 결과 카드",
                "추천 결과 저장",
                "추천 결과가 적",
                "추천 결과 없",
                "인플루언서 추천 어디",
                "추천 정확도",
            ],
            "상담원 안내": [
                "상담원",
                "상담",
                "연결",
                "문의",
                "운영 시간",
                "상담시간",
                "지원",
                "help",
                "메일",
                "이메일 문의",
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
            "find influencers",
            "파인드 인플루언서",
            "search influencers",
            "인플루언서 탐색",
            "인플루언서 검색",
            "인플루언서 찾기",
            "인플루언서 목록",
            "인플루언서 리스트",
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
            "그레이드 스코어",
            "등급 점수",
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
            "상담원",
            "상담",
            "연결",
            "연결해줘",
            "상담원 연결",
            "상담원 연결해줘",
            "문의",
            "support",
            "help",
            "챗봇",
            "채팅",
            "대화 기록",
            "chat history",
            "게스트",
            "게스트 모드",
            "추천 점수",
            "유사도 점수",
            "개인화 점수",
            "추천 이유",
            "추천 이유 보기",
            "my page",
            "마이페이지",
            "마이 페이지",
            "프로필 수정",
            "프로필",
            "쇼핑몰 url",
            "쇼핑몰 분석",
            "쇼핑몰 분위기",
            "추천 이력",
            "이전 추천",
            "추천 기록",
            "추천 결과 확인",
            "추천 정확도",
            "관심목록",
            "즐겨찾기",
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
