import { useEffect, useState } from 'react'
import { cameraKeyframes, type CameraKeyframe, type Vec3 } from '../Camera/keyframes'

type Props = { progress: number; setProgress: (value: number) => void; frames: CameraKeyframe[]; setFrames: (frames: CameraKeyframe[]) => void; enabled: boolean; setEnabled: (enabled: boolean) => void }
export function CameraDebug({ progress, setProgress, frames, setFrames, enabled, setEnabled }: Props) {
  const [playing, setPlaying] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [selected, setSelected] = useState(0)
  useEffect(() => {
    if (!playing || !enabled) return
    let previous = 0, id = 0
    const tick = (time: number) => {
      if (previous) {
        const next = Math.max(0, Math.min(1, progressRef.current + direction * (time - previous) / 30000))
        progressRef.current = next; setProgress(next)
        if (next === 0 || next === 1) { setPlaying(false); return }
      }
      previous = time; id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [playing, direction, enabled, setProgress])
  // 拖动时间轴时立即更新播放基准，避免闭包中的旧进度。
  const progressRef = useProgressRef(progress)
  const frame = frames[selected]
  const editVector = (field: 'position' | 'target', axis: number, value: number) => {
    const next = frames.map((item, index) => index === selected ? { ...item, [field]: item[field].map((v, i) => i === axis ? value : v) as Vec3 } : item)
    setFrames(next)
  }
  const select = (index: number) => { setSelected(index); setProgress(index / (frames.length - 1)); setPlaying(false); setEnabled(true) }
  return <section className="camera-debug"><div className="panel-heading"><h2>Camera Rig · 镜头预览</h2><button onClick={() => { setFrames(cameraKeyframes.map(f => ({ ...f, position: [...f.position], target: [...f.target] }))); setPlaying(false) }}>重置关键帧</button></div>
    <div className="views"><button className={enabled ? 'active' : ''} onClick={() => setEnabled(true)}>镜头路径</button><button className={!enabled ? 'active' : ''} onClick={() => { setEnabled(false); setPlaying(false) }}>自由观察</button></div>
    <label className="control"><span>时间轴 <output>{progress.toFixed(3)}</output></span><input aria-label="镜头进度" type="range" min="0" max="1" step="0.001" value={progress} onChange={e => { setEnabled(true); setPlaying(false); setProgress(Number(e.target.value)) }} /></label>
    <div className="views"><button onClick={() => { setDirection(-1); setEnabled(true); setPlaying(true) }}>反向播放</button><button onClick={() => setPlaying(false)}>暂停</button><button onClick={() => { setDirection(1); setEnabled(true); setPlaying(true) }}>正向播放</button></div>
    <label className="control">编辑关键帧<select value={selected} onChange={e => select(Number(e.target.value))}>{frames.map((item, i) => <option key={item.name} value={i}>{item.name}</option>)}</select></label>
    {(['position', 'target'] as const).map(field => <div className="vector-editor" key={field}><span>{field === 'position' ? '位置' : '观察目标'}</span>{(['X', 'Y', 'Z'] as const).map((axis, i) => <label key={axis}>{axis}<input type="number" step="0.1" value={frame[field][i]} onChange={e => { const value = e.target.valueAsNumber; if (Number.isFinite(value)) editVector(field, i, value) }} /></label>)}</div>)}
    <label className="control"><span>视角 FOV <output>{frame.fov.toFixed(1)}°</output></span><input type="range" min="20" max="70" step="0.5" value={frame.fov} onChange={e => setFrames(frames.map((item, i) => i === selected ? { ...item, fov: Number(e.target.value) } : item))} /></label>
    <p>路径以默认水滴尺寸设计；编辑关键帧或几何尺寸后请检查穿模。</p>
  </section>
}
import { useRef } from 'react'
function useProgressRef(progress: number) { const ref = useRef(progress); ref.current = progress; return ref }
