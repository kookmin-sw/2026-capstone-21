import pandas as pd
from datetime import datetime, timedelta, timezone
import os
from sqlalchemy.orm import Session
from app.utils.config import client, MIN_FOLLOWERS, MIN_POSTS, FOLLOW_RATIO, ENGAGEMENT_RATE
from app.seed.seed_influencers import upsert_influencer

class CrawlerService:
    def __init__(self, db: Session):
        self.db = db

    def run_full_crawl_pipeline(self):
        existing_users = self.db.query(Influencer.username).all()
        existing_usernames = {u.username for u in existing_users}
        print(f"기존 데이터를 DB에서 불러왔습니다: {len(existing_usernames)}명")

        seeds_df = expand_seed(existing_usernames = existing_usernames)
        brands_df = expand_brand(existing_usernames = existing_usernames)

        final_df = pd.concat([seeds_df, brands_df], ignore_index=True).drop_duplicates(subset=['username'])
        final_df = get_from_related(final_df)

        count = 0
        for _, row in final_df.iterrows():
            inf_item = row.to_dict()
            db_influencer = upsert_influencer(self.db, inf_item)

            # 2. 게시물 정보 찢어서 저장 (Original build_db 로직)
            if 'latestPosts' in row and row['latestPosts']:
                create_influencer_posts(self.db, db_influencer.influencer_id, row['latestPosts'])

            # 3. 연관 관계 찢어서 저장 (Original related_db 로직)
            if 'relatedProfiles' in row and row['relatedProfiles']:
                related_unames = [r.get('username') for r in row['relatedProfiles'] if r.get('username')]
                create_related_relations(self.db, db_influencer.influencer_id, related_unames)
            
            count += 1
        
        self.db.commit()
        return count
    
    def run_targeted_crawl(self, keywords: list[str]):
        # 기존 expand_seed와 유사하지만, SEED_BRAND 대신 넘겨받은 keywords를 사용
        print(f"타겟 키워드 {keywords}로 크롤링을 시작합니다.")
        
        # 1. 키워드 기반 타겟 수집 (기존 로직 재활용)
        new_df = self.expand_seed(seed_brand=keywords)
        count = 0
        for _, row in new_df.iterrows():
            inf_item = row.to_dict()
            db_influencer = upsert_influencer(self.db, inf_item)

            # 2. 게시물 정보 찢어서 저장 (Original build_db 로직)
            if 'latestPosts' in row and row['latestPosts']:
                create_influencer_posts(self.db, db_influencer.influencer_id, row['latestPosts'])

            # 3. 연관 관계 찢어서 저장 (Original related_db 로직)
            if 'relatedProfiles' in row and row['relatedProfiles']:
                related_unames = [r.get('username') for r in row['relatedProfiles'] if r.get('username')]
                create_related_relations(self.db, db_influencer.influencer_id, related_unames)
            
            count += 1
        
        self.db.commit()
        return count


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

    influencer_df = influencer_df.sort_values(by='followersCount', ascending=False)

    print(f"전체 데이터: {len(df)}개")
    print(f"중복 제거 후: {len(df_unique)}개")
    print(f"최종 검증된 인플루언서: {len(influencer_df)}명")

    return influencer_df

def get_from_related(df, client=client):
    existing = set(df['username'].unique())
    related_series = df['relatedProfiles'].dropna().explode()
    related_usernames = set(related_series.apply(lambda x: x.get('username') if isinstance(x, dict) else None).dropna())
 
    new_targets = [u for u in related_usernames if u not in existing]

    profile_urls = [f"https://www.instagram.com/{un}/" for un in new_targets]

    profile_run_input = {
        "directUrls": profile_urls,        # 생성한 URL 리스트
        "resultsLimit": 1,                 # 한 사람당 게시물 1개씩만
        "resultsType": "details",            # 게시물을 가져올 것인지
        "searchType": "user",              # 유저 기반 탐색
        "proxyConfiguration": {
            "useApifyProxy": True,
            "apifyProxyGroups": ["RESIDENTIAL"]
        }
    }

    profile_run = client.actor("shu8hvrXbJbY3Eb9W").call(run_input=profile_run_input)
    dataset_items = client.dataset(profile_run["defaultDatasetId"]).list_items().items
    new_details = pd.DataFrame(dataset_items)
    new_details = preprocess_df(new_details)

    final_df = pd.concat([df, new_details], ignore_index=True)

    return final_df

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

def expand_brand(existing_usernames = {}, base_brands = [], client=client):
    extended_brands = set(base_brands)
    brand_targets = []
    for brand in base_brands:

        # 브랜드 상세 정보 -> 연관계정 크롤링
        brand_detail_input = {
            "directUrls": [f"https://www.instagram.com/{brand}/"],
            "resultsType": "details",
            "proxyConfiguration": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]}
        }
        
        run = client.actor("shu8hvrXbJbY3Eb9W").call(run_input=brand_detail_input)
        items = client.dataset(run["defaultDatasetId"]).list_items().items
        related = items[0].get('relatedProfiles', [])
        for r in related:
            extended_brands.add(r['username'])

    for brand in extended_brands:
        # 브랜드를 '태그한 게시물' 작성자
        tagged_run_input = {
            "directUrls": [f"https://www.instagram.com/{brand}/tagged/"],
            "resultsType": "posts",
            "resultsLimit": 30, # 브랜드당 최신 태그 게시물 30개 탐색
            "proxyConfiguration": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]}
        }

        tagged_run = client.actor("shu8hvrXbJbY3Eb9W").call(run_input=tagged_run_input)
        tagged_items = client.dataset(tagged_run["defaultDatasetId"]).list_items().items
        for item in tagged_items:
            username = item.get('ownerUsername')
            if username:
                brand_targets.append(username)

        # 브랜드가 태그한 유저
        tag_input = {
            "directUrls": [f"https://www.instagram.com/{brand}/"],
            "resultsType": "details", # 최신 게시물의 mentions를 가져오기 위함
            "proxyConfiguration": {"useApifyProxy": True, "apifyProxyGroups": ["RESIDENTIAL"]}
        }
        tag_run = client.actor("shu8hvrXbJbY3Eb9W").call(run_input=tag_input)
        tag_items = client.dataset(tag_run["defaultDatasetId"]).list_items().items
        
        if tag_items:
            latest_posts = tag_items[0].get('latestPosts', [])
            for post in latest_posts:
                mentions = post.get('mentions', [])
                if isinstance(mentions, list):
                    brand_targets.extend(mentions)
        
    new_targets = [u for u in set(brand_targets) if u not in existing_usernames]
    print(f"최종 신규 수집 타겟: {len(new_targets)}명")

    brand_df = username_to_df(new_targets)

    return brand_df

def expand_seed(existing_usernames = {}, seed_brand = [], client=client):
    seed_targets = []
    for seed in seed_brand:
        run_input = {
            "hashtags": [seed],
            "onlyPostsNewerThan": "2025-09-01",
            "keywordSearch": True,
            "resultsType": "posts",
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

def download_image(row):
    url = str(row['profilePicUrlHD']).replace(r'\/', '/')
    username = row['username']

    if username in existing_files:
        return
    
    if pd.isna(url):
        print(f"URL 없음: {username}")
        return
    
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
        
    try:
        response = requests.get(url, headers=headers, timeout=10)
        file_path = os.path.join(save_folder, f"{username}.jpg")
        with open(file_path, 'wb') as f:
            f.write(response.content)
        print(f"✅ 성공: {username}")

    except Exception as e:
        print(f"⚠️ 네트워크 건너뜀({username}): {e}")

def calculate_upload_metrics(group):
    group = group.sort_values(by='timestamp', ascending=True)

    # 게시물 간의 시간 차이 계산
    intervals = group['timestamp'].diff().dt.total_seconds() / (24 * 3600)
    avg_interval = intervals.mean()
    
    return pd.Series({
        'avg_upload_interval_days': round(avg_interval, 1) if not pd.isna(avg_interval) else 0,
        'posts_per_week': round(7 / avg_interval, 1) if avg_interval and avg_interval > 0 else 0
    })

def build_db(final_df):
    # recent Post DB (관계형 DB)
    post_list = []
    related_list = []

    for _, row in final_df.iterrows():
        username = row.get('username')
        latest_posts = row.get('latestPosts')
        related = row.get('relatedProfiles')

        if isinstance(latest_posts, list):
            for post in latest_posts:
                post_entry = {
                    'username': username,  # F.K.
                    'postId': post.get('id'),
                    'type': post.get('type'),
                    'caption': post.get('caption'),
                    'likesCount': post.get('likesCount', 0),
                    'commentsCount': post.get('commentsCount', 0),
                    'timestamp': post.get('timestamp'),
                    'url': post.get('url'),
                    'displayUrl': post.get('displayUrl'),
                    'hashtags' : post.get('hashtags'),
                    'mentions' : post.get('mentions'),
                }
                post_list.append(post_entry)

        if isinstance(related, list):
            for r in related:
                related_list.append({
                    'from_username': username, # 기준 유저
                    'related_username': r.get('username') # 추천된 유저
                })
                
    post_df = pd.DataFrame(post_list)
    post_df['timestamp'] = pd.to_datetime(post_df['timestamp'], errors='coerce')
    post_df.to_json("posts_db.json", orient="records", force_ascii=False, indent=4)

    related_df = pd.DataFrame(related_list).drop_duplicates()
    related_df.to_json("related_db.json", orient="records", force_ascii=False, indent=4)
    return post_df, related_df

def upload_db(final_df):
    post_df, related_df = build_db(final_df)
    upload_stats = post_df.sort_values(['username', 'timestamp'], ascending=[True, False]) \
                    .groupby('username') \
                    .head(10) \
                    .groupby('username') \
                    .apply(calculate_upload_metrics)

    final_df = final_df.merge(upload_stats, on='username', how='left')

    # influencers DB
    columns_to_keep = [
        'username', 'fullName', 'followersCount', 'followsCount', 
        'postsCount', 'biography', 'externalUrl', 'profilePicUrl',
        'avg_upload_interval_days','posts_per_week'
    ]
    df_cleaned = final_df[final_df.columns.intersection(columns_to_keep)].copy().reset_index(drop=True)

    df_cleaned.to_json("influencers_result.json", orient="records", force_ascii=False, indent=4)
    # df_cleaned.to_csv("influencers_result.csv")
