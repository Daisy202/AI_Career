import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";

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

  res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, level: user.level },
    message: "Account created successfully",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userName = user.name;
  req.session.userEmail = user.email;

  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, level: user.level },
    message: "Logged in successfully",
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, school: user.school, level: user.level });
});

export default router;
