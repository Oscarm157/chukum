import { pgTable, uuid, text, boolean, timestamp, jsonb, integer, numeric } from "drizzle-orm/pg-core";

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

// ===== Dominio: catálogo de propiedades que comercializa Chukum (capa 3, bespoke) =====
// `developments` = el proyecto/desarrollo (ej. Xo'ok). `units` = unidad individual
// vendible (terreno/casa/depa) con precio y m2 reales — se llena con el Excel/PDF
// real de Oscar, NO con material de marketing sin verificar.

export type UnitType = "terreno" | "casa" | "departamento" | "townhouse" | "local_comercial";
export type UnitStatus = "disponible" | "apartado" | "vendido";
export type DevelopmentStatus = "preventa" | "en_construccion" | "entrega_inmediata" | "vendido";
export type DataSource = "scrape" | "oscar_manual" | "excel_import" | "curado";
export type ImageKind = "hero" | "gallery" | "floorplan" | "logo";

// ===== Capa SEO: zonas/colonias de Yucatán (páginas programáticas) =====
// Cada zona alimenta /zonas/[slug]. Gate anti thin-content: solo se publica
// (`publicada`) si tiene data real (precio/plusvalía) o un desarrollo colgado.
export const zonas = pgTable("zonas", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  nombre: text("nombre").notNull(),
  descripcionEs: text("descripcion_es"),
  descripcionEn: text("descripcion_en"),
  precioM2Mxn: integer("precio_m2_mxn"),
  plusvaliaAnual: numeric("plusvalia_anual"), // % anual histórico
  perfilComprador: text("perfil_comprador"),
  amenidades: jsonb("amenidades").$type<string[]>(),
  lat: numeric("lat"),
  lng: numeric("lng"),
  publicada: boolean("publicada").default(false).notNull(),
  dataSource: text("data_source").$type<DataSource>().default("curado").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Zona = typeof zonas.$inferSelect;

export const developments = pgTable("developments", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  zonaId: uuid("zona_id").references(() => zonas.id, { onDelete: "set null" }),
  city: text("city"),
  state: text("state"),
  country: text("country").default("MX").notNull(),
  propertyTypes: jsonb("property_types").$type<UnitType[]>(),
  statusMarketing: text("status_marketing").$type<DevelopmentStatus>(),
  descriptionEs: text("description_es"),
  descriptionEn: text("description_en"),
  amenities: jsonb("amenities").$type<string[]>(),
  sourceUrlEs: text("source_url_es"),
  sourceUrlEn: text("source_url_en"),
  dataSource: text("data_source").$type<DataSource>().default("scrape").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Development = typeof developments.$inferSelect;

export const developmentImages = pgTable("development_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  developmentId: uuid("development_id")
    .notNull()
    .references(() => developments.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname"),
  sourceUrl: text("source_url"),
  alt: text("alt"),
  kind: text("kind").$type<ImageKind>().default("gallery").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type DevelopmentImage = typeof developmentImages.$inferSelect;

export const units = pgTable("units", {
  id: uuid("id").primaryKey().defaultRandom(),
  developmentId: uuid("development_id")
    .notNull()
    .references(() => developments.id, { onDelete: "cascade" }),
  unitCode: text("unit_code"),
  unitType: text("unit_type").$type<UnitType>().notNull(),
  status: text("status").$type<UnitStatus>().default("disponible").notNull(),
  areaM2: numeric("area_m2"),
  priceMxn: integer("price_mxn"),
  priceUsd: integer("price_usd"),
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms"),
  levels: integer("levels"),
  reservationAmountMxn: integer("reservation_amount_mxn"),
  downPaymentPercent: numeric("down_payment_percent"),
  notes: text("notes"),
  dataSource: text("data_source").$type<DataSource>().default("oscar_manual").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Unit = typeof units.$inferSelect;

// ===== Captura de leads (form público + WhatsApp) =====
// El lead lo queda Oscar primero; el status `enviado_crm` marca el hand-off manual al CRM
// del desarrollador. UTM + atribución por zona/desarrollo para medir qué página convierte.
export type LeadSource = "form" | "whatsapp" | "manual";
export type LeadStatus = "nuevo" | "contactado" | "enviado_crm" | "cerrado";

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  message: text("message"),
  locale: text("locale").default("es").notNull(),
  source: text("source").$type<LeadSource>().default("form").notNull(),
  sourceUrl: text("source_url"), // página que originó el lead
  zonaSlug: text("zona_slug"), // atribución opcional
  developmentSlug: text("development_slug"),
  utmSource: text("utm_source"),
  utmCampaign: text("utm_campaign"),
  utmMedium: text("utm_medium"),
  status: text("status").$type<LeadStatus>().default("nuevo").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Lead = typeof leads.$inferSelect;

// ---- Comentarios del sitio (widget de anotaciones tipo BugHerd) ----
export type FeedbackStatus = "open" | "resolved";

// Enlaces de feedback: un token por ronda de revisión. El widget del sitio solo aparece
// si la URL trae un token activo (?fb=). Se crean/revocan desde /admin/feedback.
export const feedbackLinks = pgTable("feedback_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  label: text("label").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Notas anónimas que se dejan al hacer click en el sitio, con contexto del elemento y
// posición en el documento para ubicar el pin.
export const feedbackNotes = pgTable("feedback_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id")
    .notNull()
    .references(() => feedbackLinks.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  note: text("note").notNull(),
  selector: text("selector"),
  elementText: text("element_text"),
  xPct: integer("x_pct"),
  yPct: integer("y_pct"),
  viewportW: integer("viewport_w"),
  pageTitle: text("page_title"),
  status: text("status").$type<FeedbackStatus>().default("open").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
