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

BASE_BRAND = ["todayhouse", "ggumigi", "ikeakorea", "housegram_", "danim_home"]
SEED_BRAND = ["홈데코", "단순제공", "광고", "협찬", "유료광고포함", "제품제공", "단순선물", "서포터즈", "협업문의", "광고문의", "프로필링크"]