import { db } from "../../config/db.js";
import { createError } from "../../utils/http.js";
import { fallbackGames } from "../games/game-data.js";

function buildFallbackRanking(scope, gameCode, userId) {
  const seed = fallbackGames.find((game) => game.code === gameCode);
  if (!seed) {
    throw createError(404, "Game not found");
  }

  const rows = [
    { username: "player-one", totalScore: 240, totalMatches: 8, winsCount: 5, scope },
    { username: "player-two", totalScore: 180, totalMatches: 7, winsCount: 4, scope },
    { username: userId ? "current-user" : "guest-demo", totalScore: 120, totalMatches: 5, winsCount: 2, scope }
  ];

  if (scope === "personal") {
    return rows.slice(-1);
  }

  if (scope === "friends") {
    return rows.slice(0, 2);
  }

  return rows;
}

export async function getRanking(gameCode, scope, userId) {
  if (!["global", "friends", "personal"].includes(scope)) {
    throw createError(400, "Invalid ranking scope");
  }

  if ((scope === "friends" || scope === "personal") && !userId) {
    throw createError(401, "Authentication required for this ranking scope");
  }

  if (!db) {
    return buildFallbackRanking(scope, gameCode, userId);
  }

  const baseQuery = db("game_results")
    .join("games", "games.game_id", "game_results.game_id")
    .join("users", "users.user_id", "game_results.user_id")
    .where("games.code", gameCode)
    .where("game_results.ranking_eligible", true)
    .groupBy("users.user_id", "users.username")
    .select(
      "users.user_id",
      "users.username",
      db.raw("coalesce(sum(game_results.final_score), 0)::int as total_score"),
      db.raw("count(game_results.result_id)::int as total_matches"),
      db.raw(
        "sum(case when game_results.outcome = 'win' then 1 else 0 end)::int as wins_count"
      )
    )
    .orderBy("total_score", "desc");

  if (scope === "personal") {
    baseQuery.andWhere("users.user_id", userId);
  }

  if (scope === "friends") {
    baseQuery.whereIn("users.user_id", function scopeQuery() {
      this.select("requester_id")
        .from("friendships")
        .where("addressee_id", userId)
        .andWhere("status", "accepted")
        .union(function unionQuery() {
          this.select("addressee_id")
            .from("friendships")
            .where("requester_id", userId)
            .andWhere("status", "accepted");
        })
        .union(function selfQuery() {
          this.select(db.raw("?", [userId]));
        });
    });
  }

  const rows = await baseQuery;
  return rows.map((row) => ({
    userId: row.user_id,
    username: row.username,
    totalScore: Number(row.total_score || 0),
    totalMatches: Number(row.total_matches || 0),
    winsCount: Number(row.wins_count || 0)
  }));
}
