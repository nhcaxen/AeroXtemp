import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";
import * as dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

export const createPool = () => {
  // Railway provides DATABASE_URL automatically when a Postgres service is linked
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return new Pool({
      connectionString,
      connectionTimeoutMillis: 15000,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1") 
        ? false 
        : { rejectUnauthorized: false }
    });
  }

  // Fallback to individual env vars (Supabase or manual config)
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

export const db = drizzle(pool, { schema });
