"""쇼핑몰 URL 크롤링 → GPT 분위기 요약"""
from __future__ import annotations
import requests
import openai
from bs4 import BeautifulSoup
from app.utils.setting_config import settings


def crawl_mall_url(url: str) -> str:
    """쇼핑몰 URL에서 텍스트/메타 정보 추출"""
    try:
        res = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        res.raise_for_status()
        soup = BeautifulSoup(res.text, "html.parser")

        # 메타 정보
        parts = []
        title = soup.find("title")
        if title:
            parts.append(title.get_text(strip=True))

        for meta in soup.find_all("meta", attrs={"name": ["description", "keywords"]}):
            content = meta.get("content", "").strip()
            if content:
                parts.append(content)

        # OG 태그
        for meta in soup.find_all("meta", attrs={"property": lambda x: x and x.startswith("og:")}):
            content = meta.get("content", "").strip()
            if content and not content.startswith("http"):
                parts.append(content)

        # 본문 텍스트 (상위 500자)
        for tag in soup.find_all(["script", "style", "nav", "footer", "header"]):
            tag.decompose()
        body_text = soup.get_text(separator=" ", strip=True)[:2000]
        parts.append(body_text)

        return "\n".join(parts)[:3000]
    except Exception as e:
        print(f"⚠️ 크롤링 실패: {e}")
        return ""


def summarize_mall_mood(crawled_text: str) -> str:
    """GPT로 쇼핑몰 분위기 요약"""
    if not crawled_text.strip():
        return ""

    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 쇼핑몰 분위기 분석 전문가입니다. "
                    "아래 쇼핑몰 웹사이트 텍스트를 보고, 쇼핑몰의 전체적인 분위기, 타겟 고객층, "
                    "주요 카테고리, 스타일 키워드를 한국어로 2~3문장으로 요약하세요. "
                    "인플루언서 매칭에 활용할 수 있도록 구체적으로 작성하세요."
                ),
            },
            {"role": "user", "content": crawled_text[:2000]},
        ],
        temperature=0.3,
        max_tokens=200,
    )
    return response.choices[0].message.content.strip()


def analyze_mall(url: str) -> str:
    """URL 크롤링 → GPT 요약 통합"""
    crawled = crawl_mall_url(url)
    if not crawled:
        return ""
    return summarize_mall_mood(crawled)
