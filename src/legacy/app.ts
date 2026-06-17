import type {
    Explosion,
    AppState,
    UIElements,
    DataDisplayElements
} from '../types';

(function (): void {
    'use strict';

    let explosionIdCounter: number = 0;

    function createExplosion(defaults?: Partial<Explosion>): Explosion {
        explosionIdCounter++;
        return Object.assign({
            id: explosionIdCounter,
            bombType: 'castle_bravo',
            yieldKilotons: 15000,
            burstHeight: 1000,
            explosionCenter: null,
            radii: null
        }, defaults || {});
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
    };

    function getSelectedExplosion(): Explosion | null {
        if (!state.selectedExplosionId) return null;
        return state.explosions.find(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; }) || null;
    }

    function getExplosionById(id: number): Explosion | null {
        return state.explosions.find(function (e: Explosion): boolean { return e.id === id; }) || null;
    }

    const mapCanvas: HTMLCanvasElement = document.getElementById('mapCanvas') as HTMLCanvasElement;
    const effectCanvas: HTMLCanvasElement = document.getElementById('effectCanvas') as HTMLCanvasElement;
    const mapCtx: CanvasRenderingContext2D = mapCanvas.getContext('2d') as CanvasRenderingContext2D;
    const effectCtx: CanvasRenderingContext2D = effectCanvas.getContext('2d') as CanvasRenderingContext2D;
    const mapWrapper: HTMLElement = document.getElementById('mapWrapper') as HTMLElement;
    const flashOverlay: HTMLElement = document.getElementById('flashOverlay') as HTMLElement;
    const mapHint: HTMLElement = document.getElementById('mapHint') as HTMLElement;

    function regenerateTerrain(): void {
        const rect: DOMRect = mapWrapper.getBoundingClientRect();
        if (state.terrainEnabled) {
            state.terrainData = window.Physics.generateTerrainFeatures(
                rect.width, rect.height,
                state.terrainPreset,
                state.terrainIntensity,
                state.terrainSeed
            );
        } else {
            state.terrainData = window.Physics.generateTerrainFeatures(
                rect.width, rect.height,
                'flat', 0, state.terrainSeed
            );
        }
    }

    function init(): void {
        const elements: UIElements = window.UI.getControlElements();
        const dataElements: DataDisplayElements = window.DataDisplay.getElements();

        state.mapCtx = mapCtx;
        state.effectCtx = effectCtx;

        window.Renderer.setupCanvas(mapCanvas, effectCanvas, mapCtx, effectCtx, mapWrapper, state);
        window.UI.setupEventListeners(elements, dataElements, state, mapCanvas, mapCtx, effectCtx, effectCanvas, mapWrapper, flashOverlay, mapHint);

        const rect: DOMRect = mapWrapper.getBoundingClientRect();

        regenerateTerrain();

        const firstExplosion: Explosion = createExplosion({
            explosionCenter: {
                x: rect.width / 2,
                y: rect.height / 2
            }
        });
        firstExplosion.radii = window.Physics.calculateRadii(firstExplosion.yieldKilotons, firstExplosion.burstHeight);
        state.explosions.push(firstExplosion);
        state.selectedExplosionId = firstExplosion.id;

        mapHint.classList.add('hidden');

        window.UI.refreshExplosionList(state, elements);
        window.UI.syncControlsFromSelected(state, elements);
        window.UI.syncTerrainControlsFromState(state, elements);
        window.UI.updateAllCalculations(state);
        window.DataDisplay.updateDataDisplay(dataElements, state);
        window.DataDisplay.populateBuildingCitySelect(elements, state.cities);

        initEvacuation(elements, rect.width, rect.height);

        window.Renderer.drawMap(mapCtx, mapWrapper, state);
    }

    function initEvacuation(elements: UIElements, width: number, height: number): void {
        const shelterCount: number = elements.shelterCount
            ? parseInt((elements.shelterCount as HTMLInputElement).value, 10)
            : 3;

        state.shelters = window.Physics.generateShelters(width, height, shelterCount);
        state.evacuationRoads = window.Physics.generateRoadNetwork(width, height, state.cities, state.shelters);

        const warningTime: number = elements.warningTimeSlider
            ? parseInt((elements.warningTimeSlider as HTMLInputElement).value, 10)
            : 30;

        const roadCapMultiplier: number = elements.roadCapacity
            ? parseFloat((elements.roadCapacity as HTMLInputElement).value)
            : 1;

        const vehSpeed: number = elements.vehicleSpeed
            ? parseInt((elements.vehicleSpeed as HTMLInputElement).value, 10)
            : 60;

        state.evacuationPlan = window.Physics.calculateEvacuationPlan(
            state.cities,
            state.shelters,
            state.evacuationRoads,
            state.scale,
            warningTime,
            roadCapMultiplier,
            vehSpeed
        );

        window.UI.updateEvacuationDisplay(state, elements);

        if (elements.evacuationPanel) {
            (elements.evacuationPanel as HTMLElement).classList.toggle('hidden', !state.evacuationEnabled);
        }
    }

    window.App = {
        createExplosion: createExplosion,
        getSelectedExplosion: getSelectedExplosion,
        getExplosionById: getExplosionById,
        regenerateTerrain: regenerateTerrain,
        get state(): AppState { return state; }
    };

    document.addEventListener('DOMContentLoaded', init);
})();
