import { asyncHandler } from "../../utils/http.js";
import {
  createOrGetDirectConversation,
  getConversation,
  listConversations,
  sendMessage
} from "./messages.service.js";

export const conversations = asyncHandler(async (req, res) => {
  const data = await listConversations(req.auth.sub);
  res.json({ data });
});

export const conversation = asyncHandler(async (req, res) => {
  const data = await getConversation(req.auth.sub, req.params.conversationId);
  res.json({ data });
});

export const directConversation = asyncHandler(async (req, res) => {
  const data = await createOrGetDirectConversation(req.auth.sub, req.body.friendUserId);
  res.status(201).json({ data });
});

export const postMessage = asyncHandler(async (req, res) => {
  const data = await sendMessage(
    req.auth.sub,
    req.params.conversationId,
    req.body.messageBody
  );
  res.status(201).json({ data });
});
