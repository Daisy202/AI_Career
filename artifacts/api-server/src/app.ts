import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";
import { apiLoggingMiddleware } from "./lib/logging.js";
import { fileLogger } from "./lib/fileLogger.js";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const SESSION_MAX_MS = 15 * 60 * 1000; // 15 minutes; rolling extends on each request (e.g. /auth/ping)

app.use(
  session({
    secret: process.env.SESSION_SECRET || "career-guide-zw-secret-2024",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: SESSION_MAX_MS,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use("/api", apiLoggingMiddleware, router);

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Express error:", err);
  const userId = (req.session as { userId?: number })?.userId;
  fileLogger.logError({
    userId,
    message: "Express error handler",
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    endpoint: req.originalUrl,
  });
  res.status(500).json({ error: "Internal server error" });
});

export default app;
