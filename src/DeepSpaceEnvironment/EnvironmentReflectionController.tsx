import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BackSide, BoxGeometry, Color, DataTexture, EquirectangularReflectionMapping, FloatType, HalfFloatType, LinearFilter, LinearSRGBColorSpace, Mesh, OrthographicCamera, PlaneGeometry, PMREMGenerator, RepeatWrapping, RGBAFormat, Scene, ShaderMaterial, Vector3, WebGLRenderTarget } from 'three'
import type { CosmicSettings } from './shared'
import type { MaterialSettings } from '../Materials'
import type { FlightMotionField } from '../Flight/FlightMotionField'
import type { FlightSettings } from '../Flight/FlightController'
import type { CosmicVisibility } from './visibility'
import type { BootManager } from '../Boot/BootManager'

const fragmentShader = `
uniform sampler2D stars; uniform sampler2D galaxies; uniform sampler2D nebulae; uniform sampler2D clusters;
uniform vec3 travel; uniform float galaxyAmount; uniform float nebulaAmount; uniform float clusterAmount;
uniform float flightTime; uniform float flow; uniform float speed; uniform float acceleration;
uniform float starsMask; uniform float galaxiesMask; uniform float nebulaeMask;
varying vec2 vUv;
const float PI = 3.141592653589793;
vec2 directionUv(vec3 d) { d = normalize(d); return vec2(atan(d.z, d.x) / (2.0 * PI) + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5); }
vec3 sampleLayer(sampler2D layer, vec3 direction, float amount) {
  // 将观测方向投射到不同深度的球面，保持星系和星团形状。
  return texture2D(layer, directionUv(normalize(direction + travel * amount * 0.003))).rgb;
}
void main() {
  float lon = (vUv.x - 0.5) * 2.0 * PI; float lat = (vUv.y - 0.5) * PI;
  vec3 d = vec3(cos(lat)*cos(lon), sin(lat), cos(lat)*sin(lon));
  vec3 cloudDir = normalize(d + vec3(sin(flightTime * 0.025), cos(flightTime * 0.019), sin(flightTime * 0.021)) * flow * (0.0003 + speed * 0.0008 + abs(acceleration) * 0.00004));
  vec3 color = texture2D(stars, vUv).rgb * starsMask + sampleLayer(galaxies, d, galaxyAmount) * galaxiesMask + sampleLayer(nebulae, cloudDir, nebulaAmount) * nebulaeMask + sampleLayer(clusters, d, clusterAmount) * starsMask;
  gl_FragColor = vec4(color, 1.0);
}`

type EnvironmentProps = { settings: CosmicSettings; visibility: CosmicVisibility; material: MaterialSettings; flight: FlightMotionField; flightSettings: FlightSettings; boot: BootManager }

export function EnvironmentReflectionController(props: EnvironmentProps) {
  const { rotation: _rotation, ...mapSettings } = props.settings
  const mapKey = JSON.stringify(mapSettings)
  const [result, setResult] = useState<{ key: string; buffers: ArrayBuffer[] } | null>(null)
  useEffect(() => {
    // 取消过期请求，避免调试参数变化或重试时覆盖新资源。
    const worker = new Worker(new URL('./environment.worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<{ type: string; completed?: number; buffers?: ArrayBuffer[]; message?: string }>) => {
      if (event.data.type === 'progress') props.boot.progress('environment', (event.data.completed ?? 0) / 4)
      if (event.data.type === 'complete' && event.data.buffers) {
        setResult({ key: mapKey, buffers: event.data.buffers })
        props.boot.complete('environment')
      }
      if (event.data.type === 'error') props.boot.fail(new Error(event.data.message || 'Environment generation failed'))
    }
    worker.onerror = event => props.boot.fail(new Error(event.message || 'Environment worker failed'))
    worker.postMessage(JSON.parse(mapKey))
    return () => worker.terminate()
  }, [mapKey, props.boot])
  if (!result || result.key !== mapKey) return null
  return <EnvironmentResources {...props} buffers={result.buffers} mapKey={mapKey} />
}

function EnvironmentResources({ settings, visibility, material, flight, flightSettings, boot, buffers, mapKey }: EnvironmentProps & { buffers: ArrayBuffer[]; mapKey: string }) {
  const { gl, scene } = useThree()
  const { rotation } = settings
  const lastReflection = useRef(-Infinity)
  const pendingDisposal = useRef<{ resources: object; timer: ReturnType<typeof setTimeout> } | null>(null)
  const resources = useMemo(() => {
    const config = JSON.parse(mapKey) as CosmicSettings
    // 转移后的数组直接用于纹理，不重复复制或重新计算环境数据。
    const layers = buffers.map(buffer => {
      const texture = new DataTexture(new Float32Array(buffer), config.resolution, config.resolution / 2, RGBAFormat, FloatType)
      texture.colorSpace = LinearSRGBColorSpace; texture.minFilter = LinearFilter; texture.magFilter = LinearFilter; texture.wrapS = RepeatWrapping; texture.needsUpdate = true
      return texture
    })
    const shader = new ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.0,1.0);}', fragmentShader, depthTest: false, depthWrite: false, uniforms: {
      stars: { value: layers[0] }, galaxies: { value: layers[1] }, nebulae: { value: layers[2] }, clusters: { value: layers[3] }, travel: { value: new Vector3() }, galaxyAmount: { value: 0 }, nebulaAmount: { value: 0 }, clusterAmount: { value: 0 }, flightTime: { value: 0 }, flow: { value: 0 }, speed: { value: 0 }, acceleration: { value: 0 }, starsMask: { value: 1 }, galaxiesMask: { value: 1 }, nebulaeMask: { value: 1 },
    } })
    const renderScene = new Scene(), geometry = new PlaneGeometry(2, 2), quad = new Mesh(geometry, shader)
    renderScene.add(quad)
    const renderCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const target = new WebGLRenderTarget(Math.min(config.resolution, 1024), Math.min(config.resolution, 1024) / 2, { type: HalfFloatType, depthBuffer: false })
    target.texture.mapping = EquirectangularReflectionMapping; target.texture.colorSpace = LinearSRGBColorSpace
    const reflectionTarget = target.clone()
    const generator = new PMREMGenerator(gl)
    // Three.js 会缓存等距柱状 scene.background 的立方体转换，动态背景改为直接采样同一张纹理。
    const skyGeometry = new BoxGeometry(100, 100, 100)
    const skyMaterial = new ShaderMaterial({ side: BackSide, depthWrite: false, uniforms: { sky: { value: target.texture }, brightness: { value: 1 } }, vertexShader: 'varying vec3 vDirection; void main(){ vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: `uniform sampler2D sky; uniform float brightness; varying vec3 vDirection;
      void main(){ vec3 d=normalize(vDirection); vec2 uv=vec2(atan(d.z,d.x)/6.28318530718+0.5,asin(clamp(d.y,-1.0,1.0))/3.14159265359+0.5); gl_FragColor=vec4(texture2D(sky,uv).rgb*brightness/24.0,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }` })
    const sky = new Mesh(skyGeometry, skyMaterial); sky.frustumCulled = false; sky.renderOrder = -1000
    return { layers, shader, geometry, renderScene, renderCamera, target, reflectionTarget, generator, sky, skyGeometry, skyMaterial, reflection: null as ReturnType<PMREMGenerator['fromEquirectangular']> | null }
  }, [gl, mapKey, buffers])
  useEffect(() => {
    // StrictMode 会立即重新挂载 effect；仅在资源确实离开场景后释放。
    if (pendingDisposal.current?.resources === resources) {
      clearTimeout(pendingDisposal.current.timer)
      pendingDisposal.current = null
    }
    const oldBackground = scene.background, oldEnvironment = scene.environment
    scene.background = new Color(0x000000)
    scene.add(resources.sky)
    lastReflection.current = -Infinity
    return () => {
      scene.remove(resources.sky); scene.background = oldBackground; scene.environment = oldEnvironment
      const timer = setTimeout(() => {
        resources.reflection?.dispose(); resources.target.dispose(); resources.reflectionTarget.dispose(); resources.generator.dispose(); resources.geometry.dispose(); resources.shader.dispose(); resources.skyGeometry.dispose(); resources.skyMaterial.dispose(); resources.layers.forEach(texture => texture.dispose())
      }, 0)
      pendingDisposal.current = { resources, timer }
    }
  }, [scene, resources])
  useEffect(() => { resources.sky.rotation.y = rotation; scene.environmentRotation.set(0, rotation, 0) }, [scene, rotation, resources])
  useEffect(() => {
    resources.sky.visible = visibility.backgroundVisible
    resources.skyMaterial.uniforms.brightness.value = visibility.backgroundBrightness
    scene.environmentIntensity = visibility.reflectionEnabled ? visibility.reflectionIntensity : 0
  }, [scene, resources, visibility.backgroundVisible, visibility.backgroundBrightness, visibility.reflectionEnabled, visibility.reflectionIntensity])
  useEffect(() => { lastReflection.current = -Infinity }, [visibility.starsReflection, visibility.galaxiesReflection, visibility.nebulaeReflection])
  useEffect(() => { gl.toneMappingExposure = material.exposure }, [gl, material.exposure])
  useFrame(({ camera }) => {
    if (boot.getSnapshot().error) return
    try {
    resources.sky.position.copy(camera.position)
    const u = resources.shader.uniforms, strength = flightSettings.globalMotion
    u.travel.value.copy(flight.position)
    u.galaxyAmount.value = flightSettings.galaxyMotionEnabled ? flightSettings.galaxyMotion * strength : 0
    u.nebulaAmount.value = flightSettings.nebulaMotionEnabled ? flightSettings.nebulaMotion * strength : 0
    u.clusterAmount.value = flightSettings.clusterMotionEnabled ? flightSettings.clusterMotion * strength : 0
    u.flightTime.value = flight.elapsed; u.flow.value = flightSettings.nebulaMotionEnabled ? flightSettings.nebulaFlow * strength : 0
    u.speed.value = flight.speed / Math.max(0.01, flightSettings.maxSpeed); u.acceleration.value = flight.acceleration
    const previousTarget = gl.getRenderTarget()
    // 背景始终采样完整环境；反射单独合成，开关不改变背景纹理或天体数据。
    if (visibility.backgroundVisible) {
      u.starsMask.value = 1; u.galaxiesMask.value = 1; u.nebulaeMask.value = 1
      gl.setRenderTarget(resources.target); gl.render(resources.renderScene, resources.renderCamera)
    }
    // PMREM 有节流，复用输出目标；近景粒子不参与环境反射。
    if (!resources.reflection || flight.elapsed - lastReflection.current >= 0.5) {
      u.starsMask.value = Number(visibility.starsReflection); u.galaxiesMask.value = Number(visibility.galaxiesReflection); u.nebulaeMask.value = Number(visibility.nebulaeReflection)
      gl.setRenderTarget(resources.reflectionTarget); gl.render(resources.renderScene, resources.renderCamera)
      resources.reflection = resources.generator.fromEquirectangular(resources.reflectionTarget.texture, resources.reflection ?? undefined)
      scene.environment = resources.reflection.texture
      boot.complete('reflection')
      lastReflection.current = flight.elapsed
    }
    gl.setRenderTarget(previousTarget)
    } catch (error) { boot.fail(error) }
  }, -1)
  return null
}
