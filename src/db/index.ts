import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import env from "@/env";
import { relations } from "./schema/relations";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_SIZE, // 连接池最大连接数
  idleTimeoutMillis: 45 * 1000, // 45s 连接空闲超时
  connectionTimeoutMillis: 30 * 1000, // 30s 连接超时
});

const db = drizzle({ client: pool, relations, logger: env.NODE_ENV === "development" });

export default db;
