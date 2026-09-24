import type { Degree, QualityModifier } from '../music/theory'

// Pola jari: [jempol, telunjuk, tengah, manis, kelingking]

/** Tangan kanan → angka chord. */
const RIGHT_HAND_DEGREES: Record<string, Degree> = {
  '01000': 1, // telunjuk
  '01100': 2, // telunjuk + tengah
  '01110': 3, // telunjuk + tengah + manis
  '01111': 4, // 4 jari tanpa jempol
  '11111': 5, // semua jari
  '10000': 6, // jempol
  '11000': 7, // jempol + telunjuk
}

/** Tangan kiri → pengubah kualitas. */
const LEFT_HAND_MODIFIERS: Record<string, QualityModifier> = {
  '10000': 'major', // jempol
  '00001': 'minor', // kelingking
}

/**
 * Hasil membaca tangan kanan:
 * - Degree   → chord 1–7
 * - 'release'→ kepal atau tangan tidak terlihat → hentikan bunyi
 * - 'unknown'→ pola di luar tabel (sering muncul sesaat saat jari berpindah) → pertahankan bunyi sekarang
 */
export type RightHandReading = Degree | 'release' | 'unknown'

export function readRightHand(pattern: string | null): RightHandReading {
  if (pattern === null || pattern === '00000') return 'release'
  return RIGHT_HAND_DEGREES[pattern] ?? 'unknown'
}

export function readLeftHand(pattern: string | null): QualityModifier {
  if (pattern === null) return 'default'
  return LEFT_HAND_MODIFIERS[pattern] ?? 'default'
}
