export interface BombType {
    yield: number
    name: string
}

export interface ZoneDef {
    key: string
    label: string
    dash: number[] | string | null
    color: number[]
    altitudeSensitivity: number
    radiusFormula: string
    heightFactorType: string
    overpressureThreshold: number
    casualtyRates: {
        deaths: number
        injured: number
        destroyed: boolean
    }
    description: string
    minRadius: number
    order?: number
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

export interface Explosion {
    id: number
    bombType: string
    yieldKilotons: number
    burstHeight: number
    explosionCenter: { x: number; y: number } | null
    radii: Record<string, number> | null
}

export interface Shelter {
    id: number
    x: number
    y: number
    capacity: number
    name: string
}

export interface EvacuationPlan {
    graph: any
    cityPlans: any[]
    roadDensities: any[]
    totalPopulation: number
    totalEvacuated: number
    totalStranded: number
    evacuationRate: number
    strandedRate: number
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
    indoorSurvivalRate: Record<string, number>
}

export interface DamageLevel {
    name: string
    color: string
    order: number
}
