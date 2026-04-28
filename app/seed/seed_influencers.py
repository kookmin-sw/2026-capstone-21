import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Category, Influencer, InfluencerCategory


CATEGORY_ALIAS_MAP = {
    "푸드맛집": "푸드·맛집",
    "헬스웰니스": "헬스·웰니스",
    "육아가족": "육아·가족",
}


def normalize_category_name(category_name: str | None) -> str | None:
    if not category_name:
        return None
    return CATEGORY_ALIAS_MAP.get(category_name, category_name)


def parse_grade(grade_value: Any) -> float | None:
    if not grade_value:
        return None

    if isinstance(grade_value, (int, float)):
        return float(grade_value)

    if isinstance(grade_value, str):
        value = grade_value.strip()
        if not value:
            return None

        if "/" in value:
            value = value.split("/")[0].strip()

        try:
            return float(value)
        except ValueError:
            return None

    return None


def get_category_by_name(db: Session, category_name: str) -> Category | None:
    return db.query(Category).filter(Category.category_name == category_name).first()


def upsert_influencer(db: Session, item: dict):
    username = item.get("username")
    if not username:
        return

    influencer = db.query(Influencer).filter(Influencer.username == username).first()

    style_keywords = item.get("style_keywords") or []
    if not isinstance(style_keywords, list):
        style_keywords = []

    style_keywords_text = ", ".join([str(x) for x in style_keywords]) if style_keywords else None
    primary_category_name = normalize_category_name(item.get("primary_category"))

    if influencer is None:
        influencer = Influencer(
            username=username,
            profile_url=item.get("profileUrl"),
            full_name=item.get("fullName"),
            external_url=item.get("externalUrl"),
            contact_email=item.get("contactEmail") or None,
            followers_count=item.get("followersCount"),
            follows_count=item.get("followsCount"),
            posts_count=item.get("postsCount"),
            # profile_pic_url=item.get("profilePicUrl"),
            profile_pic_url= f"/data/profile_pics/{username}.jpg",
            account_type=item.get("account_type"),
            grade_score=parse_grade(item.get("grade")),
            style_keywords_json=style_keywords,
            style_keywords_text=style_keywords_text,
        )
        db.add(influencer)
        db.flush()
    else:
        influencer.profile_url = item.get("profileUrl")
        influencer.full_name = item.get("fullName")
        influencer.external_url = item.get("externalUrl")
        influencer.contact_email = item.get("contactEmail") or None
        influencer.followers_count = item.get("followersCount")
        influencer.follows_count = item.get("followsCount")
        influencer.posts_count = item.get("postsCount")
        influencer.profile_pic_url = item.get("profilePicUrl")
        influencer.account_type = item.get("account_type")
        influencer.grade_score = parse_grade(item.get("grade"))
        influencer.style_keywords_json = style_keywords
        influencer.style_keywords_text = style_keywords_text

    if primary_category_name:
        category = get_category_by_name(db, primary_category_name)

        if category is None:
            print(f"[경고] category 테이블에 없는 카테고리: {primary_category_name}")
            return

        # 현재 JSON에서는 카테고리 1개만 제공되므로 1순위(priority=1)로 저장
        db.query(InfluencerCategory).filter(
            InfluencerCategory.influencer_id == influencer.influencer_id
        ).delete()

        db.add(
            InfluencerCategory(
                influencer_id=influencer.influencer_id,
                category_id=category.category_id,
                priority=1,
            )
        )


def seed_from_json_file(json_path: str):
    db = SessionLocal()
    try:
        path = Path(json_path)
        if not path.exists():
            raise FileNotFoundError(f"JSON 파일을 찾을 수 없습니다: {json_path}")

        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not isinstance(data, list):
            raise ValueError("JSON 최상위 구조는 list여야 합니다.")

        for item in data:
            upsert_influencer(db, item)

        db.commit()
        print(f"저장 완료: {len(data)}개")
    except Exception as e:
        db.rollback()
        print("에러 발생:", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_from_json_file("classified_influencers_result.json")