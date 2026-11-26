export type GalaxyType = 'all' | 'spiral' | 'barred' | 'elliptical' | 'lenticular' | 'irregular'
export interface CosmicSettings {
  seed: number; brightness: number; rotation: number; resolution: number
  stars: boolean; starCount: number; density: number; size: number; starBrightness: number; temperature: number
  clusters: boolean; clusterCount: number; clusterDensity: number; clusterSize: number; clusterBrightness: number
  nebulae: boolean; nebulaCount: number; nebula: number; nebulaColor: string; noiseScale: number; opacity: number
  galaxies: boolean; galaxyCount: number; galaxyType: GalaxyType; galaxySize: number; arms: number; core: number; galaxyRotation: number; dust: number
}
export const defaultCosmicSettings: CosmicSettings = {
  seed: 731921, brightness: 1, rotation: 0, resolution: 2048,
  stars: true, starCount: 12000, density: 1.1, size: 0.8, starBrightness: 1, temperature: 0,
  clusters: true, clusterCount: 8, clusterDensity: 1, clusterSize: 1, clusterBrightness: 1,
  nebulae: true, nebulaCount: 5, nebula: 1, nebulaColor: '#a9b9c8', noiseScale: 1, opacity: 1,
  galaxies: true, galaxyCount: 14, galaxyType: 'all', galaxySize: 1, arms: 2, core: 1, galaxyRotation: -0.04, dust: 1,
}
export type Field = { data: Float32Array; w: number; h: number; random: () => number }
export function rng(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 } }
export function add(f: Field, x: number, y: number, r: number, g: number, b: number) {
  if (y < 0 || y >= f.h) return
  const i = (Math.floor(y) * f.w + ((Math.floor(x) % f.w + f.w) % f.w)) * 4
  f.data[i] += r; f.data[i + 1] += g; f.data[i + 2] += b
}
export function star(f: Field, x: number, y: number, intensity: number, size: number, warmth: number) {
  const sigma = Math.max(0.3, size * f.w / 2048), extent = Math.ceil(sigma * 2.5)
  for (let dy = -extent; dy <= extent; dy++) for (let dx = -extent; dx <= extent; dx++) {
    const v = intensity * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))
    add(f, Math.round(x) + dx, Math.round(y) + dy, v * (0.84 + warmth * 0.16), v * 0.92, v * (1 - warmth * 0.2))
  }
}
