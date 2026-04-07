/**
 * Updates MBChB Medicine & Surgery to use "at least 3 of 4" subjects
 * (Biology, Chemistry, Physics, Mathematics) instead of all 3.
 * Run: pnpm --filter @workspace/scripts run fix-mbchb
 */
import { db, universityProgramsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

async function fixMbchb() {
  const updated = await db
    .update(universityProgramsTable)
    .set({
      requiredSubjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
      minRequiredSubjects: 3,
      description: "Full medical degree qualifying graduates as doctors. At least 3 of Biology, Chemistry, Physics, Mathematics.",
    })
    .where(
      and(
        eq(universityProgramsTable.schoolName, "University of Zimbabwe"),
        eq(universityProgramsTable.programName, "MBChB Medicine & Surgery")
      )
    )
    .returning();

  if (updated.length > 0) {
    console.log("✓ Updated MBChB to require at least 3 of Biology, Chemistry, Physics, Mathematics");
  } else {
    console.log("MBChB not found in database (may need to run seed first)");
  }
  process.exit(0);
}

fixMbchb().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
