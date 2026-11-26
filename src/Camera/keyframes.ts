export type Vec3 = [number, number, number]
export interface CameraKeyframe { name: string; position: Vec3; target: Vec3; fov: number }

// 水滴沿 X 轴放置：负 X 为圆头，正 X 为尾部。
export const cameraKeyframes: CameraKeyframe[] = [
  { name: '01 Encounter', position: [-3.4, 2.1, 6.2], target: [0, 0, 0], fov: 35 },
  { name: '02 Structure', position: [-2.7, 0.8, 2.3], target: [-1.15, 0, 0], fov: 36 },
  { name: '03 Creation', position: [0.2, 1.15, 3.2], target: [-0.1, 0, 0], fov: 39 },
  { name: '04 Reflection', position: [2.7, 0.65, 2.1], target: [0.85, 0, 0], fov: 34 },
  { name: '05 Infinity', position: [4.8, 2.7, 10.5], target: [0.25, 0, 0], fov: 42 },
]
