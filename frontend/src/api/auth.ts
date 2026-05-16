import { customFetch } from "./client";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

export async function loginApi(email: string, password: string) {
    const res = await customFetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    if (res.status === 404) throw new Error("account-not-found");
    if (res.status === 401) throw new Error("wrong-password");

    if (!res.ok) {
        throw new Error("login-failed");
    }

    return res.json();
}

export async function signupApi(
    email: string,
    password: string,
    userName: string,
    mallName?: string,
    mallUrl?: string
    ) {
    const res = await customFetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email,
        password,
        user_name: userName,
        ...(mallName && { mall_name: mallName }),
        ...(mallUrl && { mall_url: mallUrl }),
        }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 422 && data?.detail) {
            const details = Array.isArray(data.detail) ? data.detail : [data.detail];
            const messages = details.map((d: any) => typeof d === 'string' ? d : d.msg || '').filter(Boolean);
            const passwordError = messages.find((m: string) => m.includes('비밀번호'));
            if (passwordError) {
                throw new Error("password-invalid");
            }
        }
        if (res.status === 400 && data?.detail && typeof data.detail === 'string' && data.detail.includes('이미')) {
            throw new Error("email-duplicate");
        }
        throw new Error("signup-failed");
    }

    return res.json();
}