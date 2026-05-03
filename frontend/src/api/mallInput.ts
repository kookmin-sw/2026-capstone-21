const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/mall-inputs`;


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