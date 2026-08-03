-- Tablas del módulo de contenido social (Facebook/Instagram vía Post for Me).
-- Se aplican aparte, igual que kw_research.sql: el journal de drizzle sigue en 0000 y una
-- migración generada intentaría recrear zonas/leads/kw_*/guides/places y volver a agregar
-- columnas de developments que ya existen, así que fallaría al aplicarse.
CREATE TABLE IF NOT EXISTS "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"post_for_me_account_id" text NOT NULL,
	"username" text,
	"connected_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "social_accounts_post_for_me_account_id_unique" UNIQUE("post_for_me_account_id")
);

CREATE TABLE IF NOT EXISTS "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" text NOT NULL,
	"development_id" uuid REFERENCES "developments"("id") ON DELETE SET NULL,
	"topic" text,
	"caption" text NOT NULL,
	"image_url" text NOT NULL,
	"image_pathname" text,
	"platforms" jsonb NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"post_for_me_id" text,
	"error_message" text,
	"created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
