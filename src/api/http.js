import { ApiError } from "./errors";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const TOKEN_KEY = "vetcare.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) =>
    t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY),
};

async function request(method, path, { body, query } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin);
  Object.entries(query ?? {}).forEach(
    ([k, v]) => v != null && v !== "" && url.searchParams.set(k, v),
  );
  const token = tokenStore.get();
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const http = {
  get: (path, query) => request("GET", path, { query }),
  post: (path, body) => request("POST", path, { body }),
  put: (path, body) => request("PUT", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
  delete: (path) => request("DELETE", path),
};
