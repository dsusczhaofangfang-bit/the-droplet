// 用实际速度计算轨迹强度，巡航速度改变时不能把可见轨迹归零。
export function particleSpeedRatio(speed: number, maxSpeed: number): number {
  return Math.min(1, Math.max(0, speed / Math.max(maxSpeed, 0.01)))
}
export const MAX_PARTICLES = 20000

