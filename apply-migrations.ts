import { createPool } from "./src/db/index.ts";
import pg from "pg";

async function main() {
  console.log("=== STARTING ROBUST SQL MIGRATION ===");
  
  // Use admin credentials if available to ensure we have permission to add constraints
  const adminUser = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const adminPassword = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
  
  console.log(`Connecting to database ${process.env.SQL_DB_NAME} as admin user: ${adminUser}`);
  
  const pool = new pg.Pool({
    host: process.env.SQL_HOST,
    user: adminUser,
    password: adminPassword,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
    ssl: false // unix socket / local
  });
  
  const client = await pool.connect();
  console.log("Successfully connected to the PostgreSQL database as admin!");

  try {
    // Helper function to check if a table exists
    const tableExists = async (tableName: string): Promise<boolean> => {
      const res = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
        [tableName]
      );
      return res.rows[0].exists;
    };

    // Helper function to check if a column exists in a table
    const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
      const res = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2)",
        [tableName, columnName]
      );
      return res.rows[0].exists;
    };

    // Helper function to check if a constraint exists in a table
    const constraintExists = async (tableName: string, constraintName: string): Promise<boolean> => {
      const res = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_schema = 'public' AND table_name = $1 AND constraint_name = $2
        )`,
        [tableName, constraintName]
      );
      return res.rows[0].exists;
    };

    const addedColumns: string[] = [];
    const createdTables: string[] = [];
    const verifiedConstraints: string[] = [];

    // --- 1. USERS TABLE ---
    console.log("\nChecking 'users' table...");
    if (!(await tableExists("users"))) {
      console.log("Table 'users' does not exist. Creating users table...");
      await client.query(`
        CREATE TABLE "users" (
          "id" SERIAL PRIMARY KEY NOT NULL,
          "telegram_id" TEXT,
          "username" TEXT,
          "first_name" TEXT,
          "role" TEXT DEFAULT 'free',
          "plan" TEXT DEFAULT 'free',
          "credits" INTEGER DEFAULT 20,
          "joined_at" TEXT,
          "last_active" TEXT,
          "photo_url" TEXT,
          "total_recoveries" INTEGER DEFAULT 0,
          "referrer_id" TEXT,
          "credit_reset_time" TEXT,
          "plan_expiry" TEXT,
          "created_at" TIMESTAMP DEFAULT NOW()
        )
      `);
      createdTables.push("users");
      console.log("Table 'users' created successfully.");
    } else {
      console.log("Table 'users' exists. Verifying columns...");
    }

    const usersColumns = [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "telegram_id", type: "TEXT" },
      { name: "username", type: "TEXT" },
      { name: "first_name", type: "TEXT" },
      { name: "role", type: "TEXT", default: "'free'" },
      { name: "plan", type: "TEXT", default: "'free'" },
      { name: "credits", type: "INTEGER", default: "20" },
      { name: "joined_at", type: "TEXT" },
      { name: "last_active", type: "TEXT" },
      { name: "photo_url", type: "TEXT" },
      { name: "total_recoveries", type: "INTEGER", default: "0" },
      { name: "referrer_id", type: "TEXT" },
      { name: "credit_reset_time", type: "TEXT" },
      { name: "plan_expiry", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP", default: "NOW()" },
    ];

    for (const col of usersColumns) {
      if (col.name === "id") continue; // PK is handled on creation
      if (!(await columnExists("users", col.name))) {
        console.log(`Adding column 'users.${col.name}'...`);
        let query = `ALTER TABLE "users" ADD COLUMN "${col.name}" ${col.type}`;
        if (col.default !== undefined) {
          query += ` DEFAULT ${col.default}`;
        }
        await client.query(query);
        addedColumns.push(`users.${col.name}`);
        console.log(`Column 'users.${col.name}' added.`);
      }
    }

    // Unique Constraint on users.telegram_id
    if (!(await constraintExists("users", "users_telegram_id_unique"))) {
      console.log("Adding unique constraint 'users_telegram_id_unique'...");
      try {
        await client.query('ALTER TABLE "users" ADD CONSTRAINT "users_telegram_id_unique" UNIQUE ("telegram_id")');
        verifiedConstraints.push("users.telegram_id UNIQUE");
        console.log("Unique constraint 'users_telegram_id_unique' added.");
      } catch (e: any) {
        console.warn("Could not add users_telegram_id_unique constraint:", e.message);
      }
    } else {
      console.log("Unique constraint 'users_telegram_id_unique' is already verified.");
    }


    // --- 2. REDEEM_CODES TABLE ---
    console.log("\nChecking 'redeem_codes' table...");
    if (!(await tableExists("redeem_codes"))) {
      console.log("Table 'redeem_codes' does not exist. Creating redeem_codes table...");
      await client.query(`
        CREATE TABLE "redeem_codes" (
          "id" SERIAL PRIMARY KEY NOT NULL,
          "code" TEXT,
          "credits" INTEGER DEFAULT 0,
          "expires_at" TEXT,
          "max_uses" INTEGER DEFAULT 1,
          "used_count" INTEGER DEFAULT 0,
          "created_at" TIMESTAMP DEFAULT NOW(),
          "created_by" TEXT,
          "plan" TEXT,
          "role" TEXT,
          "duration_days" INTEGER
        )
      `);
      createdTables.push("redeem_codes");
      console.log("Table 'redeem_codes' created successfully.");
    } else {
      console.log("Table 'redeem_codes' exists. Verifying columns...");
    }

    const redeemCodesColumns = [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "code", type: "TEXT" },
      { name: "credits", type: "INTEGER", default: "0" },
      { name: "expires_at", type: "TEXT" },
      { name: "max_uses", type: "INTEGER", default: "1" },
      { name: "used_count", type: "INTEGER", default: "0" },
      { name: "created_at", type: "TIMESTAMP", default: "NOW()" },
      { name: "created_by", type: "TEXT" },
      { name: "plan", type: "TEXT" },
      { name: "role", type: "TEXT" },
      { name: "duration_days", type: "INTEGER" },
    ];

    for (const col of redeemCodesColumns) {
      if (col.name === "id") continue;
      if (!(await columnExists("redeem_codes", col.name))) {
        console.log(`Adding column 'redeem_codes.${col.name}'...`);
        let query = `ALTER TABLE "redeem_codes" ADD COLUMN "${col.name}" ${col.type}`;
        if (col.default !== undefined) {
          query += ` DEFAULT ${col.default}`;
        }
        await client.query(query);
        addedColumns.push(`redeem_codes.${col.name}`);
        console.log(`Column 'redeem_codes.${col.name}' added.`);
      }
    }

    // Unique Constraint on redeem_codes.code
    if (!(await constraintExists("redeem_codes", "redeem_codes_code_unique"))) {
      console.log("Adding unique constraint 'redeem_codes_code_unique'...");
      try {
        await client.query('ALTER TABLE "redeem_codes" ADD CONSTRAINT "redeem_codes_code_unique" UNIQUE ("code")');
        verifiedConstraints.push("redeem_codes.code UNIQUE");
        console.log("Unique constraint 'redeem_codes_code_unique' added.");
      } catch (e: any) {
        console.warn("Could not add redeem_codes_code_unique constraint:", e.message);
      }
    } else {
      console.log("Unique constraint 'redeem_codes_code_unique' is already verified.");
    }


    // --- 3. REDEMPTIONS TABLE ---
    console.log("\nChecking 'redemptions' table...");
    if (!(await tableExists("redemptions"))) {
      console.log("Table 'redemptions' does not exist. Creating redemptions table...");
      await client.query(`
        CREATE TABLE "redemptions" (
          "id" SERIAL PRIMARY KEY NOT NULL,
          "code" TEXT,
          "telegram_id" TEXT,
          "username" TEXT,
          "redeemed_at" TIMESTAMP DEFAULT NOW()
        )
      `);
      createdTables.push("redemptions");
      console.log("Table 'redemptions' created successfully.");
    } else {
      console.log("Table 'redemptions' exists. Verifying columns...");
    }

    const redemptionsColumns = [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "code", type: "TEXT" },
      { name: "telegram_id", type: "TEXT" },
      { name: "username", type: "TEXT" },
      { name: "redeemed_at", type: "TIMESTAMP", default: "NOW()" },
    ];

    for (const col of redemptionsColumns) {
      if (col.name === "id") continue;
      if (!(await columnExists("redemptions", col.name))) {
        console.log(`Adding column 'redemptions.${col.name}'...`);
        let query = `ALTER TABLE "redemptions" ADD COLUMN "${col.name}" ${col.type}`;
        if (col.default !== undefined) {
          query += ` DEFAULT ${col.default}`;
        }
        await client.query(query);
        addedColumns.push(`redemptions.${col.name}`);
        console.log(`Column 'redemptions.${col.name}' added.`);
      }
    }


    // --- 4. MAILBOXES TABLE ---
    console.log("\nChecking 'mailboxes' table...");
    if (!(await tableExists("mailboxes"))) {
      console.log("Table 'mailboxes' does not exist. Creating mailboxes table...");
      await client.query(`
        CREATE TABLE "mailboxes" (
          "id" SERIAL PRIMARY KEY NOT NULL,
          "user_id" TEXT,
          "provider" TEXT DEFAULT 'Mail.tm',
          "email" TEXT,
          "password" TEXT,
          "access_token" TEXT,
          "refresh_token" TEXT,
          "created_at" TIMESTAMP DEFAULT NOW(),
          "last_access" TIMESTAMP DEFAULT NOW(),
          "last_refresh" TIMESTAMP DEFAULT NOW(),
          "status" TEXT DEFAULT 'active'
        )
      `);
      createdTables.push("mailboxes");
      console.log("Table 'mailboxes' created successfully.");
    } else {
      console.log("Table 'mailboxes' exists. Verifying columns...");
    }

    const mailboxesColumns = [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "user_id", type: "TEXT" },
      { name: "provider", type: "TEXT", default: "'Mail.tm'" },
      { name: "email", type: "TEXT" },
      { name: "password", type: "TEXT" },
      { name: "access_token", type: "TEXT" },
      { name: "refresh_token", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP", default: "NOW()" },
      { name: "last_access", type: "TIMESTAMP", default: "NOW()" },
      { name: "last_refresh", type: "TIMESTAMP", default: "NOW()" },
      { name: "status", type: "TEXT", default: "'active'" },
      { name: "expires_at", type: "TIMESTAMP" },
      { name: "account_id", type: "TEXT" },
      { name: "domain", type: "TEXT" },
      { name: "mail_type", type: "TEXT", default: "'temp'" },
      { name: "inbox_metadata", type: "TEXT" },
    ];

    for (const col of mailboxesColumns) {
      if (col.name === "id") continue;
      if (!(await columnExists("mailboxes", col.name))) {
        console.log(`Adding column 'mailboxes.${col.name}'...`);
        let query = `ALTER TABLE "mailboxes" ADD COLUMN "${col.name}" ${col.type}`;
        if (col.default !== undefined) {
          query += ` DEFAULT ${col.default}`;
        }
        await client.query(query);
        addedColumns.push(`mailboxes.${col.name}`);
        console.log(`Column 'mailboxes.${col.name}' added.`);
      }
    }

    // Drop Unique Constraint on mailboxes.email if exists to ensure independent records
    console.log("Ensuring 'mailboxes_email_unique' is dropped for independent records...");
    try {
      await client.query('ALTER TABLE "mailboxes" DROP CONSTRAINT IF EXISTS "mailboxes_email_unique"');
      console.log("Unique constraint 'mailboxes_email_unique' checked/dropped.");
    } catch (e: any) {
      console.warn("Could not drop unique constraint:", e.message);
    }

    // Foreign Key on mailboxes.user_id -> users.telegram_id
    if (!(await constraintExists("mailboxes", "mailboxes_user_id_users_telegram_id_fk"))) {
      console.log("Adding foreign key constraint 'mailboxes_user_id_users_telegram_id_fk'...");
      try {
        await client.query(
          'ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_user_id_users_telegram_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("telegram_id") ON DELETE NO ACTION ON UPDATE NO ACTION'
        );
        verifiedConstraints.push("mailboxes.user_id -> users.telegram_id FOREIGN KEY");
        console.log("Foreign key constraint added successfully.");
      } catch (e: any) {
        console.warn("Could not add foreign key constraint:", e.message);
      }
    } else {
      console.log("Foreign key constraint is already verified.");
    }

    // --- 5. SHOP_PURCHASES TABLE ---
    console.log("\nChecking 'shop_purchases' table...");
    if (!(await tableExists("shop_purchases"))) {
      console.log("Table 'shop_purchases' does not exist. Creating shop_purchases table...");
      await client.query(`
        CREATE TABLE "shop_purchases" (
          "id" SERIAL PRIMARY KEY NOT NULL,
          "telegram_id" TEXT,
          "username" TEXT,
          "product_title" TEXT,
          "product_category" TEXT,
          "product_price" INTEGER,
          "credentials" TEXT,
          "purchased_at" TIMESTAMP DEFAULT NOW()
        )
      `);
      createdTables.push("shop_purchases");
      console.log("Table 'shop_purchases' created successfully.");
    } else {
      console.log("Table 'shop_purchases' exists. Verifying columns...");
    }

    const shopPurchasesColumns = [
      { name: "id", type: "SERIAL PRIMARY KEY" },
      { name: "telegram_id", type: "TEXT" },
      { name: "username", type: "TEXT" },
      { name: "product_title", type: "TEXT" },
      { name: "product_category", type: "TEXT" },
      { name: "product_price", type: "INTEGER" },
      { name: "credentials", type: "TEXT" },
      { name: "purchased_at", type: "TIMESTAMP", default: "NOW()" }
    ];

    for (const col of shopPurchasesColumns) {
      if (col.name === "id") continue;
      if (!(await columnExists("shop_purchases", col.name))) {
        console.log(`Adding column 'shop_purchases.${col.name}'...`);
        let query = `ALTER TABLE "shop_purchases" ADD COLUMN "${col.name}" ${col.type}`;
        if (col.default !== undefined) {
          query += ` DEFAULT ${col.default}`;
        }
        await client.query(query);
        addedColumns.push(`shop_purchases.${col.name}`);
        console.log(`Column 'shop_purchases.${col.name}' added.`);
      }
    }

    console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");
    console.log("Created Tables:", createdTables.length > 0 ? createdTables.join(", ") : "None");
    console.log("Added Columns:", addedColumns.length > 0 ? addedColumns.join(", ") : "None");
    console.log("Verified Constraints:", verifiedConstraints.length > 0 ? verifiedConstraints.join(", ") : "None");

  } catch (err: any) {
    console.error("Migration failed with error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
