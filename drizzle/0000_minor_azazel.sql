CREATE TABLE "mailboxes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"provider" text DEFAULT 'Mail.tm',
	"email" text,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"created_at" timestamp DEFAULT now(),
	"last_access" timestamp DEFAULT now(),
	"last_refresh" timestamp DEFAULT now(),
	"status" text DEFAULT 'active',
	CONSTRAINT "mailboxes_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "redeem_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"credits" integer DEFAULT 0,
	"expires_at" text,
	"max_uses" integer DEFAULT 1,
	"used_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"created_by" text,
	"plan" text,
	"role" text,
	"duration_days" integer,
	CONSTRAINT "redeem_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text,
	"telegram_id" text,
	"username" text,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" text,
	"username" text,
	"first_name" text,
	"role" text DEFAULT 'free',
	"plan" text DEFAULT 'free',
	"credits" integer DEFAULT 20,
	"joined_at" text,
	"last_active" text,
	"photo_url" text,
	"total_recoveries" integer DEFAULT 0,
	"referrer_id" text,
	"credit_reset_time" text,
	"plan_expiry" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_user_id_users_telegram_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("telegram_id") ON DELETE no action ON UPDATE no action;