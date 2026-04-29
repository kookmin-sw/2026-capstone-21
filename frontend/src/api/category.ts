export async function getCategories() {
  const res = await fetch("http://localhost:8000/categories/");

  if (!res.ok) {
    throw new Error("카테고리 조회 실패");
  }

  const data = await res.json();

  return data.map((item: any) => ({
    id: item.category_id,
    name: item.category_name,
  }));
}
