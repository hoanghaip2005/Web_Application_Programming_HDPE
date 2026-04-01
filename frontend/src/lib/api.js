const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "/api" : "http://localhost:4000/api");
const API_KEY = import.meta.env.VITE_API_KEY || "hdpe-local-api-key";
const DOCS_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

function isPlainObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function sanitizeForJson(value, seen = new WeakSet(), depth = 0) {
  if (value === null || value === undefined) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (depth >= 8) {
    return "[MaxDepth]";
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  if (Array.isArray(value)) {
    seen.add(value);
    const result = value
      .map((item) => sanitizeForJson(item, seen, depth + 1))
      .filter((item) => item !== undefined);
    seen.delete(value);
    return result;
  }

  if (!isPlainObject(value)) {
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message
      };
    }

    const constructorName = value.constructor?.name || "Object";
    return `[${constructorName}]`;
  }

  seen.add(value);
  const result = {};

  Object.entries(value).forEach(([key, nestedValue]) => {
    const sanitizedValue = sanitizeForJson(nestedValue, seen, depth + 1);
    if (sanitizedValue !== undefined) {
      result[key] = sanitizedValue;
    }
  });

  seen.delete(value);
  return result;
}

async function request(path, options = {}) {
  const { token, body, headers, ...restOptions } = options;
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      },
      ...restOptions,
      body: body === undefined ? undefined : JSON.stringify(sanitizeForJson(body))
    });
  } catch (error) {
    const networkError = new Error("Network request failed");
    networkError.cause = error;
    throw networkError;
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const requestError = new Error(payload?.message || "Request failed");
    requestError.status = response.status;
    requestError.details = payload?.details || null;
    throw requestError;
  }

  return payload;
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export const api = {
  baseUrl: API_BASE_URL,
  docsUrl: (token) =>
    `${DOCS_BASE_URL}/api-docs?${new URLSearchParams({
      token,
      apiKey: API_KEY
    }).toString()}`,
  health: () => request("/health"),
  register: (body) => request("/auth/register", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  me: (token) => request("/auth/me", { token }),
  listGames: () => request("/games"),
  getGame: (gameCode) => request(`/games/${gameCode}`),
  getProfile: (token) => request("/profile/me", { token }),
  updateProfile: (token, body) => request("/profile/me", { method: "PUT", token, body }),
  uploadProfileAvatar: (token, body) =>
    request("/profile/avatar", { method: "POST", token, body }),
  searchUsers: (query, token) =>
    request(`/users/search?q=${encodeURIComponent(query)}`, { token }),
  listFriends: (token) => request("/friends", { token }),
  listFriendRequests: (token) => request("/friends/requests", { token }),
  sendFriendRequest: (token, targetUserId) =>
    request("/friends/requests", {
      method: "POST",
      token,
      body: { targetUserId }
    }),
  updateFriendRequest: (token, friendshipId, action) =>
    request(`/friends/requests/${friendshipId}`, {
      method: "PATCH",
      token,
      body: { action }
    }),
  removeFriendship: (token, friendshipId) =>
    request(`/friends/${friendshipId}`, { method: "DELETE", token }),
  listConversations: (token) => request("/messages/conversations", { token }),
  getConversation: (token, conversationId) =>
    request(`/messages/conversations/${conversationId}`, { token }),
  createDirectConversation: (token, friendUserId) =>
    request("/messages/conversations/direct", {
      method: "POST",
      token,
      body: { friendUserId }
    }),
  sendMessage: (token, conversationId, messageBody) =>
    request(`/messages/conversations/${conversationId}`, {
      method: "POST",
      token,
      body: { messageBody }
    }),
  getAchievements: () => request("/achievements"),
  getMyAchievements: (token) => request("/achievements/me", { token }),
  getRanking: (gameCode, scope = "global", token) =>
    request(`/ranking/${gameCode}?scope=${scope}`, { token }),
  getGameReviews: (gameCode) => request(`/games/${gameCode}/reviews`),
  postGameReview: (token, gameCode, body) =>
    request(`/games/${gameCode}/reviews`, { method: "POST", token, body }),
  getGameSave: (token, gameCode) => request(`/games/${gameCode}/save`, { token }),
  postGameSave: (token, gameCode, body) =>
    request(`/games/${gameCode}/save`, { method: "POST", token, body }),
  submitGameResult: (token, gameCode, body) =>
    request(`/games/${gameCode}/results`, { method: "POST", token, body }),
  getAdminOverview: (token) => request("/admin/statistics/overview", { token }),
  getAdminGameStatistics: (token) => request("/admin/statistics/games", { token }),
  getAdminUserStatistics: (token) => request("/admin/statistics/users", { token }),
  getAdminAchievements: (token, params = {}) =>
    request(`/admin/achievements${buildQueryString(params)}`, { token }),
  postAdminAchievement: (token, body) =>
    request("/admin/achievements", { method: "POST", token, body }),
  getAdminUsers: (token, params = {}) =>
    request(`/admin/users${buildQueryString(params)}`, { token }),
  getAdminUserDetail: (token, userId) => request(`/admin/users/${userId}`, { token }),
  patchAdminAchievement: (token, achievementId, body) =>
    request(`/admin/achievements/${achievementId}`, { method: "PATCH", token, body }),
  patchAdminUser: (token, userId, body) =>
    request(`/admin/users/${userId}`, { method: "PATCH", token, body }),
  getAdminGames: (token) => request("/admin/games", { token }),
  patchAdminGame: (token, gameCode, body) =>
    request(`/admin/games/${gameCode}`, { method: "PATCH", token, body })
};
