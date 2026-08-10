import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

const adapter = new PrismaLibSql({
  url: dbUrl,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
