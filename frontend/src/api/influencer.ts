export async function getInfluencers() {
  const res = await fetch("http://localhost:8000/influencers/");

  if (!res.ok) {
    throw new Error("인플루언서 데이터 조회 실패");
  }

  const data = await res.json();

  return data.map((item: any) => ({
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
