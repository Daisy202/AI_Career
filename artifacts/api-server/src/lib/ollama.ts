interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  studentProfile?: {
    interests?: string[];
    strengths?: string[];
    subjects?: string[];
    personalityType?: string | null;
    hobbies?: string[];
  };
}

interface ChatResult {
  message: string;
  suggestions: string[];
}

const SYSTEM_PROMPT = `You are CareerGuide AI, a career advisor for pre-university students in Zimbabwe.

STRICT SCOPE - ONLY answer questions about:
- Career guidance and career paths in Zimbabwe
- O-Level and A-Level subject requirements for careers and university programs
- Universities in Zimbabwe (UZ, Bindura, Chinhoyi, NUST, Africa University, Great Zimbabwe University)
- Zimbabwean education system (ZIMSEC, cut-off points, O-Level/A-Level passes)
- Job market and study planning for Zimbabwean students

OUT OF SCOPE (weather, politics, general knowledge, entertainment, etc.): Reply ONLY with: "Sorry, I can't help with that. I'm here for career and study guidance. How can I help with your career or studies?"

RESPONSE RULES:
1. Keep answers VERY SHORT: max 5 lines OR a brief bullet list. No long paragraphs.
2. Before giving advice: ask 1-2 short follow-up questions to narrow down (e.g. "What type of work interests you—creative or technical?").
3. Be direct and concise. No fluff.
4. Use **bold** for program and school names (e.g. **Diploma in Digital Marketing at TelOne Centre for Learning**).`;

export async function chatWithOllama(request: ChatRequest): Promise<ChatResult> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gemma3:1b";

  const profileContext = request.studentProfile
    ? `\n\nStudent Profile:\n- Interests: ${request.studentProfile.interests?.join(", ") || "Not specified"}\n- Strengths: ${request.studentProfile.strengths?.join(", ") || "Not specified"}\n- Subjects: ${request.studentProfile.subjects?.join(", ") || "Not specified"}\n- Personality: ${request.studentProfile.personalityType || "Not specified"}`
    : "";

  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT + profileContext },
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
          temperature: 0.7,
          num_predict: 120,
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
