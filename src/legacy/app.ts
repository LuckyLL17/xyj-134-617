import type {
  Explosion,
  AppState,
  City,
  Shelter,
  Road,
  TerrainData,
  TerrainPresetKey,
  BombTypeKey,
} from '../types';

interface DataElements {
  [key: string]: HTMLElement | HTMLSelectElement | null;
}

interface ControlElements {
  shelterCount: HTMLInputElement | null;
  warningTimeSlider: HTMLInputElement | null;
  roadCapacity: HTMLInputElement | null;
  vehicleSpeed: HTMLInputElement | null;
  evacuationPanel: HTMLElement | null;
  [key: string]: HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null;
}

interface AppStateExtended extends AppState {
  mapCtx: CanvasRenderingContext2D | null;
  effectCtx: CanvasRenderingContext2D | null;
  animationId: number | null;
  terrainPreset: TerrainPresetKey | string;
  terrainSeed: number;
  selectedShelterIndex: number | null;
  evacuationPlan: any;
  evacuationRoads: Road[];
}

(function () {
  'use strict';

  let explosionIdCounter: number = 0;

  function createExplosion(defaults?: Partial<Explosion>): Explosion {
    explosionIdCounter++;
    return Object.assign({
      id: explosionIdCounter,
      bombType: 'castle_bravo' as BombTypeKey,
      yieldKilotons: 15000,
      burstHeight: 1000,
      explosionCenter: null,
      radii: null
    }, defaults || {});
  }

  const state: AppStateExtended = {
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
    effectCtx: null,
    roads: [],
    animationProgress: 0,
    isDetonating: false,
    warningTime: 30,
    roadCapacity: 1,
    vehicleSpeed: 60,
  };

  function getSelectedExplosion(): Explosion | null {
    if (!state.selectedExplosionId) return null;
    return state.explosions.find(function (e: Explosion) { return e.id === state.selectedExplosionId; }) || null;
  }

  function getExplosionById(id: number): Explosion | null {
    return state.explosions.find(function (e: Explosion) { return e.id === id; }) || null;
  }

  let mapCanvas: HTMLCanvasElement,
      effectCanvas: HTMLCanvasElement,
      mapCtx: CanvasRenderingContext2D,
      effectCtx: CanvasRenderingContext2D,
      mapWrapper: HTMLElement,
      flashOverlay: HTMLElement,
      mapHint: HTMLElement;

  function initDomRefs(): void {
    mapCanvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
    effectCanvas = document.getElementById('effectCanvas') as HTMLCanvasElement;
    mapCtx = mapCanvas.getContext('2d') as CanvasRenderingContext2D;
    effectCtx = effectCanvas.getContext('2d') as CanvasRenderingContext2D;
    mapWrapper = document.getElementById('mapWrapper') as HTMLElement;
    flashOverlay = document.getElementById('flashOverlay') as HTMLElement;
    mapHint = document.getElementById('mapHint') as HTMLElement;
  }

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
    initDomRefs();
    const elements: ControlElements = window.UI.getControlElements();
    const dataElements: DataElements = window.DataDisplay.getElements();

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

  function initEvacuation(elements: ControlElements, width: number, height: number): void {
    const shelterCount: number = elements.shelterCount
      ? parseInt(elements.shelterCount.value, 10)
      : 3;

    state.shelters = window.Physics.generateShelters(width, height, shelterCount);
    state.evacuationRoads = window.Physics.generateRoadNetwork(width, height, state.cities, state.shelters);

    const warningTime: number = elements.warningTimeSlider
      ? parseInt(elements.warningTimeSlider.value, 10)
      : 30;

    const roadCapMultiplier: number = elements.roadCapacity
      ? parseFloat(elements.roadCapacity.value)
      : 1;

    const vehSpeed: number = elements.vehicleSpeed
      ? parseInt(elements.vehicleSpeed.value, 10)
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
      elements.evacuationPanel.classList.toggle('hidden', !state.evacuationEnabled);
    }
  }

  function bootstrap(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  window.App = {
    createExplosion: createExplosion,
    getSelectedExplosion: getSelectedExplosion,
    getExplosionById: getExplosionById,
    regenerateTerrain: regenerateTerrain,
    get state() { return state; },
    bootstrap: bootstrap,
    init: init
  };
})();
