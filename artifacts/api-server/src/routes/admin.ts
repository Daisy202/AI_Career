import { Router, type IRouter } from "express";
import { db, apiLogsTable, feedbackTable, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { desc, sql, gte } from "drizzle-orm";
import fs from "fs";
import { requireAdmin } from "../lib/auth.js";
import { fileLogger, parseLogFile } from "../lib/fileLogger.js";

const router: IRouter = Router();

router.get("/admin/logs", requireAdmin, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const logs = await db
    .select()
    .from(apiLogsTable)
    .orderBy(desc(apiLogsTable.createdAt))
    .limit(limit);

  res.json(logs);
});

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const hours = parseInt(req.query.hours as string) || 24;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [logs] = await db
    .select({
      totalRequests: sql<number>`count(*)`,
      avgResponseTime: sql<number>`avg(${apiLogsTable.responseTimeMs})`,
      errorCount: sql<number>`sum(case when ${apiLogsTable.status} >= 400 then 1 else 0 end)`,
      chatCount: sql<number>`sum(case when ${apiLogsTable.path} = '/api/chat' then 1 else 0 end)`,
    })
    .from(apiLogsTable)
    .where(gte(apiLogsTable.createdAt, since));

  const [feedbackCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedbackTable)
    .where(gte(feedbackTable.createdAt, since));

  const [sessionCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatSessionsTable)
    .where(gte(chatSessionsTable.createdAt, since));

  res.json({
    periodHours: hours,
    totalRequests: logs?.totalRequests ?? 0,
    avgResponseTimeMs: Math.round(logs?.avgResponseTime ?? 0),
    errorCount: logs?.errorCount ?? 0,
    chatRequests: logs?.chatCount ?? 0,
    feedbackCount: feedbackCount?.count ?? 0,
    newChatSessions: sessionCount?.count ?? 0,
  });
});

router.get("/admin/feedback", requireAdmin, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const feedbacks = await db
    .select()
    .from(feedbackTable)
    .orderBy(desc(feedbackTable.createdAt))
    .limit(limit);

  res.json(feedbacks);
});

router.get("/admin/file-logs", requireAdmin, async (req, res): Promise<void> => {
  try {
    const logPath = fileLogger.getLogPath();
    if (!fs.existsSync(logPath)) {
      res.json({ entries: [], total: 0 });
      return;
    }
    const content = fs.readFileSync(logPath, "utf-8");
    const entries = parseLogFile(content);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const logType = req.query.type as string | undefined;
    const severity = req.query.severity as string | undefined;

    let filtered = entries;
    if (logType) filtered = filtered.filter(e => e.log_type === logType);
    if (severity) filtered = filtered.filter(e => e.severity === severity);

    res.json({
      entries: filtered.slice(0, limit),
      total: filtered.length,
    });
  } catch (err) {
    console.error("Failed to read file logs:", err);
    res.status(500).json({ error: "Failed to read logs" });
  }
});

export default router;
