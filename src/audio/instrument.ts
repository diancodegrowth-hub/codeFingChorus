import * as Tone from 'tone'
import { PRESETS } from './presets'
import type { InstrumentId } from './presets'

/**
 * Instrumen polifonik berbasis synth: synth → vibrato → filter → reverb → limiter → speaker.
 * Rantai efeknya tetap; preset hanya mengubah pengaturan tiap bagian.
 * Synth dipilih (bukan sampel rekaman) karena bisa berbunyi tanpa batas selama gesture ditahan.
 */
export class Instrument {
  private synth: Tone.PolySynth
  private vibrato: Tone.Vibrato
  private filter: Tone.Filter
  private reverb: Tone.Reverb
  private limiter: Tone.Limiter
  private playing: string[] = []

  constructor(id: InstrumentId) {
    // Limiter di ujung rantai: beberapa nada kaya harmonik bisa melewati 0 dB dan pecah.
    this.limiter = new Tone.Limiter(-1).toDestination()
    this.reverb = new Tone.Reverb({ decay: 4 }).connect(this.limiter)
    this.filter = new Tone.Filter({ type: 'lowpass', Q: 0.5 }).connect(this.reverb)
    this.vibrato = new Tone.Vibrato().connect(this.filter)
    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.vibrato)
    this.synth.maxPolyphony = 24 // ekor release chord lama bisa tumpang tindih dengan chord baru
    this.setPreset(id)
  }

  /** Browser mewajibkan klik pengguna sebelum audio boleh menyala. */
  static async unlock(): Promise<void> {
    await Tone.start()
  }

  setPreset(id: InstrumentId): void {
    const preset = PRESETS[id]
    this.stop() // chord yang sedang bunyi dilepas; engine akan memicu ulang dengan suara baru
    this.synth.set(preset.synth)
    this.synth.volume.value = preset.volume
    this.filter.frequency.value = preset.filterFrequency
    this.vibrato.frequency.value = preset.vibrato.frequency
    this.vibrato.depth.value = preset.vibrato.depth
    this.reverb.wet.value = preset.reverbWet
  }

  play(notes: string[]): void {
    this.stop()
    this.synth.triggerAttack(notes)
    this.playing = notes
  }

  stop(): void {
    if (this.playing.length) this.synth.triggerRelease(this.playing)
    this.playing = []
  }

  dispose(): void {
    this.synth.releaseAll()
    for (const node of [this.synth, this.vibrato, this.filter, this.reverb, this.limiter]) node.dispose()
  }
}
