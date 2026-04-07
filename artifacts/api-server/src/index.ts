import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "..", "..", "..", ".env") });

import app from "./app";
import { fileLogger } from "./lib/fileLogger.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  fileLogger.logError({
    message: "Uncaught exception",
    error: String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  fileLogger.logError({
    message: "Unhandled rejection",
    error: String(reason),
  });
});

process.on("beforeExit", (code) => {
  fileLogger.logSystem({ message: "Process exiting", details: { code } });
});

const rawPort = process.env["PORT"] ?? "8081";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("Press Ctrl+C to stop");
  fileLogger.logSystem({ message: "Server started", details: { port } });
});

server.on("error", (err) => {
  console.error("Server error:", err);
  fileLogger.logError({
    message: "Server error",
    error: String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  process.exit(1);
});

