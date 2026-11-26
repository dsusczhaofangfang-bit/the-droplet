export interface TransitionSettings {
  flickerCount: number; flickerInterval: number; flickerIntensity: number; flickerDuration: number; highlightBoost: number
  iconFade: number; sceneReveal: number; bootFade: number; uiFade: number
}
export const defaultTransitionSettings: TransitionSettings = {
  flickerCount: 3, flickerInterval: 200, flickerIntensity: 0.24, flickerDuration: 170, highlightBoost: 0.4,
  iconFade: 300, sceneReveal: 650, bootFade: 650, uiFade: 500,
}
const clamp = (x: number) => Math.max(0, Math.min(1, x))
const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t) }
export function DropletFlickerController(time: number, settings: TransitionSettings) {
  let pulse = 0
  for (let i = 0; i < settings.flickerCount; i++) {
    const phase = (time - 400 - i * settings.flickerInterval) / Math.max(1, settings.flickerDuration)
    if (phase > 0 && phase < 1) pulse = Math.max(pulse, Math.sin(Math.PI * phase) ** 2)
  }
  return { progress: clamp((time - 400) / Math.max(1, (settings.flickerCount - 1) * settings.flickerInterval + settings.flickerDuration)), intensity: pulse * settings.flickerIntensity, highlight: pulse * settings.highlightBoost }
}
export function sampleTransition(time: number, settings: TransitionSettings) {
  const flicker = DropletFlickerController(time, settings)
  const handoff = 400 + Math.max(0, settings.flickerCount - 1) * settings.flickerInterval + settings.flickerDuration + 80
  const icon = 1 - smooth((time - handoff) / Math.max(1, settings.iconFade))
  // 遮罩稍后打开，避免两个不同轮廓的水滴同时清晰可见。
  const scene = smooth((time - handoff - settings.iconFade * 0.55) / Math.max(1, settings.sceneReveal))
  const loader = 1 - smooth((time - handoff - settings.iconFade * 0.55) / Math.max(1, settings.bootFade))
  const reveal = Math.min(scene, 1 - loader)
  const uiStart = handoff + settings.iconFade * 0.55 + Math.max(settings.sceneReveal, settings.bootFade) * 0.75
  const ui = smooth((time - uiStart) / Math.max(1, settings.uiFade))
  const duration = uiStart + settings.uiFade
  return { flicker, transitionProgress: clamp(time / Math.max(1, duration)), loaderOpacity: loader, iconOpacity: icon, mainSceneOpacity: reveal, particleVisibility: reveal, uiVisibility: ui, done: time >= duration }
}
