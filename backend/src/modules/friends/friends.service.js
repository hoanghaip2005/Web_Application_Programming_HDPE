import { ensureDb } from "../../config/db.js";
import { createError } from "../../utils/http.js";

function mapFriendship(row, currentUserId) {
  const isRequester = row.requester_id === currentUserId;
  return {
    friendshipId: row.friendship_id,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    isRequester,
    friend: {
      userId: isRequester ? row.addressee_id : row.requester_id,
      username: isRequester ? row.addressee_username : row.requester_username,
      displayName: isRequester ? row.addressee_display_name : row.requester_display_name,
      avatarUrl: isRequester ? row.addressee_avatar_url : row.requester_avatar_url
    }
  };
}

function baseFriendshipRows(knex, currentUserId) {
  return knex("friendships")
    .join("users as requester", "requester.user_id", "friendships.requester_id")
    .leftJoin(
      "user_profiles as requester_profile",
      "requester_profile.user_id",
      "requester.user_id"
    )
    .join("users as addressee", "addressee.user_id", "friendships.addressee_id")
    .leftJoin(
      "user_profiles as addressee_profile",
      "addressee_profile.user_id",
      "addressee.user_id"
    )
    .select(
      "friendships.friendship_id",
      "friendships.requester_id",
      "friendships.addressee_id",
      "friendships.status",
      "friendships.requested_at",
      "friendships.responded_at",
      "requester.username as requester_username",
      "requester_profile.display_name as requester_display_name",
      "requester_profile.avatar_url as requester_avatar_url",
      "addressee.username as addressee_username",
      "addressee_profile.display_name as addressee_display_name",
      "addressee_profile.avatar_url as addressee_avatar_url"
    )
    .where((builder) => {
      builder.where("friendships.requester_id", currentUserId).orWhere("friendships.addressee_id", currentUserId);
    });
}

export async function listFriends(currentUserId) {
  const knex = ensureDb();
  const rows = await baseFriendshipRows(knex, currentUserId)
    .andWhere("friendships.status", "accepted")
    .orderBy("friendships.updated_at", "desc");

  return rows.map((row) => mapFriendship(row, currentUserId));
}

export async function listFriendRequests(currentUserId) {
  const knex = ensureDb();
  const rows = await baseFriendshipRows(knex, currentUserId)
    .andWhere("friendships.status", "pending")
    .orderBy("friendships.requested_at", "desc");

  return rows.map((row) => mapFriendship(row, currentUserId));
}

export async function createFriendRequest(currentUserId, targetUserId) {
  const knex = ensureDb();
  if (!targetUserId || targetUserId === currentUserId) {
    throw createError(400, "Invalid target user");
  }

  const targetUser = await knex("users").where({ user_id: targetUserId, status: "active" }).first();
  if (!targetUser) {
    throw createError(404, "Target user not found");
  }

  const existing = await knex("friendships")
    .where((builder) => {
      builder
        .where({ requester_id: currentUserId, addressee_id: targetUserId })
        .orWhere({ requester_id: targetUserId, addressee_id: currentUserId });
    })
    .first();

  if (existing) {
    throw createError(409, "Friendship request already exists");
  }

  await knex("friendships").insert({
    requester_id: currentUserId,
    addressee_id: targetUserId,
    status: "pending"
  });

  return listFriendRequests(currentUserId);
}

export async function updateFriendRequest(currentUserId, friendshipId, action) {
  const knex = ensureDb();
  const friendship = await knex("friendships").where({ friendship_id: friendshipId }).first();

  if (!friendship) {
    throw createError(404, "Friend request not found");
  }

  if (friendship.addressee_id !== currentUserId) {
    throw createError(403, "Only receiver can update this request");
  }

  const nextStatus = action === "accept" ? "accepted" : action === "reject" ? "rejected" : null;
  if (!nextStatus) {
    throw createError(400, "Action must be accept or reject");
  }

  await knex("friendships")
    .where({ friendship_id: friendshipId })
    .update({
      status: nextStatus,
      responded_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });

  return listFriendRequests(currentUserId);
}

export async function removeFriendship(currentUserId, friendshipId) {
  const knex = ensureDb();
  const friendship = await knex("friendships").where({ friendship_id: friendshipId }).first();

  if (!friendship) {
    throw createError(404, "Friendship not found");
  }

  if (![friendship.requester_id, friendship.addressee_id].includes(currentUserId)) {
    throw createError(403, "Not allowed to remove this friendship");
  }

  await knex("friendships").where({ friendship_id: friendshipId }).del();
  return listFriends(currentUserId);
}
