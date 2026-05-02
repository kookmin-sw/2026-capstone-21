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

// 테스트용 API (run_id 없음, 로그 연동 불가)
// 실서비스에서는 predict 사용
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