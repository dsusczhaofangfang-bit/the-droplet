import { useEffect, useSyncExternalStore } from 'react'
import type { TransitionController } from '../Transition/TransitionController'
import type { BootManager } from './BootManager'

export function DropletLoaderIcon() {
  return <svg className="boot-droplet" viewBox="0 0 32 44" aria-hidden="true"><defs><linearGradient id="droplet-metal" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#6d777e"/><stop offset=".24" stopColor="#f4f7f8"/><stop offset=".5" stopColor="#a8b1b6"/><stop offset=".77" stopColor="#edf1f2"/><stop offset="1" stopColor="#667077"/></linearGradient></defs><path d="M16 2C13 10 3.5 21 3.5 29.2a12.5 12.5 0 0 0 25 0C28.5 21 19 10 16 2Z" fill="url(#droplet-metal)"/><path className="boot-droplet-highlight" d="M16 5C13 13 7 21 7 28c0 5 2.4 8.1 5.4 9.5C10 34 10 29 11.4 24 12.6 19 14.8 11 16 5Z" fill="#fff"/></svg>
}
export function CircularProgressRing({ progress }: { progress: number }) {
  const circumference = 2 * Math.PI * 48
  return <svg className="boot-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48"/><circle className="boot-ring-progress" cx="50" cy="50" r="48" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} /></svg>
}
export function BootScreen({ manager, transition, onRetry }: { manager: BootManager; transition: TransitionController; onRetry: () => void }) {
  const state = useSyncExternalStore(manager.subscribe, manager.getSnapshot)
  const transitionState = useSyncExternalStore(transition.subscribe, transition.getSnapshot)
  useEffect(() => {
    if (!transitionState.active) return
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = old }
  }, [transitionState.active])
  if (!transitionState.active) return null
  return <div className="boot-screen" role="status" aria-live="polite"><div className="boot-content"><div className="boot-mark"><CircularProgressRing progress={state.progress}/><DropletLoaderIcon/></div><p className="boot-status">{state.status} · {Math.floor(state.progress)}%</p>{state.error && <><p className="boot-error">Unable to initialize the scene.</p><button className="boot-retry" onClick={onRetry}>TRY AGAIN</button></>}</div></div>
}
