"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

// Ambiente de fondo: mar constante y sutil + jazz muy bajo (~48s en loop continuo). Los navegadores
// bloquean el autoplay con sonido, así que arranca en la PRIMERA interacción del usuario
// (click/scroll/tecla) a volumen bajo. Botón flotante para silenciar/reanudar. Hace loop.
export function AmbientAudio() {
  const ref = useRef<HTMLAudioElement>(null);
  const started = useRef(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.volume = 0.18;
    // Arranca por default; si el navegador bloquea el autoplay con sonido, cae a la 1ª interacción.
    el.play().then(() => {
      started.current = true;
      setOn(true);
    }).catch(() => {});
    const start = () => {
      if (started.current) return;
      started.current = true;
      el.play().then(() => setOn(true)).catch(() => {});
      remove();
    };
    const remove = () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
      window.removeEventListener("scroll", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("scroll", start, { passive: true });
    return remove;
  }, []);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    started.current = true;
    if (on) {
      el.pause();
      setOn(false);
    } else {
      if (el.ended) el.currentTime = 0;
      el.play().then(() => setOn(true)).catch(() => {});
    }
  }

  return (
    <>
      <audio ref={ref} src="/hero/olas-bg.mp3?v=8" preload="auto" loop />
      <button
        onClick={toggle}
        aria-label={on ? "Silenciar olas" : "Escuchar olas"}
        className="fixed bottom-20 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-canvas/90 text-ink shadow-[0_8px_30px_-12px_rgba(30,26,22,0.4)] backdrop-blur-md transition hover:text-cenote md:bottom-6 md:left-6"
      >
        {on ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>
    </>
  );
}
