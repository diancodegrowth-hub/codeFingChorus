import { STABILITY_MS } from '../config'

/**
 * Meredam "kedipan" deteksi: target baru baru diterima setelah stabil selama beberapa ms.
 * Target berupa string: nama chord (mis. "Bm") atau 'silence'.
 */
export class Stabilizer {
  private committed = 'silence'
  private candidate = 'silence'
  private candidateSince = 0

  /** Kembalikan target yang sudah sah (bisa sama dengan sebelumnya). */
  update(target: string, now: number): string {
    if (target === this.committed) {
      this.candidate = target
      return this.committed
    }
    if (target !== this.candidate) {
      this.candidate = target
      this.candidateSince = now
    }
    const wait = target === 'silence' ? STABILITY_MS.release : STABILITY_MS.change
    if (now - this.candidateSince >= wait) this.committed = target
    return this.committed
  }
}
