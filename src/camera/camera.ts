export async function startCamera(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
    audio: false,
  })
  video.srcObject = stream
  await video.play()
  return stream
}

export function stopCamera(stream: MediaStream | null): void {
  stream?.getTracks().forEach((t) => t.stop())
}

export function describeCameraError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError') return 'Izin kamera ditolak. Izinkan kamera di pengaturan browser lalu coba lagi.'
  if (name === 'NotFoundError') return 'Kamera tidak ditemukan.'
  if (name === 'NotReadableError') return 'Kamera sedang dipakai aplikasi lain (Zoom, Meet, dll.).'
  return 'Gagal memulai: ' + (err instanceof Error ? err.message : String(err))
}
