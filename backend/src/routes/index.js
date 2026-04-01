import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import gamesRoutes from "../modules/games/games.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import rankingRoutes from "../modules/ranking/ranking.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import friendsRoutes from "../modules/friends/friends.routes.js";
import messagesRoutes from "../modules/messages/messages.routes.js";
import achievementsRoutes from "../modules/achievements/achievements.routes.js";
import { hasDatabase } from "../config/db.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    data: {
      status: "ok",
      databaseConfigured: hasDatabase
    }
  });
});

router.use("/auth", authRoutes);
router.use("/games", gamesRoutes);
router.use("/profile", profileRoutes);
router.use("/users", usersRoutes);
router.use("/friends", friendsRoutes);
router.use("/messages", messagesRoutes);
router.use("/achievements", achievementsRoutes);
router.use("/ranking", rankingRoutes);
router.use("/admin", adminRoutes);

export default router;
