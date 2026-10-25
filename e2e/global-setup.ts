import { execSync } from "child_process";
import path from "path";
import { config as loadEnv } from "dotenv";

export default async function globalSetup() {
  loadEnv({ path: path.resolve(__dirname, "../.env.test"), override: true });

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env },
  });

  execSync("npx prisma db seed", {
    stdio: "inherit",
    env: { ...process.env },
  });
}
