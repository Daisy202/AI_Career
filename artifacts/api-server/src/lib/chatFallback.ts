import type { DbProgramRow } from "./chatDbContext.js";
import { extractConversationTopic } from "./chatScope.js";
import { ZIMSEC_GRADING_EXPLANATION } from "./zimsecPoints.js";

const TOPIC_KEYWORDS: Array<{ keys: string[]; categories: string[]; programWords: string[] }> = [
  {
    keys: ["medicine", "doctor", "mbchb", "medical", "surgery"],
    categories: ["healthcare"],
    programWords: ["medicine", "nursing", "health"],
  },
  {
    keys: ["engineer", "engineering"],
    categories: ["engineering"],
    programWords: ["engineer"],
  },
  {
    keys: ["law", "lawyer", "llb"],
    categories: ["law"],
    programWords: ["law"],
  },
  {
    keys: ["account", "commerce", "business", "finance"],
    categories: ["business & finance"],
    programWords: ["account", "commerce", "business"],
  },
  {
    keys: ["computer", "software", "technology", "it ", " cyber"],
    categories: ["technology"],
    programWords: ["computer", "software", "information", "cyber", "data"],
  },
  {
    keys: ["teach", "education"],
    categories: ["education"],
    programWords: ["education"],
  },
];

function matchesTopic(text: string): (typeof TOPIC_KEYWORDS)[0] | null {
  const lower = text.toLowerCase();
  for (const topic of TOPIC_KEYWORDS) {
    if (topic.keys.some(k => lower.includes(k))) return topic;
  }
  return null;
}

function medicinePrograms(programs: DbProgramRow[]): DbProgramRow[] {
  return programs.filter(
    p =>
      p.programName.toLowerCase().includes("medicine") ||
      p.programName.toLowerCase().includes("nursing") ||
      (p.careerCategory ?? "").toLowerCase().includes("health")
  );
}

export function buildMedicineOLevelGuidance(programs: DbProgramRow[]): string {
  const health = medicinePrograms(programs);
  const mbchb = health.find(p => p.programName.toLowerCase().includes("medicine"));
  const diplomas = health.filter(p => p.programName.toLowerCase().includes("diploma") || p.programName.toLowerCase().includes("nursing"));

  const aLevelLine = mbchb
    ? `**A-Level to take next:** ${mbchb.requiredSubjects.join(", ")} (UZ **${mbchb.programName}** needs at least ${mbchb.minRequiredSubjects ?? 3} of these; total cut-off ≤ **${mbchb.minimumPoints ?? 15}**).`
    : `**A-Level to take next:** Biology, Chemistry, Physics (and Mathematics if possible) for medicine degrees.`;

  const diplomaLine =
    diplomas.length > 0
      ? `**O-Level only (no A-Level yet):** Consider **${diplomas[0].programName}** at ${diplomas[0].schoolName} — MBChB needs A-Level first.`
      : `**O-Level only:** You need A-Level sciences before MBChB; explore nursing/allied health diplomas in our program list.`;

  return `**O-Level → Medicine path (Zimbabwe)**

${aLevelLine}

${diplomaLine}

**Work:** Doctors and nurses work in **hospitals, clinics, and private practice** in Zimbabwe (MOHCC, mission hospitals, private hospitals).

**Pay:** Varies by employer (public vs private); medicine is skilled work but training takes many years — focus on meeting **subject and cut-off** requirements first.

${ZIMSEC_GRADING_EXPLANATION}`;
}

export function buildMedicineWorkAndPaySnippet(): string {
  return `**Medicine careers in Zimbabwe — where you work & pay**

• **Where:** Public hospitals (MOHCC), private hospitals, clinics, research, or own practice after registration.
• **Pay:** Depends on sector and experience; public sector uses government scales, private can pay more — completing **MBChB** (5+ years) comes first.
• **Your next step:** Strong **A-Level** sciences (Biology, Chemistry, Physics) and total cut-off **≤15** for competitive programs.

Ask: *"How many points for medicine?"* or *"Which universities offer nursing?"*`;
}

function filterProgramsByTopic(programs: DbProgramRow[], topic: (typeof TOPIC_KEYWORDS)[0]): DbProgramRow[] {
  return programs.filter(p => {
    const cat = (p.careerCategory ?? "").toLowerCase();
    const name = p.programName.toLowerCase();
    return (
      topic.categories.some(c => cat.includes(c)) ||
      topic.programWords.some(w => name.includes(w))
    );
  });
}

function formatProgramLine(p: DbProgramRow): string {
  const subs =
    p.requiredSubjects.length > 0
      ? p.requiredSubjects.join(", ")
      : "see faculty requirements";
  const pts =
    p.minimumPoints != null
      ? `total cut-off ≤ **${p.minimumPoints}** (1–15 scale, lower is better)`
      : "cut-off not listed in our database";
  return `• **${p.programName}** at ${p.schoolName} — A-Level: ${subs}; ${pts}`;
}

export function tryRuleBasedCareerAnswer(
  userMessage: string,
  conversationText: string,
  programs: DbProgramRow[],
  opts?: { isOLevel?: boolean }
): string | null {
  const topic = extractConversationTopic(conversationText);
  const lower = userMessage.toLowerCase();

  if (topic !== "medicine") return null;

  if (
    opts?.isOLevel &&
    /\b(what should i|what (do i|can i) study|o-?level|which subject|a-?level)\b/i.test(lower)
  ) {
    return buildMedicineOLevelGuidance(programs);
  }

  if (/\b(where will i work|good pay|salary|paying|earn|job)\b/i.test(lower)) {
    return buildMedicineWorkAndPaySnippet();
  }

  return null;
}

export function buildDbFallbackAnswer(
  userMessage: string,
  programs: DbProgramRow[],
  conversationText?: string
): string | null {
  const text = conversationText ?? userMessage;
  const lower = userMessage.toLowerCase();
  const asksSubjects =
    /a-?level|subject|require|need|what.*(take|study)/i.test(userMessage);
  const asksPoints = /point|cut-?off|cutoff|score/i.test(userMessage);

  const topic = matchesTopic(text);
  let relevant = topic ? filterProgramsByTopic(programs, topic) : [];

  if (!topic && relevant.length === 0) return null;
  if (topic && relevant.length === 0) {
    return `I don't have ${topic.keys[0]}-related programs in our database yet. Check the Admin programs list or ask about another field.`;
  }

  const top = relevant.slice(0, 5);
  const lines = top.map(formatProgramLine).join("\n");

  if (asksPoints && !asksSubjects) {
    return `From our database (${ZIMSEC_GRADING_EXPLANATION}):\n\n${lines}\n\nEach subject is only **1–5 points**; the numbers above are **total** cut-offs.`;
  }

  if (asksSubjects || topic) {
    return `Here is what our database lists (official program requirements):\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }

  return null;
}
