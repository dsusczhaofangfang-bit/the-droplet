import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Frustum, Matrix4, Mesh, PerspectiveCamera, Vector3, type Group } from 'three'
import type { RefObject } from 'react'
import type { BootManager } from './BootManager'

export function SceneBoot({ manager, droplet }: { manager: BootManager; droplet: RefObject<Group | null> }) {
  const { gl, scene, camera } = useThree()
  const compiling = useRef(false)
  const compiled = useRef(false)
  useEffect(() => {
    // 着色器驱动异常时提供可恢复的失败状态。
    let activeTime = 0, last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      if (!document.hidden) activeTime += now - last
      last = now
      if (activeTime >= 60000 && !manager.getSnapshot().ready) manager.fail(new Error('Scene initialization timed out'))
    }, 1000)
    return () => clearInterval(timer)
  }, [manager])
  useFrame(() => {
    if (manager.getSnapshot().error || manager.getSnapshot().ready || !scene.environment || !droplet.current) return
    try {
      const mesh = droplet.current.children.find(child => child instanceof Mesh) as Mesh | undefined
      const position = mesh?.geometry.getAttribute('position'), normal = mesh?.geometry.getAttribute('normal')
      if (!mesh || !position?.count || !normal || position.count !== normal.count || !Number.isFinite(normal.getX(0))) throw new Error('Invalid droplet geometry or normals')
      manager.complete('droplet')
      manager.complete('motion')
      if (!compiling.current) {
        compiling.current = true
        // 环境贴图已绑定后编译真实场景，避免预热遗漏反射材质。
        void gl.compileAsync(scene, camera).then(() => { compiled.current = true; manager.complete('shaders') }).catch(error => manager.fail(error))
      }
      if (!compiled.current) return
      if (gl.getContext().isContextLost()) throw new Error('WebGL context lost')
      camera.updateMatrixWorld(); scene.updateMatrixWorld()
      const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse))
      if (!(camera instanceof PerspectiveCamera) || !Number.isFinite(camera.position.length()) || !frustum.intersectsObject(mesh) || !mesh.getWorldPosition(new Vector3()).toArray().every(Number.isFinite)) throw new Error('Droplet is outside the camera view')
      gl.render(scene, camera)
      const error = gl.getContext().getError()
      if (error !== gl.getContext().NO_ERROR) throw new Error(`WebGL first frame error: ${error}`)
      manager.complete('frame')
    } catch (error) { manager.fail(error) }
  }, -0.5)
  return null
}
