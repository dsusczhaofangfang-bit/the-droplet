import { defaultFlightSettings, type FlightSettings } from '../Flight/FlightController'
import { MAX_PARTICLES } from '../Flight/particleMotion'

type Props = { settings: FlightSettings; setSettings: (settings: FlightSettings) => void }
const sliders: [keyof FlightSettings, string, number, number, number][] = [
  ['baseSpeed', '基础飞行速度', 0, 20, 0.5], ['maxSpeed', '最大飞行速度', 1, 40, 0.5],
  ['acceleration', '加速度', 0.1, 15, 0.1], ['deceleration', '减速度', 0.1, 15, 0.1],
  ['roll', '水滴姿态 · 滚转', -3.14, 3.14, 0.01], ['particleCount', '粒子数量', 0, MAX_PARTICLES, 100],
  ['particleSpeed', '粒子速度', 0, 3, 0.05], ['trailLength', '星光轨迹长度', 0, 3, 0.05],
  ['trailBrightness', '星光轨迹亮度', 0, 3, 0.05], ['parallax', '空间视差强度', 0, 3, 0.05],
  ['motionBlur', '运动模糊强度', 0, 2, 0.05], ['fovAmount', 'FOV 动态幅度', 0, 12, 0.5],
  ['inertia', '摄像机追踪惯性响应', 0.1, 10, 0.1], ['turnResponse', '摄像机转向响应', 0.1, 8, 0.1],
  ['globalMotion', '全局运动强度', 0, 3, 0.05], ['galaxyMotion', '远景星系视差', 0, 0.15, 0.005],
  ['nebulaMotion', '星云运动强度', 0, 0.3, 0.01], ['clusterMotion', '中景恒星运动强度', 0, 0.7, 0.01],
  ['nearMotion', '近景粒子运动强度', 0, 3, 0.05], ['nebulaFlow', '星云动态速度', 0, 3, 0.05],
]
export function FlightDebug({ settings, setSettings }: Props) {
  return <section><div className="panel-heading"><h2>高速飞行</h2><button onClick={() => setSettings(defaultFlightSettings)}>重置</button></div>
    <div className="views"><button onClick={() => setSettings({ ...settings, paused: !settings.paused })}>{settings.paused ? '继续' : '暂停'}</button>{([['cruise','巡航'], ['high','高速'], ['turn','转向']] as const).map(([mode, label]) => <button className={settings.mode === mode ? 'active' : ''} key={mode} onClick={() => setSettings({ ...settings, mode, paused: false })}>{label}</button>)}</div>
    <div className="vector-editor"><span>飞行方向</span>{(['X','Y','Z'] as const).map((axis, i) => <label key={axis}>{axis}<input type="number" step="0.1" value={settings.direction[i]} onChange={e => { const value = e.target.valueAsNumber; if (!Number.isFinite(value)) return; const direction: [number, number, number] = [...settings.direction]; direction[i] = value; setSettings({ ...settings, direction }) }} /></label>)}</div>
    {sliders.map(([key, label, min, max, step]) => <label className="control" key={key}><span>{label}<output>{settings[key] as number}</output></span><input type="range" min={min} max={max} step={step} value={settings[key] as number} onChange={e => setSettings({ ...settings, [key]: Number(e.target.value) })} /></label>)}
    {([['particles','近景粒子'], ['trails','方向轨迹'], ['localMotion','空间运动'], ['fov','动态 FOV'], ['galaxyMotionEnabled','远景运动'], ['nebulaMotionEnabled','星云运动'], ['clusterMotionEnabled','中景运动']] as const).map(([key,label]) => <label className="control" key={key}><input type="checkbox" checked={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} />{label}</label>)}
    <label className="control">画质<select value={settings.quality} onChange={e => setSettings({ ...settings, quality: e.target.value as FlightSettings['quality'] })}><option value="high">高</option><option value="medium">中</option><option value="low">低</option></select></label>
    <p>背景运动方向跟随飞行方向；远景反射与背景共享采样并低频更新。近景粒子不参与反射。</p>
  </section>
}
