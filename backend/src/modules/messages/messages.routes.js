import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import {
  conversation,
  conversations,
  directConversation,
  postMessage
} from "./messages.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/conversations", conversations);
router.post("/conversations/direct", directConversation);
router.get("/conversations/:conversationId", conversation);
router.post("/conversations/:conversationId", postMessage);

export default router;
