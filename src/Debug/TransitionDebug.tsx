import { type TransitionSettings } from '../Transition/DropletFlickerController'
import type { TransitionController } from '../Transition/TransitionController'
import { useSyncExternalStore } from 'react'
const controls: [keyof TransitionSettings, string, number, number, number][] = [
  ['flickerCount', '闪烁次数', 1, 5, 1], ['flickerInterval', '闪烁间隔 (ms)', 100, 500, 10], ['flickerIntensity', '闪烁强度', 0, 0.8, 0.02], ['flickerDuration', '闪烁持续时间 (ms)', 80, 500, 10], ['highlightBoost', '高光增强', 0, 1, 0.05], ['iconFade', '图标淡出 (ms)', 100, 1200, 50], ['sceneReveal', '三维水滴显现 (ms)', 100, 1500, 50], ['bootFade', '启动页淡出 (ms)', 100, 1500, 50], ['uiFade', '首页 UI 淡入 (ms)', 100, 1500, 50],
]
export function TransitionDebug({ transition, settings, setSettings, ready }: { transition: TransitionController; settings: TransitionSettings; setSettings: (value: TransitionSettings) => void; ready: boolean }) {
  const state = useSyncExternalStore(transition.subscribe, transition.getSnapshot)
  return <details><summary>启动转场</summary><div className="views"><button disabled={!ready} onClick={transition.play}>播放 / 重播</button><button disabled={!state.active || !state.started} onClick={state.paused ? transition.resume : transition.pause}>{state.paused ? '继续' : '暂停'}</button></div>{controls.map(([key, label, min, max, step]) => <label className="control" key={key}><span>{label}<output>{settings[key]}</output></span><input type="range" min={min} max={max} step={step} value={settings[key]} onChange={event => setSettings({ ...settings, [key]: Number(event.target.value) })} /></label>)}</details>
}
