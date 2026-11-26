import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import type { BootManager } from '../Boot/BootManager'
import type { TransitionController } from './TransitionController'

export function BootToHomeTransition({ boot, transition, children }: { boot: BootManager; transition: TransitionController; children: ReactNode }) {
  const bootState = useSyncExternalStore(boot.subscribe, boot.getSnapshot)
  const state = useSyncExternalStore(transition.subscribe, transition.getSnapshot)
  useEffect(() => {
    if (bootState.error && !state.started) transition.finish()
    else if (bootState.ready && !state.started) transition.play()
  }, [bootState.ready, bootState.error, state.started, transition])
  useEffect(() => () => transition.dispose(), [transition])
  return <div className="home-transition" inert={state.active}>{children}</div>
}
