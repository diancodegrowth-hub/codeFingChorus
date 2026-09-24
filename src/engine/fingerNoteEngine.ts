import type { HandLandmarker } from '@mediapipe/tasks-vision'
import { Instrument } from '../audio/instrument'
import { DEFAULT_INSTRUMENT } from '../audio/presets'
import type { InstrumentId } from '../audio/presets'
import { buildChord } from '../music/theory'
import type { Chord, QualityModifier } from '../music/theory'
import { drawHands } from '../ui/drawHands'
import { readLeftHand, readRightHand } from '../vision/gesture'
import { detectHands } from '../vision/handTracker'
import { Stabilizer } from './stabilizer'

/** Snapshot ringan untuk React. Hanya dikirim saat isinya berubah, bukan tiap frame. */
export interface EngineState {
  chord: Chord | null // chord yang sedang berbunyi
  rightPattern: string | null
  leftPattern: string | null
  modifier: QualityModifier
}

/**
 * Loop utama: kamera → deteksi → gesture → stabilizer → audio.
 * Sengaja di luar React: berjalan ~30x/detik dan tidak boleh memicu re-render tiap frame.
 */
export class FingerNoteEngine {
  key: string
  swapHands = false

  private landmarker: HandLandmarker
  private video: HTMLVideoElement
  private ctx: CanvasRenderingContext2D
  private onState: (s: EngineState) => void
  private audio = new Instrument(DEFAULT_INSTRUMENT)
  private stabilizer = new Stabilizer()
  private rafId = 0
  private lastVideoTime = -1
  private playingName = 'silence'
  private chords = new Map<string, Chord>()
  private lastSnapshot = ''

  constructor(
    landmarker: HandLandmarker,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    key: string,
    onState: (s: EngineState) => void,
  ) {
    this.landmarker = landmarker
    this.video = video
    this.ctx = canvas.getContext('2d')!
    this.key = key
    this.onState = onState
  }

  start(): void {
    const loop = () => {
      this.tick()
      this.rafId = requestAnimationFrame(loop)
    }
    this.rafId = requestAnimationFrame(loop)
  }

  /** Ganti suara. Chord yang sedang ditahan langsung dibunyikan ulang dengan instrumen baru. */
  setInstrument(id: InstrumentId): void {
    this.audio.setPreset(id)
    // Stabilizer masih memegang chord yang sama → frame berikutnya melihat "berubah" dan memicu ulang.
    this.playingName = 'silence'
  }

  stop(): void {
    cancelAnimationFrame(this.rafId)
    this.audio.dispose()
  }

  private tick(): void {
    const { video } = this
    // Layar bisa refresh 60–144 Hz, kamera ~30 fps: jangan proses frame yang sama dua kali.
    if (video.readyState < 2 || video.currentTime === this.lastVideoTime) return
    this.lastVideoTime = video.currentTime

    const canvas = this.ctx.canvas
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    const now = performance.now()
    const hands = detectHands(this.landmarker, video, now, this.swapHands)
    drawHands(this.ctx, hands)

    const right = hands.find((h) => h.side === 'right')?.pattern ?? null
    const left = hands.find((h) => h.side === 'left')?.pattern ?? null
    const reading = readRightHand(right)
    const modifier = readLeftHand(left)

    // Tentukan target mentah frame ini.
    let target: string
    if (reading === 'release') {
      target = 'silence'
    } else if (reading === 'unknown') {
      target = this.playingName // pola transisi → pertahankan yang sekarang
    } else {
      const chord = buildChord(this.key, reading, modifier)
      this.chords.set(chord.name, chord)
      target = chord.name
    }

    const committed = this.stabilizer.update(target, now)
    if (committed !== this.playingName) {
      this.playingName = committed
      if (committed === 'silence') this.audio.stop()
      else this.audio.play(this.chords.get(committed)!.notes)
    }

    this.emit({
      chord: this.playingName === 'silence' ? null : this.chords.get(this.playingName)!,
      rightPattern: right,
      leftPattern: left,
      modifier,
    })
  }

  private emit(state: EngineState): void {
    const snapshot = [state.chord?.name, state.rightPattern, state.leftPattern, state.modifier].join('|')
    if (snapshot === this.lastSnapshot) return
    this.lastSnapshot = snapshot
    this.onState(state)
  }
}
