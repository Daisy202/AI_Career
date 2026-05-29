import { fileLogger } from "./fileLogger.js";
import type { AiMode } from "./systemSettings.js";

export type AiInferenceSource = "chat" | "recommendation_advice";

export interface AiRequestContext {
  source: AiInferenceSource;
  userId?: number | null;
}

const MAX_LOG_CHARS = 12_000;

function truncateForLog(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length <= MAX_LOG_CHARS) return value;
    return `${value.slice(0, MAX_LOG_CHARS)}… [truncated ${value.length - MAX_LOG_CHARS} chars]`;
  }
  if (Array.isArray(value)) {
    return value.map(item =>
      typeof item === "object" && item && "content" in item
        ? {
            ...item,
            content: truncateForLog((item as { content: string }).content),
          }
        : item
    );
  }
  return value;
}

export function logAiInferenceCall(params: {
  context?: AiRequestContext;
  aiMode: AiMode;
  url: string;
  model: string;
  requestPayload: unknown;
  responseText?: string;
  status: number;
  latencyMs: number;
  error?: string;
}): void {
  const source = params.context?.source ?? "unknown";
  fileLogger.logAiInference({
    userId: params.context?.userId ?? null,
    source,
    aiMode: params.aiMode,
    url: params.url,
    model: params.model,
    status: params.status,
    latencyMs: params.latencyMs,
    request: truncateForLog(params.requestPayload),
    response: params.responseText != null ? truncateForLog(params.responseText) : undefined,
    error: params.error,
  });
}
