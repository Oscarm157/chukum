// Agrega a `developments` las columnas que el home necesita (superset sobre el
// catálogo). No destructivo: ADD COLUMN IF NOT EXISTS, todas nullable. Idempotente.
// Correr con:  node --env-file=.env.local scripts/add-home-columns.mjs
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `ALTER TABLE "developments" ADD COLUMN IF NOT EXISTS "heading" text`,
  `ALTER TABLE "developments" ADD COLUMN IF NOT EXISTS "macro_zona" text`,
  `ALTER TABLE "developments" ADD COLUMN IF NOT EXISTS "usos" jsonb`,
  `ALTER TABLE "developments" ADD COLUMN IF NOT EXISTS "highlight_specs" jsonb`,
];

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("ok:", stmt);
}
console.log("Listo. developments extendida.");
