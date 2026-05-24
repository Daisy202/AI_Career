import type { DbProgramRow } from "./chatDbContext.js";
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

function matchesTopic(message: string): (typeof TOPIC_KEYWORDS)[0] | null {
  const lower = message.toLowerCase();
  for (const topic of TOPIC_KEYWORDS) {
    if (topic.keys.some(k => lower.includes(k))) return topic;
  }
  return null;
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

export function buildDbFallbackAnswer(
  userMessage: string,
  programs: DbProgramRow[]
): string | null {
  const lower = userMessage.toLowerCase();
  const asksSubjects =
    /a-?level|subject|require|need|what.*(take|study)/i.test(userMessage);
  const asksPoints = /point|cut-?off|cutoff|score/i.test(userMessage);

  const topic = matchesTopic(userMessage);
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
