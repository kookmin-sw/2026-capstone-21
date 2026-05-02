const BASE_URL = "http://127.0.0.1:8000/recommendations";

export async function getPrediction(
    input_id: number,
    user_id: number,
    options?: {
        category?: string;
        minFollowers?: number;
    }
    ) {
    const params = new URLSearchParams({
        input_id: String(input_id),
        user_id: String(user_id),
    });

    if (options?.category) {
        params.append("category", options.category);
    }

    if (options?.minFollowers !== undefined) {
        params.append("minFollowers", String(options.minFollowers));
    }

    const res = await fetch(`${BASE_URL}/predict?${params.toString()}`, {
        method: "POST",
    });

    if (!res.ok) {
        throw new Error("predict 실패");
    }

    return res.json();
}

// realtime은 삭제하지 말고 백업용으로 유지
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