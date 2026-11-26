/** 五个摄影棚状态共用同一张反射环境；旋转以弧度表示。 */
export interface StudioLightingState {
  rotation: readonly [number, number, number]
  intensity: number
}

export const studioLightingStates: readonly StudioLightingState[] = [
  { rotation: [0, 0, 0], intensity: 1 },
  { rotation: [0.22, -0.38, 0.16], intensity: 1.08 },
  { rotation: [-0.12, 0.62, -0.32], intensity: 1.02 },
  { rotation: [0.38, 1.12, 0.42], intensity: 0.88 },
  { rotation: [0.1, 1.65, 0.12], intensity: 0.28 },
]

/** 将叙事进度映射到摄影棚状态；在关键点处平滑衔接。 */
export function sampleStudioLighting(progress: number): StudioLightingState {
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0
  const position = clamped * (studioLightingStates.length - 1)
  const index = Math.min(Math.floor(position), studioLightingStates.length - 2)
  const t = position - index
  const blend = t * t * (3 - 2 * t)
  const from = studioLightingStates[index], to = studioLightingStates[index + 1]
  const lerp = (a: number, b: number) => a + (b - a) * blend
  return {
    rotation: [lerp(from.rotation[0], to.rotation[0]), lerp(from.rotation[1], to.rotation[1]), lerp(from.rotation[2], to.rotation[2])],
    intensity: lerp(from.intensity, to.intensity),
  }
}
