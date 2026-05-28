import { db, studentProfilesTable, universityProgramsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

async function run() {
  const updatedPrograms = await db
    .update(universityProgramsTable)
    .set({ minimumPoints: null })
    .where(eq(universityProgramsTable.minimumPoints, 0))
    .returning({ id: universityProgramsTable.id });

  const updatedStudents = await db
    .update(studentProfilesTable)
    .set({ cutOffPoints: null, updatedAt: new Date() })
    .where(eq(studentProfilesTable.cutOffPoints, 0))
    .returning({ id: studentProfilesTable.id });

  console.log(`Updated programs with minimum_points 0 -> null: ${updatedPrograms.length}`);
  console.log(`Updated student profiles with cut_off_points 0 -> null: ${updatedStudents.length}`);
}

run().catch((err) => {
  console.error("Normalization failed:", err);
  process.exit(1);
});
