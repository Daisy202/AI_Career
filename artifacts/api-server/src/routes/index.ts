import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import careersRouter from "./careers.js";
import jobsRouter from "./jobs.js";
import chatRouter from "./chat.js";
import chatSessionsRouter from "./chatSessions.js";
import profileRouter from "./profile.js";
import programsRouter from "./programs.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(chatSessionsRouter);
router.use(careersRouter);
router.use(jobsRouter);
router.use(chatRouter);
router.use(programsRouter);
router.use(adminRouter);

export default router;
