import type {
  AnalysisResult,
  CapaResult,
  DeviationExtract,
} from "@/types/rca";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rca-ai`;

export function getGroqKey(): string {
  return localStorage.getItem("groq_api_key") ?? "";
}

export function setGroqKey(key: string) {
  if (key) localStorage.setItem("groq_api_key", key);
  else localStorage.removeItem("groq_api_key");
}

async function callAi<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ ...payload, groqApiKey: getGroqKey() }),
  });
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new Error(`AI service returned an invalid response (${res.status})`);
  }
  if (!res.ok || (body && typeof body === "object" && "error" in body)) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

export function aiExtract(text: string) {
  return callAi<DeviationExtract>({ action: "extract", text });
}

export function aiAnalyze(investigation: Record<string, unknown>) {
  return callAi<AnalysisResult>({ action: "analyze", investigation });
}

export function aiCapa(investigation: Record<string, unknown>) {
  return callAi<CapaResult>({ action: "capa", investigation });
}
