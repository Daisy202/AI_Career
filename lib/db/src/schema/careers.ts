import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const careersTable = pgTable("careers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  requiredSkills: text("required_skills").array().notNull(),
  aLevelSubjects: text("a_level_subjects").array().notNull(),
  universityPrograms: text("university_programs").array().notNull(),
  averageSalary: text("average_salary").notNull(),
  jobOutlook: text("job_outlook").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCareerSchema = createInsertSchema(careersTable).omit({ id: true, createdAt: true });
export type InsertCareer = z.infer<typeof insertCareerSchema>;
export type Career = typeof careersTable.$inferSelect;

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  careerName: text("career_name"),
  helpful: text("helpful").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
