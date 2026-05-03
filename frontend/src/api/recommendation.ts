import { customFetch } from "./client";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/recommendations`;

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

    const res = await customFetch(`${BASE_URL}/predict?${params.toString()}`, {
        method: "POST",
    });

    if (!res.ok) {
        throw new Error("predict 실패");
    }

    return res.json();
}
