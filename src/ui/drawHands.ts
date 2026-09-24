import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import type { TrackedHand } from '../vision/handTracker'

const COLORS = { right: '#f5b841', left: '#5fd4c4' }

/** Gambar kerangka tangan. Canvas dicerminkan lewat CSS bersama video, jadi koordinat dipakai apa adanya. */
export function drawHands(ctx: CanvasRenderingContext2D, hands: TrackedHand[]): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const draw = new DrawingUtils(ctx)
  for (const hand of hands) {
    const color = COLORS[hand.side]
    draw.drawConnectors(hand.landmarks, HandLandmarker.HAND_CONNECTIONS, { color, lineWidth: 4 })
    draw.drawLandmarks(hand.landmarks, { color: '#ffffff', fillColor: color, radius: 4, lineWidth: 1 })
  }
}
