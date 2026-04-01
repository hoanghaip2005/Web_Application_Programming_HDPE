import { asyncHandler } from "../../utils/http.js";
import {
  ensureGame,
  getSavedGame,
  listGames,
  listReviews,
  saveGame,
  submitGameResult,
  upsertReview
} from "./games.service.js";

export const getGames = asyncHandler(async (_req, res) => {
  const data = await listGames();
  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ data });
});

export const getGame = asyncHandler(async (req, res) => {
  const data = await ensureGame(req.params.gameCode);
  res.json({ data });
});

export const getGameReviews = asyncHandler(async (req, res) => {
  const data = await listReviews(req.params.gameCode);
  res.json({ data });
});

export const postGameReview = asyncHandler(async (req, res) => {
  const data = await upsertReview(req.params.gameCode, req.auth.sub, req.body);
  res.status(201).json({ data });
});

export const getGameSave = asyncHandler(async (req, res) => {
  const data = await getSavedGame(req.params.gameCode, req.auth.sub);
  res.json({ data });
});

export const postGameSave = asyncHandler(async (req, res) => {
  const data = await saveGame(req.params.gameCode, req.auth.sub, req.body);
  res.status(201).json({ data });
});

export const postGameResult = asyncHandler(async (req, res) => {
  const data = await submitGameResult(req.params.gameCode, req.auth.sub, req.body);
  res.status(201).json({ data });
});
