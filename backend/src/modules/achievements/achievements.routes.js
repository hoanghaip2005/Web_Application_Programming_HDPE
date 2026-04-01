import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { allAchievements, myAchievements } from "./achievements.controller.js";

const router = Router();

router.get("/", allAchievements);
router.get("/me", requireAuth, myAchievements);

export default router;
