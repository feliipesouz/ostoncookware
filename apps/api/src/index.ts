import { getApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { serverLog } from "./lib/logging.js";

async function start() {
  const env = loadEnv();
  const app = await getApp();

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });
}

start().catch((error) => {
  serverLog("error", "api.start.failed", { error });
  process.exit(1);
});
