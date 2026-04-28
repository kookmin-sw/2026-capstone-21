# 필터 조건
MIN_FOLLOWERS = 1000
MIN_POSTS = 40
FOLLOW_RATIO = 1.3

# 업로드한지 24시간이 지난 최신 게시물 중에 좋아요 + 댓글 수가 팔로워 수의 10% 이하인 인플루언서는 정리
ENGAGEMENT_RATE = 0.03

from apify_client import ApifyClient
import os

API_TOKEN = os.getenv("API_TOKEN")

client = ApifyClient(API_TOKEN)

ACTION_REWARD_MAP = {
    "view": 1,
    "favorite_add": 2,
    "favorite_remove": -2,
    "contact": 3,
}