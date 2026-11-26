import { Quaternion, Vector3 } from 'three'
import { FlightController, type FlightSettings } from './FlightController'

// 所有运动层共享同一世界空间飞行轨迹和摄像机状态。
export class FlightMotionField extends FlightController {
  readonly position = new Vector3()
  readonly velocity = new Vector3()
  readonly cameraOrientation = new Quaternion()
  readonly cameraVelocity = new Vector3()
  private readonly previousCameraPosition = new Vector3()
  private cameraInitialized = false
  update(delta: number, settings: FlightSettings) {
    const before = this.elapsed
    super.update(delta, settings)
    const dt = this.elapsed - before
    this.velocity.copy(this.direction).multiplyScalar(this.speed)
    this.position.addScaledVector(this.velocity, dt)
  }
  updateCamera(position: Vector3, orientation: Quaternion, dt: number) {
    if (this.cameraInitialized && dt > 0) this.cameraVelocity.copy(position).sub(this.previousCameraPosition).divideScalar(dt)
    else this.cameraVelocity.set(0, 0, 0)
    this.previousCameraPosition.copy(position)
    this.cameraOrientation.copy(orientation)
    this.cameraInitialized = true
  }
}
