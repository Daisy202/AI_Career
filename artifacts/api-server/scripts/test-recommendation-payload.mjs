import { buildAiRecommendationPayload } from "../src/lib/programRecommendationEngine.ts";
import { loadAllPrograms } from "../src/lib/chatDbContext.ts";

const programs = await loadAllPrograms();
console.log("programs in DB:", programs.length);

const payload = buildAiRecommendationPayload(programs, {
  subjects: ["historry", "english literature", "shona"],
  oLevelSubjects: [
    "Religious Studies",
    "Shona",
    "Literature in English",
    "Art",
    "Physical Education",
  ],
  cutOffPoints: 10,
  interests: ["Arts & Entertainment"],
  strengths: ["Communication"],
});

console.log("normalized A:", payload.studentProfile.aLevelSubjects);
console.log("degree:", payload.degreePrograms.length);
console.log("alternatives:", payload.alternativePathways.length);
console.log(
  payload.alternativePathways.slice(0, 3).map(p => `${p.program} @ ${p.school}`)
);

const artsOnly = buildAiRecommendationPayload(programs, {
  subjects: ["historry", "english literature", "shona"],
  interests: ["Arts & Entertainment"],
});
console.log("\nA-Level only (no O-Level in request):");
console.log("degree:", artsOnly.degreePrograms.length, "alt:", artsOnly.alternativePathways.length);
console.log(
  artsOnly.alternativePathways.slice(0, 3).map(p => `${p.program} @ ${p.school}`)
);
