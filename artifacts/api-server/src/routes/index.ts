import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import statsRouter from "./stats";
import preferencesRouter from "./preferences";
import achievementsRouter from "./achievements";
import { friendsRouter } from "./friends";
import { spectatorRouter } from "./spectator";
import { chatRouter } from "./chat";
import { ttsRouter } from "./tts";
import metricsRouter from "./metrics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(statsRouter);
router.use(preferencesRouter);
router.use(achievementsRouter);
router.use(friendsRouter);
router.use(spectatorRouter);
router.use(chatRouter);
router.use(ttsRouter);
router.use(metricsRouter);

export default router;
