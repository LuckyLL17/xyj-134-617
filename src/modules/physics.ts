import type {
    BombType,
    ZoneDef,
    TerrainFeature,
    TerrainData,
    City,
    Explosion,
    Shelter,
    Road,
    EvacuationGraph,
    EvacuationEdge,
    EvacuationNode,
    CityPlan,
    RoadDensity,
    EvacuationPlan,
    BuildingCasualtyResult,
    CityBuildingDamageResult,
    AllCitiesBuildingDamageResult,
    PathAttenuationResult,
    TerrainBoundaryPoint,
    CombinedStats,
    ZoneOperationResult,
    TerrainPreset,
    BuildingType,
    DamageLevel
} from '../types/index.js';

export const BOMB_TYPES: Record<string, BombType> = {
    custom: { yield: 15000, name: '\u81ea\u5b9a\u4e49' },
    little_boy: { yield: 15, name: '\u5c0f\u7537\u5b69' },
    fat_man: { yield: 21, name: '\u80d6\u5b50' },
    tsar_bomba: { yield: 50000, name: '\u6c99\u7687\u70b8\u5f39' },
    b83: { yield: 1200, name: 'B83' },
    w88: { yield: 475, name: 'W88' },
    trinity: { yield: 20, name: '\u4e09\u4f4d\u4e00\u4f53' },
    castle_bravo: { yield: 15000, name: '\u559d\u5f69\u57ce\u5821' }
};

export const TERRAIN_FEATURE_TYPES: Record<string, string> = {
    MOUNTAIN: 'mountain',
    HILL: 'hill',
    BASIN: 'basin',
    PLAIN: 'plain'
};

export const TERRAIN_PRESETS: Record<string, TerrainPreset> = {
    flat: { name: '\u5e73\u5766\u5730\u5f62', mountainCount: 0, hillCount: 0, basinCount: 0, elevationScale: 0.0 },
    gentle: { name: '\u4e18\u9675\u5730\u5f62', mountainCount: 1, hillCount: 6, basinCount: 3, elevationScale: 0.5 },
    mountainous: { name: '\u591a\u5c71\u5730\u5f62', mountainCount: 4, hillCount: 4, basinCount: 2, elevationScale: 1.0 },
    extreme: { name: '\u6781\u7aef\u5730\u5f62', mountainCount: 6, hillCount: 8, basinCount: 4, elevationScale: 1.5 }
};

export const BUILDING_TYPES: Record<string, BuildingType> = {
    temporary: {
        name: '\u4e34\u65f6\u5efa\u7b51',
        shortName: '\u4e34\u5efa',
        color: '#8b7355',
        description: '\u4e34\u65f6\u5de5\u68da\u3001\u7b80\u6613\u623f\u5c4b',
        structureFactor: 0.15,
        collapsePsi: 0.8,
        severeDamagePsi: 0.5,
        moderateDamagePsi: 0.3,
        lightDamagePsi: 0.15,
        indoorSurvivalRate: {
            intact: 0.99,
            light: 0.9,
            moderate: 0.6,
            severe: 0.2,
            destroyed: 0.05
        }
    },
    wood: {
        name: '\u6728\u7ed3\u6784',
        shortName: '\u6728\u6784',
        color: '#a0522d',
        description: '\u4f20\u7edf\u6728\u8d28\u7ed3\u6784\u4f4f\u5b85',
        structureFactor: 0.35,
        collapsePsi: 2.0,
        severeDamagePsi: 1.2,
        moderateDamagePsi: 0.7,
        lightDamagePsi: 0.35,
        indoorSurvivalRate: {
            intact: 0.99,
            light: 0.95,
            moderate: 0.75,
            severe: 0.35,
            destroyed: 0.1
        }
    },
    brick: {
        name: '\u7816\u6df7\u7ed3\u6784',
        shortName: '\u7816\u6df7',
        color: '#b22222',
        description: '\u7816\u780c\u4f53\u7ed3\u6784\u623f\u5c4b',
        structureFactor: 0.55,
        collapsePsi: 4.0,
        severeDamagePsi: 2.5,
        moderateDamagePsi: 1.5,
        lightDamagePsi: 0.7,
        indoorSurvivalRate: {
            intact: 0.995,
            light: 0.97,
            moderate: 0.82,
            severe: 0.45,
            destroyed: 0.15
        }
    },
    rc_frame: {
        name: '\u94a2\u7b4b\u6df7\u51dd\u571f\u6846\u67b6',
        shortName: '\u783c\u6846\u67b6',
        color: '#708090',
        description: '\u94a2\u7b4b\u6df7\u51dd\u571f\u6846\u67b6\u7ed3\u6784',
        structureFactor: 0.8,
        collapsePsi: 8.0,
        severeDamagePsi: 5.0,
        moderateDamagePsi: 3.0,
        lightDamagePsi: 1.5,
        indoorSurvivalRate: {
            intact: 0.998,
            light: 0.98,
            moderate: 0.88,
            severe: 0.55,
            destroyed: 0.22
        }
    },
    steel: {
        name: '\u94a2\u7ed3\u6784',
        shortName: '\u94a2\u6784',
        color: '#4682b4',
        description: '\u94a2\u7ed3\u6784\u5efa\u7b51',
        structureFactor: 1.0,
        collapsePsi: 12.0,
        severeDamagePsi: 7.5,
        moderateDamagePsi: 4.5,
        lightDamagePsi: 2.2,
        indoorSurvivalRate: {
            intact: 0.998,
            light: 0.985,
            moderate: 0.9,
            severe: 0.6,
            destroyed: 0.25
        }
    },
    rc_core: {
        name: '\u94a2\u7b4b\u6df7\u51dd\u571f\u6838\u5fc3\u7b52',
        shortName: '\u6838\u5fc3\u7b52',
        color: '#2f4f4f',
        description: '\u8d85\u9ad8\u5c42\u6838\u5fc3\u7b52\u7ed3\u6784',
        structureFactor: 1.3,
        collapsePsi: 18.0,
        severeDamagePsi: 11.0,
        moderateDamagePsi: 6.5,
        lightDamagePsi: 3.2,
        indoorSurvivalRate: {
            intact: 0.999,
            light: 0.99,
            moderate: 0.92,
            severe: 0.65,
            destroyed: 0.3
        }
    },
    blast_resistant: {
        name: '\u9632\u7206\u4eba\u9632\u5de5\u7a0b',
        shortName: '\u4eba\u9632',
        color: '#556b2f',
        description: '\u4eba\u9632\u5de5\u7a0b\u3001\u9632\u7206\u5efa\u7b51',
        structureFactor: 2.5,
        collapsePsi: 35.0,
        severeDamagePsi: 22.0,
        moderateDamagePsi: 12.0,
        lightDamagePsi: 6.0,
        indoorSurvivalRate: {
            intact: 0.999,
            light: 0.995,
            moderate: 0.97,
            severe: 0.85,
            destroyed: 0.5
        }
    }
};

export const BUILDING_TYPE_ORDER: string[] = ['temporary', 'wood', 'brick', 'rc_frame', 'steel', 'rc_core', 'blast_resistant'];

export const DAMAGE_LEVELS: Record<string, DamageLevel> = {
    intact: { name: '\u5b8c\u597d', color: '#4caf50', order: 0 },
    light: { name: '\u8f7b\u5fae\u7834\u574f', color: '#ffeb3b', order: 1 },
    moderate: { name: '\u4e2d\u5ea6\u7834\u574f', color: '#ff9800', order: 2 },
    severe: { name: '\u4e25\u91cd\u7834\u574f', color: '#f44336', order: 3 },
    destroyed: { name: '\u5b8c\u5168\u6467\u6bc1', color: '#9c27b0', order: 4 }
};

export function getBuildingDamageLevel(buildingType: string, overpressurePsi: number): string {
    const bt = BUILDING_TYPES[buildingType];
    if (!bt) return 'destroyed';

    const op = overpressurePsi;

    if (op >= bt.collapsePsi) return 'destroyed';
    if (op >= bt.severeDamagePsi) return 'severe';
    if (op >= bt.moderateDamagePsi) return 'moderate';
    if (op >= bt.lightDamagePsi) return 'light';
    return 'intact';
}

export function getOverpressureAtDistance(yieldKilotons: number, distanceKm: number, burstHeight: number): number {
    const W_megatons = yieldKilotons / 1000;

    if (distanceKm <= 0) return 100;

    const scaledDist = distanceKm / Math.pow(W_megatons, 1 / 3);

    let overpressure: number;
    if (scaledDist < 0.1) {
        overpressure = 200;
    } else if (scaledDist < 0.5) {
        overpressure = 30 * Math.pow(0.1 / scaledDist, 1.5);
    } else if (scaledDist < 2) {
        overpressure = 10 * Math.pow(0.5 / scaledDist, 1.3);
    } else if (scaledDist < 10) {
        overpressure = 2 * Math.pow(2 / scaledDist, 1.1);
    } else {
        overpressure = 0.3 * Math.pow(10 / scaledDist, 1.0);
    }

    const heightFactor = burstHeight > 0 ? Math.exp(-burstHeight / 3000) : 1.0;
    overpressure *= (0.8 + heightFactor * 0.4);

    return Math.max(0.01, overpressure);
}

export function calculateBuildingCasualties(population: number, buildingType: string, overpressurePsi: number, indoorRatio?: number): BuildingCasualtyResult {
    const bt = BUILDING_TYPES[buildingType];
    if (!bt) return { deaths: 0, injured: 0, damageLevel: 'destroyed' };

    const damageLevel = getBuildingDamageLevel(buildingType, overpressurePsi);
    const indoorPop = population * (indoorRatio !== undefined ? indoorRatio : 0.85);
    const outdoorPop = population - indoorPop;

    const indoorSurvival = bt.indoorSurvivalRate[damageLevel];
    const indoorDeaths = indoorPop * (1 - indoorSurvival);

    const outdoorSurvival = Math.max(0, 1 - overpressurePsi / 3);
    const outdoorDeaths = outdoorPop * Math.max(0, 1 - outdoorSurvival);

    const totalDeaths = indoorDeaths + outdoorDeaths;
    const injuredRatio: Record<string, number> = {
        intact: 0.02,
        light: 0.08,
        moderate: 0.2,
        severe: 0.35,
        destroyed: 0.25
    };
    const ratio = injuredRatio[damageLevel] || 0;

    const totalInjured = population * ratio * (1 - totalDeaths / population);

    return {
        deaths: totalDeaths,
        injured: Math.max(0, totalInjured),
        damageLevel: damageLevel,
        buildingType: buildingType,
        overpressure: overpressurePsi
    };
}

export const DEFAULT_ZONE_DEFS: ZoneDef[] = [
    {
        key: 'fireball',
        label: '\u706b\u7403',
        dash: null,
        color: [255, 69, 0],
        altitudeSensitivity: 0.05,
        radiusFormula: '0.14 * Math.pow(W, 0.4)',
        heightFactorType: 'height',
        overpressureThreshold: 50,
        casualtyRates: { deaths: 0.99, injured: 0, destroyed: true },
        description: '\u4e00\u5207\u77ac\u95f4\u6c7d\u5316',
        minRadius: 0.1
    },
    {
        key: 'radiation',
        label: '\u81f4\u547d\u8f90\u5c04',
        dash: [4, 4],
        color: [0, 255, 136],
        altitudeSensitivity: 0.30,
        radiusFormula: '1.2 * Math.pow(W, 1/3) * (burstHeight < 300 ? 1.3 : 1.0)',
        heightFactorType: 'pressure',
        overpressureThreshold: 10,
        casualtyRates: { deaths: 0.85, injured: 0.1, destroyed: true },
        description: '500 \u96f7\u59c6\u4ee5\u4e0a\uff0c\u6570\u65e5\u5185\u6b7b\u4ea1',
        minRadius: 0.3
    },
    {
        key: 'severe',
        label: '\u4e25\u91cd\u7834\u574f',
        dash: null,
        color: [255, 0, 0],
        altitudeSensitivity: 0.50,
        radiusFormula: '0.7 * Math.pow(W, 1/3) * 2.5',
        heightFactorType: 'height',
        overpressureThreshold: 20,
        casualtyRates: { deaths: 0.5, injured: 0.4, destroyed: true },
        description: '\u5efa\u7b51\u7269\u5168\u6bc1\uff0c\u4eba\u5458\u5fc5\u6b7b',
        minRadius: 0.5
    },
    {
        key: 'moderate',
        label: '\u4e2d\u5ea6\u7834\u574f',
        dash: null,
        color: [255, 136, 0],
        altitudeSensitivity: 0.40,
        radiusFormula: '0.7 * Math.pow(W, 1/3) * 4.5',
        heightFactorType: 'height',
        overpressureThreshold: 5,
        casualtyRates: { deaths: 0.15, injured: 0.5, destroyed: false },
        description: '\u623f\u5c4b\u5012\u584c\uff0c\u4e25\u91cd\u4f24\u4ea1',
        minRadius: 1.0
    },
    {
        key: 'light',
        label: '\u8f7b\u5ea6\u7834\u574f',
        dash: null,
        color: [255, 221, 0],
        altitudeSensitivity: 0.30,
        radiusFormula: '0.7 * Math.pow(W, 1/3) * 8',
        heightFactorType: 'height',
        overpressureThreshold: 1,
        casualtyRates: { deaths: 0.02, injured: 0.2, destroyed: false },
        description: '\u73bb\u7483\u7834\u788e\uff0c\u8f7b\u4f24',
        minRadius: 2.0
    },
    {
        key: 'thermal',
        label: '\u70ed\u8f90\u5c04',
        dash: [8, 4],
        color: [255, 102, 170],
        altitudeSensitivity: 0.15,
        radiusFormula: '2.8 * Math.pow(W, 0.41)',
        heightFactorType: 'thermal',
        overpressureThreshold: 0.1,
        casualtyRates: { deaths: 0, injured: 0.05, destroyed: false },
        description: '\u4e09\u5ea6\u70e7\u4f24\uff0c\u5f15\u71c3\u53ef\u71c3\u7269',
        minRadius: 1.0
    }
];

let ZONE_DEFS: ZoneDef[] = JSON.parse(JSON.stringify(DEFAULT_ZONE_DEFS)) as ZoneDef[];

export function getZones(): ZoneDef[] {
    return JSON.parse(JSON.stringify(ZONE_DEFS)) as ZoneDef[];
}

export function getZoneKeys(): string[] {
    return ZONE_DEFS.map(function (z: ZoneDef): string { return z.key; });
}

export function getZonePriority(): string[] {
    return ZONE_DEFS.map(function (z: ZoneDef): string { return z.key; });
}

export function getZoneAltitudeSensitivity(): Record<string, number> {
    const result: Record<string, number> = {};
    ZONE_DEFS.forEach(function (z: ZoneDef): void {
        result[z.key] = z.altitudeSensitivity;
    });
    return result;
}

export function getZoneByKey(key: string): ZoneDef | null {
    return ZONE_DEFS.find(function (z: ZoneDef): boolean { return z.key === key; }) || null;
}

export function addZone(zoneDef: Partial<ZoneDef> & { key: string; label: string }): ZoneOperationResult {
    if (!zoneDef || !zoneDef.key || !zoneDef.label) {
        return { success: false, error: '\u5708\u5c42key\u548clabel\u4e0d\u80fd\u4e3a\u7a7a' };
    }
    if (ZONE_DEFS.some(function (z: ZoneDef): boolean { return z.key === zoneDef.key; })) {
        return { success: false, error: '\u5708\u5c42key\u5df2\u5b58\u5728' };
    }

    const newZone: ZoneDef = {
        key: zoneDef.key,
        label: zoneDef.label,
        dash: zoneDef.dash || null,
        color: zoneDef.color || [128, 128, 128],
        altitudeSensitivity: zoneDef.altitudeSensitivity !== undefined ? zoneDef.altitudeSensitivity : 0.3,
        radiusFormula: zoneDef.radiusFormula || '1.0 * Math.pow(W, 0.4)',
        heightFactorType: zoneDef.heightFactorType || 'height',
        overpressureThreshold: zoneDef.overpressureThreshold !== undefined ? zoneDef.overpressureThreshold : 5,
        casualtyRates: zoneDef.casualtyRates || { deaths: 0.1, injured: 0.2, destroyed: false },
        description: zoneDef.description || '',
        minRadius: zoneDef.minRadius !== undefined ? zoneDef.minRadius : 0.5
    };

    ZONE_DEFS.splice(zoneDef.order !== undefined ? zoneDef.order : ZONE_DEFS.length, 0, newZone);
    return { success: true, zone: newZone };
}

export function updateZone(key: string, updates: Partial<ZoneDef>): ZoneOperationResult {
    const zoneIndex = ZONE_DEFS.findIndex(function (z: ZoneDef): boolean { return z.key === key; });
    if (zoneIndex < 0) {
        return { success: false, error: '\u5708\u5c42\u4e0d\u5b58\u5728' };
    }

    if (updates.key && updates.key !== key) {
        if (ZONE_DEFS.some(function (z: ZoneDef): boolean { return z.key === updates.key; })) {
            return { success: false, error: '\u65b0\u7684key\u5df2\u5b58\u5728' };
        }
    }

    ZONE_DEFS[zoneIndex] = Object.assign({}, ZONE_DEFS[zoneIndex], updates);

    if (updates.order !== undefined) {
        const newOrder = Math.max(0, Math.min(ZONE_DEFS.length - 1, updates.order));
        if (newOrder !== zoneIndex) {
            const [removed] = ZONE_DEFS.splice(zoneIndex, 1);
            ZONE_DEFS.splice(newOrder, 0, removed);
        }
    }

    return { success: true, zone: ZONE_DEFS[zoneIndex] };
}

export function removeZone(key: string): ZoneOperationResult {
    const zoneIndex = ZONE_DEFS.findIndex(function (z: ZoneDef): boolean { return z.key === key; });
    if (zoneIndex < 0) {
        return { success: false, error: '\u5708\u5c42\u4e0d\u5b58\u5728' };
    }
    if (ZONE_DEFS.length <= 1) {
        return { success: false, error: '\u81f3\u5c11\u4fdd\u7559\u4e00\u4e2a\u5708\u5c42' };
    }

    const removed = ZONE_DEFS.splice(zoneIndex, 1)[0];
    return { success: true, zone: removed };
}

export function resetZones(): ZoneOperationResult {
    ZONE_DEFS = JSON.parse(JSON.stringify(DEFAULT_ZONE_DEFS)) as ZoneDef[];
    return { success: true, zones: ZONE_DEFS };
}

export function moveZone(key: string, newIndex: number): ZoneOperationResult {
    const zoneIndex = ZONE_DEFS.findIndex(function (z: ZoneDef): boolean { return z.key === key; });
    if (zoneIndex < 0) {
        return { success: false, error: '\u5708\u5c42\u4e0d\u5b58\u5728' };
    }

    const targetIndex = Math.max(0, Math.min(ZONE_DEFS.length - 1, newIndex));
    if (targetIndex === zoneIndex) {
        return { success: true, zone: ZONE_DEFS[zoneIndex] };
    }

    const [removed] = ZONE_DEFS.splice(zoneIndex, 1);
    ZONE_DEFS.splice(targetIndex, 0, removed);
    return { success: true, zone: removed };
}

export function calculateZoneRadius(zone: ZoneDef, W_megatons: number, burstHeight: number): number {
    try {
        const W = W_megatons;
        const height = burstHeight;
        // eslint-disable-next-line no-eval
        const result = eval(zone.radiusFormula);

        const heightFactor = Math.max(0.85, 1 - (burstHeight / 10000));
        const pressureFactor = Math.exp(-burstHeight / 2000);
        const thermalFactor = burstHeight > 0 ? 1.15 : 0.9;

        let finalRadius: number = result;
        switch (zone.heightFactorType) {
            case 'pressure':
                finalRadius = result * pressureFactor;
                break;
            case 'thermal':
                finalRadius = result * thermalFactor;
                break;
            case 'height':
            default:
                finalRadius = result * heightFactor;
                break;
        }

        return Math.max(zone.minRadius, finalRadius);
    } catch (e) {
        console.error('\u5708\u5c42\u534a\u5f84\u8ba1\u7b97\u9519\u8bef:', zone.key, e);
        return zone.minRadius;
    }
}

export function calculateRadii(yieldKilotons: number, burstHeight: number): Record<string, number> {
    const W_megatons = yieldKilotons / 1000;
    const result: Record<string, number> = {};

    ZONE_DEFS.forEach(function (zone: ZoneDef): void {
        result[zone.key] = calculateZoneRadius(zone, W_megatons, burstHeight);
    });

    return result;
}

export function generateBuildingDistribution(isCentral: boolean, size: number): Record<string, number> {
    const dist: Record<string, number> = {};

    if (isCentral) {
        dist.temporary = 0.02;
        dist.wood = 0.05;
        dist.brick = 0.18;
        dist.rc_frame = 0.40;
        dist.steel = 0.20;
        dist.rc_core = 0.12;
        dist.blast_resistant = 0.03;
    } else if (size > 35) {
        dist.temporary = 0.04;
        dist.wood = 0.08;
        dist.brick = 0.25;
        dist.rc_frame = 0.35;
        dist.steel = 0.15;
        dist.rc_core = 0.10;
        dist.blast_resistant = 0.03;
    } else if (size > 25) {
        dist.temporary = 0.06;
        dist.wood = 0.12;
        dist.brick = 0.35;
        dist.rc_frame = 0.28;
        dist.steel = 0.10;
        dist.rc_core = 0.07;
        dist.blast_resistant = 0.02;
    } else {
        dist.temporary = 0.10;
        dist.wood = 0.20;
        dist.brick = 0.40;
        dist.rc_frame = 0.18;
        dist.steel = 0.06;
        dist.rc_core = 0.04;
        dist.blast_resistant = 0.02;
    }

    const jitter = 0.03;
    let total = 0;
    BUILDING_TYPE_ORDER.forEach(function (type: string): void {
        const jitterAmount = (Math.random() - 0.5) * 2 * jitter;
        dist[type] = Math.max(0.01, dist[type] + jitterAmount);
        total += dist[type];
    });

    BUILDING_TYPE_ORDER.forEach(function (type: string): void {
        dist[type] = dist[type] / total;
    });

    return dist;
}

export function generateCities(width: number, height: number): City[] {
    const cities: City[] = [];
    const cityCount = 80;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < cityCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.min(width, height) * 0.45 + 50;
        const x = centerX + Math.cos(angle) * dist * (0.5 + Math.random() * 0.8);
        const y = centerY + Math.sin(angle) * dist * (0.5 + Math.random() * 0.8);

        if (x > 50 && x < width - 50 && y > 50 && y < height - 50) {
            const size = Math.random() * 30 + 15;
            const population = Math.floor(Math.random() * 500000 + 50000);
            const buildingDist = generateBuildingDistribution(false, size);
            cities.push({
                x: x,
                y: y,
                size: size,
                population: population,
                name: getCityName(i),
                destroyed: false,
                buildingDistribution: buildingDist
            });
        }
    }

    const centralCity: City = {
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        size: 55,
        population: 3000000,
        name: '\u4e2d\u5fc3\u90fd\u5e02',
        destroyed: false,
        buildingDistribution: generateBuildingDistribution(true, 55)
    };
    cities.unshift(centralCity);

    return cities;
}

function getCityName(index: number): string {
    const prefixes = ['\u5317', '\u5357', '\u4e1c', '\u897f', '\u4e2d', '\u65b0', '\u53e4', '\u5927', '\u5c0f', '\u9752'];
    const suffixes = ['\u4eac', '\u57ce', '\u90fd', '\u5e02', '\u9547', '\u6e2f', '\u5dde', '\u5e9c', '\u91cc', '\u533a'];
    return prefixes[index % prefixes.length] + suffixes[Math.floor(index / prefixes.length) % suffixes.length];
}

export function generateRoads(width: number, height: number, cities: City[]): Road[] {
    const roads: Road[] = [];
    for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < Math.min(i + 3, cities.length); j++) {
            if (Math.random() < 0.3) {
                roads.push({
                    x1: cities[i].x,
                    y1: cities[i].y,
                    x2: cities[j].x,
                    y2: cities[j].y
                });
            }
        }
    }
    return roads;
}

export function getWorstZoneForCity(city: City, explosions: Explosion[], scale: number): string | null {
    const zonePriority = getZonePriority();
    let worstZoneIndex = -1;

    explosions.forEach(function (exp: Explosion): void {
        if (!exp.explosionCenter || !exp.radii) return;
        const dx = city.x - exp.explosionCenter.x;
        const dy = city.y - exp.explosionCenter.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distKm = distPx / scale;

        for (let i = 0; i < zonePriority.length; i++) {
            const zoneName = zonePriority[i];
            if (exp.radii[zoneName] !== undefined && distKm <= exp.radii[zoneName]) {
                if (worstZoneIndex < 0 || i < worstZoneIndex) {
                    worstZoneIndex = i;
                }
                break;
            }
        }
    });

    return worstZoneIndex >= 0 ? zonePriority[worstZoneIndex] : null;
}

function calculateCasualtiesForZone(pop: number, zoneName: string): { deaths: number; injured: number; destroyed: boolean } {
    const zone = getZoneByKey(zoneName);
    if (zone && zone.casualtyRates) {
        return {
            deaths: pop * (zone.casualtyRates.deaths || 0),
            injured: pop * (zone.casualtyRates.injured || 0),
            destroyed: zone.casualtyRates.destroyed || false
        };
    }
    return { deaths: 0, injured: 0, destroyed: false };
}

export function calculateCityBuildingDamage(city: City, explosions: Explosion[], scale: number, terrain: TerrainData | null): CityBuildingDamageResult {
    let maxOverpressure = 0;
    let worstSpecialZone: string | null = null;
    let maxSpecialOverpressure = 0;
    let additionalRadiationDeaths = 0;
    let additionalRadiationInjured = 0;

    const zones = getZones();
    const specialZoneKeys = zones.filter(function (z: ZoneDef): boolean {
        return z.casualtyRates && z.casualtyRates.destroyed;
    }).map(function (z: ZoneDef): string { return z.key; });

    explosions.forEach(function (exp: Explosion): void {
        if (!exp.explosionCenter || !exp.radii) return;
        const dx = city.x - exp.explosionCenter.x;
        const dy = city.y - exp.explosionCenter.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distKm = distPx / scale;

        let effectiveDistKm = distKm;
        if (terrain && terrain.features && terrain.features.length > 0) {
            const firstDestructiveZone = zones.find(function (z: ZoneDef): boolean {
                return z.casualtyRates && z.casualtyRates.destroyed;
            });
            const attenuationResult = calculatePathAttenuation(
                exp.explosionCenter.x, exp.explosionCenter.y,
                city.x, city.y,
                terrain, firstDestructiveZone ? firstDestructiveZone.key : 'severe', scale, exp.burstHeight
            );
            effectiveDistKm = distKm / Math.max(0.3, attenuationResult.attenuation);
        }

        const op = getOverpressureAtDistance(exp.yieldKilotons, effectiveDistKm, exp.burstHeight);
        if (op > maxOverpressure) {
            maxOverpressure = op;
        }

        zones.forEach(function (zone: ZoneDef): void {
            if (exp.radii![zone.key] !== undefined && distKm <= exp.radii![zone.key]) {
                if (zone.casualtyRates && zone.casualtyRates.destroyed) {
                    if (zone.overpressureThreshold > maxSpecialOverpressure) {
                        maxSpecialOverpressure = zone.overpressureThreshold;
                        worstSpecialZone = zone.key;
                    }
                }
                if (zone.key === 'radiation') {
                    additionalRadiationDeaths += city.population * 0.05;
                    additionalRadiationInjured += city.population * 0.08;
                }
            }
        });
    });

    const buildingResults: Record<string, { population: number; damageLevel: string; deaths: number; injured: number; overpressure: number }> = {};
    let totalDeaths = 0;
    let totalInjured = 0;
    let totalDestroyedPop = 0;
    let totalAffectedPop = 0;

    const distByDamage: Record<string, number> = {
        intact: 0,
        light: 0,
        moderate: 0,
        severe: 0,
        destroyed: 0
    };

    BUILDING_TYPE_ORDER.forEach(function (buildingType: string): void {
        const ratio = city.buildingDistribution[buildingType] || 0;
        const popInBuilding = city.population * ratio;

        let adjustedOverpressure = maxOverpressure;
        if (worstSpecialZone && maxSpecialOverpressure > 0) {
            adjustedOverpressure = Math.max(adjustedOverpressure, maxSpecialOverpressure);
        }

        const result = calculateBuildingCasualties(
            popInBuilding,
            buildingType,
            adjustedOverpressure
        );

        buildingResults[buildingType] = {
            population: popInBuilding,
            damageLevel: result.damageLevel,
            deaths: result.deaths,
            injured: result.injured,
            overpressure: adjustedOverpressure
        };

        totalDeaths += result.deaths;
        totalInjured += result.injured;

        if (result.damageLevel === 'destroyed') {
            totalDestroyedPop += popInBuilding;
        }
        if (result.damageLevel !== 'intact') {
            totalAffectedPop += popInBuilding;
        }

        distByDamage[result.damageLevel] = (distByDamage[result.damageLevel] || 0) + popInBuilding;
    });

    totalDeaths += additionalRadiationDeaths;
    totalInjured += additionalRadiationInjured;

    const avgStructureFactor = calculateAvgStructureFactor(city.buildingDistribution);

    return {
        city: city,
        maxOverpressure: maxOverpressure,
        avgStructureFactor: avgStructureFactor,
        buildingResults: buildingResults,
        totalDeaths: totalDeaths,
        totalInjured: totalInjured,
        totalDestroyedPop: totalDestroyedPop,
        totalAffectedPop: totalAffectedPop,
        distByDamage: distByDamage,
        worstSpecialZone: worstSpecialZone,
        inSpecialZone: worstSpecialZone !== null,
        survivalRate: city.population > 0 ? 1 - totalDeaths / city.population : 0
    };
}

export function calculateAvgStructureFactor(buildingDistribution: Record<string, number>): number {
    let total = 0;
    let weightedSum = 0;
    BUILDING_TYPE_ORDER.forEach(function (type: string): void {
        const ratio = buildingDistribution[type] || 0;
        if (ratio > 0) {
            const bt = BUILDING_TYPES[type];
            weightedSum += bt.structureFactor * ratio;
            total += ratio;
        }
    });
    return total > 0 ? weightedSum / total : 0.5;
}

export function calculateAllCitiesBuildingDamage(cities: City[], explosions: Explosion[], scale: number, terrain: TerrainData | null): AllCitiesBuildingDamageResult {
    const results: CityBuildingDamageResult[] = [];
    let totalDeaths = 0;
    let totalInjured = 0;
    let totalDestroyedPop = 0;

    const totalByDamage: Record<string, number> = {
        intact: 0,
        light: 0,
        moderate: 0,
        severe: 0,
        destroyed: 0
    };

    const totalByBuildingType: Record<string, { population: number; deaths: number; injured: number }> = {};
    BUILDING_TYPE_ORDER.forEach(function (type: string): void {
        totalByBuildingType[type] = { population: 0, deaths: 0, injured: 0 };
    });

    cities.forEach(function (city: City): void {
        const result = calculateCityBuildingDamage(city, explosions, scale, terrain);
        results.push(result);

        totalDeaths += result.totalDeaths;
        totalInjured += result.totalInjured;
        totalDestroyedPop += result.totalDestroyedPop;

        Object.keys(totalByDamage).forEach(function (level: string): void {
            totalByDamage[level] += result.distByDamage[level] || 0;
        });

        BUILDING_TYPE_ORDER.forEach(function (type: string): void {
            if (result.buildingResults[type]) {
                totalByBuildingType[type].population += result.buildingResults[type].population;
                totalByBuildingType[type].deaths += result.buildingResults[type].deaths;
                totalByBuildingType[type].injured += result.buildingResults[type].injured;
            }
        });

        if (result.totalDestroyedPop > city.population * 0.5) {
            city.destroyed = true;
        }
    });

    const totalPopulation = cities.reduce(function (sum: number, city: City): number {
        return sum + city.population;
    }, 0);

    return {
        cityResults: results,
        totalDeaths: Math.round(totalDeaths),
        totalInjured: Math.round(totalInjured),
        totalDestroyedPop: Math.round(totalDestroyedPop),
        totalPopulation: totalPopulation,
        totalByDamage: totalByDamage,
        totalByBuildingType: totalByBuildingType,
        overallSurvivalRate: totalPopulation > 0 ? 1 - totalDeaths / totalPopulation : 0
    };
}

export function calculateCasualties(cities: City[], explosionCenter: { x: number; y: number } | null, radii: Record<string, number>, scale: number): { deaths: number; injured: number } {
    let deaths = 0;
    let injured = 0;

    if (!explosionCenter || !cities || cities.length === 0) {
        return { deaths: 0, injured: 0 };
    }

    const r = radii;
    cities.forEach(function (city: City): void {
        const dx = city.x - explosionCenter.x;
        const dy = city.y - explosionCenter.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distKm = distPx / scale;
        const pop = city.population;

        if (distKm <= r.fireball) {
            deaths += pop * 0.99;
            city.destroyed = true;
        } else if (distKm <= r.radiation) {
            deaths += pop * 0.85;
            injured += pop * 0.1;
            city.destroyed = true;
        } else if (distKm <= r.severe) {
            deaths += pop * 0.5;
            injured += pop * 0.4;
            city.destroyed = true;
        } else if (distKm <= r.moderate) {
            deaths += pop * 0.15;
            injured += pop * 0.5;
        } else if (distKm <= r.light) {
            deaths += pop * 0.02;
            injured += pop * 0.2;
        } else if (distKm <= r.thermal) {
            injured += pop * 0.05;
        }
    });

    return {
        deaths: Math.round(deaths),
        injured: Math.round(injured)
    };
}

export function calculateCombinedCasualties(cities: City[], explosions: Explosion[], scale: number): { deaths: number; injured: number } {
    let deaths = 0;
    let injured = 0;

    if (!explosions || explosions.length === 0 || !cities || cities.length === 0) {
        return { deaths: 0, injured: 0 };
    }

    cities.forEach(function (city: City): void {
        const worstZone = getWorstZoneForCity(city, explosions, scale);
        if (!worstZone) return;

        const pop = city.population;
        const result = calculateCasualtiesForZone(pop, worstZone);
        deaths += result.deaths;
        injured += result.injured;
        if (result.destroyed) city.destroyed = true;
    });

    return {
        deaths: Math.round(deaths),
        injured: Math.round(injured)
    };
}

export function calculateEnergy(yieldKilotons: number): number {
    return Math.round(yieldKilotons * 4.184);
}

export function calculateTotalEnergy(explosions: Explosion[]): number {
    let total = 0;
    explosions.forEach(function (exp: Explosion): void {
        total += calculateEnergy(exp.yieldKilotons);
    });
    return Math.round(total);
}

export function calculateAffectedArea(radii: Record<string, number>): number {
    return Math.round(Math.PI * radii.thermal * radii.thermal);
}

function circleIntersectionArea(d: number, r1: number, r2: number): number {
    if (d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);

    const r1sq = r1 * r1;
    const r2sq = r2 * r2;
    const dsq = d * d;

    const a1 = Math.acos((dsq + r1sq - r2sq) / (2 * d * r1));
    const a2 = Math.acos((dsq + r2sq - r1sq) / (2 * d * r2));

    const part1 = r1sq * a1;
    const part2 = r2sq * a2;
    const part3 = 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));

    return part1 + part2 - part3;
}

function calculateCircleUnionAreaInclusion(circles: { x: number; y: number; r: number }[]): number {
    const n = circles.length;
    if (n === 0) return 0;
    if (n === 1) return Math.PI * circles[0].r * circles[0].r;

    let totalArea = 0;
    circles.forEach(function (c: { x: number; y: number; r: number }): void {
        totalArea += Math.PI * c.r * c.r;
    });

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const dx = circles[i].x - circles[j].x;
            const dy = circles[i].y - circles[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            totalArea -= circleIntersectionArea(d, circles[i].r, circles[j].r);
        }
    }

    return Math.max(0, totalArea);
}

export function calculateCombinedAreaPerZone(explosions: Explosion[], scale: number, zoneName: string): number {
    const circles: { x: number; y: number; r: number }[] = [];
    explosions.forEach(function (exp: Explosion): void {
        if (!exp.explosionCenter || !exp.radii) return;
        const radiusPx = exp.radii[zoneName] * scale;
        circles.push({
            x: exp.explosionCenter.x,
            y: exp.explosionCenter.y,
            r: radiusPx
        });
    });

    const unionAreaPx = calculateCircleUnionAreaInclusion(circles);
    const kmPerPx = 1 / scale;
    const km2PerPx2 = kmPerPx * kmPerPx;
    return Math.round(unionAreaPx * km2PerPx2);
}

export function calculateCombinedArea(explosions: Explosion[], scale: number): number {
    return calculateCombinedAreaPerZone(explosions, scale, 'thermal');
}

export function calculateTotalAreaSum(explosions: Explosion[]): number {
    let total = 0;
    explosions.forEach(function (exp: Explosion): void {
        if (!exp.radii) return;
        total += calculateAffectedArea(exp.radii);
    });
    return total;
}

export function calculateOverlapArea(explosions: Explosion[], scale: number): number {
    const combined = calculateCombinedArea(explosions, scale);
    const sum = calculateTotalAreaSum(explosions);
    return Math.max(0, sum - combined);
}

export function calculateAllCombinedStats(explosions: Explosion[], scale: number): CombinedStats {
    const thermalCombined = calculateCombinedAreaPerZone(explosions, scale, 'thermal');
    const totalArea = calculateTotalAreaSum(explosions);
    return {
        count: explosions.filter(function (e: Explosion): boolean { return e.explosionCenter !== null; }).length,
        combinedArea: thermalCombined,
        totalArea: totalArea,
        overlapArea: Math.max(0, totalArea - thermalCombined),
        totalEnergy: calculateTotalEnergy(explosions),
        perZone: {
            fireball: calculateCombinedAreaPerZone(explosions, scale, 'fireball'),
            radiation: calculateCombinedAreaPerZone(explosions, scale, 'radiation'),
            severe: calculateCombinedAreaPerZone(explosions, scale, 'severe'),
            moderate: calculateCombinedAreaPerZone(explosions, scale, 'moderate'),
            light: calculateCombinedAreaPerZone(explosions, scale, 'light'),
            thermal: thermalCombined
        }
    };
}

export function mulberry32(seed: number): () => number {
    return function (): number {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function generateTerrainFeatures(width: number, height: number, presetName: string, elevationScale?: number, seed?: number): TerrainData {
    const preset = TERRAIN_PRESETS[presetName] || TERRAIN_PRESETS.flat;
    const rand = mulberry32(seed || Date.now() & 0xffffffff);
    const scale = (elevationScale !== undefined ? elevationScale : 1) * preset.elevationScale;

    const features: TerrainFeature[] = [];

    function addFeature(type: string, x: number, y: number, radius: number, h: number): void {
        features.push({
            type: type,
            x: x,
            y: y,
            radius: radius,
            height: h * scale,
            width: radius * 2,
            heightPx: h * scale
        });
    }

    for (let i = 0; i < preset.mountainCount; i++) {
        const x = width * (0.1 + rand() * 0.8);
        const y = height * (0.1 + rand() * 0.8);
        const radius = Math.min(width, height) * (0.06 + rand() * 0.1);
        const heightVal = 3000 + rand() * 5000;
        addFeature(TERRAIN_FEATURE_TYPES.MOUNTAIN, x, y, radius, heightVal);

        const subPeaks = 1 + Math.floor(rand() * 3);
        for (let j = 0; j < subPeaks; j++) {
            const ang = rand() * Math.PI * 2;
            const dist = radius * (0.6 + rand() * 0.8);
            addFeature(
                TERRAIN_FEATURE_TYPES.MOUNTAIN,
                x + Math.cos(ang) * dist,
                y + Math.sin(ang) * dist,
                radius * (0.35 + rand() * 0.35),
                1500 + rand() * 2500
            );
        }
    }

    for (let i = 0; i < preset.hillCount; i++) {
        const x = width * (0.05 + rand() * 0.9);
        const y = height * (0.05 + rand() * 0.9);
        const radius = Math.min(width, height) * (0.03 + rand() * 0.06);
        const heightVal = 300 + rand() * 800;
        addFeature(TERRAIN_FEATURE_TYPES.HILL, x, y, radius, heightVal);
    }

    for (let i = 0; i < preset.basinCount; i++) {
        const x = width * (0.1 + rand() * 0.8);
        const y = height * (0.1 + rand() * 0.8);
        const radius = Math.min(width, height) * (0.05 + rand() * 0.09);
        const depthVal = 200 + rand() * 600;
        addFeature(TERRAIN_FEATURE_TYPES.BASIN, x, y, radius, -depthVal);
    }

    return {
        features: features,
        width: width,
        height: height,
        scale: scale,
        presetName: presetName
    };
}

export function getElevationAt(x: number, y: number, terrain: TerrainData | null): number {
    if (!terrain || !terrain.features || terrain.features.length === 0) return 0;

    let elevation = 0;
    terrain.features.forEach(function (f: TerrainFeature): void {
        const dx = x - f.x;
        const dy = y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= f.radius * 2.5) return;

        const normDist = dist / f.radius;
        let factor: number = 0;

        if (f.type === TERRAIN_FEATURE_TYPES.MOUNTAIN) {
            if (normDist < 0.3) {
                factor = 1 - normDist * 0.5;
            } else if (normDist < 1) {
                factor = Math.cos((normDist - 0.3) / 0.7 * Math.PI / 2) * 0.95 + 0.05;
            } else if (normDist < 2.5) {
                factor = (1 - (normDist - 1) / 1.5) * 0.15;
            } else {
                factor = 0;
            }
        } else if (f.type === TERRAIN_FEATURE_TYPES.HILL) {
            if (normDist < 1) {
                factor = Math.cos(normDist * Math.PI / 2) * 0.9 + 0.1;
            } else if (normDist < 1.8) {
                factor = (1 - (normDist - 1) / 0.8) * 0.1;
            } else {
                factor = 0;
            }
        } else if (f.type === TERRAIN_FEATURE_TYPES.BASIN) {
            if (normDist < 0.2) {
                factor = 1;
            } else if (normDist < 1) {
                factor = Math.cos((normDist - 0.2) / 0.8 * Math.PI / 2);
            } else if (normDist < 2) {
                factor = (1 - (normDist - 1)) * 0.2;
            } else {
                factor = 0;
            }
        }

        elevation += f.heightPx * factor;
    });

    return elevation;
}

export function calculatePathAttenuation(fromX: number, fromY: number, toX: number, toY: number, terrain: TerrainData | null, zoneName: string, scale: number, burstHeightMeters?: number): PathAttenuationResult {
    if (!terrain || !terrain.features || terrain.features.length === 0) {
        return { attenuation: 1, maxObstacleHeight: 0, pathLengthKm: 0 };
    }

    const dx = toX - fromX;
    const dy = toY - fromY;
    const distPx = Math.sqrt(dx * dx + dy * dy);
    const distKm = distPx / scale;

    if (distKm < 0.1) {
        return { attenuation: 1, maxObstacleHeight: 0, pathLengthKm: distKm };
    }

    const samples = Math.max(8, Math.min(64, Math.floor(distPx / 10)));
    const altitudeSensitivity = getZoneAltitudeSensitivity();
    const sensitivity = altitudeSensitivity[zoneName] || 0.2;
    const burstHeight = burstHeightMeters || 0;

    let totalObstruction = 0;
    let maxHeightDiff = 0;

    for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const px = fromX + dx * t;
        const py = fromY + dy * t;
        const elev = getElevationAt(px, py, terrain);
        const currentDistKm = distKm * t;

        const lineOfSightHeight = burstHeight + ((elev > burstHeight ? 0 : 0) - burstHeight) * t;
        const heightDiff = elev - burstHeight;

        if (heightDiff > 0) {
            const shieldFactor = 1 - currentDistKm / Math.max(distKm, 0.5);
            const obstruction = (heightDiff / 500) * sensitivity * shieldFactor;
            totalObstruction += obstruction;
        }

        if (heightDiff > maxHeightDiff) {
            maxHeightDiff = heightDiff;
        }
    }

    const avgObstruction = totalObstruction / samples;
    let attenuation = 1 - avgObstruction;

    if (maxHeightDiff > 1500) {
        const majorBlock = (maxHeightDiff - 1500) / 4000 * sensitivity;
        attenuation -= majorBlock;
    }

    if (zoneName === 'radiation') {
        const radiationScatter = Math.max(0, maxHeightDiff / 3000) * 0.3;
        attenuation -= radiationScatter;
    }

    if (zoneName === 'thermal') {
        const thermalBlock = Math.max(0, maxHeightDiff / 2000) * 0.25;
        attenuation -= thermalBlock;
    }

    attenuation = Math.max(0.2, Math.min(1, attenuation));

    return {
        attenuation: attenuation,
        maxObstacleHeight: maxHeightDiff,
        pathLengthKm: distKm
    };
}

export function calculateEffectiveRadius(explosion: Explosion, targetX: number, targetY: number, zoneName: string, terrain: TerrainData | null, scale: number): number {
    const baseRadius = explosion.radii ? explosion.radii[zoneName] : 0;
    if (!explosion.explosionCenter || baseRadius <= 0) return 0;

    const fromX = explosion.explosionCenter.x;
    const fromY = explosion.explosionCenter.y;

    const result = calculatePathAttenuation(
        fromX, fromY, targetX, targetY,
        terrain, zoneName, scale, explosion.burstHeight
    );

    return baseRadius * result.attenuation;
}

export function generateTerrainBoundaryPolygon(explosion: Explosion, zoneName: string, terrain: TerrainData | null, scale: number, segments?: number): TerrainBoundaryPoint[] | null {
    if (!explosion.explosionCenter || !explosion.radii) return null;

    const segs = segments || 72;
    const baseRadius = explosion.radii[zoneName] * scale;
    const cx = explosion.explosionCenter.x;
    const cy = explosion.explosionCenter.y;

    const points: TerrainBoundaryPoint[] = [];
    for (let i = 0; i < segs; i++) {
        const angle = (i / segs) * Math.PI * 2;
        const targetX = cx + Math.cos(angle) * baseRadius;
        const targetY = cy + Math.sin(angle) * baseRadius;

        const attenuation = calculatePathAttenuation(
            cx, cy, targetX, targetY,
            terrain, zoneName, scale, explosion.burstHeight
        ).attenuation;

        const effectiveRadiusPx = baseRadius * attenuation;
        points.push({
            x: cx + Math.cos(angle) * effectiveRadiusPx,
            y: cy + Math.sin(angle) * effectiveRadiusPx,
            angle: angle,
            attenuation: attenuation
        });
    }

    return points;
}

export function checkPointInAnyZoneTerrainAware(point: { x: number; y: number }, explosions: Explosion[], terrain: TerrainData | null, scale: number): string | null {
    let worstZoneIndex = -1;
    let worstExplosionId: number | null = null;

    explosions.forEach(function (exp: Explosion): void {
        if (!exp.explosionCenter || !exp.radii) return;

        const dx = point.x - exp.explosionCenter.x;
        const dy = point.y - exp.explosionCenter.y;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distKm = distPx / scale;

        const zonePriority = getZonePriority();
        for (let i = 0; i < zonePriority.length; i++) {
            const zoneName = zonePriority[i];
            const effectiveRadius = calculateEffectiveRadius(exp, point.x, point.y, zoneName, terrain, scale);

            if (distKm <= effectiveRadius) {
                if (worstZoneIndex < 0 || i < worstZoneIndex) {
                    worstZoneIndex = i;
                    worstExplosionId = exp.id;
                }
                break;
            }
        }
    });

    const zonePriorityFinal = getZonePriority();
    return worstZoneIndex >= 0 ? zonePriorityFinal[worstZoneIndex] : null;
}

export function getWorstZoneForCityTerrain(city: City, explosions: Explosion[], scale: number, terrain: TerrainData | null): string | null {
    if (!terrain || !terrain.features || terrain.features.length === 0) {
        return getWorstZoneForCity(city, explosions, scale);
    }
    return checkPointInAnyZoneTerrainAware(city, explosions, terrain, scale);
}

export function calculateCasualtiesTerrainAware(cities: City[], explosions: Explosion[], scale: number, terrain: TerrainData | null): { deaths: number; injured: number } {
    let deaths = 0;
    let injured = 0;

    if (!explosions || explosions.length === 0 || !cities || cities.length === 0) {
        return { deaths: 0, injured: 0 };
    }

    const useTerrain = terrain && terrain.features && terrain.features.length > 0;

    cities.forEach(function (city: City): void {
        const worstZone = useTerrain
            ? checkPointInAnyZoneTerrainAware(city, explosions, terrain, scale)
            : getWorstZoneForCity(city, explosions, scale);
        if (!worstZone) return;

        const pop = city.population;
        const result = calculateCasualtiesForZone(pop, worstZone);
        deaths += result.deaths;
        injured += result.injured;
        if (result.destroyed) city.destroyed = true;
    });

    return {
        deaths: Math.round(deaths),
        injured: Math.round(injured)
    };
}

export function calculateShockwaveRadiusAtAngle(explosion: Explosion, angle: number, zoneKey: string, terrain: TerrainData | null, scale: number, baseRadiusPx: number): number {
    if (!terrain || !terrain.features || terrain.features.length === 0) {
        return baseRadiusPx;
    }
    if (!explosion.explosionCenter) return baseRadiusPx;

    const cx = explosion.explosionCenter.x;
    const cy = explosion.explosionCenter.y;
    const targetX = cx + Math.cos(angle) * baseRadiusPx;
    const targetY = cy + Math.sin(angle) * baseRadiusPx;

    const result = calculatePathAttenuation(
        cx, cy, targetX, targetY,
        terrain, zoneKey, scale, explosion.burstHeight
    );

    return baseRadiusPx * result.attenuation;
}

export const ROAD_BASE_CAPACITY: number = 2000;
export let VEHICLE_SPEED_KMH: number = 60;
export const PEOPLE_PER_VEHICLE: number = 3;

export function setVehicleSpeed(speed: number): void {
    VEHICLE_SPEED_KMH = speed;
}

export function buildEvacuationGraph(cities: City[], shelters: Shelter[], roads: Road[], capacityMultiplier?: number): EvacuationGraph {
    const capMult = capacityMultiplier !== undefined ? capacityMultiplier : 1;
    const nodes: EvacuationNode[] = [];
    const nodeMap: Record<string, number> = {};
    let nodeId = 0;

    cities.forEach(function (city: City, idx: number): void {
        const node: EvacuationNode = {
            id: nodeId,
            type: 'city',
            ref: city,
            refIndex: idx,
            x: city.x,
            y: city.y,
            population: city.population,
            edges: []
        };
        nodes.push(node);
        nodeMap['city_' + idx] = nodeId;
        nodeId++;
    });

    shelters.forEach(function (shelter: Shelter, idx: number): void {
        const node: EvacuationNode = {
            id: nodeId,
            type: 'shelter',
            ref: shelter,
            refIndex: idx,
            x: shelter.x,
            y: shelter.y,
            capacity: shelter.capacity,
            edges: []
        };
        nodes.push(node);
        nodeMap['shelter_' + idx] = nodeId;
        nodeId++;
    });

    roads.forEach(function (road: Road): void {
        const dx = road.x2 - road.x1;
        const dy = road.y2 - road.y1;
        const lengthPx = Math.sqrt(dx * dx + dy * dy);

        let node1Id: number | null = null, node2Id: number | null = null;
        nodes.forEach(function (node: EvacuationNode): void {
            const d1 = Math.sqrt(Math.pow(node.x - road.x1, 2) + Math.pow(node.y - road.y1, 2));
            const d2 = Math.sqrt(Math.pow(node.x - road.x2, 2) + Math.pow(node.y - road.y2, 2));
            if (d1 < 30) node1Id = node.id;
            if (d2 < 30) node2Id = node.id;
        });

        if (node1Id !== null && node2Id !== null) {
            const capacity = (road.capacity || ROAD_BASE_CAPACITY) * capMult;
            const lanes = road.lanes || 2;
            const edge1: EvacuationEdge = {
                from: node1Id,
                to: node2Id,
                lengthPx: lengthPx,
                capacity: capacity * lanes,
                lanes: lanes,
                flow: 0,
                density: 0
            };
            const edge2: EvacuationEdge = {
                from: node2Id,
                to: node1Id,
                lengthPx: lengthPx,
                capacity: capacity * lanes,
                lanes: lanes,
                flow: 0,
                density: 0
            };
            nodes[node1Id].edges.push(edge1);
            nodes[node2Id].edges.push(edge2);
        }
    });

    nodes.forEach(function (node: EvacuationNode, i: number): void {
        nodes.forEach(function (other: EvacuationNode, j: number): void {
            if (i === j) return;
            if (node.type !== 'city' || other.type !== 'city') return;

            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let hasEdge = false;
            node.edges.forEach(function (e: EvacuationEdge): void {
                if (e.to === other.id) hasEdge = true;
            });

            if (!hasEdge && dist < 200) {
                const capacity = ROAD_BASE_CAPACITY * 1.5 * capMult;
                node.edges.push({
                    from: node.id,
                    to: other.id,
                    lengthPx: dist,
                    capacity: capacity,
                    lanes: 2,
                    flow: 0,
                    density: 0
                });
            }
        });
    });

    return { nodes: nodes, nodeMap: nodeMap };
}

export function dijkstra(graph: EvacuationGraph, sourceId: number): { dist: Record<number, number>; prev: Record<number, { from: number; edge: EvacuationEdge } | null> } {
    const dist: Record<number, number> = {};
    const prev: Record<number, { from: number; edge: EvacuationEdge } | null> = {};
    const visited: Record<number, boolean> = {};
    const nodes = graph.nodes;

    nodes.forEach(function (node: EvacuationNode): void {
        dist[node.id] = Infinity;
        prev[node.id] = null;
        visited[node.id] = false;
    });
    dist[sourceId] = 0;

    while (true) {
        let minDist = Infinity;
        let currentId: number | null = null;

        nodes.forEach(function (node: EvacuationNode): void {
            if (!visited[node.id] && dist[node.id] < minDist) {
                minDist = dist[node.id];
                currentId = node.id;
            }
        });

        if (currentId === null) break;
        visited[currentId] = true;

        const currentNode = nodes[currentId];
        currentNode.edges.forEach(function (edge: EvacuationEdge): void {
            if (visited[edge.to]) return;
            const alt = dist[currentId!] + edge.lengthPx;
            if (alt < dist[edge.to]) {
                dist[edge.to] = alt;
                prev[edge.to] = { from: currentId!, edge: edge };
            }
        });
    }

    return { dist: dist, prev: prev };
}

export function findNearestShelter(graph: EvacuationGraph, cityNodeId: number): { shelterId: number | null; distancePx: number; path: EvacuationEdge[] | null } {
    const nodes = graph.nodes;
    let nearestShelterId: number | null = null;
    let minDist = Infinity;
    let shortestPath: EvacuationEdge[] | null = null;

    nodes.forEach(function (node: EvacuationNode): void {
        if (node.type !== 'shelter') return;

        const result = dijkstra(graph, cityNodeId);
        const d = result.dist[node.id];

        if (d < minDist) {
            minDist = d;
            nearestShelterId = node.id;

            const path: EvacuationEdge[] = [];
            let curr = node.id;
            while (result.prev[curr]) {
                path.unshift(result.prev[curr]!.edge);
                curr = result.prev[curr]!.from;
            }
            shortestPath = path;
        }
    });

    return {
        shelterId: nearestShelterId,
        distancePx: minDist,
        path: shortestPath
    };
}

export function calculateEvacuationPlan(cities: City[], shelters: Shelter[], roads: Road[], scale: number, warningTimeMinutes: number, roadCapacityMultiplier?: number, vehicleSpeedKmh?: number): EvacuationPlan {
    const capMult = roadCapacityMultiplier !== undefined ? roadCapacityMultiplier : 1;
    const vehSpeed = vehicleSpeedKmh !== undefined ? vehicleSpeedKmh : VEHICLE_SPEED_KMH;

    const graph = buildEvacuationGraph(cities, shelters, roads, capMult);
    const nodes = graph.nodes;
    const roadUsage: Record<string, { edge: EvacuationEdge; totalFlow: number; density: number }> = {};
    const cityPlans: CityPlan[] = [];
    let totalPopulation = 0;
    let totalEvacuated = 0;
    let totalStranded = 0;

    const warningTimeHours = warningTimeMinutes / 60;

    cities.forEach(function (city: City, cityIdx: number): void {
        const cityNodeId = graph.nodeMap['city_' + cityIdx];
        const cityNode = nodes[cityNodeId];
        totalPopulation += city.population;

        const nearest = findNearestShelter(graph, cityNodeId);

        if (!nearest.path || nearest.path.length === 0) {
            cityPlans.push({
                cityIndex: cityIdx,
                population: city.population,
                shelterId: null,
                distanceKm: 0,
                path: [],
                evacuated: 0,
                stranded: city.population,
                travelTimeHours: Infinity
            });
            totalStranded += city.population;
            return;
        }

        let totalLengthPx = 0;
        nearest.path.forEach(function (edge: EvacuationEdge): void {
            totalLengthPx += edge.lengthPx;
        });
        const distanceKm = totalLengthPx / scale;
        const travelTimeHours = distanceKm / vehSpeed;

        const canEvacuate = travelTimeHours <= warningTimeHours;

        let roadCapacityFactor = 1;
        let minCapacityRatio = 1;
        nearest.path.forEach(function (edge: EvacuationEdge): void {
            const capacityPerHour = edge.capacity * PEOPLE_PER_VEHICLE;
            const requiredFlow = city.population / travelTimeHours;
            const ratio = capacityPerHour / requiredFlow;
            if (ratio < minCapacityRatio) minCapacityRatio = ratio;
        });
        roadCapacityFactor = Math.min(1, minCapacityRatio);

        let evacuated: number;
        if (canEvacuate) {
            evacuated = Math.floor(city.population * Math.min(1, roadCapacityFactor * 0.8));
        } else {
            const timeRatio = warningTimeHours / travelTimeHours;
            evacuated = Math.floor(city.population * timeRatio * Math.min(1, roadCapacityFactor * 0.8));
        }
        const stranded = city.population - evacuated;

        nearest.path.forEach(function (edge: EvacuationEdge): void {
            const key = edge.from + '_' + edge.to;
            const reverseKey = edge.to + '_' + edge.from;
            if (!roadUsage[key]) {
                roadUsage[key] = {
                    edge: edge,
                    totalFlow: 0,
                    density: 0
                };
            }
            roadUsage[key].totalFlow += evacuated;
            roadUsage[key].density = roadUsage[key].totalFlow / (edge.capacity * PEOPLE_PER_VEHICLE);

            if (roadUsage[reverseKey]) {
                roadUsage[key].density += roadUsage[reverseKey].totalFlow / (edge.capacity * PEOPLE_PER_VEHICLE) * 0.3;
            }
        });

        totalEvacuated += evacuated;
        totalStranded += stranded;

        cityPlans.push({
            cityIndex: cityIdx,
            population: city.population,
            shelterId: nearest.shelterId,
            distanceKm: distanceKm,
            path: nearest.path,
            evacuated: evacuated,
            stranded: stranded,
            travelTimeHours: travelTimeHours,
            canEvacuate: canEvacuate
        });
    });

    const roadDensities: RoadDensity[] = [];
    Object.keys(roadUsage).forEach(function (key: string): void {
        const usage = roadUsage[key];
        roadDensities.push({
            edge: usage.edge,
            density: Math.min(2, usage.density),
            flow: usage.totalFlow
        });
    });

    return {
        graph: graph,
        cityPlans: cityPlans,
        roadDensities: roadDensities,
        totalPopulation: totalPopulation,
        totalEvacuated: totalEvacuated,
        totalStranded: totalStranded,
        evacuationRate: totalPopulation > 0 ? totalEvacuated / totalPopulation : 0,
        strandedRate: totalPopulation > 0 ? totalStranded / totalPopulation : 0
    };
}

export function generateShelters(width: number, height: number, count?: number): Shelter[] {
    const shelters: Shelter[] = [];
    const n = count || 3;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < n; i++) {
        const angle = (i / n) * Math.PI * 2 + Math.PI / 6;
        const dist = Math.min(width, height) * (0.35 + Math.random() * 0.1);
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;

        shelters.push({
            id: i,
            x: Math.max(50, Math.min(width - 50, x)),
            y: Math.max(50, Math.min(height - 50, y)),
            capacity: 500000 + Math.floor(Math.random() * 500000),
            name: '\u907f\u96be\u6240 #' + (i + 1)
        });
    }

    return shelters;
}

export function generateRoadNetwork(width: number, height: number, cities: City[], shelters: Shelter[]): Road[] {
    const roads: Road[] = [];
    const allNodes: { x: number; y: number; type: string; index: number }[] = [];

    cities.forEach(function (city: City, i: number): void {
        allNodes.push({ x: city.x, y: city.y, type: 'city', index: i });
    });

    shelters.forEach(function (shelter: Shelter, i: number): void {
        allNodes.push({ x: shelter.x, y: shelter.y, type: 'shelter', index: i });
    });

    for (let i = 0; i < allNodes.length; i++) {
        const distances: { index: number; dist: number }[] = [];
        for (let j = 0; j < allNodes.length; j++) {
            if (i === j) continue;
            const dx = allNodes[j].x - allNodes[i].x;
            const dy = allNodes[j].y - allNodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            distances.push({ index: j, dist: dist });
        }
        distances.sort(function (a: { index: number; dist: number }, b: { index: number; dist: number }): number { return a.dist - b.dist; });

        const connectCount = allNodes[i].type === 'shelter' ? 4 : 2;
        for (let k = 0; k < Math.min(connectCount, distances.length); k++) {
            const j = distances[k].index;
            if (j <= i) continue;

            let exists = false;
            roads.forEach(function (r: Road): void {
                if ((r.x1 === allNodes[i].x && r.y1 === allNodes[i].y && r.x2 === allNodes[j].x && r.y2 === allNodes[j].y) ||
                    (r.x2 === allNodes[i].x && r.y2 === allNodes[i].y && r.x1 === allNodes[j].x && r.y1 === allNodes[j].y)) {
                    exists = true;
                }
            });

            if (!exists) {
                const isShelterRoad = allNodes[i].type === 'shelter' || allNodes[j].type === 'shelter';
                roads.push({
                    x1: allNodes[i].x,
                    y1: allNodes[i].y,
                    x2: allNodes[j].x,
                    y2: allNodes[j].y,
                    capacity: isShelterRoad ? ROAD_BASE_CAPACITY * 2 : ROAD_BASE_CAPACITY,
                    lanes: isShelterRoad ? 4 : 2,
                    isShelterAccess: isShelterRoad
                });
            }
        }
    }

    return roads;
}
