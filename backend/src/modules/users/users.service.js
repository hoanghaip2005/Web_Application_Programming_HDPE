import { ensureDb } from "../../config/db.js";

export async function searchUsers(query, currentUserId) {
  const knex = ensureDb();
  const safeQuery = (query || "").trim();

  let usersQuery = knex("users")
    .leftJoin("user_profiles", "user_profiles.user_id", "users.user_id")
    .join("roles", "roles.role_id", "users.role_id")
    .select(
      "users.user_id",
      "users.email",
      "users.username",
      "roles.code as role",
      "user_profiles.display_name",
      "user_profiles.avatar_url"
    )
    .where("users.status", "active")
    .orderBy("users.username", "asc")
    .limit(20);

  if (currentUserId) {
    usersQuery = usersQuery.whereNot("users.user_id", currentUserId);
  }

  if (safeQuery) {
    usersQuery = usersQuery.andWhere((builder) => {
      builder
        .whereILike("users.username", `%${safeQuery}%`)
        .orWhereILike("user_profiles.display_name", `%${safeQuery}%`);
    });
  }

  const rows = await usersQuery;
  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    avatarUrl: row.avatar_url
  }));
}
