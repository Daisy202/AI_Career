import { Router, type IRouter } from "express";
import { db, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/chat/sessions", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, userId))
    .orderBy(desc(chatSessionsTable.createdAt))
    .limit(50);

  res.json(sessions);
});

router.get("/chat/sessions/:sessionId", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const sessionId = parseInt(String(req.params.sessionId ?? ""), 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "Invalid session ID" });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== userId) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  res.json({ session, messages: messages.map((m) => ({ role: m.role, content: m.content })) });
});

router.post("/chat/sessions", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [session] = await db
    .insert(chatSessionsTable)
    .values({ userId })
    .returning();

  res.status(201).json(session);
});

export default router;
