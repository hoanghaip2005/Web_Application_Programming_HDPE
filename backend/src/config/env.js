import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");
const envDirectory = path.dirname(envPath);

dotenv.config({ path: envPath });

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.PGHOST || process.env.DB_HOST || "";
  const port = process.env.PGPORT || process.env.DB_PORT || "";
  const database = process.env.PGDATABASE || process.env.DB_NAME || "";
  const user = process.env.PGUSER || process.env.DB_USER || "";
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || "";
  const sslmode = process.env.PGSSLMODE || process.env.DB_SSLMODE || "";

  if (!host || !port || !database || !user || !password) {
    return "";
  }

  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  const query = sslmode ? `?sslmode=${encodeURIComponent(sslmode)}` : "";

  return `postgresql://${auth}@${host}:${port}/${database}${query}`;
}

function resolveOptionalPath(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  return path.isAbsolute(normalized)
    ? normalized
    : path.resolve(envDirectory, normalized);
}

const port = Number(process.env.PORT || 4000);
const httpsPort = Number(process.env.HTTPS_PORT || 4443);
const httpsKeyPath = resolveOptionalPath(process.env.HTTPS_KEY_PATH);
const httpsCertPath = resolveOptionalPath(process.env.HTTPS_CERT_PATH);
const httpsCaPath = resolveOptionalPath(process.env.HTTPS_CA_PATH);
const httpsEnabled = Boolean(httpsKeyPath && httpsCertPath);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  httpsPort,
  httpsEnabled,
  httpsKeyPath,
  httpsCertPath,
  httpsCaPath,
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  appBaseUrl:
    process.env.APP_BASE_URL ||
    (httpsEnabled ? `https://localhost:${httpsPort}` : `http://localhost:${port}`),
  databaseUrl: buildDatabaseUrl(),
  jwtSecret: process.env.JWT_SECRET || "change-me",
  apiKey: process.env.API_KEY || "hdpe-local-api-key",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "avatars"
};
