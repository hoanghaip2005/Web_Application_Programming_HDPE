import { Router } from "express";
import { optionalAuth } from "../../middlewares/auth.js";
import { getGameRanking } from "./ranking.controller.js";

const router = Router();

router.get("/:gameCode", optionalAuth, getGameRanking);

export default router;
