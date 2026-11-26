import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Euler, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three'
import { createCameraPath } from './index'
import type { CameraKeyframe } from './keyframes'
import type { FlightSettings } from '../Flight/FlightController'
import type { FlightMotionField } from '../Flight/FlightMotionField'

export function CameraRig({ progress, frames, enabled, flight, flightSettings }: { progress: number; frames: CameraKeyframe[]; enabled: boolean; flight: FlightMotionField; flightSettings: FlightSettings }) {
  const camera = useThree(state => state.camera)
  const sample = useMemo(() => createCameraPath(frames), [frames])
  const lag = useRef(new Vector3())
  const desiredLag = useRef(new Vector3())
  const fovOffset = useRef(0)
  const turn = useRef(new Quaternion())
  const turnTarget = useRef(new Quaternion())
  const euler = useRef(new Euler())
  useFrame((_, delta) => {
    if (!enabled || !(camera instanceof PerspectiveCamera)) return
    const state = sample(progress)
    const dt = flightSettings.paused || document.hidden ? 0 : Math.min(delta, 0.05)
    const ratio = flight.speed / Math.max(flightSettings.maxSpeed, 0.01)
    lag.current.lerp(desiredLag.current.copy(flight.direction).multiplyScalar(-ratio * 0.12), 1 - Math.exp(-Math.max(0.1, flightSettings.inertia) * dt))
    fovOffset.current = MathUtils.damp(fovOffset.current, flightSettings.fov ? ratio * flightSettings.fovAmount : 0, Math.max(0.1, flightSettings.inertia), dt)
    camera.position.copy(state.position).add(lag.current)
    // 小幅偏航与倾斜保留原有镜头构图。
    const yaw = MathUtils.clamp(flight.direction.z * 0.12, -0.12, 0.12)
    const bank = MathUtils.clamp(-flight.angularVelocity.y * 0.16, -0.12, 0.12)
    turnTarget.current.setFromEuler(euler.current.set(0, yaw, bank))
    turn.current.slerp(turnTarget.current, 1 - Math.exp(-flightSettings.turnResponse * dt))
    camera.quaternion.copy(state.quaternion).multiply(turn.current)
    camera.fov = state.fov + fovOffset.current
    camera.updateProjectionMatrix()
    flight.updateCamera(camera.position, camera.quaternion, dt)
  })
  return null
}
