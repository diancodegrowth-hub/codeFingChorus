// Semua angka yang bisa di-tuning dikumpulkan di satu tempat.

/** File WASM MediaPipe disalin dari node_modules ke public/ oleh scripts/copy-mediapipe-wasm.mjs */
export const MEDIAPIPE_WASM_PATH = '/mediapipe/wasm'

/** Model deteksi tangan resmi dari Google (diunduh browser saat aplikasi dibuka). */
export const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

export const DEFAULT_KEY = 'G'

/** Ambang deteksi jari (satuan: rasio, bukan piksel — lihat vision/fingers.ts). */
export const FINGER_THRESHOLDS = {
  /** Jari (telunjuk–kelingking) dianggap lurus jika jarak pergelangan→ujung > rasio ini × jarak pergelangan→ruas tengah. */
  fingerExtendedRatio: 1.15,
  /** Jempol dianggap terangkat jika jarak ujung jempol→pangkal kelingking > rasio ini × jarak ruas IP jempol→pangkal kelingking. */
  thumbExtendedRatio: 1.1,
}

/** Stabilizer: berapa lama (ms) sebuah gesture harus bertahan sebelum dianggap sah. */
export const STABILITY_MS = {
  change: 120, // pindah ke chord lain
  release: 220, // berhenti bunyi (kepal / tangan hilang) — sedikit lebih lama karena deteksi kadang "kedip"
}
