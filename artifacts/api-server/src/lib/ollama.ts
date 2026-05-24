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
    personalityType?: string | null;
    hobbies?: string[];
    cutOffPoints?: number | null;
  };
}

interface ChatResult {
  message: string;
  suggestions: string[];
}

const SYSTEM_PROMPT = `You are CareerGuide AI for pre-university students in Zimbabwe.

YOU MUST ANSWER (never refuse these as "privacy" or "discriminatory"):
- Which A-Level or O-Level subjects are needed for a career or degree
- University cut-off points and pass requirements
- Programs and schools listed in VERIFIED DATABASE PROGRAMS below

ZIMSEC POINTS (never get this wrong):
- Each A-Level subject = 1 to 5 points only (1 best, 5 weakest pass)
- University cut-off = TOTAL aggregate between 1 and 15 (lower total = better)
- NEVER say Biology needs 18 points, or 38 total points, or 150

OUT OF SCOPE ONLY: weather, politics, unrelated trivia. Then say: "Sorry, I can't help with that. Ask me about careers, subjects, or universities in Zimbabwe."

RULES:
1. Short answers: max 6 lines or bullets.
2. If VERIFIED DATABASE PROGRAMS lists a match, cite those subjects and cut-offs exactly.
3. Direct factual questions (e.g. "A-Levels for Medicine?") → answer immediately from the database; do not refuse.
4. Use **bold** for program and school names.
5. If no database match, say what you know generally and suggest checking our program list.`;

export async function chatWithOllama(request: ChatRequest): Promise<ChatResult> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma3:1b";

  const profileContext = request.studentProfile
    ? `\n\nStudent Profile:\n- Interests: ${request.studentProfile.interests?.join(", ") || "Not specified"}\n- Strengths: ${request.studentProfile.strengths?.join(", ") || "Not specified"}\n- A-Level Subjects: ${request.studentProfile.subjects?.join(", ") || "Not specified"}\n- Personality: ${request.studentProfile.personalityType || "Not specified"}${request.studentProfile.cutOffPoints != null ? `\n- ZIMSEC cut-off points: ${request.studentProfile.cutOffPoints} (1–15 scale, lower is better)` : ""}`
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
          temperature: 0.4,
          num_predict: 180,
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
