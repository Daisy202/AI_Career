import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const careersTable = sqliteTable("careers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  requiredSkills: text("required_skills", { mode: "json" }).$type<string[]>().notNull(),
  aLevelSubjects: text("a_level_subjects", { mode: "json" }).$type<string[]>().notNull(),
  universityPrograms: text("university_programs", { mode: "json" }).$type<string[]>().notNull(),
  averageSalary: text("average_salary").notNull(),
  jobOutlook: text("job_outlook").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertCareerSchema = createInsertSchema(careersTable).omit({ id: true, createdAt: true });
export type InsertCareer = z.infer<typeof insertCareerSchema>;
export type Career = typeof careersTable.$inferSelect;

export const feedbackTable = sqliteTable("feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  careerName: text("career_name"),
  helpful: text("helpful").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
