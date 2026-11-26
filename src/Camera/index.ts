import { CatmullRomCurve3, MathUtils, Matrix4, Quaternion, Vector3 } from 'three'
import type { CameraKeyframe } from './keyframes'

export const cameraSettings = { position: [-3.4, 2.1, 6.2] as [number, number, number], fov: 38, near: 0.1, far: 100 }

// 所有曲线只依赖输入进度；不累积帧间状态，倒放和跳转结果完全一致。
export function createCameraPath(frames: CameraKeyframe[]) {
  const positions = new CatmullRomCurve3(frames.map(frame => new Vector3(...frame.position)), false, 'catmullrom', 0.5)
  const targets = new CatmullRomCurve3(frames.map(frame => new Vector3(...frame.target)), false, 'catmullrom', 0.5)
  const up = new Vector3(0, 1, 0), matrix = new Matrix4()
  const orientationAt = (t: number) => new Quaternion().setFromRotationMatrix(matrix.lookAt(positions.getPoint(t), targets.getPoint(t), up))
  // 固定采样后进行四元数球面插值，避免欧拉角跨界和逐帧积分。
  const samples = 512
  const rotations = Array.from({ length: samples + 1 }, (_, i) => orientationAt(i / samples))
  return (progress: number) => {
    const t = MathUtils.clamp(progress, 0, 1)
    const scaled = t * (frames.length - 1), i = Math.min(Math.floor(scaled), frames.length - 2), u = scaled - i
    // Hermite 插值与相邻段共享切线，焦距变化在关键帧处保持速度连续。
    const a = frames[Math.max(0, i - 1)].fov, b = frames[i].fov, c = frames[i + 1].fov, d = frames[Math.min(frames.length - 1, i + 2)].fov
    const fov = (2*u**3 - 3*u**2 + 1)*b + (u**3 - 2*u**2 + u)*(c-a)/2 + (-2*u**3 + 3*u**2)*c + (u**3-u**2)*(d-b)/2
    const q = t * samples, j = Math.min(Math.floor(q), samples - 1)
    return { position: positions.getPoint(t), target: targets.getPoint(t), quaternion: rotations[j].clone().slerp(rotations[j + 1], q - j), fov }
  }
}

