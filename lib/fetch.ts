import { API_BASE_URL } from "@/lib/api";
import { getSession } from "@/lib/auth";

export async function apiFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const session = await getSession();
  const token = session?.token;

  // 🔍 SENSOR DIAGNOSTIK MENYELURUH
  console.log("📂 [DEBUG SESSION] Isi lengkap data session di storage:", JSON.stringify(session));

  // 🔍 TAMBAHKAN LOG INI UNTUK DIAGNOSIS
  console.log(`📡 [apiFetch] Menembak ke: ${path} | Token ditemukan: ${token ? "ADA (Mulai dengan " + token.substring(0, 10) + "...)" : "KOSONG/NULL"}`);

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  // 🚀 Deteksi yang jauh lebih aman (mencakup 'login', '/login', 'register', '/register')
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const isPublicRoute = cleanPath === '/login' || cleanPath === '/register';

  if (token && !isPublicRoute) {
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
