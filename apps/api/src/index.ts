import { getApp } from "./app.js";
import { loadEnv } from "./config/env.js";

async function start() {
  const env = loadEnv();
  const app = await getApp();

  await app.listen({
    port: env.PORT,
    host: env.HOST,
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
