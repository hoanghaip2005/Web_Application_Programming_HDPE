import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, ensureDb } from "../../config/db.js";
import { env } from "../../config/env.js";
import { createError } from "../../utils/http.js";

function normalizeUser(row) {
  return {
    userId: row.user_id,
    email: row.email,
    username: row.username,
    role: row.role_code,
    status: row.status
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.userId,
      role: user.role,
      username: user.username
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

function normalizeCredential(value) {
  return String(value || "").trim();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(username);
}

function validatePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(password);
}

export async function registerUser(payload) {
  const knex = ensureDb();
  const username = normalizeCredential(payload?.username);
  const email = normalizeCredential(payload?.email).toLowerCase();
  const password = String(payload?.password || "");

  if (!username || !email || !password) {
    throw createError(400, "username, email and password are required");
  }

  if (!validateUsername(username)) {
    throw createError(
      400,
      "username must be 3-24 characters and contain only letters, numbers or underscore"
    );
  }

  if (!validateEmail(email)) {
    throw createError(400, "email is invalid");
  }

  if (!validatePassword(password)) {
    throw createError(
      400,
      "password must be 8-64 characters and include at least one letter and one number"
    );
  }

  const existing = await knex("users")
    .whereRaw("lower(email) = lower(?)", [email])
    .orWhereRaw("lower(username) = lower(?)", [username])
    .first();

  if (existing) {
    throw createError(409, "Email or username already exists");
  }

  const role = await knex("roles").where({ code: "user" }).first();
  if (!role) {
    throw createError(500, "Default role 'user' is missing. Run seeds first.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await knex("users")
    .insert({
      role_id: role.role_id,
      email,
      username,
      password_hash: passwordHash,
      status: "active",
      theme_preference: "light"
    })
    .returning(["user_id", "email", "username", "status"]);

  await knex("user_profiles").insert({
    user_id: user.user_id,
    display_name: username
  });

  const normalizedUser = {
    userId: user.user_id,
    email: user.email,
    username: user.username,
    role: "user",
    status: user.status
  };

  return {
    token: signToken(normalizedUser),
    user: normalizedUser
  };
}

export async function loginUser(payload) {
  const knex = ensureDb();
  const identifier = normalizeCredential(payload?.email || payload?.username);
  const password = String(payload?.password || "");

  if (!identifier || !password) {
    throw createError(400, "email or username and password are required");
  }

  const normalizedIdentifier = identifier.toLowerCase();
  const user = await knex("users")
    .join("roles", "roles.role_id", "users.role_id")
    .select(
      "users.user_id",
      "users.email",
      "users.username",
      "users.password_hash",
      "users.status",
      "roles.code as role_code"
    )
    .where((builder) => {
      builder
        .whereRaw("lower(users.email) = ?", [normalizedIdentifier])
        .orWhereRaw("lower(users.username) = ?", [normalizedIdentifier]);
    })
    .first();

  if (!user) {
    throw createError(401, "Invalid credentials");
  }

  if (user.status !== "active") {
    throw createError(403, "This account is disabled");
  }

  const matched = await bcrypt.compare(password, user.password_hash);
  if (!matched) {
    throw createError(401, "Invalid credentials");
  }

  const normalizedUser = normalizeUser(user);
  return {
    token: signToken(normalizedUser),
    user: normalizedUser
  };
}

export async function getCurrentUser(userId) {
  const knex = ensureDb();
  const row = await knex("users")
    .join("roles", "roles.role_id", "users.role_id")
    .select(
      "users.user_id",
      "users.email",
      "users.username",
      "users.status",
      "roles.code as role_code"
    )
    .where("users.user_id", userId)
    .first();

  if (!row) {
    throw createError(404, "User not found");
  }

  return normalizeUser(row);
}

export function isDatabaseReady() {
  return Boolean(db);
}
