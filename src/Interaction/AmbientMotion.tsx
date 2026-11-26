import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import { MathUtils, Vector2, Vector3, type Group } from 'three'

// 附加层只叠加微小偏移；滚动时归零，不改变镜头路径或飞行状态。
export function AmbientMotion({ droplet, reduced, enabled }: { droplet: RefObject<Group | null>; reduced: boolean; enabled: boolean }) {
  const camera = useThree(state => state.camera)
  const pointer = useRef(new Vector2())
  const current = useRef(new Vector2())
  const lastScroll = useRef(0)
  const weight = useRef(0)
  const elapsed = useRef(0)
  const offset = useRef(new Vector3())
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer.current.set(event.clientX / window.innerWidth * 2 - 1, 1 - event.clientY / window.innerHeight * 2)
    }
    const leave = () => pointer.current.set(0, 0)
    const scroll = () => { lastScroll.current = performance.now() }
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    window.addEventListener('scroll', scroll, { passive: true })
    return () => { window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); window.removeEventListener('scroll', scroll) }
  }, [])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const target = enabled && !reduced && !document.hidden && performance.now() - lastScroll.current > 180 ? 1 : 0
    weight.current = MathUtils.damp(weight.current, target, target ? 1.5 : 8, dt)
    current.current.lerp(pointer.current, 1 - Math.exp(-2 * dt))
    elapsed.current += dt
    // 摄像机每帧先由主路径复位，因此偏移不会积累。
    offset.current.set(current.current.x * 0.025, current.current.y * 0.018, 0).applyQuaternion(camera.quaternion)
    if (enabled) camera.position.addScaledVector(offset.current, weight.current)
    if (droplet.current) droplet.current.position.y = Math.sin(elapsed.current * 0.6) * 0.018 * weight.current
  })
  return null
}

