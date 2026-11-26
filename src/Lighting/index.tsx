import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { DataTexture, EquirectangularReflectionMapping, FloatType, LinearFilter, LinearSRGBColorSpace, PMREMGenerator, RGBAFormat } from 'three'
import type { MaterialSettings } from '../Materials'
import { sampleStudioLighting } from './states'

export { sampleStudioLighting, studioLightingStates } from './states'

const width = 1024, height = 512
const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle))

// 在球面方向上构造连续的线性 HDR 摄影棚；它只用于环境反射，不是水滴表面纹理。
export function createStudioPixels(settings: MaterialSettings, w = width, h = height) {
  const data = new Float32Array(w * h * 4)
  const lobe = (lon: number, lat: number, x: number, y: number, sx: number, sy: number) => {
    const dx = wrap(lon - x) * Math.cos(lat * 0.65) / sx
    const dy = (lat - y) / sy
    return Math.exp(-0.5 * (dx * dx + dy * dy))
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const lon = (x / w - 0.5) * Math.PI * 2, lat = (0.5 - y / (h - 1)) * Math.PI
    const balanced = settings.preset === 'balanced'
    const fill = settings.fill * (0.065 + 0.2 * lobe(lon, lat, -0.5, 0.15, 1.35, 0.95) + 0.14 * lobe(lon, lat, 2.4, -0.1, 1.2, 0.9))
    const soft = settings.softbox * (0.8 * lobe(lon, lat, -1.0, 0.65, 1.15, 0.24) + 0.5 * lobe(lon, lat, 1.65, 0.15, 0.55, 0.65) + 0.65 * lobe(lon, lat, -2.7, -0.62, 1.05, 0.16) + 0.36 * lobe(lon, lat, 0.45, -0.35, 0.8, 0.25) + 1.15 * lobe(lon, lat, -0.25, 0.85, 1.2, 0.045) + 0.65 * lobe(lon, lat, 2.2, -0.55, 0.8, 0.08))
    const flag = Math.min(0.92, settings.negative * (balanced ? 0.55 : 0.8) * lobe(lon, lat, 0.1, 0.1, 0.3, 0.65))
    const value = Math.pow(Math.max(0.001, (fill + soft) * (1 - flag)), settings.contrast) * settings.studioIntensity
    const i = (y * w + x) * 4
    data[i] = value * 0.98; data[i + 1] = value; data[i + 2] = value * 1.025; data[i + 3] = 1
  }
  return data
}

export function Lighting({ settings, progress = 0 }: { settings: MaterialSettings; progress?: number }) {
  const { gl, scene } = useThree()
  const { studioIntensity, contrast, softbox, fill, negative, preset } = settings
  useEffect(() => {
    const pixels = createStudioPixels(settings)
    const texture = new DataTexture(pixels, width, height, RGBAFormat, FloatType)
    texture.mapping = EquirectangularReflectionMapping
    texture.colorSpace = LinearSRGBColorSpace
    texture.minFilter = LinearFilter; texture.magFilter = LinearFilter; texture.needsUpdate = true
    // 参数变化时才重新生成 PMREM，主场景背景与反射环境彼此独立。
    const generator = new PMREMGenerator(gl)
    const target = generator.fromEquirectangular(texture)
    const previous = scene.environment
    scene.environment = target.texture
    return () => { scene.environment = previous; target.dispose(); texture.dispose(); generator.dispose() }
  }, [gl, scene, studioIntensity, contrast, softbox, fill, negative, preset])
  useEffect(() => {
    const state = sampleStudioLighting(progress)
    // 只改变同一环境的方向与强度，避免切换 PMREM 造成闪烁。
    scene.environmentRotation.set(state.rotation[0], state.rotation[1] + settings.environmentRotation, state.rotation[2])
    scene.environmentIntensity = state.intensity
  }, [scene, progress, settings.environmentRotation])
  useEffect(() => { gl.toneMappingExposure = settings.exposure }, [gl, settings.exposure])
  return null
}

