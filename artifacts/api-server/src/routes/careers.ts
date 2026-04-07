import { Router, type IRouter } from "express";
import { db, careersTable, feedbackTable, universityProgramsTable } from "@workspace/db";
import {
  GetCareersResponse,
  GetRecommendationsBody,
  GetRecommendationsResponse,
  GetCareerByIdParams,
  GetCareerByIdResponse,
  SubmitFeedbackBody,
} from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { CAREERS, recommendCareers } from "../lib/careerData.js";
import { generateCareerAdvice } from "../lib/aiAdvice.js";
import { fileLogger } from "../lib/fileLogger.js";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/careers", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(careersTable).orderBy(careersTable.id);
  if (rows.length === 0) {
    res.json(GetCareersResponse.parse(CAREERS));
    return;
  }
  res.json(GetCareersResponse.parse(rows));
});

router.get("/careers/:careerId", requireAuth, async (req, res): Promise<void> => {
  const params = GetCareerByIdParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid career ID" });
    return;
  }

  const fromDb = await db
    .select()
    .from(careersTable)
    .where(eq(careersTable.id, params.data.careerId))
    .limit(1);

  if (fromDb.length > 0) {
    res.json(GetCareerByIdResponse.parse(fromDb[0]));
    return;
  }

  const career = CAREERS.find(c => c.id === params.data.careerId);
  if (!career) {
    res.status(404).json({ error: "Career not found" });
    return;
  }

  res.json(GetCareerByIdResponse.parse(career));
});

router.post("/recommend", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const oLevelSubjects = parsed.data.oLevelSubjects ?? [];
  const studentOLevelLower = oLevelSubjects.map((s: string) => s.toLowerCase().trim());

  const recommendations = recommendCareers({
    ...parsed.data,
    oLevelSubjects,
    oLevelPasses: parsed.data.oLevelPasses ?? null,
    aLevelPasses: parsed.data.aLevelPasses ?? null,
  });
  const studentSubjectsLower = (parsed.data.subjects ?? []).map((s: string) => String(s).toLowerCase().trim());
  const cutOffPoints = parsed.data.cutOffPoints ?? null;
  const oLevelPasses = parsed.data.oLevelPasses ?? null;
  const aLevelPasses = parsed.data.aLevelPasses ?? null;

  const allPrograms = await db.select().from(universityProgramsTable).orderBy(universityProgramsTable.schoolName);

  const result = recommendations.map(r => {
    const relevantPrograms = allPrograms.filter(p =>
      !p.careerCategory || p.careerCategory.toLowerCase().includes(r.career.category.toLowerCase()) ||
      r.career.category.toLowerCase().includes((p.careerCategory || "").toLowerCase())
    );

    const isOLevelOnly = studentSubjectsLower.length === 0;
    const mapped = relevantPrograms.map(program => {
      const isDiploma = (program.programType || "degree") === "diploma";
      const requiredALevel = program.requiredSubjects ?? [];
      const requiredOLevel = program.requiredOLevelSubjects ?? [];
      const minRequired = program.minRequiredSubjects ?? requiredALevel.length;

      const matchedALevelCount = requiredALevel.filter((required: string) =>
        studentSubjectsLower.some((s: string) => s.includes(required.toLowerCase()) || required.toLowerCase().includes(s) || subjectAlias(s, required.toLowerCase()))
      ).length;
      const qualifiesByALevel = isDiploma ? true : matchedALevelCount >= minRequired;

      const missingALevel = qualifiesByALevel ? [] : requiredALevel.filter((required: string) =>
        !studentSubjectsLower.some((s: string) => s.includes(required.toLowerCase()) || required.toLowerCase().includes(s) || subjectAlias(s, required.toLowerCase()))
      );

      const missingOLevel = requiredOLevel.filter((req: string) => !hasOLevelSubject(req, studentOLevelLower));
      const qualifiesByOLevel = missingOLevel.length === 0;

      let meetsPointsRequirement: boolean | null = null;
      let pointsChance: "high" | "equal" | "low" | null = null;
      if (cutOffPoints !== null && program.minimumPoints != null) {
        meetsPointsRequirement = cutOffPoints >= program.minimumPoints;
        if (cutOffPoints > program.minimumPoints + 2) pointsChance = "high";
        else if (cutOffPoints >= program.minimumPoints) pointsChance = "equal";
        else pointsChance = "low";
      }

      const minO = program.minOLevelPasses ?? 5;
      const minA = program.minALevelPasses ?? (isDiploma ? 0 : 2);
      let meetsOLevelCount: boolean | null = null;
      let meetsALevelCount: boolean | null = null;
      if (oLevelPasses != null) meetsOLevelCount = oLevelPasses >= minO;
      else if (studentOLevelLower.length >= minO) meetsOLevelCount = true;
      if (aLevelPasses != null) meetsALevelCount = aLevelPasses >= minA;
      else if (isDiploma) meetsALevelCount = true;

      // Points do NOT affect qualification - only subjects and pass counts
      const qualifies =
        qualifiesByALevel &&
        qualifiesByOLevel &&
        (meetsOLevelCount !== false) &&
        (meetsALevelCount !== false);

      const missingSubjectsList = [
        ...(minRequired > matchedALevelCount && missingALevel.length > 0
          ? [`Need at least ${minRequired - matchedALevelCount} more from: ${missingALevel.join(", ")}`]
          : missingALevel.map((m: string) => `A-Level: ${m}`)),
        ...missingOLevel.map((m: string) => `O-Level: ${m}`),
      ];

      return {
        program,
        qualifies,
        isDiploma,
        missingSubjects: missingSubjectsList,
        meetsPointsRequirement,
        pointsChance,
        meetsOLevelRequirement: meetsOLevelCount,
        meetsALevelRequirement: meetsALevelCount,
      };
    });
    const sorted = mapped.sort((a: { qualifies: boolean; isDiploma: boolean; pointsChance?: string | null }, b: { qualifies: boolean; isDiploma: boolean; pointsChance?: string | null }) => {
      if (a.qualifies && !b.qualifies) return -1;
      if (!a.qualifies && b.qualifies) return 1;
      if (isOLevelOnly && a.isDiploma && !b.isDiploma) return -1;
      if (isOLevelOnly && !a.isDiploma && b.isDiploma) return 1;
      // When user has A-Level: ensure poly/diploma programs (no A-Level required) also appear
      if (!isOLevelOnly && a.qualifies && b.qualifies && a.isDiploma && !b.isDiploma) return -1;
      if (!isOLevelOnly && a.qualifies && b.qualifies && !a.isDiploma && b.isDiploma) return 1;
      // When user has points, surface programs with points requirements earlier
      if (cutOffPoints != null) {
        const aHasPoints = a.pointsChance != null;
        const bHasPoints = b.pointsChance != null;
        if (aHasPoints && !bHasPoints) return -1;
        if (!aHasPoints && bHasPoints) return 1;
      }
      return 0;
    });
    // When user has A-Level: ensure poly/diploma programs (no A-Level required) also appear
    const qualifying = sorted.filter((m: { qualifies: boolean }) => m.qualifies);
    const qualifyingDiplomas = qualifying.filter((m: { isDiploma: boolean }) => m.isDiploma);
    const qualifyingDegrees = qualifying.filter((m: { isDiploma: boolean }) => !m.isDiploma);
    const nonQualifying = sorted.filter((m: { qualifies: boolean }) => !m.qualifies);
    const matchedPrograms = !isOLevelOnly && (qualifyingDiplomas.length > 0 || qualifyingDegrees.length > 0)
      ? [...qualifyingDiplomas.slice(0, 5), ...qualifyingDegrees.slice(0, 5), ...nonQualifying].slice(0, 12)
      : sorted.slice(0, 10);

    const qualifyingCount = matchedPrograms.filter((m: { qualifies: boolean }) => m.qualifies).length;
    let matchPercentage = Math.max(r.matchPercentage, 30);
    if (qualifyingCount > 0) {
      matchPercentage = Math.min(matchPercentage + qualifyingCount * 8, 95);
    }

    let adviceReasons = r.matchReasons.length > 0 ? [...r.matchReasons] : ["If you have the required subjects or equivalent, you can pursue programs in this field"];
    // Add missing A-Level subjects when user doesn't qualify (e.g. "Missing A-Level: Biology" for Medical Doctor)
    const nonQualifyingInMatches = matchedPrograms.filter((m: { qualifies: boolean }) => !m.qualifies);
    if (nonQualifyingInMatches.length > 0) {
      const missingALevel = new Set<string>();
      for (const m of nonQualifyingInMatches) {
        const list = (m as { missingSubjects?: string[] }).missingSubjects ?? [];
        for (const s of list) {
          const aMatch = s.match(/^A-Level:\s*(.+)$/);
          if (aMatch) missingALevel.add(aMatch[1].trim());
          const needMatch = s.match(/Need at least \d+ more from:\s*(.+)$/);
          if (needMatch) needMatch[1].split(",").forEach((x: string) => missingALevel.add(x.trim()));
        }
      }
      if (missingALevel.size > 0) {
        const missingList = [...missingALevel].join(", ");
        adviceReasons = [...adviceReasons, `Missing A-Level: ${missingList} (required for programs in this field)`];
      }
    }

    return {
      career: r.career,
      matchPercentage,
      matchReasons: adviceReasons,
      demandLevel: r.demandLevel,
      matchedPrograms,
    };
  });

  // Generate AI advice using Ollama (profile + DB programs). Cross-reference with DB.
  const allDbPrograms = allPrograms.map(p => ({ programName: p.programName, schoolName: p.schoolName }));
  let aiAdvice = "";
  let aiRecommendedPrograms: Array<{ programName: string; schoolName: string }> = [];
  try {
    const aiResult = await generateCareerAdvice(
      {
        interests: parsed.data.interests,
        strengths: parsed.data.strengths,
        subjects: parsed.data.subjects ?? [],
        oLevelSubjects,
        personalityType: parsed.data.personalityType,
      },
      result.map(r => {
        const programs = (r.matchedPrograms ?? []).map((m: { program: { schoolName: string; programName: string; programType?: string; campus?: string; description?: string }; qualifies: boolean }) => ({
          schoolName: m.program.schoolName,
          programName: m.program.programName,
          programType: m.program.programType,
          campus: m.program.campus,
          description: m.program.description,
        }));
        const qualifying = (r.matchedPrograms ?? [])
          .filter((m: { qualifies: boolean }) => m.qualifies)
          .map((m: { program: { schoolName: string; programName: string; programType?: string; campus?: string; description?: string } }) => ({
            schoolName: m.program.schoolName,
            programName: m.program.programName,
            programType: m.program.programType,
            campus: m.program.campus,
            description: m.program.description,
          }));
        return {
          careerName: r.career.name,
          careerCategory: r.career.category,
          matchPercentage: r.matchPercentage,
          qualifyingPrograms: qualifying.length > 0 ? qualifying : programs.slice(0, 5),
        };
      }),
      allDbPrograms
    );
    aiAdvice = aiResult.advice;
    aiRecommendedPrograms = aiResult.recommendedPrograms;
  } catch (err) {
    console.warn("AI advice generation skipped:", err);
  }

  // Sort programs so AI-recommended ones appear first in each career
  const aiRecommendedSet = new Set(aiRecommendedPrograms.map(p => `${p.programName}|${p.schoolName}`));
  for (const r of result) {
    if (r.matchedPrograms && r.matchedPrograms.length > 0) {
      r.matchedPrograms.sort((a, b) => {
        const aKey = `${a.program.programName}|${a.program.schoolName}`;
        const bKey = `${b.program.programName}|${b.program.schoolName}`;
        const aRecommended = aiRecommendedSet.has(aKey);
        const bRecommended = aiRecommendedSet.has(bKey);
        if (aRecommended && !bRecommended) return -1;
        if (!aRecommended && bRecommended) return 1;
        return 0;
      });
    }
  }

  const userId = (req.session as { userId?: number })?.userId ?? null;

  fileLogger.logPrediction({
    userId,
    inputs: {
      interests: parsed.data.interests,
      strengths: parsed.data.strengths,
      subjects: parsed.data.subjects ?? [],
      oLevelSubjects,
      personalityType: parsed.data.personalityType,
      cutOffPoints: parsed.data.cutOffPoints,
      oLevelPasses: parsed.data.oLevelPasses,
      aLevelPasses: parsed.data.aLevelPasses,
    },
    predictions: result.map(r => ({
      career: r.career.name,
      category: r.career.category,
      matchPercentage: r.matchPercentage,
      matchReasons: r.matchReasons,
      qualifyingPrograms: (r.matchedPrograms ?? [])
        .filter((m: { qualifies: boolean }) => m.qualifies)
        .map((m: { program: { programName: string; schoolName: string } }) => ({
          program: m.program.programName,
          school: m.program.schoolName,
        })),
    })),
    aiAdvice: aiAdvice || undefined,
    modelVersion: "rule-based-v1",
  });

  res.json(GetRecommendationsResponse.parse({
    recommendations: result,
    aiAdvice: aiAdvice || undefined,
    aiRecommendedPrograms: aiRecommendedPrograms.length > 0 ? aiRecommendedPrograms : undefined,
  }));
});

function hasOLevelSubject(required: string, studentSubjects: string[]): boolean {
  const req = required.toLowerCase().trim();
  if (req === "science") {
    return studentSubjects.some(s => {
      const sub = s.toLowerCase();
      return sub.includes("biology") || sub.includes("chemistry") || sub.includes("physics");
    });
  }
  return studentSubjects.some(s =>
    s.toLowerCase().includes(req) || req.includes(s.toLowerCase()) || oLevelSubjectAlias(s.toLowerCase(), req)
  );
}

function oLevelSubjectAlias(a: string, b: string): boolean {
  const aliases: Record<string, string[]> = {
    english: ["english language", "english literature"],
    "english language": ["english"],
    mathematics: ["maths", "math"],
    maths: ["mathematics", "math"],
    math: ["mathematics", "maths"],
  };
  const aKey = a.replace(/\s+/g, "");
  const bKey = b.replace(/\s+/g, "");
  return (aliases[a] || []).some(x => x.replace(/\s+/g, "") === bKey) ||
         (aliases[b] || []).some(x => x.replace(/\s+/g, "") === aKey);
}

router.post("/feedback", requireAuth, async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = (req.session as { userId?: number })?.userId ?? null;

  const [row] = await db
    .insert(feedbackTable)
    .values({
      userId: userId ?? undefined,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      careerName: parsed.data.careerName ?? null,
      helpful: parsed.data.helpful ? "true" : "false",
    })
    .returning();

  res.status(201).json({ id: row.id, message: "Thank you for your feedback!" });
});

function subjectAlias(a: string, b: string): boolean {
  const aliases: Record<string, string[]> = {
    maths: ["mathematics", "math"],
    mathematics: ["maths", "math"],
    math: ["maths", "mathematics"],
    biology: ["bio"],
    bio: ["biology"],
    chemistry: ["chem"],
    chem: ["chemistry"],
    accounts: ["accounting", "accountancy"],
    accounting: ["accounts", "accountancy"],
    commerce: ["commercial studies", "business studies"],
    english: ["english language", "english literature"],
  };
  const aKey = a.toLowerCase().replace(/\s+/g, "");
  const bKey = b.toLowerCase().replace(/\s+/g, "");
  return (aliases[aKey] || []).some(x => x.replace(/\s+/g, "") === bKey) ||
         (aliases[bKey] || []).some(x => x.replace(/\s+/g, "") === aKey);
}

export default router;
