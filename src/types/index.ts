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

export interface Road {
    x1: number
    y1: number
    x2: number
    y2: number
    capacity?: number
    lanes?: number
    isShelterAccess?: boolean
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

export interface EvacuationGraph {
    nodes: EvacuationNode[]
    nodeMap: Record<string, number>
}

export interface CityPlan {
    cityIndex: number
    population: number
    shelterId: number | null
    distanceKm: number
    path: EvacuationEdge[]
    evacuated: number
    stranded: number
    travelTimeHours: number
    canEvacuate?: boolean
}

export interface RoadDensity {
    edge: EvacuationEdge
    density: number
    flow: number
}

export interface EvacuationPlan {
    graph: EvacuationGraph
    cityPlans: CityPlan[]
    roadDensities: RoadDensity[]
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
    evacuationRoads: Road[]
    mapCtx: CanvasRenderingContext2D | null
    effectCtx: CanvasRenderingContext2D | null
    buildingViewMode?: string
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

export interface BuildingCasualtyResult {
    deaths: number
    injured: number
    damageLevel: string
    buildingType?: string
    overpressure?: number
}

export interface CityBuildingDamageResult {
    city: City
    maxOverpressure: number
    avgStructureFactor: number
    buildingResults: Record<string, {
        population: number
        damageLevel: string
        deaths: number
        injured: number
        overpressure: number
    }>
    totalDeaths: number
    totalInjured: number
    totalDestroyedPop: number
    totalAffectedPop: number
    distByDamage: Record<string, number>
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
    totalByDamage: Record<string, number>
    totalByBuildingType: Record<string, {
        population: number
        deaths: number
        injured: number
        damageLevel?: string
    }>
    overallSurvivalRate: number
    maxOverpressure?: number
    avgStructureFactor?: number
    isSingleCity?: boolean
    cityName?: string
}

export interface PathAttenuationResult {
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

export interface CombinedStats {
    count: number
    combinedArea: number
    totalArea: number
    overlapArea: number
    totalEnergy: number
    perZone: Record<string, number>
}

export interface ZoneOperationResult {
    success: boolean
    error?: string
    zone?: ZoneDef
    zones?: ZoneDef[]
}

export interface ControlElements {
    [key: string]: HTMLElement | null
}

export interface DataElements {
    [key: string]: HTMLElement | null
}

export interface TimelineStage {
    id: number
    name: string
    timeLabel: string
    description: string
    falloutRadiusFactor: number
    deathFactor: number
    injuredFactor: number
}

export interface VehicleParticle {
    planIndex: number
    pathIndex: number
    pathProgress: number
    startDelay: number
    speed: number
    size: number
    color: string
    active: boolean
    completed: boolean
    x: number
    y: number
}

export interface VehicleUpdateStats {
    total: number
    active: number
    completed: number
}

export interface AnimState {
    cx: number
    cy: number
    scale: number
    radii: Record<string, number>
    particles: Particle[]
    debris: Debris[]
    smoke: number[]
    maxShockwave: number
    terrain: TerrainData | null
    explosionRef: Explosion
    tintIndex: number
    zoneDisplayTimes: Record<string, number>
    zoneOrder: string[]
    maxRadiusKm: number
    quakeStartTime: number
    quakePeakTime: number
    quakeEndTime: number
    displayedZones: Record<string, boolean>
    soundTriggers: {
        flash: boolean
        explosion: boolean
        shockwaveNear: boolean
        shockwaveFar: boolean
        quake: boolean
        debris: boolean
    }
}

export interface Particle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    life: number
    color: string
    gravity: number
}

export interface Debris {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    rotation: number
    rotSpeed: number
    life: number
    color: string
}

export interface RgbaColor {
    r: number
    g: number
    b: number
    a: number
}

export interface SoundLayerResult {
    osc: OscillatorNode
    gain: GainNode
    filter: BiquadFilterNode | null
}

export interface NoiseLayerResult {
    noiseSource: AudioBufferSourceNode
    gain: GainNode
    filter: BiquadFilterNode
}

export interface SoundResult {
    ctx: AudioContext
    group: GainNode
    layers: (SoundLayerResult | NoiseLayerResult)[]
    startTime: number
}

export interface TerrainPreset {
    name: string
    mountainCount: number
    hillCount: number
    basinCount: number
    elevationScale: number
}
