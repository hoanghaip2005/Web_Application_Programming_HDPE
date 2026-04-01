import { Router } from "express";
import { requireAdmin, requireAuth } from "../../middlewares/auth.js";
import { requireApiKey } from "../../middlewares/api-key.js";
import {
  createAchievement,
  achievements,
  gameStatistics,
  games,
  overview,
  patchAchievement,
  patchGame,
  patchUser,
  userDetail,
  userStatistics,
  users
} from "./admin.controller.js";

const router = Router();

router.use(requireAuth, requireApiKey, requireAdmin);
router.get("/statistics/overview", overview);
router.get("/statistics/games", gameStatistics);
router.get("/statistics/users", userStatistics);
router.post("/achievements", createAchievement);
router.get("/achievements", achievements);
router.patch("/achievements/:achievementId", patchAchievement);
router.get("/users", users);
router.get("/users/:userId", userDetail);
router.patch("/users/:userId", patchUser);
router.get("/games", games);
router.patch("/games/:gameCode", patchGame);

export default router;
