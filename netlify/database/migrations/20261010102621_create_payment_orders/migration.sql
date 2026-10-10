CREATE TABLE "orders" (
	"id" text PRIMARY KEY,
	"token_hash" text NOT NULL,
	"customer" jsonb NOT NULL,
	"items" jsonb NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"method" text,
	"reference" text UNIQUE,
	"authorization_url" text,
	"proof_key" text,
	"notified_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
