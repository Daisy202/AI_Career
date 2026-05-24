import { Router, type IRouter } from "express";
import { SendChatMessageBody, SendChatMessageResponse } from "@workspace/api-zod";
import { db, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { chatWithOllama } from "../lib/ollama.js";
import { requireAuth } from "../lib/auth.js";
import { buildChatDbContext, enrichChatResponse, loadAllPrograms } from "../lib/chatDbContext.js";
import { seedUniversitiesIfEmpty } from "../lib/universities.js";
import { buildDbFallbackAnswer, tryRuleBasedCareerAnswer } from "../lib/chatFallback.js";
import { isInScopeRefusal, normalizeZimsecCutoff } from "../lib/zimsecPoints.js";
import {
  buildConversationText,
  classifyUserMessage,
  extractConversationTopic,
  getCannedResponse,
  isOffTopicAssistantResponse,
  isOLevelStudent,
  type ChatTurn,
} from "../lib/chatScope.js";

function hasHallucinatedPoints(text: string): boolean {
  if (/\b(?:3[6-9]|[4-9]\d|\d{3,})\s*(?:points?|pts)\b/i.test(text)) return true;
  if (/[A-Za-z]{3,}:\s*(?:[6-9]|[1-9]\d+)\s*points?/i.test(text)) return true;
  return false;
}

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
    await seedUniversitiesIfEmpty();

    const historyTurns: ChatTurn[] =
      history?.map(h => ({ role: h.role as "user" | "assistant", content: h.content })) ?? [];
    const conversationText = buildConversationText(message, historyTurns);
    const conversationTopic = extractConversationTopic(conversationText);
    const messageKind = classifyUserMessage(message);

    const allPrograms = await loadAllPrograms();
    const oLevelOnly = isOLevelStudent(
      message,
      studentProfile?.subjects,
      studentProfile?.oLevelSubjects
    );

    let resultMessage: string;
    let suggestions: string[] = [];

    const canned = getCannedResponse(messageKind);
    if (canned) {
      resultMessage = canned;
      suggestions = [
        "What A-Levels do I need for my career?",
        "What cut-off points does UZ medicine need?",
        "I'm O-Level only — what diploma can I do?",
      ];
    } else {
      const ruleBased = tryRuleBasedCareerAnswer(message, conversationText, allPrograms, {
        isOLevel: oLevelOnly,
      });
      if (ruleBased) {
        resultMessage = ruleBased;
      } else {
        const dbContext = await buildChatDbContext(
          message,
          studentProfile?.subjects,
          conversationText
        );

        const result = await chatWithOllama({
          message,
          history: historyTurns,
          dbContext,
          conversationTopic,
          studentProfile: studentProfile
            ? {
                interests: studentProfile.interests,
                strengths: studentProfile.strengths,
                subjects: studentProfile.subjects,
                oLevelSubjects: studentProfile.oLevelSubjects,
                personalityType: studentProfile.personalityType,
                hobbies: studentProfile.hobbies,
                cutOffPoints: normalizeZimsecCutoff(studentProfile.cutOffPoints ?? undefined),
              }
            : undefined,
        });

        resultMessage = result.message;
        suggestions = result.suggestions;

        const enriched = enrichChatResponse(
          resultMessage,
          allPrograms,
          studentProfile?.cutOffPoints
        );
        resultMessage = enriched.message;

        const fallback = buildDbFallbackAnswer(message, allPrograms, conversationText);
        if (
          fallback &&
          (isInScopeRefusal(resultMessage) ||
            hasHallucinatedPoints(resultMessage) ||
            isOffTopicAssistantResponse(resultMessage, conversationTopic))
        ) {
          resultMessage = fallback;
        } else if (isOffTopicAssistantResponse(resultMessage, conversationTopic)) {
          const ruleRetry = tryRuleBasedCareerAnswer(message, conversationText, allPrograms, {
            isOLevel: oLevelOnly,
          });
          resultMessage = ruleRetry ?? getCannedResponse("off_topic");
        } else if (fallback && allPrograms.length > 0 && resultMessage.length < 40) {
          resultMessage = fallback;
        }
      }
    }

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
          { sessionId: finalSessionId, role: "assistant", content: resultMessage },
        ]);
      }
    }

    res.json({
      ...SendChatMessageResponse.parse({ message: resultMessage, suggestions }),
      ...(userId && finalSessionId ? { sessionId: finalSessionId } : {}),
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

export default router;
