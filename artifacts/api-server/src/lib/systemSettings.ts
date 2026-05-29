import { db, systemSettingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export type AiMode = "offline" | "online";

const SETTINGS_ROW_ID = 1;

export async function ensureSystemSettingsTable(): Promise<void> {
  await db.run(sql.raw(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY,
      ai_mode TEXT NOT NULL DEFAULT 'offline',
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_by_user_id INTEGER
    )
  `));

  const existing = await db
    .select({ id: systemSettingsTable.id })
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.id, SETTINGS_ROW_ID))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(systemSettingsTable).values({
      id: SETTINGS_ROW_ID,
      aiMode: "offline",
      updatedByUserId: null,
    });
  }
}

export async function getAiMode(): Promise<AiMode> {
  await ensureSystemSettingsTable();
  const [row] = await db
    .select({ aiMode: systemSettingsTable.aiMode })
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.id, SETTINGS_ROW_ID))
    .limit(1);

  const mode = row?.aiMode;
  return mode === "online" ? "online" : "offline";
}

export async function setAiMode(mode: AiMode, updatedByUserId: number): Promise<AiMode> {
  await ensureSystemSettingsTable();
  const [existing] = await db
    .select({ id: systemSettingsTable.id })
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.id, SETTINGS_ROW_ID))
    .limit(1);

  if (existing) {
    await db
      .update(systemSettingsTable)
      .set({
        aiMode: mode,
        updatedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(systemSettingsTable.id, SETTINGS_ROW_ID));
  } else {
    await db.insert(systemSettingsTable).values({
      id: SETTINGS_ROW_ID,
      aiMode: mode,
      updatedByUserId,
      updatedAt: new Date(),
    });
  }

  return mode;
}

export async function getAiSettingsForAdmin(): Promise<{
  aiMode: AiMode;
  onlineConfigured: boolean;
  offlineModel: string;
  onlineModel: string;
}> {
  const aiMode = await getAiMode();
  return {
    aiMode,
    onlineConfigured: Boolean(getOnlineApiKey()),
    offlineModel: process.env.OLLAMA_MODEL || "gemma3:1b",
    onlineModel: getOnlineModel(),
  };
}

export function getOnlineApiKey(): string | undefined {
  const raw =
    process.env.ONLINE_API_KEY ||
    process.env.GITHUB_MODELS_API_KEY ||
    process.env.online_apikey;
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "").trim() || undefined;
}

export function getOnlineModel(): string {
  const raw =
    process.env.ONLINE_MODEL ||
    process.env.Online_model ||
    process.env.ONLINE_MODEL_NAME;
  if (!raw) return "openai/gpt-4.1";
  return raw.replace(/^["']|["']$/g, "").trim();
}
