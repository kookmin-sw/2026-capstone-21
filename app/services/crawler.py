import os
import requests
import pandas as pd
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.db.models import Influencer
from app.crud.influencer import create_influencer_posts, create_related_relations
from app.seed.seed_influencers import upsert_influencer
from app.utils.config import client, MIN_FOLLOWERS, MIN_POSTS, FOLLOW_RATIO, ENGAGEMENT_RATE

class CrawlerService:
    def __init__(self, db: Session, save_folder: str = "static/profile_pics"):
        self.db = db
        self.save_folder = save_folder
        if not os.path.exists(self.save_folder):
            os.makedirs(self.save_folder)

    def _save_to_db(self, final_df):
        count = 0
        for _, row in final_df.iterrows():
            inf_item = row.to_dict()

            metrics = calculate_upload_metrics_dict(inf_item.get('latestPosts', []))
            inf_item.update(metrics)

            profile_pic_path = self.download_image_locally(inf_item)
            inf_item['profilePicUrl'] = profile_pic_path

            db_influencer = upsert_influencer(self.db, inf_item)
            if not db_influencer:
                continue
            
            if 'latestPosts' in inf_item  and inf_item ['latestPosts']:
                create_influencer_posts(self.db, db_influencer.influencer_id, inf_item['latestPosts'])

            if 'relatedProfiles' in inf_item and inf_item['relatedProfiles']:
                related_unames = [r.get('username') for r in inf_item['relatedProfiles'] if r.get('username')]
                create_related_relations(self.db, db_influencer.influencer_id, related_unames)
            
            count += 1
        
        self.db.commit()
        return count
    
    def run_targeted_crawl(self, base_seeds: list[str] = None, filters: dict = None):
        existing_users = self.db.query(Influencer.username).all()
        existing_usernames = {u.username for u in existing_users}

        max_limit = filters.get('max_results', 50)

        if base_seeds:
            final_df = expand_seed(existing_usernames = existing_usernames, base_seeds=base_seeds, max_limit=max_limit)
        else:
            final_df = pd.DataFrame()

        if final_df.empty:
            return 0
        
        final_df = preprocess_df(
            final_df, 
            min_f=filters.get('min_followers', MIN_FOLLOWERS),
            min_p=filters.get('min_posts', MIN_POSTS),
            f_ratio=filters.get('follow_ratio', FOLLOW_RATIO),
            e_rate=filters.get('engagement_rate', ENGAGEMENT_RATE)
        )

        return self._save_to_db(final_df)

    def download_image_locally(self, row: dict) -> str:
        url = str(row.get('profilePicUrlHD', '')).replace(r'\/', '/')
        username = row.get('username')
        
        if not url or pd.isna(url) or not username:
            return ""
            
        file_name = f"{username}.jpg"
        file_path = os.path.join(self.save_folder, file_name)
        
        if os.path.exists(file_path):
            return file_path

        headers = {"User-Agent": "Mozilla/5.0"}
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                with open(file_path, 'wb') as f:
                    f.write(response.content)
                return file_path
        except Exception as e:
            print(f"⚠️ 이미지 다운로드 실패({username}): {e}")
            
        return ""

def filter_influencer(row, min_f=MIN_FOLLOWERS, min_p=MIN_POSTS, f_ratio=FOLLOW_RATIO, e_rate=ENGAGEMENT_RATE):
    
    followers = row.get('followersCount', 0)
    follows = row.get('followsCount', 0)
    posts_count = row.get('postsCount', 0)

    if followers < min_f or posts_count < min_p:
        return False
    if (followers / max(1, follows)) < f_ratio:
        return False

    latest_posts = row.get('latestPosts')

    if not isinstance(latest_posts, list) or len(latest_posts) == 0:
        return False

    total_engagement = 0
    valid_post_count = 0
    now = datetime.now(timezone.utc)

    for post in latest_posts:
        post_time_str = post.get('timestamp')
        if not post_time_str:
            continue
            
        post_time = datetime.fromisoformat(post_time_str.replace('Z', '+00:00'))

        if (now - post_time) > timedelta(hours=24):
            likes = post.get('likesCount', 0)
            comments = post.get('commentsCount', 0)
            total_engagement += (likes + comments)
            valid_post_count += 1

    if valid_post_count == 0:
        return False

    avg_engagement_per_post = total_engagement / valid_post_count
    avg_en_rate = avg_engagement_per_post / followers


    if avg_en_rate < e_rate:
        return False
            
    return True

def preprocess_df(df, min_f=MIN_FOLLOWERS, min_p=MIN_POSTS, f_ratio=FOLLOW_RATIO, e_rate=ENGAGEMENT_RATE):
    df_unique = df.drop_duplicates(subset=['username'], keep='first').copy()

    for col in ['followersCount', 'followsCount', 'postsCount']:
        df_unique[col] = pd.to_numeric(df_unique[col], errors='coerce').fillna(0)
    
    influencer_df = df_unique[df_unique.apply(filter_influencer, axis=1,args=(min_f, min_p, f_ratio, e_rate))].copy()
    influencer_df = influencer_df.sort_values(by='followersCount', ascending=False).reset_index(drop=True)

    return influencer_df

def username_to_df(targets, client=client):
    urls = [f"https://www.instagram.com/{un}/" for un in targets]
    run_input = {
        "directUrls": urls,        # 생성한 URL 리스트
        "resultsLimit": 1,                 # 한 사람당 게시물 1개씩만
        "resultsType": "details",            # 게시물을 가져올 것인지
        "searchType": "user",              # 유저 기반 탐색
        "proxyConfiguration": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        }
    }

    run = client.actor("shu8hvrXbJbY3Eb9W").call(run_input=run_input)
    dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
    df = pd.DataFrame(dataset_items)
    df = preprocess_df(df)
    return df

def expand_seed(existing_usernames = {}, seed_brand = [], client=client, max_limit=50):
    seed_targets = []
    for seed in seed_brand:
        run_input = {
            "hashtags": [seed],
            "onlyPostsNewerThan": "2025-09-01",
            "keywordSearch": True,
            "resultsType": "posts",
            "resultsLimit": max_limit,
            "proxyConfiguration": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]}
        }

        run = client.actor("apify/instagram-hashtag-scraper").call(run_input=run_input)
        dataset_items = client.dataset(run["defaultDatasetId"]).list_items().items
        hashtag_df = pd.DataFrame(dataset_items)
        seed_targets.extend(hashtag_df['ownerUsername'].dropna().unique().tolist())

    new_targets = [u for u in set(seed_targets) if u not in existing_usernames]
    print(f"최종 신규 수집 타겟: {len(new_targets)}명")

    seed_df = username_to_df(new_targets)

    return seed_df

def calculate_upload_metrics_dict(latest_posts: list):
    """Pandas Series 대신 일반 Dict를 반환하여 DB 처리를 용이하게 함"""
    if not latest_posts:
        return {'avg_upload_interval_days': 0, 'posts_per_week': 0}
    
    dates = []
    for p in latest_posts:
        ts = p.get('timestamp')
        if ts:
            dates.append(pd.to_datetime(ts))
    
    if len(dates) < 2:
        return {'avg_upload_interval_days': 0, 'posts_per_week': 0}
    
    dates.sort()
    intervals = [(dates[i] - dates[i-1]).total_seconds() / (24 * 3600) for i in range(1, len(dates))]
    avg_interval = sum(intervals) / len(intervals)
    
    return {
        'avg_upload_interval_days': round(avg_interval, 1),
        'posts_per_week': round(7 / avg_interval, 1) if avg_interval > 0 else 0
    }