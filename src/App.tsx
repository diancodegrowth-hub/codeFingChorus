import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'
import { Instrument } from './audio/instrument'
import { DEFAULT_INSTRUMENT, PRESETS } from './audio/presets'
import type { InstrumentId } from './audio/presets'
import { describeCameraError, startCamera, stopCamera } from './camera/camera'
import { DEFAULT_KEY } from './config'
import { FingerNoteEngine } from './engine/fingerNoteEngine'
import type { EngineState } from './engine/fingerNoteEngine'
import { KEYS, buildChord, diatonicChords } from './music/theory'
import { createHandLandmarker } from './vision/handTracker'

type Status = 'idle' | 'loading' | 'running' | 'error'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
const GESTURE_HINT = [
  '☝️ telunjuk',
  '✌️ telunjuk + tengah',
  '3 jari (tanpa jempol)',
  '4 jari (tanpa jempol)',
  '🖐️ semua jari',
  '👍 jempol',
  '🤏 jempol + telunjuk',
]
const FINGER_LABELS = ['Jempol', 'Telunjuk', 'Tengah', 'Manis', 'Kelingking']
const MODIFIER_LABEL = { default: 'bawaan', major: 'dipaksa MAYOR', minor: 'dipaksa MINOR' }

function FingerRow({ title, pattern, color }: { title: string; pattern: string | null; color: string }) {
  return (
    <div className="finger-row">
      <span className="finger-title" style={{ color }}>
        {title}
      </span>
      {pattern === null ? (
        <span className="muted">tidak terlihat</span>
      ) : (
        <span className="finger-dots">
          {FINGER_LABELS.map((label, i) => (
            <span key={label} title={label} className={pattern[i] === '1' ? 'dot on' : 'dot'} style={{ '--c': color } as CSSProperties}>
              {label[0]}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<FingerNoteEngine | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [musicKey, setMusicKey] = useState(DEFAULT_KEY)
  const [swapHands, setSwapHands] = useState(false)
  const [instrument, setInstrument] = useState<InstrumentId>(DEFAULT_INSTRUMENT)
  const [state, setState] = useState<EngineState>({ chord: null, rightPattern: null, leftPattern: null, modifier: 'default' })

  // Matikan kamera & audio saat komponen dilepas.
  useEffect(
    () => () => {
      engineRef.current?.stop()
      stopCamera(streamRef.current)
    },
    [],
  )

  // Nilai dari UI diteruskan ke engine tanpa membuat ulang engine.
  useEffect(() => {
    if (engineRef.current) engineRef.current.key = musicKey
  }, [musicKey])
  useEffect(() => {
    if (engineRef.current) engineRef.current.swapHands = swapHands
  }, [swapHands])
  useEffect(() => {
    engineRef.current?.setInstrument(instrument)
  }, [instrument])

  async function handleStart() {
    setStatus('loading')
    setError('')
    try {
      await Instrument.unlock() // harus di dalam event klik
      const [landmarker, stream] = await Promise.all([createHandLandmarker(), startCamera(videoRef.current!)])
      streamRef.current = stream
      const engine = new FingerNoteEngine(landmarker, videoRef.current!, canvasRef.current!, musicKey, setState)
      engine.swapHands = swapHands
      engine.setInstrument(instrument)
      engine.start()
      engineRef.current = engine
      setStatus('running')
    } catch (err) {
      stopCamera(streamRef.current)
      setError(describeCameraError(err))
      setStatus('error')
    }
  }

  // Memisahkan masalah audio dari masalah deteksi: bunyikan chord I selama 1,5 detik tanpa kamera.
  async function handleTestSound() {
    await Instrument.unlock()
    const synth = new Instrument(instrument)
    synth.play(buildChord(musicKey, 1, 'default').notes)
    setTimeout(() => synth.stop(), 1500)
    setTimeout(() => synth.dispose(), 4000)
  }

  const chords = diatonicChords(musicKey)
  const active = state.chord

  return (
    <div className="app">
      <header className="topbar">
        <h1>
          code<span>Finger</span>Note
        </h1>
        <p>Angkat jari tangan kanan untuk memilih chord · tangan kiri mengubah mayor/minor</p>
      </header>

      <main className="layout">
        <section className="stage">
          <video ref={videoRef} className="mirror" playsInline muted />
          <canvas ref={canvasRef} className="mirror overlay" />
          {status !== 'running' && (
            <div className="stage-cover">
              {status === 'loading' ? (
                <p>Memuat model deteksi tangan & kamera…</p>
              ) : (
                <>
                  {error && <p className="error">{error}</p>}
                  <button className="start" onClick={handleStart}>
                    ▶ Mulai kamera & suara
                  </button>
                  <p className="muted small">Kamera diproses di browser kamu — tidak ada video yang dikirim ke server.</p>
                </>
              )}
            </div>
          )}
          {status === 'running' && (
            <div className={active ? 'now-playing on' : 'now-playing'}>
              {active ? (
                <>
                  <span className="roman">{ROMAN[active.degree - 1]}</span>
                  <span className="name">{active.name}</span>
                </>
              ) : (
                <span className="name silent">—</span>
              )}
            </div>
          )}
        </section>

        <aside className="panel">
          <div className="card">
            <h2>Chord sekarang</h2>
            <div className="big-chord">{active ? active.name : '—'}</div>
            <p className="muted small">{active ? active.notes.join(' · ') : 'kepal / turunkan tangan kanan = diam'}</p>
            <p className="small">
              Kualitas: <strong>{MODIFIER_LABEL[state.modifier]}</strong>
            </p>
            <div className="sound-row">
              <select value={instrument} onChange={(e) => setInstrument(e.target.value as InstrumentId)} aria-label="Instrumen">
                {(Object.keys(PRESETS) as InstrumentId[]).map((id) => (
                  <option key={id} value={id}>
                    {PRESETS[id].label}
                  </option>
                ))}
              </select>
              <button className="test-sound" onClick={handleTestSound}>
                🔊 Tes suara
              </button>
            </div>
          </div>

          <div className="card">
            <h2>Deteksi jari</h2>
            <FingerRow title="Kanan" pattern={state.rightPattern} color="var(--right)" />
            <FingerRow title="Kiri" pattern={state.leftPattern} color="var(--left)" />
            <label className="toggle small">
              <input type="checkbox" checked={swapHands} onChange={(e) => setSwapHands(e.target.checked)} />
              Tukar kiri/kanan (saat 2 tangan terlihat)
            </label>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Chord di kunci</h2>
              <select value={musicKey} onChange={(e) => setMusicKey(e.target.value)} aria-label="Kunci">
                {KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <table className="chord-table">
              <tbody>
                {chords.map((c, i) => (
                  <tr key={c.degree} className={active?.degree === c.degree ? 'active' : ''}>
                    <td className="roman">{ROMAN[i]}</td>
                    <td className="chord-name">{c.name}</td>
                    <td className="hint">{GESTURE_HINT[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="muted small">
              Tangan kiri: 👍 jempol = paksa mayor · 🤙 kelingking = paksa minor
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
