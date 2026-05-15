import requests
import time
import statistics

BASE = "http://3.34.240.60:8000"
USER_ID = 1

QUERIES = [
    "따뜻한 분위기의 인테리어 소품을 홍보할 인플루언서",
    "운동복 브랜드와 어울리는 피트니스 인플루언서",
    "고양이 용품 판매에 적합한 반려동물 계정",
    "미니멀 패션 브랜드에 맞는 스타일리시한 인플루언서",
    "유기농 식품 쇼핑몰에 어울리는 건강 라이프 계정",
    "아기 옷 쇼핑몰 홍보할 육아 인플루언서",
    "캠핑 장비 판매에 적합한 아웃도어 인플루언서",
    "카페 창업 관련 콘텐츠를 만드는 인플루언서",
    "독서 모임이나 북클럽 관련 계정",
    "빈티지 가구 쇼핑몰에 어울리는 인테리어 계정",
    "다이어트 보조제를 홍보할 헬스 인플루언서",
    "제주도 여행 상품을 홍보할 여행 인플루언서",
    "네일아트 제품 판매에 적합한 뷰티 인플루언서",
    "친환경 생활용품 브랜드에 맞는 라이프스타일 계정",
    "강아지 간식 브랜드와 어울리는 펫 인플루언서",
    "홈트레이닝 기구를 홍보할 운동 인플루언서",
    "수제 디저트 쇼핑몰에 어울리는 푸드 인플루언서",
    "아이 교육 관련 콘텐츠를 만드는 육아 계정",
    "스트릿 패션 브랜드에 맞는 힙한 인플루언서",
    "플라워 클래스를 홍보할 라이프스타일 인플루언서",
]

CATEGORIES = ["패션", "뷰티", "인테리어", "리빙", "푸드·맛집", "여행", "헬스·웰니스", "육아·가족", "반려동물", "라이프스타일"]

def create_input(text, category_idx):
    """Create a mall input and return its input_id"""
    resp = requests.post(f"{BASE}/mall-inputs/", json={
        "user_id": USER_ID,
        "input_text": text,
    })
    return resp.json()["input_id"]

def run_recommendation(input_id, category=None):
    """Run recommendation and return response time in seconds"""
    params = {"input_id": input_id, "user_id": USER_ID}
    if category:
        params["category"] = category
    start = time.time()
    resp = requests.post(f"{BASE}/recommendations/predict", params=params)
    elapsed = time.time() - start
    return elapsed, resp.status_code

print("=" * 60)
print("Link:D Match 추천 API 벤치마크")
print("=" * 60)

# Warmup
print("\n🔥 Warmup (첫 실행 - 모델 로딩 포함, 측정 제외)...")
warmup_id = create_input("워밍업 테스트 쿼리", 0)
warmup_time, warmup_status = run_recommendation(warmup_id)
print(f"   Warmup 완료: {warmup_time:.2f}s (status: {warmup_status})")

# Benchmark
print(f"\n📊 벤치마크 시작 (20회, 매번 다른 쿼리)\n")
print(f"{'#':>3} {'Query':40} {'Category':10} {'Time':>8} {'Status':>6}")
print("-" * 75)

times = []
for i, query in enumerate(QUERIES):
    cat = CATEGORIES[i % len(CATEGORIES)]
    input_id = create_input(query, i)
    elapsed, status = run_recommendation(input_id, category=cat)
    times.append(elapsed)
    short_query = query[:38] + ".." if len(query) > 40 else query
    print(f"{i+1:3} {short_query:40} {cat:10} {elapsed:7.3f}s {status:>6}")

# Results
print("\n" + "=" * 60)
print("📈 결과 요약")
print("=" * 60)
print(f"  총 실행 횟수:  {len(times)}회")
print(f"  평균 응답시간:  {statistics.mean(times):.3f}s")
print(f"  중앙값:        {statistics.median(times):.3f}s")
print(f"  최소:          {min(times):.3f}s")
print(f"  최대:          {max(times):.3f}s")
print(f"  표준편차:      {statistics.stdev(times):.3f}s")
print(f"  P90:           {sorted(times)[int(len(times)*0.9)-1]:.3f}s")
print(f"  P95:           {sorted(times)[int(len(times)*0.95)-1]:.3f}s")
print(f"  총 소요시간:   {sum(times):.2f}s")
