const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/auth`;

export async function loginApi(email: string, password: string) {
    const res = await fetch(`${BASE_URL}/login`, {
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
    userName: string
    ) {
    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email,
        password,
        user_name: userName,
        }),
    });

    if (!res.ok) {
        throw new Error("signup-failed");
    }

    return res.json();
}