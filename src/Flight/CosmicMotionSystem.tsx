import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, BufferAttribute, InstancedBufferAttribute, InstancedBufferGeometry, MathUtils, ShaderMaterial, Vector3, type Group } from 'three'
import { type FlightSettings } from './FlightController'
import { FlightMotionField } from './FlightMotionField'
import { MAX_PARTICLES, particleSpeedRatio } from './particleMotion'

const vertexShader = `
attribute vec3 seedPosition;
attribute float seedSize;
uniform vec3 displacement;
uniform vec3 flightDirection;
uniform float speedRatio;
uniform float trailLength;
uniform float particleScale;
uniform float motionStrength;
varying float vFade;
varying vec2 vUv;
void main() {
  // 粒子在世界空间循环，头尾淡出隐藏回收边界。
  vec3 p = mod(seedPosition - displacement + 40.0, 80.0) - 40.0;
  float edge = 1.0 - smoothstep(34.0, 39.5, max(max(abs(p.x), abs(p.y)), abs(p.z)));
  float lengthWorld = (0.035 + speedRatio * trailLength * motionStrength * 2.4) * seedSize;
  vec3 endPoint = p + flightDirection * lengthWorld;
  vec3 segment = endPoint - p;
  float closest = clamp(-dot(p, segment) / max(dot(segment, segment), 0.00001), 0.0, 1.0);
  float exclusion = smoothstep(3.0, 4.0, length(p + segment * closest));
  vec4 viewHead = viewMatrix * vec4(p, 1.0);
  vec4 viewTail = viewMatrix * vec4(endPoint, 1.0);
  vec4 clipHead = projectionMatrix * viewHead;
  vec4 clipTail = projectionMatrix * viewTail;
  vec2 projected = clipHead.xy / max(clipHead.w, 0.001) - clipTail.xy / max(clipTail.w, 0.001);
  vec2 tangent = length(projected) > 0.00001 ? normalize(projected) : vec2(1.0, 0.0);
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec4 clip = mix(clipTail, clipHead, position.x + 0.5);
  clip.xy += normal * position.y * particleScale * seedSize * clip.w;
  gl_Position = clip;
  vFade = edge * exclusion * smoothstep(1.0, 4.0, -viewHead.z) * step(0.01, clipTail.w);
  vUv = uv;
}`
const fragmentShader = `
uniform float brightness;
varying float vFade;
varying vec2 vUv;
void main() {
  float across = pow(max(0.0, 1.0 - abs(vUv.y * 2.0 - 1.0)), 1.7);
  float ends = smoothstep(0.0, 0.16, vUv.x) * (1.0 - smoothstep(0.75, 1.0, vUv.x));
  float alpha = across * ends * vFade * brightness;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(vec3(0.72, 0.82, 1.0) * alpha, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

function makeGeometry(count: number) {
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([-0.5,-0.5,0, 0.5,-0.5,0, 0.5,0.5,0, -0.5,0.5,0]), 3))
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0,0, 1,0, 1,1, 0,1]), 2))
  geometry.setIndex([0,1,2, 0,2,3])
  const positions = new Float32Array(count * 3), sizes = new Float32Array(count)
  let seed = 58213
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (let i = 0; i < count; i++) { positions[i*3] = random()*80-40; positions[i*3+1] = random()*80-40; positions[i*3+2] = random()*80-40; sizes[i] = 0.5 + random() * 1.2 }
  geometry.setAttribute('seedPosition', new InstancedBufferAttribute(positions, 3))
  geometry.setAttribute('seedSize', new InstancedBufferAttribute(sizes, 1))
  geometry.instanceCount = count
  return geometry
}

export function CosmicMotionSystem({ flight, settings, droplet }: { flight: FlightMotionField; settings: FlightSettings; droplet: React.RefObject<Group | null> }) {
  const { gl, setDpr, setFrameloop } = useThree()
  const offset = useRef(new Vector3())
  const slowFrames = useRef(0)
  const geometry = useMemo(() => makeGeometry(MAX_PARTICLES), [])
  const material = useMemo(() => new ShaderMaterial({ vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: {
    displacement: { value: new Vector3() }, flightDirection: { value: new Vector3(-1,0,0) }, speedRatio: { value: 0 }, trailLength: { value: 1 }, particleScale: { value: 0.0015 }, motionStrength: { value: 1 }, brightness: { value: 1 },
  } }), [])
  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])
  useEffect(() => { setDpr(Math.min(window.devicePixelRatio, settings.quality === 'high' ? 1.5 : settings.quality === 'medium' ? 1.15 : 0.8)) }, [setDpr, settings.quality])
  useEffect(() => {
    const update = () => setFrameloop(document.hidden ? 'never' : 'always')
    document.addEventListener('visibilitychange', update); update()
    return () => { document.removeEventListener('visibilitychange', update); setFrameloop('always') }
  }, [setFrameloop])
  useFrame((_, delta) => {
    flight.update(delta, settings)
    if (droplet.current) droplet.current.quaternion.copy(flight.orientation)
    const dt = settings.paused || document.hidden ? 0 : Math.min(delta, 0.05)
    if (settings.localMotion) offset.current.addScaledVector(flight.velocity, settings.particleSpeed * settings.parallax * settings.nearMotion * settings.globalMotion * dt)
    offset.current.set(MathUtils.euclideanModulo(offset.current.x, 80), MathUtils.euclideanModulo(offset.current.y, 80), MathUtils.euclideanModulo(offset.current.z, 80))
    const u = material.uniforms
    u.displacement.value.copy(offset.current); u.flightDirection.value.copy(flight.direction)
    u.speedRatio.value = particleSpeedRatio(flight.speed, settings.maxSpeed)
    u.trailLength.value = settings.trails ? settings.trailLength : 0
    u.motionStrength.value = settings.motionBlur * settings.nearMotion * settings.globalMotion
    u.brightness.value = settings.trailBrightness * (0.55 + u.speedRatio.value * 0.45)
    const factor = settings.quality === 'high' ? 1 : settings.quality === 'medium' ? 0.6 : 0.3
    geometry.instanceCount = settings.particles ? Math.min(MAX_PARTICLES, Math.floor(settings.particleCount * factor)) : 0
    // 自适应 DPR 不触发 React 重渲染，且只在持续负载下逐步降低。
    if (dt && gl.info.render.calls > 0) {
      slowFrames.current = delta > 0.04 ? slowFrames.current + 1 : Math.max(0, slowFrames.current - 1)
      if (slowFrames.current > 90 && gl.getPixelRatio() > 0.7) { setDpr(Math.max(0.7, gl.getPixelRatio() - 0.1)); slowFrames.current = 0 }
    }
  }, -2)
  return <mesh geometry={geometry} material={material} frustumCulled={false} />
}
