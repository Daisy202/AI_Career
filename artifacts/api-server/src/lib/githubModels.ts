import { getOnlineApiKey, getOnlineModel } from "./systemSettings.js";

export const GITHUB_CHAT_URL = "https://models.github.ai/inference/chat/completions";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function githubChatCompletion(
  messages: ChatCompletionMessage[],
  options?: { temperature?: number; maxTokens?: number },
  _opts?: { log?: boolean }
): Promise<string> {
  const apiKey = getOnlineApiKey();
  if (!apiKey) {
    throw new Error(
      "Online AI is not configured. Set ONLINE_API_KEY (or online_apikey) in .env."
    );
  }

  const response = await fetch(GITHUB_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      model: getOnlineModel(),
      messages,
      stream: false,
      temperature: options?.temperature ?? 0.25,
      max_tokens: options?.maxTokens ?? 256,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("GitHub Models API error:", response.status, errText);
    throw new Error(`GitHub Models API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return (
    data.choices?.[0]?.message?.content?.trim() ||
    "I'm sorry, I couldn't generate a response. Please try again."
  );
}
