const getRuntimeEnv = () => {
    if (typeof import.meta !== "undefined") {
        const meta = import.meta;
        return meta.env;
    }
    return undefined;
};
export const getApiBaseUrl = () => {
    const env = getRuntimeEnv();
    const fromProcessEnv = typeof process !== "undefined" ? process.env?.VITE_API_BASE : undefined;
    return env?.VITE_API_BASE ?? fromProcessEnv ?? "/api";
};
export const buildApiUrl = (path, baseUrl = getApiBaseUrl()) => {
    const normalizedBase = baseUrl.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
};
export async function requestJson(path, init) {
    const headers = new Headers(init?.headers);
    if (init?.body != null && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const sessionToken = typeof window !== "undefined" ? window.localStorage.getItem("crm_session_token") : null;
    if (sessionToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${sessionToken}`);
    }
    const response = await fetch(buildApiUrl(path), {
        ...init,
        headers,
    });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `API error: ${response.status}`);
    }
    if (response.status === 204) {
        return undefined;
    }
    return response.json();
}
//# sourceMappingURL=apiClient.js.map