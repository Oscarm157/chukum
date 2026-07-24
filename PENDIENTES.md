# PENDIENTES

Hilo abierto del proyecto. Regla: al cambiar de contexto, dejar `git status` limpio o anotar aquí
qué quedó a medias, para no perder el hilo al volver.

## En curso
- [ ] Fase 2 de `/admin/keywords`: filtros y orden por cualquier columna, búsqueda por texto,
      selección múltiple de keywords (para armar grupos de anuncios), y estimados sobre la
      selección. Hoy la pantalla solo filtra por plaza y mercado, y ordena por volumen.

## Siguiente
- [ ] Filtrar el ruido de la tabla: hay keywords con competencia `UNSPECIFIED` y puja $0.00
      (Google no reporta datos). Conviene marcarlas o esconderlas por defecto.
- [ ] Estacionalidad: la serie de 12 meses ya está en la base (`kw_ideas.serie_12m`) pero no se
      muestra. Es lo que revela el ciclo de la costa (Cancún, Tulum).
- [ ] Forecast oficial de Google (`generate_keyword_forecast_metrics`) para contrastar la
      calculadora contra la proyección real, una vez elegido el set de keywords.
- [ ] Cuenta de Google Ads propia de Chukum, en MXN. Hoy las pujas salen en dólares porque se
      consulta con la cuenta de Prime Advisor (331-990-0995), que es USD.

## Decisiones tomadas
- (2026-07-24) El research NO vive en este repo: es público y los datos de mercado (11,123
  keywords con CPC y ranking de plazas) le sirven a cualquier competidor. Los CSV y el panorama
  quedan en `/root/google-ads-automation/data/`; a la base entra lo que consume el admin, y la
  base es privada.
- (2026-07-24) Las variantes de un mismo cluster se deduplican antes de sumar. Google reporta el
  mismo volumen para todas las variantes cercanas de una keyword, así que sumarlas infla el
  mercado tres o cuatro veces.
- (2026-07-24) La migración de las tablas `kw_*` va en `drizzle/kw_research.sql`, aparte del
  flujo de drizzle-kit: el journal viene desincronizado y una migración generada intentaría
  recrear leads/zonas/places.

## Bloqueos / dudas para el cliente
- (qué falta o qué confirmar)
