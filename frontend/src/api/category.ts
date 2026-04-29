export async function getCategories(): Promise<string[]> {
  try {
    const res = await fetch("http://localhost:8000/categories/");

    if (!res.ok) {
      throw new Error("카테고리 조회 실패");
    }

    const data = await res.json();

    // 백엔드: { category_id, category_name }
    // 프론트: string[] 로 변환
    return data.map((item: any) => item.category_name);
  } catch (error) {
    console.error("getCategories error:", error);
    return [];
  }
}
