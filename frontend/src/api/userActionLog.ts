const BASE_URL = "http://localhost:8000/user-action-logs";

export async function createUserActionLog(
    influencerId: number,
    actionType: string,
    runId: number
    ) {
    const url = `${BASE_URL}/log?influencer_id=${influencerId}&action_type=${actionType}&run_id=${runId}`;

    const res = await fetch(url, {
        method: "POST",
    });

    if (!res.ok) {
        throw new Error("추천 기반 행동 로그 저장 실패");
    }

    return res.json();
    }

// 일반 사용자 행동 로그 (run_id 없는 경우)
// 추천과 무관한 탐색 행동 기록용
export async function createGeneralUserActionLog(
    userId: number,
    influencerId: number,
    actionType: string
    ) {
    const res = await fetch(`${BASE_URL}/general`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        user_id: userId,
        influencer_id: influencerId,
        action_type: actionType,
        }),
    });

    if (!res.ok) {
        throw new Error("일반 행동 로그 저장 실패");
    }

    return res.json();
}