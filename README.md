# codeFingerNote

Mainkan chord string ensemble dengan gesture jari lewat kamera. Semua diproses di browser — tanpa backend.

## Menjalankan

```powershell
npm.cmd install
npm.cmd run dev
```

Buka `http://localhost:5173` di Chrome/Edge, klik **Mulai kamera & suara**, izinkan kamera.

## Gesture (kunci default G)

| Tangan kanan | Angka | Chord |
|---|---|---|
| telunjuk | I | G |
| telunjuk + tengah | II | Am |
| telunjuk + tengah + manis | III | Bm |
| 4 jari tanpa jempol | IV | C |
| semua jari | V | D |
| jempol | VI | Em |
| jempol + telunjuk | VII | F#dim |
| kepal / tangan keluar kamera | — | diam |

Tangan kiri: **jempol** = paksa mayor (mis. III → B), **kelingking** = paksa minor (mis. IV → Cm).

## Alur kerja

```
kamera → MediaPipe HandLandmarker (21 titik/tangan) → baca jari (vision/fingers.ts)
       → gesture → angka chord (vision/gesture.ts) → stabilizer (engine/stabilizer.ts)
       → teori chord (music/theory.ts) → synth Tone.js (audio/instrument.ts + audio/presets.ts)
```

## Struktur

| Folder | Isi |
|---|---|
| `src/camera` | buka/tutup kamera, pesan error |
| `src/vision` | MediaPipe, pembaca jari, tabel gesture |
| `src/music` | skala mayor, triad, nama chord — logika murni |
| `src/audio` | synth + preset instrumen (String ensemble, Orgel) — tambah preset baru di `presets.ts` |
| `src/engine` | loop utama + stabilizer |
| `src/ui` | gambar kerangka tangan |
| `src/config.ts` | semua angka yang bisa di-tuning |

## Tuning

Kalau deteksi jari kurang pas, ubah `FINGER_THRESHOLDS` di `src/config.ts`.
Kalau terasa lambat/terlalu sensitif saat ganti chord, ubah `STABILITY_MS`.
Kalau kiri/kanan terbaca terbalik, centang **Tukar kiri/kanan** di panel.
