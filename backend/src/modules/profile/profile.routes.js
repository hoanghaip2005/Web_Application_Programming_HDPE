import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { getMe, updateMe, uploadAvatar } from "./profile.controller.js";

const router = Router();

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.post("/avatar", requireAuth, uploadAvatar);

export default router;
