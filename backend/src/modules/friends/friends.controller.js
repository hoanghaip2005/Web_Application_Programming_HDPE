import { asyncHandler } from "../../utils/http.js";
import {
  createFriendRequest,
  listFriendRequests,
  listFriends,
  removeFriendship,
  updateFriendRequest
} from "./friends.service.js";

export const getFriends = asyncHandler(async (req, res) => {
  const data = await listFriends(req.auth.sub);
  res.json({ data });
});

export const getRequests = asyncHandler(async (req, res) => {
  const data = await listFriendRequests(req.auth.sub);
  res.json({ data });
});

export const sendRequest = asyncHandler(async (req, res) => {
  const data = await createFriendRequest(req.auth.sub, req.body.targetUserId);
  res.status(201).json({ data });
});

export const updateRequest = asyncHandler(async (req, res) => {
  const data = await updateFriendRequest(
    req.auth.sub,
    req.params.friendshipId,
    req.body.action
  );
  res.json({ data });
});

export const remove = asyncHandler(async (req, res) => {
  const data = await removeFriendship(req.auth.sub, req.params.friendshipId);
  res.json({ data });
});
