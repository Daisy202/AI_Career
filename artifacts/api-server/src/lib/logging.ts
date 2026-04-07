import type { Request, Response, NextFunction } from "express";
import { db, apiLogsTable } from "@workspace/db";
import { fileLogger } from "./fileLogger.js";

export function apiLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on("finish", () => {
    const responseTimeMs = Date.now() - start;
    const path = req.originalUrl?.split("?")[0] ?? req.path;
    const method = req.method;
    const status = res.statusCode;
    const userId = req.session && req.session.userId ? req.session.userId : null;
    const errHeader = res.getHeader("x-error");
    const errorMessage = status >= 400 && typeof errHeader === "string" ? errHeader : null;

    if (status >= 400) {
      fileLogger.logApi({
        endpoint: path,
        message: `${method} ${path} → ${status}`,
        status,
        latencyMs: responseTimeMs,
        details: { userId, errorMessage: errorMessage ?? undefined },
      });
    }

    void db
      .insert(apiLogsTable)
      .values({
        path,
        method,
        status,
        responseTimeMs,
        userId: userId ?? undefined,
        errorMessage: errorMessage ?? undefined,
      })
      .then(() => {})
      .catch((err) => console.error("Failed to log API request:", err));
  });

  next();
}
