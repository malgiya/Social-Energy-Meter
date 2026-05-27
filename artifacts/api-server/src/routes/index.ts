import { Router, type IRouter } from "express";
import healthRouter from "./health";
import interactionsRouter from "./interactions";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(interactionsRouter);
router.use(insightsRouter);

export default router;
