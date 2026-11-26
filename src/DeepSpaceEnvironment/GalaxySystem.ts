import { add, type CosmicSettings, type Field } from './shared'
export function GalaxySystem(f: Field, s: CosmicSettings) {
  if (!s.galaxies) return
  const r = f.random, types = ['spiral', 'barred', 'elliptical', 'lenticular', 'irregular'] as const
  for (let n = 0; n < s.galaxyCount; n++) {
    // 部分遥远星系围绕共同方向聚集，形成稀疏的星系群。
    const group = n >= 5 && n % 3 !== 0, cx = (group ? 0.69 + (r() - 0.5) * 0.17 : r()) * f.w, cy = (group ? 0.38 + (r() - 0.5) * 0.17 : 0.15 + r() * 0.7) * f.h
    const type = s.galaxyType === 'all' ? types[n % types.length] : s.galaxyType
    const radius = (group ? 5 + r() * 7 : 18 + r() * 19) * f.w / 2048 * s.galaxySize
    const inclination = 0.22 + r() * 0.78, angle = r() * Math.PI + s.galaxyRotation, cs = Math.cos(angle), sn = Math.sin(angle), bound = Math.ceil(radius * 1.5)
    for (let dy = -bound; dy <= bound; dy++) for (let dx = -bound; dx <= bound; dx++) {
      const x = (dx * cs + dy * sn) / radius, y = (-dx * sn + dy * cs) / radius / inclination, d = Math.sqrt(x * x + y * y)
      if (d > 1.35) continue
      const phi = Math.atan2(y, x), core = Math.exp(-d * (type === 'elliptical' ? 3.5 : 8)) * s.core * 5
      const disk = Math.exp(-d * 3) * (type === 'elliptical' ? 1.5 : 0.55)
      const arms = type === 'spiral' || type === 'barred' ? Math.pow(Math.max(0, Math.cos(phi * s.arms - Math.log(d + 0.08) * 3.8)), 6) * Math.exp(-d * 2) * 2 : 0
      const bar = type === 'barred' ? Math.exp(-x * x * 15 - y * y * 120) * 1.5 : 0
      const irregular = type === 'irregular' ? (0.7 + 0.3 * Math.sin(x * 19 + Math.sin(y * 13))) : 1
      const dust = Math.max(0.2, 1 - s.dust * 0.55 * Math.pow(Math.max(0, Math.sin(phi * 2 - Math.log(d + 0.1) * 3.8)), 8) * (1 - Math.min(1, d)))
      const v = (core + disk + arms + bar) * irregular * dust
      add(f, cx + dx, cy + dy, v * 0.85, v * 0.89, v)
    }
  }
}
