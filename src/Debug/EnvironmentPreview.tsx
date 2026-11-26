import { useEffect, useRef } from 'react'
import { createCosmicPixels } from '../DeepSpaceEnvironment/CosmicEnvironmentMap'
import type { CosmicSettings } from '../DeepSpaceEnvironment'
import type { MaterialSettings } from '../Materials'

export function EnvironmentPreview({ settings, material }: { settings: CosmicSettings; material: MaterialSettings }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current, context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const pixels = createCosmicPixels(settings, canvas.width, canvas.height), image = context.createImageData(canvas.width, canvas.height)
    for (let i = 0; i < pixels.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const v = pixels[i + c] * material.exposure / 24
        const mapped = Math.max(0, Math.min(1, (v * (2.51 * v + 0.03)) / (v * (2.43 * v + 0.59) + 0.14)))
        image.data[i + c] = Math.round(255 * (mapped <= 0.0031308 ? 12.92 * mapped : 1.055 * Math.pow(mapped, 1 / 2.4) - 0.055))
      }
      image.data[i + 3] = 255
    }
    context.putImageData(image, 0, 0)
  }, [settings, material.exposure])
  return <div className="environment-preview"><span>共享星空环境预览 · 低分辨率</span><canvas ref={ref} width={512} height={256} aria-label="星空环境展开预览" /></div>
}

