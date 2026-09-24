import type { Landmark } from '@mediapipe/tasks-vision'
import { FINGER_THRESHOLDS } from '../config'

/** Urutan tetap: [jempol, telunjuk, tengah, manis, kelingking]. */
export type FingerStates = [boolean, boolean, boolean, boolean, boolean]

// Indeks landmark MediaPipe (21 titik per tangan).
const WRIST = 0
const THUMB_IP = 3
const THUMB_TIP = 4
const PINKY_MCP = 17
/** [ruas tengah (PIP), ujung (TIP)] untuk telunjuk, tengah, manis, kelingking. */
const FINGER_JOINTS: [number, number][] = [
  [6, 8],
  [10, 12],
  [14, 16],
  [18, 20],
]

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/**
 * Menentukan jari mana yang terangkat. Memakai worldLandmarks (3D, satuan meter)
 * supaya hasilnya tidak berubah karena rasio layar atau jarak tangan ke kamera.
 */
export function readFingers(world: Landmark[]): FingerStates {
  const wrist = world[WRIST]

  // Telunjuk–kelingking: jari lurus → ujungnya jauh lebih jauh dari pergelangan
  // dibanding ruas tengahnya. Jari menekuk → ujung melipat balik, bahkan lebih dekat.
  const fingers = FINGER_JOINTS.map(
    ([pip, tip]) =>
      dist(wrist, world[tip]) > dist(wrist, world[pip]) * FINGER_THRESHOLDS.fingerExtendedRatio,
  )

  // Jempol menekuk ke samping (menyeberangi telapak), bukan ke bawah, jadi aturan di atas tidak berlaku.
  // Patokannya pangkal kelingking: jempol terlipat → ujungnya bergerak MENDEKATI sisi kelingking,
  // lebih dekat dari ruas IP-nya sendiri. Jempol terangkat → ujungnya lebih jauh dari ruas IP.
  const pinkyMcp = world[PINKY_MCP]
  const thumb = dist(world[THUMB_TIP], pinkyMcp) > dist(world[THUMB_IP], pinkyMcp) * FINGER_THRESHOLDS.thumbExtendedRatio

  return [thumb, ...fingers] as FingerStates
}

/** "01100" = telunjuk + tengah. Enak untuk dicocokkan dan ditampilkan di debug. */
export function fingerPattern(states: FingerStates): string {
  return states.map((s) => (s ? '1' : '0')).join('')
}
