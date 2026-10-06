import type { Graphics } from 'pixi.js'
import { clamp } from './math'

export function drawHealthBar(
  g: Graphics,
  pct: number,
  width: number,
  height: number,
  offsetY: number
): void {
  g.clear()
  const x = -width / 2
  g.rect(x, offsetY, width, height).fill(0x0f172a)
  const p = clamp(pct, 0, 1)
  if (p > 0) {
    const color = p > 0.5 ? 0x2a9d8f : p > 0.25 ? 0xe9c46a : 0xe63946
    g.rect(x, offsetY, width * p, height).fill(color)
  }
}

/** Ship deterioration by remaining health (tint now; swap for damaged sprites when you pick them). */
export function damageTint(pct: number): number {
  if (pct > 0.66) return 0xffffff
  if (pct > 0.33) return 0xffc9a8
  return 0xff8a80
}