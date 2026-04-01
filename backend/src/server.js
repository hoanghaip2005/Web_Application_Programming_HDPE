import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import app from "./app.js";
import { env } from "./config/env.js";

function startHttpServer() {
  const server = http.createServer(app);

  server.listen(env.port, () => {
    console.log(`HDPE backend listening on http://localhost:${env.port}`);
  });

  return server;
}

function readOptionalFile(filePath) {
  return filePath ? fs.readFileSync(filePath) : undefined;
}

function startHttpsServer() {
  if (!env.httpsEnabled) {
    return null;
  }

  const credentials = {
    key: fs.readFileSync(env.httpsKeyPath),
    cert: fs.readFileSync(env.httpsCertPath),
    ca: readOptionalFile(env.httpsCaPath)
  };

  const server = https.createServer(credentials, app);

  server.listen(env.httpsPort, () => {
    console.log(`HDPE backend listening on https://localhost:${env.httpsPort}`);
  });

  return server;
}

startHttpServer();
startHttpsServer();
