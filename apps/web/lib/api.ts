export async function api<T = { message: string }>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(`/api${path}`, { method, credentials: "same-origin", headers: body instanceof Blob ? { "Content-Type": body.type } : { "Content-Type": "application/json" }, ...(body !== undefined ? { body: body instanceof Blob ? body : JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(25000) });
  const data = await response.json().catch(() => ({ error: "The service is temporarily unavailable." }));
  if (!response.ok) throw new Error(data.error || "Please try again shortly.");
  return data as T;
}
