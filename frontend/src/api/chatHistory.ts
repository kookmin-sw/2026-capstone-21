import { customFetch } from "./client";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/chatwoot`;

export async function getChatHistory(userId: number) {
  const res = await customFetch(`${BASE_URL}/history/${userId}`);
  if (!res.ok) throw new Error("채팅 기록 조회 실패");
  return res.json();
}
