import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export type UserRole = "admin" | "agent" | "viewer";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().default("agent").notNull(),
  active: boolean("active").default(true).notNull(),
  mustChangePassword: boolean("must_change_password").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;

// ===== Plantilla de módulo de dominio (capa 3, bespoke por cliente) =====
// `items` demuestra el patrón CRUD + estados. Renómbrala/duplícala para tu entidad
// real (propiedades, productos, servicios) o bórrala si no la usas.
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type Item = typeof items.$inferSelect;
