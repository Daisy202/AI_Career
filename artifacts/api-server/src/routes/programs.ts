import { Router, type IRouter } from "express";
import { db, universityProgramsTable } from "@workspace/db";
import {
  GetProgramsQueryParams,
  GetProgramsResponse,
  CreateProgramBody,
  MatchProgramsBody,
  MatchProgramsResponse,
  UploadProgramsBody,
  UploadProgramsResponse,
  UpdateProgramParams,
  UpdateProgramBody,
  UpdateProgramResponse,
  DeleteProgramParams,
  DeleteProgramResponse,
} from "@workspace/api-zod";
import { eq, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth.js";

const router: IRouter = Router();

// GET /programs
router.get("/programs", async (req, res): Promise<void> => {
  const params = GetProgramsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  let query = db.select().from(universityProgramsTable);
  const conditions = [];

  if (params.data.school) {
    conditions.push(ilike(universityProgramsTable.schoolName, `%${params.data.school}%`));
  }
  if (params.data.search) {
    conditions.push(
      or(
        ilike(universityProgramsTable.programName, `%${params.data.search}%`),
        ilike(universityProgramsTable.schoolName, `%${params.data.search}%`),
        ilike(universityProgramsTable.faculty, `%${params.data.search}%`)
      )
    );
  }

  let rows;
  if (conditions.length > 0) {
    rows = await db
      .select()
      .from(universityProgramsTable)
      .where(conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`)
      .orderBy(universityProgramsTable.schoolName, universityProgramsTable.programName);
  } else {
    rows = await db
      .select()
      .from(universityProgramsTable)
      .orderBy(universityProgramsTable.schoolName, universityProgramsTable.programName);
  }

  res.json(GetProgramsResponse.parse(rows));
});

// POST /programs (admin only)
router.post("/programs", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db.insert(universityProgramsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

// POST /programs/match - find programs matching student subjects/points
router.post("/programs/match", async (req, res): Promise<void> => {
  const parsed = MatchProgramsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { subjects, cutOffPoints, careerCategory } = parsed.data;
  const studentSubjectsLower = subjects.map(s => s.toLowerCase().trim());

  let programs = await db.select().from(universityProgramsTable).orderBy(universityProgramsTable.schoolName);

  if (careerCategory) {
    programs = programs.filter(p =>
      !p.careerCategory || p.careerCategory.toLowerCase().includes(careerCategory.toLowerCase())
    );
  }

  const matches = programs.map(program => {
    const requiredLower = program.requiredSubjects.map(s => s.toLowerCase().trim());

    const missingSubjects = requiredLower.filter(required =>
      !studentSubjectsLower.some(s => s.includes(required) || required.includes(s) || subjectAlias(s, required))
    );

    const qualifies = missingSubjects.length === 0;

    let meetsPointsRequirement: boolean | null = null;
    if (cutOffPoints !== null && cutOffPoints !== undefined && program.minimumPoints !== null && program.minimumPoints !== undefined) {
      meetsPointsRequirement = cutOffPoints >= program.minimumPoints;
    }

    return {
      program,
      qualifies,
      missingSubjects: missingSubjects.map(s =>
        program.requiredSubjects.find(r => r.toLowerCase().trim() === s) || s
      ),
      meetsPointsRequirement,
    };
  });

  res.json(MatchProgramsResponse.parse(matches));
});

// POST /programs/upload (admin only)
router.post("/programs/upload", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UploadProgramsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { programs, replace } = parsed.data;

  if (replace) {
    await db.delete(universityProgramsTable);
  }

  let imported = 0;
  let skipped = 0;

  for (const program of programs) {
    try {
      await db.insert(universityProgramsTable).values(program);
      imported++;
    } catch {
      skipped++;
    }
  }

  res.json(
    UploadProgramsResponse.parse({
      imported,
      skipped,
      message: `Successfully imported ${imported} program(s)${skipped > 0 ? `, skipped ${skipped}` : ""}`,
    })
  );
});

// PATCH /programs/:programId (admin only)
router.patch("/programs/:programId", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid program ID" });
    return;
  }

  const parsed = UpdateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(universityProgramsTable)
    .set(parsed.data)
    .where(eq(universityProgramsTable.id, params.data.programId))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Program not found" });
    return;
  }

  res.json(UpdateProgramResponse.parse(row));
});

// DELETE /programs/:programId (admin only)
router.delete("/programs/:programId", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid program ID" });
    return;
  }

  const [row] = await db
    .delete(universityProgramsTable)
    .where(eq(universityProgramsTable.id, params.data.programId))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Program not found" });
    return;
  }

  res.json(DeleteProgramResponse.parse({ message: "Program deleted successfully" }));
});

function subjectAlias(a: string, b: string): boolean {
  const aliases: Record<string, string[]> = {
    maths: ["mathematics", "math"],
    mathematics: ["maths", "math"],
    math: ["maths", "mathematics"],
    bio: ["biology"],
    biology: ["bio"],
    chem: ["chemistry"],
    chemistry: ["chem"],
    physics: ["physical science"],
    english: ["english language", "english literature"],
    accounts: ["accounting", "accountancy"],
    accounting: ["accounts", "accountancy"],
    commerce: ["commercial studies", "business studies"],
    geography: ["geo"],
    geo: ["geography"],
    history: ["hist"],
    hist: ["history"],
  };
  const aKey = a.toLowerCase().replace(/\s+/g, "");
  const bKey = b.toLowerCase().replace(/\s+/g, "");
  return (aliases[aKey] || []).some(x => x.replace(/\s+/g, "") === bKey) ||
         (aliases[bKey] || []).some(x => x.replace(/\s+/g, "") === aKey);
}

export default router;
