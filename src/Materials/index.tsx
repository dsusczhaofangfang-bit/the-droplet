export type StudioPreset = 'balanced' | 'contrast'
export interface MaterialSettings {
  roughness: number
  envMapIntensity: number
  exposure: number
  studioIntensity: number
  environmentRotation: number
  contrast: number
  softbox: number
  fill: number
  negative: number
  preset: StudioPreset
}

export const defaultMaterialSettings: MaterialSettings = {
  roughness: 0.015, envMapIntensity: 1.5, exposure: 1, studioIntensity: 1,
  environmentRotation: 0, contrast: 1.55, softbox: 1, fill: 0.7, negative: 1, preset: 'balanced',
}

export function DropletMaterial({ settings }: { settings: MaterialSettings }) {
  return <meshPhysicalMaterial color="#ffffff" metalness={1} roughness={settings.roughness} envMapIntensity={settings.envMapIntensity} />
}
