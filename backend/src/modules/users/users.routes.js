import { Router } from "express";
import { optionalAuth } from "../../middlewares/auth.js";
import { search } from "./users.controller.js";

const router = Router();

router.get("/search", optionalAuth, search);

export default router;
