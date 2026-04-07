import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const apiLogsTable = sqliteTable("api_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull(),
  method: text("method").notNull(),
  status: integer("status").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  userId: integer("user_id"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
