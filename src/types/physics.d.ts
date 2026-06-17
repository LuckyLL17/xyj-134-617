export interface BombType {
  yield: number
  name: string
}

export interface TerrainPreset {
  name: string
  mountainCount: number
  hillCount: number
  basinCount: number
  elevationScale: number
}

export interface ZoneDef {
  key: string
  label: string
  color: number[]
  description: string
  minRadius: number
  radiusFormula: string
  heightFactor: string
  dash: string
  overpressure: number
  altitudeSensitivity: number
  destroyed: boolean
  deathRate: number
  injuryRate: number
}

export interface Explosion {
  id: number
  bombType: string
  yieldKilotons: number
  burstHeight: number
  explosionCenter: { x: number; y: number } | null
  radii: Record<string, number> | null
}

export interface TerrainData {
  features: any[]
  elevationMap: number[][]
  width: number
  height: number
  mountainCount: number
  hillCount: number
  basinCount: number
  maxElevation: number
}

export interface PhysicsModule {
  BOMB_TYPES: Record<string, BombType>
  TERRAIN_PRESETS: Record<string, TerrainPreset>
  getZones: () => ZoneDef[]
  calculateRadii: (yieldKilotons: number, burstHeight: number) => Record<string, number>
  generateTerrainFeatures: (
    width: number,
    height: number,
    preset: string,
    intensity: number,
    seed: number
  ) => TerrainData
  generateShelters: (width: number, height: number, count: number) => any[]
  generateRoadNetwork: (width: number, height: number, cities: any[], shelters: any[]) => any[]
  calculateEvacuationPlan: (
    cities: any[],
    shelters: any[],
    roads: any[],
    scale: number,
    warningTime: number,
    roadCapMultiplier: number,
    vehSpeed: number
  ) => any
  calculateCasualties: (explosion: Explosion, cities: any[]) => any
  calculateEnergy: (yieldKilotons: number) => number
  calculateAffectedArea: (radii: Record<string, number>) => number
  calculateCombinedArea: (explosions: Explosion[], scale: number) => number
  mulberry32: (seed: number) => () => number
}

declare const Physics: PhysicsModule
export default Physics
