import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

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

let adapter: any;
if (dbUrl.startsWith("file:") || dbUrl.endsWith(".db")) {
  try {
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    adapter = new PrismaLibSql({ url: dbUrl });
  } catch (err) {
    console.warn("⚠️ PrismaLibSql not available:", err);
  }
} else {
  try {
    const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
    adapter = new PrismaMariaDb(parseDbUrl(dbUrl));
  } catch (err) {
    console.warn("⚠️ PrismaMariaDb not available, using default PrismaClient:", err);
  }
}

const prisma = adapter ? new PrismaClient({ adapter }) : new PrismaClient();

export default prisma;


