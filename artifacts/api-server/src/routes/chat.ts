import { Router, type IRouter } from "express";
import { SendChatMessageBody, SendChatMessageResponse } from "@workspace/api-zod";
import { chatWithGemini } from "../lib/gemini.js";

const router: IRouter = Router();

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, history, studentProfile } = parsed.data;

  try {
    const result = await chatWithGemini({
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

    res.json(SendChatMessageResponse.parse(result));
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to get AI response. Please try again." });
  }
});

export default router;
