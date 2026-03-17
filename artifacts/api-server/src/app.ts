import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import router from "./routes/index.js";

const app: Express = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "career-guide-zw-secret-2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use("/api", router);

export default app;
