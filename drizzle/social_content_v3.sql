-- v3 del módulo de contenido social: perfil de vendedor para la firma del overlay.
-- Mismo criterio que social_content.sql / social_content_v2.sql: SQL suelto e
-- idempotente, no generado por drizzle-kit (journal desincronizado de prod).
CREATE TABLE IF NOT EXISTS "agent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"photo_url" text,
	"photo_pathname" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
