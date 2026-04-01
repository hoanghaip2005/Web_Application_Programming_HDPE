import { ensureDb } from "../../config/db.js";
import { createError } from "../../utils/http.js";

function buildMessagePreview(messageBody, maxLength = 64) {
  const normalized = String(messageBody || "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

async function getConversationMembers(knex, conversationIds) {
  const rows = await knex("conversation_members")
    .join("users", "users.user_id", "conversation_members.user_id")
    .leftJoin("user_profiles", "user_profiles.user_id", "users.user_id")
    .select(
      "conversation_members.conversation_id",
      "users.user_id",
      "users.username",
      "user_profiles.display_name"
    )
    .whereIn("conversation_members.conversation_id", conversationIds);

  return rows.reduce((acc, row) => {
    acc[row.conversation_id] ||= [];
    acc[row.conversation_id].push({
      userId: row.user_id,
      username: row.username,
      displayName: row.display_name
    });
    return acc;
  }, {});
}

export async function listConversations(currentUserId) {
  const knex = ensureDb();
  const rows = await knex("conversation_members")
    .join("conversations", "conversations.conversation_id", "conversation_members.conversation_id")
    .where("conversation_members.user_id", currentUserId)
    .select(
      "conversations.conversation_id",
      "conversations.conversation_type",
      "conversations.created_at",
      "conversation_members.last_read_at"
    )
    .orderBy("conversations.created_at", "desc");

  const conversationIds = rows.map((row) => row.conversation_id);
  const membersByConversation = conversationIds.length
    ? await getConversationMembers(knex, conversationIds)
    : {};
  const messageRows = conversationIds.length
    ? await knex("messages")
        .select(
          "message_id",
          "conversation_id",
          "sender_id",
          "message_body",
          "sent_at"
        )
        .whereIn("conversation_id", conversationIds)
        .whereNull("deleted_at")
        .orderBy([
          { column: "conversation_id", order: "asc" },
          { column: "sent_at", order: "desc" }
        ])
    : [];

  const latestByConversation = {};
  const unreadCountByConversation = {};
  const lastReadAtByConversation = Object.fromEntries(
    rows.map((row) => [row.conversation_id, row.last_read_at ? new Date(row.last_read_at).getTime() : 0])
  );

  messageRows.forEach((message) => {
    if (!latestByConversation[message.conversation_id]) {
      latestByConversation[message.conversation_id] = message;
    }

    const sentAt = new Date(message.sent_at).getTime();
    const lastReadAt = lastReadAtByConversation[message.conversation_id] || 0;

    if (message.sender_id !== currentUserId && sentAt > lastReadAt) {
      unreadCountByConversation[message.conversation_id] =
        (unreadCountByConversation[message.conversation_id] || 0) + 1;
    }
  });

  return rows
    .map((row) => {
      const latestMessage = latestByConversation[row.conversation_id];

      return {
        conversationId: row.conversation_id,
        conversationType: row.conversation_type,
        createdAt: row.created_at,
        latestMessageAt: latestMessage?.sent_at || null,
        latestMessagePreview: buildMessagePreview(latestMessage?.message_body),
        unreadCount: unreadCountByConversation[row.conversation_id] || 0,
        members: membersByConversation[row.conversation_id] || []
      };
    })
    .sort((left, right) => {
      const leftTime = new Date(left.latestMessageAt || left.createdAt).getTime();
      const rightTime = new Date(right.latestMessageAt || right.createdAt).getTime();
      return rightTime - leftTime;
    });
}

export async function getConversation(currentUserId, conversationId) {
  const knex = ensureDb();
  const member = await knex("conversation_members")
    .where({ conversation_id: conversationId, user_id: currentUserId })
    .first();

  if (!member) {
    throw createError(404, "Conversation not found");
  }

  const conversation = await knex("conversations")
    .where({ conversation_id: conversationId })
    .first();

  const membersByConversation = await getConversationMembers(knex, [conversationId]);
  const messages = await knex("messages")
    .join("users", "users.user_id", "messages.sender_id")
    .select(
      "messages.message_id",
      "messages.sender_id",
      "messages.message_body",
      "messages.sent_at",
      "users.username"
    )
    .where("messages.conversation_id", conversationId)
    .whereNull("messages.deleted_at")
    .orderBy("messages.sent_at", "asc");

  const latestMessage = messages[messages.length - 1];

  await knex("conversation_members")
    .where({ conversation_id: conversationId, user_id: currentUserId })
    .update({
      last_read_at: knex.fn.now(),
      last_read_message_id: latestMessage?.message_id || null
    });

  return {
    conversationId: conversation.conversation_id,
    conversationType: conversation.conversation_type,
    createdAt: conversation.created_at,
    members: membersByConversation[conversationId] || [],
    messages: messages.map((message) => ({
      messageId: message.message_id,
      senderId: message.sender_id,
      senderUsername: message.username,
      messageBody: message.message_body,
      sentAt: message.sent_at
    }))
  };
}

export async function createOrGetDirectConversation(currentUserId, friendUserId) {
  const knex = ensureDb();

  const memberRows = await knex("conversation_members")
    .select("conversation_id")
    .whereIn("user_id", [currentUserId, friendUserId]);

  const counts = memberRows.reduce((acc, row) => {
    acc[row.conversation_id] = (acc[row.conversation_id] || 0) + 1;
    return acc;
  }, {});

  const existingConversationId = Object.entries(counts).find(([, count]) => count === 2)?.[0];
  if (existingConversationId) {
    return getConversation(currentUserId, existingConversationId);
  }

  const [conversation] = await knex("conversations")
    .insert({
      conversation_type: "direct",
      created_by: currentUserId
    })
    .returning(["conversation_id"]);

  await knex("conversation_members").insert([
    {
      conversation_id: conversation.conversation_id,
      user_id: currentUserId
    },
    {
      conversation_id: conversation.conversation_id,
      user_id: friendUserId
    }
  ]);

  return getConversation(currentUserId, conversation.conversation_id);
}

export async function sendMessage(currentUserId, conversationId, messageBody) {
  const knex = ensureDb();
  const member = await knex("conversation_members")
    .where({ conversation_id: conversationId, user_id: currentUserId })
    .first();

  if (!member) {
    throw createError(403, "You are not part of this conversation");
  }

  if (!messageBody?.trim()) {
    throw createError(400, "Message body is required");
  }

  const [message] = await knex("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      message_body: messageBody.trim()
    })
    .returning(["message_id", "sent_at"]);

  await knex("conversation_members")
    .where({ conversation_id: conversationId, user_id: currentUserId })
    .update({
      last_read_at: message.sent_at,
      last_read_message_id: message.message_id
    });

  return getConversation(currentUserId, conversationId);
}
