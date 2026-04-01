import { asyncHandler } from "../../utils/http.js";
import { searchUsers } from "./users.service.js";

export const search = asyncHandler(async (req, res) => {
  const data = await searchUsers(req.query.q || "", req.auth?.sub || null);
  res.json({ data });
});
