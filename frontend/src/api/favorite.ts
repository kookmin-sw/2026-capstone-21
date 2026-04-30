const BASE_URL = "http://localhost:8000/favorites";

export async function toggleFavorite(influencerId: number) {
  const res = await fetch(${BASE_URL}/${influencerId}/toggle, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) throw new Error("toggle 실패");
  return res.json();
}

export async function getFavorites() {
  const res = await fetch(BASE_URL, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("조회 실패");
  return res.json();
}

export async function deleteFavorite(influencerId: number) {
  const res = await fetch(${BASE_URL}/${influencerId}, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) throw new Error("삭제 실패");
  return res.json();
}

export async function updateFavoriteMemo(
  influencerId: number,
  reason: string
) {
  const res = await fetch(${BASE_URL}/${influencerId}/reason, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) throw new Error("메모 수정 실패");
  return res.json();
}
