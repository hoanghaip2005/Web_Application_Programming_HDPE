import { asyncHandler } from "../../utils/http.js";
import {
  createManagedAchievement,
  getOverview,
  listManagedAchievements,
  listGameStatistics,
  listManagedGames,
  getManagedUserDetail,
  listUserStatistics,
  listUsers,
  updateManagedAchievement,
  updateManagedGame,
  updateManagedUser
} from "./admin.service.js";

export const overview = asyncHandler(async (_req, res) => {
  const data = await getOverview();
  res.json({ data });
});

export const users = asyncHandler(async (_req, res) => {
  const data = await listUsers(_req.query);
  res.json({ data });
});

export const userDetail = asyncHandler(async (req, res) => {
  const data = await getManagedUserDetail(req.params.userId);
  res.json({ data });
});

export const games = asyncHandler(async (_req, res) => {
  const data = await listManagedGames();
  res.json({ data });
});

export const gameStatistics = asyncHandler(async (_req, res) => {
  const data = await listGameStatistics();
  res.json({ data });
});

export const userStatistics = asyncHandler(async (_req, res) => {
  const data = await listUserStatistics();
  res.json({ data });
});

export const achievements = asyncHandler(async (req, res) => {
  const data = await listManagedAchievements(req.query);
  res.json({ data });
});

export const createAchievement = asyncHandler(async (req, res) => {
  const data = await createManagedAchievement(req.body, req.auth.sub);
  res.status(201).json({ data });
});

export const patchGame = asyncHandler(async (req, res) => {
  const data = await updateManagedGame(req.params.gameCode, req.body, req.auth.sub);
  res.json({ data });
});

export const patchAchievement = asyncHandler(async (req, res) => {
  const data = await updateManagedAchievement(
    req.params.achievementId,
    req.body,
    req.auth.sub
  );
  res.json({ data });
});

export const patchUser = asyncHandler(async (req, res) => {
  const data = await updateManagedUser(req.params.userId, req.body, req.auth.sub);
  res.json({ data });
});
