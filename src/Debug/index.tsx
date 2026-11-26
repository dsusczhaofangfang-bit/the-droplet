import { OrbitControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect, type ReactNode } from 'react'
import type { DropletGeometryOptions } from '../Geometry/DropletGeometry'
import { defaultMaterialSettings, type MaterialSettings } from '../Materials'
import { EnvironmentPreview } from './EnvironmentPreview'
import { defaultCosmicSettings, type CosmicSettings } from '../DeepSpaceEnvironment'
import { defaultCosmicVisibility, type CosmicVisibility } from '../DeepSpaceEnvironment/visibility'

export type View = 'front' | 'side' | 'top' | 'head' | 'tail' | 'oblique'
const positions: Record<View, [number, number, number]> = {
  front: [0, 0, 6.8], side: [0, 0, -6.8], head: [-6.8, 0, 0], top: [0, 6.8, 0], tail: [6.8, 0, 0], oblique: [4.2, 2.8, 5.2],
}
export function SceneDebug({ view }: { view: View }) {
  const camera = useThree(state => state.camera)
  useEffect(() => { camera.position.set(...positions[view]); camera.up.set(0, 1, 0); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix() }, [camera, view])
  return <OrbitControls makeDefault enablePan={false} minDistance={3} maxDistance={12} />
}
const controls: { key: keyof DropletGeometryOptions; label: string; min: number; max: number; step: number }[] = [
  { key: 'length', label: '长度', min: 2.4, max: 5, step: 0.05 },
  { key: 'radius', label: '最大半径', min: 0.35, max: 0.9, step: 0.01 },
  { key: 'headCurvature', label: '头部曲率', min: 0, max: 2.5, step: 0.05 },
  { key: 'tailTaper', label: '尾部收束', min: 1, max: 1.8, step: 0.05 },
  { key: 'longitudinalSegments', label: '纵向细分', min: 32, max: 256, step: 8 },
  { key: 'radialSegments', label: '环向细分', min: 24, max: 256, step: 8 },
]
const materialControls: { key: Exclude<keyof MaterialSettings, 'preset'>; label: string; min: number; max: number; step: number }[] = [
  { key: 'roughness', label: '粗糙度', min: 0, max: 0.3, step: 0.005 },
  { key: 'envMapIntensity', label: '反射强度', min: 0, max: 3, step: 0.05 },
  { key: 'exposure', label: '曝光', min: 0.1, max: 2.5, step: 0.05 },
]
export function DebugPanel({ starfield, setStarfield, visibility, setVisibility, cameraControls, options, setOptions, material, setMaterial, view, setView }: { starfield: CosmicSettings; setStarfield: (settings: CosmicSettings) => void; visibility: CosmicVisibility; setVisibility: (settings: CosmicVisibility) => void; cameraControls: ReactNode; options: DropletGeometryOptions; setOptions: (options: DropletGeometryOptions) => void; material: MaterialSettings; setMaterial: (settings: MaterialSettings) => void; view: View; setView: (view: View) => void }) {
  const views: [View, string][] = [['front', '正面'], ['side', '侧面'], ['top', '顶部'], ['head', '头部'], ['tail', '尾部'], ['oblique', '斜侧']]
  return <aside className="debug-panel"><h1>场景调试</h1>
    <section><div className="panel-heading"><h2>背景与宇宙反射</h2><button onClick={() => setVisibility(defaultCosmicVisibility)}>重置</button></div>
      {([['backgroundVisible', '深空背景显示'], ['reflectionEnabled', '宇宙环境反射'], ['starsReflection', '恒星反射（含星团）'], ['galaxiesReflection', '星系反射'], ['nebulaeReflection', '星云反射']] as const).map(([key, label]) => <label className="control" key={key}><input type="checkbox" checked={visibility[key]} onChange={event => setVisibility({ ...visibility, [key]: event.target.checked })} />{label}</label>)}
      {([['backgroundBrightness', '背景亮度'], ['reflectionIntensity', '环境反射强度']] as const).map(([key, label]) => <label className="control" key={key}><span>{label}<output>{visibility[key].toFixed(2)}</output></span><input type="range" min="0" max="3" step="0.05" value={visibility[key]} onChange={event => setVisibility({ ...visibility, [key]: Number(event.target.value) })} /></label>)}
    </section>{cameraControls}<p>自由观察：拖动旋转 · 滚轮缩放</p>
    <div className="views">{views.map(([key, label]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>{label}</button>)}</div>
    <div className="panel-heading"><h2>镜面与反射</h2><button onClick={() => setMaterial(defaultMaterialSettings)}>重置</button></div>
    {materialControls.map(({ key, label, min, max, step }) => <label className="control" key={key}><span>{label}<output>{material[key].toFixed(key === 'roughness' ? 3 : 2)}</output></span><input type="range" min={min} max={max} step={step} value={material[key]} onChange={event => setMaterial({ ...material, [key]: Number(event.target.value) })} /></label>)}
    <div className="panel-heading"><h2>深空环境</h2><button onClick={() => setStarfield(defaultCosmicSettings)}>重置</button></div>
    {([['stars', '恒星'], ['clusters', '星团'], ['nebulae', '星云'], ['galaxies', '星系']] as const).map(([key, label]) => <label className="control" key={key}><input type="checkbox" checked={starfield[key]} onChange={event => setStarfield({ ...starfield, [key]: event.target.checked })} />{label}</label>)}
    {([['seed', '随机种子', 1, 999999, 1], ['brightness', '环境亮度', 0, 3, 0.05], ['rotation', '环境旋转', -3.14, 3.14, 0.01], ['starCount', '恒星数量', 0, 30000, 500], ['density', '恒星密度', 0, 2, 0.05], ['size', '恒星尺寸', 0.3, 3, 0.1], ['starBrightness', '恒星亮度', 0, 3, 0.1], ['temperature', '恒星色温', -0.5, 0.5, 0.05], ['clusterCount', '星团数量', 0, 15, 1], ['clusterDensity', '星团密度', 0, 3, 0.1], ['clusterSize', '星团尺寸', 0.3, 3, 0.1], ['clusterBrightness', '星团亮度', 0, 3, 0.1], ['nebulaCount', '星云数量', 0, 10, 1], ['nebula', '星云强度', 0, 3, 0.1], ['noiseScale', '噪声尺度', 0.3, 3, 0.1], ['opacity', '星云透明度', 0, 2, 0.1], ['galaxyCount', '星系数量', 0, 30, 1], ['galaxySize', '星系尺寸', 0.3, 3, 0.1], ['arms', '旋臂数量', 1, 5, 1], ['core', '核心亮度', 0, 3, 0.1], ['galaxyRotation', '星系旋转', -3.14, 3.14, 0.1], ['dust', '尘埃强度', 0, 2, 0.1]] as const).map(([key, label, min, max, step]) => <label className="control" key={key}><span>{label}<output>{starfield[key]}</output></span><input type="range" min={min} max={max} step={step} value={starfield[key]} onChange={event => setStarfield({ ...starfield, [key]: Number(event.target.value) })} /></label>)}
    <label className="control">星云颜色<input type="color" value={starfield.nebulaColor} onChange={event => setStarfield({ ...starfield, nebulaColor: event.target.value })} /></label>
    <label className="control">星系类型<select value={starfield.galaxyType} onChange={event => setStarfield({ ...starfield, galaxyType: event.target.value as CosmicSettings['galaxyType'] })}>{[['all', '混合'], ['spiral', '旋涡'], ['barred', '棒旋'], ['elliptical', '椭圆'], ['lenticular', '透镜'], ['irregular', '不规则']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="control">环境贴图分辨率 / 画质<select value={starfield.resolution} onChange={event => setStarfield({ ...starfield, resolution: Number(event.target.value) })}><option value={512}>低 · 512</option><option value={1024}>中 · 1024</option><option value={2048}>高 · 2048</option><option value={4096}>极高 · 4096</option></select></label>
    <EnvironmentPreview settings={starfield} material={material} />
    <details><summary>几何参数</summary>
    {controls.map(({ key, label, min, max, step }) => <label className="control" key={key}><span>{label}<output>{options[key]}</output></span><input type="range" min={min} max={max} step={step} value={options[key]} onChange={event => setOptions({ ...options, [key]: Number(event.target.value) })} /></label>)}
    </details>
  </aside>
}



