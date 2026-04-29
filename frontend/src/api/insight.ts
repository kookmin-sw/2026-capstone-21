const BASE_URL = "http://localhost:8000/insights";

// 1. 전체 선택 수
export async function getTotalSelections() {
  const res = await fetch(`${BASE_URL}/total-selections`);
  if (!res.ok) throw new Error("total-selections 실패");
  return res.json();
}

// 2. 인기 인플루언서
export async function getTopPerformer() {
  const res = await fetch(`${BASE_URL}/top-performer`);
  if (!res.ok) throw new Error("top-performer 실패");
  return res.json();
}

// 3. 전체 인플루언서 수
export async function getTotalInfluencers() {
  const res = await fetch(`${BASE_URL}/total-influencers`);
  if (!res.ok) throw new Error("total-influencers 실패");
  return res.json();
}

// 4. 일별 트렌드
export async function getDailyTrends() {
  const res = await fetch(`${BASE_URL}/daily-trends`);
  if (!res.ok) throw new Error("daily-trends 실패");
  return res.json();
}

// 5. 카테고리 분포
export async function getCategoryDistribution() {
  const res = await fetch(`${BASE_URL}/category-distribution`);
  if (!res.ok) throw new Error("category-distribution 실패");
  return res.json();
}

// 6. 인플루언서 비교
export async function compareInfluencers(i1: number, i2: number) {
  const res = await fetch(
    `${BASE_URL}/compare?i1=${i1}&i2=${i2}`
  );
  if (!res.ok) throw new Error("compare 실패");
  return res.json();
}
