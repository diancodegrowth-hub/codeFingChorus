import type { PolySynth } from 'tone'

export interface InstrumentPreset {
  label: string
  synth: Parameters<PolySynth['set']>[0] // opsi oscillator + envelope
  filterFrequency: number // Hz — makin kecil makin redup
  vibrato: { frequency: number; depth: number }
  reverbWet: number // 0 = kering, 1 = full ruangan
  volume: number // dB
}

export const PRESETS = {
  strings: {
    label: 'String ensemble',
    // Subtractive: sawtooth kaya harmonik, 3 lapis sedikit detune = efek banyak pemain.
    synth: {
      oscillator: { type: 'fatsawtooth', count: 3, spread: 24 },
      // Gesekan busur butuh waktu "mengembang" (attack lambat), memudar pelan (release panjang).
      envelope: { attack: 0.6, decay: 0.5, sustain: 0.85, release: 1.4 },
    },
    filterFrequency: 2200,
    vibrato: { frequency: 5, depth: 0.06 },
    reverbWet: 0.5,
    volume: -4,
  },
  organ: {
    label: 'Orgel',
    // Additive: jumlahan gelombang sinus di harmonik 1–8, meniru posisi drawbar organ Hammond.
    synth: {
      oscillator: { type: 'custom', partials: [1, 0.7, 0.45, 0.5, 0, 0.3, 0, 0.25] },
      // Organ = tuts on/off: langsung penuh saat ditekan, langsung berhenti saat dilepas.
      envelope: { attack: 0.015, decay: 0.05, sustain: 1, release: 0.12 },
    },
    filterFrequency: 5000,
    vibrato: { frequency: 6.5, depth: 0.04 }, // getaran cepat ala speaker Leslie
    reverbWet: 0.25,
    volume: -12,
  },
} satisfies Record<string, InstrumentPreset>

export type InstrumentId = keyof typeof PRESETS
export const DEFAULT_INSTRUMENT: InstrumentId = 'strings'
