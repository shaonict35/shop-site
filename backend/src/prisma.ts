import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "mysql://root:root@localhost:3306/glowgoodly_db";

function parseDbUrl(urlStr: string) {
  try {
    // Handle both mysql:// and mariadb:// protocols
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
