type RuntimeEnv = Record<string, string | undefined> | undefined;

const getRuntimeEnv = (): RuntimeEnv => {
  if (typeof import.meta !== "undefined") {
    const meta = import.meta as ImportMeta & { env?: RuntimeEnv };
    return meta.env;
  }
  return undefined;
};

export const getApiBaseUrl = (): string => {
  const env = getRuntimeEnv();
  return env?.VITE_API_BASE ?? "/api";
};

export const buildApiUrl = (path: string, baseUrl = getApiBaseUrl()): string => {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
