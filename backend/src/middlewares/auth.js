import jwt from "jsonwebtoken";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { createError } from "../utils/http.js";

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function loadCurrentAuth(payload) {
  if (!db) {
    return Promise.resolve(payload);
  }

  return db("users")
    .join("roles", "roles.role_id", "users.role_id")
    .select(
      "users.user_id",
      "users.username",
      "users.status",
      "roles.code as role_code"
    )
    .where("users.user_id", payload.sub)
    .first()
    .then((row) => {
      if (!row) {
        return null;
      }

      return {
        ...payload,
        sub: row.user_id,
        username: row.username,
        role: row.role_code,
        status: row.status
      };
    });
}

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(createError(401, "Authentication required"));
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verifyToken(token);

    loadCurrentAuth(payload)
      .then((auth) => {
        if (!auth) {
          return next(createError(401, "Session is no longer valid. Please sign in again"));
        }

        if (auth.status !== "active") {
          return next(createError(403, "This account is disabled"));
        }

        req.auth = auth;
        return next();
      })
      .catch(next);
    return;
  } catch {
    return next(createError(401, "Invalid token"));
  }
}

export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verifyToken(token);

    loadCurrentAuth(payload)
      .then((auth) => {
        req.auth = auth?.status === "active" ? auth : null;
        next();
      })
      .catch(next);
    return;
  } catch {
    req.auth = null;
  }

  return next();
}

export function requireAdmin(req, _res, next) {
  if (req.auth?.role !== "admin") {
    return next(createError(403, "Admin access required"));
  }

  return next();
}
