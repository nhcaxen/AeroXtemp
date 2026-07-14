import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique(),
  username: text("username"),
  firstName: text("first_name"),
  role: text("role").default("free"), // "owner" | "premium" | "free"
  plan: text("plan").default("free"), // "owner" | "premium" | "free"
  credits: integer("credits").default(20),
  joinedAt: text("joined_at"), // Format: "11 Jul 2026"
  lastActive: text("last_active"), // Format: "11 Jul 2026 05:48:42" or similar
  photoUrl: text("photo_url"),
  totalRecoveries: integer("total_recoveries").default(0),
  referrerId: text("referrer_id"),
  creditResetTime: text("credit_reset_time"), // Format: YYYY-MM-DD or timestamp
  planExpiry: text("plan_expiry"), // Format: YYYY-MM-DD or timestamp
  createdAt: timestamp("created_at").defaultNow(),
});

export const redeemCodes = pgTable("redeem_codes", {
  id: serial("id").primaryKey(),
  code: text("code").unique(),
  credits: integer("credits").default(0),
  expiresAt: text("expires_at"), // Format: "YYYY-MM-DD"
  maxUses: integer("max_uses").default(1),
  usedCount: integer("used_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by"),
  plan: text("plan"), // "core" | "prime" | "elite" | "owner" | null
  role: text("role"), // "premium" | "owner" | "free" | null
  durationDays: integer("duration_days"), // null or duration in days, e.g. 30, 90, 365, or -1 (lifetime)
});

export const redemptions = pgTable("redemptions", {
  id: serial("id").primaryKey(),
  code: text("code"),
  telegramId: text("telegram_id"),
  username: text("username"),
  redeemedAt: timestamp("redeemed_at").defaultNow(),
});

export const mailboxes = pgTable("mailboxes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.telegramId),
  provider: text("provider").default("Mail.tm"),
  email: text("email"),
  password: text("password"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccess: timestamp("last_access").defaultNow(),
  lastRefresh: timestamp("last_refresh").defaultNow(),
  status: text("status").default("active"), // "active" | "deleted" | "expired"
  expiresAt: timestamp("expires_at"),
  accountId: text("account_id"),
  domain: text("domain"),
  mailType: text("mail_type").default("temp"),
  inboxMetadata: text("inbox_metadata"),
});

export const shopPurchases = pgTable("shop_purchases", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id"),
  username: text("username"),
  productTitle: text("product_title"),
  productCategory: text("product_category"),
  productPrice: integer("product_price"),
  credentials: text("credentials"),
  purchasedAt: timestamp("purchased_at").defaultNow(),
});


