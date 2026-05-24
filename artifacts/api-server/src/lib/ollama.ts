interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
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

const SYSTEM_PROMPT = `You are CareerGuide AI — ONLY for Zimbabwe career and university guidance. You are NOT a general chatbot, therapist, or translator.

IN SCOPE (answer these):
- A-Level / O-Level subjects for careers and degrees in Zimbabwe
- Cut-off points, passes, programs in VERIFIED DATABASE PROGRAMS
- Where graduates work and rough pay — only for the career the student is discussing (2 sentences max)

OUT OF SCOPE — reply ONLY: "I only help with careers and study in Zimbabwe. Ask about subjects, universities, or cut-off points."
- Weather, politics, jokes, recipes, relationships, general knowledge
- Describing yourself as a "large language model" or listing translation/poems/code features
- Therapy, crisis counselling, suicide hotlines (not your role)

ZIMSEC: 1–5 points per subject; 1–15 total (lower = better). Never invent 18, 38, or 150.

CONVERSATION RULES:
1. Follow the student's topic from the chat (if they asked about medicine, stay on medicine — never switch to agriculture unless they ask).
2. O-Level only → explain they need A-Level for MBChB; mention nursing/diploma options from the database.
3. Max 6 lines or short bullets. Use **bold** for program names.
4. Use VERIFIED DATABASE PROGRAMS exactly; do not make up universities or subjects.`;

export async function chatWithOllama(request: ChatRequest): Promise<ChatResult> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma3:1b";

  const profileContext = request.studentProfile
    ? `\n\nStudent Profile:\n- Interests: ${request.studentProfile.interests?.join(", ") || "Not specified"}\n- Strengths: ${request.studentProfile.strengths?.join(", ") || "Not specified"}\n- O-Level Subjects: ${request.studentProfile.oLevelSubjects?.join(", ") || "None listed"}\n- A-Level Subjects: ${request.studentProfile.subjects?.join(", ") || "None yet"}\n- Personality: ${request.studentProfile.personalityType || "Not specified"}${request.studentProfile.cutOffPoints != null ? `\n- ZIMSEC cut-off points: ${request.studentProfile.cutOffPoints} (1–15 scale, lower is better)` : ""}${request.conversationTopic ? `\n- Active topic from chat: ${request.conversationTopic} (do not change to other careers)` : ""}`
    : "";

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT + profileContext + (request.dbContext ?? "") },
  ];

  if (request.history && request.history.length > 0) {
    for (const msg of request.history) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: request.message });

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: 0.25,
          num_predict: 160,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Ollama API error:", errText);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      message?: { content?: string };
    };

    const text = data.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    const suggestions = generateSuggestions(request.message, text);

    return { message: text, suggestions };
  } catch (error) {
    console.error("Error calling Ollama:", error);
    throw new Error("Failed to get AI response. Make sure Ollama is running (http://localhost:11434) and you have pulled a model (e.g. ollama pull gemma3:1b)");
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
