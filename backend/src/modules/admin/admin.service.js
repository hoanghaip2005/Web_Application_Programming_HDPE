import { db, ensureDb } from "../../config/db.js";
import { env } from "../../config/env.js";
import { createError } from "../../utils/http.js";
import { fallbackGames } from "../games/game-data.js";
import { invalidateGamesCache } from "../games/games.service.js";

const STATUS_OPTIONS = new Set(["active", "disabled"]);
const ROLE_OPTIONS = new Set(["user", "admin"]);
const ACHIEVEMENT_STATUS_OPTIONS = new Set(["active", "inactive"]);
const ACHIEVEMENT_CONDITION_TYPES = new Set(["wins", "score", "colored_cells"]);
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;
const GAME_CONFIG_RULES = {
  tictactoe: {
    rows: { min: 3, max: 3 },
    cols: { min: 3, max: 3 }
  },
  caro4: {
    rows: { min: 4, max: 19 },
    cols: { min: 4, max: 19 }
  },
  caro5: {
    rows: { min: 5, max: 19 },
    cols: { min: 5, max: 19 }
  },
  snake: {
    rows: { min: 8, max: 19 },
    cols: { min: 8, max: 19 }
  },
  match3: {
    rows: { min: 6, max: 19 },
    cols: { min: 6, max: 19 }
  },
  memory: {
    rows: { min: 2, max: 6 },
    cols: { min: 2, max: 6 },
    requireEvenCells: true
  },
  "free-draw": {
    rows: { min: 4, max: 15 },
    cols: { min: 4, max: 15 }
  }
};

function parsePositiveInt(value, fallback, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number.parseInt(String(value || ""), 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function normalizeManagedGame(row) {
  return {
    code: row.code,
    name: row.name,
    description: row.description,
    isEnabled: row.is_enabled,
    defaultBoardRows: row.default_board_rows,
    defaultBoardCols: row.default_board_cols,
    defaultTimerSeconds: row.default_timer_seconds
  };
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

function getConditionValue(conditionType, conditionConfig) {
  const config = normalizeConditionConfig(conditionConfig);

  if (conditionType === "wins") {
    return Number(config.wins || 0);
  }

  if (conditionType === "score") {
    return Number(config.minScore ?? config.score ?? 0);
  }

  if (conditionType === "colored_cells") {
    return Number(config.coloredCells || 0);
  }

  return 0;
}

function buildConditionConfig(conditionType, currentConfig, conditionValue) {
  const config = normalizeConditionConfig(currentConfig);
  const normalizedValue = Number(conditionValue);

  if (conditionType === "wins") {
    return {
      ...config,
      wins: normalizedValue
    };
  }

  if (conditionType === "score") {
    return {
      ...config,
      minScore: normalizedValue
    };
  }

  if (conditionType === "colored_cells") {
    return {
      ...config,
      coloredCells: normalizedValue
    };
  }

  return config;
}

function sanitizeAchievementCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getConditionLabel(conditionType) {
  if (conditionType === "wins") {
    return "Số trận thắng";
  }

  if (conditionType === "score") {
    return "Mốc điểm";
  }

  if (conditionType === "colored_cells") {
    return "Số ô đã tô";
  }

  return "Điều kiện";
}

function normalizeManagedAchievement(row) {
  return {
    achievementId: row.achievement_id,
    gameId: row.game_id,
    gameCode: row.game_code,
    gameName: row.game_name || "Toàn hệ thống",
    code: row.code,
    name: row.name,
    description: row.description,
    points: row.points,
    conditionType: row.condition_type,
    conditionLabel: getConditionLabel(row.condition_type),
    conditionValue: getConditionValue(row.condition_type, row.condition_config),
    isActive: row.is_active,
    unlockedUsers: Number(row.unlockedusers || row.unlockedUsers || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeListUser(row) {
  return {
    userId: row.user_id,
    email: row.email,
    username: row.username,
    status: row.status,
    role: row.role,
    displayName: row.display_name,
    city: row.city,
    createdAt: row.created_at
  };
}

function normalizeGameConfigPatch(payload = {}) {
  const patch = {};

  if (typeof payload.isEnabled === "boolean") {
    patch.is_enabled = payload.isEnabled;
  }

  if (payload.defaultBoardRows !== undefined) {
    patch.default_board_rows = Number(payload.defaultBoardRows);
  }

  if (payload.defaultBoardCols !== undefined) {
    patch.default_board_cols = Number(payload.defaultBoardCols);
  }

  if (payload.defaultTimerSeconds !== undefined) {
    patch.default_timer_seconds = Number(payload.defaultTimerSeconds);
  }

  return patch;
}

function buildGameAuditPatch(patch) {
  const auditPatch = {
    updatedAt: new Date().toISOString()
  };

  if (patch.is_enabled !== undefined) {
    auditPatch.isEnabled = patch.is_enabled;
  }

  if (patch.default_board_rows !== undefined) {
    auditPatch.defaultBoardRows = patch.default_board_rows;
  }

  if (patch.default_board_cols !== undefined) {
    auditPatch.defaultBoardCols = patch.default_board_cols;
  }

  if (patch.default_timer_seconds !== undefined) {
    auditPatch.defaultTimerSeconds = patch.default_timer_seconds;
  }

  return auditPatch;
}

function sanitizeUserAuditSnapshot(user = {}) {
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function validateGameConfigPatch(game, patch) {
  const numericFields = [
    ["default_board_rows", patch.default_board_rows],
    ["default_board_cols", patch.default_board_cols],
    ["default_timer_seconds", patch.default_timer_seconds]
  ];

  numericFields.forEach(([, value]) => {
    if (value !== undefined && (!Number.isInteger(value) || value <= 0)) {
      throw createError(400, "Board size and timer must be positive integers");
    }
  });

  if (patch.default_board_rows !== undefined && patch.default_board_rows > 30) {
    throw createError(400, "defaultBoardRows must be <= 30");
  }

  if (patch.default_board_cols !== undefined && patch.default_board_cols > 30) {
    throw createError(400, "defaultBoardCols must be <= 30");
  }

  if (patch.default_timer_seconds !== undefined && patch.default_timer_seconds > 7200) {
    throw createError(400, "defaultTimerSeconds must be <= 7200");
  }

  const nextRows = patch.default_board_rows ?? Number(game.default_board_rows);
  const nextCols = patch.default_board_cols ?? Number(game.default_board_cols);
  const rule = GAME_CONFIG_RULES[game.code];

  if (!rule) {
    return;
  }

  if (nextRows < rule.rows.min || nextRows > rule.rows.max) {
    if (rule.rows.min === rule.rows.max) {
      throw createError(400, `${game.code} requires rows to stay at ${rule.rows.min}`);
    }

    throw createError(
      400,
      `${game.code} requires rows between ${rule.rows.min} and ${rule.rows.max}`
    );
  }

  if (nextCols < rule.cols.min || nextCols > rule.cols.max) {
    if (rule.cols.min === rule.cols.max) {
      throw createError(400, `${game.code} requires cols to stay at ${rule.cols.min}`);
    }

    throw createError(
      400,
      `${game.code} requires cols between ${rule.cols.min} and ${rule.cols.max}`
    );
  }

  if (rule.requireEvenCells && (nextRows * nextCols) % 2 !== 0) {
    throw createError(400, "memory requires an even number of total cells");
  }
}

function validateManagedAchievementPatch(patch, currentAchievement) {
  if (
    patch.name === undefined &&
    patch.description === undefined &&
    patch.points === undefined &&
    patch.is_active === undefined &&
    patch.condition_config === undefined
  ) {
    throw createError(400, "No valid achievement fields were provided");
  }

  if (patch.name !== undefined) {
    if (!patch.name || patch.name.length > 150) {
      throw createError(400, "name must be 1-150 characters");
    }
  }

  if (patch.description !== undefined) {
    if (!patch.description || patch.description.length > 500) {
      throw createError(400, "description must be 1-500 characters");
    }
  }

  if (patch.points !== undefined) {
    if (!Number.isInteger(patch.points) || patch.points < 0 || patch.points > 1000) {
      throw createError(400, "points must be an integer between 0 and 1000");
    }
  }

  if (patch.condition_config !== undefined) {
    if (!ACHIEVEMENT_CONDITION_TYPES.has(currentAchievement.condition_type)) {
      throw createError(400, "conditionType is not supported for updates");
    }

    const nextValue = getConditionValue(currentAchievement.condition_type, patch.condition_config);
    if (!Number.isInteger(nextValue) || nextValue <= 0 || nextValue > 100000) {
      throw createError(400, "conditionValue must be a positive integer <= 100000");
    }
  }
}

function buildUsersQuery(knex, filters = {}) {
  const query = knex("users")
    .join("roles", "roles.role_id", "users.role_id")
    .leftJoin("user_profiles", "user_profiles.user_id", "users.user_id");

  if (filters.query) {
    query.andWhere((builder) => {
      builder
        .whereILike("users.username", `%${filters.query}%`)
        .orWhereILike("users.email", `%${filters.query}%`)
        .orWhereILike("user_profiles.display_name", `%${filters.query}%`);
    });
  }

  if (filters.status) {
    query.andWhere("users.status", filters.status);
  }

  if (filters.role) {
    query.andWhere("roles.code", filters.role);
  }

  return query;
}

function buildAchievementsQuery(knex, filters = {}) {
  const query = knex("achievements")
    .leftJoin("games", "games.game_id", "achievements.game_id")
    .leftJoin("user_achievements", "user_achievements.achievement_id", "achievements.achievement_id");

  if (filters.query) {
    query.andWhere((builder) => {
      builder
        .whereILike("achievements.name", `%${filters.query}%`)
        .orWhereILike("achievements.code", `%${filters.query}%`)
        .orWhereILike("achievements.description", `%${filters.query}%`);
    });
  }

  if (filters.status === "active") {
    query.andWhere("achievements.is_active", true);
  }

  if (filters.status === "inactive") {
    query.andWhere("achievements.is_active", false);
  }

  if (filters.gameCode) {
    query.andWhere("games.code", filters.gameCode);
  }

  return query;
}

export async function getOverview() {
  if (!db) {
    return {
      totalUsers: 0,
      totalGames: fallbackGames.length,
      totalResults: 0,
      activeUsers: 0,
      disabledUsers: 0,
      topGame: null,
      httpsReady: false,
      databaseConnected: false
    };
  }

  const [userCount] = await db("users").count({ total: "user_id" });
  const [activeUserCount] = await db("users").where({ status: "active" }).count({ total: "user_id" });
  const [disabledUserCount] = await db("users")
    .where({ status: "disabled" })
    .count({ total: "user_id" });
  const [gameCount] = await db("games").count({ total: "game_id" });
  const [resultCount] = await db("game_results").count({ total: "result_id" });
  const topGame = await db("games")
    .leftJoin("game_results", "game_results.game_id", "games.game_id")
    .groupBy("games.game_id", "games.name")
    .select("games.name")
    .count({ totalResults: "game_results.result_id" })
    .orderBy("totalResults", "desc")
    .orderBy("games.name", "asc")
    .first();

  return {
    totalUsers: Number(userCount.total || 0),
    activeUsers: Number(activeUserCount.total || 0),
    disabledUsers: Number(disabledUserCount.total || 0),
    totalGames: Number(gameCount.total || 0),
    totalResults: Number(resultCount.total || 0),
    topGame: topGame
      ? {
          name: topGame.name,
          totalResults: Number(topGame.totalresults || topGame.totalResults || 0)
        }
      : null,
    httpsReady:
      env.httpsEnabled ||
      env.frontendOrigin.startsWith("https://") || env.appBaseUrl.startsWith("https://"),
    databaseConnected: true
  };
}

export async function listManagedAchievements(params = {}) {
  const knex = ensureDb();
  const filters = {
    query: String(params.query || "").trim(),
    status: ACHIEVEMENT_STATUS_OPTIONS.has(params.status) ? params.status : "",
    gameCode: String(params.gameCode || "").trim()
  };

  const rows = await buildAchievementsQuery(knex, filters)
    .groupBy("achievements.achievement_id", "games.game_id")
    .select(
      "achievements.achievement_id",
      "achievements.game_id",
      "games.code as game_code",
      "games.name as game_name",
      "achievements.code",
      "achievements.name",
      "achievements.description",
      "achievements.points",
      "achievements.condition_type",
      "achievements.condition_config",
      "achievements.is_active",
      "achievements.created_at",
      "achievements.updated_at"
    )
    .countDistinct({ unlockedUsers: "user_achievements.user_id" })
    .orderBy("achievements.is_active", "desc")
    .orderBy("achievements.points", "desc")
    .orderBy("achievements.name", "asc");

  return {
    items: rows.map(normalizeManagedAchievement),
    filters
  };
}

export async function listUsers(params = {}) {
  if (!db) {
    return {
      items: [],
      pagination: {
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        totalItems: 0,
        totalPages: 0
      }
    };
  }

  const filters = {
    query: String(params.query || "").trim(),
    status: STATUS_OPTIONS.has(params.status) ? params.status : "",
    role: ROLE_OPTIONS.has(params.role) ? params.role : ""
  };
  const page = parsePositiveInt(params.page, DEFAULT_PAGE);
  const pageSize = parsePositiveInt(params.pageSize, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const offset = (page - 1) * pageSize;

  const baseQuery = buildUsersQuery(db, filters);
  const [{ total }] = await baseQuery.clone().countDistinct({ total: "users.user_id" });
  const totalItems = Number(total || 0);
  const rows = await baseQuery
    .clone()
    .select(
      "users.user_id",
      "users.email",
      "users.username",
      "users.status",
      "users.created_at",
      "roles.code as role",
      "user_profiles.display_name",
      "user_profiles.city"
    )
    .orderBy("users.created_at", "desc")
    .offset(offset)
    .limit(pageSize);

  return {
    items: rows.map(normalizeListUser),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: totalItems ? Math.ceil(totalItems / pageSize) : 0
    },
    filters
  };
}

export async function getManagedUserDetail(userId) {
  const knex = ensureDb();
  const user = await knex("users")
    .join("roles", "roles.role_id", "users.role_id")
    .leftJoin("user_profiles", "user_profiles.user_id", "users.user_id")
    .select(
      "users.user_id",
      "users.email",
      "users.username",
      "users.status",
      "users.created_at",
      "users.updated_at",
      "roles.code as role",
      "user_profiles.display_name",
      "user_profiles.bio",
      "user_profiles.city",
      "user_profiles.avatar_url"
    )
    .where("users.user_id", userId)
    .first();

  if (!user) {
    throw createError(404, "User not found");
  }

  const [friendCount] = await knex("friendships")
    .where((builder) => {
      builder.where("requester_id", userId).orWhere("addressee_id", userId);
    })
    .andWhere("status", "accepted")
    .count({ total: "friendship_id" });
  const [conversationCount] = await knex("conversation_members")
    .where({ user_id: userId })
    .count({ total: "conversation_id" });
  const [resultCount] = await knex("game_results").where({ user_id: userId }).count({ total: "result_id" });
  const [ratingCount] = await knex("game_ratings").where({ user_id: userId }).count({ total: "rating_id" });
  const [achievementCount] = await knex("user_achievements")
    .where({ user_id: userId })
    .count({ total: "achievement_id" });

  return {
    userId: user.user_id,
    email: user.email,
    username: user.username,
    status: user.status,
    role: user.role,
    displayName: user.display_name,
    bio: user.bio,
    city: user.city,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    metrics: {
      totalFriends: Number(friendCount.total || 0),
      totalConversations: Number(conversationCount.total || 0),
      totalResults: Number(resultCount.total || 0),
      totalRatings: Number(ratingCount.total || 0),
      totalAchievements: Number(achievementCount.total || 0)
    }
  };
}

export async function listManagedGames() {
  if (!db) {
    return fallbackGames;
  }

  const rows = await db("games")
    .select(
      "code",
      "name",
      "description",
      "is_enabled",
      "default_board_rows",
      "default_board_cols",
      "default_timer_seconds"
    )
    .orderBy("display_order", "asc");

  return rows.map(normalizeManagedGame);
}

export async function listGameStatistics() {
  if (!db) {
    return [];
  }

  const resultsSubquery = db("game_results")
    .select("game_id")
    .count({ totalResults: "result_id" })
    .countDistinct({ totalPlayers: "user_id" })
    .groupBy("game_id")
    .as("result_stats");

  const ratingsSubquery = db("game_ratings")
    .select("game_id")
    .count({ totalRatings: "rating_id" })
    .avg({ averageRating: "rating_value" })
    .groupBy("game_id")
    .as("rating_stats");

  const commentsSubquery = db("game_comments")
    .select("game_id")
    .count({ totalComments: "comment_id" })
    .groupBy("game_id")
    .as("comment_stats");

  const rows = await db("games")
    .leftJoin(resultsSubquery, "result_stats.game_id", "games.game_id")
    .leftJoin(ratingsSubquery, "rating_stats.game_id", "games.game_id")
    .leftJoin(commentsSubquery, "comment_stats.game_id", "games.game_id")
    .select(
      "games.code",
      "games.name",
      "result_stats.totalResults",
      "result_stats.totalPlayers",
      "rating_stats.totalRatings",
      "rating_stats.averageRating",
      "comment_stats.totalComments"
    )
    .orderBy("games.name", "asc");

  return rows.map((row) => ({
    code: row.code,
    name: row.name,
    totalResults: Number(row.totalresults || row.totalResults || 0),
    totalRatings: Number(row.totalratings || row.totalRatings || 0),
    totalComments: Number(row.totalcomments || row.totalComments || 0),
    totalPlayers: Number(row.totalplayers || row.totalPlayers || 0),
    averageRating: Number(row.averagerating || row.averageRating || 0)
  }));
}

export async function listUserStatistics() {
  const knex = ensureDb();
  const byRoleRows = await knex("users")
    .join("roles", "roles.role_id", "users.role_id")
    .groupBy("roles.code")
    .select("roles.code")
    .count({ total: "users.user_id" })
    .orderBy("roles.code", "asc");
  const byStatusRows = await knex("users")
    .groupBy("status")
    .select("status")
    .count({ total: "user_id" })
    .orderBy("status", "asc");
  const recentRows = await knex("users")
    .join("roles", "roles.role_id", "users.role_id")
    .leftJoin("user_profiles", "user_profiles.user_id", "users.user_id")
    .select(
      "users.user_id",
      "users.username",
      "users.email",
      "users.status",
      "users.created_at",
      "roles.code as role",
      "user_profiles.display_name"
    )
    .orderBy("users.created_at", "desc")
    .limit(5);

  return {
    byRole: byRoleRows.map((row) => ({
      label: row.code,
      total: Number(row.total || 0)
    })),
    byStatus: byStatusRows.map((row) => ({
      label: row.status,
      total: Number(row.total || 0)
    })),
    recentUsers: recentRows.map((row) => ({
      userId: row.user_id,
      username: row.username,
      email: row.email,
      status: row.status,
      role: row.role,
      displayName: row.display_name,
      createdAt: row.created_at
    }))
  };
}

export async function updateManagedGame(gameCode, payload, adminUserId) {
  const knex = ensureDb();
  const game = await knex("games").where({ code: gameCode }).first();
  if (!game) {
    throw createError(404, "Game not found");
  }

  const normalizedPatch = normalizeGameConfigPatch(payload);
  const patch = {
    ...normalizedPatch,
    updated_at: knex.fn.now()
  };

  validateGameConfigPatch(game, patch);

  if (
    patch.default_board_rows === undefined &&
    patch.default_board_cols === undefined &&
    patch.default_timer_seconds === undefined &&
    patch.is_enabled === undefined
  ) {
    throw createError(400, "No valid game fields were provided");
  }

  await knex("games").where({ code: gameCode }).update(patch);
  await knex("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action: "update_game",
    entity_type: "game",
    entity_id: game.game_id,
    before_data: game,
    after_data: buildGameAuditPatch(normalizedPatch)
  });

  invalidateGamesCache();
  const rows = await listManagedGames();
  return rows.find((item) => item.code === gameCode) || null;
}

async function getManagedAchievementById(knex, achievementId) {
  const row = await knex("achievements")
    .leftJoin("games", "games.game_id", "achievements.game_id")
    .leftJoin("user_achievements", "user_achievements.achievement_id", "achievements.achievement_id")
    .where("achievements.achievement_id", achievementId)
    .groupBy("achievements.achievement_id", "games.game_id")
    .select(
      "achievements.achievement_id",
      "achievements.game_id",
      "games.code as game_code",
      "games.name as game_name",
      "achievements.code",
      "achievements.name",
      "achievements.description",
      "achievements.points",
      "achievements.condition_type",
      "achievements.condition_config",
      "achievements.is_active",
      "achievements.created_at",
      "achievements.updated_at"
    )
    .countDistinct({ unlockedUsers: "user_achievements.user_id" })
    .first();

  return row ? normalizeManagedAchievement(row) : null;
}

export async function createManagedAchievement(payload, adminUserId) {
  const knex = ensureDb();
  const gameCode = String(payload.gameCode || "").trim();
  const code = sanitizeAchievementCode(payload.code);
  const name = String(payload.name || "").trim();
  const description = String(payload.description || "").trim();
  const points = Number(payload.points);
  const conditionType = String(payload.conditionType || "").trim();
  const conditionValue = Number(payload.conditionValue);
  const isActive = payload.isActive !== false;

  if (!gameCode || !code || !name || !description || !conditionType) {
    throw createError(400, "gameCode, code, name, description and conditionType are required");
  }

  if (!/^[a-z0-9-]{3,100}$/.test(code)) {
    throw createError(400, "code must be 3-100 characters and contain lowercase letters, numbers or hyphen");
  }

  if (!ACHIEVEMENT_CONDITION_TYPES.has(conditionType)) {
    throw createError(400, "Invalid conditionType");
  }

  const draftPatch = {
    name,
    description,
    points,
    is_active: isActive,
    condition_config: buildConditionConfig(conditionType, {}, conditionValue)
  };

  validateManagedAchievementPatch(draftPatch, { condition_type: conditionType });

  const game = await knex("games").where({ code: gameCode }).first();
  if (!game) {
    throw createError(404, "Game not found");
  }

  const existing = await knex("achievements").where({ code }).first();
  if (existing) {
    throw createError(409, "Achievement code already exists");
  }

  const [created] = await knex("achievements")
    .insert({
      game_id: game.game_id,
      code,
      name,
      description,
      points,
      condition_type: conditionType,
      condition_config: draftPatch.condition_config,
      is_active: isActive
    })
    .returning(["achievement_id"]);

  await knex("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action: "create_achievement",
    entity_type: "achievement",
    entity_id: created.achievement_id,
    before_data: null,
    after_data: {
      gameCode,
      code,
      name,
      description,
      points,
      conditionType,
      conditionValue,
      isActive
    }
  });

  return getManagedAchievementById(knex, created.achievement_id);
}

export async function updateManagedAchievement(achievementId, payload, adminUserId) {
  const knex = ensureDb();
  const achievement = await knex("achievements").where({ achievement_id: achievementId }).first();

  if (!achievement) {
    throw createError(404, "Achievement not found");
  }

  const patch = {
    updated_at: knex.fn.now()
  };
  const auditPatch = {
    updatedAt: new Date().toISOString()
  };

  if (payload.name !== undefined) {
    patch.name = String(payload.name || "").trim();
    auditPatch.name = patch.name;
  }

  if (payload.description !== undefined) {
    patch.description = String(payload.description || "").trim();
    auditPatch.description = patch.description;
  }

  if (payload.points !== undefined) {
    patch.points = Number(payload.points);
    auditPatch.points = patch.points;
  }

  if (typeof payload.isActive === "boolean") {
    patch.is_active = payload.isActive;
    auditPatch.isActive = payload.isActive;
  }

  if (payload.conditionValue !== undefined) {
    patch.condition_config = buildConditionConfig(
      achievement.condition_type,
      achievement.condition_config,
      payload.conditionValue
    );
    auditPatch.conditionValue = getConditionValue(
      achievement.condition_type,
      patch.condition_config
    );
  }

  validateManagedAchievementPatch(patch, achievement);

  await knex("achievements").where({ achievement_id: achievementId }).update(patch);
  await knex("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action: "update_achievement",
    entity_type: "achievement",
    entity_id: achievement.achievement_id,
    before_data: achievement,
    after_data: auditPatch
  });

  return getManagedAchievementById(knex, achievementId);
}

export async function updateManagedUser(userId, payload, adminUserId) {
  const knex = ensureDb();
  const user = await knex("users").where({ user_id: userId }).first();
  if (!user) {
    throw createError(404, "User not found");
  }

  const patch = { updated_at: knex.fn.now() };
  const auditPatch = {
    updatedAt: new Date().toISOString()
  };

  if (payload.status) {
    if (!STATUS_OPTIONS.has(payload.status)) {
      throw createError(400, "Invalid user status");
    }

    if (Number(userId) === Number(adminUserId) && payload.status !== "active") {
      throw createError(400, "Admin cannot disable the current session owner");
    }

    patch.status = payload.status;
    auditPatch.status = payload.status;
  }

  if (payload.roleCode) {
    if (!ROLE_OPTIONS.has(payload.roleCode)) {
      throw createError(400, "Invalid role code");
    }

    if (Number(userId) === Number(adminUserId) && payload.roleCode !== "admin") {
      throw createError(400, "Admin cannot remove their own admin role");
    }

    const role = await knex("roles").where({ code: payload.roleCode }).first();
    if (!role) {
      throw createError(404, "Role not found");
    }
    patch.role_id = role.role_id;
    auditPatch.roleCode = payload.roleCode;
    auditPatch.roleId = role.role_id;
  }

  await knex("users").where({ user_id: userId }).update(patch);
  await knex("admin_audit_logs").insert({
    admin_user_id: adminUserId,
    action: "update_user",
    entity_type: "user",
    entity_id: user.user_id,
    before_data: sanitizeUserAuditSnapshot(user),
    after_data: auditPatch
  });

  return getManagedUserDetail(userId);
}
