/**
 * Database-first answers for Zimbabwe career/education chat questions.
 * Prefer verified program/career data over LLM generation.
 */
import type { CareerRow, DbProgramRow } from "./chatDbContext.js";
import {
  extractSchoolMention,
  findUniversitiesInText,
  resolveUniversityName,
} from "./universities.js";
import { normalizeEducationChatText } from "./chatTextNormalize.js";
import { ZIMSEC_GRADING_EXPLANATION } from "./zimsecPoints.js";
import { subjectAlias } from "./subjectMatch.js";
import { meetsCutoffRequirement } from "./zimsecPoints.js";
import { programMeetsRequiredSubjects } from "./subjectGate.js";

export interface ChatAnswerContext {
  message: string;
  conversationText: string;
  programs: DbProgramRow[];
  careers: CareerRow[];
  studentProfile?: {
    interests?: string[];
    strengths?: string[];
    subjects?: string[];
    oLevelSubjects?: string[];
    cutOffPoints?: number | null;
  };
  isOLevel?: boolean;
}

const IN_SCOPE_RE =
  /\b(career|careers|job|jobs|work|salary|pay|marketable|demand|study|stud(y|ies)|subject|subjects|a-?level|o-?level|zimsec|cut-?off|cutoff|points?|universit(y|ies)|college|colleges|polytechnic|school|programs?|programmes?|courses?|degree|diploma|certificate|hexco|tvet|faculty|intake|apply|application|admission|requirement|entry|offered|available|zimbabwe|mbchb|llb|engineer|engineering|medicine|nursing|account|commerce|business|ict|software|computer|law|agriculture|teaching|education|form\s*[456]|recommend|compare|versus|vs\b|which\s+(is\s+)?better|after\s+form|without\s+a-?level|no\s+a-?level|interest|personality|mathematics|maths|biology|chemistry|physics|geography|english|accounts?)\b/i;

const SCHOOL_PROGRAMS_QUESTION_RE =
  /\b(which\s+programs?|what\s+(courses?|programs?)|programs?\s+(are\s+)?(offered|available)|courses?\s+(are\s+)?(offered|available)|courses?\s+at|programs?\s+at)\b/i;

const OFF_TOPIC_RE =
  /\b(weather|forecast|recipe|cook|football|soccer|cricket|movie|netflix|joke|meme|bitcoin|crypto|stock\s+market|forex|dating|girlfriend|boyfriend|relationship\s+advice|who\s+is\s+the\s+president|election|war\s+in|translate\s+this|write\s+(a\s+)?poem|homework\s+help|math\s+problem\s+solve|2\s*\+\s*2)\b/i;

const TOPIC_RULES: Array<{
  keys: RegExp;
  categories: string[];
  programWords: string[];
  aLevelHint?: string[];
  oLevelHint?: string[];
}> = [
  {
    keys: /\b(medicine|doctor|mbchb|medical|surgery|nursing|pharmacy|radiograph|physio)\b/i,
    categories: ["health"],
    programWords: ["medicine", "nursing", "health", "pharmacy", "clinical"],
    aLevelHint: ["Biology", "Chemistry", "Physics", "Mathematics"],
  },
  {
    keys: /\b(engineer|engineering|civil|mechanical|electrical|mining|telecom)\b/i,
    categories: ["engineer"],
    programWords: ["engineer"],
    aLevelHint: ["Mathematics", "Physics"],
  },
  {
    keys: /\b(law|lawyer|llb|legal|advocate)\b/i,
    categories: ["law"],
    programWords: ["law"],
    aLevelHint: ["English Literature", "History"],
  },
  {
    keys: /\b(account|commerce|business|finance|marketing|entrepreneur|hr|human resources)\b/i,
    categories: ["business"],
    programWords: ["account", "commerce", "business", "finance", "marketing", "management"],
    aLevelHint: ["Mathematics", "Accounts", "Commerce"],
  },
  {
    keys: /\b(software|computer|programming|cyber|data science|information technology|\bict\b|developer|web\s+dev)\b/i,
    categories: ["technology"],
    programWords: ["computer", "software", "information", "cyber", "data", "ict"],
    aLevelHint: ["Mathematics", "Physics"],
  },
  {
    keys: /\b(teach|education|bed|teacher|lecturer)\b/i,
    categories: ["education"],
    programWords: ["education"],
    aLevelHint: ["varies by teaching subject"],
  },
  {
    keys: /\b(agriculture|farming|agronomy|crop|livestock|veterinary)\b/i,
    categories: ["agriculture"],
    programWords: ["agriculture", "animal", "crop", "agri"],
    aLevelHint: ["Biology", "Chemistry", "Geography"],
  },
  {
    keys: /\b(journalism|media|communication|graphic design|film|broadcast)\b/i,
    categories: ["media", "communication"],
    programWords: ["journalism", "media", "communication", "graphic", "film", "radio"],
    aLevelHint: ["English Literature", "History"],
  },
  {
    keys: /\b(tourism|hospitality|hotel|catering)\b/i,
    categories: ["business", "hospitality"],
    programWords: ["tourism", "hospitality", "hotel"],
    aLevelHint: ["Geography", "English Literature"],
  },
  {
    keys: /\b(pilot|aviation)\b/i,
    categories: ["engineer", "technology"],
    programWords: ["aviation", "aeronautic"],
    aLevelHint: ["Mathematics", "Physics"],
  },
];

const SUBJECT_ALIASES: Record<string, string[]> = {
  maths: ["mathematics", "math"],
  mathematics: ["maths", "math"],
  accounts: ["accounting", "accounts"],
  english: ["english language", "english literature", "literature"],
  ict: ["computer science", "information technology"],
};

export function isClearlyOutOfScope(message: string): boolean {
  const lower = normalizeEducationChatText(message).toLowerCase();
  if (SCHOOL_PROGRAMS_QUESTION_RE.test(lower)) return false;
  if (OFF_TOPIC_RE.test(lower) && !IN_SCOPE_RE.test(lower)) return true;
  if (/\b(study\s+abroad|ielts|toefl|visa\s+for\s+uk|study\s+in\s+canada|study\s+in\s+usa)\b/i.test(lower)) {
    return !/\b(zimbabwe|local|universit|programs?)\b/i.test(lower);
  }
  return !IN_SCOPE_RE.test(lower);
}

function detectTopic(text: string): (typeof TOPIC_RULES)[0] | null {
  for (const rule of TOPIC_RULES) {
    if (rule.keys.test(text)) return rule;
  }
  return null;
}

function filterByTopic(programs: DbProgramRow[], rule: (typeof TOPIC_RULES)[0]): DbProgramRow[] {
  return programs.filter(p => {
    const cat = (p.careerCategory ?? "").toLowerCase();
    const name = p.programName.toLowerCase();
    return (
      rule.categories.some(c => cat.includes(c)) ||
      rule.programWords.some(w => name.includes(w))
    );
  });
}

function formatProgramLine(p: DbProgramRow): string {
  const type = (p.programType ?? "degree").toLowerCase();
  const typeTag = type !== "degree" ? ` [${type}]` : "";
  const subs =
    p.requiredSubjects.length > 0
      ? p.requiredSubjects.join(", ")
      : "none listed (check O-Level passes)";
  const minReq =
    p.minRequiredSubjects != null && p.minRequiredSubjects < p.requiredSubjects.length
      ? ` (at least ${p.minRequiredSubjects} of listed A-Level subjects)`
      : "";
  const pts =
    p.minimumPoints != null ? `cut-off ≤ **${p.minimumPoints}**` : "cut-off: **-** (not listed)";
  return `• **${p.programName}** @ ${p.schoolName}${typeTag} — A-Level: ${subs}${minReq}; ${pts}`;
}

function findProgramsByName(programs: DbProgramRow[], query: string): DbProgramRow[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const exact = programs.filter(p => p.programName.toLowerCase() === q);
  if (exact.length > 0) return exact;
  return programs.filter(p => {
    const name = p.programName.toLowerCase();
    return name.includes(q) || q.includes(name) || wordOverlapScore(name, q) >= 0.55;
  });
}

function wordOverlapScore(a: string, b: string): number {
  const wa = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(b.split(/\s+/).filter(w => w.length > 2));
  if (wa.size === 0 || wb.size === 0) return 0;
  let hit = 0;
  for (const w of wa) if (wb.has(w)) hit++;
  return hit / Math.max(wa.size, wb.size);
}

function findSchoolsInPrograms(message: string, programs: DbProgramRow[]): string[] {
  const lower = message.toLowerCase();
  const found = new Set<string>();
  const names = [...new Set(programs.map(p => p.schoolName))].sort(
    (a, b) => b.length - a.length
  );
  for (const name of names) {
    if (lower.includes(name.toLowerCase())) found.add(name);
  }
  return [...found];
}

function extractProgramQuery(message: string, programs: DbProgramRow[]): string | null {
  const lower = message.toLowerCase();
  const sorted = [...programs].sort((a, b) => b.programName.length - a.programName.length);
  for (const p of sorted) {
    if (lower.includes(p.programName.toLowerCase())) return p.programName;
  }
  const offerMatch = lower.match(
    /\b(?:offer|study|do|for)\s+([a-z][a-z\s&]{2,50}?)(?:\s+at|\s+in|\?|$)/i
  );
  if (offerMatch?.[1]) {
    const candidate = offerMatch[1].trim();
    const hits = findProgramsByName(programs, candidate);
    if (hits.length > 0) return hits[0].programName;
  }
  return null;
}

function extractSubjectsFromText(text: string): string[] {
  const found = new Set<string>();
  const lower = text.toLowerCase();
  const candidates = [
    "mathematics", "maths", "physics", "chemistry", "biology", "geography",
    "history", "english literature", "english language", "accounts", "accounting",
    "commerce", "business studies", "computer science", "ict", "economics",
    "agriculture", "art", "design", "physical education",
  ];
  for (const c of candidates) {
    if (lower.includes(c)) found.add(normalizeSubjectLabel(c));
  }
  return [...found];
}

function normalizeSubjectLabel(s: string): string {
  const t = s.trim().toLowerCase();
  if (t === "maths" || t === "math") return "Mathematics";
  if (t === "accounts") return "Accounts";
  if (t === "english language" || t === "english literature") return "English Literature";
  if (t === "ict") return "Computer Science";
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function subjectsMatchProgram(
  program: DbProgramRow,
  studentSubjects: string[]
): { matches: number; required: number; qualifies: boolean } {
  const required = program.requiredSubjects ?? [];
  const minReq = program.minRequiredSubjects ?? required.length;
  if (required.length === 0) {
    return { matches: 0, required: 0, qualifies: true };
  }
  const subLower = studentSubjects.map(s => s.toLowerCase().trim());
  let matched = 0;
  for (const req of required) {
    const r = req.toLowerCase();
    if (
      subLower.some(
        s =>
          s.includes(r) ||
          r.includes(s) ||
          subjectAlias(s, r) ||
          (SUBJECT_ALIASES[s.split(/\s+/)[0]] ?? []).some(a => r.includes(a))
      )
    ) {
      matched++;
    }
  }
  return { matches: matched, required: minReq, qualifies: matched >= minReq };
}

function programsForStudentSubjects(
  programs: DbProgramRow[],
  aLevel: string[],
  oLevel: string[],
  cutOff?: number | null
): DbProgramRow[] {
  const a = aLevel.length > 0 ? aLevel : [];
  const scored = programs.map(p => {
    const isDiploma = (p.programType ?? "degree") === "diploma" || (p.programType ?? "") === "certificate";
    if (a.length === 0 && !isDiploma) {
      return { p, score: -1 };
    }
    const { qualifies, matches } = subjectsMatchProgram(p, [...a, ...oLevel]);
    if (!qualifies && a.length > 0) return { p, score: -1 };
    let score = matches * 3;
    if (isDiploma && a.length === 0) score += 4;
    if (cutOff != null && p.minimumPoints != null) {
      if (meetsCutoffRequirement(cutOff, p.minimumPoints)) score += 2;
    }
    return { p, score };
  });
  return scored
    .filter(x => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map(x => x.p);
}

function filterProgramsBySchool(programs: DbProgramRow[], schoolName: string): DbProgramRow[] {
  const q = schoolName.toLowerCase();
  const exact = programs.filter(p => p.schoolName.toLowerCase() === q);
  if (exact.length > 0) return exact;
  return programs.filter(
    p =>
      p.schoolName.toLowerCase().includes(q) ||
      q.includes(p.schoolName.toLowerCase().slice(0, Math.min(q.length, 14)))
  );
}

async function listSchoolPrograms(
  programs: DbProgramRow[],
  schoolQuery: string,
  limit = 12
): Promise<string> {
  const programSchools = [...new Set(programs.map(p => p.schoolName))];
  const resolved =
    (await resolveUniversityName(schoolQuery, programSchools)) ?? schoolQuery;
  const hits = filterProgramsBySchool(programs, resolved);
  const displayName = hits[0]?.schoolName ?? resolved;
  if (hits.length === 0) {
    return `I could not find programs listed for **${schoolQuery}** in our database. Try the full school name (e.g. *Chinhoyi University of Technology*) or another institution.`;
  }
  const lines = hits.slice(0, limit).map(formatProgramLine).join("\n");
  const more = hits.length > limit ? `\n\n_+${hits.length - limit} more programs at this school._` : "";
  return `**Programs at ${displayName}** (${hits.length} in database):\n\n${lines}${more}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
}

async function resolveSchoolsInMessage(
  message: string,
  programs: DbProgramRow[]
): Promise<string[]> {
  const normalized = normalizeEducationChatText(message);
  const programSchools = [...new Set(programs.map(p => p.schoolName))];
  const fromDb = await findUniversitiesInText(normalized, programSchools);
  const fromPrograms = findSchoolsInPrograms(normalized, programs);
  const schools = new Set([...fromDb, ...fromPrograms]);

  const mention = extractSchoolMention(normalized);
  if (mention) {
    const resolved = await resolveUniversityName(mention, programSchools);
    if (resolved) schools.add(resolved);
  }

  const tokens = message.match(/\b[A-Z]{2,8}\b/g) ?? [];
  for (const token of tokens) {
    const resolved = await resolveUniversityName(token, programSchools);
    if (resolved) schools.add(resolved);
  }

  return [...schools];
}

function listProgramsByName(programs: DbProgramRow[], programQuery: string): string {
  const hits = findProgramsByName(programs, programQuery);
  if (hits.length === 0) {
    return `I don't have **${programQuery}** in our Zimbabwe program database. Try a similar name (e.g. "Computer Science", "Nursing Science").`;
  }
  const bySchool = new Map<string, DbProgramRow[]>();
  for (const p of hits) {
    if (!bySchool.has(p.schoolName)) bySchool.set(p.schoolName, []);
    bySchool.get(p.schoolName)!.push(p);
  }
  const lines: string[] = [];
  for (const [school, list] of bySchool) {
    lines.push(`**${list[0].programName}** — offered at **${school}** and ${list.length > 1 ? `${list.length - 1} other campus/entries` : "listed once"}`);
    const sample = list[0];
    lines.push(formatProgramLine(sample));
  }
  const extraSchools = [...bySchool.keys()].length;
  return `**${hits[0].programName}** in Zimbabwe (${extraSchools} institution(s)):\n\n${lines.join("\n")}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
}

function programRequirementsAnswer(
  programs: DbProgramRow[],
  programName: string,
  schoolName?: string | null
): string {
  let hits = findProgramsByName(programs, programName);
  if (schoolName) {
    hits = hits.filter(p => p.schoolName.toLowerCase() === schoolName.toLowerCase());
  }
  if (hits.length === 0) {
    return `No entry for **${programName}**${schoolName ? ` at ${schoolName}` : ""} in our database.`;
  }
  const lines = hits.slice(0, 6).map(formatProgramLine).join("\n");
  return `**Entry requirements (${programName})** from our database:\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
}

function comparePrograms(programs: DbProgramRow[], message: string): string | null {
  const lower = message.toLowerCase();
  if (!/\b(compare|versus|vs\b|which\s+is\s+better|difference\s+between)\b/i.test(lower)) {
    return null;
  }
  const names: string[] = [];
  const sorted = [...programs].sort((a, b) => b.programName.length - a.programName.length);
  for (const p of sorted) {
    if (lower.includes(p.programName.toLowerCase()) && !names.includes(p.programName)) {
      names.push(p.programName);
    }
    if (names.length >= 2) break;
  }
  if (names.length < 2) return null;
  const a = findProgramsByName(programs, names[0]).slice(0, 3);
  const b = findProgramsByName(programs, names[1]).slice(0, 3);
  return `**Comparison: ${names[0]} vs ${names[1]}**\n\n**${names[0]}:**\n${a.map(formatProgramLine).join("\n") || "• Not in database"}\n\n**${names[1]}:**\n${b.map(formatProgramLine).join("\n") || "• Not in database"}\n\nUse cut-off and A-Level fit to decide. ${ZIMSEC_GRADING_EXPLANATION}`;
}

function careersByCategory(careers: CareerRow[], categoryFragment: string): CareerRow[] {
  const f = categoryFragment.toLowerCase();
  return careers.filter(
    c => c.category.toLowerCase().includes(f) || c.name.toLowerCase().includes(f)
  );
}

function careerDiscoveryAnswer(ctx: ChatAnswerContext): string | null {
  const lower = ctx.message.toLowerCase();
  const asksCareer =
    /\b(what career|which career|careers?\s+(suit|match|fit|can i)|jobs?\s+(can|could)|recommend\s+career|career\s+path)\b/i.test(
      lower
    );
  if (!asksCareer && !/\b(marketable|in demand|pay well|high.?paying)\b/i.test(lower)) {
    return null;
  }

  const topic = detectTopic(ctx.conversationText);
  if (topic) {
    const aLevel = ctx.studentProfile?.subjects ?? [];
    const oLevel = ctx.studentProfile?.oLevelSubjects ?? [];
    const msgSubs = extractSubjectsFromText(ctx.message);
    const studentSubs = [...aLevel, ...oLevel, ...msgSubs];

    if (/\b(recommend|suit|match|fit|what career|which career)\b/i.test(lower) && studentSubs.length === 0) {
      return `To recommend careers in **${topic.categories[0]}**, share your **A-Level or O-Level subjects** first. Matches are based on required subjects; interests refine results only after subjects align.\n\n${ZIMSEC_GRADING_EXPLANATION}`;
    }

    let progs = filterByTopic(ctx.programs, topic);
    if (studentSubs.length > 0) {
      progs = progs.filter(p =>
        programMeetsRequiredSubjects(
          p.requiredSubjects,
          p.minRequiredSubjects,
          aLevel.length > 0 ? aLevel : msgSubs,
          oLevel
        )
      );
    }
    progs = progs.slice(0, 8);

    const cats = careersByCategory(ctx.careers, topic.categories[0]).slice(0, 5);
    const careerLines = cats.map(
      c => `• **${c.name}** (${c.category}) — ${c.jobOutlook}; typical pay: ${c.averageSalary}`
    );
    const progLines = progs.map(formatProgramLine).join("\n");
    if (studentSubs.length > 0 && !progLines) {
      return `Your subjects (${studentSubs.join(", ")}) do not yet meet typical **${topic.categories[0]}** program requirements in our database. Consider related diploma paths or adjusting your subject combination.\n\n${ZIMSEC_GRADING_EXPLANATION}`;
    }
    return `**Careers & programs in ${topic.categories[0]} (Zimbabwe, from our database):**\n\n${careerLines.join("\n") || "• See related programs below"}\n\n**Programs matching your subjects:**\n${progLines || "• Add programs in admin if missing"}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }

  const profileSubs = [
    ...(ctx.studentProfile?.subjects ?? []),
    ...(ctx.studentProfile?.oLevelSubjects ?? []),
  ];
  if (profileSubs.length > 0) {
    const matched = programsForStudentSubjects(
      ctx.programs,
      ctx.studentProfile?.subjects ?? [],
      ctx.studentProfile?.oLevelSubjects ?? [],
      ctx.studentProfile?.cutOffPoints ?? null
    );
    const categories = [...new Set(matched.map(p => p.careerCategory).filter(Boolean))].slice(0, 6);
    const lines = matched.slice(0, 8).map(formatProgramLine).join("\n");
    return `**Careers & programs matching your profile subjects:**\n\nCategories: ${categories.join(", ") || "various"}\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }

  const msgSubs = extractSubjectsFromText(ctx.message);
  if (msgSubs.length > 0) {
    const matched = programsForStudentSubjects(ctx.programs, msgSubs, [], null);
    const lines = matched.slice(0, 8).map(formatProgramLine).join("\n");
    return `**Careers you can explore with ${msgSubs.join(", ")}:**\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }

  const topCareers = ctx.careers.slice(0, 8);
  if (topCareers.length > 0) {
    const lines = topCareers.map(
      c => `• **${c.name}** (${c.category}) — ${c.averageSalary}; ${c.jobOutlook}`
    );
    return `**Popular career paths in Zimbabwe (from our database):**\n\n${lines.join("\n")}\n\nTell me your **subjects** or **interests** for a tighter match.\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }
  return null;
}

function subjectGuidanceAnswer(ctx: ChatAnswerContext): string | null {
  const lower = ctx.message.toLowerCase();
  const topic = detectTopic(ctx.conversationText) ?? detectTopic(lower);
  if (!topic) return null;

  const asksSubjects =
    /\b(which\s+(o-?level|a-?level)\s+subject|subjects?\s+(required|need)|best\s+combination|combination|compulsory|required\s+for)\b/i.test(
      lower
    );
  if (!asksSubjects) return null;

  const progs = filterByTopic(ctx.programs, topic).slice(0, 6);
  const sample = progs[0];
  const fromDb =
    sample && sample.requiredSubjects.length > 0
      ? sample.requiredSubjects.join(", ")
      : topic.aLevelHint?.join(", ") ?? "see program list";

  const progLines = progs.map(formatProgramLine).join("\n");
  const level = /\bo-?level\b/i.test(lower) ? "O-Level" : "A-Level";

  return `**${level} subjects for this field (Zimbabwe):**\n\nCommonly required A-Level subjects in our database: **${fromDb}**.\n\n**Example programs:**\n${progLines || "• No programs loaded for this topic yet"}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
}

function diplomaPathAnswer(ctx: ChatAnswerContext): string | null {
  const lower = ctx.message.toLowerCase();
  if (!/\b(without\s+a-?level|no\s+a-?level|o-?level\s+only|after\s+form\s*4|diploma|certificate|polytechnic|hexco|tvet)\b/i.test(lower)) {
    return null;
  }
  const diplomas = ctx.programs.filter(p => {
    const t = (p.programType ?? "degree").toLowerCase();
    return t === "diploma" || t === "certificate";
  });
  const topic = detectTopic(ctx.conversationText);
  let list = diplomas;
  if (topic) list = filterByTopic(diplomas, topic);
  const lines = list.slice(0, 10).map(formatProgramLine).join("\n");
  if (!lines) {
    return `We have diploma/certificate pathways in the database, but none matched that topic. Ask: *"Which polytechnic programs are in ICT?"*`;
  }
  return `**Diploma / certificate pathways (no A-Level required for many):**\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
}

function interestBasedAnswer(ctx: ChatAnswerContext): string | null {
  const lower = ctx.message.toLowerCase();
  const interestMatch = lower.match(/\b(i\s+(like|love|enjoy)|interest(?:ed)?\s+in)\s+([^?.!]+)/i);
  const interestText = interestMatch?.[3] ?? (ctx.studentProfile?.interests ?? []).join(" ");
  if (!interestText.trim()) return null;
  if (!/\b(like|love|enjoy|interest|hate|don't\s+like)\b/i.test(lower) && !(ctx.studentProfile?.interests?.length)) {
    return null;
  }

  const aLevel = ctx.studentProfile?.subjects ?? [];
  const oLevel = ctx.studentProfile?.oLevelSubjects ?? [];
  const msgSubs = extractSubjectsFromText(ctx.message);
  const studentSubs = [...aLevel, ...oLevel, ...msgSubs];

  if (studentSubs.length === 0) {
    return `You mentioned **${interestText.trim()}** — I use **subjects first**, then interests.\n\nAdd your **A-Level/O-Level subjects** in your profile (or type them here) so I can show programs you actually qualify for.\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }

  const topic =
    detectTopic(interestText) ??
    detectTopic(ctx.conversationText) ??
    (/\b(computer|software|ict|coding|programming)\b/i.test(interestText) ? TOPIC_RULES[4] : null);

  if (!topic) return null;

  const progs = filterByTopic(ctx.programs, topic)
    .filter(p =>
      programMeetsRequiredSubjects(
        p.requiredSubjects,
        p.minRequiredSubjects,
        aLevel.length > 0 ? aLevel : msgSubs,
        oLevel
      )
    )
    .slice(0, 8);

  if (progs.length === 0) {
    return `You like **${interestText.trim()}**, but with **${studentSubs.join(", ")}** you don't meet typical ${topic.categories[0]} program subject requirements yet.\n\nTry a related diploma path or ask which subjects you need for this field.\n\n${ZIMSEC_GRADING_EXPLANATION}`;
  }

  const lines = progs.map(formatProgramLine).join("\n");
  return `**Because you like ${interestText.trim()}**, these paths fit your **subjects** (${studentSubs.join(", ")}):\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
}

function generalGuidanceAnswer(ctx: ChatAnswerContext): string | null {
  const lower = ctx.message.toLowerCase();
  if (!/\b(what can i do after|university or polytechnic|difference between|diploma and degree|how long|form\s*[46])\b/i.test(lower)) {
    return null;
  }
  if (/\b(difference between).*(diploma|degree)\b/i.test(lower)) {
    return `**Diploma vs degree (Zimbabwe):**\n\n• **Diploma/Certificate** — shorter, practical entry; many accept **O-Level only** (see our diploma programs).\n• **Degree** — usually needs **A-Level** (often 2+ subjects) and cut-off points.\n\nAsk: *"Which diploma programs match my O-Levels?"* or *"What degree can I do with my A-Levels?"*`;
  }
  if (/\b(university or polytechnic|polytechnic or university)\b/i.test(lower)) {
    return `**University vs polytechnic:**\n\n• **University** — degrees (4+ years), research-focused.\n• **Polytechnic/college** — diplomas & national certificates (practical, often faster entry).\n\nI can list options from our database if you share your **subjects** and **points**.`;
  }
  if (/\bafter form\s*4\b/i.test(lower)) {
    return diplomaPathAnswer(ctx);
  }
  return null;
}

/**
 * Main entry: return a database-backed answer or null to allow LLM fallback.
 */
export async function answerFromDatabase(ctx: ChatAnswerContext): Promise<string | null> {
  const { message, programs } = ctx;
  const normalizedMessage = normalizeEducationChatText(message);
  const lower = normalizedMessage.toLowerCase();

  const comparison = comparePrograms(programs, message);
  if (comparison) return comparison;

  const schools = await resolveSchoolsInMessage(message, programs);
  const programQuery = extractProgramQuery(message, programs);

  if (schools.length > 0 && SCHOOL_PROGRAMS_QUESTION_RE.test(lower)) {
    return listSchoolPrograms(programs, schools[0]);
  }

  if (programQuery && /\b(can i study|study\s+.+\s+with)\b/i.test(lower)) {
    const subs = extractSubjectsFromText(message);
    const hits = findProgramsByName(programs, programQuery);
    const scoped = schools.length > 0 ? hits.filter(p => p.schoolName === schools[0]) : hits;
    const list = (scoped.length > 0 ? scoped : hits).slice(0, 4);
    if (list.length > 0 && subs.length > 0) {
      const lines = list.map(p => {
        const { qualifies, matches, required } = subjectsMatchProgram(p, subs);
        const status = qualifies
          ? "likely meets subject rules"
          : `matches ${matches}/${required} required subjects`;
        return `${formatProgramLine(p)} — _${status}_`;
      });
      return `**Can you study ${programQuery} with ${subs.join(", ")}?**\n\n${lines.join("\n")}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
    }
  }

  if (programQuery && schools.length > 0 && /\b(requirement|requirements|points?|cut-?off|need|entry)\b/i.test(lower)) {
    return programRequirementsAnswer(programs, programQuery, schools[0]);
  }

  if (programQuery && /\b(requirement|requirements|points?|cut-?off|need|entry|grades?)\b/i.test(lower)) {
    return programRequirementsAnswer(programs, programQuery, schools[0] ?? null);
  }

  if (programQuery && /\b(offer|offered|available|have)\b/i.test(lower)) {
    return listProgramsByName(programs, programQuery);
  }

  if (/\b(which\s+universit|which\s+schools?|where\s+can\s+i\s+study|universities?\s+offer)\b/i.test(lower) && programQuery) {
    return listProgramsByName(programs, programQuery);
  }

  if (schools.length === 1 && /\b(at|for|from)\b/i.test(lower)) {
    return listSchoolPrograms(programs, schools[0], 15);
  }

  const careerAns = careerDiscoveryAnswer(ctx);
  if (careerAns) return careerAns;

  const subjectAns = subjectGuidanceAnswer(ctx);
  if (subjectAns) return subjectAns;

  const diplomaAns = diplomaPathAnswer(ctx);
  if (diplomaAns) return diplomaAns;

  const interestAns = interestBasedAnswer(ctx);
  if (interestAns) return interestAns;

  const generalAns = generalGuidanceAnswer(ctx);
  if (generalAns) return generalAns;

  if (/\b(fee|fees|application fee|accommodation|scholarship|bursary|financial aid|living cost|payment plan)\b/i.test(lower)) {
    return `**Fees & financial aid:** Our database lists **entry requirements and programs**, not live fee tables or scholarship deadlines. For exact fees at a school, contact the institution directly.\n\nI can still show **programs and cut-offs** — e.g. *"What are the requirements for Computer Science at MSU?"*`;
  }

  if (/\b(how do i apply|application deadline|apply online|documents needed|application status|accept offer|defer admission)\b/i.test(lower)) {
    return `**Applications:** Step-by-step deadlines and fees are set by each university/college and are **not stored in our database**.\n\nUse the institution's admissions office or website. I can help with **which programs you qualify for** and **A-Level/O-Level requirements** from our verified program list.`;
  }

  if (/\b(study abroad|ielts|toefl|visa|international scholarship|transfer abroad)\b/i.test(lower)) {
    return `**International study:** I focus on **Zimbabwe pathways** (ZIMSEC, local universities, polytechnics, diplomas).\n\nFor abroad study, check the target country's embassy and university admissions pages. Locally, ask which **Zimbabwe programs** match your subjects — I can list those from our database.`;
  }

  const topic = detectTopic(ctx.conversationText);
  if (topic && /\b(requirement|requirements|subject|subjects|points?|cut-?off|study|program|course)\b/i.test(lower)) {
    const hits = filterByTopic(programs, topic).slice(0, 8);
    if (hits.length > 0) {
      const lines = hits.map(formatProgramLine).join("\n");
      return `**From our Zimbabwe program database (${topic.categories[0]}):**\n\n${lines}\n\n${ZIMSEC_GRADING_EXPLANATION}`;
    }
  }

  if (IN_SCOPE_RE.test(lower)) {
    const profileAns = careerDiscoveryAnswer({
      ...ctx,
      message: "what careers match my subjects",
    });
    if (profileAns) return profileAns;
  }

  return null;
}
