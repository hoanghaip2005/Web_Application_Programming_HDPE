import { asyncHandler } from "../../utils/http.js";
import { getRanking } from "./ranking.service.js";

export const getGameRanking = asyncHandler(async (req, res) => {
  const scope = req.query.scope || "global";
  const data = await getRanking(req.params.gameCode, scope, req.auth?.sub || null);
  res.json({ data });
});
