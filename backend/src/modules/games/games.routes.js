import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import {
  getGame,
  postGameResult,
  getGameReviews,
  getGames,
  getGameSave,
  postGameReview,
  postGameSave
} from "./games.controller.js";

const router = Router();

router.get("/", getGames);
router.get("/:gameCode/reviews", getGameReviews);
router.get("/:gameCode/save", requireAuth, getGameSave);
router.post("/:gameCode/reviews", requireAuth, postGameReview);
router.post("/:gameCode/save", requireAuth, postGameSave);
router.post("/:gameCode/results", requireAuth, postGameResult);
router.get("/:gameCode", getGame);

export default router;
