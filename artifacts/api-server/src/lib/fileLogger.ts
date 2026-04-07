/**
 * Structured file-based system logger. Writes to data/logs/AICareer.logs.
 * Pretty-printed JSON for debugging. Categories: prediction, user_activity, error, auth, api, admin, performance.
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..", "..", "..");

const dbPath =
  process.env.DATABASE_URL ||
  path.resolve(workspaceRoot, "data", "aicareerguide.db");

const dbFilePath = dbPath.startsWith("file:") ? dbPath.replace(/^file:/, "").replace(/\\/g, path.sep) : dbPath;
const dataDir = path.isAbsolute(dbFilePath) ? path.dirname(dbFilePath) : path.resolve(workspaceRoot, path.dirname(dbFilePath));
const logDir = path.join(dataDir, "logs");
const logPath = path.join(logDir, "AICareer.logs");

export type LogType =
  | "prediction"
  | "user_activity"
  | "error"
  | "auth"
  | "api"
  | "admin"
  | "performance"
  | "system";

export type Severity = "INFO" | "WARNING" | "ERROR" | "CRITICAL";

export interface LogEntry {
  timestamp: string;
  log_type: LogType;
  severity: Severity;
  user_id?: number | string | null;
  message: string;
  details?: Record<string, unknown>;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const LOG_ENTRY_SEP = "\n---\n";

function writeEntry(entry: LogEntry): void {
  try {
    ensureDir(logDir);
    const json = JSON.stringify(entry, null, 2);
    fs.appendFileSync(logPath, json + LOG_ENTRY_SEP);
  } catch (err) {
    console.error("Failed to write to log file:", err);
  }
}

/** Parse log file into entries (for admin). Handles both new (---) and legacy (single-line) formats. */
export function parseLogFile(content: string): LogEntry[] {
  let parts: string[] = content.split(LOG_ENTRY_SEP);
  if (parts.length === 1 && content.trim().includes("\n")) {
    parts = content.split(/\n\n+/);
  }
  const entries: LogEntry[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as LogEntry;
      if (parsed.timestamp && parsed.log_type) entries.push(parsed);
    } catch {
      try {
        const legacy = JSON.parse(trimmed) as { timestamp?: string; profile?: unknown; recommendations?: unknown; aiAdvice?: string };
        if (legacy.timestamp) {
          entries.push({
            timestamp: legacy.timestamp,
            log_type: "prediction",
            severity: "INFO",
            user_id: null,
            message: "Career prediction generated (legacy)",
            details: { profile: legacy.profile, recommendations: legacy.recommendations, aiAdvice: legacy.aiAdvice },
          });
        }
      } catch {
        // skip malformed
      }
    }
  }
  return entries.reverse(); // newest first
}

export const fileLogger = {
  /** Career prediction / recommendation generated */
  logPrediction(params: {
    userId?: number | null;
    inputs: { interests: string[]; strengths: string[]; subjects: string[]; oLevelSubjects: string[]; personalityType?: string | null; cutOffPoints?: number | null; oLevelPasses?: number | null; aLevelPasses?: number | null };
    predictions: Array<{ career: string; category: string; matchPercentage: number; matchReasons: string[]; qualifyingPrograms: Array<{ program: string; school: string }> }>;
    aiAdvice?: string;
    modelVersion?: string;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "prediction",
      severity: "INFO",
      user_id: params.userId ?? null,
      message: "Career prediction generated",
      details: {
        inputs: params.inputs,
        predictions: params.predictions,
        aiAdvice: params.aiAdvice ?? null,
        modelVersion: params.modelVersion ?? "rule-based-v1",
      },
    });
  },

  /** User activity (assessment, profile, recommendations view) */
  logUserActivity(params: {
    userId?: number | null;
    action: string;
    details?: Record<string, unknown>;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "user_activity",
      severity: "INFO",
      user_id: params.userId ?? null,
      message: params.action,
      details: params.details,
    });
  },

  /** System or application error */
  logError(params: {
    userId?: number | null;
    message: string;
    error?: string;
    stack?: string;
    endpoint?: string;
    details?: Record<string, unknown>;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "error",
      severity: "ERROR",
      user_id: params.userId ?? null,
      message: params.message,
      details: {
        error: params.error,
        stack: params.stack,
        endpoint: params.endpoint,
        ...params.details,
      },
    });
  },

  /** Authentication / security events */
  logAuth(params: {
    userId?: number | null;
    action: string;
    success: boolean;
    details?: Record<string, unknown>;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "auth",
      severity: params.success ? "INFO" : "WARNING",
      user_id: params.userId ?? null,
      message: params.action,
      details: { success: params.success, ...params.details },
    });
  },

  /** API / integration (external services, latency) */
  logApi(params: {
    endpoint?: string;
    message: string;
    status?: number;
    latencyMs?: number;
    details?: Record<string, unknown>;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "api",
      severity: params.status && params.status >= 400 ? "WARNING" : "INFO",
      user_id: null,
      message: params.message,
      details: {
        endpoint: params.endpoint,
        status: params.status,
        latencyMs: params.latencyMs,
        ...params.details,
      },
    });
  },

  /** Admin actions */
  logAdmin(params: {
    userId?: number | null;
    action: string;
    details?: Record<string, unknown>;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "admin",
      severity: "INFO",
      user_id: params.userId ?? null,
      message: params.action,
      details: params.details,
    });
  },

  /** Performance metrics */
  logPerformance(params: {
    message: string;
    responseTimeMs?: number;
    details?: Record<string, unknown>;
  }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "performance",
      severity: "INFO",
      user_id: null,
      message: params.message,
      details: { responseTimeMs: params.responseTimeMs, ...params.details },
    });
  },

  /** System events (startup, shutdown) */
  logSystem(params: { message: string; severity?: Severity; details?: Record<string, unknown> }): void {
    writeEntry({
      timestamp: new Date().toISOString(),
      log_type: "system",
      severity: params.severity ?? "INFO",
      user_id: null,
      message: params.message,
      details: params.details,
    });
  },

  /** Get log file path for admin reads */
  getLogPath(): string {
    return logPath;
  },
};
