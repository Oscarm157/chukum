// Tira de azulejos bajo secciones del home. Dos modos:
//  - imagen (default): marquee horizontal con copias espejadas (loop sin costura). Recorta a 1
//    fila mostrando solo la primera de `rows` filas de la imagen (alto imagen = banda × rows).
//  - video: un loop full-bleed (olas "avanzando") recortado a la misma altura de tira. El
//    movimiento lo da el propio video; sin marquee.
// `reverse` invierte la dirección del marquee (para alternar tiras). Decorativa (aria-hidden).

type Props = {
  src: string; // imagen (o poster si hay video)
  rows?: number; // nº de filas de azulejos en la imagen (para recortar a 1)
  reverse?: boolean; // dirección del marquee (imagen)
  video?: { webm?: string; mp4?: string }; // si viene, la tira es video
};

const BAND_PX = 104; // alto de la tira (1 fila)

export function TileBand({ src, rows = 5, reverse = false, video }: Props) {
  if (video) {
    // Video fijo full-bleed (sin marquee): el movimiento lo dan las olas del propio clip.
    return (
      <section aria-hidden className="overflow-hidden border-y border-hairline bg-espresso" style={{ height: BAND_PX }}>
        <video autoPlay muted loop playsInline poster={src} className="h-full w-full object-cover">
          {video.mp4 && <source src={video.mp4} type="video/mp4" />}
          {video.webm && <source src={video.webm} type="video/webm" />}
        </video>
      </section>
    );
  }

  const imgH = BAND_PX * rows; // la banda recorta la primera fila
  const img = (mirror: boolean) => (
    <img
      src={src}
      alt=""
      draggable={false}
      className={`w-auto max-w-none select-none${mirror ? " -scale-x-100" : ""}`}
      style={{ height: imgH }}
    />
  );
  const Unit = () => (
    <div className="flex shrink-0">
      {img(false)}
      {img(true)}
    </div>
  );

  return (
    <section aria-hidden className="overflow-hidden border-y border-hairline bg-canvas" style={{ height: BAND_PX }}>
      <div className={`tile-marquee-track flex w-max${reverse ? " tile-marquee-reverse" : ""}`}>
        <Unit />
        <Unit />
      </div>
    </section>
  );
}
