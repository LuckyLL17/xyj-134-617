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

export interface City {
  name: string
  x: number
  y: number
  population: number
}

export interface Shelter {
  x: number
  y: number
  capacity: number
}

export interface TerrainData {
  elevation: number[][]
  mountains: number
  hills: number
  basins: number
  maxElevation: number
}

export interface EvacuationPlan {
  totalPopulation: number
  evacuatedPopulation: number
  strandedPopulation: number
  evacuationRate: number
  roads: any[]
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
  evacuationRoads: any[]
  mapCtx: CanvasRenderingContext2D | null
  effectCtx: CanvasRenderingContext2D | null
}

export interface PhysicsModule {
  calculateRadii: (yieldKilotons: number, burstHeight: number) => ExplosionRadii
  generateTerrainFeatures: (
    width: number,
    height: number,
    preset: string,
    intensity: number,
    seed: number
  ) => TerrainData
  generateShelters: (width: number, height: number, count: number) => Shelter[]
  generateRoadNetwork: (
    width: number,
    height: number,
    cities: City[],
    shelters: Shelter[]
  ) => any[]
  calculateEvacuationPlan: (
    cities: City[],
    shelters: Shelter[],
    roads: any[],
    scale: number,
    warningTime: number,
    roadCapMultiplier: number,
    vehicleSpeed: number
  ) => EvacuationPlan
  defaultZones: ZoneConfig[]
}

export interface UIModule {
  getControlElements: () => any
  setupEventListeners: (...args: any[]) => void
  refreshExplosionList: (state: AppState, elements: any) => void
  syncControlsFromSelected: (state: AppState, elements: any) => void
  syncTerrainControlsFromState: (state: AppState, elements: any) => void
  updateAllCalculations: (state: AppState) => void
  updateEvacuationDisplay: (state: AppState, elements: any) => void
}

export interface RendererModule {
  setupCanvas: (...args: any[]) => void
  drawMap: (ctx: CanvasRenderingContext2D, wrapper: HTMLElement, state: AppState) => void
}

export interface DataDisplayModule {
  getElements: () => any
  updateDataDisplay: (elements: any, state: AppState) => void
  populateBuildingCitySelect: (elements: any, cities: City[]) => void
}

export interface AppModule {
  createExplosion: (defaults?: Partial<Explosion>) => Explosion
  getSelectedExplosion: () => Explosion | null
  getExplosionById: (id: number) => Explosion | null
  regenerateTerrain: () => void
  state: AppState
}

declare global {
  interface Window {
    Physics: PhysicsModule
    UI: UIModule
    Renderer: RendererModule
    DataDisplay: DataDisplayModule
    App: AppModule
    Audio: any
    Animation: any
    Timeline: any
    Evacuation: any
  }
}

export {}
