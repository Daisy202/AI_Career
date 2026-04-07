import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";
import { fileLogger } from "../lib/fileLogger.js";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, email, password, school, level } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ name, email, passwordHash, role: "student", school: school ?? null, level: level ?? null })
    .returning();

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userName = user.name;
  req.session.userEmail = user.email;

  fileLogger.logAuth({ userId: user.id, action: "User registered", success: true, details: { email: user.email } });

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, level: user.level },
    message: "Account created successfully",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  try {
    const parsed = LoginUserBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const { email, password } = parsed.data;

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      fileLogger.logAuth({ action: "Login failed", success: false, details: { email, reason: "user_not_found" } });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      fileLogger.logAuth({ userId: user.id, action: "Login failed", success: false, details: { reason: "invalid_password" } });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    fileLogger.logAuth({ userId: user.id, action: "User logged in", success: true });

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, level: user.level },
      message: "Logged in successfully",
    });
  } catch (err) {
    console.error("Login error:", err);
    fileLogger.logError({ message: "Login failed", error: String(err), endpoint: "/api/auth/login" });
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/auth/logout", (req, res): void => {
  const userId = req.session?.userId;
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    fileLogger.logAuth({ userId, action: "User logged out", success: true });
    res.json({ message: "Logged out successfully" });
  });
});

/** Extends session cookie (rolling). Call while user is active to keep server session alive. */
router.get("/auth/ping", requireAuth, (_req, res): void => {
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, level: user.level });
  } catch (err) {
    console.error("Auth/me error:", err);
    res.status(500).json({ error: "Auth check failed" });
  }
});

export default router;
