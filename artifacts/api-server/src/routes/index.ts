import { Router, type IRouter } from "express";
import healthRouter from "./health";
import interactionsRouter from "./interactions";
import insightsRouter from "./insights";
import peopleRouter from "./people";

const router: IRouter = Router();

router.use(healthRouter);
router.use(interactionsRouter);
router.use(insightsRouter);
router.use(peopleRouter);

export default router;
