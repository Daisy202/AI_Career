import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import careersRouter from "./careers.js";
import jobsRouter from "./jobs.js";
import chatRouter from "./chat.js";
import programsRouter from "./programs.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(careersRouter);
router.use(jobsRouter);
router.use(chatRouter);
router.use(programsRouter);

export default router;
