import { PrismaClient } from "../node_modules/.prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing");
}

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
    pool?: Pool;
  };
  
  if (!globalWithPrisma.pool) {
    globalWithPrisma.pool = new Pool({ connectionString });
  }
  if (!globalWithPrisma.prisma) {
    const adapter = new PrismaPg(globalWithPrisma.pool);
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
