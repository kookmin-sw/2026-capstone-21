const BASE_URL = "http://localhost:8000/favorites";

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: Bearer ${token},
    "Content-Type": "application/json",
  };
}

export async function toggleFavorite(influencerId: number) {
  const res = await fetch(${BASE_URL}/${influencerId}/toggle, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("toggle 실패");
  return res.json();
}

export async function getFavorites() {
  const res = await fetch(BASE_URL, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("조회 실패");
  return res.json();
}

export async function deleteFavorite(influencerId: number) {
  const res = await fetch(${BASE_URL}/${influencerId}, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("삭제 실패");
  return res.json();
}
