import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.js";
import { getFriends, getRequests, remove, sendRequest, updateRequest } from "./friends.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", getFriends);
router.get("/requests", getRequests);
router.post("/requests", sendRequest);
router.patch("/requests/:friendshipId", updateRequest);
router.delete("/:friendshipId", remove);

export default router;
