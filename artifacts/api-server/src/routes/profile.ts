import { Router, type IRouter } from "express";
import { db, studentProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";
import { fileLogger } from "../lib/fileLogger.js";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const [row] = await db
    .select()
    .from(studentProfilesTable)
    .where(eq(studentProfilesTable.userId, userId))
    .limit(1);

  if (!row) {
    res.json(null);
    return;
  }

  res.json({
    interests: row.interests,
    strengths: row.strengths,
    subjects: row.subjects,
    oLevelSubjects: row.oLevelSubjects ?? [],
    personalityType: row.personalityType,
    hobbies: row.hobbies ?? [],
    cutOffPoints: row.cutOffPoints,
    oLevelPasses: row.oLevelPasses,
    aLevelPasses: row.aLevelPasses,
  });
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.session.userId!;
  const body = req.body as {
    interests?: string[];
    strengths?: string[];
    subjects?: string[];
    oLevelSubjects?: string[];
    personalityType?: string | null;
    hobbies?: string[];
    cutOffPoints?: number | null;
    oLevelPasses?: number | null;
    aLevelPasses?: number | null;
  };

  const interests = body.interests ?? [];
  const strengths = body.strengths ?? [];
  const subjects = body.subjects ?? [];
  const oLevelSubjects = body.oLevelSubjects ?? [];

  if (interests.length === 0 || strengths.length === 0) {
    res.status(400).json({ error: "interests and strengths are required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(studentProfilesTable)
    .where(eq(studentProfilesTable.userId, userId))
    .limit(1);

  const data = {
    interests,
    strengths,
    subjects,
    oLevelSubjects,
    personalityType: body.personalityType ?? null,
    hobbies: body.hobbies ?? [],
    cutOffPoints: body.cutOffPoints ?? null,
    oLevelPasses: body.oLevelPasses ?? null,
    aLevelPasses: body.aLevelPasses ?? null,
  };

  if (existing) {
    await db
      .update(studentProfilesTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(studentProfilesTable.userId, userId));
  } else {
    await db.insert(studentProfilesTable).values({
      userId,
      ...data,
    });
  }

  fileLogger.logUserActivity({
    userId,
    action: existing ? "User updated profile" : "User submitted career assessment",
    details: { hasOLevel: data.oLevelSubjects.length, hasALevel: data.subjects.length },
  });

  res.json({ message: "Profile saved" });
});

export default router;
