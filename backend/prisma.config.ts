import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env explicitly from directory of prisma.config.ts
dotenv.config({ path: path.resolve(__dirname, ".env") });

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return process.env.DATABASE_URL.trim();
  }
  if (process.env.DB_USER && process.env.DB_NAME) {
    const user = encodeURIComponent(process.env.DB_USER);
    const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "3306";
    const name = encodeURIComponent(process.env.DB_NAME);
    return `mysql://${user}:${pass}@${host}:${port}/${name}`;
  }
  return "mysql://root:12345678@localhost:3306/glowgoodly_db";
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDatabaseUrl(),
  },
});
