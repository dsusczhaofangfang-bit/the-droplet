import { createCosmicPixels } from './CosmicEnvironmentMap'
import type { CosmicSettings } from './shared'

// 像素数据在工作线程生成；WebGL 纹理和 PMREM 仍由主渲染器创建。
self.onmessage = (event: MessageEvent<CosmicSettings>) => {
  try {
    const config = event.data
    const layers = ['stars', 'galaxies', 'nebulae', 'clusters'] as const
    const buffers: ArrayBuffer[] = []
    for (const [index, layer] of layers.entries()) {
      const options = { ...config, stars: layer === 'stars' && config.stars, galaxies: layer === 'galaxies' && config.galaxies, nebulae: layer === 'nebulae' && config.nebulae, clusters: layer === 'clusters' && config.clusters }
      const pixels = createCosmicPixels(options, config.resolution, config.resolution / 2)
      if (layer !== 'stars') for (let i = 0; i < pixels.length; i += 4) { pixels[i] -= 0.018 * config.brightness; pixels[i + 1] -= 0.024 * config.brightness; pixels[i + 2] -= 0.035 * config.brightness }
      buffers.push(pixels.buffer as ArrayBuffer)
      if (index < layers.length - 1) self.postMessage({ type: 'progress', completed: index + 1 })
    }
    self.postMessage({ type: 'complete', buffers }, { transfer: buffers })
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
