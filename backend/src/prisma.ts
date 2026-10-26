import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// MariaDB / MySQL URL Builder
function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith("mysql://") || process.env.DATABASE_URL.startsWith("mariadb://"))) {
    return process.env.DATABASE_URL.replace(/^mariadb:\/\//, "mysql://");
  }

  // If discrete DB environment variables are set (recommended for cPanel)
  if (process.env.DB_USER && process.env.DB_NAME) {
    const user = encodeURIComponent(process.env.DB_USER);
    const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "3306";
    const name = encodeURIComponent(process.env.DB_NAME);
    return `mysql://${user}:${pass}@${host}:${port}/${name}`;
  }

  return process.env.DATABASE_URL || "mysql://root:@localhost:3306/sitecadh_glowgoodly_db";
}

const activeDbUrl = buildDatabaseUrl();
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("mysql://")) {
  process.env.DATABASE_URL = activeDbUrl;
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: activeDbUrl,
    },
  },
});

export default prisma;


