const BASE_URL = "http://127.0.0.1:8000/recommendations";


// ============================
// 기존: DB 기반 추천 (predict)
// ============================
export async function getPrediction(input_id: number, user_id: number) {
    const res = await fetch(
        `${BASE_URL}/predict?input_id=${input_id}&user_id=${user_id}`,
        {
        method: "POST",
        }
    );

    if (!res.ok) {
        throw new Error("predict 실패");
    }

    return res.json();
    }


// ============================
// 신규: 실시간 추천 (realtime)
// ============================
export async function getRealtimeRecommendation(data: {
    text: string;
    user_id: number;
    category?: string;
    min_followers?: number;
    }) {
    const res = await fetch(`${BASE_URL}/realtime`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("realtime 추천 실패");
    }

    return res.json();
}