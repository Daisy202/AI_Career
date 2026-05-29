import type { ChatCompletionMessage } from "./githubModels.js";

export function getOllamaConfig(): { baseUrl: string; model: string } {
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "gemma3:1b",
  };
}

export async function ollamaChatCompletion(
  messages: ChatCompletionMessage[],
  options?: { temperature?: number; maxTokens?: number },
  _opts?: { log?: boolean }
): Promise<string> {
  const { baseUrl, model } = getOllamaConfig();
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.25,
        num_predict: options?.maxTokens ?? 160,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Ollama API error:", errText);
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content?.trim() || "I'm sorry, I couldn't generate a response. Please try again.";
}

export async function ollamaGenerateText(
  prompt: string,
  options?: { temperature?: number; maxTokens?: number },
  _opts?: { log?: boolean }
): Promise<string> {
  const { baseUrl, model } = getOllamaConfig();
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.2,
        num_predict: options?.maxTokens ?? 200,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Ollama API error:", errText);
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = (await response.json()) as { response?: string };
  return (data.response || "").trim();
}
