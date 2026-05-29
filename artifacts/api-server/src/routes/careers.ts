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
import { getActiveAiMode } from "../lib/aiProvider.js";
import { fileLogger } from "../lib/fileLogger.js";
import { requireAuth } from "../lib/auth.js";
import {
  calculatePointsChance,
  meetsCutoffRequirement,
  normalizeZimsecCutoff,
} from "../lib/zimsecPoints.js";
import { subjectAlias } from "../lib/subjectMatch.js";
import {
  countSubjectMatches,
  getCareerRequiredSubjects,
  meetsCareerSubjectGate,
  minCareerSubjectMatches,
} from "../lib/subjectGate.js";
import { normalizeSubjectList } from "../lib/subjectMatch.js";
import { determineStudentTier, programTypePriority } from "../lib/studentTier.js";
import {
  buildAiRecommendationPayload,
  mergeExplorePrograms,
  programQualifiesBySubjects,
} from "../lib/programRecommendationEngine.js";
import type { DbProgramRow } from "../lib/chatDbContext.js";

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

  // Recommendations use static CAREERS ids — prefer those before imported category rows.
  const staticCareer = CAREERS.find(c => c.id === params.data.careerId);
  if (staticCareer) {
    const { keywords: _keywords, ...career } = staticCareer;
    res.json(GetCareerByIdResponse.parse(career));
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

  res.status(404).json({ error: "Career not found" });
});

router.post("/recommend", requireAuth, async (req, res): Promise<void> => {
  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const oLevelSubjects = normalizeSubjectList(parsed.data.oLevelSubjects ?? []);
  const aLevelSubjects = normalizeSubjectList(parsed.data.subjects ?? []);
  const studentOLevelLower = oLevelSubjects.map((s: string) => s.toLowerCase().trim());

  const studentSubjectsLower = aLevelSubjects.map((s: string) => String(s).toLowerCase().trim());
  const hasSubjectProfile =
    studentSubjectsLower.length > 0 || studentOLevelLower.length >= 5;

  const rawRecommendations = recommendCareers({
    ...parsed.data,
    subjects: aLevelSubjects,
    oLevelSubjects,
    oLevelPasses: parsed.data.oLevelPasses ?? null,
    aLevelPasses: parsed.data.aLevelPasses ?? null,
  });

  const recommendations = hasSubjectProfile
    ? rawRecommendations.filter(r =>
        meetsCareerSubjectGate(r.career, {
          subjects: aLevelSubjects,
          oLevelSubjects,
        })
      )
    : rawRecommendations;
  const cutOffPoints = normalizeZimsecCutoff(parsed.data.cutOffPoints ?? undefined);
  if (aLevelSubjects.length > 0 && cutOffPoints == null) {
    res.status(400).json({ error: "A-Level students must provide cut-off points (1-15)." });
    return;
  }
  const oLevelPasses = parsed.data.oLevelPasses ?? null;
  const aLevelPasses = parsed.data.aLevelPasses ?? null;

  const allPrograms = await db.select().from(universityProgramsTable).orderBy(universityProgramsTable.schoolName);
  const studentTier = determineStudentTier({
    aLevelSubjects,
    cutOffPoints,
  });

  const dbProgramRows: DbProgramRow[] = allPrograms.map(p => ({
    programName: p.programName,
    schoolName: p.schoolName,
    programType: p.programType,
    minimumPoints: p.minimumPoints,
    requiredSubjects: p.requiredSubjects ?? [],
    minRequiredSubjects: p.minRequiredSubjects,
    careerCategory: p.careerCategory,
  }));

  const result = recommendations.map(r => {
    const relevantPrograms = allPrograms.filter(p =>
      !p.careerCategory || p.careerCategory.toLowerCase().includes(r.career.category.toLowerCase()) ||
      r.career.category.toLowerCase().includes((p.careerCategory || "").toLowerCase())
    );

    const isOLevelOnly = studentSubjectsLower.length === 0;
    const careerReqs = getCareerRequiredSubjects(r.career);
    const careerALevelMatches = countSubjectMatches(careerReqs, aLevelSubjects);
    const minCareerMatches = minCareerSubjectMatches(careerReqs);

    const mapped = relevantPrograms.map(program => {
      const isDiploma = (program.programType || "degree") === "diploma";
      const requiredALevel = program.requiredSubjects ?? [];
      const requiredOLevel = program.requiredOLevelSubjects ?? [];
      const minRequired = program.minRequiredSubjects ?? requiredALevel.length;

      const programRow: DbProgramRow = {
        programName: program.programName,
        schoolName: program.schoolName,
        programType: program.programType,
        minimumPoints: program.minimumPoints,
        requiredSubjects: requiredALevel,
        minRequiredSubjects: program.minRequiredSubjects,
        careerCategory: program.careerCategory,
      };

      const qualifiesBySubjects = programQualifiesBySubjects(
        programRow,
        aLevelSubjects,
        oLevelSubjects
      );

      const matchedALevelCount = countSubjectMatches(requiredALevel, aLevelSubjects);
      const missingALevel =
        qualifiesBySubjects || isDiploma
          ? []
          : requiredALevel.filter((required: string) =>
              !studentSubjectsLower.some(
                (s: string) =>
                  s.includes(required.toLowerCase()) ||
                  required.toLowerCase().includes(s) ||
                  subjectAlias(s, required.toLowerCase())
              )
            );

      const missingOLevel = requiredOLevel.filter((req: string) => !hasOLevelSubject(req, studentOLevelLower));
      const minO = program.minOLevelPasses ?? 5;
      const oLevelReqMatches = countSubjectMatches(requiredOLevel, oLevelSubjects);
      const qualifiesByOLevel =
        requiredOLevel.length === 0 ||
        oLevelReqMatches >= Math.min(2, requiredOLevel.length) ||
        oLevelSubjects.length >= minO ||
        (oLevelPasses != null && oLevelPasses >= minO);

      let meetsPointsRequirement: boolean | null = null;
      let pointsChance: "high" | "equal" | "low" | null = null;
      if (cutOffPoints != null && program.minimumPoints != null) {
        meetsPointsRequirement = meetsCutoffRequirement(cutOffPoints, program.minimumPoints);
        pointsChance = calculatePointsChance(cutOffPoints, program.minimumPoints);
      }

      const minA = program.minALevelPasses ?? (isDiploma ? 0 : 2);
      let meetsOLevelCount: boolean | null = null;
      let meetsALevelCount: boolean | null = null;
      if (oLevelPasses != null) meetsOLevelCount = oLevelPasses >= minO;
      else if (studentOLevelLower.length >= minO) meetsOLevelCount = true;
      if (aLevelPasses != null) meetsALevelCount = aLevelPasses >= minA;
      else if (isDiploma) meetsALevelCount = true;

      const openEntryDiploma =
        isDiploma && requiredALevel.length === 0 && (program.requiredSubjects ?? []).length === 0;
      const matchesCareerSubjects =
        careerReqs.length === 0 ||
        careerALevelMatches >= minCareerMatches ||
        (openEntryDiploma &&
          countSubjectMatches(careerReqs, [...aLevelSubjects, ...oLevelSubjects]) >= minCareerMatches);

      // Points do NOT affect qualification - only subjects and pass counts
      const qualifies =
        qualifiesBySubjects &&
        qualifiesByOLevel &&
        matchesCareerSubjects &&
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
    const sorted = mapped.sort((a: { qualifies: boolean; isDiploma: boolean; pointsChance?: string | null; program: { programType?: string | null; minimumPoints?: number | null } }, b: { qualifies: boolean; isDiploma: boolean; pointsChance?: string | null; program: { programType?: string | null; minimumPoints?: number | null } }) => {
      if (a.qualifies && !b.qualifies) return -1;
      if (!a.qualifies && b.qualifies) return 1;
      const tierTypeDelta =
        programTypePriority(a.program.programType, studentTier) -
        programTypePriority(b.program.programType, studentTier);
      if (tierTypeDelta !== 0) return tierTypeDelta;
      // When user has points, surface programs with points requirements earlier
      if (cutOffPoints != null) {
        const aHasPoints = a.pointsChance != null;
        const bHasPoints = b.pointsChance != null;
        if (aHasPoints && !bHasPoints) return -1;
        if (!aHasPoints && bHasPoints) return 1;
        if (studentTier === "mixed_low_points") {
          const aMin = a.program.minimumPoints ?? 99;
          const bMin = b.program.minimumPoints ?? 99;
          if (aMin !== bMin) return aMin - bMin;
        }
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

    const substantiveQualifying = matchedPrograms.filter((m: { qualifies: boolean; program: { requiredSubjects?: string[] | null } }) => {
      if (!m.qualifies) return false;
      const req = m.program.requiredSubjects ?? [];
      return req.length > 0 || careerALevelMatches >= minCareerMatches;
    });
    const qualifyingCount = substantiveQualifying.length;
    let matchPercentage = qualifyingCount > 0 ? Math.max(r.matchPercentage, 30) : Math.min(r.matchPercentage, 25);
    if (qualifyingCount > 0) {
      matchPercentage = Math.min(matchPercentage + qualifyingCount * 5, 88);
    }

    const subjectGatedReasons = r.matchReasons.filter(
      reason => !/interest in|strengths align/i.test(reason) || qualifyingCount > 0
    );
    let adviceReasons =
      subjectGatedReasons.length > 0
        ? [...subjectGatedReasons]
        : qualifyingCount > 0
          ? ["Your subjects match programs in this field"]
          : ["Add or improve required subjects to unlock stronger matches in this field"];
    if (studentTier === "certificate_diploma") {
      adviceReasons = [...adviceReasons, "Your current profile is diploma/certificate-first; these are prioritized for faster entry chances."];
    } else if (studentTier === "degree_first") {
      adviceReasons = [...adviceReasons, "Your profile is degree-first; degree programs are prioritized, with diploma/certificate alternatives shown next."];
    } else {
      adviceReasons = [...adviceReasons, "Your profile mixes degree and diploma options, with diploma paths highlighted to improve enrollment chances."];
    }
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

  const userId = (req.session as { userId?: number })?.userId ?? null;
  const activeAiMode = await getActiveAiMode();

  const notEligibleCareers = result
    .filter(r => !(r.matchedPrograms ?? []).some((m: { qualifies: boolean }) => m.qualifies))
    .map(r => {
      const missing = new Set<string>();
      for (const m of r.matchedPrograms ?? []) {
        if ((m as { qualifies?: boolean }).qualifies) continue;
        for (const line of (m as { missingSubjects?: string[] }).missingSubjects ?? []) {
          const a = line.match(/^A-Level:\s*(.+)$/);
          if (a) missing.add(a[1].trim());
        }
      }
      return { career: r.career.name, missingSubjects: [...missing].slice(0, 6) };
    })
    .filter(x => x.missingSubjects.length > 0)
    .slice(0, 6);

  const enginePayload = buildAiRecommendationPayload(
    dbProgramRows,
    {
      subjects: aLevelSubjects,
      oLevelSubjects,
      cutOffPoints,
      interests: parsed.data.interests,
      strengths: parsed.data.strengths,
      personalityType: parsed.data.personalityType,
    },
    notEligibleCareers
  );
  const explorePrograms = mergeExplorePrograms(enginePayload);

  let aiAdvice = "";
  let aiRecommendedPrograms: Array<{ programName: string; schoolName: string }> = [];
  try {
    const aiResult = await generateCareerAdvice(
      {
        interests: parsed.data.interests,
        strengths: parsed.data.strengths,
        subjects: aLevelSubjects,
        oLevelSubjects,
        personalityType: parsed.data.personalityType,
        cutOffPoints,
      },
      dbProgramRows,
      notEligibleCareers,
      { userId, enginePayload }
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

  fileLogger.logPrediction({
    userId,
    inputs: {
      interests: parsed.data.interests,
      strengths: parsed.data.strengths,
      subjects: aLevelSubjects,
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
    modelVersion: `programs-rule-based + advice-${activeAiMode}`,
    programMatchingEngine: "rule-based-db",
    aiAdviceEngine: aiAdvice ? activeAiMode : "none",
  });

  res.json(
    GetRecommendationsResponse.parse({
      recommendations: result,
      aiAdvice: aiAdvice || undefined,
      aiRecommendedPrograms: aiRecommendedPrograms.length > 0 ? aiRecommendedPrograms : undefined,
      recommendationStatus: enginePayload.status,
      recommendationReason: enginePayload.reason ?? undefined,
      eligiblePrograms: enginePayload.allEligiblePrograms,
      explorePrograms,
    })
  );
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

export default router;
