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

const SYSTEM_PROMPT = `You are CareerGuide AI, a friendly and knowledgeable career advisor for pre-university students in Zimbabwe. Your role is to:

1. Help students understand different career paths available to them
2. Explain what A-Level subjects are needed for various careers
3. Discuss universities in Zimbabwe that offer relevant programs (Bindura University, University of Zimbabwe, Chinhoyi University of Technology, NUST, etc.)
4. Provide encouragement and practical advice
5. Help students understand their strengths and how they relate to careers
6. Answer questions about the job market in Zimbabwe and internationally

Be warm, encouraging, and specific to the Zimbabwean context. Keep responses concise but helpful. If a student seems uncertain, ask clarifying questions to better understand their interests.

Always relate your advice to the Zimbabwean education system and job market where relevant.`;

export async function chatWithGemini(request: ChatRequest): Promise<ChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      message: "The AI chatbot is not configured. Please add your Gemini API key to use this feature.",
      suggestions: ["Tell me about your interests", "What subjects do you enjoy?"],
    };
  }

  const profileContext = request.studentProfile
    ? `\n\nStudent Profile:\n- Interests: ${request.studentProfile.interests?.join(", ") || "Not specified"}\n- Strengths: ${request.studentProfile.strengths?.join(", ") || "Not specified"}\n- Subjects: ${request.studentProfile.subjects?.join(", ") || "Not specified"}\n- Personality: ${request.studentProfile.personalityType || "Not specified"}`
    : "";

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (request.history && request.history.length > 0) {
    for (const msg of request.history) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
  }

  contents.push({
    role: "user",
    parts: [{ text: request.message }],
  });

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT + profileContext }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response. Please try again.";

    const suggestions = generateSuggestions(request.message, text);

    return { message: text, suggestions };
  } catch (error) {
    console.error("Error calling Gemini:", error);
    throw new Error("Failed to get AI response");
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
