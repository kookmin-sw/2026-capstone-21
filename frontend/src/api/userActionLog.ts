const BASE_URL = "http://127.0.0.1:8000/user-action-logs";

export async function createUserActionLog(data: {
    user_id?: number;
    influencer_id: number;
    action_type: string;
    run_id?: number | null;
    }) {
    const res = await fetch(`${BASE_URL}/`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        user_id: data.user_id ?? null,
        influencer_id: data.influencer_id,
        action_type: data.action_type,
        run_id: data.run_id ?? null,
        }),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
    }

    return res.json();
}