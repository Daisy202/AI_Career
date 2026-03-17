import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import careersRouter from "./careers.js";
import jobsRouter from "./jobs.js";
import chatRouter from "./chat.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(careersRouter);
router.use(jobsRouter);
router.use(chatRouter);

export default router;
