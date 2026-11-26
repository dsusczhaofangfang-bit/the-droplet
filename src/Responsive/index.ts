import { useEffect, useState } from 'react'

export type CameraProfile = 'desktop' | 'tablet' | 'mobile-portrait' | 'mobile-landscape'
export interface DeviceProfile {
  width: number; height: number; aspect: number; dpr: number
  orientation: 'portrait' | 'landscape'; pointer: 'coarse' | 'fine'; touch: boolean
  reducedMotion: boolean; camera: CameraProfile
}
function readProfile(): DeviceProfile {
  const width = document.documentElement.clientWidth, height = window.innerHeight
  const orientation = width <= height ? 'portrait' : 'landscape'
  const pointer = matchMedia('(pointer: coarse)').matches ? 'coarse' : 'fine'
  return { width, height, aspect: width / Math.max(height, 1), dpr: window.devicePixelRatio || 1, orientation, pointer,
    touch: navigator.maxTouchPoints > 0, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    camera: width >= 1024 ? 'desktop' : width >= 600 && height >= 600 ? 'tablet' : orientation === 'portrait' ? 'mobile-portrait' : 'mobile-landscape' }
}
export function useDeviceProfile() {
  const [profile, setProfile] = useState(readProfile)
  useEffect(() => {
    let frame = 0
    const update = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => setProfile(readProfile())) }
    const observer = new ResizeObserver(update); observer.observe(document.documentElement)
    const queries = [matchMedia('(pointer: coarse)'), matchMedia('(prefers-reduced-motion: reduce)')]
    queries.forEach(query => query.addEventListener('change', update))
    window.addEventListener('resize', update, { passive: true })
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', update); queries.forEach(query => query.removeEventListener('change', update)) }
  }, [])
  return profile
}
