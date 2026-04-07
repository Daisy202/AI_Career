import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const universityProgramsTable = sqliteTable("university_programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  schoolName: text("school_name").notNull(),
  programName: text("program_name").notNull(),
  faculty: text("faculty"),
  programType: text("program_type").default("degree"), // "degree" | "diploma"
  requiredSubjects: text("required_subjects", { mode: "json" }).$type<string[]>().notNull(),
  /** Minimum number of required A-Level subjects needed (e.g. 2 = "at least 2 of the listed subjects"). Null = all required. */
  minRequiredSubjects: integer("min_required_subjects"),
  requiredOLevelSubjects: text("required_o_level_subjects", { mode: "json" }).$type<string[]>(),
  minimumPoints: integer("minimum_points"),
  minOLevelPasses: integer("min_o_level_passes"),
  minALevelPasses: integer("min_a_level_passes"),
  duration: text("duration"),
  description: text("description"),
  careerCategory: text("career_category"),
  campus: text("campus"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertUniversityProgramSchema = createInsertSchema(universityProgramsTable).omit({ id: true, createdAt: true });
export type InsertUniversityProgram = z.infer<typeof insertUniversityProgramSchema>;
export type UniversityProgram = typeof universityProgramsTable.$inferSelect;
