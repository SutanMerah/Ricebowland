import { API_BASE_URL } from "@/lib/api";
import { getSession } from "@/lib/auth";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const session = await getSession();
  const token = session?.token;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const merged: RequestInit = {
    ...options,
    headers,
  };

  const res = await fetch(url, merged);

  // Try to parse JSON safely
  let body: any = null;
  try {
    body = await res.json();
  } catch (e) {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    const message = (body && (body.message || body.error)) || `HTTP ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}
