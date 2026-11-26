import { MathUtils, Quaternion, Vector3 } from 'three'

export type FlightState = 'Cruise' | 'Accelerate' | 'HighSpeed' | 'Turn' | 'Decelerate'
export type Quality = 'low' | 'medium' | 'high'
export interface FlightSettings {
  baseSpeed: number; maxSpeed: number; acceleration: number; deceleration: number
  direction: [number, number, number]; roll: number; mode: 'cruise' | 'high' | 'turn'; paused: boolean
  particleCount: number; particleSpeed: number; trailLength: number; trailBrightness: number
  parallax: number; motionBlur: number; fovAmount: number; inertia: number; reflectionFrequency: number
  particles: boolean; trails: boolean; localMotion: boolean; fov: boolean; quality: Quality
  globalMotion: number; galaxyMotion: number; nebulaMotion: number; clusterMotion: number; nearMotion: number
  nebulaFlow: number; turnResponse: number; galaxyMotionEnabled: boolean; nebulaMotionEnabled: boolean; clusterMotionEnabled: boolean
}
export const defaultFlightSettings: FlightSettings = {
  baseSpeed: 5, maxSpeed: 22.5, acceleration: 5.3, deceleration: 4, direction: [-1, 0, 0], roll: 0,
  mode: 'cruise', paused: false, particleCount: 13000, particleSpeed: 1.65, trailLength: 1.9,
  trailBrightness: 1.85, parallax: 1.7, motionBlur: 0.8, fovAmount: 3, inertia: 5, reflectionFrequency: 0,
  particles: true, trails: true, localMotion: true, fov: true, quality: 'high',
  globalMotion: 1, galaxyMotion: 0.035, nebulaMotion: 0.08, clusterMotion: 0.25, nearMotion: 1,
  nebulaFlow: 1, turnResponse: 2, galaxyMotionEnabled: true, nebulaMotionEnabled: true, clusterMotionEnabled: true,
}

// 持续时间和叙事输入分离；外部叙事层只设置目标，不直接修改积分状态。
export interface NarrativeFlightTarget { speed?: number; direction?: [number, number, number]; orientation?: Quaternion }
export class FlightController {
  speed = 0; acceleration = 0; progress = 0; elapsed = 0; state: FlightState = 'Cruise'
  readonly direction = new Vector3(-1, 0, 0)
  readonly orientation = new Quaternion()
  readonly angularVelocity = new Vector3()
  readonly trackingTarget = new Vector3()
  readonly displacement = new Vector3()
  narrative: NarrativeFlightTarget = {}
  private readonly desired = new Vector3()
  private readonly targetRotation = new Quaternion()
  private readonly rollRotation = new Quaternion()
  private readonly previousRotation = new Quaternion()
  private readonly deltaRotation = new Quaternion()
  private readonly forward = new Vector3(-1, 0, 0)
  private readonly axis = new Vector3()
  update(delta: number, settings: FlightSettings) {
    if (settings.paused || document.hidden) return
    const dt = Math.min(Math.max(delta, 0), 0.05)
    if (!dt) return
    const targetSpeed = MathUtils.clamp(this.narrative.speed ?? (settings.mode === 'cruise' ? settings.baseSpeed : settings.maxSpeed), 0, settings.maxSpeed)
    const oldSpeed = this.speed
    this.speed = MathUtils.damp(this.speed, targetSpeed, (targetSpeed > this.speed ? settings.acceleration : settings.deceleration) / Math.max(settings.maxSpeed, 0.01) * 4, dt)
    this.acceleration = (this.speed - oldSpeed) / dt
    this.desired.fromArray(this.narrative.direction ?? settings.direction)
    if (this.desired.lengthSq() < 0.0001) this.desired.copy(this.forward)
    this.desired.normalize()
    if (settings.mode === 'turn' && !this.narrative.direction) this.desired.applyAxisAngle(this.axis.set(0, 1, 0), Math.sin(this.elapsed * 0.22) * 0.65)
    const turning = this.direction.angleTo(this.desired) > 0.025
    this.direction.lerp(this.desired, 1 - Math.exp(-1.2 * dt)).normalize()
    this.targetRotation.setFromUnitVectors(this.forward, this.direction)
    this.rollRotation.setFromAxisAngle(this.forward, settings.roll)
    this.targetRotation.multiply(this.rollRotation)
    if (this.narrative.orientation) this.targetRotation.copy(this.narrative.orientation)
    this.previousRotation.copy(this.orientation)
    this.orientation.slerp(this.targetRotation, 1 - Math.exp(-2 * dt))
    this.deltaRotation.copy(this.previousRotation).invert().multiply(this.orientation).normalize()
    const angle = 2 * Math.acos(MathUtils.clamp(this.deltaRotation.w, -1, 1)), sin = Math.sqrt(Math.max(0, 1 - this.deltaRotation.w ** 2))
    if (sin > 0.00001) this.angularVelocity.set(this.deltaRotation.x, this.deltaRotation.y, this.deltaRotation.z).multiplyScalar(angle / (sin * dt))
    else this.angularVelocity.set(0, 0, 0)
    this.state = turning ? 'Turn' : Math.abs(this.speed - targetSpeed) > 0.1 ? (this.acceleration > 0 ? 'Accelerate' : 'Decelerate') : settings.mode === 'high' ? 'HighSpeed' : 'Cruise'
    this.elapsed += dt
    this.progress = (this.progress + this.speed * dt) % 100000
    // 有界相对位移供 GPU 循环采样，避免长时间运行的浮点精度损失。
    this.displacement.addScaledVector(this.direction, this.speed * settings.particleSpeed * dt)
    this.displacement.set(MathUtils.euclideanModulo(this.displacement.x, 80), MathUtils.euclideanModulo(this.displacement.y, 80), MathUtils.euclideanModulo(this.displacement.z, 80))
  }
}
