import { generateTerrainFeatures, calculateRadii, generateShelters, generateRoadNetwork, calculateEvacuationPlan } from './physics.ts'
import type { Explosion, AppState, TerrainData } from '../types/index.js'

let explosionIdCounter: number = 0

export function createExplosion(defaults: Partial<Explosion> = {}): Explosion {
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

export const state: AppState = {
    explosions: [],
    selectedExplosionId: null,
    viewMode: 'combined' as const,
    scale: 20,
    showLabels: true,
    showLegend: true,
    isAnimating: false,
    animationId: null,
    cities: [],
    terrainEnabled: true,
    terrainPreset: 'mountainous' as const,
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

export function getSelectedExplosion(): Explosion | null {
    if (!state.selectedExplosionId) return null
    return state.explosions.find(function (e: Explosion): boolean { return e.id === state.selectedExplosionId }) || null
}

export function getExplosionById(id: number): Explosion | null {
    return state.explosions.find(function (e: Explosion): boolean { return e.id === id }) || null
}

export function regenerateTerrain(): void {
    const mapWrapper: HTMLElement | null = document.getElementById('mapWrapper')
    if (!mapWrapper) return
    const rect: DOMRect = mapWrapper.getBoundingClientRect()
    if (state.terrainEnabled) {
        state.terrainData = generateTerrainFeatures(
            rect.width, rect.height,
            state.terrainPreset,
            state.terrainIntensity,
            state.terrainSeed
        ) as TerrainData
    } else {
        state.terrainData = generateTerrainFeatures(
            rect.width, rect.height,
            'flat', 0, state.terrainSeed
        ) as TerrainData
    }
}
