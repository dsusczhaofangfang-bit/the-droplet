import { useEffect, useMemo, type RefObject } from 'react'
import type { Group } from 'three'
import { createDropletGeometry, type DropletGeometryOptions } from '../Geometry/DropletGeometry'
import { DropletMaterial, type MaterialSettings } from '../Materials'

export function Droplet({ options, material, groupRef }: { options: DropletGeometryOptions; material: MaterialSettings; groupRef?: RefObject<Group | null> }) {
  const geometry = useMemo(() => createDropletGeometry(options), [options])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <group ref={groupRef}><mesh geometry={geometry}><DropletMaterial settings={material} /></mesh></group>
}
