import type {
  Explosion,
  City,
  Shelter,
  TerrainData,
  Point,
  Road,
  AppState,
  AppModule
} from '@/types/index'

interface EvacuationPlan {
  cityPlans: Array<{
    cityIndex: number
    evacuated: number
    path: Road[]
    travelTimeHours: number
    canEvacuate: boolean
  }>
  roadDensities: Array<{
    edge: Road
    density: number
  }>
  graph: {
    nodes: Array<{
      id: number
      type: 'city' | 'shelter'
      ref: City | Shelter
      refIndex: number
      x: number
      y: number
      population?: number
      capacity?: number
      edges: Road[]
    }>
  }
  totalEvacuated: number
  totalPopulation: number
  totalStranded: number
  evacuationRate: number
}

interface UiElements {
  [key: string]: HTMLElement | null
}

let explosionIdCounter = 0

function createExplosion(defaults?: Partial<Explosion>): Explosion {
  explosionIdCounter++
  return Object.assign({
    id: explosionIdCounter,
    bombType: 'castle_bravo',
    yieldKilotons: 15000,
    burstHeight: 1000,
    explosionCenter: null,
    radii: null
  }, defaults || {}) as Explosion
}

const state: AppState = {
  explosions: [],
  selectedExplosionId: null,
  viewMode: 'combined',
  scale: 20,
  showLabels: true,
  showLegend: true,
  isAnimating: false,
  animationId: null,
  cities: [],
  terrainEnabled: true,
  terrainPreset: 'mountainous',
  terrainIntensity: 1.0,
  terrainSeed: Math.floor(Math.random() * 100000),
  terrainData: null,
  showTerrainContours: true,
  showTerrainHeatmap: true,
  evacuationEnabled: true,
  shelters: [],
  selectedShelterIndex: null,
  evacuationPlan: null,
  evacuationRoads: [],
  mapCtx: null,
  effectCtx: null
}

function getSelectedExplosion(): Explosion | null {
  if (!state.selectedExplosionId) return null
  return state.explosions.find(function (e: Explosion): boolean { return e.id === state.selectedExplosionId }) || null
}

function getExplosionById(id: number): Explosion | null {
  return state.explosions.find(function (e: Explosion): boolean { return e.id === id }) || null
}

let mapCanvas: HTMLCanvasElement
let effectCanvas: HTMLCanvasElement
let mapCtx: CanvasRenderingContext2D
let effectCtx: CanvasRenderingContext2D
let mapWrapper: HTMLElement
let flashOverlay: HTMLElement
let mapHint: HTMLElement

function regenerateTerrain(): void {
  const rect = mapWrapper.getBoundingClientRect()
  if (state.terrainEnabled) {
    state.terrainData = window.Physics.generateTerrainFeatures(
      rect.width, rect.height,
      state.terrainPreset,
      state.terrainIntensity,
      state.terrainSeed
    )
  } else {
    state.terrainData = window.Physics.generateTerrainFeatures(
      rect.width, rect.height,
      'flat', 0, state.terrainSeed
    )
  }
}

function init(): void {
  mapCanvas = document.getElementById('mapCanvas') as HTMLCanvasElement
  effectCanvas = document.getElementById('effectCanvas') as HTMLCanvasElement
  mapCtx = mapCanvas.getContext('2d') as CanvasRenderingContext2D
  effectCtx = effectCanvas.getContext('2d') as CanvasRenderingContext2D
  mapWrapper = document.getElementById('mapWrapper') as HTMLElement
  flashOverlay = document.getElementById('flashOverlay') as HTMLElement
  mapHint = document.getElementById('mapHint') as HTMLElement

  const elements = window.UI.getControlElements()
  const dataElements = window.DataDisplay.getElements()

  state.mapCtx = mapCtx
  state.effectCtx = effectCtx

  window.Renderer.setupCanvas(mapCanvas, effectCanvas, mapCtx, effectCtx, mapWrapper, state)
  window.UI.setupEventListeners(elements, dataElements, state, mapCanvas, mapCtx, effectCtx, effectCanvas, mapWrapper, flashOverlay, mapHint)

  const rect = mapWrapper.getBoundingClientRect()

  regenerateTerrain()

  const firstExplosion = createExplosion({
    explosionCenter: {
      x: rect.width / 2,
      y: rect.height / 2
    }
  })
  firstExplosion.radii = window.Physics.calculateRadii(firstExplosion.yieldKilotons, firstExplosion.burstHeight)
  state.explosions.push(firstExplosion)
  state.selectedExplosionId = firstExplosion.id

  mapHint.classList.add('hidden')

  window.UI.refreshExplosionList(state, elements)
  window.UI.syncControlsFromSelected(state, elements)
  window.UI.syncTerrainControlsFromState(state, elements)
  window.UI.updateAllCalculations(state)
  window.DataDisplay.updateDataDisplay(dataElements, state)
  window.DataDisplay.populateBuildingCitySelect(elements, state.cities)

  initEvacuation(elements, rect.width, rect.height)

  window.Renderer.drawMap(mapCtx, mapWrapper, state)
}

function initEvacuation(elements: UiElements, width: number, height: number): void {
  const shelterCount = elements.shelterCount
    ? parseInt((elements.shelterCount as HTMLInputElement).value, 10)
    : 3

  state.shelters = window.Physics.generateShelters(width, height, shelterCount)
  state.evacuationRoads = window.Physics.generateRoadNetwork(width, height, state.cities, state.shelters)

  const warningTime = elements.warningTimeSlider
    ? parseInt((elements.warningTimeSlider as HTMLInputElement).value, 10)
    : 30

  const roadCapMultiplier = elements.roadCapacity
    ? parseFloat((elements.roadCapacity as HTMLInputElement).value)
    : 1

  const vehSpeed = elements.vehicleSpeed
    ? parseInt((elements.vehicleSpeed as HTMLInputElement).value, 10)
    : 60

  state.evacuationPlan = window.Physics.calculateEvacuationPlan(
    state.cities,
    state.shelters,
    state.evacuationRoads,
    state.scale,
    warningTime,
    roadCapMultiplier,
    vehSpeed
  ) as unknown as EvacuationPlan

  window.UI.updateEvacuationDisplay(state, elements)

  if (elements.evacuationPanel) {
    elements.evacuationPanel.classList.toggle('hidden', !state.evacuationEnabled)
  }
}

const App = {
  createExplosion: createExplosion,
  getSelectedExplosion: getSelectedExplosion,
  getExplosionById: getExplosionById,
  regenerateTerrain: regenerateTerrain,
  get state() { return state }
}

if (typeof window !== 'undefined') {
  window.App = App as AppModule
}

document.addEventListener('DOMContentLoaded', init)

export default App
export {
  createExplosion,
  getSelectedExplosion,
  getExplosionById,
  regenerateTerrain,
  state,
  init,
  initEvacuation
}

export type {
  AppState,
  EvacuationPlan,
  UiElements
}
