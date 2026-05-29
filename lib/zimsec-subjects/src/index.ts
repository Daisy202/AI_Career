/**
 * ZIMSEC / Cambridge A-Level and O-Level subjects common in Zimbabwe.
 * Schools may not offer every subject.
 */

export interface SubjectGroup {
  label: string;
  subjects: string[];
}

export const A_LEVEL_SUBJECT_GROUPS: SubjectGroup[] = [
  {
    label: "Sciences",
    subjects: [
      "Mathematics",
      "Pure Mathematics",
      "Additional Mathematics",
      "Statistics",
      "Mechanical Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "Software Engineering",
      "Agricultural Science",
      "Crop Science",
      "Animal Science",
      "Horticulture",
      "Sports Science and Technology",
      "Physical Education",
      "Agricultural Engineering",
    ],
  },
  {
    label: "Commercial",
    subjects: [
      "Accounting",
      "Economics",
      "Business Studies",
      "Business Enterprise",
      "Commerce",
      "Travel and Tourism",
      "Sport Management",
    ],
  },
  {
    label: "Arts & Humanities",
    subjects: [
      "History",
      "Economic History",
      "Geography",
      "Sociology",
      "Literature in English",
      "Literature in Shona",
      "Literature in Ndebele",
      "Family and Religious Studies",
      "Biblical Studies",
      "Theatre Arts and Film Studies",
      "Fine Art",
      "Music",
      "Dance",
      "Guidance and Counselling",
    ],
  },
  {
    label: "Languages",
    subjects: [
      "English Language",
      "Shona",
      "Ndebele",
      "French",
      "Communication Skills",
      "Foreign Languages",
    ],
  },
  {
    label: "Technical & Vocational",
    subjects: [
      "Building Technology and Design",
      "Wood Technology and Design",
      "Metal Technology and Design",
      "Textile Technology",
      "Food Technology and Design",
      "Technical Graphics and Design",
      "Design Technology",
      "Home Management",
    ],
  },
];

export const A_LEVEL_SUBJECTS: string[] = A_LEVEL_SUBJECT_GROUPS.flatMap(g => g.subjects);

export const O_LEVEL_SUBJECT_GROUPS: SubjectGroup[] = [
  {
    label: "Core & Sciences",
    subjects: [
      "English Language",
      "Mathematics",
      "Biology",
      "Chemistry",
      "Physics",
      "Science",
      "Computer Science",
      "Agricultural Science",
    ],
  },
  {
    label: "Commercial",
    subjects: [
      "Accounting",
      "Commerce",
      "Business Studies",
      "Economics",
    ],
  },
  {
    label: "Arts & Humanities",
    subjects: [
      "Geography",
      "History",
      "Religious Studies",
      "Family and Religious Studies",
      "Literature in English",
      "Shona",
      "Ndebele",
      "Art",
      "Music",
    ],
  },
  {
    label: "Technical & Other",
    subjects: [
      "Design and Technology",
      "Food and Nutrition",
      "Home Economics",
      "Physical Education",
      "Technical Graphics",
    ],
  },
];

export const O_LEVEL_SUBJECTS: string[] = O_LEVEL_SUBJECT_GROUPS.flatMap(g => g.subjects);

export const COMMON_A_LEVEL_COMBINATIONS = [
  { name: "MPC", subjects: "Mathematics, Physics, Chemistry" },
  { name: "MCB / MBC", subjects: "Mathematics, Chemistry, Biology" },
  { name: "PCB", subjects: "Physics, Chemistry, Biology" },
  {
    name: "Commercial",
    subjects: "Accounting, Economics, Business Studies",
  },
  {
    name: "Commercial (with Maths)",
    subjects: "Accounting, Mathematics, Economics",
  },
  {
    name: "Arts",
    subjects: "History, Geography, Literature in English",
  },
  {
    name: "Social Sciences",
    subjects: "Sociology, History, Geography",
  },
];

function aliasKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "").trim();
}

/** Match student subject to program requirement (Zimbabwe naming variants). */
export function subjectAlias(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const aNorm = normalize(a);
  const bNorm = normalize(b);
  if (aNorm === bNorm) return true;
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return true;

  const aliases: Record<string, string[]> = {
    maths: ["mathematics", "math"],
    mathematics: ["maths", "math", "pure mathematics", "additional mathematics", "statistics", "mechanical mathematics"],
    math: ["maths", "mathematics"],
    "pure mathematics": ["mathematics", "maths", "math"],
    "additional mathematics": ["mathematics", "maths", "math"],
    statistics: ["mathematics", "maths", "math"],
    "mechanical mathematics": ["mathematics", "maths", "math"],
    bio: ["biology"],
    biology: ["bio"],
    chem: ["chemistry"],
    chemistry: ["chem"],
    physics: ["physical science"],
    english: ["english language", "literature in english", "english literature"],
    "literature in english": ["english literature", "english"],
    "english literature": ["literature in english", "english"],
    accounts: ["accounting", "accountancy"],
    accounting: ["accounts", "accountancy"],
    commerce: ["commercial studies", "business studies", "business enterprise"],
    geography: ["geo"],
    geo: ["geography"],
    history: ["hist", "economic history"],
    agriculture: ["agricultural science", "crop science", "animal science"],
    "agricultural science": ["agriculture", "crop science"],
    "computer science": ["software engineering", "computing", "ict"],
    "fine art": ["art and design", "art"],
    art: ["fine art", "art and design"],
    "home economics": ["home management", "food technology and design"],
    "home management": ["home economics", "food technology and design"],
    shona: ["literature in shona"],
    ndebele: ["literature in ndebele"],
  };

  const aKey = aliasKey(aNorm);
  const bKey = aliasKey(bNorm);
  const aList = aliases[aKey] ?? aliases[aNorm] ?? [];
  const bList = aliases[bKey] ?? aliases[bNorm] ?? [];
  return (
    aList.some(x => aliasKey(x) === bKey) ||
    bList.some(x => aliasKey(x) === aKey)
  );
}
