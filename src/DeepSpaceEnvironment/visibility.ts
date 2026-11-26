export interface CosmicVisibility {
  backgroundVisible: boolean
  reflectionEnabled: boolean
  starsReflection: boolean
  galaxiesReflection: boolean
  nebulaeReflection: boolean
  backgroundBrightness: number
  reflectionIntensity: number
}

export const defaultCosmicVisibility: CosmicVisibility = {
  backgroundVisible: false,
  reflectionEnabled: true,
  starsReflection: true,
  galaxiesReflection: true,
  nebulaeReflection: true,
  backgroundBrightness: 1,
  reflectionIntensity: 1,
}
