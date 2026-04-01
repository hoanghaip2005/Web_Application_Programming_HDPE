const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

function buildConnection() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (!process.env.PGHOST) {
    return undefined;
  }

  return {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl:
      process.env.PGSSLMODE === "require"
        ? {
            rejectUnauthorized: false
          }
        : false
  };
}

module.exports = {
  development: {
    client: "pg",
    connection: buildConnection(),
    migrations: {
      directory: "./db/migrations"
    },
    seeds: {
      directory: "./db/seeds"
    }
  }
};
