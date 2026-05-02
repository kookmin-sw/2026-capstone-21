import { Influencer } from '../app/types';

const BASE_URL = "http://localhost:8000/influencers/";

export async function getInfluencers(): Promise<Influencer[]> {
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

  return list.map((item: any): Influencer => ({
    id: String(item.influencer_id),

    // 이름
    name: item.full_name || item.username || "이름 없음",

    // 유저네임
    username: item.username || "",

    // 이미지
    photo: item.profile_pic_url
      ? item.profile_pic_url
      : `/profile_pic_HD/${item.username}.jpg`,

    // 팔로워
    followers: item.followers_count || 0,

    // 카테고리
    category: item.primary_category || "기타",

    // 임시값
    mainGender: "both",
    mainAge: "25-34",

    // 선택 수
    // 실제 selection_count가 있으면 사용하고, 없으면 0
    selections: item.selection_count || item.selections || 0,

    // Grade Score
    gradeScore: Number(item.grade_score || 0),

    // 기존 필드 유지
    instagram: item.username || "",

    // 키워드
    styleKeywords: item.style_keywords_json || [],
  }));
}
