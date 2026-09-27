import type { ApiResponse } from "../types/widget.ts";

const API_BASE = "http://127.0.0.1:4141";

export async function sendQuery(queryText: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: queryText }),
  });

  if (!res.ok) {
    throw new Error(`Query failed: ${res.statusText}`);
  }

  const data = (await res.json()) as ApiResponse;
  return data.response ?? "";
}

export async function requestWeather(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/weather`);
  if (!res.ok) {
    throw new Error(`Weather check failed: ${res.statusText}`);
  }
  const data = (await res.json()) as ApiResponse;
  return data.response ?? "";
}

export async function requestKillApp(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/kill`, { method: "POST" });
  } catch {
    // Best-effort during shutdown
  }
}
