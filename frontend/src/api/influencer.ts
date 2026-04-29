const BASE_URL = "http://localhost:8000/influencers/";

export async function getInfluencers() {
  const res = await fetch(BASE_URL);

  if (!res.ok) {
    throw new Error("인플루언서 데이터 조회 실패");
  }

  const data = await res.json();

  const list = Array.isArray(data) ? data : data.data;

  if (!Array.isArray(list)) {
    console.error("Unexpected influencer response format:", data);
    return [];
  }

  return list.map((item: any) => ({
    id: String(item.influencer_id),
    name: item.full_name || item.username,
    photo: `/profile_pic_HD/${item.username}.jpg`,
    followers: item.followers_count || 0,
    category: item.primary_category || "기타",
    mainGender: "both",
    mainAge: "25-34",
    selections: Math.floor((item.grade_score || 0) * 100),
    instagram: item.username,
    styleKeywords: item.style_keywords_json || [],
  }));
}
