import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Color, DataTexture, EquirectangularReflectionMapping, FloatType, LinearFilter, LinearSRGBColorSpace, PMREMGenerator, RGBAFormat } from 'three'
import type { MaterialSettings } from '../Materials'

export interface StarfieldSettings {
  brightness: number; density: number; size: number; distribution: number
  nebula: number; nebulaColor: string; rotation: number; independentRotation: boolean; reflectionRotation: number
}
export const defaultStarfieldSettings: StarfieldSettings = {
  brightness: 1, density: 1, size: 1, distribution: 1, nebula: 1,
  nebulaColor: '#a9b9c8', rotation: 0, independentRotation: false, reflectionRotation: 0,
}
const width = 2048, height = 1024
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))

// 固定种子保证参数变化、背景和反射始终使用同一组天体方向。
function randomGenerator() {
  let seed = 731921
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
}
export function createStarfieldPixels(settings: StarfieldSettings, w = width, h = height) {
  const data = new Float32Array(w * h * 4)
  const tint = new Color(settings.nebulaColor)
  const lobe = (lon: number, lat: number, x: number, y: number, sx: number, sy: number) => {
    const dx = wrap(lon - x) * Math.cos(lat * 0.65) / sx, dy = (lat - y) / sy
    return Math.exp(-0.5 * (dx * dx + dy * dy))
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const lon = (x / w - 0.5) * Math.PI * 2, lat = (0.5 - y / (h - 1)) * Math.PI
    // 宽阔而低饱和的银河光属于星空本身，也为镜面提供连续亮度。
    const band = Math.exp(-Math.pow((lat - 0.25 * Math.sin(lon + 0.8)) / 0.35, 2))
    const clouds = 0.13 * lobe(lon, lat, -1.6, 0.35, 0.9, 0.5) + 0.10 * lobe(lon, lat, 1.5, -0.3, 0.8, 0.45) + 0.055 * band * (0.65 + 0.35 * Math.cos(lon * 3 + lat * 5))
    const ambient = 0.024 + 0.072 * lobe(lon, lat, 0.4, 0.2, 2.2, 1.1)
    const i = (y * w + x) * 4, n = clouds * settings.nebula * 3.6
    data[i] = (ambient * 0.65 + n * tint.r) * settings.brightness
    data[i + 1] = (ambient * 0.8 + n * tint.g) * settings.brightness
    data[i + 2] = (ambient + n * tint.b) * settings.brightness
    data[i + 3] = 1
  }
  const rand = randomGenerator()
  // 均匀球面候选点按银河带密度接受；亮度遵循长尾分布。
  for (let s = 0; s < 10000; s++) {
    const u = rand(), v = rand(), accept = rand(), power = rand(), hue = rand(), radius = rand()
    const lon = (u - 0.5) * Math.PI * 2, lat = Math.asin(2 * v - 1)
    const band = Math.exp(-Math.pow((lat - 0.25 * Math.sin(lon + 0.8)) / 0.42, 2))
    if (accept > Math.min(1, settings.density * (0.14 + 0.6 * band))) continue
    const px = u * w, py = (0.5 - lat / Math.PI) * (h - 1)
    const intensity = (0.6 + Math.pow(power, 14 / settings.distribution) * 72) * settings.brightness
    const sigma = Math.max(0.22, (0.22 + radius * 0.16 + Math.pow(power, 14) * 0.22) * settings.size * w / width)
    const extent = Math.ceil(sigma * 2.5)
    for (let dy = -extent; dy <= extent; dy++) for (let dx = -extent; dx <= extent; dx++) {
      const xx = ((Math.round(px) + dx) % w + w) % w, yy = Math.round(py) + dy
      if (yy < 0 || yy >= h) continue
      const d2 = ((xx - px + w * 1.5) % w - w * 0.5) ** 2 + (yy - py) ** 2
      const value = intensity * Math.exp(-d2 / (2 * sigma * sigma))
      const i = (yy * w + xx) * 4
      data[i] += value * (hue < 0.2 ? 1 : 0.85); data[i + 1] += value * 0.91; data[i + 2] += value * (hue < 0.2 ? 0.8 : 1)
    }
  }
  return data
}

export function StarfieldEnvironment({ settings, material }: { settings: StarfieldSettings; material: MaterialSettings }) {
  const { gl, scene } = useThree()
  const { brightness, density, size, distribution, nebula, nebulaColor } = settings
  useEffect(() => {
    const texture = new DataTexture(createStarfieldPixels(settings), width, height, RGBAFormat, FloatType)
    texture.mapping = EquirectangularReflectionMapping
    texture.colorSpace = LinearSRGBColorSpace
    texture.minFilter = LinearFilter; texture.magFilter = LinearFilter; texture.needsUpdate = true
    const generator = new PMREMGenerator(gl)
    const target = generator.fromEquirectangular(texture)
    const oldBackground = scene.background, oldEnvironment = scene.environment
    // 可见天空和 PBR 环境由同一线性 HDR 纹理生成；PMREM 只做物理预过滤。
    scene.background = texture; scene.environment = target.texture
    return () => { scene.background = oldBackground; scene.environment = oldEnvironment; target.dispose(); texture.dispose(); generator.dispose() }
  }, [gl, scene, brightness, density, size, distribution, nebula, nebulaColor])
  useEffect(() => {
    scene.backgroundRotation.set(0, settings.rotation, 0)
    scene.environmentRotation.set(0, settings.independentRotation ? settings.reflectionRotation : settings.rotation, 0)
    scene.environmentIntensity = 1
    // 背景的显示曝光单独压低，HDR 辐亮度及恒星方向仍与反射使用同一数据。
    scene.backgroundIntensity = 1 / 24
  }, [scene, settings.rotation, settings.independentRotation, settings.reflectionRotation])
  useEffect(() => { gl.toneMappingExposure = material.exposure }, [gl, material.exposure])
  return null
}
