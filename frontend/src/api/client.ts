// src/api/client.ts (공통 함수 예시)
export const customFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "ngrok-skip-browser-warning": "true",
    },
  });
};
