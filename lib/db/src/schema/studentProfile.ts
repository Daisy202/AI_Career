import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const studentProfilesTable = sqliteTable("student_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().unique(),
  interests: text("interests", { mode: "json" }).$type<string[]>().notNull(),
  strengths: text("strengths", { mode: "json" }).$type<string[]>().notNull(),
  subjects: text("subjects", { mode: "json" }).$type<string[]>().notNull(),
  oLevelSubjects: text("o_level_subjects", { mode: "json" }).$type<string[]>(),
  personalityType: text("personality_type"),
  hobbies: text("hobbies", { mode: "json" }).$type<string[]>(),
  cutOffPoints: integer("cut_off_points"),
  oLevelPasses: integer("o_level_passes"),
  aLevelPasses: integer("a_level_passes"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertStudentProfileSchema = createInsertSchema(studentProfilesTable).omit({ id: true, updatedAt: true });
export type StudentProfileRow = typeof studentProfilesTable.$inferSelect;
