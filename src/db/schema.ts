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

export const sellerApplications = pgTable("seller_applications", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  username: text("username"),
  storeName: text("store_name").notNull(),
  telegramUsername: text("telegram_username").notNull(),
  storeLogo: text("store_logo"),
  storeDescription: text("store_description").notNull(),
  cryptoWallet: text("crypto_wallet").notNull(),
  productsToSell: text("products_to_sell").notNull(),
  status: text("status").default("pending"), // "pending" | "approved" | "rejected" | "suspended"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").unique().notNull(),
  username: text("username"),
  storeName: text("store_name").notNull(),
  telegramUsername: text("telegram_username").notNull(),
  storeLogo: text("store_logo"),
  storeDescription: text("store_description").notNull(),
  cryptoWallet: text("crypto_wallet").notNull(),
  rating: text("rating").default("5.0"),
  completedOrders: integer("completed_orders").default(0),
  responseTime: text("response_time").default("~15 mins"),
  isVerified: integer("is_verified").default(0), // 0 = false, 1 = true
  status: text("status").default("active"), // "active" | "suspended"
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const marketplaceProducts = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  sellerTelegramId: text("seller_telegram_id").notNull(),
  category: text("category").notNull(), // "AI" | "VPN" | "OTT" | "Instagram" etc.
  name: text("name").notNull(),
  price: integer("price").notNull(),
  description: text("description"),
  stockStatus: text("stock_status").default("in_stock"), // "in_stock" | "out_of_stock"
  logo: text("logo"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceCatalogProducts = pgTable("marketplace_catalog_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // SVG Logo markup or URL
  category: text("category").notNull(),
  description: text("description"),
  brand: text("brand"),
  website: text("website"),
  status: text("status").default("active"), // "active" | "pending_review"
  requestedBy: text("requested_by"), // telegramId or null
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  sellerTelegramId: text("seller_telegram_id").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").default("INR"),
  stock: integer("stock").default(1),
  deliveryTime: text("delivery_time").default("Instant"),
  notes: text("notes"),
  status: text("status").default("active"), // "active" | "inactive"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketplaceOrders = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").unique().notNull(), // AEROX-XXXXX
  buyerTelegramId: text("buyer_telegram_id").notNull(),
  buyerUsername: text("buyer_username"),
  sellerTelegramId: text("seller_telegram_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productCategory: text("product_category").notNull(),
  price: integer("price").notNull(),
  status: text("status").default("pending"), // "pending" | "seller_accepted" | "waiting_payment" | "payment_verified" | "delivering" | "completed" | "cancelled" | "disputed"
  dealGroupLink: text("deal_group_link"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketplaceRatings = pgTable("marketplace_ratings", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  buyerTelegramId: text("buyer_telegram_id").notNull(),
  sellerTelegramId: text("seller_telegram_id").notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceFees = pgTable("marketplace_fees", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  amount: integer("amount").notNull(), // standard price
  fee: integer("fee").notNull(), // 5% fee
  sellerReceives: integer("seller_receives").notNull(), // 95%
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceNotifications = pgTable("marketplace_notifications", {
  id: serial("id").primaryKey(),
  telegramId: text("telegram_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "order" | "system" | "application"
  isRead: integer("is_read").default(0), // 0 or 1
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceStats = pgTable("marketplace_stats", {
  id: serial("id").primaryKey(),
  totalSales: integer("total_sales").default(0),
  totalVolume: integer("total_volume").default(0),
  totalCommission: integer("total_commission").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});


