import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Quality } from '../Flight/FlightController'

export const performanceSettings = { dpr: [1, 2] as [number, number] }
const levels: Quality[] = ['low', 'medium', 'high']
const caps = { low: 0.75, medium: 1, high: 1.5 }
// 每五秒观察平均帧时间；降级与升级使用不同阈值和持续时间。
export function AdaptiveQualityController({ quality, setQuality }: { quality: Quality; setQuality: (quality: Quality) => void }) {
  const { gl, setDpr } = useThree()
  const sample = useRef({ elapsed: 0, frames: 0, slow: 0, fast: 0 })
  useEffect(() => { setDpr(Math.min(window.devicePixelRatio || 1, caps[quality])) }, [quality, setDpr])
  useEffect(() => { if (gl.capabilities.maxTextureSize < 2048 && quality === 'high') setQuality('medium') }, [gl, quality, setQuality])
  useFrame((_, delta) => {
    if (document.hidden || delta <= 0 || delta > 0.25) return
    const s = sample.current; s.elapsed += delta; s.frames++
    if (s.elapsed < 5) return
    const average = s.elapsed / s.frames
    s.slow = average > 0.038 ? s.slow + 1 : 0
    s.fast = average < 0.022 ? s.fast + 1 : 0
    const index = levels.indexOf(quality)
    if (s.slow >= 2 && index > 0) { setQuality(levels[index - 1]); s.slow = 0; s.fast = 0 }
    else if (s.fast >= 6 && index < 2 && gl.capabilities.maxTextureSize >= 2048) { setQuality(levels[index + 1]); s.slow = 0; s.fast = 0 }
    s.elapsed = 0; s.frames = 0
  })
  return null
}
