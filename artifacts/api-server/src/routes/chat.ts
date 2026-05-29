import { Router, type IRouter } from "express";
import { SendChatMessageBody, SendChatMessageResponse } from "@workspace/api-zod";
import { db, chatSessionsTable, chatMessagesTable } from "@workspace/db";
import { chatWithOllama } from "../lib/ollama.js";
import { requireAuth } from "../lib/auth.js";
import {
  buildChatDbContext,
  enrichChatResponse,
  loadAllPrograms,
  loadCareersForChat,
} from "../lib/chatDbContext.js";
import { seedUniversitiesIfEmpty, syncUniversityAcronyms } from "../lib/universities.js";
import { fileLogger } from "../lib/fileLogger.js";
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
import { hasTemporalPhrasing, sanitizeResponseStyle } from "../lib/aiAdvice.js";
import { answerFromDatabase, isClearlyOutOfScope } from "../lib/chatQuestionRouter.js";
import {
  extractNormalizedSubjectsFromText,
  normalizeSubjectList,
} from "../lib/subjectMatch.js";

function hasHallucinatedPoints(text: string): boolean {
  if (/\b(?:3[6-9]|[4-9]\d|\d{3,})\s*(?:points?|pts)\b/i.test(text)) return true;
  if (/[A-Za-z]{3,}:\s*(?:[6-9]|[1-9]\d+)\s*points?/i.test(text)) return true;
  return false;
}

function finalizeResponse(text: string): string {
  return sanitizeResponseStyle(text);
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

  const messageSubjects = extractNormalizedSubjectsFromText(message);
  const normalizedALevel = normalizeSubjectList([
    ...(studentProfile?.subjects ?? []),
    ...messageSubjects,
  ]);
  const normalizedOLevel = normalizeSubjectList(studentProfile?.oLevelSubjects ?? []);

  const chatStarted = Date.now();
  let chatHandler: "out_of_scope" | "canned" | "database" | "rule" | "llm" = "llm";

  try {
    await seedUniversitiesIfEmpty();
    await syncUniversityAcronyms();

    const historyTurns: ChatTurn[] =
      history?.map(h => ({ role: h.role as "user" | "assistant", content: h.content })) ?? [];
    const conversationText = buildConversationText(message, historyTurns);
    const conversationTopic = extractConversationTopic(conversationText);
    const messageKind = classifyUserMessage(message);

    const [allPrograms, careers] = await Promise.all([loadAllPrograms(), loadCareersForChat()]);
    const oLevelOnly = isOLevelStudent(message, normalizedALevel, normalizedOLevel);

    let resultMessage: string;
    let suggestions: string[] = [];

    if (isClearlyOutOfScope(message)) {
      chatHandler = "out_of_scope";
      resultMessage = getCannedResponse("off_topic");
      suggestions = [
        "Which careers match my A-Level subjects?",
        "Does CUT offer Computer Science?",
        "What points are needed for Medicine at UZ?",
      ];
    } else {
      const canned = getCannedResponse(messageKind);
      if (canned && messageKind !== "career" && messageKind !== "comparison" && messageKind !== "detailed_inquiry") {
        chatHandler = "canned";
        resultMessage = canned;
        suggestions = [
          "What A-Levels do I need for ICT?",
          "Which programs are offered at CUT?",
          "I'm O-Level only — what diploma can I do?",
        ];
      } else {
        const dbAnswer = await answerFromDatabase({
          message,
          conversationText,
          programs: allPrograms,
          careers,
          studentProfile: studentProfile
            ? {
                interests: studentProfile.interests,
                strengths: studentProfile.strengths,
                subjects: normalizedALevel,
                oLevelSubjects: normalizedOLevel,
                cutOffPoints: studentProfile.cutOffPoints ?? null,
              }
            : undefined,
          isOLevel: oLevelOnly,
        });

        if (dbAnswer) {
          chatHandler = "database";
          resultMessage = dbAnswer;
          suggestions = [
            "Compare two programs I'm considering",
            "What are my options with my cut-off points?",
            "Which diploma fits my O-Levels?",
          ];
        } else {
          const ruleBased = tryRuleBasedCareerAnswer(message, conversationText, allPrograms, {
            isOLevel: oLevelOnly,
          });
          if (ruleBased) {
            chatHandler = "rule";
            resultMessage = ruleBased;
          } else {
            chatHandler = "llm";
            const dbContext = await buildChatDbContext(
              message,
              normalizedALevel,
              conversationText,
              {
                cutOffPoints: studentProfile?.cutOffPoints ?? undefined,
                oLevelSubjects: normalizedOLevel,
                interests: studentProfile?.interests,
                strengths: studentProfile?.strengths,
                personalityType: studentProfile?.personalityType,
              }
            );

            const result = await chatWithOllama({
              message,
              history: historyTurns,
              userId,
              dbContext,
              conversationTopic,
              studentProfile: studentProfile
                ? {
                    interests: studentProfile.interests,
                    strengths: studentProfile.strengths,
                    subjects: normalizedALevel,
                    oLevelSubjects: normalizedOLevel,
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
                isOffTopicAssistantResponse(resultMessage, conversationTopic) ||
                hasTemporalPhrasing(resultMessage))
            ) {
              resultMessage = fallback;
            } else if (
              isOffTopicAssistantResponse(resultMessage, conversationTopic) ||
              hasTemporalPhrasing(resultMessage)
            ) {
              const ruleRetry = tryRuleBasedCareerAnswer(message, conversationText, allPrograms, {
                isOLevel: oLevelOnly,
              });
              resultMessage =
                ruleRetry ?? (await answerFromDatabase({
                  message,
                  conversationText,
                  programs: allPrograms,
                  careers,
                  studentProfile: studentProfile
                    ? {
                        interests: studentProfile.interests,
                        strengths: studentProfile.strengths,
                        subjects: normalizedALevel,
                        oLevelSubjects: normalizedOLevel,
                        cutOffPoints: studentProfile.cutOffPoints ?? null,
                      }
                    : undefined,
                  isOLevel: oLevelOnly,
                })) ?? getCannedResponse("off_topic");
            } else if (fallback && allPrograms.length > 0 && resultMessage.length < 40) {
              resultMessage = fallback;
            }
          }
        }
      }
    }

    resultMessage = finalizeResponse(resultMessage);
    if (hasTemporalPhrasing(resultMessage)) {
      const retry = await answerFromDatabase({
        message,
        conversationText,
        programs: allPrograms,
        careers,
        studentProfile: studentProfile
          ? {
              interests: studentProfile.interests,
              strengths: studentProfile.strengths,
              subjects: normalizedALevel,
                    oLevelSubjects: normalizedOLevel,
              cutOffPoints: studentProfile.cutOffPoints ?? null,
            }
          : undefined,
        isOLevel: oLevelOnly,
      });
      resultMessage = finalizeResponse(retry ?? getCannedResponse("off_topic"));
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

    fileLogger.logChat({
      userId,
      handler: chatHandler,
      message,
      responsePreview: resultMessage,
      latencyMs: Date.now() - chatStarted,
      details: { sessionId: finalSessionId, suggestionCount: suggestions.length },
    });

    res.json({
      ...SendChatMessageResponse.parse({ message: resultMessage, suggestions }),
      ...(userId && finalSessionId ? { sessionId: finalSessionId } : {}),
    });
  } catch (error) {
    console.error("Chat error:", error);
    fileLogger.logChat({
      userId,
      handler: "error",
      message,
      responsePreview: String(error),
      latencyMs: Date.now() - chatStarted,
    });
    res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

export default router;
