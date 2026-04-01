import { ensureDb } from "../../config/db.js";

export async function listAchievements(currentUserId = null) {
  const knex = ensureDb();
  let query = knex("achievements")
    .select(
      "achievements.achievement_id",
      "achievements.code",
      "achievements.name",
      "achievements.description",
      "achievements.points",
      "achievements.is_active"
    )
    .where("achievements.is_active", true)
    .orderBy("achievements.points", "desc");

  if (currentUserId) {
    query = query
      .leftJoin("user_achievements", function joinUserAchievements() {
        this.on("user_achievements.achievement_id", "achievements.achievement_id").andOnVal(
          "user_achievements.user_id",
          currentUserId
        );
      })
      .select("user_achievements.unlocked_at", "user_achievements.progress_value");
  }

  const rows = await query;

  return rows.map((row) => ({
    achievementId: row.achievement_id,
    code: row.code,
    name: row.name,
    description: row.description,
    points: row.points,
    unlockedAt: row.unlocked_at,
    progressValue: row.progress_value
  }));
}
