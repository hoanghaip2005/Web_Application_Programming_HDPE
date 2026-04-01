import knex from "knex";
import { env } from "./env.js";
import { createError } from "../utils/http.js";

const connectionTimeoutMillis = Number(process.env.DB_CONNECTION_TIMEOUT_MS || 15000);
const queryTimeoutMillis = Number(process.env.DB_QUERY_TIMEOUT_MS || 30000);
const statementTimeoutMillis = Number(process.env.DB_STATEMENT_TIMEOUT_MS || 30000);
const poolMin = Number(process.env.DB_POOL_MIN || 1);
const poolMax = Number(process.env.DB_POOL_MAX || 10);
const poolCreateTimeoutMillis = Number(process.env.DB_POOL_CREATE_TIMEOUT_MS || 15000);
const poolAcquireTimeoutMillis = Number(process.env.DB_POOL_ACQUIRE_TIMEOUT_MS || 20000);
const poolIdleTimeoutMillis = Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 30000);

function buildConnection() {
  if (process.env.PGHOST) {
    return {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      family: 4,
      keepAlive: true,
      connectionTimeoutMillis,
      query_timeout: queryTimeoutMillis,
      statement_timeout: statementTimeoutMillis,
      ssl:
        process.env.PGSSLMODE === "require"
          ? {
              rejectUnauthorized: false
            }
          : false
    };
  }

  if (env.databaseUrl) {
    return env.databaseUrl;
  }

  return null;
}

const connection = buildConnection();
export const hasDatabase = Boolean(connection);

export const db = hasDatabase
  ? knex({
      client: "pg",
      connection,
      pool: {
        min: poolMin,
        max: poolMax,
        createTimeoutMillis: poolCreateTimeoutMillis,
        acquireTimeoutMillis: poolAcquireTimeoutMillis,
        idleTimeoutMillis: poolIdleTimeoutMillis,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      },
      acquireConnectionTimeout: poolAcquireTimeoutMillis
    })
  : null;

export function ensureDb() {
  if (!db) {
    throw createError(
      503,
      "Database is not configured. Copy backend/.env.example to backend/.env and provide DATABASE_URL."
    );
  }

  return db;
}
