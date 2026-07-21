#!/usr/bin/env bash
# Mezcla el ambiente del home: olas domadas (sin golpeteo) + jazz de fondo, con fade in/out.
# Capas crudas en .ambient-cand/{waves,jazz}.wav (las genera gen-ambient.mjs vía Replicate).
# Perillas: WAVES_VOL y JAZZ_VOL. El golpeteo se mata con compresor de attack rápido + ratio alto
# + limiter + lowpass (baja el crest factor de ~12 a ~5). Uso: bash scripts/mix-ambient.sh
set -euo pipefail
cd "$(dirname "$0")/.."

WAVES_VOL="${WAVES_VOL:-0.42}"
JAZZ_VOL="${JAZZ_VOL:-0.39}"
OUT="public/hero/olas-bg.mp3"

DUR=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 .ambient-cand/waves.wav)
FOUT=$(python3 -c "print(round(${DUR}-3.2,2))")

ffmpeg -y -hide_banner -loglevel error \
  -i .ambient-cand/waves.wav -i .ambient-cand/jazz.wav \
  -filter_complex "\
[0:a]highpass=f=80,lowpass=f=1500,acompressor=threshold=-30dB:ratio=20:attack=1:release=120:makeup=6,dynaudnorm=f=150:g=11,alimiter=limit=0.9,volume=${WAVES_VOL}[w];\
[1:a]highpass=f=90,volume=${JAZZ_VOL}[j];\
[w][j]amix=inputs=2:duration=shortest:dropout_transition=0:normalize=0[m];\
[m]afade=t=in:st=0:d=2.5,afade=t=out:st=${FOUT}:d=3.2,loudnorm=I=-17:TP=-1.5:LRA=11[o]" \
  -map "[o]" -ar 44100 -b:a 160k "$OUT"

echo "OK -> $OUT (waves=${WAVES_VOL} jazz=${JAZZ_VOL})"
ffmpeg -hide_banner -i "$OUT" -af astats -f null /dev/null 2>&1 | grep -m1 "Crest factor"
