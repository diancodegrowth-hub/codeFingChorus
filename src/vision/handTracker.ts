import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import type { NormalizedLandmark } from '@mediapipe/tasks-vision'
import { HAND_MODEL_URL, MEDIAPIPE_WASM_PATH } from '../config'
import { fingerPattern, readFingers } from './fingers'

export type Side = 'left' | 'right'

export interface TrackedHand {
  side: Side // tangan PENGGUNA (sudah dikoreksi dari efek cermin)
  pattern: string // "01100"
  landmarks: NormalizedLandmark[] // untuk digambar di layar
}

export async function createHandLandmarker(): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH)
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate },
    runningMode: 'VIDEO' as const,
    numHands: 2,
  })
  try {
    return await HandLandmarker.createFromOptions(fileset, options('GPU'))
  } catch {
    // Beberapa laptop/driver tidak mendukung WebGL untuk MediaPipe → pakai CPU.
    return await HandLandmarker.createFromOptions(fileset, options('CPU'))
  }
}

/**
 * Menentukan tangan mana yang kanan/kiri BERDASARKAN POSISI, bukan label handedness MediaPipe
 * (label itu sering tertukar untuk kamera yang tidak dicerminkan).
 * - 1 tangan terlihat → selalu dianggap tangan chord (kanan).
 * - 2 tangan → di frame kamera mentah, tangan kanan pengguna ada di sisi KIRI gambar (x lebih kecil).
 * `swap` membalik aturan 2 tangan kalau pengguna lebih suka sebaliknya.
 */
export function detectHands(
  landmarker: HandLandmarker,
  video: HTMLVideoElement,
  now: number,
  swap: boolean,
): TrackedHand[] {
  const result = landmarker.detectForVideo(video, now)
  const hands = result.landmarks.map((landmarks, i) => ({
    side: 'right' as Side,
    pattern: fingerPattern(readFingers(result.worldLandmarks[i])),
    landmarks,
  }))
  if (hands.length === 2) {
    const [a, b] = hands
    const aIsRight = a.landmarks[0].x < b.landmarks[0].x !== swap
    a.side = aIsRight ? 'right' : 'left'
    b.side = aIsRight ? 'left' : 'right'
  }
  return hands
}
