import { asyncHandler } from "../../utils/http.js";
import { getProfile, updateProfile, uploadProfileAvatar } from "./profile.service.js";

export const getMe = asyncHandler(async (req, res) => {
  const data = await getProfile(req.auth.sub);
  res.json({ data });
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = await updateProfile(req.auth.sub, req.body);
  res.json({ data });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  const data = await uploadProfileAvatar(req.auth.sub, req.body);
  res.json({ data });
});
