import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const universitiesTable = sqliteTable("universities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  acronyms: text("acronyms", { mode: "json" }).$type<string[]>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const insertUniversitySchema = createInsertSchema(universitiesTable).omit({
  id: true,
  createdAt: true,
});

export type University = typeof universitiesTable.$inferSelect;
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
