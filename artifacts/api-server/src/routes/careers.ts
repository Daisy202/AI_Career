import { Router, type IRouter } from "express";
import { db, careersTable, feedbackTable } from "@workspace/db";
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
    const data = GetCareersResponse.parse(CAREERS);
    res.json(data);
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

  const result = recommendations.map(r => ({
    career: r.career,
    matchPercentage: Math.max(r.matchPercentage, 30),
    matchReasons: r.matchReasons.length > 0 ? r.matchReasons : ["Aligns with your academic profile"],
    demandLevel: r.demandLevel,
  }));

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

export default router;
