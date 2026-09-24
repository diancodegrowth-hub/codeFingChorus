// Teori musik murni — tidak tahu apa-apa soal kamera atau audio, jadi mudah diuji.

export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type Quality = 'major' | 'minor' | 'dim'
/** Pengubah dari tangan kiri: 'default' = ikuti kualitas diatonik bawaan. */
export type QualityModifier = 'default' | 'major' | 'minor'

export interface Chord {
  degree: Degree
  quality: Quality
  name: string // contoh: "Bm"
  notes: string[] // contoh: ["B2", "B3", "D4", "F#4"]
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const KEYS = NOTE_NAMES

/** Pola skala mayor dalam semitone dari tonika: W-W-H-W-W-W-H. */
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11]

/** Kualitas triad diatonik di skala mayor: I ii iii IV V vi vii°. */
const DIATONIC_QUALITY: Quality[] = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim']

const TRIAD_INTERVALS: Record<Quality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
}

const QUALITY_SUFFIX: Record<Quality, string> = { major: '', minor: 'm', dim: 'dim' }

function midiToNote(midi: number): string {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1)
}

export function buildChord(key: string, degree: Degree, modifier: QualityModifier): Chord {
  const tonic = NOTE_NAMES.indexOf(key)
  const rootPc = (tonic + MAJOR_SCALE[degree - 1]) % 12
  const quality = modifier === 'default' ? DIATONIC_QUALITY[degree - 1] : modifier

  // Akar triad ditaruh di rentang E3–D#4 (MIDI 52–63) supaya semua chord terdengar
  // di register yang mirip — perpindahan chord jadi mulus, tidak lompat oktaf.
  let rootMidi = 48 + rootPc
  if (rootMidi < 52) rootMidi += 12

  const triad = TRIAD_INTERVALS[quality].map((i) => rootMidi + i)
  const bass = rootMidi - 12 // cello: akar satu oktaf di bawah

  return {
    degree,
    quality,
    name: NOTE_NAMES[rootPc] + QUALITY_SUFFIX[quality],
    notes: [bass, ...triad].map(midiToNote),
  }
}

/** Tabel 7 chord diatonik untuk ditampilkan di UI. */
export function diatonicChords(key: string): Chord[] {
  return ([1, 2, 3, 4, 5, 6, 7] as Degree[]).map((d) => buildChord(key, d, 'default'))
}
