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
    const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    let ssl = isLocal ? false : { rejectUnauthorized: false };
    if (process.env.DB_SSL_ENABLED === "true") ssl = { rejectUnauthorized: false };
    if (process.env.DB_SSL_ENABLED === "false") ssl = false;

    return new Pool({
      connectionString,
      connectionTimeoutMillis: 15000,
      ssl
    });
  }

  // Fallback to individual env vars (Supabase or manual config)
  const host = process.env.SQL_HOST || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || !host;
  const sslConfig = process.env.DB_SSL_ENABLED === "true" 
    ? { rejectUnauthorized: false } 
    : (process.env.DB_SSL_ENABLED === "false" 
      ? false 
      : null); // Return null to omit ssl option entirely
  
  console.log(`[DB] Connecting to host ${process.env.SQL_HOST} with SSL configuration:`, sslConfig);

  const poolConfig: any = {
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  };
  
  if (sslConfig !== null) {
    poolConfig.ssl = sslConfig;
  }

  return new Pool(poolConfig);
};

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

export const db = drizzle(pool, { schema });
