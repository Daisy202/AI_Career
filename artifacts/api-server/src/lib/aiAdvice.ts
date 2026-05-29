/**
 * AI explanation layer only — eligibility is computed in programRecommendationEngine.
 */
import { sanitizeCutoffMentionsInText } from "./zimsecPoints.js";
import { generateAdviceText } from "./aiProvider.js";
import type { DbProgramRow } from "./chatDbContext.js";
import {
  AI_EXPLANATION_SYSTEM_RULES,
  buildAiRecommendationPayload,
  payloadToPromptBlock,
  type AiRecommendationPayload,
} from "./programRecommendationEngine.js";
import { normalizeSubjectList } from "./subjectMatch.js";

export interface ProfileForAdvice {
  interests: string[];
  strengths: string[];
  subjects: string[];
  oLevelSubjects: string[];
  personalityType?: string | null;
  cutOffPoints?: number | null;
}

export interface ProgramForAdvice {
  schoolName: string;
  programName: string;
  programType?: string;
  campus?: string;
  description?: string;
}

export interface RecommendationForAdvice {
  careerName: string;
  careerCategory: string;
  matchPercentage: number;
  qualifyingPrograms: ProgramForAdvice[];
}

export interface AiAdviceResult {
  advice: string;
  recommendedPrograms: Array<{ programName: string; schoolName: string }>;
  enginePayload: AiRecommendationPayload;
}

const MONTH_NAMES =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

export function hasTemporalPhrasing(text: string): boolean {
  if (!text) return false;
  const monthRe = new RegExp(
    `\\b(as of|as at|on|by|since|until|before|after)\\s+(${MONTH_NAMES}|\\d{1,2})\\b`,
    "i"
  );
  const todayRe = new RegExp(
    `\\b(today is|today's date|right now it is)\\s+\\d{1,2}\\s+(${MONTH_NAMES})\\b`,
    "i"
  );
  const dateRe = new RegExp(
    `\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTH_NAMES})(\\s+\\d{4})?\\b`,
    "i"
  );
  return (
    monthRe.test(text) ||
    todayRe.test(text) ||
    dateRe.test(text) ||
    /\b(as of today|as of now|at this time|at the moment)\b/i.test(text)
  );
}

export function sanitizeResponseStyle(text: string): string {
  if (!text) return text;

  let out = text
    .replace(
      new RegExp(`\\b(as of|as at)\\s+(${MONTH_NAMES})\\s+\\d{1,2},?\\s*\\d{0,4}\\b`, "gi"),
      ""
    )
    .replace(new RegExp(`\\b(as of|as at)\\s+\\d{4}\\b`, "gi"), "")
    .replace(
      new RegExp(`\\b(on|by|since|until)\\s+\\d{1,2}(st|nd|rd|th)?\\s+(${MONTH_NAMES})\\s*\\d{0,4}\\b`, "gi"),
      ""
    )
    .replace(new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTH_NAMES})\\s+\\d{4}\\b`, "gi"), "")
    .replace(new RegExp(`\\b(${MONTH_NAMES})\\s+\\d{1,2},?\\s+\\d{4}\\b`, "gi"), "")
    .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, "")
    .replace(/\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/g, "")
    .replace(/\b(?:at\s*)?\d{1,2}:\d{2}\s*(?:am|pm)?\b/gi, "")
    .replace(/\b(today is|today's date|right now it is)\s+[^.!?\n]+/gi, "")
    .replace(/\b(as of today|as of now|at this time|at the moment)\b[:,]?\s*/gi, "")
    .replace(/\b(today|currently|at present|nowadays)\b[:,]?\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (hasTemporalPhrasing(out)) {
    out = out
      .replace(new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTH_NAMES})\\b`, "gi"), "")
      .replace(/\b(as of|as at)\b[^.!?\n]*/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return out;
}

export function extractProgramsFromAiText(
  aiText: string,
  dbPrograms: Array<{ programName: string; schoolName: string }>
): Array<{ programName: string; schoolName: string }> {
  const text = aiText.toLowerCase();
  const found: Array<{ programName: string; schoolName: string }> = [];
  const seen = new Set<string>();

  for (const p of dbPrograms) {
    const key = `${p.programName}|${p.schoolName}`;
    if (seen.has(key)) continue;

    const progLower = p.programName.toLowerCase();
    const schoolLower = p.schoolName.toLowerCase();

    const exactProg = text.includes(progLower);
    const exactSchool = text.includes(schoolLower);
    const progWords = progLower.split(/\s+/).filter(w => w.length > 2);
    const schoolWords = schoolLower.split(/\s+/).filter(w => w.length > 2);
    const progPartial =
      progWords.filter(w => !["the", "and", "for", "in", "of"].includes(w)).length >= 2 &&
      progWords.filter(w => text.includes(w)).length >= 2;
    const schoolPartial = schoolWords.some(w => text.includes(w));

    if ((exactProg || progPartial) && (exactSchool || schoolPartial)) {
      found.push({ programName: p.programName, schoolName: p.schoolName });
      seen.add(key);
    }
  }
  return found;
}

export async function generateCareerAdvice(
  profile: ProfileForAdvice,
  programs: DbProgramRow[],
  notEligibleCareers: Array<{ career: string; missingSubjects: string[] }>,
  opts?: { userId?: number | null; enginePayload?: AiRecommendationPayload }
): Promise<AiAdviceResult> {
  const payload =
    opts?.enginePayload ??
    buildAiRecommendationPayload(
      programs,
      {
        subjects: normalizeSubjectList(profile.subjects ?? []),
        oLevelSubjects: normalizeSubjectList(profile.oLevelSubjects ?? []),
        cutOffPoints: profile.cutOffPoints ?? null,
        interests: profile.interests ?? [],
        strengths: profile.strengths ?? [],
        personalityType: profile.personalityType,
      },
      notEligibleCareers
    );

  const prompt = `${AI_EXPLANATION_SYSTEM_RULES}

TASK:
Generate concise personalized academic guidance.

${payloadToPromptBlock(payload)}

INSTRUCTIONS:
- If status is no_direct_degree_match, explain briefly and recommend ONLY alternativePathways
- Mention missing requirements from notEligibleCareers only when relevant
- List programs in order of subject fit; lead with arts/media/journalism programs when those appear in degreePrograms
- Do NOT lead with engineering or science degrees unless they are the only matches
- Use interests/strengths ONLY to pick among programs already in the payload — never to add new programs
- Do not invent any program not listed above`;

  try {
    const raw = await generateAdviceText(prompt, {
      temperature: 0.2,
      maxTokens: 200,
      context: { source: "recommendation_advice", userId: opts?.userId ?? null },
    });
    const advice = sanitizeResponseStyle(sanitizeCutoffMentionsInText(raw));
    const recommendedPrograms = extractProgramsFromAiText(
      advice,
      programs.map(p => ({ programName: p.programName, schoolName: p.schoolName }))
    );

    return { advice, recommendedPrograms, enginePayload: payload };
  } catch (error) {
    console.error("AI advice generation failed:", error);
    return { advice: "", recommendedPrograms: [], enginePayload: payload };
  }
}
