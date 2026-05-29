import { db, universityProgramsTable } from "@workspace/db";
import { programQualifiesBySubjects } from "../src/lib/programRecommendationEngine.ts";
import { normalizeSubjectList } from "../src/lib/subjectMatch.js";

const aLevelSubjects = normalizeSubjectList([
  "historry",
  "english literature",
  "shona",
]);
const oLevelSubjects = normalizeSubjectList([
  "Religious Studies",
  "Shona",
  "Literature in English",
  "Art",
  "Physical Education",
]);

const allPrograms = await db.select().from(universityProgramsTable);
const education = allPrograms.filter(
  p => (p.careerCategory ?? "").toLowerCase().includes("education")
);

const qualifying = education.filter(p =>
  programQualifiesBySubjects(
    {
      programName: p.programName,
      schoolName: p.schoolName,
      programType: p.programType,
      minimumPoints: p.minimumPoints,
      requiredSubjects: p.requiredSubjects ?? [],
      minRequiredSubjects: p.minRequiredSubjects,
      careerCategory: p.careerCategory,
    },
    aLevelSubjects,
    oLevelSubjects
  )
);

console.log("A-Level:", aLevelSubjects);
console.log("Education programs:", education.length);
console.log("Qualifying (engine rules):", qualifying.length);
console.log(
  qualifying.slice(0, 8).map(p => `${p.programName} @ ${p.schoolName}`)
);
