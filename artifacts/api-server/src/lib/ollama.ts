import { completeChatMessages } from "./aiProvider.js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  userId?: number | null;
  dbContext?: string;
  studentProfile?: {
    interests?: string[];
    strengths?: string[];
    subjects?: string[];
    oLevelSubjects?: string[];
    personalityType?: string | null;
    hobbies?: string[];
    cutOffPoints?: number | null;
  };
  conversationTopic?: string | null;
}

interface ChatResult {
  message: string;
  suggestions: string[];
}

export const CAREER_GUIDE_SYSTEM_PROMPT = `You are CareerGuide AI — ONLY for Zimbabwe career and university guidance. You are NOT a general chatbot, therapist, or translator.

IN SCOPE (answer these):
- A-Level / O-Level subjects for careers and degrees in Zimbabwe
- Cut-off points, passes, programs in VERIFIED DATABASE PROGRAMS
- Where graduates work and rough pay — only for the career the student is discussing (2 sentences max)

OUT OF SCOPE — reply ONLY: "I only help with careers and study in Zimbabwe. Ask about subjects, universities, or cut-off points."
- Weather, politics, jokes, recipes, relationships, general knowledge
- Describing yourself as a "large language model" or listing translation/poems/code features
- Therapy, crisis counselling, suicide hotlines (not your role)

ZIMSEC: 0–5 points per subject; 5 is best; higher total (up to 15) is better. Never invent invalid totals.

CONVERSATION RULES:
1. Follow the student's topic from the chat (if they asked about medicine, stay on medicine — never switch to agriculture unless they ask).
2. O-Level only → explain they need A-Level for MBChB; mention nursing/diploma options from the database.
3. Max 6 lines or short bullets. Use **bold** for program names.
4. Use VERIFIED DATABASE PROGRAMS exactly; do not make up universities or subjects.
5. NEVER include calendar dates, month names with days, "as of", "today", "currently", or "at present".
6. Rank by required A-Level/O-Level subject fit FIRST; use interests/strengths only to break ties among subject-qualified programs.

CRITICAL DATA RULE:
- You do NOT have direct database access.
- You will receive a JSON block labeled AI_GROUNDED_CONTEXT_JSON from the backend.
- Use ONLY programs and facts contained in that JSON. Do NOT search, infer, or invent programs/schools/requirements/cut-offs.`;

const RESPONSE_STYLE_GUARD = `OUTPUT STYLE (STRICT):
- Maximum 5 sentences.
- 1) Eligibility summary
- 2) Best matching programs
- 3) Missing requirements/limitations (if relevant)
- 4) Alternative pathways (if relevant)
- 5) Final practical guidance sentence
- Use Zimbabwean terminology and keep it factual.
- Never mention internal architecture, backend processing, JSON payloads, or database-access limitations to the student.`;

export async function chatWithOllama(request: ChatRequest): Promise<ChatResult> {
  const profileContext = request.studentProfile
    ? `\n\nStudent Profile:\n- Interests: ${request.studentProfile.interests?.join(", ") || "Not specified"}\n- Strengths: ${request.studentProfile.strengths?.join(", ") || "Not specified"}\n- O-Level Subjects: ${request.studentProfile.oLevelSubjects?.join(", ") || "None listed"}\n- A-Level Subjects: ${request.studentProfile.subjects?.join(", ") || "None yet"}\n- Personality: ${request.studentProfile.personalityType || "Not specified"}${request.studentProfile.cutOffPoints != null ? `\n- ZIMSEC total points: ${request.studentProfile.cutOffPoints} (0–15 scale, higher is better)` : ""}${request.conversationTopic ? `\n- Active topic from chat: ${request.conversationTopic} (do not change to other careers)` : ""}`
    : "";

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content:
        CAREER_GUIDE_SYSTEM_PROMPT +
        "\n\n" +
        RESPONSE_STYLE_GUARD +
        profileContext +
        (request.dbContext ?? ""),
    },
  ];

  if (request.history?.length) {
    for (const msg of request.history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: request.message });

  try {
    const text = await completeChatMessages(messages, {
      temperature: 0.2,
      maxTokens: 180,
      context: { source: "chat", userId: request.userId ?? null },
    });
    return { message: text, suggestions: generateSuggestions(request.message, text) };
  } catch (error) {
    console.error("Error calling AI provider:", error);
    throw new Error(
      "Failed to get AI response. Check Admin → AI Settings (offline: Ollama running; online: API key in .env)."
    );
  }
}

function generateSuggestions(userMessage: string, _aiResponse: string): string[] {
  const lower = userMessage.toLowerCase();
  if (lower.includes("engineer") || lower.includes("physics") || lower.includes("math")) {
    return ["What universities offer engineering?", "What salary can I expect?", "What subjects do I need?"];
  }
  if (lower.includes("doctor") || lower.includes("medicine") || lower.includes("health")) {
    return ["How long is medical school?", "What A-levels do I need?", "Are there other healthcare careers?"];
  }
  if (lower.includes("business") || lower.includes("account") || lower.includes("finance")) {
    return ["What is the job market like?", "Can I study online?", "What professional qualifications exist?"];
  }
  if (lower.includes("teach") || lower.includes("education")) {
    return ["How do I become a teacher?", "What subjects can I teach?", "What universities offer education?"];
  }
  return [
    "Tell me more about career options",
    "What A-levels should I choose?",
    "Which universities are best in Zimbabwe?",
    "How do I know what career suits me?",
  ];
}
