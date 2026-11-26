import { star, type CosmicSettings, type Field } from './shared'
export function StarfieldSystem(f: Field, s: CosmicSettings) {
  if (!s.stars) return
  const rand = f.random
  for (let i = 0; i < s.starCount; i++) {
    const x = rand() * f.w, lat = Math.asin(2 * rand() - 1), y = (0.5 - lat / Math.PI) * f.h
    const band = Math.exp(-Math.pow((lat - 0.25 * Math.sin(x / f.w * 6.28 + 0.8)) / 0.38, 2))
    if (rand() > Math.min(1, s.density * (0.13 + 0.65 * band))) continue
    const power = rand(), intensity = (0.7 + Math.pow(power, 13) * 90) * s.starBrightness
    const warmth = Math.max(0, Math.min(1, (rand() < 0.18 ? 0.8 : 0.1) + s.temperature))
    star(f, x, y, intensity, (0.4 + power * 0.4) * s.size, warmth)
    // 少量伴星与主星保持固定的角距离。
    if (power > 0.91 && rand() < 0.32) star(f, x + (2 + rand() * 5) * f.w / 2048, y + (rand() - 0.5) * 4 * f.w / 2048, intensity * 0.3, 0.45 * s.size, warmth)
  }
}
