import { db, ensureDb } from "../../config/db.js";
import { createError } from "../../utils/http.js";
import { fallbackGames } from "./game-data.js";

const GAMES_CACHE_TTL_MS = 5 * 60 * 1000;
const GAME_DETAIL_CACHE_TTL_MS = 5 * 60 * 1000;

let gamesCache = {
  data: null,
  expiresAt: 0
};

let gamesCachePromise = null;
const gameDetailCache = new Map();

function normalizeGame(row) {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    isEnabled: row.is_enabled,
    defaultBoardRows: row.default_board_rows,
    defaultBoardCols: row.default_board_cols,
    defaultTimerSeconds: row.default_timer_seconds,
    displayOrder: row.display_order,
    supportsSaveLoad: row.supports_save_load,
    supportsRating: row.supports_rating,
    supportsComment: row.supports_comment,
    instructions: row.instructions || []
  };
}

function getCachedValue(cacheEntry) {
  if (!cacheEntry?.data || cacheEntry.expiresAt <= Date.now()) {
    return null;
  }

  return cacheEntry.data;
}

function setGamesCache(data) {
  gamesCache = {
    data,
    expiresAt: Date.now() + GAMES_CACHE_TTL_MS
  };

  return data;
}

function getGameDetailCacheKey(code) {
  return String(code || "").toLowerCase();
}

function getCachedGameDetail(code) {
  return getCachedValue(gameDetailCache.get(getGameDetailCacheKey(code)));
}

function setGameDetailCache(code, data) {
  gameDetailCache.set(getGameDetailCacheKey(code), {
    data,
    expiresAt: Date.now() + GAME_DETAIL_CACHE_TTL_MS
  });

  return data;
}

export function invalidateGamesCache() {
  gamesCache = {
    data: null,
    expiresAt: 0
  };
  gamesCachePromise = null;
  gameDetailCache.clear();
}

async function listInstructionsByGameId(knex, gameId) {
  const rows = await knex("game_instructions")
    .select("instruction_id", "title", "content_md", "version")
    .where({ game_id: gameId, is_active: true })
    .orderBy("version", "desc");

  return rows.map((row) => ({
    instructionId: row.instruction_id,
    title: row.title,
    content: row.content_md,
    version: row.version
  }));
}

function countColoredCells(boardState) {
  if (typeof boardState?.coloredCells === "number") {
    return boardState.coloredCells;
  }

  if (Array.isArray(boardState?.board)) {
    return boardState.board.filter(Boolean).length;
  }

  return 0;
}

function normalizeConditionConfig(conditionConfig) {
  if (!conditionConfig) {
    return {};
  }

  if (typeof conditionConfig === "string") {
    try {
      return JSON.parse(conditionConfig);
    } catch {
      return {};
    }
  }

  if (typeof conditionConfig === "object") {
    return conditionConfig;
  }

  return {};
}

async function syncAchievements(knex, { gameId, userId, outcome, boardState, finalScore = 0 }) {
  const achievements = await knex("achievements")
    .select(
      "achievement_id",
      "condition_type",
      "condition_config"
    )
    .where({ game_id: gameId, is_active: true });

  for (const achievement of achievements) {
    const config = normalizeConditionConfig(achievement.condition_config);
    let progressValue = null;

    if (achievement.condition_type === "wins") {
      const [wins] = await knex("game_results")
        .where({ game_id: gameId, user_id: userId, outcome: "win" })
        .count({ total: "result_id" });

      progressValue = Number(wins.total || 0);
      if (outcome !== "win" || progressValue < Number(config.wins || 1)) {
        continue;
      }
    }

    if (achievement.condition_type === "score") {
      progressValue = Number(finalScore || 0);
      const minimumScore = Number(config.minScore ?? config.score ?? 0);
      if (progressValue < minimumScore) {
        continue;
      }
    }

    if (achievement.condition_type === "colored_cells") {
      progressValue = countColoredCells(boardState);
      if (progressValue < Number(config.coloredCells || 0)) {
        continue;
      }
    }

    if (progressValue === null) {
      continue;
    }

    await knex("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievement.achievement_id,
        unlocked_at: knex.fn.now(),
        progress_value: progressValue,
        metadata: {}
      })
      .onConflict(["user_id", "achievement_id"])
      .merge({
        unlocked_at: knex.fn.now(),
        progress_value: progressValue,
        metadata: {}
      });
  }
}

export async function listGames() {
  if (!db) {
    return fallbackGames;
  }

  const cachedGames = getCachedValue(gamesCache);
  if (cachedGames) {
    return cachedGames;
  }

  if (!gamesCachePromise) {
    gamesCachePromise = db("games")
      .select(
        "code",
        "name",
        "description",
        "is_enabled",
        "default_board_rows",
        "default_board_cols",
        "default_timer_seconds",
        "supports_save_load",
        "supports_rating",
        "supports_comment",
        "display_order"
      )
      .orderBy("display_order", "asc")
      .then((rows) => setGamesCache(rows.map(normalizeGame)))
      .finally(() => {
        gamesCachePromise = null;
      });
  }

  try {
    return await gamesCachePromise;
  } catch (error) {
    const staleGames = gamesCache.data;
    if (staleGames?.length) {
      return staleGames;
    }
    throw error;
  }
}

export async function getGameByCode(code) {
  if (!db) {
    const fallback = fallbackGames.find((game) => game.code === code) || null;
    return fallback
      ? {
          ...fallback,
          supportsSaveLoad: true,
          supportsRating: true,
          supportsComment: true,
          instructions: []
        }
      : null;
  }

  const cachedDetail = getCachedGameDetail(code);
  if (cachedDetail) {
    return cachedDetail;
  }

  const baseGame = (await listGames()).find((game) => game.code === code);
  if (!baseGame) {
    return null;
  }

  try {
    const row = await db("games").where({ code }).first("game_id");
    const instructions = row ? await listInstructionsByGameId(db, row.game_id) : [];

    return setGameDetailCache(code, {
      ...baseGame,
      instructions
    });
  } catch (error) {
    return setGameDetailCache(code, {
      ...baseGame,
      instructions: []
    });
  }
}

export async function ensureGame(code) {
  const game = await getGameByCode(code);
  if (!game) {
    throw createError(404, "Game not found");
  }
  return game;
}

async function resolveGameId(knex, code) {
  const row = await knex("games").where({ code }).first("game_id");
  if (!row) {
    throw createError(404, "Game not found");
  }
  return row.game_id;
}

export async function listReviews(gameCode) {
  const knex = ensureDb();
  const gameId = await resolveGameId(knex, gameCode);

  const [ratingSummary] = await knex("game_ratings")
    .where({ game_id: gameId })
    .count({ total: "rating_id" })
    .avg({ average: "rating_value" });

  const comments = await knex("game_comments")
    .join("users", "users.user_id", "game_comments.user_id")
    .leftJoin("game_ratings", function joinRatings() {
      this.on("game_ratings.user_id", "game_comments.user_id").andOnVal(
        "game_ratings.game_id",
        gameId
      );
    })
    .select(
      "game_comments.comment_id",
      "game_comments.comment_body",
      "game_comments.created_at",
      "users.user_id",
      "users.username",
      "game_ratings.rating_value"
    )
    .where("game_comments.game_id", gameId)
    .where("game_comments.status", "visible")
    .orderBy("game_comments.created_at", "desc");

  return {
    averageRating: Number(ratingSummary.average || 0),
    totalRatings: Number(ratingSummary.total || 0),
    reviews: comments.map((comment) => ({
      commentId: comment.comment_id,
      commentBody: comment.comment_body,
      createdAt: comment.created_at,
      user: {
        userId: comment.user_id,
        username: comment.username
      },
      ratingValue: comment.rating_value
    }))
  };
}

export async function upsertReview(gameCode, currentUserId, payload) {
  const knex = ensureDb();
  const gameId = await resolveGameId(knex, gameCode);
  const ratingValue = Number(payload.ratingValue);

  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    throw createError(400, "ratingValue must be between 1 and 5");
  }

  const existingRating = await knex("game_ratings")
    .where({ game_id: gameId, user_id: currentUserId })
    .first();

  if (existingRating) {
    await knex("game_ratings")
      .where({ rating_id: existingRating.rating_id })
      .update({
        rating_value: ratingValue,
        updated_at: knex.fn.now()
      });
  } else {
    await knex("game_ratings").insert({
      game_id: gameId,
      user_id: currentUserId,
      rating_value: ratingValue
    });
  }

  if (payload.commentBody?.trim()) {
    await knex("game_comments").insert({
      game_id: gameId,
      user_id: currentUserId,
      comment_body: payload.commentBody.trim(),
      status: "visible"
    });
  }

  return listReviews(gameCode);
}

export async function getSavedGame(gameCode, currentUserId) {
  const knex = ensureDb();
  const gameId = await resolveGameId(knex, gameCode);
  const save = await knex("game_saves")
    .where({ game_id: gameId, user_id: currentUserId })
    .orderBy("saved_at", "desc")
    .first();

  return save
    ? {
        saveId: save.save_id,
        boardState: save.board_state,
        gameState: save.game_state,
        score: save.score,
        elapsedSeconds: save.elapsed_seconds,
        remainingSeconds: save.remaining_seconds,
        savedAt: save.saved_at
      }
    : null;
}

export async function saveGame(gameCode, currentUserId, payload) {
  const knex = ensureDb();
  const gameId = await resolveGameId(knex, gameCode);
  const existing = await knex("game_saves")
    .where({ game_id: gameId, user_id: currentUserId })
    .first();

  const patch = {
    board_state: payload.boardState || {},
    game_state: payload.gameState || {},
    score: Number(payload.score || 0),
    elapsed_seconds: Number(payload.elapsedSeconds || 0),
    remaining_seconds: payload.remainingSeconds ?? null,
    updated_at: knex.fn.now()
  };

  if (existing) {
    await knex("game_saves")
      .where({ save_id: existing.save_id })
      .update(patch);
  } else {
    await knex("game_saves").insert({
      game_id: gameId,
      user_id: currentUserId,
      save_name: "Auto Save",
      saved_at: knex.fn.now(),
      ...patch
    });
  }

  await syncAchievements(knex, {
    gameId,
    userId: currentUserId,
    boardState: payload.boardState || {},
    finalScore: Number(payload.score || 0)
  });

  return getSavedGame(gameCode, currentUserId);
}

export async function submitGameResult(gameCode, currentUserId, payload) {
  const knex = ensureDb();
  const game = await knex("games")
    .where({ code: gameCode })
    .first("game_id", "default_timer_seconds");

  if (!game) {
    throw createError(404, "Game not found");
  }

  const allowedOutcomes = ["win", "lose", "draw", "timeout", "abandoned"];
  if (!allowedOutcomes.includes(payload.outcome)) {
    throw createError(400, "Invalid outcome");
  }

  const finalScore = Number(payload.finalScore || 0);
  const durationSeconds =
    payload.durationSeconds === undefined || payload.durationSeconds === null
      ? null
      : Number(payload.durationSeconds);
  const movesCount =
    payload.movesCount === undefined || payload.movesCount === null
      ? null
      : Number(payload.movesCount);

  if (Number.isNaN(finalScore)) {
    throw createError(400, "finalScore must be numeric");
  }

  if (durationSeconds !== null && Number.isNaN(durationSeconds)) {
    throw createError(400, "durationSeconds must be numeric");
  }

  if (movesCount !== null && Number.isNaN(movesCount)) {
    throw createError(400, "movesCount must be numeric");
  }

  const result = await knex.transaction(async (trx) => {
    const [session] = await trx("game_sessions")
      .insert({
        game_id: game.game_id,
        user_id: currentUserId,
        status: payload.outcome === "abandoned" ? "abandoned" : "completed",
        board_state: payload.boardState || {},
        game_state: payload.gameState || {},
        current_score: finalScore,
        timer_mode: "countdown",
        time_limit_seconds: Number(payload.timeLimitSeconds || game.default_timer_seconds || 0),
        elapsed_seconds: durationSeconds || 0,
        remaining_seconds: payload.remainingSeconds ?? null,
        current_turn: payload.currentTurn || null,
        started_at: trx.fn.now(),
        ended_at: trx.fn.now(),
        last_action_at: trx.fn.now(),
        updated_at: trx.fn.now()
      })
      .returning(["session_id"]);

    const [gameResult] = await trx("game_results")
      .insert({
        session_id: session.session_id,
        game_id: game.game_id,
        user_id: currentUserId,
        opponent_type: payload.opponentType || "computer",
        outcome: payload.outcome,
        final_score: finalScore,
        moves_count: movesCount,
        duration_seconds: durationSeconds,
        ranking_eligible: payload.rankingEligible ?? true,
        metadata: payload.metadata || {}
      })
      .returning(["result_id", "completed_at"]);

    await syncAchievements(trx, {
      gameId: game.game_id,
      userId: currentUserId,
      outcome: payload.outcome,
      boardState: payload.boardState || {},
      finalScore
    });

    return {
      resultId: gameResult.result_id,
      sessionId: session.session_id,
      outcome: payload.outcome,
      finalScore,
      completedAt: gameResult.completed_at
    };
  });

  return result;
}
