import { Router, type IRouter } from "express";
import { SendChatMessageBody, SendChatMessageResponse } from "@workspace/api-zod";
import { db, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { chatWithOllama } from "../lib/ollama.js";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.post("/chat", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, history, studentProfile } = parsed.data;
  const sessionId = typeof req.body?.sessionId === "number" ? req.body.sessionId : undefined;
  const userId = (req.session as { userId?: number })?.userId;

  try {
    const result = await chatWithOllama({
      message,
      history: history?.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
      studentProfile: studentProfile
        ? {
            interests: studentProfile.interests,
            strengths: studentProfile.strengths,
            subjects: studentProfile.subjects,
            personalityType: studentProfile.personalityType,
            hobbies: studentProfile.hobbies,
          }
        : undefined,
    });

    let finalSessionId = sessionId;
    if (userId) {
      if (!finalSessionId) {
        const title = message.length > 50 ? message.slice(0, 47) + "..." : message;
        const [session] = await db.insert(chatSessionsTable).values({ userId, title }).returning();
        finalSessionId = session?.id;
      }
      if (finalSessionId) {
        await db.insert(chatMessagesTable).values([
          { sessionId: finalSessionId, role: "user", content: message },
          { sessionId: finalSessionId, role: "assistant", content: result.message },
        ]);
      }
    }

    res.json({
      ...SendChatMessageResponse.parse(result),
      ...(userId && finalSessionId ? { sessionId: finalSessionId } : {}),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

export default router;
