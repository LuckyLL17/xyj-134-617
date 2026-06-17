export interface Point {
  x: number
  y: number
}

export interface ExplosionRadii {
  [key: string]: number
}

export interface Explosion {
  id: number
  bombType: string
  yieldKilotons: number
  burstHeight: number
  explosionCenter: Point | null
  radii: ExplosionRadii | null
}

export interface ZoneConfig {
  key: string
  label: string
  color: string
  description: string
  minRadius: number
  radiusFormula: string
  heightFactor: string
  dash: string
  overpressure: number
  altitudeSens: number
  destroyed: boolean
  deathRate: number
  injuryRate: number
}

export interface ZoneDef {
  key: string
  label: string
  dash: number[] | null
  color: number[]
  altitudeSensitivity: number
  radiusFormula: string
  heightFactorType: string
  overpressureThreshold: number
  casualtyRates: CasualtyRates
  description: string
  minRadius: number
  order?: number
}

export interface CasualtyRates {
  deaths: number
  injured: number
  destroyed: boolean
}

export interface City {
  name: string
  x: number
  y: number
  size: number
  population: number
  destroyed: boolean
  buildingDistribution: BuildingDistribution
}

export interface BuildingDistribution {
  [key: string]: number
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

export interface IndoorSurvivalRate {
  intact: number
  light: number
  moderate: number
  severe: number
  destroyed: number
}

export interface DamageLevel {
  name: string
  color: string
  order: number
}

export type DamageLevelKey = 'intact' | 'light' | 'moderate' | 'severe' | 'destroyed'

export interface Shelter {
  x: number
  y: number
  capacity: number
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

export interface TerrainData {
  features: TerrainFeature[]
  width: number
  height: number
  scale: number
  presetName: string
  elevation?: number[][]
  mountains?: number
  hills?: number
  basins?: number
  maxElevation?: number
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

export interface EvacuationPlan {
  totalPopulation: number
  evacuatedPopulation: number
  strandedPopulation: number
  evacuationRate: number
  roads: Road[]
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
  shelters: Shelter[]
  selectedShelterIndex: number | null
  evacuationPlan: EvacuationPlan | null
  evacuationRoads: Road[]
  mapCtx: CanvasRenderingContext2D | null
  effectCtx: CanvasRenderingContext2D | null
}

export interface BuildingCasualtyResult {
  deaths: number
  injured: number
  damageLevel: DamageLevelKey
  buildingType: string
  overpressure: number
}

export interface CityBuildingDamageResult {
  city: City
  maxOverpressure: number
  avgStructureFactor: number
  buildingResults: { [key: string]: BuildingResult }
  totalDeaths: number
  totalInjured: number
  totalDestroyedPop: number
  totalAffectedPop: number
  distByDamage: DistByDamage
  worstSpecialZone: string | null
  inSpecialZone: boolean
  survivalRate: number
}

export interface BuildingResult {
  population: number
  damageLevel: DamageLevelKey
  deaths: number
  injured: number
  overpressure: number
}

export interface DistByDamage {
  intact: number
  light: number
  moderate: number
  severe: number
  destroyed: number
}

export interface AllCitiesBuildingDamageResult {
  cityResults: CityBuildingDamageResult[]
  totalDeaths: number
  totalInjured: number
  totalDestroyedPop: number
  totalPopulation: number
  totalByDamage: DistByDamage
  totalByBuildingType: { [key: string]: { population: number; deaths: number; injured: number } }
  overallSurvivalRate: number
}

export interface CasualtyResult {
  deaths: number
  injured: number
  destroyed?: boolean
}

export interface CombinedStats {
  count: number
  combinedArea: number
  totalArea: number
  overlapArea: number
  totalEnergy: number
  perZone: { [key: string]: number }
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

export interface PhysicsModule {
  BOMB_TYPES: { [key: string]: BombType }
  DEFAULT_ZONE_DEFS: ZoneDef[]
  TERRAIN_FEATURE_TYPES: { [key: string]: string }
  TERRAIN_PRESETS: { [key: string]: TerrainPreset }
  ROAD_BASE_CAPACITY: number
  VEHICLE_SPEED_KMH: number
  PEOPLE_PER_VEHICLE: number
  BUILDING_TYPES: { [key: string]: BuildingType }
  BUILDING_TYPE_ORDER: string[]
  DAMAGE_LEVELS: { [key: string]: DamageLevel }
  getZones: () => ZoneDef[]
  getZoneKeys: () => string[]
  getZonePriority: () => string[]
  getZoneAltitudeSensitivity: () => { [key: string]: number }
  getZoneByKey: (key: string) => ZoneDef | null
  addZone: (zoneDef: Partial<ZoneDef> & { key: string; label: string }) => { success: boolean; error?: string; zone?: ZoneDef }
  updateZone: (key: string, updates: Partial<ZoneDef>) => { success: boolean; error?: string; zone?: ZoneDef }
  removeZone: (key: string) => { success: boolean; error?: string; zone?: ZoneDef }
  resetZones: () => { success: boolean; zones: ZoneDef[] }
  moveZone: (key: string, newIndex: number) => { success: boolean; error?: string; zone?: ZoneDef }
  calculateZoneRadius: (zone: ZoneDef, W_megatons: number, burstHeight: number) => number
  calculateRadii: (yieldKilotons: number, burstHeight: number) => ExplosionRadii
  generateCities: (width: number, height: number) => City[]
  generateBuildingDistribution: (isCentral: boolean, size: number) => BuildingDistribution
  generateRoads: (width: number, height: number, cities: City[]) => Road[]
  generateRoadNetwork: (width: number, height: number, cities: City[], shelters: Shelter[]) => Road[]
  generateShelters: (width: number, height: number, count: number) => Shelter[]
  buildEvacuationGraph: (cities: City[], shelters: Shelter[], roads: Road[], capacityMultiplier?: number) => EvacuationNode[]
  dijkstra: (nodes: EvacuationNode[], startId: number) => { distances: number[]; previous: number[] }
  findNearestShelter: (city: City, shelters: Shelter[], roads: Road[]) => { shelter: Shelter | null; distance: number; path: number[] }
  calculateEvacuationPlan: (
    cities: City[],
    shelters: Shelter[],
    roads: Road[],
    scale: number,
    warningTime: number,
    roadCapMultiplier: number,
    vehicleSpeed: number
  ) => EvacuationPlan
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
  calculateShockwaveRadiusAtAngle: (
    explosion: Explosion,
    angle: number,
    zoneKey: string,
    terrain: TerrainData,
    scale: number,
    baseRadiusPx: number
  ) => number
  checkPointInAnyZoneTerrainAware: (point: Point, explosions: Explosion[], terrain: TerrainData, scale: number) => string | null
  getBuildingDamageLevel: (buildingType: string, overpressurePsi: number) => DamageLevelKey
  getOverpressureAtDistance: (yieldKilotons: number, distanceKm: number, burstHeight: number) => number
  calculateBuildingCasualties: (
    population: number,
    buildingType: string,
    overpressurePsi: number,
    indoorRatio?: number
  ) => BuildingCasualtyResult
  calculateCityBuildingDamage: (
    city: City,
    explosions: Explosion[],
    scale: number,
    terrain?: TerrainData
  ) => CityBuildingDamageResult
  calculateAllCitiesBuildingDamage: (
    cities: City[],
    explosions: Explosion[],
    scale: number,
    terrain?: TerrainData
  ) => AllCitiesBuildingDamageResult
  calculateAvgStructureFactor: (buildingDistribution: BuildingDistribution) => number
  calculateCasualties: (
    cities: City[],
    explosionCenter: Point | null,
    radii: ExplosionRadii | null,
    scale: number
  ) => CasualtyResult
  calculateCombinedCasualties: (cities: City[], explosions: Explosion[], scale: number) => CasualtyResult
  calculateCasualtiesTerrainAware: (cities: City[], explosions: Explosion[], scale: number, terrain: TerrainData) => CasualtyResult
  getWorstZoneForCity: (city: City, explosions: Explosion[], scale: number) => string | null
  getWorstZoneForCityTerrain: (city: City, explosions: Explosion[], scale: number, terrain: TerrainData) => string | null
  calculateCasualtiesForZone: (pop: number, zoneName: string) => CasualtyResult
  calculateEnergy: (yieldKilotons: number) => number
  calculateTotalEnergy: (explosions: Explosion[]) => number
  calculateAffectedArea: (radii: ExplosionRadii) => number
  calculateCombinedArea: (explosions: Explosion[], scale: number) => number
  calculateTotalAreaSum: (explosions: Explosion[]) => number
  calculateOverlapArea: (explosions: Explosion[], scale: number) => number
  calculateAllCombinedStats: (explosions: Explosion[], scale: number) => CombinedStats
  calculateCombinedAreaPerZone: (explosions: Explosion[], scale: number, zoneName: string) => number
  mulberry32: (seed: number) => () => number
}

export interface UIElements {
  [key: string]: HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null
}

export interface UIModule {
  getControlElements: () => UIElements
  setupEventListeners: (...args: any[]) => void
  refreshExplosionList: (state: AppState, elements: UIElements) => void
  syncControlsFromSelected: (state: AppState, elements: UIElements) => void
  syncTerrainControlsFromState: (state: AppState, elements: UIElements) => void
  syncStateFromTerrainControls: (state: AppState, elements: UIElements) => void
  updateCalculations: (explosion: Explosion) => void
  updateAllCalculations: (state: AppState) => void
  handleCanvasClick: (
    e: MouseEvent,
    mapCanvas: HTMLCanvasElement,
    state: AppState,
    mapHint: HTMLElement,
    dataElements: DataDisplayElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    elements: UIElements
  ) => void
  updateTerrainInfo: (state: AppState, elements: UIElements) => void
  regenerateTerrain: (
    state: AppState,
    elements: UIElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    dataElements: DataDisplayElements,
    forceNewSeed: boolean
  ) => void
  recalculateEvacuation: (
    state: AppState,
    elements: UIElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ) => void
  updateEvacuationDisplay: (state: AppState, elements: UIElements) => void
  addShelter: (
    state: AppState,
    elements: UIElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ) => void
  updateShelterCount: (
    state: AppState,
    elements: UIElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ) => void
  startEvacAnimation: (
    state: AppState,
    elements: UIElements,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement
  ) => void
  pauseEvacAnimation: (elements: UIElements) => void
  resetEvacAnimation: (
    state: AppState,
    elements: UIElements,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement
  ) => void
  handleEvacCanvasClick: (
    e: MouseEvent,
    mapCanvas: HTMLCanvasElement,
    state: AppState,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    elements: UIElements
  ) => void
  findNearestShelter: (
    x: number,
    y: number,
    state: AppState,
    threshold: number
  ) => { shelter: Shelter; index: number } | null
}

export interface ZoneColor {
  fill: string
  border: string
}

export interface OverlayHatchColor {
  line: string
  fill: string
  angle: number
  spacing: number
}

export interface RendererModule {
  setupCanvas: (
    mapCanvas: HTMLCanvasElement,
    effectCanvas: HTMLCanvasElement | null,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    state: AppState
  ) => void
  drawMap: (ctx: CanvasRenderingContext2D, wrapper: HTMLElement, state: AppState) => void
  drawOneExplosionZones: (
    mapCtx: CanvasRenderingContext2D,
    exp: Explosion,
    tintIndex: number,
    state: AppState
  ) => void
  drawAllOverlapHighlights: (mapCtx: CanvasRenderingContext2D, state: AppState) => void
  drawPolygonPathFromPoints: (ctx: CanvasRenderingContext2D, points: TerrainBoundaryPoint[], close?: boolean) => void
  getZoneColors: (key: string, tintIndex: number) => ZoneColor
  getZoneDefs: () => ZoneDef[]
  getOverlayHatchColors: () => { [key: string]: OverlayHatchColor }
}

export interface DataDisplayElements {
  [key: string]: HTMLElement | null
}

export interface DataDisplayModule {
  rgba: (r: number, g: number, b: number, a: number) => string
  hexToRgba: (hex: string, alpha: number) => string
  formatNumber: (num: number) => string
  getElements: () => DataDisplayElements
  generateDataPanels: (elements: DataDisplayElements) => void
  generateLegend: (elements: DataDisplayElements) => void
  updateDataDisplay: (elements: DataDisplayElements, state: AppState) => void
  updateBuildingDisplay: (elements: DataDisplayElements, state: AppState) => void
  populateBuildingCitySelect: (elements: DataDisplayElements, cities: City[]) => void
}

export interface AppModule {
  createExplosion: (defaults?: Partial<Explosion>) => Explosion
  getSelectedExplosion: () => Explosion | null
  getExplosionById: (id: number) => Explosion | null
  regenerateTerrain: () => void
  state: AppState
}

export interface AudioModule {
  [key: string]: any
}

export interface AnimationModule {
  [key: string]: any
}

export interface TimelineModule {
  [key: string]: any
}

export interface EvacuationModule {
  [key: string]: any
}

declare global {
  interface Window {
    Physics: PhysicsModule
    UI: UIModule
    Renderer: RendererModule
    DataDisplay: DataDisplayModule
    App: AppModule
    Audio: AudioModule
    Animation: AnimationModule
    Timeline: TimelineModule
    Evacuation: EvacuationModule
  }
}

export {}
