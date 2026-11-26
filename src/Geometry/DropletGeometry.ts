import { BufferAttribute, BufferGeometry } from 'three'

export interface DropletGeometryOptions {
  length: number
  radius: number
  headCurvature: number
  tailTaper: number
  longitudinalSegments: number
  radialSegments: number
}

export const defaultDropletOptions: DropletGeometryOptions = {
  length: 3.6, radius: 0.74, headCurvature: 0.45, tailTaper: 1.2,
  longitudinalSegments: 160, radialSegments: 128,
}

/** 以单条解析母线绕 X 轴旋转；头部采用平方轴向参数，避免球极处的曲率突变。 */
export function createDropletGeometry(options: DropletGeometryOptions): BufferGeometry {
  const { length, radius, headCurvature, tailTaper } = options
  const rows = Math.max(8, Math.floor(options.longitudinalSegments))
  const columns = Math.max(8, Math.floor(options.radialSegments))
  // 母线在头部具有垂直切线，尾部仅在收束点允许奇异；归一化使半径参数保持实际最大值。
  const profile = (t: number) => Math.sin(Math.PI * t) * Math.pow(1 - t, tailTaper - 1) * Math.exp(-headCurvature * t)
  let peak = 0
  for (let i = 1; i < 4096; i++) peak = Math.max(peak, profile(i / 4096))
  const scale = radius / peak
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  for (let i = 0; i <= rows; i++) {
    const t = i / rows
    const x = length * (t * t - 0.5)
    const r = i === 0 || i === rows ? 0 : scale * profile(t)
    // 用解析切线而非三角面平均值求法线，圆周接缝和不同细分下的光照保持连续。
    const dx = 2 * length * t
    const dr = i === rows ? (tailTaper === 1 ? -Math.PI * scale * Math.exp(-headCurvature) : 0) :
      scale * Math.exp(-headCurvature * t) * Math.pow(1 - t, tailTaper - 1) *
      (Math.PI * Math.cos(Math.PI * t) - headCurvature * Math.sin(Math.PI * t) - (tailTaper - 1) * Math.sin(Math.PI * t) / (1 - t))
    const magnitude = Math.hypot(dx, dr)
    const nx = -dr / magnitude
    const nr = dx / magnitude
    for (let j = 0; j <= columns; j++) {
      const angle = 2 * Math.PI * j / columns
      const c = Math.cos(angle), s = Math.sin(angle)
      positions.push(x, r * c, r * s)
      normals.push(nx, nr * c, nr * s)
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const a = i * (columns + 1) + j, b = a + columns + 1
      // 极点只生成非退化三角形；尾端按扇区保留各自的极限法线。
      if (i > 0) indices.push(a, a + 1, b)
      if (i < rows - 1) indices.push(a + 1, b + 1, b)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}
