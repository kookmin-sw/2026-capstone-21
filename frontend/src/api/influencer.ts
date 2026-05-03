import { Influencer } from "../app/types";

// @ts-ignore
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const FETCH_URL = API_BASE_URL.endsWith("/")
  ? `${API_BASE_URL}influencers/`
  : `${API_BASE_URL}/influencers/`;

export async function getInfluencers(): Promise<Influencer[]> {
  // 핵심: ngrok 경고창을 무시하는 헤더를 추가합니다.
  const res = await fetch(FETCH_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  });

  if (!res.ok) {
    throw new Error("인플루언서 데이터 조회 실패");
  }

  const data = await res.json();
  const list = Array.isArray(data) ? data : data.data;

  if (!Array.isArray(list)) {
    console.error("Unexpected influencer response format:", data);
    return [];
  }

  return list.map(
    (item: any): Influencer => ({
      id: String(item.influencer_id),
      name: item.full_name || item.username || "이름 없음",
      username: item.username || "",
      photo: item.profile_pic_url
        ? item.profile_pic_url
        : `/profile_pic_HD/${item.username}.jpg`,
      followers: item.followers_count || 0,
      category: item.primary_category || "기타",
      mainGender: "both",
      mainAge: "25-34",
      selections: item.selection_count || item.selections || 0,
      gradeScore: Number(item.grade_score || 0),
      instagram: item.username || "",
      styleKeywords: item.style_keywords_json || [],
    }),
  );
}
