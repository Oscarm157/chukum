// Datos del mapa de la península en /vivir-en-merida/mapa. Client-safe: sin dependencias de
// servidor, mismo criterio que developments.ts. Coordenadas de los 5 desarrollos verificadas
// contra el mapa de referencia del desarrollador y contra Google Maps (Oscar), no inventadas.
//
// EXCEPCIÓN a la restricción de marca de CLAUDE.md: por instrucción directa de Oscar, esta
// página SÍ muestra el nombre comercial real de cada desarrollo (`name`), público, sin gate de
// admin. Es la única vista del sitio donde aplica esta excepción; en el resto del sitio sigue
// vigente la restricción (ver AdminDevName).

export type ProjectPin = {
  slug: string; // debe existir en DEVELOPMENTS (developments.ts)
  name: string; // nombre comercial real, público en esta página por decisión de Oscar
  lng: number;
  lat: number;
};

export const PROJECT_PINS: ProjectPin[] = [
  { slug: "selva-maya", name: "Xo'ok", lng: -89.582455, lat: 21.068125 },
  { slug: "norte-de-merida", name: "Ciudad Central Mérida", lng: -89.4708596, lat: 21.0119098 },
  { slug: "progreso-frente-al-mar", name: "Ciudad Central Progreso", lng: -89.6124647, lat: 21.1805616 },
  { slug: "playa-del-carmen", name: "Ukana", lng: -87.0363188, lat: 20.6717094 },
  { slug: "tulum", name: "Tulum Ha", lng: -87.4782496, lat: 20.1945349 },
];

export type PoiCategory = "aeropuerto" | "salud" | "educacion" | "retail" | "ocio" | "naturaleza";

export type Poi = {
  name: string;
  lng: number;
  lat: number;
  category: PoiCategory;
  blurb: string;
};

export const POI_LABEL: Record<PoiCategory, string> = {
  aeropuerto: "Aeropuerto",
  salud: "Salud",
  educacion: "Educación",
  retail: "Centros comerciales",
  ocio: "Ocio y deporte",
  naturaleza: "Playas y naturaleza",
};

// Curado de puntos de interés reales alrededor de las 4 zonas donde Chukum comercializa
// (Mérida norte, Progreso, Tulum, Playa del Carmen). Fuente: mapa de referencia del
// desarrollador + geografía pública conocida (aeropuertos). Sin cifras inventadas.
export const POIS: Poi[] = [
  // Mérida
  { name: "Aeropuerto Internacional de Mérida", lng: -89.6577, lat: 20.937, category: "aeropuerto", blurb: "Aeropuerto Manuel Crescencio Rejón, conexión nacional e internacional." },
  { name: "Costco Mérida", lng: -89.6296245, lat: 21.0372415, category: "retail", blurb: "" },
  { name: "La Isla Shopping Mall Mérida", lng: -89.5966798, lat: 21.0564312, category: "retail", blurb: "" },
  { name: "Harbor Lifestyle Mall", lng: -89.6304234, lat: 21.0462902, category: "retail", blurb: "Plaza comercial y restaurantes en el norte de la ciudad." },
  { name: "Hospital Faro del Mayab (Christus Muguerza)", lng: -89.6017224, lat: 21.0439496, category: "salud", blurb: "" },
  { name: "Universidad Marista de Mérida", lng: -89.623905, lat: 21.052306, category: "educacion", blurb: "" },
  { name: "UADY, Facultad de Matemáticas", lng: -89.6444655, lat: 21.0482384, category: "educacion", blurb: "" },
  { name: "Monumento a la Patria", lng: -89.6168234, lat: 20.9904851, category: "ocio", blurb: "Referencia histórica del Paseo de Montejo." },
  // Progreso
  { name: "Malecón de Progreso", lng: -89.6624, lat: 21.2925, category: "naturaleza", blurb: "Frente de playa y muelle del puerto de Progreso." },
  // Tulum
  { name: "Aeropuerto de Tulum", lng: -87.6590147, lat: 20.1700981, category: "aeropuerto", blurb: "En operación desde 2023, segundo aeropuerto más grande de la península." },
  { name: "Zona Arqueológica de Tulum", lng: -87.429404, lat: 20.2149665, category: "ocio", blurb: "" },
  { name: "Reserva de la biosfera de Sian Ka'an", lng: -87.6241452, lat: 20.0636941, category: "naturaleza", blurb: "Patrimonio de la Humanidad (UNESCO), sur de Tulum." },
  { name: "Playa Paraíso", lng: -87.4331381, lat: 20.2037676, category: "naturaleza", blurb: "" },
  { name: "Cenote Corazón del Paraíso", lng: -87.5174971, lat: 20.1827961, category: "naturaleza", blurb: "" },
  { name: "Parque El Jaguar", lng: -87.4430485, lat: 20.1885599, category: "naturaleza", blurb: "Reserva de preservación ambiental y cultural, 1,000 hectáreas." },
  // Playa del Carmen / Riviera Maya
  { name: "Aeropuerto Internacional de Cancún", lng: -86.8881254, lat: 21.0620449, category: "aeropuerto", blurb: "" },
  { name: "Campo de golf El Camaleón", lng: -87.0310713, lat: 20.6909026, category: "ocio", blurb: "Único campo de golf del PGA Tour en Latinoamérica." },
];

export type PlusvaliaZona = {
  nombre: string;
  descripcion: string;
};

// Clasificación de zonas de Mérida por madurez/plusvalía, tal como la usa el desarrollador
// para orientar inversión. Es la única ciudad con este dato en la fuente; no se inventa para
// las otras 3. Texto editado por claridad, mismo sentido del original.
export const PLUSVALIA_MERIDA: PlusvaliaZona[] = [
  { nombre: "Centro y colonias antiguas", descripcion: "Alta plusvalía consolidada, zona histórica de la ciudad." },
  { nombre: "Residenciales de lujo en crecimiento", descripcion: "El segmento de más alto lujo en Mérida; la plusvalía se sigue potenciando conforme la zona madura." },
  { nombre: "Norte, lujo medio-alto en madurez", descripcion: "Buen poder adquisitivo, zona ya detonada y todavía en crecimiento." },
  { nombre: "Zonas emergentes", descripcion: "Hacia donde se dirige el crecimiento de la ciudad; ahí están desarrollos de nivel medio-alto como Parque Natura y Parque Central." },
  { nombre: "Top plusvalía, madurez inmobiliaria", descripcion: "Las zonas de mayor madurez del mercado inmobiliario de la ciudad." },
];
