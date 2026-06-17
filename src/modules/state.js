import { generateTerrainFeatures, calculateRadii, generateShelters, generateRoadNetwork, calculateEvacuationPlan } from './physics.js'

let explosionIdCounter = 0

export function createExplosion(defaults) {
    explosionIdCounter++
    return Object.assign({
        id: explosionIdCounter,
        bombType: 'castle_bravo',
        yieldKilotons: 15000,
        burstHeight: 1000,
        explosionCenter: null,
        radii: null
    }, defaults || {})
}

export const state = {
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

export function getSelectedExplosion() {
    if (!state.selectedExplosionId) return null
    return state.explosions.find(function (e) { return e.id === state.selectedExplosionId }) || null
}

export function getExplosionById(id) {
    return state.explosions.find(function (e) { return e.id === id }) || null
}

export function regenerateTerrain() {
    const mapWrapper = document.getElementById('mapWrapper')
    if (!mapWrapper) return
    const rect = mapWrapper.getBoundingClientRect()
    if (state.terrainEnabled) {
        state.terrainData = generateTerrainFeatures(
            rect.width, rect.height,
            state.terrainPreset,
            state.terrainIntensity,
            state.terrainSeed
        )
    } else {
        state.terrainData = generateTerrainFeatures(
            rect.width, rect.height,
            'flat', 0, state.terrainSeed
        )
    }
}
