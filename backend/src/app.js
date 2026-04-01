import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import docsRoutes from "./modules/docs/docs.routes.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/error-handler.js";

const app = express();
const allowedOrigins = new Set(
  String(env.frontendOrigin || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", routes);
app.use("/api-docs", docsRoutes);
app.use(errorHandler);

export default app;
