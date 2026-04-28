"""
classify_influencers_refactored.py

Instagram 계정 분류 — 데이터셋 일반화를 목표로 재설계한 버전.

설계 원칙
---------
1. 모든 카테고리를 동일한 방식으로 처리한다. 카테고리별 특수 분기 금지.
2. Rule-based prior는 LLM 프롬프트의 참고 정보로만 쓰고, 결과를 강제로 바꾸지 않는다.
3. Guardrail은 최소한만: 카테고리/타입 enum 검증, confidence 기반 review, JSON 재시도, fallback.
4. Example bank는 선택적. confidence가 낮을 때만 단순 token-overlap 유사도로 검색해 참고자료로 주입.
5. 프롬프트에는 일반 원칙만 담는다. 세부 오분류 사례를 코드/프롬프트에 심지 않는다.
"""

import os
import re
import json
import math
import time
import sys
from collections import defaultdict, Counter
from typing import Any, Dict, List, Optional

from openai import OpenAI


# =========================
# Config
# =========================
INFLUENCERS_PATH   = "influencers_result_2000.json"
POSTS_PATH         = "posts_db_2000.json"

# 이번에 분류할 batch 범위
# 0이면 1~100번째 계정
# 100이면 101~200번째 계정
# 200이면 201~300번째 계정
BATCH_START_INDEX  = 854
BATCH_SIZE         = 100
RECENT_POST_LIMIT  = 12

OUTPUT_JSON_PATH   = f"classified_output_{BATCH_START_INDEX + 1}_{BATCH_START_INDEX + BATCH_SIZE}.json"
DEBUG_LOG_PATH     = f"classification_debug_log_{BATCH_START_INDEX + 1}_{BATCH_START_INDEX + BATCH_SIZE}.jsonl"


GOLD_SET_PATH      = "gold_set.json"
EXAMPLE_BANK_PATH  = "example_bank4goldset_100.json"

MODEL_NAME                 = "gpt-4o-mini"
MAX_CAPTION_CHARS_PER_POST = 350
SLEEP_BETWEEN_CALLS        = 0.2
STYLE_KEYWORD_MIN          = 5
STYLE_KEYWORD_MAX          = 8
REVIEW_THRESHOLD           = 75   # 이 미만이면 예시 붙여서 review 수행
MAX_LLM_RETRIES            = 2
RECENT_POST_DIVISOR        = 12.0

EXCLUDE_CATEGORY = "제외"

CATEGORIES = [
    "패션", "뷰티", "인테리어", "리빙", "푸드·맛집",
    "여행", "헬스·웰니스", "육아·가족", "반려동물", "라이프스타일", EXCLUDE_CATEGORY,
]

ACCOUNT_TYPES = ["인플루언서", "브랜드", "매거진", "플랫폼"]

# ===== 제외 카테고리 (rule-based 사전 필터링용) =====
EXCLUDE_CATEGORY = "제외"
EXCLUDE_BUSINESS_CLUSTERS: Dict[str, List[str]] = {
    "식당·고기":   ["맛집", "한우", "육회", "곱창", "치킨", "삼겹살", "고기집", "횟집", "한식당"],
    "뷰티시술":    ["눈썹문신", "반영구", "속눈썹펌", "문신", "타투", "피부과", "시술", "레이저"],
    "반려동물분양": ["분양", "강아지분양", "고양이분양", "펫샵"],
    "웨딩·예식":   ["웨딩홀", "스드메", "예식장", "결혼식장", "웨딩촬영"],
    "부동산":     ["부동산", "매매", "전세", "월세", "매물", "분양권"],
    "차량":       ["중고차", "수입차", "차량매입"],
    "인테리어시공": ["인테리어시공", "리모델링", "시공", "턴키"],
    "카페창업":    ["카페창업", "창업문의", "창업컨설팅"],
}
EXCLUDE_MIN_BUSINESS_CLUSTERS = 3  # 3개 이상 업종 혼재 시 spam
EXCLUDE_PROFILE_MIN_SCORE     = 2  # 프로필 주제가 명확하다고 볼 최소 점수
EXCLUDE_MIN_AVG_LIKES         = 30 # 평균 좋아요 하한

# 각 카테고리의 대표 키워드. 모든 카테고리에 대해 동일한 방식으로만 사용된다.
CATEGORY_HINTS: Dict[str, List[str]] = {
    "패션": [
        "룩", "코디", "옷", "ootd", "가방", "슈즈", "패션", "하객룩", "브랜드착장",
        "스타일링", "데일리룩", "착장", "컬렉션", "패션위크", "아우터", "니트",
        "원피스", "청바지", "스트릿", "미니멀룩", "모자", "캡",
    ],
    "뷰티": [
        "스킨케어", "메이크업", "홈케어", "뷰티디바이스", "피부과",
        "화장품", "세럼", "올리브영", "피부", "뷰티", "네일", "헤어",
        "미용실", "톤업", "파운데이션", "립", "쿠션", "클렌징",
        "속눈썹", "속눈썹펌", "리프팅", "눈썹문신", "반영구", "아트메이크업",
    ],
    "인테리어": [
        "집꾸미기", "인테리어", "홈데코", "공간", "공간꾸미기", "방꾸미기",
        "침실인테리어", "거실인테리어", "주방인테리어", "욕실인테리어",
        "홈스타일링", "가구", "조명", "패브릭", "오브제", "소품샵",
        "무드", "감성", "분위기", "before after", "리모델링", "원목",
        "빈티지", "미니멀", "모던", "북유럽", "트레이", "자개", "테이블세팅",
    ],
    "리빙": [
        "리빙", "살림", "살림템", "꿀템", "실용템", "추천템", "생활용품", "선물", "답례품", 
        "주방용품", "주방템", "청소템", "수납", "수납템", "정리", "가전",
        "소형가전", "생활가전", "욕실용품", "청소용품", "음식물처리기",
        "밀폐용기", "텀블러", "식기", "조리도구", "생활꿀템", "살림꿀템",
        "사용후기", "실사용", "공구", "도마", "우드",
    ],
    "푸드·맛집": [
        "맛집", "카페", "레시피", "먹방", "디저트", "간식", "식당",
        "음식", "커피", "홈카페", "브런치", "베이킹", "요리",
    ],
    "여행": [
        "여행", "호텔", "숙소", "공항", "해외", "국내여행", "괌",
        "발리", "trip", "리조트", "여행스타그램",
    ],
    "헬스·웰니스": [
        "운동", "헬스", "러닝", "다이어트", "필라테스", "요가", "웰니스",
        "건강", "오운완", "식단", "홈트", "크로스핏",
    ],
    "육아·가족": [
        "육아", "아기", "아이", "신생아", "맘", "가족", "부부",
        "육아템", "키즈", "돌잔치", "어린이집", "유아",
    ],
    "반려동물": [
        "강아지", "고양이", "반려동물", "댕댕이", "냥이",
        "애견", "애묘", "펫", "펫용품", "애견용품", "애묘용품",
        "사료",
    ],
    "라이프스타일": [
        "일상", "브이로그", "블로그", "블로거", "데일리", "취향", "감성", "루틴",
        "뜨개질", "코바늘", "손뜨개", "diy", "취미기록", "드로잉", "캘리그라피",
        "산책", "꽃놀이", "사진관", "이슈", "트렌드", "뉴스", "소식", "화제", "유머", "밈", "짤",
        "영화", "드라마", "예능", "방송", "연예", "아이돌", "배우",
        "팬페이지", "팬계정", "커뮤니티", "콘텐츠", "클립", "하이라이트"
    ],
}

# 카테고리별 일반화 가능한 임계치.
# 여기에 없는 카테고리는 기본값(min_distinct_posts=1, min_keyword_count=1)을 사용한다.
# 특정 계정명이나 hard_case_type이 아니라, "이 카테고리를 인정하려면 몇 개 포스트에
# 몇 번 이상 등장해야 하는가?"라는 일반 조건이므로 새 데이터셋에도 그대로 적용된다.
CATEGORY_RULES: Dict[str, Dict[str, int]] = {
    "반려동물": {"min_distinct_posts": 4, "min_keyword_count": 4},
    "여행":     {"min_distinct_posts": 3, "min_keyword_count": 3},
}

EMAIL_REGEX = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
TOKEN_REGEX = re.compile(r"[A-Za-z0-9가-힣][A-Za-z0-9가-힣]{1,30}")


# =========================
# IO / small utils
# =========================
def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: str, data: Any) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def safe_text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def trim_text(text: Any, max_len: int) -> str:
    text = safe_text(text)
    return text if len(text) <= max_len else text[: max_len - 3] + "..."


def sanitize_filename(name: str) -> str:
    name = safe_text(name)
    return re.sub(r'[\/:*?"<>|]+', "_", name) if name else "unknown"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("\n")
        if parts:
            parts = parts[1:]
        if parts and parts[-1].strip().startswith("```"):
            parts = parts[:-1]
        text = "\n".join(parts).strip()
    return text


def safe_parse_json(raw_text: str) -> Optional[Dict[str, Any]]:
    text = strip_code_fence(raw_text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except json.JSONDecodeError:
            pass
    return None


# =========================
# LLM
# =========================
def llm_call_with_retry(client, model, messages, retries: int = MAX_LLM_RETRIES) -> str:
    for attempt in range(retries + 1):
        try:
            response = client.responses.create(model=model, temperature=0, input=messages)
            return response.output_text
        except Exception:
            if attempt == retries:
                raise
            time.sleep(1.0 * (attempt + 1))
    return ""


# =========================
# Preprocessing
# =========================
def group_posts_by_username(posts: List[Dict]) -> Dict[str, List[Dict]]:
    grouped: Dict[str, List[Dict]] = defaultdict(list)
    for post in posts:
        username = safe_text(post.get("username"))
        if username:
            grouped[username].append(post)
    for items in grouped.values():
        items.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    return grouped


def top_terms(values: List[str], top_k: int = 15) -> List[str]:
    cleaned = [safe_text(v).lower() for v in values if safe_text(v)]
    return [t for t, _ in Counter(cleaned).most_common(top_k)]


def extract_view_count(post: Dict) -> float:
    for key in ["viewsCount", "viewCount", "videoViewCount", "videoPlayCount", "playCount"]:
        value = post.get(key)
        if value is not None:
            try:
                return float(value)
            except Exception:
                return 0.0
    return 0.0


def build_recent_post_summary(posts: List[Dict]) -> Dict[str, Any]:
    likes    = [float(p.get("likesCount", 0) or 0) for p in posts]
    comments = [float(p.get("commentsCount", 0) or 0) for p in posts]
    views    = [extract_view_count(p) for p in posts]
    hashtags, mentions, captions, compact = [], [], [], []

    for idx, post in enumerate(posts, start=1):
        caption = trim_text(post.get("caption", ""), MAX_CAPTION_CHARS_PER_POST)
        ph = [safe_text(x) for x in post.get("hashtags", []) if safe_text(x)]
        pm = [safe_text(x) for x in post.get("mentions", []) if safe_text(x)]
        captions.append(safe_text(post.get("caption", "")))
        hashtags.extend(ph)
        mentions.extend(pm)
        compact.append({
            "index": idx,
            "caption": caption,
            "hashtags": ph,
            "mentions": pm,
            "likesCount": int(post.get("likesCount", 0) or 0),
            "commentsCount": int(post.get("commentsCount", 0) or 0),
            "viewsCount": int(extract_view_count(post)),
            "type": safe_text(post.get("type")),
        })

    divisor = RECENT_POST_DIVISOR
    return {
        "recent_post_count": len(posts),
        "avg_likes_recent12":    round((sum(likes)    / divisor) if likes    else 0.0, 4),
        "avg_comments_recent12": round((sum(comments) / divisor) if comments else 0.0, 4),
        "avg_views_recent12":    round((sum(views)    / divisor) if views    else 0.0, 4),
        "top_hashtags":  top_terms(hashtags, top_k=20),
        "top_mentions":  top_terms(mentions, top_k=20),
        "captions":      captions,
        "compact_posts": compact,
    }


def build_account_text(influencer: Dict, summary: Dict) -> str:
    """계정 전체 텍스트를 소문자 한 덩어리로 — prior/검색/유사도 계산에 공통 사용."""
    return " ".join([
        safe_text(influencer.get("username")),
        safe_text(influencer.get("fullName")),
        safe_text(influencer.get("biography")),
        safe_text(influencer.get("externalUrl")),
        " ".join(summary.get("top_hashtags", [])),
        " ".join(summary.get("captions", [])),
    ]).lower()


# =========================
# Rule-based summary  (모두 카테고리 무관하게 동일 방식)
# =========================
def compute_category_prior(
    influencer: Dict,
    summary: Dict,
    category_hints: Dict[str, List[str]] = CATEGORY_HINTS,
) -> Dict[str, float]:
    """
    모든 카테고리에 대해 동일한 keyword-count 점수를 매긴다.
    이 값은 LLM에게 '힌트'로만 전달되며, 결과를 강제로 바꾸는 데 쓰이지 않는다.
    """
    text = build_account_text(influencer, summary)
    scores: Dict[str, float] = {}
    for cat, hints in category_hints.items():
        s = sum(text.count(h.lower()) for h in hints)
        scores[cat] = round(s, 1)
    return scores


def compute_topic_distribution(
    summary: Dict,
    category_hints: Dict[str, List[str]] = CATEGORY_HINTS,
    category_rules: Dict[str, Dict[str, int]] = CATEGORY_RULES,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    모든 카테고리에 대해 동일한 방식으로 히트 키워드를 집계한다.
    카테고리별 특수 분기는 없고, category_rules의 일반 임계치만 적용한다.

      - min_keyword_count : 키워드 총 등장 횟수의 하한
      - min_distinct_posts: 그 카테고리 키워드가 등장한 서로 다른 포스트 수 하한
    """
    captions = summary.get("captions", [])
    caption_lowers = [safe_text(c).lower() for c in captions]
    combined = " ".join(caption_lowers) + " " + \
               " ".join(summary.get("top_hashtags", [])).lower()

    result: Dict[str, List[Dict[str, Any]]] = {}

    for category, hints in category_hints.items():
        matched: List[Dict[str, Any]] = []
        for hint in hints:
            h = hint.lower()
            count = combined.count(h)
            if count <= 0:
                continue
            distinct_posts = sum(1 for c in caption_lowers if h in c)
            matched.append({
                "keyword": hint,
                "count": count,
                "distinct_posts": distinct_posts,
            })

        if not matched:
            continue

        rules = category_rules.get(category, {})
        min_kw_count       = rules.get("min_keyword_count", 1)
        min_distinct_posts = rules.get("min_distinct_posts", 1)

        total_count  = sum(m["count"] for m in matched)
        max_distinct = max(m["distinct_posts"] for m in matched)

        if total_count  < min_kw_count:        continue
        if max_distinct < min_distinct_posts:  continue

        result[category] = sorted(matched, key=lambda x: x["count"], reverse=True)[:8]

    return result


def format_topic_distribution(distribution: Dict[str, List[Dict[str, Any]]]) -> str:
    if not distribution:
        return "  특별히 반복되는 주제 없음"
    # 총 카운트가 큰 순으로 정렬해서 프롬프트에 넣는다.
    ordered = sorted(
        distribution.items(),
        key=lambda kv: -sum(m["count"] for m in kv[1]),
    )
    lines = []
    for cat, matched in ordered:
        parts = [f"{m['keyword']}({m['count']}/{m['distinct_posts']}p)" for m in matched]
        lines.append(f"  {cat}: " + ", ".join(parts))
    return "\n".join(lines)


# =========================
# Prompts  (세부 오분류 케이스 없이 원칙만)
# =========================
_BASE_RULES = f"""## 분류 과제
1) primary_category: {', '.join(CATEGORIES)} 중 정확히 1개
2) account_type   : {', '.join(ACCOUNT_TYPES)} 중 정확히 1개

## account_type 정의
- 인플루언서: 개인 크리에이터, 리뷰/추천/일상 공유, 개인이 운영하는 소규모 상점(카페·식당·공방 등)
- 브랜드   : 기업/프랜차이즈 공식 제품 판매 계정
- 매거진   : 에디토리얼, 트렌드 기사, 매체형 계정
- 플랫폼   : 셀렉트샵/커머스/중개 서비스 계정

## 핵심 판단 원칙
1. 최근 게시물의 반복 주제를 가장 중요하게 본다.
2. 프로필(username / fullName / biography)은 보조 근거로만 사용한다.
3. 광고·협찬 1회성 게시물만으로 전문 카테고리를 확정하지 않는다.
4. 여러 주제가 혼재하면 최다 빈도 1개를 선택한다.
5. 애매하면 account_type은 "인플루언서"를 기본값으로 둔다."""


def _compact_posts_for_prompt(summary: Dict, caption_chars: int = 200, hashtags_per_post: int = 5):
    return [
        {
            "i": p["index"],
            "c": trim_text(p["caption"], caption_chars),
            "h": p["hashtags"][:hashtags_per_post],
            "t": p["type"],
        }
        for p in summary["compact_posts"]
    ]


def _prior_text(prior_scores: Dict[str, float], top_k: int = 3) -> str:
    top = sorted(prior_scores.items(), key=lambda x: -x[1])[:top_k]
    return ", ".join(f"{c}({s})" for c, s in top if s > 0) or "없음"


def build_classification_prompt(
    influencer: Dict,
    summary: Dict,
    prior_scores: Dict[str, float],
    topic_distribution: Dict[str, List[Dict[str, Any]]],
    examples: Optional[List[Dict]] = None,
) -> str:
    compact = _compact_posts_for_prompt(summary)
    examples_section = ""
    if examples:
        examples_section = (
            "\n## 참고 유사 사례 (결정 강제 아님, 참고만)\n"
            + format_examples_for_prompt(examples)
            + "\n"
        )

    return f"""당신은 인스타그램 계정 분류기입니다.

{_BASE_RULES}

## 반복 주제 통계 (키워드 빈도, 서로 다른 포스트 수)
{format_topic_distribution(topic_distribution)}

## Rule-based prior (참고만, 맹신 금지)
카테고리 상위: {_prior_text(prior_scores)}
{examples_section}
## 프로필
- username   : {influencer.get('username')}
- fullName   : {influencer.get('fullName')}
- biography  : {safe_text(influencer.get('biography'))[:300]}
- externalUrl: {influencer.get('externalUrl')}

## 최근 게시물 ({summary['recent_post_count']}개)
상위 해시태그: {', '.join(summary['top_hashtags'][:15])}
상위 멘션   : {', '.join(summary['top_mentions'][:10])}

{json.dumps(compact, ensure_ascii=False)}

## 출력 (JSON만, 다른 텍스트 금지)
{{
  "primary_category"     : "카테고리",
  "category_confidence"  : 0~100,
  "category_reason"      : "핵심 근거 1~2문장",
  "account_type"         : "유형",
  "account_type_reason"  : "근거 1문장",
  "alternative_category" : "2순위 (없으면 null)"
}}"""


def build_review_prompt(
    influencer: Dict,
    summary: Dict,
    prior_scores: Dict[str, float],
    topic_distribution: Dict[str, List[Dict[str, Any]]],
    previous_result: Dict[str, Any],
    examples: Optional[List[Dict]] = None,
) -> str:
    compact = _compact_posts_for_prompt(summary, caption_chars=250, hashtags_per_post=6)
    examples_section = ""
    if examples:
        examples_section = (
            "\n## 참고 유사 사례 (결정 강제 아님, 참고만)\n"
            + format_examples_for_prompt(examples)
            + "\n"
        )

    prev_cat  = previous_result.get("primary_category", "")
    prev_conf = previous_result.get("category_confidence", 0)
    prev_reason = previous_result.get("category_reason", "")
    prev_alt  = previous_result.get("alternative_category", "") or "없음"

    return f"""당신은 독립적인 분류 검증자입니다.
이전 분류기의 confidence가 낮았습니다({prev_conf}/100). 처음부터 독립적으로 재판단하세요.

## 이전 결과 (참고만)
- 1순위: {prev_cat} (confidence: {prev_conf})
- 근거 : {prev_reason}
- 2순위: {prev_alt}

{_BASE_RULES}

## 반복 주제 통계
{format_topic_distribution(topic_distribution)}

## Rule-based prior (참고만)
{_prior_text(prior_scores)}
{examples_section}
## 프로필
- username   : {influencer.get('username')}
- fullName   : {influencer.get('fullName')}
- biography  : {safe_text(influencer.get('biography'))[:300]}
- externalUrl: {influencer.get('externalUrl')}

## 최근 게시물 ({summary['recent_post_count']}개)
상위 해시태그: {', '.join(summary['top_hashtags'][:15])}
상위 멘션   : {', '.join(summary['top_mentions'][:10])}

{json.dumps(compact, ensure_ascii=False)}

## 출력 (JSON만)
{{
  "primary_category"     : "카테고리",
  "category_confidence"  : 0~100,
  "category_reason"      : "최종 근거 2~3문장",
  "account_type"         : "유형",
  "account_type_reason"  : "근거 1문장",
  "alternative_category" : "2순위 (없으면 null)",
  "changed_from_previous": true/false
}}"""


# =========================
# Optional examples (선택적 참고자료)
# =========================
def load_example_bank(path: str) -> List[Dict]:
    if not os.path.exists(path):
        return []
    try:
        data = load_json(path)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _tokenize(text: str) -> List[str]:
    return TOKEN_REGEX.findall(text.lower())


def retrieve_examples_by_similarity(
    account_text: str,
    example_bank: List[Dict],
    top_k: int = 3,
) -> List[Dict]:
    """
    계정 텍스트와 example bank 각 항목의 단순 token 교집합/합집합(Jaccard)으로
    상위 top_k개를 반환. hard_case_type 같은 카테고리/사례별 분기 없음.
    """
    if not example_bank:
        return []

    account_tokens = set(_tokenize(account_text))
    if not account_tokens:
        return []

    scored = []
    for ex in example_bank:
        ex_text_parts = [
            safe_text(ex.get("retrieval_text")),
            safe_text(ex.get("username")),
            safe_text(ex.get("biography")),
            " ".join(ex.get("misleading_signals", []) or []),
            " ".join(ex.get("dominant_signals", []) or []),
        ]
        ex_tokens = set(_tokenize(" ".join(p for p in ex_text_parts if p)))
        if not ex_tokens:
            continue

        overlap = len(account_tokens & ex_tokens)
        union   = len(account_tokens | ex_tokens)
        sim = overlap / union if union else 0.0
        if sim > 0:
            scored.append((sim, ex))

    scored.sort(key=lambda x: -x[0])
    return [ex for _, ex in scored[:top_k]]


def format_examples_for_prompt(examples: List[Dict]) -> str:
    if not examples:
        return ""
    lines = []
    for ex in examples:
        gold = ex.get("gold_category") or ex.get("expected_category") or ""
        wrong = ex.get("predicted_category") or ""
        reason = ex.get("correction_rule") or ex.get("reason") or ""
        lines.append(
            f"- @{ex.get('username','')} → 정답: {gold}"
            + (f" (이전 오분류: {wrong})" if wrong and wrong != gold else "")
            + (f"\n  참고: {reason[:120]}" if reason else "")
        )
    return "\n".join(lines)


# =========================
# Classification  (최소한의 guardrail)
# =========================
def _fallback_account_type(influencer: Dict, summary: Dict) -> str:
    """LLM 출력이 enum을 벗어났을 때만 쓰이는 최후 fallback."""
    text = " ".join([
        safe_text(influencer.get("username")),
        safe_text(influencer.get("fullName")),
        safe_text(influencer.get("biography")),
        safe_text(influencer.get("externalUrl")),
    ]).lower()
    if any(k in text for k in ["platform", "플랫폼", "셀렉트샵", "마켓플레이스"]):
        return "플랫폼"
    if any(k in text for k in ["magazine", "매거진", "editorial"]):
        return "매거진"
    if any(k in text for k in ["official", "공식계정", "공식몰"]):
        return "브랜드"
    return "인플루언서"


def validate_result(result: Dict[str, Any], influencer: Dict, summary: Dict) -> Dict[str, Any]:
    """출력 JSON에 최소한의 검증만 수행."""
    cat = safe_text(result.get("primary_category"))
    if cat not in CATEGORIES:
        cat = "라이프스타일"
    result["primary_category"] = cat

    acct = safe_text(result.get("account_type"))
    if acct not in ACCOUNT_TYPES:
        acct = _fallback_account_type(influencer, summary)
    result["account_type"] = acct

    try:
        conf = int(result.get("category_confidence", 0) or 0)
    except Exception:
        conf = 0
    result["category_confidence"] = int(clamp(conf, 0, 100))

    result.setdefault("category_reason", "")
    result.setdefault("account_type_reason", "")

    alt = safe_text(result.get("alternative_category"))
    result["alternative_category"] = alt if alt in CATEGORIES else ""

    return result


def detect_exclusion_account(influencer: Dict, summary: Dict) -> Dict[str, Any]:
    """3개 조건 중 2개 이상이면 제외. 기존 로직 일절 건드리지 않음."""
    flags = {"profile_post_mismatch": False, "multi_business_spam": False, "low_engagement": False}
    reasons: List[str] = []

    # 조건 3: 평균 좋아요
    avg_likes = float(summary.get("avg_likes_recent12", 0) or 0)
    if avg_likes < EXCLUDE_MIN_AVG_LIKES:
        flags["low_engagement"] = True
        reasons.append(f"평균 좋아요 낮음({avg_likes:.1f}<{EXCLUDE_MIN_AVG_LIKES})")

    profile_text = " ".join([
        safe_text(influencer.get("username")),
        safe_text(influencer.get("fullName")),
        safe_text(influencer.get("biography")),
    ]).lower()
    post_text = " ".join(summary.get("captions", [])).lower() + " " + \
                " ".join(summary.get("top_hashtags", [])).lower()

    # 조건 2: 다업종 혼재
    hit_clusters = [c for c, kws in EXCLUDE_BUSINESS_CLUSTERS.items()
                    if any(kw in post_text for kw in kws)]
    if len(hit_clusters) >= EXCLUDE_MIN_BUSINESS_CLUSTERS:
        flags["multi_business_spam"] = True
        reasons.append(f"다업종 혼재({len(hit_clusters)}개: {', '.join(hit_clusters[:5])})")

    # 조건 1: 프로필 주제 vs 포스트 주제 불일치
    profile_scores = {cat: sum(profile_text.count(h.lower()) for h in hints)
                      for cat, hints in CATEGORY_HINTS.items()}
    prof_top_cat, prof_top_score = max(profile_scores.items(), key=lambda kv: kv[1], default=(None, 0))
    if prof_top_cat and prof_top_score >= EXCLUDE_PROFILE_MIN_SCORE:
        post_profile_hits = sum(post_text.count(h.lower()) for h in CATEGORY_HINTS[prof_top_cat])
        post_scores = {cat: sum(post_text.count(h.lower()) for h in hints)
                       for cat, hints in CATEGORY_HINTS.items()}
        post_top_cat, post_top_score = max(post_scores.items(), key=lambda kv: kv[1], default=(None, 0))
        if (post_profile_hits <= 1 and post_top_cat and
                post_top_cat != prof_top_cat and post_top_score >= 2):
            flags["profile_post_mismatch"] = True
            reasons.append(
                f"프로필주제({prof_top_cat},{prof_top_score}) vs 게시물주제({post_top_cat},{post_top_score}) 불일치"
            )

    return {
        "is_excluded": sum(flags.values()) >= 2,
        "flags": flags,
        "matched_reasons": reasons,
    }


def classify_account(
    client,
    influencer: Dict,
    summary: Dict,
    example_bank: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    1차: 예시 없이 LLM 호출.
    confidence < REVIEW_THRESHOLD 이면 review_classification 호출.
    """
    # ===== 제외 계정 사전 필터링 (LLM 호출 없이 바로 반환) =====
    exclusion = detect_exclusion_account(influencer, summary)
    if exclusion["is_excluded"]:
        matched = sum(exclusion["flags"].values())
        return {
            "primary_category": EXCLUDE_CATEGORY,
            "category_confidence": 100,
            "category_reason": f"제외 조건 {matched}/3 충족: " + "; ".join(exclusion["matched_reasons"]),
            "account_type": _fallback_account_type(influencer, summary),
            "account_type_reason": "제외 계정으로 판단되어 account_type은 fallback 기준 적용",
            "alternative_category": "",
            "pass": 0,
            "examples_used": 0,
            "exclude_flags": exclusion["flags"],
        }

    prior_scores = compute_category_prior(influencer, summary)
    topic_dist   = compute_topic_distribution(summary)

    prompt = build_classification_prompt(
        influencer=influencer,
        summary=summary,
        prior_scores=prior_scores,
        topic_distribution=topic_dist,
        examples=None,
    )

    raw = llm_call_with_retry(client, MODEL_NAME, [
        {"role": "system", "content": "당신은 엄격한 JSON만 출력하는 분류기입니다."},
        {"role": "user",   "content": prompt},
    ])
    parsed = safe_parse_json(raw)
    if parsed is None:
        # 완전 실패 시 최소 결과로 fallback
        parsed = {"primary_category": "라이프스타일", "category_confidence": 0, "category_reason": "JSON 파싱 실패"}

    result = validate_result(parsed, influencer, summary)
    result["pass"] = 1
    result["examples_used"] = 0

    if result["category_confidence"] < REVIEW_THRESHOLD:
        result = review_classification(
            client, influencer, summary,
            previous_result=result,
            example_bank=example_bank,
        )

    return result


def review_classification(
    client,
    influencer: Dict,
    summary: Dict,
    previous_result: Dict[str, Any],
    example_bank: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """confidence가 낮을 때만 실행. 유사 예시를 검색해 프롬프트에 참고자료로 제공."""
    account_text = build_account_text(influencer, summary)
    examples = retrieve_examples_by_similarity(account_text, example_bank or [], top_k=3)

    prior_scores = compute_category_prior(influencer, summary)
    topic_dist   = compute_topic_distribution(summary)

    prompt = build_review_prompt(
        influencer=influencer,
        summary=summary,
        prior_scores=prior_scores,
        topic_distribution=topic_dist,
        previous_result=previous_result,
        examples=examples,
    )

    try:
        raw = llm_call_with_retry(client, MODEL_NAME, [
            {"role": "system", "content": "당신은 독립적인 분류 검증자입니다. 엄격한 JSON만 출력하세요."},
            {"role": "user",   "content": prompt},
        ])
        parsed = safe_parse_json(raw)
        if parsed:
            reviewed = validate_result(parsed, influencer, summary)
            reviewed["pass"] = 2
            reviewed["examples_used"] = len(examples)
            return reviewed
    except Exception as e:
        previous_result["review_error"] = str(e)

    # review 실패 시 이전 결과 유지
    previous_result["examples_used"] = len(examples)
    return previous_result


# =========================
# Grade scoring (기존 로직 보존)
# =========================
def score_avg_likes_5(avg_likes: float) -> float:
    return round(clamp(math.log10(max(0, float(avg_likes or 0)) + 1) / 6.0 * 5.0, 0, 5), 4)


def score_avg_comments_5(avg_comments: float) -> float:
    return round(clamp(math.log10(max(0, float(avg_comments or 0)) + 1) / 3.0 * 5.0, 0, 5), 4)


def score_posts_per_week_5(ppw: float) -> float:
    return round(clamp(float(ppw or 0) / 7.0 * 5.0, 0, 5), 4)


def score_upload_interval_5(avg_interval_days: float) -> float:
    days = max(float(avg_interval_days or 0), 0)
    if days <= 0:
        return 5.0
    return round(clamp((14.0 - days) / 14.0 * 5.0, 0, 5), 4)


def score_posts_count_5(pc: float) -> float:
    return round(clamp(math.log10(max(0, float(pc or 0)) + 1) / 4.0 * 5.0, 0, 5), 4)


def final_grade_5(like_s, comment_s, upload_s, ppw_s, pc_s) -> float:
    return round(clamp(
        like_s    * 0.30 +
        comment_s * 0.25 +
        upload_s  * 0.15 +
        ppw_s     * 0.15 +
        pc_s      * 0.15,
        0, 5,
    ), 4)


# =========================
# Style keywords
#   → 분류 로직과 별개 관심사. 기존 필터링 로직을 그대로 유지하되,
#     분류 결과를 강제 교정하지는 않는다.
# =========================
GENERIC_STYLE_STOPWORDS = {
    "광고", "ad", "협찬", "공구", "event", "이벤트", "신상", "할인", "오픈",
    "instagram", "insta", "reels", "video", "daily", "좋아요", "댓글", "문의", "링크",
    "프로필", "런칭", "출시", "완판", "공식", "3월", "4월", "5월", "6월", "7월", "8월",
    "9월", "10월", "11월", "12월", "봄", "여름", "가을", "겨울", "주말", "평일",
    "오늘", "내일", "이번", "역대급", "바로", "정말", "진짜", "그냥", "조금", "너무",
    "아주", "같이", "요즘", "곧", "new", "업로드", "구매", "예약판매",
    "재입고", "사이트", "판매", "주문", "배송", "링크트리", "진행", "참고", "공지",
    "확인", "가능", "준비", "발송", "출고",
}
STYLE_MOOD_WORDS = {
    "감성", "무드", "내추럴", "빈티지", "포근", "따뜻한", "차분", "미니멀", "심플",
    "클래식", "러블리", "로맨틱", "코지", "cozy", "soft", "warm",
}
STYLE_ALLOWED_ADJECTIVES = STYLE_MOOD_WORDS | {
    "모던", "깔끔", "고급", "아늑한", "은은한", "화사한", "산뜻한", "부드러운",
    "편안한", "트렌디", "세련된", "자연스러운",
}
STYLE_BAD_CONTAINS = {
    "하세요", "해요", "했어요", "합니다", "했다", "하는", "하기", "하며", "해서",
    "보세요", "봤어요", "드려요", "드립니다", "같아요", "같은", "있어요", "있습니다",
    "됩니다", "되는", "느낌이에요", "소개해", "추천해", "사용해", "먹어", "입어",
}
STYLE_NOUN_SUFFIXES = (
    "룩", "코디", "무드", "감성", "스타일", "인테리어", "리빙", "패션", "뷰티",
    "가구", "조명", "공간", "오브제", "소품", "수납", "정리", "식기", "주방",
    "도마", "트레이", "원피스", "니트", "셔츠", "자켓", "가방", "모자", "캡", "일상", "데일리",
    "슈즈", "신발", "향수", "립", "쿠션", "세럼", "크림", "네일", "헤어",
    "요리", "레시피", "브런치", "디저트", "카페", "맛집", "여행", "숙소",
    "러닝", "운동", "필라테스", "요가", "육아", "키즈", "반려동물", "강아지", "고양이", "꿀템", "추천템", "내돈내산", "살림템", "추천"
)


def normalize_style_keyword(term: str) -> str:
    term = safe_text(term).lstrip("#@")
    return term.replace("\u200b", "").strip(" .,!?:;~|/\\[]{}()'\"")


def is_valid_style_keyword(term: str) -> bool:
    term = normalize_style_keyword(term)
    if not term or len(term) < 2 or len(term) > 30:
        return False
    lower = term.lower()
    if lower in GENERIC_STYLE_STOPWORDS:
        return False
    if lower.startswith("http") or term.startswith("@"):
        return False
    if EMAIL_REGEX.fullmatch(term):
        return False
    if re.fullmatch(r"[0-9._-]+", term):
        return False
    if any(ch in term for ch in (" ", "/", "\\", "|")):
        return False
    if any(bad in lower for bad in STYLE_BAD_CONTAINS):
        return False
    # 영단어
    if re.fullmatch(r"[A-Za-z]+(?:-[A-Za-z]+)?", term):
        return len(term) >= 3 and not lower.endswith(("ing", "ed", "ly"))
    # 한글
    if re.fullmatch(r"[가-힣]+", term):
        if term.endswith(("하다", "하기", "하는", "해요", "했다", "합니다", "같다",
                          "같은", "있다", "있어요", "스러운", "스럽게", "적인", "적으로")):
            return False
        if term in STYLE_ALLOWED_ADJECTIVES:
            return True
        if term.endswith(STYLE_NOUN_SUFFIXES):
            return True
        return 2 <= len(term) <= 6
    return False


def _extract_style_keywords_rule(influencer: Dict, summary: Dict, primary_category: str) -> List[str]:
    """LLM 실패 시 사용하는 fallback style-keyword 추출기."""
    ctl = "\n".join(summary.get("captions", [])).lower()
    pt = " ".join([safe_text(influencer.get("fullName")), safe_text(influencer.get("biography"))]).lower()

    ranked: List[tuple] = []
    if primary_category:
        ranked.append((primary_category, 1000.0))

    for hint in CATEGORY_HINTS.get(primary_category, []):
        h = normalize_style_keyword(hint)
        if not is_valid_style_keyword(h):
            continue
        cc = ctl.count(h.lower())
        hc = sum(1 for x in summary.get("top_hashtags", [])
                 if normalize_style_keyword(x).lower() == h.lower())
        s = 0.0
        if cc: s += 120 + cc
        if hc: s += 100 + hc
        if h.lower() in pt: s += 35
        if s: ranked.append((h, s))

    hctr = Counter()
    for h in summary.get("top_hashtags", []):
        t = normalize_style_keyword(h)
        if is_valid_style_keyword(t):
            hctr[t] += 1
    for t, c in hctr.most_common(20):
        ranked.append((t, 60 + c * 3))

    # caption tokens
    tc, dc = Counter(), Counter()
    for cap in summary.get("captions", []):
        toks = []
        for rt in TOKEN_REGEX.findall(safe_text(cap)):
            t = normalize_style_keyword(rt)
            if is_valid_style_keyword(t):
                toks.append(t); tc[t] += 1
        for t in set(toks):
            dc[t] += 1
    for tok, d in dc.items():
        if d >= 2 or tc[tok] >= 3:
            ranked.append((tok, 18 + d * 4 + tc[tok]))

    selected, seen = [], set()
    for t, _ in sorted(ranked, key=lambda x: -x[1]):
        t = normalize_style_keyword(t)
        lo = t.lower()
        if not is_valid_style_keyword(t) or lo in seen:
            continue
        seen.add(lo); selected.append(t)
        if len(selected) >= STYLE_KEYWORD_MAX:
            break
    return selected[:STYLE_KEYWORD_MAX]


def _build_style_keyword_prompt(influencer, summary, primary_category, account_type) -> str:
    return f"""style_keywords를 {STYLE_KEYWORD_MIN}~{STYLE_KEYWORD_MAX}개 추출하세요.

규칙:
- 명사 또는 형용사만 허용 (동사·어미·문장 금지)
- 한 키워드는 1단어
- 계정명/브랜드명/사용자명 제외
- 반복적으로 등장한 핵심 주제어 우선
- 한국어 우선

[계정]
{json.dumps({
    'username': influencer.get('username'),
    'fullName': influencer.get('fullName'),
    'biography': safe_text(influencer.get('biography'))[:200],
    'primary_category': primary_category,
    'account_type': account_type,
    'top_hashtags': summary.get('top_hashtags', [])[:10],
}, ensure_ascii=False)}

[게시물]
{json.dumps(summary['compact_posts'], ensure_ascii=False)}

JSON만: {{"style_keywords":["k1","k2","k3"]}}"""


def extract_style_keywords(client, influencer, summary, primary_category, account_type) -> List[str]:
    try:
        raw = llm_call_with_retry(client, MODEL_NAME, [
            {"role": "system", "content": "엄격한 JSON만 출력."},
            {"role": "user",   "content": _build_style_keyword_prompt(
                influencer, summary, primary_category, account_type)},
        ])
        parsed = safe_parse_json(raw)
    except Exception:
        parsed = None

    cleaned, seen = [], set()
    if parsed:
        for item in (parsed.get("style_keywords", []) or []):
            t = normalize_style_keyword(item)
            lo = t.lower()
            if not is_valid_style_keyword(t) or lo in seen:
                continue
            seen.add(lo); cleaned.append(t)
            if len(cleaned) >= STYLE_KEYWORD_MAX:
                break

    # primary_category를 앞에 꽂기
    if primary_category:
        plo = primary_category.lower()
        if plo not in seen:
            cleaned.insert(0, primary_category); seen.add(plo)

    # 부족하면 rule-based로 보충
    if len(cleaned) < STYLE_KEYWORD_MIN:
        for t in _extract_style_keywords_rule(influencer, summary, primary_category):
            lo = t.lower()
            if lo in seen:
                continue
            cleaned.append(t); seen.add(lo)
            if len(cleaned) >= STYLE_KEYWORD_MIN:
                break

    return cleaned[:STYLE_KEYWORD_MAX]


# =========================
# Output
# =========================
def extract_contact_email(influencer: Dict) -> str:
    d = safe_text(influencer.get("contactEmail"))
    if d:
        return d
    m = EMAIL_REGEX.search(safe_text(influencer.get("biography")))
    return m.group(0) if m else ""


def extract_profile_url(influencer: Dict) -> str:
    u = safe_text(influencer.get("profileUrl")) or safe_text(influencer.get("url"))
    if u:
        return u
    un = safe_text(influencer.get("username"))
    return f"https://www.instagram.com/{un}/" if un else ""


def build_output_row(influencer, acct, cat, style_keywords, grade, confidence) -> Dict[str, Any]:
    return {
        "username":       safe_text(influencer.get("username")),
        "profileUrl":     extract_profile_url(influencer),
        "fullName":       safe_text(influencer.get("fullName")),
        "externalUrl":    safe_text(influencer.get("externalUrl")),
        "contactEmail":   extract_contact_email(influencer),
        "followersCount": int(float(influencer.get("followersCount", 0) or 0)),
        "followsCount":   int(float(influencer.get("followsCount", 0) or 0)),
        "postsCount":     int(float(influencer.get("postsCount", 0) or 0)),
        "profilePicUrl":  safe_text(influencer.get("profilePicUrl")),
        "account_type":     acct,
        "primary_category": cat,
        "style_keywords":   style_keywords,
        "grade":            f"{grade:.2f}/5.00",
        "confidence":       confidence,
    }


def append_debug_log(path: str, entry: Dict) -> None:
    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


# =========================
# Eval
# =========================
def run_evaluation(results: List[Dict], gold_path: str) -> None:
    if not os.path.exists(gold_path):
        print(f"[Eval] Gold set not found: {gold_path}")
        return
    gold = {item["username"]: item for item in load_json(gold_path)}
    cat_correct = type_correct = total = 0
    errors = []
    for row in results:
        u = row["username"]
        if u not in gold:
            continue
        total += 1
        exp = gold[u]
        if row["primary_category"] == exp.get("expected_category"):
            cat_correct += 1
        else:
            errors.append({
                "u": u, "pred": row["primary_category"],
                "exp": exp.get("expected_category"),
            })
        if row["account_type"] == exp.get("expected_account_type"):
            type_correct += 1
    if total == 0:
        print("[Eval] No matches.")
        return
    print(f"\n{'=' * 50}\n[Eval] {total} accounts")
    print(f"  Cat : {cat_correct}/{total} = {cat_correct/total:.1%}")
    print(f"  Type: {type_correct}/{total} = {type_correct/total:.1%}")
    for e in errors[:20]:
        print(f"  ✗ {e['u']}: {e['pred']} → {e['exp']}")
    print("=" * 50)


def upsert_category_only(db: Session, influencer: Influencer, category_name: str):
    """카테고리 할당만 전담하는 보조 함수"""
    category = db.query(Category).filter(Category.category_name == category_name).first()
    if category:
        # 기존 우선순위 1번 카테고리 삭제 후 새로 추가
        db.query(InfluencerCategory).filter(
            InfluencerCategory.influencer_id == influencer.influencer_id,
            InfluencerCategory.priority == 1
        ).delete()
        
        db.add(InfluencerCategory(
            influencer_id=influencer.influencer_id,
            category_id=category.category_id,
            priority=1
        ))

def run_db_classification(db: Session, client: OpenAI, example_bank_path: str):
    # DB에서 아직 카테고리가 없는 인플루언서들을 찾아 AI 분류를 수행합니다.
    influencer = db.query(Influencer).filter(Influencer.primary_category == None).all()
    total = len(influencers)

    example_bank = load_example_bank(example_bank_path)

    for idx, influencer in enumerate(influencers, 1):
        username = influencer.username

        posts_raw = (
            db.query(InfluencerPost)
            .filter(InfluencerPost.influencer_id == influencer.influencer_id)
            .order_by(InfluencerPost.posted_at.desc())
            .limit(12).all())

        posts = [p.to_dict_for_ai() for p in posts_raw]
        summary = build_recent_post_summary(posts)

        grade = final_grade_5(
            score_avg_likes_5(summary["avg_likes_recent12"]),
            score_avg_comments_5(summary["avg_comments_recent12"]),
            score_upload_interval_5(float(influencer.avg_upload_interval_days or 0)),
            score_posts_per_week_5(float(influencer.posts_per_week or 0)),
            score_posts_count_5(float(influencer.posts_count or 0)),
        )

        try:
            inf_dict = influencer.to_dict_for_ai()
            result = classify_account(client, inf_dict, summary, example_bank=example_bank)

            cat  = result["primary_category"]
            acct = result["account_type"]
            conf = result["category_confidence"]

        except Exception as e:
            cat = "라이프스타일"
            acct = _fallback_account_type(influencer, summary)
            conf = 0
            print(f"[{idx}/{total}] {username} AI 분류 실패 → 기본값 적용 ({e})")

        try:
            try:
                style_keywords = extract_style_keywords(client, inf_dict, summary, cat, acct)
            except Exception:
                style_keywords = _extract_style_keywords_rule(influencer, summary, cat)

            # DB에 결과 저장
            influencer.account_type = acct
            influencer.grade_score = grade # 계산된 grade 저장
            influencer.style_keywords_json = style_keywords
            influencer.style_keywords_text = ", ".join(style_keywords)

            upsert_category_only(db, influencer, cat)

            db.commit()
            print(f"✅ {inf.username} 분류 및 DB 업데이트 완료")

        except Exception as e:
            db.rollback()
            print(f"❌ {inf.username} 분류 실패: {e}")



