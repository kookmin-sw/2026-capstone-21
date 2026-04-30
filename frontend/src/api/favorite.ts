const BASE_URL = "http://localhost:8000/favorites";

export async function toggleFavorite(influencerId: number) {
  const res = await fetch(`${BASE_URL}/${influencerId}/toggle`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function getFavorites() {
  const res = await fetch(`${BASE_URL}/`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function deleteFavorite(influencerId: number) {
  const res = await fetch(`${BASE_URL}/${influencerId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}

export async function updateFavoriteMemo(
  influencerId: number,
  reason: string
) {
  const res = await fetch(`${BASE_URL}/${influencerId}/reason`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}