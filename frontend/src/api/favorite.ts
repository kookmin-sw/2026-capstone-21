const BASE_URL = "http://localhost:8000/favorites";

// 토큰 자동 붙이기
function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// 관심 등록 + 메모 저장
export async function addFavorite(influencerId: number, reason: string = "") {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      influencer_id: influencerId,
      reason,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

// 관심 토글
export async function toggleFavorite(influencerId: number) {
  const res = await fetch(`${BASE_URL}/${influencerId}/toggle`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

// 관심 목록 조회
export async function getFavorites() {
  const res = await fetch(`${BASE_URL}/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

// 관심 삭제
export async function deleteFavorite(influencerId: number) {
  const res = await fetch(`${BASE_URL}/${influencerId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

// 메모 수정
export async function updateFavoriteMemo(
  influencerId: number,
  reason: string
) {
  const res = await fetch(`${BASE_URL}/${influencerId}/reason`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}