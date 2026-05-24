/** Scope control for CareerGuide chat — Zimbabwe careers only. */

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
} 

export type ConversationTopic =
  | "medicine"
  | "engineering"
  | "law"
  | "technology"
  | "business"
  | "education"
  | null;

const TOPIC_PATTERNS: Array<{ topic: ConversationTopic; re: RegExp }> = [
  { topic: "medicine", re: /\b(medicine|doctor|mbchb|medical|surgery|nursing)\b/i },
  { topic: "engineering", re: /\b(engineer|engineering)\b/i },
  { topic: "law", re: /\b(lawyer|llb|\blaw\b)/i },
  { topic: "technology", re: /\b(software|computer|programming|cyber|data science|it\b)/i },
  { topic: "business", re: /\b(account|commerce|business|finance|bba)\b/i },
  { topic: "education", re: /\b(teach|education|bed\b)/i },
];

export function buildConversationText(
  message: string,
  history?: ChatTurn[]
): string {
  const prior = (history ?? [])
    .filter(h => h.role === "user")
    .map(h => h.content)
    .join("\n");
  return `${prior}\n${message}`.trim();
}

export function extractConversationTopic(text: string): ConversationTopic {
  for (const { topic, re } of TOPIC_PATTERNS) {
    if (re.test(text)) return topic;
  }
  return null;
}

export type UserMessageKind = "career" | "meta" | "emotional" | "off_topic";

export function classifyUserMessage(message: string): UserMessageKind {
  const lower = message.toLowerCase().trim();

  if (
    /\b(what are you|who are you|programmed to do|your purpose|what can you do|are you an ai|large language)\b/i.test(
      lower
    )
  ) {
    return "meta";
  }

  if (
    /\b(cry|cried|crying|depressed|suicid|kill myself|want to die|self[- ]?harm|hopeless)\b/i.test(
      lower
    ) &&
    !/\b(career|study|subject|university|a-?level|o-?level|job|work)\b/i.test(lower)
  ) {
    return "emotional";
  }

  const offTopic =
    /\b(weather|recipe|football|movie|joke|bitcoin|politics|president|dating|relationship advice)\b/i.test(
      lower
    );
  const careerHint =
    /\b(career|study|subject|university|school|zimsec|cut-?off|a-?level|o-?level|degree|diploma|job|work|salary|pay|medicine|engineer)\b/i.test(
      lower
    );

  if (offTopic && !careerHint) return "off_topic";

  return "career";
}

export function getCannedResponse(kind: UserMessageKind): string {
  switch (kind) {
    case "meta":
      return `I'm **CareerGuide AI** for Zimbabwe — not a general chatbot.

I help with:
• **A-Level / O-Level** subjects for careers and degrees
• **University programs** and **ZIMSEC cut-offs** (1–5 per subject, **1–15** total)
• **Career paths** using our verified program database

Ask something like: *"What A-Levels for medicine?"* or *"I'm O-Level only — what diploma can I do?"*`;

    case "emotional":
      return `I'm sorry you're feeling this way. I'm only a **career and study guide**, not a counsellor.

Please talk to someone you trust, a teacher, or a school counsellor. If you're in crisis, contact local emergency or mental-health services in your area.

When you're ready, I can help with **subjects, universities, and career options** in Zimbabwe.`;

    case "off_topic":
      return `I can only help with **careers, subjects, and universities in Zimbabwe**. Try asking about A-Level choices, cut-off points, or programs in our database.`;

    default:
      return "";
  }
}

/** LLM drifted into generic ChatGPT mode, wrong career, or non-Zimbabwe counselling. */
export function isOffTopicAssistantResponse(
  text: string,
  topic: ConversationTopic
): boolean {
  const lower = text.toLowerCase();

  if (
    /\b(large language model|translation|poems?|musical pieces|write different kinds of creative)\b/i.test(
      lower
    )
  ) {
    return true;
  }

  if (
    /\b(not a substitute for professional|therapy or counseling|crisis resources|suicide prevention)\b/i.test(
      lower
    ) &&
    !/\b(career|university|a-?level|o-?level|zimsec|program)\b/i.test(lower)
  ) {
    return true;
  }

  if (topic === "medicine") {
    if (
      /\b(agricultural technician|environmental technician|agriculture & environment|soil analysis|farming)\b/i.test(
        lower
      ) &&
      !/\b(medicine|mbchb|doctor|hospital|nursing|healthcare)\b/i.test(lower)
    ) {
      return true;
    }
  }

  return false;
}

export function isOLevelStudent(
  message: string,
  aLevelSubjects?: string[],
  oLevelSubjects?: string[]
): boolean {
  if (/\bo-?level\b/i.test(message) && !/\ba-?level\b/i.test(message)) return true;
  const a = aLevelSubjects ?? [];
  const o = oLevelSubjects ?? [];
  if (o.length >= 3 && a.length === 0) return true;
  if (/\bonly o-?level\b/i.test(message)) return true;
  return false;
}

export function asksCareerGuidance(message: string): boolean {
  return /\b(what should i|what (do i|can i) study|which subject|where will i work|good pay|salary|job|career|work will i)\b/i.test(
    message
  );
}
