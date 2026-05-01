const BASE_URL = "http://127.0.0.1:8000/mall-inputs";


// 쇼핑몰 입력 저장
export async function createMallInput(data: {
    user_id: number;
    input_text: string;
    category?: string;
    min_followers?: number;
    }) {
    const res = await fetch(`${BASE_URL}/`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("mall input 저장 실패");
    }

    return res.json();
}