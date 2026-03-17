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
    keywords: ["IT", "technology", "computing", "coding", "programming", "maths", "analytical", "problem-solving"],
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
    keywords: ["IT", "technology", "maths", "data", "analytical", "statistics", "business"],
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
    keywords: ["business", "finance", "maths", "accounts", "commerce", "numbers", "analytical"],
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
  personalityType?: string | null;
  hobbies?: string[];
}): Array<{ career: CareerData; matchPercentage: number; matchReasons: string[]; demandLevel: "High" | "Medium" | "Low" }> {
  const allTerms = [
    ...profile.interests.map(s => s.toLowerCase()),
    ...profile.strengths.map(s => s.toLowerCase()),
    ...profile.subjects.map(s => s.toLowerCase()),
    ...(profile.hobbies || []).map(s => s.toLowerCase()),
    (profile.personalityType || "").toLowerCase(),
  ];

  const scores = CAREERS.map(career => {
    let score = 0;
    const reasons: string[] = [];

    // Match against keywords
    const keywordMatches = career.keywords.filter(kw =>
      allTerms.some(term => term.includes(kw) || kw.includes(term))
    );
    score += keywordMatches.length * 15;

    // Match subjects
    const subjectMatches = career.aLevelSubjects.filter(sub =>
      profile.subjects.some(s => s.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(s.toLowerCase()))
    );
    if (subjectMatches.length > 0) {
      score += subjectMatches.length * 20;
      reasons.push(`Your subjects (${subjectMatches.slice(0, 2).join(", ")}) align well with this career`);
    }

    // Match interests to category
    const categoryLower = career.category.toLowerCase();
    const interestMatch = profile.interests.some(i =>
      categoryLower.includes(i.toLowerCase()) || i.toLowerCase().includes(categoryLower.split(" ")[0])
    );
    if (interestMatch) {
      score += 25;
      reasons.push(`Your interest in ${career.category} matches this field`);
    }

    // Match strengths to required skills
    const skillMatches = career.requiredSkills.filter(skill =>
      profile.strengths.some(s => skill.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(skill.toLowerCase()))
    );
    if (skillMatches.length > 0) {
      score += skillMatches.length * 10;
      reasons.push(`Your strength in ${skillMatches[0]} is essential for this career`);
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
        score += 20;
        reasons.push(`Your ${profile.personalityType} personality type suits this field`);
      }
    }

    if (reasons.length === 0 && score > 0) {
      reasons.push(`Matches your academic profile`);
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

  return scores
    .filter(s => s.matchPercentage > 10)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);
}
