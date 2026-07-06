import { neon } from "@neondatabase/serverless";

// Siembra el piloto: zona "Mérida Norte" + desarrollo "Ciudad Central Mérida".
// Idempotente por slug. Data real del sitio de Orve; precio/m²/ubicación exacta = verified:false.
const sql = neon(process.env.DATABASE_URL);

const zonaDescripcion =
  "El norte de Mérida es el corredor de mayor crecimiento de la ciudad: nuevos fraccionamientos y desarrollos residenciales conectados al periférico, a minutos de plazas comerciales, universidades y hospitales. Es donde se concentra la inversión en terreno y vivienda nueva; la plusvalía y proyección se confirman con cada desarrollador.";
const zonaPerfil =
  "Inversión en terreno y vivienda nueva; familias que buscan fraccionamiento con amenidades y compradores que buscan plusvalía a futuro en el corredor de crecimiento.";

const devDescripcion =
  "Desarrollo conectado al periférico de Mérida, a minutos de las plazas comerciales y universidades más importantes. Ofrece terrenos residenciales, townhouses y departamentos dentro de un entorno con casas club, áreas verdes y servicios subterráneos.";
const devAmenities = [
  "Áreas verdes",
  "Casas club",
  "Piscinas y terrazas",
  "Canchas deportivas",
  "Ciclovías",
  "Zonas de juegos y lectura",
  "Acceso controlado",
  "Vigilancia 24/7",
  "Calles pavimentadas",
  "Servicios subterráneos",
];
const devTypes = ["terreno", "townhouse", "departamento"];

// 1) Zona
let zona = await sql`select id from zonas where slug = 'merida-norte'`;
if (!zona.length) {
  zona = await sql`
    insert into zonas (slug, nombre, descripcion_es, perfil_comprador, publicada, data_source, verified)
    values ('merida-norte', 'Mérida Norte', ${zonaDescripcion}, ${zonaPerfil}, true, 'curado', false)
    returning id`;
  console.log("zona Mérida Norte creada");
} else {
  console.log("zona Mérida Norte ya existe");
}
const zonaId = zona[0].id;

// 2) Desarrollo
let dev = await sql`select id from developments where slug = 'ciudad-central-merida'`;
if (!dev.length) {
  dev = await sql`
    insert into developments
      (slug, name, zona_id, city, state, country, property_types, status_marketing,
       description_es, amenities, source_url_es, data_source, verified)
    values
      ('ciudad-central-merida', 'Ciudad Central Mérida', ${zonaId}, 'Mérida', 'Yucatán', 'MX',
       ${JSON.stringify(devTypes)}::jsonb, 'preventa', ${devDescripcion},
       ${JSON.stringify(devAmenities)}::jsonb, 'https://www.grupoorve.com/ciudad-central-merida/',
       'grupoorve_scrape', false)
    returning id`;
  console.log("desarrollo Ciudad Central Mérida creado");
} else {
  console.log("desarrollo Ciudad Central Mérida ya existe");
}
const devId = dev[0].id;

// 3) Imágenes (locales, reales del sitio de Orve)
const imgs = await sql`select id from development_images where development_id = ${devId}`;
if (!imgs.length) {
  await sql`
    insert into development_images (development_id, url, pathname, source_url, alt, kind, sort_order)
    values
      (${devId}, '/desarrollos/ciudad-central-merida/casa-club.jpg',
       '/desarrollos/ciudad-central-merida/casa-club.jpg',
       'https://www.grupoorve.com/ciudad-central-merida/',
       'Casa club con alberca en Ciudad Central Mérida', 'hero', 0),
      (${devId}, '/desarrollos/ciudad-central-merida/masterplan.jpg',
       '/desarrollos/ciudad-central-merida/masterplan.jpg',
       'https://www.grupoorve.com/ciudad-central-merida/',
       'Masterplan de Ciudad Central Mérida', 'gallery', 1)`;
  console.log("2 imágenes de Ciudad Central Mérida creadas");
} else {
  console.log("imágenes ya existen");
}

console.log("seed piloto listo.");
