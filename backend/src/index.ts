import "dotenv/config";
import { buildApp } from "./app.js";
import { config } from "./config.js";

async function main() {
  const app = await buildApp();

  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down...`);
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen({ port: config.PORT, host: "0.0.0.0" });
  app.log.info(`Server listening on http://localhost:${config.PORT} (${config.NODE_ENV})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
