import { env } from "../config/env.js";
import { createError } from "../utils/http.js";

export function requireApiKey(req, _res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return next(createError(401, "API key required"));
  }

  if (apiKey !== env.apiKey) {
    return next(createError(403, "Invalid API key"));
  }

  return next();
}
