import { star, type CosmicSettings, type Field } from './shared'
export function StarClusterSystem(f: Field, s: CosmicSettings) {
  if (!s.clusters) return
  const r = f.random
  for (let c = 0; c < s.clusterCount; c++) {
    const x = r() * f.w, y = (0.18 + r() * 0.64) * f.h, kind = c % 3
    const radius = (12 + r() * 25) * f.w / 2048 * s.clusterSize
    for (let i = 0; i < 180 * s.clusterDensity; i++) {
      const angle = r() * Math.PI * 2, distance = radius * (kind === 0 ? Math.pow(r(), 2.4) : kind === 1 ? Math.sqrt(r()) : Math.pow(r(), 1.3))
      const px = x + Math.cos(angle) * distance * (kind === 2 ? 1.7 : 1), py = y + Math.sin(angle) * distance
      star(f, px, py, (1 + Math.pow(r(), 9) * 15) * s.clusterBrightness, 0.4, r() < 0.25 ? 0.7 : 0.1)
    }
  }
}
