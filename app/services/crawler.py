from apify_client import ApifyClient
import pandas as pd
from datetime import datetime, timedelta, timezone
import numpy as np
import os

from util import expand_seed, expand_brand, get_from_related, upload_db
from config import client

# 기존 불러오기
if True: 
    if os.path.exists("influencers_result.json"):
        existing_df = pd.read_json("influencers_result.json")
    else:
        existing_df = pd.DataFrame()

    if os.path.exists("posts_db.json"):
        posts_db = pd.read_json("posts_db.json")
    else:
        posts_db = pd.DataFrame()
        
    if os.path.exists("related_db.json"):
        related_db = pd.read_json("related_db.json")
    else:
        related_db = pd.DataFrame()
        
    existing_usernames = set(existing_df['username'].unique()) if not existing_df.empty else set()
        
    print(f"기존 데이터를 불러왔습니다: {len(existing_usernames)}명")



seeds_df = expand_seed(existing_usernames = existing_usernames)
brands_df = expand_brand(existing_usernames = existing_usernames)

final_df = pd.concat([seeds_df, brands_df], ignore_index=True).drop_duplicates(subset=['username'])
final_df = get_from_related(final_df)
upload_db(final_df)

