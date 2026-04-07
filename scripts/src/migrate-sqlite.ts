import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    school TEXT,
    level TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS careers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    a_level_subjects TEXT NOT NULL,
    university_programs TEXT NOT NULL,
    average_salary TEXT NOT NULL,
    job_outlook TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    rating INTEGER NOT NULL,
    comment TEXT,
    career_name TEXT,
    helpful TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    interests TEXT NOT NULL,
    strengths TEXT NOT NULL,
    subjects TEXT NOT NULL,
    personality_type TEXT,
    hobbies TEXT,
    cut_off_points INTEGER,
    o_level_passes INTEGER,
    a_level_passes INTEGER,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    status INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    user_id INTEGER,
    error_message TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS university_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    school_name TEXT NOT NULL,
    program_name TEXT NOT NULL,
    faculty TEXT,
    required_subjects TEXT NOT NULL,
    minimum_points INTEGER,
    min_o_level_passes INTEGER DEFAULT 5,
    min_a_level_passes INTEGER DEFAULT 2,
    duration TEXT,
    description TEXT,
    career_category TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
];

const alterStatements = [
  `ALTER TABLE university_programs ADD COLUMN min_o_level_passes INTEGER DEFAULT 5`,
  `ALTER TABLE university_programs ADD COLUMN min_a_level_passes INTEGER DEFAULT 2`,
  `ALTER TABLE feedback ADD COLUMN user_id INTEGER`,
  `ALTER TABLE chat_sessions ADD COLUMN title TEXT`,
  `ALTER TABLE university_programs ADD COLUMN program_type TEXT DEFAULT 'degree'`,
  `ALTER TABLE university_programs ADD COLUMN required_o_level_subjects TEXT`,
  `ALTER TABLE university_programs ADD COLUMN campus TEXT`,
  `ALTER TABLE student_profiles ADD COLUMN o_level_subjects TEXT`,
  `ALTER TABLE university_programs ADD COLUMN min_required_subjects INTEGER`,
];

async function migrate() {
  for (const stmt of statements) {
    await db.run(sql.raw(stmt));
  }
  for (const stmt of alterStatements) {
    try {
      await db.run(sql.raw(stmt));
    } catch {
      // Column may already exist
    }
  }
  console.log("✓ SQLite schema applied");
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
