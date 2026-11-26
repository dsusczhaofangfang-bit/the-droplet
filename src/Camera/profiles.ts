import type { CameraKeyframe } from './keyframes'
import type { DeviceProfile } from '../Responsive'

// 以模型保守包围盒和水平视场计算距离，保留两端及飞行微动的余量。
export function responsiveCameraFrames(desktop: CameraKeyframe[], profile: DeviceProfile): CameraKeyframe[] {
  if (profile.camera === 'desktop') return desktop
  const portrait = profile.camera === 'mobile-portrait'
  const fov = portrait ? 42 : 39
  const horizontalTangent = Math.tan(fov * Math.PI / 360) * profile.aspect
  const fit = 2.1 / Math.max(horizontalTangent * (portrait ? 0.78 : 0.82), 0.1)
  const distance = Math.max(portrait ? 7 : 5.5, fit)
  const verticalOffset = portrait ? -distance * Math.tan(fov * Math.PI / 360) * 0.32 : 0
  return desktop.map((frame, index) => {
    const angles = [-0.42, -0.7, 0.08, 0.65, 0.4]
    const angle = angles[index] ?? 0
    const scale = index === 1 || index === 3 ? 0.82 : 1
    const d = distance * scale
    return { ...frame, position: [Math.sin(angle) * d, d * 0.17, Math.cos(angle) * d], target: [0, verticalOffset * scale, 0], fov }
  })
}
