export interface CareerData {
  id: number;
  name: string;
  description: string;
  category: string;
  requiredSkills: string[];
  aLevelSubjects: string[];
  universityPrograms: string[];
  averageSalary: string;
  jobOutlook: string;
  keywords: string[];
}

export const CAREERS: CareerData[] = [
  {
    id: 1,
    name: "Software Developer",
    description: "Design, build, and maintain software applications and systems. Work on web, mobile, or desktop applications using various programming languages and frameworks.",
    category: "Technology",
    requiredSkills: ["Programming", "Problem Solving", "Logical Thinking", "Mathematics", "Teamwork"],
    aLevelSubjects: ["Mathematics", "Physics", "Computer Science"],
    universityPrograms: ["BSc Computer Science", "BSc Software Engineering", "BSc Information Technology"],
    averageSalary: "USD 800 - 2,500/month",
    jobOutlook: "Excellent - High demand across all sectors",
    keywords: ["IT", "technology", "computing", "coding", "programming", "maths", "analytical", "problem-solving", "diploma", "o-level"],
  },
  {
    id: 2,
    name: "Data Analyst",
    description: "Collect, process, and analyse data to help organisations make informed business decisions. Use statistical tools and visualisation techniques to present insights.",
    category: "Technology",
    requiredSkills: ["Statistics", "Mathematics", "Analytical Thinking", "Communication", "Excel/SQL"],
    aLevelSubjects: ["Mathematics", "Statistics", "Computer Science"],
    universityPrograms: ["BSc Statistics", "BSc Data Science", "BSc Computer Science", "BCom Economics"],
    averageSalary: "USD 700 - 2,000/month",
    jobOutlook: "Very High - Growing demand in banking, retail, and government",
    keywords: ["IT", "technology", "maths", "data", "analytical", "statistics", "business", "diploma", "o-level"],
  },
  {
    id: 3,
    name: "Accountant",
    description: "Prepare and examine financial records, ensure accuracy, and help organisations manage their finances effectively. Handle tax preparation, auditing, and financial planning.",
    category: "Business & Finance",
    requiredSkills: ["Mathematics", "Attention to Detail", "Analytical Skills", "Communication", "Ethics"],
    aLevelSubjects: ["Accounts", "Mathematics", "Commerce", "Business Studies"],
    universityPrograms: ["BCom Accounting", "BAcc", "BCom Finance", "ACCA Professional"],
    averageSalary: "USD 500 - 1,800/month",
    jobOutlook: "Stable - Always in demand across all industries",
    keywords: ["business", "finance", "maths", "accounts", "commerce", "numbers", "analytical", "diploma", "o-level"],
  },
  {
    id: 4,
    name: "Civil Engineer",
    description: "Plan, design, and oversee construction of infrastructure projects such as roads, bridges, dams, water systems, and buildings.",
    category: "Engineering",
    requiredSkills: ["Mathematics", "Physics", "Problem Solving", "Project Management", "Technical Drawing"],
    aLevelSubjects: ["Mathematics", "Physics", "Geography"],
    universityPrograms: ["BEng Civil Engineering", "BSc Civil and Water Engineering"],
    averageSalary: "USD 800 - 2,500/month",
    jobOutlook: "Good - Infrastructure development drives demand",
    keywords: ["engineering", "maths", "physics", "construction", "design", "science", "technical"],
  },
  {
    id: 5,
    name: "Secondary School Teacher",
    description: "Educate and inspire students in secondary schools. Specialise in one or more subjects and help young people develop knowledge and skills for their future.",
    category: "Education",
    requiredSkills: ["Communication", "Patience", "Subject Knowledge", "Leadership", "Creativity"],
    aLevelSubjects: ["Any relevant subject combination"],
    universityPrograms: ["BEd Secondary Education", "BSc Education (Science)", "BA Education (Arts)"],
    averageSalary: "USD 300 - 800/month",
    jobOutlook: "Stable - Continuous demand especially in rural areas",
    keywords: ["social", "education", "teaching", "communication", "leadership", "people", "creativity"],
  },
  {
    id: 6,
    name: "Medical Doctor",
    description: "Diagnose and treat illnesses, injuries, and other health conditions. Provide medical care to patients in hospitals, clinics, and community health centres.",
    category: "Healthcare",
    requiredSkills: ["Science Knowledge", "Empathy", "Problem Solving", "Communication", "Attention to Detail"],
    aLevelSubjects: ["Biology", "Chemistry", "Physics", "Mathematics"],
    universityPrograms: ["MBChB Medicine and Surgery"],
    averageSalary: "USD 1,500 - 5,000/month",
    jobOutlook: "Excellent - Critical shortage of doctors in Zimbabwe",
    keywords: ["medicine", "health", "science", "biology", "chemistry", "helping", "social", "analytical"],
  },
  {
    id: 7,
    name: "Lawyer",
    description: "Advise clients on legal matters, represent them in court, and help organisations comply with the law. Work in corporate law, criminal law, family law, or human rights.",
    category: "Law",
    requiredSkills: ["Analytical Thinking", "Communication", "Research", "Ethics", "Persuasion"],
    aLevelSubjects: ["English Literature", "History", "Accounts", "Commerce"],
    universityPrograms: ["LLB Bachelor of Laws"],
    averageSalary: "USD 800 - 3,000/month",
    jobOutlook: "Good - Demand in corporate and NGO sectors",
    keywords: ["law", "communication", "writing", "analytical", "history", "english", "social", "leadership"],
  },
  {
    id: 8,
    name: "Agricultural Scientist",
    description: "Research and develop ways to improve farming, food production, and land use. Help farmers increase crop yields and adopt sustainable practices.",
    category: "Agriculture",
    requiredSkills: ["Science", "Research", "Problem Solving", "Environmental Awareness", "Communication"],
    aLevelSubjects: ["Biology", "Chemistry", "Geography", "Agriculture"],
    universityPrograms: ["BSc Agriculture", "BSc Agricultural Science", "BSc Environmental Science"],
    averageSalary: "USD 400 - 1,200/month",
    jobOutlook: "Good - Zimbabwe's agricultural sector is growing",
    keywords: ["agriculture", "science", "biology", "environment", "nature", "chemistry", "research"],
  },
  {
    id: 9,
    name: "Electrical Engineer",
    description: "Design, develop, and maintain electrical systems and equipment. Work in power generation, telecommunications, electronics, and automation.",
    category: "Engineering",
    requiredSkills: ["Mathematics", "Physics", "Technical Skills", "Problem Solving", "Teamwork"],
    aLevelSubjects: ["Mathematics", "Physics", "Computer Science"],
    universityPrograms: ["BEng Electrical Engineering", "BEng Electronics", "BEng Power Systems"],
    averageSalary: "USD 900 - 2,800/month",
    jobOutlook: "High - Energy sector expansion creating opportunities",
    keywords: ["engineering", "maths", "physics", "electricity", "technical", "science", "technology"],
  },
  {
    id: 10,
    name: "Nurse",
    description: "Provide and coordinate patient care, educate patients about health conditions, and offer emotional support to patients and their families.",
    category: "Healthcare",
    requiredSkills: ["Empathy", "Science Knowledge", "Communication", "Attention to Detail", "Teamwork"],
    aLevelSubjects: ["Biology", "Chemistry", "Home Economics"],
    universityPrograms: ["BSc Nursing Science", "Diploma in Nursing", "Post-Basic Nursing"],
    averageSalary: "USD 400 - 1,000/month",
    jobOutlook: "High - Healthcare system expansion and vacancies",
    keywords: ["health", "medicine", "biology", "helping", "social", "science", "empathy"],
  },
  {
    id: 11,
    name: "Journalist / Media Professional",
    description: "Research, investigate, write, and report on news and events. Work in print, broadcast, or digital media to inform and engage the public.",
    category: "Media & Communication",
    requiredSkills: ["Writing", "Communication", "Research", "Creativity", "Critical Thinking"],
    aLevelSubjects: ["English Literature", "History", "Sociology", "Geography"],
    universityPrograms: ["BA Journalism", "BA Media Studies", "BA Communication"],
    averageSalary: "USD 300 - 900/month",
    jobOutlook: "Moderate - Digital media expanding opportunities",
    keywords: ["communication", "writing", "english", "creativity", "social", "media", "arts", "research"],
  },
  {
    id: 12,
    name: "Psychologist",
    description: "Study human behaviour and mental processes. Provide counselling, assessment, and therapy to help individuals manage mental health challenges.",
    category: "Social Sciences",
    requiredSkills: ["Empathy", "Communication", "Research", "Analytical Thinking", "Patience"],
    aLevelSubjects: ["Biology", "Sociology", "English Literature", "History"],
    universityPrograms: ["BSc Psychology", "BA Psychology", "MA Clinical Psychology"],
    averageSalary: "USD 500 - 1,500/month",
    jobOutlook: "Growing - Mental health awareness increasing in Zimbabwe",
    keywords: ["social", "helping", "biology", "communication", "empathy", "research", "arts"],
  },
];

export function recommendCareers(profile: {
  interests: string[];
  strengths: string[];
  subjects: string[];
  oLevelSubjects?: string[];
  oLevelPasses?: number | null;
  aLevelPasses?: number | null;
  personalityType?: string | null;
  hobbies?: string[];
}): Array<{ career: CareerData; matchPercentage: number; matchReasons: string[]; demandLevel: "High" | "Medium" | "Low" }> {
  const aLevelCount = (profile.subjects ?? []).length;
  const oLevelCount = (profile.oLevelSubjects ?? []).length;
  const hasMinALevel = (profile.aLevelPasses ?? 0) >= 2 || aLevelCount >= 2;
  const hasMinOLevel = (profile.oLevelPasses ?? 0) >= 5 || oLevelCount >= 5;
  const meetsBestFit = hasMinALevel && hasMinOLevel;

  const allTerms = [
    ...profile.interests.map(s => s.toLowerCase()),
    ...profile.strengths.map(s => s.toLowerCase()),
    ...(profile.subjects ?? []).map(s => s.toLowerCase()),
    ...(profile.oLevelSubjects ?? []).map(s => s.toLowerCase()),
    ...(profile.hobbies || []).map(s => s.toLowerCase()),
    (profile.personalityType || "").toLowerCase(),
  ];

  const scores = CAREERS.map(career => {
    let score = 0;
    const reasons: string[] = [];

    // Match subjects - best fit requires ≥2 A-Level and ≥5 O-Level
    const subjectMatches = career.aLevelSubjects.filter(sub =>
      (profile.subjects ?? []).some(s => s.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(s.toLowerCase()))
    );
    if (subjectMatches.length > 0) {
      score += subjectMatches.length * 15;
    }
    const aLevelList = (profile.subjects ?? []).slice(0, 4).join(", ");
    const oLevelList = (profile.oLevelSubjects ?? []).slice(0, 6).join(", ");
    const careerReqs = career.aLevelSubjects.filter(s => !/any|relevant|combination/i.test(s));
    const careerALevelReq = (careerReqs.length > 0 ? careerReqs : ["Mathematics", "English"]).slice(0, 3).join(", ");
    const oLevelExample = oLevelList || "English, Mathematics, Science";

    if (meetsBestFit && (profile.subjects ?? []).length >= 2) {
      reasons.push(`With your A-Level subjects (${aLevelList}) and O-Level subjects (${oLevelList || "English, Maths, Science"}), you can pursue these programs as they fit you`);
    } else if (meetsBestFit && oLevelCount >= 5) {
      reasons.push(`With your O-Level subjects (${oLevelList}), you can pursue diploma programs in this field`);
    } else {
      reasons.push(`With at least 2 A-Level subjects (e.g. ${careerALevelReq || "Mathematics, Physics"}) and 5 O-Level subjects (e.g. ${oLevelExample}), you could qualify for programs in this field`);
    }

    // Match interests to category - weight interests strongly (people may have different interests than subjects)
    const categoryToInterest: Record<string, string[]> = {
      "Technology": ["technology", "tech", "it", "ict", "computing", "programming", "software", "data"],
      "Business & Finance": ["business", "finance", "commerce", "accounting", "entrepreneurship"],
      "Engineering": ["engineering", "technical", "construction", "design"],
      "Healthcare": ["health", "medicine", "nursing", "helping people"],
      "Education": ["education", "teaching", "social"],
      "Law": ["law", "legal", "justice"],
      "Media & Communication": ["media", "communication", "writing", "journalism", "arts"],
      "Social Sciences": ["social", "psychology", "society", "research"],
      "Agriculture": ["agriculture", "farming", "environment"],
    };
    const categoryLower = career.category.toLowerCase();
    const interestMatch = profile.interests.some(i => {
      const il = i.toLowerCase();
      if (categoryLower.includes(il) || il.includes(categoryLower.split(" ")[0])) return true;
      const aliases = categoryToInterest[career.category];
      return aliases?.some(a => il.includes(a) || a.includes(il)) ?? false;
    });
    if (interestMatch) {
      score += 30;
      if (!reasons.some(r => r.includes("interest"))) {
        reasons.push(`Your interest in ${career.category} aligns with this field`);
      }
    }

    // O-Level subject keywords match (for students without A-Level - interests can differ from subjects)
    if (aLevelCount === 0 && oLevelCount >= 5) {
      const oLevelTerms = (profile.oLevelSubjects ?? []).map(s => s.toLowerCase());
      const keywordMatches = career.keywords.filter(k =>
        oLevelTerms.some(t => t.includes(k.toLowerCase()) || k.toLowerCase().includes(t))
      );
      if (keywordMatches.length > 0) {
        score += keywordMatches.length * 5;
      }
    }

    // Best fit bonus: ≥2 A-Level subjects AND ≥5 O-Level subjects
    if (meetsBestFit) {
      score += 25;
    }
    // O-Level only: boost careers with diploma programs (Technology, Business)
    const hasDiplomaPath = ["Technology", "Business & Finance"].includes(career.category);
    if (aLevelCount === 0 && oLevelCount >= 5 && hasDiplomaPath) {
      score += 30;
      reasons.push(`Diploma programs in ${career.category} don't require A-Level—5 O-Level passes can qualify you`);
    }
    // A-Level users: also show poly/diploma options (shorter, practical path)
    if (aLevelCount >= 2 && oLevelCount >= 5 && hasDiplomaPath) {
      reasons.push(`Diploma/polytechnic programs in ${career.category} are also an option—no A-Level required, shorter duration`);
    }

    // Match strengths to required skills
    const skillMatches = career.requiredSkills.filter(skill =>
      profile.strengths.some(s => skill.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(skill.toLowerCase()))
    );
    if (skillMatches.length > 0) {
      score += skillMatches.length * 8;
    }

    // Personality type matching (Holland theory)
    if (profile.personalityType) {
      const pt = profile.personalityType.toLowerCase();
      if (
        (pt === "realistic" && ["Engineering", "Agriculture"].includes(career.category)) ||
        (pt === "investigative" && ["Technology", "Healthcare", "Social Sciences"].includes(career.category)) ||
        (pt === "artistic" && ["Media & Communication", "Education"].includes(career.category)) ||
        (pt === "social" && ["Education", "Healthcare", "Social Sciences"].includes(career.category)) ||
        (pt === "enterprising" && ["Business & Finance", "Law"].includes(career.category)) ||
        (pt === "conventional" && ["Business & Finance", "Technology"].includes(career.category))
      ) {
        score += 15;
      }
    }

    if (reasons.length === 0 && score > 0) {
      reasons.push(`If you have the required subjects (e.g. ${careerALevelReq || "Mathematics"} at A-Level, and English, Maths, Science at O-Level) or equivalent, you can pursue programs in this field`);
    }

    const matchPercentage = Math.min(Math.round((score / 100) * 100), 99);

    // Determine demand level from job outlook
    let demandLevel: "High" | "Medium" | "Low" = "Medium";
    const outlook = career.jobOutlook.toLowerCase();
    if (outlook.startsWith("excellent") || outlook.startsWith("very high") || outlook.startsWith("high")) {
      demandLevel = "High";
    } else if (outlook.startsWith("moderate") || outlook.startsWith("stable") || outlook.startsWith("good")) {
      demandLevel = "Medium";
    } else {
      demandLevel = "Low";
    }

    return { career, matchPercentage, matchReasons: reasons, demandLevel };
  });

  let filtered = scores.filter(s => s.matchPercentage > 10);

  // O-Level only with 5+ passes: ensure at least 2 diploma paths are shown (no A-Level required)
  if (aLevelCount === 0 && oLevelCount >= 5) {
    const diplomaIds = [1, 2, 3]; // Software Developer, Data Analyst, Accountant
    const includedIds = new Set(filtered.map(s => s.career.id));
    for (const id of diplomaIds) {
      if (includedIds.has(id)) continue;
      const s = scores.find(x => x.career.id === id);
      if (s) {
        filtered.push({
          ...s,
          matchPercentage: Math.max(s.matchPercentage, 40),
          matchReasons: s.matchReasons.includes("Diploma programs")
            ? s.matchReasons
            : [...s.matchReasons, "Diploma programs don't require A-Level—5 O-Level passes can qualify you"],
        });
      }
    }
  }

  return filtered
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 6);
}
