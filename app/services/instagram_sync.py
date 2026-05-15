"""쇼핑몰 인스타 계정의 팔로잉/좋아요/댓글 활동을 크롤링하여 user_action_log에 적재"""
from __future__ import annotations
from typing import List, Dict
from sqlalchemy.orm import Session
from apify_client import ApifyClient

from app.db.models import Influencer, UserActionLog
from app.crud.user_action_log import create_user_action_log
from app.utils.setting_config import settings


def _get_apify_client() -> ApifyClient:
    return ApifyClient(settings.API_TOKEN)


def _crawl_following(instagram_username: str) -> List[str]:
    """Apify로 계정의 팔로잉 목록 크롤링 → username 리스트 반환"""
    client = _get_apify_client()
    run_input = {
        "usernames": [instagram_username],
        "resultsType": "following",
        "resultsLimit": 5000,
    }
    run = client.actor("apify/instagram-following-scraper").call(run_input=run_input)
    items = client.dataset(run["defaultDatasetId"]).list_items().items
    return [item.get("username") for item in items if item.get("username")]


def _crawl_liked_posts(instagram_username: str) -> List[str]:
    """Apify로 계정이 좋아요한 게시물의 작성자 username 크롤링"""
    client = _get_apify_client()
    run_input = {
        "username": instagram_username,
        "resultsLimit": 200,
    }
    try:
        run = client.actor("apify/instagram-likes-scraper").call(run_input=run_input)
        items = client.dataset(run["defaultDatasetId"]).list_items().items
        return list({item.get("ownerUsername") for item in items if item.get("ownerUsername")})
    except Exception:
        return []


def _crawl_commented_posts(instagram_username: str) -> List[str]:
    """Apify로 계정이 댓글 단 게시물의 작성자 username 크롤링"""
    client = _get_apify_client()
    run_input = {
        "usernames": [instagram_username],
        "resultsType": "comments",
        "resultsLimit": 200,
    }
    try:
        run = client.actor("apify/instagram-comment-scraper").call(run_input=run_input)
        items = client.dataset(run["defaultDatasetId"]).list_items().items
        # 자기 댓글이 달린 게시물의 작성자
        return list({
            item.get("ownerUsername")
            for item in items
            if item.get("ownerUsername") and item.get("ownerUsername") != instagram_username
        })
    except Exception:
        return []


def _match_and_insert_logs(
    db: Session,
    user_id: int,
    usernames: List[str],
    action_type: str,
) -> int:
    """username 리스트를 DB 인플루언서와 매칭하여 로그 적재. 적재 건수 반환."""
    if not usernames:
        return 0

    # DB에서 매칭되는 인플루언서 조회
    matched = (
        db.query(Influencer)
        .filter(Influencer.username.in_(usernames), Influencer.is_active == True)
        .all()
    )

    # 이미 같은 action_type으로 적재된 로그 제외 (중복 방지)
    existing = (
        db.query(UserActionLog.influencer_id)
        .filter(
            UserActionLog.user_id == user_id,
            UserActionLog.action_type == action_type,
        )
        .all()
    )
    existing_ids = {row.influencer_id for row in existing}

    count = 0
    for inf in matched:
        if inf.influencer_id not in existing_ids:
            create_user_action_log(db, user_id, inf.influencer_id, action_type)
            count += 1

    return count


def sync_instagram_logs(db: Session, user_id: int, instagram_username: str) -> Dict:
    """
    쇼핑몰 인스타 계정의 활동을 크롤링하여 user_action_log에 적재.
    Returns: {"follow": N, "like": N, "comment": N}
    """
    result = {"follow": 0, "like": 0, "comment": 0}

    # 1. 팔로잉 목록
    following = _crawl_following(instagram_username)
    result["follow"] = _match_and_insert_logs(db, user_id, following, "instagram_follow")

    # 2. 좋아요 (비공개일 수 있음)
    liked_authors = _crawl_liked_posts(instagram_username)
    result["like"] = _match_and_insert_logs(db, user_id, liked_authors, "instagram_like")

    # 3. 댓글
    commented_authors = _crawl_commented_posts(instagram_username)
    result["comment"] = _match_and_insert_logs(db, user_id, commented_authors, "instagram_comment")

    db.commit()
    return result
