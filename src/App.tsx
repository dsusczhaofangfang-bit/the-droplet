import { AmbientMotion } from './Interaction/AmbientMotion'
import { Canvas } from '@react-three/fiber'
import { Component, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ErrorInfo, type ReactNode } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace, type Group } from 'three'
import { Droplet } from './Droplet'
import { DeepSpaceEnvironment, defaultCosmicSettings } from './DeepSpaceEnvironment'
import { cameraSettings } from './Camera'
import { CameraRig } from './Camera/CameraRig'
import { cameraKeyframes } from './Camera/keyframes'
import { CameraDebug } from './Debug/CameraDebug'
import { performanceSettings, AdaptiveQualityController } from './Performance'
import { useDeviceProfile } from './Responsive'
import { responsiveCameraFrames } from './Camera/profiles'
import type { Quality } from './Flight/FlightController'
import { DebugPanel, SceneDebug, type View } from './Debug'
import { defaultDropletOptions } from './Geometry/DropletGeometry'
import { defaultMaterialSettings } from './Materials'
import { Portfolio } from './UI'
import { useNarrative } from './Narrative'
import { defaultFlightSettings } from './Flight/FlightController'
import { FlightMotionField } from './Flight/FlightMotionField'
import { CosmicMotionSystem } from './Flight/CosmicMotionSystem'
import { FlightDebug } from './Debug/FlightDebug'
import { defaultCosmicVisibility } from './DeepSpaceEnvironment/visibility'
import { BootManager } from './Boot/BootManager'
import { BootScreen } from './Boot/BootScreen'
import { SceneBoot } from './Boot/SceneBoot'
import { BootToHomeTransition } from './Transition/BootToHomeTransition'
import { TransitionController } from './Transition/TransitionController'
import { defaultTransitionSettings } from './Transition/DropletFlickerController'
import { TransitionDebug } from './Debug/TransitionDebug'

class SceneErrorBoundary extends Component<{ children: ReactNode; boot: BootManager }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('三维场景初始化失败', error, info); this.props.boot.fail(error) }
  render() { return this.state.failed ? null : this.props.children }
}
export function App() {
  const profile = useDeviceProfile()
  const reducedMotion = profile.reducedMotion
  const [quality, setQuality] = useState<Quality>(() => profile.pointer === 'coarse' ? 'medium' : 'high')
  const [attempt, setAttempt] = useState(0)
  const boot = useMemo(() => new BootManager(), [attempt])
  const transition = useMemo(() => new TransitionController(), [attempt])
  const [transitionSettings, setTransitionSettings] = useState(defaultTransitionSettings)
  transition.settings = transitionSettings
  const bootState = useSyncExternalStore(boot.subscribe, boot.getSnapshot)
  const [mountedAttempt, setMountedAttempt] = useState<number | null>(null)
  useEffect(() => {
    // 先绘制独立遮罩，再挂载三维场景和环境工作线程。
    let second = 0
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { boot.complete('application'); setMountedAttempt(attempt) }) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [boot, attempt])
  const [options, setOptions] = useState(defaultDropletOptions)
  const [material, setMaterial] = useState(defaultMaterialSettings)
  const [starfield, setStarfield] = useState(defaultCosmicSettings)
  const [visibility, setVisibility] = useState(defaultCosmicVisibility)
  const [view, setView] = useState<View>('front')
  const [cameraProgress, setCameraProgress] = useState(0)
  const narrativeProgress = useNarrative(setCameraProgress)
  const [frames, setFrames] = useState(cameraKeyframes)
  const responsiveFrames = useMemo(() => responsiveCameraFrames(frames, profile), [frames, profile])
  const [rigEnabled, setRigEnabled] = useState(true)
  const [flightSettings, setFlightSettings] = useState(defaultFlightSettings)
  const effectiveFlightSettings = useMemo(() => ({ ...flightSettings, quality, ...(reducedMotion ? { globalMotion: 0.15, motionBlur: 0.1, fov: false, baseSpeed: 1 } : {}) }), [flightSettings, quality, reducedMotion])
  const flight = useMemo(() => new FlightMotionField(), [])
  const dropletRef = useRef<Group>(null)
  return <><BootScreen key={attempt} manager={boot} transition={transition} onRetry={() => setAttempt(value => value + 1)} /><div className="viewport" aria-hidden="true">{mountedAttempt === attempt && <SceneErrorBoundary key={attempt} boot={boot}>
    <Canvas camera={cameraSettings} dpr={performanceSettings.dpr} gl={{ toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }} onCreated={({ gl }) => {
      const context = gl.getContext()
      if (context.isContextLost() || !gl.capabilities.maxTextureSize) { boot.fail(new Error('WebGL renderer unavailable')); return }
      gl.debug.onShaderError = (_gl, _program, vertex, fragment) => boot.fail(new Error('Shader compilation failed: ' + context.getShaderInfoLog(vertex) + ' ' + context.getShaderInfoLog(fragment)))
      gl.domElement.addEventListener('webglcontextlost', () => boot.fail(new Error('WebGL context lost')), { once: true })
      boot.complete('renderer')
    }}>
      <AdaptiveQualityController quality={quality} setQuality={setQuality} /><DeepSpaceEnvironment boot={boot} settings={starfield} visibility={visibility} material={material} flight={flight} flightSettings={effectiveFlightSettings} /><Droplet options={options} material={material} groupRef={dropletRef} /><CosmicMotionSystem flight={flight} settings={effectiveFlightSettings} droplet={dropletRef} /><CameraRig progress={reducedMotion ? cameraProgress * 0.25 : cameraProgress} frames={responsiveFrames} enabled={rigEnabled} flight={flight} flightSettings={effectiveFlightSettings} /><AmbientMotion droplet={dropletRef} reduced={reducedMotion} enabled={rigEnabled} /><SceneBoot manager={boot} droplet={dropletRef} />{!rigEnabled && <SceneDebug view={view} />}
    </Canvas>
  </SceneErrorBoundary>}</div><BootToHomeTransition boot={boot} transition={transition}><>{bootState.error && <p className="scene-warning" role="status">三维场景无法启动，仍可浏览完整作品集。</p>}<Portfolio progress={narrativeProgress} /></></BootToHomeTransition>{import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug') && <DebugPanel starfield={starfield} setStarfield={setStarfield} visibility={visibility} setVisibility={setVisibility} cameraControls={<><TransitionDebug transition={transition} settings={transitionSettings} setSettings={setTransitionSettings} ready={bootState.ready} /><FlightDebug settings={flightSettings} setSettings={setFlightSettings} /><CameraDebug progress={cameraProgress} setProgress={setCameraProgress} frames={frames} setFrames={setFrames} enabled={rigEnabled} setEnabled={setRigEnabled} /></>} options={options} setOptions={setOptions} material={material} setMaterial={setMaterial} view={view} setView={setView} />}</>
}





