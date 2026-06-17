/// <reference types="vite/client" />

interface Point {
  x: number
  y: number
}

interface ExplosionRadii {
  [key: string]: number
}

interface Explosion {
  id: number
  bombType: string
  yieldKilotons: number
  burstHeight: number
  explosionCenter: Point | null
  radii: ExplosionRadii | null
}

interface ZoneConfig {
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

interface City {
  name: string
  x: number
  y: number
  population: number
}

interface Shelter {
  x: number
  y: number
  capacity: number
}

interface TerrainData {
  elevation: number[][]
  mountains: number
  hills: number
  basins: number
  maxElevation: number
}

interface EvacuationPlan {
  totalPopulation: number
  evacuatedPopulation: number
  strandedPopulation: number
  evacuationRate: number
  roads: any[]
}

interface AppState {
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

interface PhysicsModule {
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

interface UIModule {
  getControlElements: () => any
  setupEventListeners: (...args: any[]) => void
  refreshExplosionList: (state: AppState, elements: any) => void
  syncControlsFromSelected: (state: AppState, elements: any) => void
  syncTerrainControlsFromState: (state: AppState, elements: any) => void
  updateAllCalculations: (state: AppState) => void
  updateEvacuationDisplay: (state: AppState, elements: any) => void
}

interface RendererModule {
  setupCanvas: (...args: any[]) => void
  drawMap: (ctx: CanvasRenderingContext2D, wrapper: HTMLElement, state: AppState) => void
}

interface DataDisplayModule {
  getElements: () => any
  updateDataDisplay: (elements: any, state: AppState) => void
  populateBuildingCitySelect: (elements: any, cities: City[]) => void
}

interface AppModule {
  createExplosion: (defaults?: Partial<Explosion>) => Explosion
  getSelectedExplosion: () => Explosion | null
  getExplosionById: (id: number) => Explosion | null
  regenerateTerrain: () => void
  state: AppState
}

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
