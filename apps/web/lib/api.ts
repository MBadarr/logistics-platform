import "server-only";
import { auth } from "./auth/server";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const { data, error } = await auth.token();
  if (error || !data?.token) return Response.json({ message: "Please sign in" }, { status: 401 });
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${data.token}`);
  return fetch(new URL(path, process.env.API_URL ?? "http://localhost:3002"), {
    ...init, headers, cache: "no-store", signal: AbortSignal.timeout(30_000),
  });
}
