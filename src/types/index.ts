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

export type BuildingTypeKey =
  | 'temporary'
  | 'wood'
  | 'brick'
  | 'rc_frame'
  | 'steel'
  | 'rc_core'
  | 'blast_resistant'

export type DamageLevel = 'intact' | 'light' | 'moderate' | 'severe' | 'destroyed'

export interface DamageLevelInfo {
  name: string
  color: string
  order: number
}

export interface CasualtyRates {
  deaths: number
  injured: number
  destroyed: boolean
}

export type HeightFactorType = 'height' | 'pressure' | 'thermal' | 'none'

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

export interface BuildingCasualtyResult {
  deaths: number
  injured: number
  damageLevel: DamageLevel
  buildingType: string
  overpressure: number
}

export interface Point {
  x: number
  y: number
}

export interface Explosion {
  id: number
  bombType: string
  yieldKilotons: number
  burstHeight: number
  explosionCenter: Point | null
  radii: Record<string, number> | null
}

export interface City {
  x: number
  y: number
  size: number
  population: number
  name: string
  destroyed: boolean
  buildingDistribution: Record<string, number>
}

export interface Road {
  x1: number
  y1: number
  x2: number
  y2: number
  capacity?: number
  lanes?: number
  isShelterAccess?: boolean
}

export interface TerrainFeature {
  type: string
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
  mountainCount?: number
  hillCount?: number
  basinCount?: number
  maxElevation?: number
}

export interface BuildingDamageResult {
  population: number
  damageLevel: DamageLevel
  deaths: number
  injured: number
  overpressure: number
}

export interface CityBuildingDamageResult {
  city: City
  maxOverpressure: number
  avgStructureFactor: number
  buildingResults: Record<string, BuildingDamageResult>
  totalDeaths: number
  totalInjured: number
  totalDestroyedPop: number
  totalAffectedPop: number
  distByDamage: Record<DamageLevel, number>
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
  totalByDamage: Record<DamageLevel, number>
  totalByBuildingType: Record<string, { population: number; deaths: number; injured: number }>
  overallSurvivalRate: number
}

export interface CasualtyResult {
  deaths: number
  injured: number
  destroyed?: boolean
}

export interface Circle {
  x: number
  y: number
  r: number
}

export interface AttenuationResult {
  attenuation: number
  maxObstacleHeight: number
  pathLengthKm: number
}

export interface TerrainBoundaryPoint {
  x: number
  y: number
  angle: number
  attenuation: number
}

export interface Shelter {
  x: number
  y: number
  capacity: number
  [key: string]: any
}

export interface EvacuationNode {
  id: number
  type: 'city' | 'shelter'
  ref: City | Shelter
  refIndex: number
  x: number
  y: number
  population?: number
  capacity?: number
  edges: EvacuationEdge[]
}

export interface EvacuationEdge {
  from: number
  to: number
  lengthPx: number
  capacity: number
  lanes: number
  flow: number
  density: number
}

export interface CombinedStats {
  count: number
  combinedArea: number
  totalArea: number
  overlapArea: number
  totalEnergy: number
  perZone: Record<string, number>
}

export type RandomFunction = () => number

export interface AppState {
  explosions: Explosion[]
  selectedExplosionId: number | null
  viewMode: string
  scale: number
  showLabels: boolean
  showLegend: boolean
  isAnimating: boolean
  animationId: number | null
  cities: City[]
  terrainEnabled: boolean
  terrainPreset: string
  terrainIntensity: number
  terrainSeed: number
  terrainData: TerrainData | null
  showTerrainContours: boolean
  showTerrainHeatmap: boolean
  evacuationEnabled: boolean
  shelters: Shelter[] | null
  selectedShelterIndex: number | null
  evacuationPlan: any
  evacuationRoads: Road[]
  mapCtx: CanvasRenderingContext2D | null
  effectCtx: CanvasRenderingContext2D | null
  buildingViewMode?: string
}

export interface ZoneColors {
  fill: string
  border: string
}

export interface PhysicsModule {
  BOMB_TYPES: Record<string, BombType>
  TERRAIN_PRESETS: Record<string, TerrainPreset>
  BUILDING_TYPES: Record<string, BuildingType>
  BUILDING_TYPE_ORDER: string[]
  DAMAGE_LEVELS: Record<DamageLevel, DamageLevelInfo>
  DEFAULT_ZONE_DEFS: ZoneDef[]
  getZones: () => ZoneDef[]
  getZoneKeys: () => string[]
  getZonePriority: () => string[]
  getZoneAltitudeSensitivity: () => Record<string, number>
  getZoneByKey: (key: string) => ZoneDef | null
  addZone: (zoneDef: Partial<ZoneDef>) => ZoneOperationResult
  updateZone: (key: string, updates: Partial<ZoneDef>) => ZoneOperationResult
  removeZone: (key: string) => ZoneOperationResult
  resetZones: () => ZoneOperationResult
  moveZone: (key: string, newIndex: number) => ZoneOperationResult
  calculateZoneRadius: (zone: ZoneDef, W_megatons: number, burstHeight: number) => number
  calculateRadii: (yieldKilotons: number, burstHeight: number) => Record<string, number>
  generateBuildingDistribution: (isCentral: boolean, size: number) => Record<string, number>
  generateCities: (width: number, height: number) => City[]
  generateRoads: (width: number, height: number, cities: City[]) => Road[]
  getBuildingDamageLevel: (buildingType: string, overpressurePsi: number) => DamageLevel
  getOverpressureAtDistance: (yieldKilotons: number, distanceKm: number, burstHeight: number) => number
  calculateBuildingCasualties: (
    population: number,
    buildingType: string,
    overpressurePsi: number,
    indoorRatio?: number
  ) => BuildingCasualtyResult
  calculateCasualtiesForZone: (pop: number, zoneName: string) => CasualtyResult
  getWorstZoneForCity: (city: City, explosions: Explosion[], scale: number) => string | null
  calculateCityBuildingDamage: (
    city: City,
    explosions: Explosion[],
    scale: number,
    terrain: TerrainData | null
  ) => CityBuildingDamageResult
  calculateAvgStructureFactor: (buildingDistribution: Record<string, number>) => number
  calculateAllCitiesBuildingDamage: (
    cities: City[],
    explosions: Explosion[],
    scale: number,
    terrain: TerrainData | null
  ) => AllCitiesBuildingDamageResult
  calculateCasualties: (
    cities: City[],
    explosionCenter: Point | null,
    radii: Record<string, number> | null,
    scale: number
  ) => CasualtyResult
  calculateCombinedCasualties: (cities: City[], explosions: Explosion[], scale: number) => CasualtyResult
  calculateEnergy: (yieldKilotons: number) => number
  calculateTotalEnergy: (explosions: Explosion[]) => number
  calculateAffectedArea: (radii: Record<string, number>) => number
  calculateCombinedArea: (explosions: Explosion[], scale: number) => number
  calculateTotalAreaSum: (explosions: Explosion[]) => number
  calculateOverlapArea: (explosions: Explosion[], scale: number) => number
  calculateAllCombinedStats: (explosions: Explosion[], scale: number) => CombinedStats
  mulberry32: (seed: number) => RandomFunction
  generateTerrainFeatures: (
    width: number,
    height: number,
    presetName: string,
    elevationScale: number,
    seed: number
  ) => TerrainData
  getElevationAt: (x: number, y: number, terrain: TerrainData) => number
  calculatePathAttenuation: (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    terrain: TerrainData,
    zoneName: string,
    scale: number,
    burstHeightMeters: number
  ) => AttenuationResult
  calculateEffectiveRadius: (
    explosion: Explosion,
    targetX: number,
    targetY: number,
    zoneName: string,
    terrain: TerrainData,
    scale: number
  ) => number
  generateTerrainBoundaryPolygon: (
    explosion: Explosion,
    zoneName: string,
    terrain: TerrainData,
    scale: number,
    segments?: number
  ) => TerrainBoundaryPoint[] | null
  checkPointInAnyZoneTerrainAware: (
    point: Point,
    explosions: Explosion[],
    terrain: TerrainData,
    scale: number
  ) => string | null
  getWorstZoneForCityTerrain: (
    city: City,
    explosions: Explosion[],
    scale: number,
    terrain: TerrainData | null
  ) => string | null
  calculateCasualtiesTerrainAware: (
    cities: City[],
    explosions: Explosion[],
    scale: number,
    terrain: TerrainData | null
  ) => CasualtyResult
  calculateShockwaveRadiusAtAngle: (
    explosion: Explosion,
    angle: number,
    zoneKey: string,
    terrain: TerrainData | null,
    scale: number,
    baseRadiusPx: number
  ) => number
  generateShelters: (width: number, height: number, count: number) => Shelter[]
  generateRoadNetwork: (width: number, height: number, cities: City[], shelters: Shelter[]) => Road[]
  calculateEvacuationPlan: (
    cities: City[],
    shelters: Shelter[],
    roads: Road[],
    scale: number,
    warningTime: number,
    roadCapMultiplier: number,
    vehSpeed: number
  ) => any
  [key: string]: any
}

export interface DataDisplayModule {
  rgba: (r: number, g: number, b: number, a: number) => string
  hexToRgba: (hex: string, alpha: number) => string
  formatNumber: (num: number) => string
  getElements: () => Record<string, HTMLElement | null>
  generateDataPanels: (elements: Record<string, any>, state: AppState) => void
  generateLegend: (elements: Record<string, any>) => void
  updateDataDisplay: (elements: Record<string, any>, state: AppState) => void
  updateBuildingDisplay: (elements: Record<string, any>, state: AppState) => void
  populateBuildingCitySelect: (elements: Record<string, any>, cities: City[]) => void
  [key: string]: any
}

export interface RendererModule {
  setupCanvas: (
    mapCanvas: HTMLCanvasElement,
    effectCanvas: HTMLCanvasElement | null,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D | null,
    mapWrapper: HTMLElement,
    state: AppState
  ) => void
  drawMap: (
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    state: AppState
  ) => void
  drawOneExplosionZones: (
    ctx: CanvasRenderingContext2D,
    explosion: Explosion,
    scale: number,
    state: AppState
  ) => void
  drawAllOverlapHighlights: (
    ctx: CanvasRenderingContext2D,
    explosions: Explosion[],
    scale: number
  ) => void
  drawPolygonPathFromPoints: (
    ctx: CanvasRenderingContext2D,
    points: TerrainBoundaryPoint[],
    close: boolean
  ) => void
  getZoneColors: (key: string, tintIndex: number) => ZoneColors
  getZoneDefs: () => ZoneDef[]
  getOverlayHatchColors: () => Record<string, ZoneColors>
  [key: string]: any
}

export interface AnimationModule {
  animateExplosion: (
    state: AppState,
    elements: Record<string, any>,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement,
    mapWrapper: HTMLElement,
    flashOverlay: HTMLElement
  ) => void
  [key: string]: any
}

export interface TimelineModule {
  init: () => void
  start: (state: AppState, ctx?: CanvasRenderingContext2D | null, canvas?: HTMLCanvasElement | null) => void
  stop: () => void
  play: () => void
  pause: () => void
  reset: () => void
  togglePlay: () => void
  setProgress: (progress: number) => void
  isActive: () => boolean
  isPlaying: () => boolean
  getCurrentProgress: () => number
  STAGES: any[]
  [key: string]: any
}

export interface EvacuationModule {
  createVehicleParticles: (state: AppState, elements: Record<string, any>) => void
  updateVehicles: (state: AppState, deltaTime: number) => void
  drawRoadDensity: (ctx: CanvasRenderingContext2D, state: AppState) => void
  drawShelters: (ctx: CanvasRenderingContext2D, shelters: Shelter[], state: AppState) => void
  drawVehicles: (ctx: CanvasRenderingContext2D, state: AppState) => void
  drawEvacuationFlowArrows: (ctx: CanvasRenderingContext2D, state: AppState) => void
  drawEvacuationStatic: (ctx: CanvasRenderingContext2D, state: AppState) => void
  startEvacuationAnimation: (state: AppState, elements: Record<string, any>) => void
  stopEvacuationAnimation: () => void
  resetEvacuationAnimation: (state: AppState, elements: Record<string, any>) => void
  isEvacuating: () => boolean
  setSpeed: (speed: number) => void
  formatNumber: (num: number) => string
  [key: string]: any
}

export interface UiModule {
  getControlElements: () => Record<string, HTMLElement | null>
  setupEventListeners: (
    elements: Record<string, any>,
    dataElements: Record<string, any>,
    state: AppState,
    mapCanvas: HTMLCanvasElement,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement,
    mapWrapper: HTMLElement,
    flashOverlay: HTMLElement,
    mapHint: HTMLElement
  ) => void
  refreshExplosionList: (state: AppState, elements: Record<string, any>) => void
  syncControlsFromSelected: (state: AppState, elements: Record<string, any>) => void
  syncTerrainControlsFromState: (state: AppState, elements: Record<string, any>) => void
  syncStateFromTerrainControls: (state: AppState, elements: Record<string, any>) => void
  updateTerrainInfo: (state: AppState, elements: Record<string, any>) => void
  regenerateTerrain: (state: AppState, elements: Record<string, any>) => void
  recalculateEvacuation: (state: AppState, elements: Record<string, any>) => void
  updateEvacuationDisplay: (state: AppState, elements: Record<string, any>) => void
  addShelter: (state: AppState, elements: Record<string, any>) => void
  updateShelterCount: (state: AppState, elements: Record<string, any>) => void
  startEvacAnimation: (state: AppState, elements: Record<string, any>) => void
  pauseEvacAnimation: () => void
  resetEvacAnimation: (state: AppState, elements: Record<string, any>) => void
  handleCanvasClick: (
    e: MouseEvent,
    state: AppState,
    elements: Record<string, any>,
    dataElements: Record<string, any>,
    mapCanvas: HTMLCanvasElement,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ) => void
  updateAllCalculations: (state: AppState) => void
  [key: string]: any
}

export interface AudioManagerModule {
  init: () => void
  playExplosionSound: (intensity: number) => any
  playShockwaveSound: (intensity: number) => any
  playQuakeSound: (intensity: number) => any
  playFlashSound: (intensity: number) => any
  playDebrisSound: (intensity: number) => any
  playExplosionAudioSequence: (intensity: number, distance: number) => any
  setMasterVolume: (vol: number) => void
  [key: string]: any
}

export interface AppModule {
  createExplosion: (defaults?: Partial<Explosion>) => Explosion
  getSelectedExplosion: () => Explosion | null
  getExplosionById: (id: number) => Explosion | null
  regenerateTerrain: () => void
  readonly state: AppState
  [key: string]: any
}

declare global {
  interface Window {
    Physics: PhysicsModule
    AudioManager: AudioManagerModule
    DataDisplay: DataDisplayModule
    Renderer: RendererModule
    Animation: AnimationModule
    Timeline: TimelineModule
    Evacuation: EvacuationModule
    UI: UiModule
    App: AppModule
  }
}
