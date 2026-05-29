import { getAiMode, getOnlineModel } from "./systemSettings.js";
import {
  githubChatCompletion,
  GITHUB_CHAT_URL,
  type ChatCompletionMessage,
} from "./githubModels.js";
import { ollamaChatCompletion, ollamaGenerateText, getOllamaConfig } from "./ollamaClient.js";
import {
  logAiInferenceCall,
  type AiRequestContext,
} from "./aiInferenceLog.js";

export type { AiRequestContext };

export interface AiCallOptions {
  temperature?: number;
  maxTokens?: number;
  context?: AiRequestContext;
}

export async function completeChatMessages(
  messages: ChatCompletionMessage[],
  options?: AiCallOptions
): Promise<string> {
  const mode = await getAiMode();
  const start = Date.now();
  const { baseUrl, model: offlineModel } = getOllamaConfig();

  if (mode === "online") {
    const model = getOnlineModel();
    const requestPayload = {
      model,
      messages,
      stream: false,
      temperature: options?.temperature ?? 0.25,
      max_tokens: options?.maxTokens ?? 256,
    };
    try {
      const text = await githubChatCompletion(messages, options, { log: false });
      logAiInferenceCall({
        context: options?.context,
        aiMode: mode,
        url: GITHUB_CHAT_URL,
        model,
        requestPayload,
        responseText: text,
        status: 200,
        latencyMs: Date.now() - start,
      });
      return text;
    } catch (error) {
      logAiInferenceCall({
        context: options?.context,
        aiMode: mode,
        url: GITHUB_CHAT_URL,
        model,
        requestPayload,
        status: 500,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  const url = `${baseUrl}/api/chat`;
  const requestPayload = {
    model: offlineModel,
    messages,
    stream: false,
    options: {
      temperature: options?.temperature ?? 0.25,
      num_predict: options?.maxTokens ?? 160,
    },
  };
  try {
    const text = await ollamaChatCompletion(messages, options, { log: false });
    logAiInferenceCall({
      context: options?.context,
      aiMode: mode,
      url,
      model: offlineModel,
      requestPayload,
      responseText: text,
      status: 200,
      latencyMs: Date.now() - start,
    });
    return text;
  } catch (error) {
    logAiInferenceCall({
      context: options?.context,
      aiMode: mode,
      url,
      model: offlineModel,
      requestPayload,
      status: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function generateAdviceText(
  prompt: string,
  options?: AiCallOptions
): Promise<string> {
  const mode = await getAiMode();
  const start = Date.now();
  const { baseUrl, model: offlineModel } = getOllamaConfig();

  if (mode === "online") {
    const model = getOnlineModel();
    const messages: ChatCompletionMessage[] = [
      {
        role: "system",
        content: "You are a career advisor for Zimbabwe students. Be concise and factual.",
      },
      { role: "user", content: prompt },
    ];
    const requestPayload = {
      model,
      messages,
      stream: false,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 220,
    };
    try {
      const text = await githubChatCompletion(messages, options, { log: false });
      logAiInferenceCall({
        context: options?.context,
        aiMode: mode,
        url: GITHUB_CHAT_URL,
        model,
        requestPayload,
        responseText: text,
        status: 200,
        latencyMs: Date.now() - start,
      });
      return text;
    } catch (error) {
      logAiInferenceCall({
        context: options?.context,
        aiMode: mode,
        url: GITHUB_CHAT_URL,
        model,
        requestPayload,
        status: 500,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  const url = `${baseUrl}/api/generate`;
  const requestPayload = {
    model: offlineModel,
    prompt,
    stream: false,
    options: {
      temperature: options?.temperature ?? 0.2,
      num_predict: options?.maxTokens ?? 200,
    },
  };
  try {
    const text = await ollamaGenerateText(prompt, options, { log: false });
    logAiInferenceCall({
      context: options?.context,
      aiMode: mode,
      url,
      model: offlineModel,
      requestPayload,
      responseText: text,
      status: 200,
      latencyMs: Date.now() - start,
    });
    return text;
  } catch (error) {
    logAiInferenceCall({
      context: options?.context,
      aiMode: mode,
      url,
      model: offlineModel,
      requestPayload,
      status: 500,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/** Whether a feature uses the LLM (vs rule-based DB matching). */
export async function getActiveAiMode(): Promise<"offline" | "online"> {
  return getAiMode();
}
