import { db, universityProgramsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const telonePrograms = [
  { schoolName: "TelOne Centre for Learning", programName: "Bachelor of Engineering Honours Degree Telecommunications Engineering", faculty: "Engineering", programType: "degree", requiredSubjects: ["Mathematics", "Physics"], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 2, duration: "5 years", description: "A-Level Maths, Physics and a third science. 5 O-Levels inc English, Maths, Science.", careerCategory: "Engineering", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Telecommunications Engineering", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English, Maths and a Science subject.", careerCategory: "Technology", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Software Engineering", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English, Maths and a Science subject.", careerCategory: "Technology", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Cyber Security", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English, Maths and a Science subject.", careerCategory: "Technology", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Data Science", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English, Maths and a Science subject.", careerCategory: "Technology", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Computer Networking", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English, Maths and a Science subject.", careerCategory: "Technology", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Business Analytics", faculty: "Business", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English and Mathematics.", careerCategory: "Business & Finance", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Financial Engineering", faculty: "Business", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English and Mathematics.", careerCategory: "Business & Finance", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Digital Marketing", faculty: "Business", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. 5 O-Levels including English and Mathematics.", careerCategory: "Business & Finance", campus: "Harare" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Telecommunications Engineering", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. Bulawayo campus.", careerCategory: "Technology", campus: "Bulawayo" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Software Engineering", faculty: "Technology", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. Bulawayo campus.", careerCategory: "Technology", campus: "Bulawayo" },
  { schoolName: "TelOne Centre for Learning", programName: "Diploma in Digital Marketing", faculty: "Business", programType: "diploma", requiredSubjects: [], requiredOLevelSubjects: ["English Language", "Mathematics"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 0, duration: "3 years", description: "HEXCO-certified. Bulawayo campus.", careerCategory: "Business & Finance", campus: "Bulawayo" },
];

async function seedTelOne() {
  const existing = await db.select().from(universityProgramsTable).where(eq(universityProgramsTable.schoolName, "TelOne Centre for Learning"));
  if (existing.length > 0) {
    console.log(`✓ TelOne programs already exist (${existing.length} programs)`);
    process.exit(0);
    return;
  }
  await db.insert(universityProgramsTable).values(telonePrograms);
  console.log(`✓ Added ${telonePrograms.length} TelOne Centre for Learning programs`);
  process.exit(0);
}

seedTelOne().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
