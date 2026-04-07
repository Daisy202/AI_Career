import { db, usersTable, universityProgramsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Create admin user
  const adminEmail = "admin@careerguide.zw";
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, adminEmail)).limit(1);

  if (existing.length === 0) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await db.insert(usersTable).values({
      name: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "admin",
      school: null,
      level: null,
    });
    console.log("✓ Admin user created: admin@careerguide.zw / Admin@123");
  } else {
    console.log("✓ Admin user already exists");
  }

  // Seed university programs (use SEED_FORCE=1 to replace existing)
  const count = await db.select().from(universityProgramsTable);
  if (process.env.SEED_FORCE === "1" && count.length > 0) {
    await db.delete(universityProgramsTable);
    console.log("✓ Cleared existing programs (SEED_FORCE=1)");
  }
  const afterCount = await db.select().from(universityProgramsTable);
  if (afterCount.length === 0) {
    const programs = [
      // University of Zimbabwe - min 5 O-level, 2 A-level (Medicine requires 3 A-level)
      { schoolName: "University of Zimbabwe", programName: "BSc Computer Science", faculty: "Science", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 10, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Foundational degree in computing, algorithms and software development", careerCategory: "Technology" },
      { schoolName: "University of Zimbabwe", programName: "BSc Computer Information Systems", faculty: "Commerce", requiredSubjects: ["Mathematics", "Accounts"], minimumPoints: 10, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Business-oriented IT degree combining computing with commerce", careerCategory: "Technology" },
      { schoolName: "University of Zimbabwe", programName: "MBChB Medicine & Surgery", faculty: "Medicine", requiredSubjects: ["Biology", "Chemistry", "Physics", "Mathematics"], minRequiredSubjects: 3, minimumPoints: 15, minOLevelPasses: 5, minALevelPasses: 3, duration: "5 years", description: "Full medical degree qualifying graduates as doctors. At least 3 of Biology, Chemistry, Physics, Mathematics.", careerCategory: "Healthcare" },
      { schoolName: "University of Zimbabwe", programName: "LLB Bachelor of Laws", faculty: "Law", requiredSubjects: ["English Literature", "History"], minimumPoints: 10, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Professional legal degree covering Zimbabwean and international law", careerCategory: "Law" },
      { schoolName: "University of Zimbabwe", programName: "BCom Accounting", faculty: "Commerce", requiredSubjects: ["Mathematics", "Accounts"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Professional accounting degree with ICAZ and ACCA exemptions", careerCategory: "Business & Finance" },
      { schoolName: "University of Zimbabwe", programName: "BSc Civil Engineering", faculty: "Engineering", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 12, minOLevelPasses: 5, minALevelPasses: 2, duration: "5 years", description: "Infrastructure and structural engineering degree", careerCategory: "Engineering" },
      { schoolName: "University of Zimbabwe", programName: "BSc Electrical Engineering", faculty: "Engineering", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 12, minOLevelPasses: 5, minALevelPasses: 2, duration: "5 years", description: "Power systems, electronics and telecommunications engineering", careerCategory: "Engineering" },
      { schoolName: "University of Zimbabwe", programName: "BSc Agriculture", faculty: "Agriculture", requiredSubjects: ["Biology", "Chemistry"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Crop science, animal science and agricultural economics", careerCategory: "Agriculture" },
      { schoolName: "University of Zimbabwe", programName: "BSc Psychology", faculty: "Social Sciences", requiredSubjects: ["Biology", "English Literature"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "3 years", description: "Study of human behaviour, mental health and counselling", careerCategory: "Social Sciences" },
      { schoolName: "University of Zimbabwe", programName: "BA Journalism & Media Studies", faculty: "Arts", requiredSubjects: ["English Literature", "History"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "3 years", description: "Media production, journalism ethics and communication theory", careerCategory: "Media & Communication" },
      // Bindura University of Science Education
      { schoolName: "Bindura University of Science Education", programName: "BSc Computer Science", faculty: "Science", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 9, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Computing degree with focus on science education integration", careerCategory: "Technology" },
      { schoolName: "Bindura University of Science Education", programName: "BEd Secondary Education (Mathematics)", faculty: "Education", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Train as a mathematics secondary school teacher", careerCategory: "Education" },
      { schoolName: "Bindura University of Science Education", programName: "BEd Secondary Education (Science)", faculty: "Education", requiredSubjects: ["Biology", "Chemistry"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Train as a science secondary school teacher", careerCategory: "Education" },
      { schoolName: "Bindura University of Science Education", programName: "BSc Environmental Science", faculty: "Science", requiredSubjects: ["Biology", "Geography"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Environmental management, conservation and sustainability", careerCategory: "Agriculture" },
      // Chinhoyi University of Technology
      { schoolName: "Chinhoyi University of Technology", programName: "BEng Mechatronics", faculty: "Engineering", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 10, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Combination of mechanical, electrical and computing engineering", careerCategory: "Engineering" },
      { schoolName: "Chinhoyi University of Technology", programName: "BSc Information Technology", faculty: "Technology", requiredSubjects: ["Mathematics"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Practical IT degree covering networks, databases and software", careerCategory: "Technology" },
      { schoolName: "Chinhoyi University of Technology", programName: "BSc Agriculture", faculty: "Agriculture", requiredSubjects: ["Biology", "Chemistry"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Modern agricultural science and farm management", careerCategory: "Agriculture" },
      // NUST
      { schoolName: "National University of Science & Technology (NUST)", programName: "BEng Civil Engineering", faculty: "Engineering", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 12, minOLevelPasses: 5, minALevelPasses: 2, duration: "5 years", description: "Structural, geotechnical and highway engineering", careerCategory: "Engineering" },
      { schoolName: "National University of Science & Technology (NUST)", programName: "BEng Electrical Engineering", faculty: "Engineering", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 12, minOLevelPasses: 5, minALevelPasses: 2, duration: "5 years", description: "Power systems, control engineering and electronics", careerCategory: "Engineering" },
      { schoolName: "National University of Science & Technology (NUST)", programName: "BSc Computer Science", faculty: "Science", requiredSubjects: ["Mathematics", "Physics"], minimumPoints: 10, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Software engineering and computer systems at NUST", careerCategory: "Technology" },
      { schoolName: "National University of Science & Technology (NUST)", programName: "BSc Nursing Science", faculty: "Medicine", requiredSubjects: ["Biology", "Chemistry"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Professional nursing degree training registered nurses", careerCategory: "Healthcare" },
      // Africa University
      { schoolName: "Africa University", programName: "BBA Business Administration", faculty: "Business", requiredSubjects: ["Mathematics", "Accounts"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "International business management and entrepreneurship", careerCategory: "Business & Finance" },
      { schoolName: "Africa University", programName: "BSc Computer Science", faculty: "Science", requiredSubjects: ["Mathematics"], minimumPoints: 8, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Computing science with an African development perspective", careerCategory: "Technology" },
      { schoolName: "Africa University", programName: "BA Peace & Governance", faculty: "Humanities", requiredSubjects: ["History", "English Literature"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Political science, diplomacy and conflict resolution", careerCategory: "Social Sciences" },
      // Great Zimbabwe University
      { schoolName: "Great Zimbabwe University", programName: "BEd Secondary Education (Commerce)", faculty: "Education", requiredSubjects: ["Accounts", "Commerce"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Train as a commerce and accounts teacher", careerCategory: "Education" },
      { schoolName: "Great Zimbabwe University", programName: "BCom Tourism & Hospitality", faculty: "Commerce", requiredSubjects: ["Geography", "English Literature"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "4 years", description: "Tourism management and hospitality in Zimbabwe's rich heritage context", careerCategory: "Business & Finance" },
      { schoolName: "Great Zimbabwe University", programName: "BA Archaeology & Museum Studies", faculty: "Humanities", requiredSubjects: ["History", "Geography"], minimumPoints: 7, minOLevelPasses: 5, minALevelPasses: 2, duration: "3 years", description: "Cultural heritage, museum curation and archaeological research", careerCategory: "Social Sciences" },
      // TelOne Centre for Learning (TCFL) - NUST affiliate, SADC Certified
      { schoolName: "TelOne Centre for Learning", programName: "Bachelor of Engineering Honours Degree Telecommunications Engineering", faculty: "Engineering", programType: "degree", requiredSubjects: ["Mathematics", "Physics"], requiredOLevelSubjects: ["English Language", "Mathematics", "Science"], minimumPoints: null, minOLevelPasses: 5, minALevelPasses: 2, duration: "5 years", description: "A-Level Maths, Physics and a third science (Geography/Biology not accepted). 5 O-Levels inc English, Maths, Science.", careerCategory: "Engineering", campus: "Harare" },
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

    await db.insert(universityProgramsTable).values(programs);
    console.log(`✓ Seeded ${programs.length} university programs`);
  } else {
    console.log(`✓ ${count.length} programs already exist`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
