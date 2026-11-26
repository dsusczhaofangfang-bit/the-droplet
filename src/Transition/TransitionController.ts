import { defaultTransitionSettings, sampleTransition, type TransitionSettings } from './DropletFlickerController'

export interface TransitionSnapshot { active: boolean; paused: boolean; started: boolean }
export class TransitionController {
  settings: TransitionSettings = { ...defaultTransitionSettings }
  private snapshot: TransitionSnapshot = { active: true, paused: false, started: false }
  private listeners = new Set<() => void>()
  private frame = 0
  private elapsed = 0
  private last: number | null = null
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  getSnapshot = () => this.snapshot
  private publish(snapshot: TransitionSnapshot) { this.snapshot = snapshot; this.listeners.forEach(listener => listener()) }
  private paint() {
    const value = sampleTransition(this.elapsed, this.settings), style = document.documentElement.style
    style.setProperty('--transition-loader', String(value.loaderOpacity))
    style.setProperty('--transition-icon', String(value.iconOpacity))
    style.setProperty('--transition-flicker', String(value.flicker.intensity))
    style.setProperty('--transition-highlight', String(value.flicker.highlight))
    style.setProperty('--transition-scene', String(value.mainSceneOpacity))
    style.setProperty('--transition-particles', String(value.particleVisibility))
    style.setProperty('--transition-ui', String(value.uiVisibility))
    style.setProperty('--transition-progress', String(value.transitionProgress))
    return value.done
  }
  private tick = (now: number) => {
    if (this.snapshot.paused || !this.snapshot.active) return
    if (this.last !== null && !document.hidden) this.elapsed += Math.min(now - this.last, 100)
    this.last = now
    if (this.paint()) { this.frame = 0; this.publish({ active: false, paused: false, started: true }); return }
    this.frame = requestAnimationFrame(this.tick)
  }
  play = () => {
    cancelAnimationFrame(this.frame); this.elapsed = 0; this.last = null
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.elapsed = Number.MAX_SAFE_INTEGER; this.paint(); this.publish({ active: false, paused: false, started: true }); return
    }
    this.paint(); this.publish({ active: true, paused: false, started: true })
    this.frame = requestAnimationFrame(this.tick)
  }
  pause = () => { if (!this.snapshot.active || !this.snapshot.started || this.snapshot.paused) return; cancelAnimationFrame(this.frame); this.last = null; this.publish({ ...this.snapshot, paused: true }) }
  resume = () => { if (!this.snapshot.paused) return; this.last = null; this.publish({ ...this.snapshot, paused: false }); this.frame = requestAnimationFrame(this.tick) }
  dispose = () => { cancelAnimationFrame(this.frame); this.frame = 0; this.last = null }
}
