export type BombTypeKey =
  | 'custom'
  | 'little_boy'
  | 'fat_man'
  | 'tsar_bomba'
  | 'b83'
  | 'w88'
  | 'trinity'
  | 'castle_bravo'

export interface BombType {
  yield: number
  name: string
}

export type TerrainFeatureType = 'mountain' | 'hill' | 'basin' | 'plain'

export type TerrainPresetKey = 'flat' | 'gentle' | 'mountainous' | 'extreme'

export interface TerrainPreset {
  name: string
  mountainCount: number
  hillCount: number
  basinCount: number
  elevationScale: number
}

export type BuildingTypeKey =
  | 'temporary'
  | 'wood'
  | 'brick'
  | 'rc_frame'
  | 'steel'
  | 'rc_core'
  | 'blast_resistant'

export type DamageLevelKey = 'intact' | 'light' | 'moderate' | 'severe' | 'destroyed'

export interface IndoorSurvivalRate {
  intact: number
  light: number
  moderate: number
  severe: number
  destroyed: number
}

export interface BuildingType {
  name: string
  shortName: string
  color: string
  description: string
  structureFactor: number
  collapsePsi: number
  severeDamagePsi: number
  moderateDamagePsi: number
  lightDamagePsi: number
  indoorSurvivalRate: IndoorSurvivalRate
}

export interface DamageLevel {
  name: string
  color: string
  order: number
}

export type HeightFactorType = 'height' | 'pressure' | 'thermal' | 'none'

export type DashStyle = 'solid' | 'dashed4' | 'dashed8' | 'dotted'

export interface CasualtyRates {
  deaths: number
  injured: number
  destroyed: boolean
}

export interface ZoneDef {
  key: string
  label: string
  dash: number[] | null
  color: number[]
  altitudeSensitivity: number
  radiusFormula: string
  heightFactorType: HeightFactorType
  overpressureThreshold: number
  casualtyRates: CasualtyRates
  description: string
  minRadius: number
  order?: number
}

export interface ZoneOperationResult {
  success: boolean
  error?: string
  zone?: ZoneDef
  zones?: ZoneDef[]
}

export interface TerrainFeature {
  type: TerrainFeatureType
  x: number
  y: number
  radius: number
  height: number
  width: number
  heightPx: number
}

export interface TerrainData {
  features: TerrainFeature[]
  width: number
  height: number
  scale: number
  presetName: string
}

export interface Point {
  x: number
  y: number
}

export interface AttenuationResult {
  attenuation: number
  maxObstacleHeight: number
  pathLengthKm: number
}

export interface City {
  x: number
  y: number
  size: number
  population: number
  name: string
  destroyed: boolean
  buildingDistribution: Record<BuildingTypeKey, number>
}

export interface Road {
  x1: number
  y1: number
  x2: number
  y2: number
  capacity?: number
  lanes?: number
}

export interface BuildingCasualtyResult {
  deaths: number
  injured: number
  damageLevel: DamageLevelKey
  buildingType?: BuildingTypeKey
  overpressure?: number
}

export interface BuildingDamageResult {
  population: number
  damageLevel: DamageLevelKey
  deaths: number
  injured: number
  overpressure: number
}

export interface CityBuildingDamageResult {
  city: City
  maxOverpressure: number
  avgStructureFactor: number
  buildingResults: Record<BuildingTypeKey, BuildingDamageResult>
  totalDeaths: number
  totalInjured: number
  totalDestroyedPop: number
  totalAffectedPop: number
  distByDamage: Record<DamageLevelKey, number>
  worstSpecialZone: string | null
  inSpecialZone: boolean
  survivalRate: number
}

export interface AllCitiesBuildingDamageResult {
  cityResults: CityBuildingDamageResult[]
  totalDeaths: number
  totalInjured: number
  totalDestroyedPop: number
  totalPopulation: number
  totalByDamage: Record<DamageLevelKey, number>
  totalByBuildingType: Record<BuildingTypeKey, { population: number; deaths: number; injured: number }>
  overallSurvivalRate: number
}

export interface CasualtyResult {
  deaths: number
  injured: number
}

export interface Circle {
  x: number
  y: number
  r: number
}

export interface CombinedStats {
  count: number
  combinedArea: number
  totalArea: number
  overlapArea: number
  totalEnergy: number
  perZone: Record<string, number>
}

export interface ExplosionCenter {
  x: number
  y: number
}

export interface Explosion {
  id: number
  yieldKilotons: number
  burstHeight: number
  bombType: BombTypeKey
  explosionCenter: ExplosionCenter | null
  radii: Record<string, number> | null
}

export interface Shelter {
  x: number
  y: number
  capacity: number
  id: number
}

export interface EvacNode {
  id: number
  type: 'city' | 'shelter'
  ref: City | Shelter
  refIndex: number
  x: number
  y: number
  population?: number
  capacity?: number
  edges: EvacEdge[]
  remainingPop?: number
  evacuating?: number
  arrived?: number
}

export interface EvacEdge {
  from: number
  to: number
  lengthPx: number
  capacity: number
  lanes: number
  flow: number
  density: number
}

export interface AppState {
  explosions: Explosion[]
  selectedExplosionId: number | null
  scale: number
  showLabels: boolean
  showLegend: boolean
  cities: City[]
  roads: Road[]
  shelters: Shelter[]
  terrainEnabled: boolean
  terrainData: TerrainData | null
  terrainIntensity: number
  showTerrainHeatmap: boolean
  showTerrainContours: boolean
  viewMode: 'combined' | 'selected'
  isAnimating: boolean
  animationProgress: number
  isDetonating: boolean
  evacuationEnabled: boolean
  warningTime: number
  roadCapacity: number
  vehicleSpeed: number
}

export interface TimelineStage {
  label: string
  time: string
  timeHours: number
}

export interface TimelineDataPoint {
  time: number
  deaths: number
  injured: number
  falloutArea: number
}

export interface SoundLayerOptions {
  frequencyStart?: number
  frequencyEnd?: number
  duration?: number
  type?: OscillatorType
  startGain?: number
  endGain?: number
  attack?: number
  release?: number
  filterFreq?: number
  filterQ?: number
}

export interface NoiseLayerOptions {
  duration: number
  startGain: number
  endGain: number
  filterFreq: number
  filterType?: BiquadFilterType
  attack?: number
}

export interface ExplosionSounds {
  flash?: { ctx: AudioContext; group: GainNode; layers: any[]; startTime: number } | null
  explosion?: any
  shockwave?: any
  quake?: any
  debris?: any
}

export interface EvacStats {
  totalPop: number
  evacuated: number
  stranded: number
  rate: number
}

export interface EvacSimulationState {
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  totalPop: number
  evacuated: number
  stranded: number
  nodes: EvacNode[]
  edges: EvacEdge[]
}

export interface TerrainPolygonPoint {
  x: number
  y: number
  angle: number
  attenuation: number
}
