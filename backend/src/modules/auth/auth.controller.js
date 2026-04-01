import { asyncHandler } from "../../utils/http.js";
import { getCurrentUser, loginUser, registerUser } from "./auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body);
  res.status(201).json({ data });
});

export const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body);
  res.json({ data });
});

export const me = asyncHandler(async (req, res) => {
  const user = await getCurrentUser(req.auth.sub);
  res.json({ data: { user } });
});
