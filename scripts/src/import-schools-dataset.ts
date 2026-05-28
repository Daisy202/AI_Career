import { readFileSync } from "fs";
import path from "path";
import { db, careersTable, universitiesTable, universityProgramsTable } from "@workspace/db";

type CsvProgram = {
  schoolName: string;
  programName: string;
  faculty: string | null;
  requiredSubjects: string[];
  minimumPoints: number | null;
  duration: string | null;
  description: string | null;
  careerCategory: string | null;
  minOLevelPasses: number | null;
  minALevelPasses: number | null;
  programType: string | null;
  requiredOLevelSubjects: string[] | null;
  campus: string | null;
  minRequiredSubjects: number | null;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      const isEscaped = inQuotes && line[i + 1] === '"';
      if (isEscaped) {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out;
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n === 0 ? null : n;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toJsonArray(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.map(v => String(v).trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function normalizeAcronyms(name: string): string[] {
  const acronyms: string[] = [];
  const paren = name.match(/\(([^)]+)\)/);
  if (paren?.[1]) acronyms.push(paren[1].trim());
  const letters = name
    .split(/\s+/)
    .filter(w => /^[A-Z]/.test(w))
    .map(w => w.replace(/[^A-Za-z]/g, ""))
    .join("");
  if (letters.length >= 2 && letters.length <= 8) acronyms.push(letters);
  return [...new Set(acronyms)];
}

function mapPrograms(rows: string[][]): CsvProgram[] {
  return rows.map(cols => ({
    schoolName: cols[1]?.trim() ?? "",
    programName: cols[2]?.trim() ?? "",
    faculty: toNullableText(cols[3] ?? ""),
    requiredSubjects: toJsonArray(cols[4] ?? ""),
    minimumPoints: toNullableNumber(cols[5] ?? ""),
    duration: toNullableText(cols[6] ?? ""),
    description: toNullableText(cols[7] ?? ""),
    careerCategory: toNullableText(cols[8] ?? ""),
    minOLevelPasses: toNullableNumber(cols[10] ?? ""),
    minALevelPasses: toNullableNumber(cols[11] ?? ""),
    programType: toNullableText(cols[12] ?? ""),
    requiredOLevelSubjects: cols[13]?.trim() ? toJsonArray(cols[13]) : null,
    campus: toNullableText(cols[14] ?? ""),
    minRequiredSubjects: toNullableNumber(cols[15] ?? ""),
  }));
}

async function run() {
  const csvPath = path.resolve(process.cwd(), "..", "data", "schools DATASET.csv");
  const raw = readFileSync(csvPath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const dataLines = lines.slice(1);
  const rows = dataLines.map(parseCsvLine);
  const programs = mapPrograms(rows).filter(p => p.schoolName && p.programName);

  const uniqueSchools = [...new Set(programs.map(p => p.schoolName))];
  const categories = [...new Set(programs.map(p => p.careerCategory).filter(Boolean) as string[])];

  await db.delete(universityProgramsTable);
  await db.delete(universitiesTable);
  await db.delete(careersTable);

  await db.insert(universitiesTable).values(
    uniqueSchools.map(name => ({
      name,
      acronyms: normalizeAcronyms(name),
    }))
  );

  await db.insert(universityProgramsTable).values(
    programs.map(p => ({
      schoolName: p.schoolName,
      programName: p.programName,
      faculty: p.faculty,
      requiredSubjects: p.requiredSubjects,
      minRequiredSubjects: p.minRequiredSubjects,
      minimumPoints: p.minimumPoints,
      minOLevelPasses: p.minOLevelPasses,
      minALevelPasses: p.minALevelPasses,
      duration: p.duration,
      description: p.description,
      careerCategory: p.careerCategory,
      programType: p.programType ?? "degree",
      requiredOLevelSubjects: p.requiredOLevelSubjects ?? undefined,
      campus: p.campus,
    }))
  );

  await db.insert(careersTable).values(
    categories.map((category, idx) => {
      const categoryPrograms = programs.filter(p => p.careerCategory === category);
      const topPrograms = categoryPrograms.slice(0, 8).map(p => p.programName);
      const subjectPool = [...new Set(categoryPrograms.flatMap(p => p.requiredSubjects))].slice(0, 6);
      return {
        name: `${category} Career Path`,
        description: `Programs and opportunities in ${category}.`,
        category,
        requiredSkills: ["Problem Solving", "Communication", "Critical Thinking"],
        aLevelSubjects: subjectPool.length > 0 ? subjectPool : ["Mathematics", "English"],
        universityPrograms: topPrograms,
        averageSalary: "Varies by role and institution",
        jobOutlook: "Moderate",
      };
    })
  );

  console.log(`Imported ${programs.length} programs from CSV`);
  console.log(`Updated ${uniqueSchools.length} schools`);
  console.log(`Updated ${categories.length} career categories`);
}

run().catch(err => {
  console.error("Import failed:", err);
  process.exit(1);
});
