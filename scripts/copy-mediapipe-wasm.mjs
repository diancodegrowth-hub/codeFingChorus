// Menyalin file WASM MediaPipe dari node_modules ke public/ supaya dilayani Vite dari localhost
// (versi selalu cocok dengan paket yang terpasang, tanpa bergantung CDN).
import { cpSync } from 'node:fs'

cpSync('node_modules/@mediapipe/tasks-vision/wasm', 'public/mediapipe/wasm', { recursive: true })
console.log('MediaPipe WASM disalin ke public/mediapipe/wasm')
