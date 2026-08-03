-- v2.0 del módulo de contenido social: carrusel + formato/placement. Mismo criterio que
-- social_content.sql: SQL suelto e idempotente, no generado por drizzle-kit (el journal
-- sigue desincronizado de prod, ver encabezado de kw_research.sql).
ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "format" text DEFAULT 'post' NOT NULL;
ALTER TABLE "social_posts" ADD COLUMN IF NOT EXISTS "placement" text DEFAULT 'timeline' NOT NULL;

CREATE TABLE IF NOT EXISTS "social_post_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL REFERENCES "social_posts"("id") ON DELETE CASCADE,
	"url" text NOT NULL,
	"pathname" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
