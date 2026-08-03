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
// Dimensiones del home/quiz (superset sobre el catálogo de la base).
export type Uso = "invertir" | "vivir";
export type MacroZona = "merida" | "costa" | "caribe" | "selva";
export type HighlightSpec = { label: string; value: string };

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
  // Encabezado de card para el home, SIN nombre de proyecto (restricción legal de publicidad).
  heading: text("heading"),
  zonaId: uuid("zona_id").references(() => zonas.id, { onDelete: "set null" }),
  city: text("city"),
  state: text("state"),
  country: text("country").default("MX").notNull(),
  // Macro-zona y usos: dimensiones del filtro/quiz del home (no confundir con zonaId SEO).
  macroZona: text("macro_zona").$type<MacroZona>(),
  usos: jsonb("usos").$type<Uso[]>(),
  propertyTypes: jsonb("property_types").$type<UnitType[]>(),
  statusMarketing: text("status_marketing").$type<DevelopmentStatus>(),
  descriptionEs: text("description_es"),
  descriptionEn: text("description_en"),
  amenities: jsonb("amenities").$type<string[]>(),
  // Bullets curados del home (ej. "Aparta con $10,000"). Solo cuando existen datos reales.
  highlightSpecs: jsonb("highlight_specs").$type<HighlightSpec[]>(),
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

// ---- Investigación de keywords (Google Keyword Planner por API) ----
// El motor vive fuera del repo (/root/google-ads-automation): consulta la API, deduplica
// clusters y escribe aquí. El admin solo lee. Los datos no se publican: el repo es público,
// la base no.
export type KwMercado = "nacional_es" | "extranjero_en";

export const kwRuns = pgTable("kw_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  brief: text("brief").notNull(), // nombre del brief que la generó
  mercado: text("mercado").$type<KwMercado>().notNull(),
  geo: text("geo").notNull(), // "México" / "Estados Unidos"
  idioma: text("idioma").notNull(),
  tipoCambio: numeric("tipo_cambio", { precision: 6, scale: 2 }),
  total: integer("total").notNull(),
  corridaEn: timestamp("corrida_en", { withTimezone: true }).defaultNow(),
});

export const kwIdeas = pgTable("kw_ideas", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id")
    .notNull()
    .references(() => kwRuns.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  plaza: text("plaza").notNull(),
  volumen: integer("volumen").notNull(),
  competencia: text("competencia").notNull(), // LOW | MEDIUM | HIGH
  indiceCompetencia: integer("indice_competencia"),
  pujaBajaUsd: numeric("puja_baja_usd", { precision: 8, scale: 2 }),
  pujaAltaUsd: numeric("puja_alta_usd", { precision: 8, scale: 2 }),
  variantes: integer("variantes").default(1).notNull(),
  serie12m: jsonb("serie_12m").$type<number[]>(),
});

export type KwRun = typeof kwRuns.$inferSelect;
export type KwIdea = typeof kwIdeas.$inferSelect;

// ---- Grupos de keywords (futuros grupos de anuncios) ----
// Varios grupos por ciudad, cada uno de un solo tema: es lo que Google Ads espera para que
// el anuncio hable de lo mismo que la keyword. El snapshot de métricas vive en el item para
// que el grupo sobreviva a una recorrida nueva del research.
export type KwTema = "terrenos" | "casas" | "departamentos" | "otro";
export type KwEstado = "borrador" | "listo" | "lanzado";

export const kwGrupos = pgTable("kw_grupos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  plaza: text("plaza").notNull(),
  tema: text("tema").$type<KwTema>().default("otro").notNull(),
  mercado: text("mercado").$type<KwMercado>().notNull(),
  estado: text("estado").$type<KwEstado>().default("borrador").notNull(),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const kwGrupoItems = pgTable("kw_grupo_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  grupoId: uuid("grupo_id")
    .notNull()
    .references(() => kwGrupos.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  volumen: integer("volumen").notNull(),
  cpc: numeric("cpc", { precision: 8, scale: 2 }),
  competencia: text("competencia").notNull(),
  agregadaEn: timestamp("agregada_en", { withTimezone: true }).defaultNow(),
});

export type KwGrupo = typeof kwGrupos.$inferSelect;
export type KwGrupoItem = typeof kwGrupoItems.$inferSelect;

// ---- Contenido social (Facebook/Instagram vía Post for Me) ----
// Todo post nace en `borrador` y solo una acción explícita de Oscar lo mueve a
// programado/publicado: nada sale a las redes sin revisión. `postForMeAccountId` es el id
// que Post for Me asigna a cada cuenta conectada; se sincroniza desde su API, no se escribe a mano.
export type SocialPlatform = "facebook" | "instagram";
export type SocialPostSource = "desarrollo" | "libre";
export type SocialPostStatus = "borrador" | "programado" | "publicado" | "error";
export type SocialPostFormat = "post" | "carrusel";
// "stories" con formato carrusel crearía N posts de story separados (así lo maneja Post
// for Me), no un carrusel: la UI debe forzar formato "post" cuando placement="stories".
export type SocialPostPlacement = "timeline" | "stories";

export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  platform: text("platform").$type<SocialPlatform>().notNull(),
  postForMeAccountId: text("post_for_me_account_id").notNull().unique(),
  username: text("username"),
  connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow(),
});

export const socialPosts = pgTable("social_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sourceType: text("source_type").$type<SocialPostSource>().notNull(),
  developmentId: uuid("development_id").references(() => developments.id, { onDelete: "set null" }),
  topic: text("topic"), // brief cuando la fuente es tema libre
  caption: text("caption").notNull(),
  // Imagen 1 / portada. Con formato "carrusel" las imágenes 2+ viven en socialPostImages.
  imageUrl: text("image_url").notNull(),
  imagePathname: text("image_pathname"),
  format: text("format").$type<SocialPostFormat>().default("post").notNull(),
  placement: text("placement").$type<SocialPostPlacement>().default("timeline").notNull(),
  platforms: jsonb("platforms").$type<string[]>().notNull(),
  status: text("status").$type<SocialPostStatus>().default("borrador").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  postForMeId: text("post_for_me_id"),
  errorMessage: text("error_message"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Imágenes 2+ de un post en formato "carrusel" (la imagen 1 es socialPosts.imageUrl).
// Mismo patrón que developmentImages: sortOrder, borrado en cascada con el post.
export const socialPostImages = pgTable("social_post_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => socialPosts.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  pathname: text("pathname"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Perfil de vendedor para la firma opcional del overlay de texto (nombre/teléfono/foto
// insertados automático en cualquier plantilla). Uno "activo" a la vez; no hay selector
// por post, la firma siempre usa el perfil activo del momento.
export const agentProfiles = pgTable("agent_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  photoPathname: text("photo_pathname"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type SocialPost = typeof socialPosts.$inferSelect;
export type SocialPostImage = typeof socialPostImages.$inferSelect;
export type AgentProfile = typeof agentProfiles.$inferSelect;
