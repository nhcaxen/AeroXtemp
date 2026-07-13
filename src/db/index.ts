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
    const isCloudSqlSocket = connectionString.includes("/cloudsql/");
    const isRemoteCloudDb = connectionString.includes("supabase") || connectionString.includes("neon.tech") || connectionString.includes("railway") || connectionString.includes("render.com") || connectionString.includes("elephantsql");
    
    let ssl: any = (isLocal || isCloudSqlSocket) ? false : { rejectUnauthorized: false };

    if (process.env.DB_SSL_ENABLED === "true") ssl = { rejectUnauthorized: false };
    if (process.env.DB_SSL_ENABLED === "false") {
      if (isRemoteCloudDb) {
        console.warn("[DB WARNING] DB_SSL_ENABLED is set to 'false', but the connection string is a remote cloud database (Supabase/Neon/Railway) that strictly requires SSL. Overriding to enable SSL for connection success!");
        ssl = { rejectUnauthorized: false };
      } else {
        ssl = false;
      }
    }

    return new Pool({
      connectionString,
      connectionTimeoutMillis: 15000,
      ssl
    });
  }

  // Fallback to individual env vars (Supabase or manual config)
  const host = process.env.SQL_HOST || "";
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || !host;
  const isRemoteCloudDb = host.includes("supabase") || host.includes("neon.tech") || host.includes("railway") || host.includes("render.com") || host.includes("elephantsql");
  
  let sslConfig: any = process.env.DB_SSL_ENABLED === "true" 
    ? { rejectUnauthorized: false } 
    : (process.env.DB_SSL_ENABLED === "false" 
      ? (isRemoteCloudDb ? { rejectUnauthorized: false } : false) 
      : null); // null means default fallback

  if (sslConfig === null) {
    // If not specified, default to SSL enabled for remote hosts, false for local
    sslConfig = isLocal ? false : { rejectUnauthorized: false };
  } else if (sslConfig === false && !isLocal) {
    if (isRemoteCloudDb) {
      console.warn("[DB WARNING] DB_SSL_ENABLED is set to 'false', but the SQL_HOST is a remote cloud database (Supabase/Neon/Railway) that typically requires SSL. Overriding to enable SSL!");
      sslConfig = { rejectUnauthorized: false };
    }
  }
  
  console.log(`[DB] Connecting to host ${process.env.SQL_HOST || "local socket"} with SSL configuration:`, sslConfig);

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
