import { Buffer } from "node:buffer";
import https from "node:https";
import path from "node:path";
import { ensureDb } from "../../config/db.js";
import { env } from "../../config/env.js";
import { createError } from "../../utils/http.js";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function normalizeSupabaseUrl() {
  return env.supabaseUrl.replace(/\/$/, "");
}

function ensureStorageConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.supabaseStorageBucket) {
    throw createError(
      503,
      "Supabase Storage chưa được cấu hình. Cần SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY và SUPABASE_STORAGE_BUCKET."
    );
  }
}

function sanitizeBase64(base64Data) {
  return String(base64Data || "").replace(/^data:[^;]+;base64,/, "").trim();
}

function getFileExtension(fileName, contentType) {
  const fromName = path.extname(fileName || "").replace(".", "").toLowerCase();
  if (fromName) {
    return fromName;
  }

  if (contentType === "image/jpeg") {
    return "jpg";
  }

  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  if (contentType === "image/gif") {
    return "gif";
  }

  return "png";
}

function uploadToSupabaseStorage(uploadUrl, contentType, bodyBuffer) {
  return new Promise((resolve, reject) => {
    const target = new URL(uploadUrl);
    const request = https.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        family: 4,
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
          apikey: env.supabaseServiceRoleKey,
          "Content-Type": contentType,
          "Content-Length": bodyBuffer.length,
          "x-upsert": "true"
        }
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode || 500,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error("storage-request-timeout"));
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(bodyBuffer);
    request.end();
  });
}

function buildProfilePatch(knex, payload = {}) {
  return {
    display_name: typeof payload.displayName === "string" ? payload.displayName.trim() || null : null,
    bio: typeof payload.bio === "string" ? payload.bio.trim() || null : null,
    city: typeof payload.city === "string" ? payload.city.trim() || null : null,
    updated_at: knex.fn.now()
  };
}

function mapProfileRow(row) {
  return {
    userId: row.user_id,
    email: row.email,
    username: row.username,
    role: row.role_code,
    status: row.status,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    city: row.city
  };
}

async function fetchProfileRow(knex, userId) {
  const row = await knex("users")
    .leftJoin("user_profiles", "user_profiles.user_id", "users.user_id")
    .join("roles", "roles.role_id", "users.role_id")
    .select(
      "users.user_id",
      "users.email",
      "users.username",
      "users.status",
      "roles.code as role_code",
      "user_profiles.user_id as profile_user_id",
      "user_profiles.display_name",
      "user_profiles.avatar_url",
      "user_profiles.bio",
      "user_profiles.city"
    )
    .where("users.user_id", userId)
    .first();

  if (!row) {
    throw createError(404, "Profile not found");
  }

  return row;
}

export async function getProfile(userId) {
  const knex = ensureDb();
  const row = await fetchProfileRow(knex, userId);
  return mapProfileRow(row);
}

export async function updateProfile(userId, payload) {
  const knex = ensureDb();
  const current = await fetchProfileRow(knex, userId);
  const patch = buildProfilePatch(knex, payload);

  if (!current.profile_user_id) {
    await knex("user_profiles").insert({
      user_id: userId,
      ...patch,
      created_at: knex.fn.now()
    });
  } else {
    await knex("user_profiles").where({ user_id: userId }).update(patch);
  }

  return mapProfileRow({
    ...current,
    profile_user_id: userId,
    display_name: patch.display_name,
    bio: patch.bio,
    city: patch.city
  });
}

export async function uploadProfileAvatar(userId, payload) {
  ensureStorageConfig();

  const fileName = String(payload?.fileName || "").trim();
  const contentType = String(payload?.contentType || "").trim();
  const base64Data = sanitizeBase64(payload?.base64Data);

  if (!fileName || !contentType || !base64Data) {
    throw createError(400, "Thiếu dữ liệu ảnh tải lên.");
  }

  if (!contentType.startsWith("image/")) {
    throw createError(400, "Chỉ chấp nhận file ảnh.");
  }

  const buffer = Buffer.from(base64Data, "base64");

  if (!buffer.length) {
    throw createError(400, "Dữ liệu ảnh không hợp lệ.");
  }

  if (buffer.length > MAX_AVATAR_BYTES) {
    throw createError(413, "Ảnh vượt quá dung lượng 5MB.");
  }

  const extension = getFileExtension(fileName, contentType);
  const objectPath = `profiles/${userId}/avatar-${Date.now()}.${extension}`;
  const uploadUrl = `${normalizeSupabaseUrl()}/storage/v1/object/${env.supabaseStorageBucket}/${objectPath}`;
  let uploadResult;

  try {
    uploadResult = await uploadToSupabaseStorage(uploadUrl, contentType, buffer);
  } catch (error) {
    throw createError(502, "Không thể tải ảnh đại diện lên Supabase.", {
      code: error.code || null,
      message: error.message,
      syscall: error.syscall || null,
      hostname: error.hostname || null
    });
  }

  if (uploadResult.statusCode < 200 || uploadResult.statusCode >= 300) {
    throw createError(502, "Không thể tải ảnh đại diện lên Supabase.", uploadResult.body);
  }

  const avatarUrl = `${normalizeSupabaseUrl()}/storage/v1/object/public/${env.supabaseStorageBucket}/${objectPath}`;
  const knex = ensureDb();
  const current = await fetchProfileRow(knex, userId);
  const patch = {
    avatar_url: avatarUrl,
    updated_at: knex.fn.now()
  };

  if (!current.profile_user_id) {
    await knex("user_profiles").insert({
      user_id: userId,
      display_name: current.display_name ?? null,
      bio: current.bio ?? null,
      city: current.city ?? null,
      ...patch,
      created_at: knex.fn.now()
    });
  } else {
    await knex("user_profiles").where({ user_id: userId }).update(patch);
  }

  return mapProfileRow({
    ...current,
    profile_user_id: userId,
    avatar_url: avatarUrl
  });
}
