import { reactive, computed, ref } from 'vue'
import type { Explosion, AppState, ZoneConfig } from '../types'

let explosionIdCounter = 0

function createExplosion(defaults?: Partial<Explosion>): Explosion {
  explosionIdCounter++
  return Object.assign(
    {
      id: explosionIdCounter,
      bombType: 'castle_bravo',
      yieldKilotons: 15000,
      burstHeight: 1000,
      explosionCenter: null,
      radii: null
    },
    defaults || {}
  )
}

const state = reactive<AppState>({
  explosions: [] as Explosion[],
  selectedExplosionId: null as number | null,
  viewMode: 'combined',
  scale: 20,
  showLabels: true,
  showLegend: true,
  isAnimating: false,
  animationId: null as number | null,
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
  selectedShelterIndex: null as number | null,
  evacuationPlan: null,
  evacuationRoads: [],
  mapCtx: null,
  effectCtx: null
})

const zones = ref<ZoneConfig[]>([])

export function useAppState() {
  const selectedExplosion = computed(() => {
    if (!state.selectedExplosionId) return null
    return state.explosions.find((e) => e.id === state.selectedExplosionId) || null
  })

  function getExplosionById(id: number): Explosion | null {
    return state.explosions.find((e) => e.id === id) || null
  }

  function addExplosion() {
    const explosion = createExplosion()
    state.explosions.push(explosion)
    state.selectedExplosionId = explosion.id
    return explosion
  }

  function removeExplosion() {
    if (!state.selectedExplosionId) return
    const index = state.explosions.findIndex((e) => e.id === state.selectedExplosionId)
    if (index > -1) {
      state.explosions.splice(index, 1)
      if (state.explosions.length > 0) {
        state.selectedExplosionId = state.explosions[Math.min(index, state.explosions.length - 1)].id
      } else {
        state.selectedExplosionId = null
      }
    }
  }

  function updateExplosionParams(params: Partial<Explosion>) {
    const explosion = selectedExplosion.value
    if (explosion) {
      Object.assign(explosion, params)
    }
  }

  function initApp() {
    if (typeof window !== 'undefined' && window.Physics) {
      zones.value = window.Physics.defaultZones || []
    }
  }

  return {
    state,
    zones,
    selectedExplosion,
    createExplosion,
    getExplosionById,
    addExplosion,
    removeExplosion,
    updateExplosionParams,
    initApp
  }
}
