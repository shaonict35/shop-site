import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "";

function parseDbUrl(urlStr: string) {
  // If discrete DB environment variables are set, prioritize them
  if (process.env.DB_USER && process.env.DB_NAME) {
    return {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      connectionLimit: 10,
    };
  }

  if (!urlStr) {
    return {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "glowgoodly_db",
      connectionLimit: 10,
    };
  }

  try {
    // 1. Try regex extraction to handle special characters in password without URL parsing errors
    const match = urlStr.match(/^(?:mysql|mariadb):\/\/([^:]+):?(.*)?@([^:/]+)(?::(\d+))?\/([^?]+)/);
    if (match) {
      const [, user, rawPass, host, portStr, database] = match;
      return {
        host: host || "localhost",
        port: portStr ? parseInt(portStr, 10) : 3306,
        user: decodeURIComponent(user || "root"),
        password: decodeURIComponent(rawPass || ""),
        database: decodeURIComponent(database || "glowgoodly_db"),
        connectionLimit: 10,
      };
    }

    // 2. Standard URL fallback
    const normalized = urlStr.replace(/^mysql:\/\//, "http://").replace(/^mariadb:\/\//, "http://");
    const parsed = new URL(normalized);
    return {
      host: parsed.hostname || "localhost",
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: decodeURIComponent(parsed.username || "root"),
      password: decodeURIComponent(parsed.password || ""),
      database: parsed.pathname.replace(/^\//, "") || "glowgoodly_db",
      connectionLimit: 10,
    };
  } catch (e) {
    console.warn("⚠️ Failed to parse DATABASE_URL, using default fallback parameters.", e);
    return {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      database: "glowgoodly_db",
      connectionLimit: 10,
    };
  }
}

const adapter = new PrismaMariaDb(parseDbUrl(dbUrl));
const prisma = new PrismaClient({ adapter });

export default prisma;
