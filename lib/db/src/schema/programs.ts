import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universityProgramsTable = pgTable("university_programs", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull(),
  programName: text("program_name").notNull(),
  faculty: text("faculty"),
  requiredSubjects: text("required_subjects").array().notNull(),
  minimumPoints: integer("minimum_points"),
  duration: text("duration"),
  description: text("description"),
  careerCategory: text("career_category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUniversityProgramSchema = createInsertSchema(universityProgramsTable).omit({ id: true, createdAt: true });
export type InsertUniversityProgram = z.infer<typeof insertUniversityProgramSchema>;
export type UniversityProgram = typeof universityProgramsTable.$inferSelect;
