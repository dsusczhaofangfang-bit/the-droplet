import { rng, type CosmicSettings, type Field } from './shared'
import { StarfieldSystem } from './StarfieldSystem'
import { StarClusterSystem } from './StarClusterSystem'
import { NebulaSystem } from './NebulaSystem'
import { GalaxySystem } from './GalaxySystem'
export function createCosmicPixels(settings: CosmicSettings, w: number, h: number) {
  const data = new Float32Array(w * h * 4)
  for (let i = 0; i < data.length; i += 4) { data[i] = 0.018; data[i + 1] = 0.024; data[i + 2] = 0.035; data[i + 3] = 1 }
  // 各系统有独立随机序列，单独开关不会改变其他天体的位置。
  const field = (offset: number): Field => ({ data, w, h, random: rng(settings.seed + offset) })
  NebulaSystem(field(11), settings); GalaxySystem(field(23), settings); StarfieldSystem(field(37), settings); StarClusterSystem(field(53), settings)
  for (let i = 0; i < data.length; i += 4) { data[i] *= settings.brightness; data[i + 1] *= settings.brightness; data[i + 2] *= settings.brightness }
  return data
}
