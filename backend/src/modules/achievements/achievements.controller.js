import { asyncHandler } from "../../utils/http.js";
import { listAchievements } from "./achievements.service.js";

export const allAchievements = asyncHandler(async (_req, res) => {
  const data = await listAchievements();
  res.json({ data });
});

export const myAchievements = asyncHandler(async (req, res) => {
  const data = await listAchievements(req.auth.sub);
  res.json({ data });
});
