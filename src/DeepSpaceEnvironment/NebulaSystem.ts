import { Color } from 'three'
import { add, type CosmicSettings, type Field } from './shared'
// 连续周期噪声与域扭曲使云体保持跨经线连续，而不是简单椭圆渐变。
function noise(x: number, y: number, seed: number) {
  return (Math.sin(x * 1.7 + Math.sin(y * 1.3 + seed)) * Math.cos(y * 1.9 + Math.sin(x * 0.9 - seed)) + Math.sin(x * 3.1 + y * 2.3 + seed) * 0.35 + Math.cos(x * 5.3 - y * 4.7) * 0.16) / 1.51
}
export function NebulaSystem(f: Field, s: CosmicSettings) {
  if (!s.nebulae) return
  const tint = new Color(s.nebulaColor), r = f.random
  for (let n = 0; n < s.nebulaCount; n++) {
    const cx = r() * f.w, cy = (0.18 + r() * 0.64) * f.h, rx = (0.09 + r() * 0.09) * f.w, ry = (0.08 + r() * 0.1) * f.h, seed = r() * 20
    for (let dy = -Math.ceil(ry); dy <= ry; dy++) for (let dx = -Math.ceil(rx); dx <= rx; dx++) {
      const x = dx / rx, y = dy / ry, edge = Math.max(0, 1 - x * x - y * y)
      if (!edge) continue
      const scale = s.noiseScale * 3, warp = noise(x * scale, y * scale, seed)
      const detail = noise(x * scale * 2 + warp, y * scale * 2 - warp, seed) * 0.5 + noise(x * scale * 5, y * scale * 5, seed) * 0.2
      const cloud = Math.pow(Math.max(0, 0.42 + warp * 0.5 + detail * 0.45), 2) * edge * edge * s.nebula * s.opacity
      const dark = n % 4 === 3 ? 0.18 : 1
      add(f, cx + dx, cy + dy, cloud * tint.r * 1.1 * dark, cloud * tint.g * 1.3 * dark, cloud * tint.b * 1.55 * dark)
    }
  }
}
