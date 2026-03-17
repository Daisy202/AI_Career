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

const router: IRouter = Router();

router.get("/careers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(careersTable).orderBy(careersTable.id);
  if (rows.length === 0) {
    res.json(GetCareersResponse.parse(CAREERS));
    return;
  }
  res.json(GetCareersResponse.parse(rows));
});

router.get("/careers/:careerId", async (req, res): Promise<void> => {
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

router.post("/recommend", async (req, res): Promise<void> => {
  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const recommendations = recommendCareers(parsed.data);
  const studentSubjectsLower = parsed.data.subjects.map(s => s.toLowerCase().trim());
  const cutOffPoints = parsed.data.cutOffPoints ?? null;

  // Load programs from DB for matching
  const allPrograms = await db.select().from(universityProgramsTable).orderBy(universityProgramsTable.schoolName);

  const result = recommendations.map(r => {
    const relevantPrograms = allPrograms.filter(p =>
      !p.careerCategory || p.careerCategory.toLowerCase().includes(r.career.category.toLowerCase()) ||
      r.career.category.toLowerCase().includes((p.careerCategory || "").toLowerCase())
    );

    const matchedPrograms = relevantPrograms.slice(0, 6).map(program => {
      const requiredLower = program.requiredSubjects.map(s => s.toLowerCase().trim());

      const missingSubjects = requiredLower.filter(required =>
        !studentSubjectsLower.some(s => s.includes(required) || required.includes(s) || subjectAlias(s, required))
      );

      const qualifies = missingSubjects.length === 0;

      let meetsPointsRequirement: boolean | null = null;
      if (cutOffPoints !== null && program.minimumPoints !== null && program.minimumPoints !== undefined) {
        meetsPointsRequirement = cutOffPoints >= program.minimumPoints;
      }

      return {
        program,
        qualifies,
        missingSubjects: missingSubjects.map(s =>
          program.requiredSubjects.find(req => req.toLowerCase().trim() === s) || s
        ),
        meetsPointsRequirement,
      };
    });

    return {
      career: r.career,
      matchPercentage: Math.max(r.matchPercentage, 30),
      matchReasons: r.matchReasons.length > 0 ? r.matchReasons : ["Aligns with your academic profile"],
      demandLevel: r.demandLevel,
      matchedPrograms,
    };
  });

  res.json(GetRecommendationsResponse.parse(result));
});

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(feedbackTable)
    .values({
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
