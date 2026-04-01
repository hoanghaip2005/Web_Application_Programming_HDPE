import jwt from "jsonwebtoken";
import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "../../config/env.js";
import { createError } from "../../utils/http.js";
import { openApiDocument } from "./openapi.js";

const router = Router();

function resolveApiKey(req) {
  return req.headers["x-api-key"] || req.query.apiKey || "";
}

function resolveToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }

  return req.query.token || "";
}

function requireDocsAccess(req, _res, next) {
  const apiKey = resolveApiKey(req);
  const token = resolveToken(req);

  if (!apiKey) {
    return next(createError(401, "API key required"));
  }

  if (apiKey !== env.apiKey) {
    return next(createError(403, "Invalid API key"));
  }

  if (!token) {
    return next(createError(401, "Authentication required"));
  }

  try {
    req.auth = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return next(createError(401, "Invalid token"));
  }
}

router.use(swaggerUi.serve);

router.get(
  "/",
  requireDocsAccess,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customSiteTitle: "HDPE Swagger UI",
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: "list"
    }
  })
);

router.get("/openapi.json", requireDocsAccess, (_req, res) => {
  res.json(openApiDocument);
});

export default router;
