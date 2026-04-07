/**
 * Generate personalized career advice using Ollama, based on student profile
 * and programs in our database (schools, diplomas, degrees).
 * AI response is cross-referenced with DB to display only verified programs.
 */

const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const model = process.env.OLLAMA_MODEL || "gemma3:1b";

export interface ProfileForAdvice {
  interests: string[];
  strengths: string[];
  subjects: string[];
  oLevelSubjects: string[];
  personalityType?: string | null;
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
}

/**
 * Cross-reference AI text with DB programs. Returns programs that appear in the AI response.
 */
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
    const progPartial = progWords.filter(w => !["the", "and", "for", "in", "of"].includes(w)).length >= 2 &&
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
  recommendations: RecommendationForAdvice[],
  allDbPrograms: Array<{ programName: string; schoolName: string }>
): Promise<AiAdviceResult> {
  const hasALevel = (profile.subjects ?? []).length >= 2;
  const hasOLevel = (profile.oLevelSubjects ?? []).length >= 5;

  const programList = recommendations
    .flatMap(r => r.qualifyingPrograms)
    .slice(0, 20)
    .map(p => `- ${p.programName} @ ${p.schoolName}${p.campus ? ` (${p.campus})` : ""}${p.programType === "diploma" ? " [Diploma - no A-Level required]" : ""}`)
    .join("\n");

  const prompt = `You are a career advisor for pre-university students in Zimbabwe. Based on this student profile and the programs in our database, give SHORT personalized advice (max 4-5 sentences). Be specific about schools and programs we have.

STUDENT PROFILE:
- Interests: ${profile.interests.join(", ") || "Not specified"}
- Strengths: ${profile.strengths.join(", ") || "Not specified"}
- O-Level subjects: ${profile.oLevelSubjects.join(", ") || "None"}
- A-Level subjects: ${profile.subjects.join(", ") || "None"}
- Education level: ${hasALevel ? "Has A-Level" : hasOLevel ? "O-Level only (can do diplomas)" : "Incomplete"}

TOP CAREER FITS: ${recommendations.slice(0, 3).map(r => `${r.careerName} (${r.matchPercentage}%)`).join(", ")}

PROGRAMS IN OUR DATABASE (only recommend from this list):
${programList || "No programs matched yet."}

Give brief, actionable advice. Mention specific schools/programs from the list when relevant. If O-Level only, highlight diploma options.
Format program names in bold using **Program Name at School** (e.g. **Diploma in Digital Marketing at TelOne Centre for Learning**).`;

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.6, num_predict: 200 },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Ollama API error:", errText);
      return { advice: "", recommendedPrograms: [] };
    }

    const data = (await response.json()) as { response?: string };
    const advice = (data.response || "").trim();
    const recommendedPrograms = extractProgramsFromAiText(advice, allDbPrograms);

    return { advice, recommendedPrograms };
  } catch (error) {
    console.error("AI advice generation failed:", error);
    return { advice: "", recommendedPrograms: [] };
  }
}
