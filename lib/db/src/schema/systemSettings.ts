import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Singleton app settings (row id = 1). */
export const systemSettingsTable = sqliteTable("system_settings", {
  id: integer("id").primaryKey(),
  aiMode: text("ai_mode").notNull().default("offline"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedByUserId: integer("updated_by_user_id"),
});

export type SystemSettings = typeof systemSettingsTable.$inferSelect;
export type AiMode = "offline" | "online";
