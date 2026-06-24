import type {
  Explosion,
  AppState,
  City,
  BombTypeKey,
  BombType,
  ZoneDef,
  Shelter,
  Point,
  TerrainFeatureType,
  BuildingTypeKey,
  DamageLevelKey,
  BuildingType,
  DamageLevel,
  CityBuildingDamageResult,
  AllCitiesBuildingDamageResult,
  CasualtyResult,
  CombinedStats
} from '../types';

interface DataElements {
  estimatedDeaths: HTMLElement | null;
  estimatedInjured: HTMLElement | null;
  affectedArea: HTMLElement | null;
  energyReleased: HTMLElement | null;
  statExplosionCount: HTMLElement | null;
  statCombinedArea: HTMLElement | null;
  statTotalArea: HTMLElement | null;
  statOverlapArea: HTMLElement | null;
  buildingTotalPop: HTMLElement | null;
  buildingDestroyedPop: HTMLElement | null;
  buildingAvgStrength: HTMLElement | null;
  buildingSurvivalRate: HTMLElement | null;
  maxOverpressure: HTMLElement | null;
  overpressureBar: HTMLElement | null;
  buildingTypeList: HTMLElement | null;
  damageBarChart: HTMLElement | null;
  damageStatsList: HTMLElement | null;
  buildingCitySelect: HTMLSelectElement | null;
  buildingSummaryView: HTMLElement | null;
  buildingByTypeView: HTMLElement | null;
  buildingByDamageView: HTMLElement | null;
  dataPanels: HTMLElement | null;
  legendItems: HTMLElement | null;
  [key: string]: HTMLElement | HTMLSelectElement | null;
}

interface ControlElements {
  bombType: HTMLSelectElement;
  yieldSlider: HTMLInputElement;
  yieldValue: HTMLElement;
  burstHeight: HTMLInputElement;
  scaleSlider: HTMLInputElement;
  scaleValue: HTMLElement;
  showLabels: HTMLInputElement;
  showLegend: HTMLInputElement;
  legend: HTMLElement;
  detonateBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  explosionList: HTMLElement;
  addExplosionBtn: HTMLButtonElement;
  removeExplosionBtn: HTMLButtonElement;
  explosionCount: HTMLElement;
  paramTarget: HTMLElement;
  statExplosionCount: HTMLElement;
  statCombinedArea: HTMLElement;
  statTotalArea: HTMLElement;
  statOverlapArea: HTMLElement;
  terrainEnabled: HTMLInputElement | null;
  terrainPreset: HTMLSelectElement | null;
  terrainIntensity: HTMLInputElement | null;
  terrainIntensityValue: HTMLElement | null;
  showTerrainHeatmap: HTMLInputElement | null;
  showTerrainContours: HTMLInputElement | null;
  regenerateTerrainBtn: HTMLButtonElement | null;
  mountainCount: HTMLElement | null;
  hillCount: HTMLElement | null;
  basinCount: HTMLElement | null;
  maxElevation: HTMLElement | null;
  evacuationEnabled: HTMLInputElement | null;
  shelterCount: HTMLInputElement | null;
  warningTimeSlider: HTMLInputElement | null;
  warningTimeValue: HTMLElement | null;
  roadCapacity: HTMLInputElement | null;
  vehicleSpeed: HTMLInputElement | null;
  recalcEvacBtn: HTMLButtonElement | null;
  addShelterBtn: HTMLButtonElement | null;
  evacStartBtn: HTMLButtonElement | null;
  evacPauseBtn: HTMLButtonElement | null;
  evacResetBtn: HTMLButtonElement | null;
  evacSpeed: HTMLInputElement | null;
  evacTotalPop: HTMLElement | null;
  evacEvacuated: HTMLElement | null;
  evacStranded: HTMLElement | null;
  evacRate: HTMLElement | null;
  evacProgress: HTMLElement | null;
  evacProgressFill: HTMLElement | null;
  evacTime: HTMLElement | null;
  evacWarningTime: HTMLElement | null;
  evacModeBadge: HTMLElement | null;
  evacuationPanel: HTMLElement | null;
  buildingTotalPop: HTMLElement | null;
  buildingDestroyedPop: HTMLElement | null;
  buildingAvgStrength: HTMLElement | null;
  buildingSurvivalRate: HTMLElement | null;
  maxOverpressure: HTMLElement | null;
  overpressureBar: HTMLElement | null;
  buildingTypeList: HTMLElement | null;
  damageBarChart: HTMLElement | null;
  damageStatsList: HTMLElement | null;
  buildingCitySelect: HTMLSelectElement | null;
  buildingSummaryView: HTMLElement | null;
  buildingByTypeView: HTMLElement | null;
  buildingByDamageView: HTMLElement | null;
  buildingPanel: HTMLElement | null;
  addZoneBtn: HTMLButtonElement | null;
  resetZonesBtn: HTMLButtonElement | null;
  zoneList: HTMLElement | null;
  zoneEditorModal: HTMLElement | null;
  zoneEditorOverlay: HTMLElement | null;
  zoneEditorClose: HTMLElement | null;
  zoneEditorCancel: HTMLElement | null;
  zoneEditorSave: HTMLButtonElement | null;
  zoneEditorTitle: HTMLElement | null;
  zoneKey: HTMLInputElement | null;
  zoneLabel: HTMLInputElement | null;
  zoneColor: HTMLInputElement | null;
  zoneColorText: HTMLInputElement | null;
  zoneDescription: HTMLInputElement | null;
  zoneMinRadius: HTMLInputElement | null;
  zoneRadiusFormula: HTMLInputElement | null;
  zoneHeightFactor: HTMLSelectElement | null;
  zoneDash: HTMLSelectElement | null;
  zoneOverpressure: HTMLInputElement | null;
  zoneAltitudeSens: HTMLInputElement | null;
  zoneAltitudeSensValue: HTMLElement | null;
  zoneDestroyed: HTMLInputElement | null;
  zoneDeathRate: HTMLInputElement | null;
  zoneDeathRateValue: HTMLElement | null;
  zoneInjuryRate: HTMLInputElement | null;
  zoneInjuryRateValue: HTMLElement | null;
  [key: string]: HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null;
}

(function (global: Window & typeof globalThis): void {
  'use strict';

  const BOMB_TYPES: Record<BombTypeKey, BombType> = global.Physics.BOMB_TYPES;

  const controlElementIds: string[] = [
    'bombType', 'yieldSlider', 'yieldValue', 'burstHeight',
    'scaleSlider', 'scaleValue', 'showLabels', 'showLegend',
    'legend', 'detonateBtn', 'resetBtn',
    'explosionList', 'addExplosionBtn', 'removeExplosionBtn',
    'explosionCount', 'paramTarget',
    'statExplosionCount', 'statCombinedArea', 'statTotalArea', 'statOverlapArea',
    'terrainEnabled', 'terrainPreset', 'terrainIntensity', 'terrainIntensityValue',
    'showTerrainHeatmap', 'showTerrainContours', 'regenerateTerrainBtn',
    'mountainCount', 'hillCount', 'basinCount', 'maxElevation',
    'evacuationEnabled', 'shelterCount', 'warningTimeSlider', 'warningTimeValue',
    'roadCapacity', 'vehicleSpeed', 'recalcEvacBtn', 'addShelterBtn',
    'evacStartBtn', 'evacPauseBtn', 'evacResetBtn', 'evacSpeed',
    'evacTotalPop', 'evacEvacuated', 'evacStranded', 'evacRate',
    'evacProgress', 'evacProgressFill', 'evacTime', 'evacWarningTime',
    'evacModeBadge', 'evacuationPanel',
    'buildingTotalPop', 'buildingDestroyedPop', 'buildingAvgStrength',
    'buildingSurvivalRate', 'maxOverpressure', 'overpressureBar',
    'buildingTypeList', 'damageBarChart', 'damageStatsList',
    'buildingCitySelect', 'buildingSummaryView', 'buildingByTypeView', 'buildingByDamageView',
    'buildingPanel',
    'addZoneBtn', 'resetZonesBtn', 'zoneList',
    'zoneEditorModal', 'zoneEditorOverlay', 'zoneEditorClose',
    'zoneEditorCancel', 'zoneEditorSave', 'zoneEditorTitle',
    'zoneKey', 'zoneLabel', 'zoneColor', 'zoneColorText',
    'zoneDescription', 'zoneMinRadius', 'zoneRadiusFormula',
    'zoneHeightFactor', 'zoneDash', 'zoneOverpressure',
    'zoneAltitudeSens', 'zoneAltitudeSensValue',
    'zoneDestroyed', 'zoneDeathRate', 'zoneDeathRateValue',
    'zoneInjuryRate', 'zoneInjuryRateValue'
  ];

  function getControlElements(): ControlElements {
    const elements: Partial<ControlElements> = {};
    controlElementIds.forEach(function (id: string): void {
      (elements as Record<string, HTMLElement | null>)[id] = document.getElementById(id);
    });
    return elements as ControlElements;
  }

  function getSelectedExplosion(state: AppState): Explosion | null {
    if (!state.selectedExplosionId) return null;
    return state.explosions.find(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; }) || null;
  }

  function updateCalculationsForExplosion(explosion: Explosion | null): void {
    if (!explosion) return;
    explosion.radii = global.Physics.calculateRadii(explosion.yieldKilotons, explosion.burstHeight);
  }

  function updateAllCalculations(state: AppState): void {
    state.explosions.forEach(updateCalculationsForExplosion);
  }

  function getBombTypeName(bombType: string, yieldKilotons: number): string {
    if (bombType === 'custom') return '自定义 ' + yieldKilotons.toLocaleString() + 'kt';
    const bomb: BombType | undefined = BOMB_TYPES[bombType as BombTypeKey];
    return bomb ? bomb.name : '自定义';
  }

  function refreshExplosionList(state: AppState, elements: ControlElements): void {
    const list: HTMLElement = elements.explosionList;
    list.innerHTML = '';

    if (state.explosions.length === 0) {
      const tip: HTMLDivElement = document.createElement('div');
      tip.className = 'empty-list-tip';
      tip.textContent = '点击「添加爆炸点」开始';
      list.appendChild(tip);
    } else {
      state.explosions.forEach(function (exp: Explosion, index: number): void {
        const item: HTMLDivElement = document.createElement('div');
        item.className = 'explosion-item' + (exp.id === state.selectedExplosionId ? ' active' : '');
        item.dataset.id = String(exp.id);

        const left: HTMLDivElement = document.createElement('div');
        left.className = 'explosion-item-left';

        const num: HTMLDivElement = document.createElement('div');
        num.className = 'explosion-number';
        num.textContent = String(index + 1);

        const meta: HTMLDivElement = document.createElement('div');
        meta.className = 'explosion-meta';
        const title: HTMLDivElement = document.createElement('div');
        title.className = 'explosion-title';
        title.textContent = '爆炸点 #' + (index + 1);
        const sub: HTMLDivElement = document.createElement('div');
        sub.className = 'explosion-sub';
        sub.textContent = getBombTypeName(exp.bombType, exp.yieldKilotons) + ' · ' + exp.burstHeight + 'm';
        meta.appendChild(title);
        meta.appendChild(sub);

        left.appendChild(num);
        left.appendChild(meta);

        const indicator: HTMLDivElement = document.createElement('div');
        indicator.className = 'explosion-position-indicator ' + (exp.explosionCenter ? 'set' : 'unset');
        indicator.title = exp.explosionCenter ? '位置已设置' : '位置未设置';

        item.appendChild(left);
        item.appendChild(indicator);

        item.addEventListener('click', function (): void {
          selectExplosion(state, exp.id, elements);
        });

        list.appendChild(item);
      });
    }

    elements.explosionCount.textContent = String(state.explosions.length);
    updateParamTargetLabel(state, elements);
  }

  function updateParamTargetLabel(state: AppState, elements: ControlElements): void {
    const index: number = state.explosions.findIndex(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; });
    if (index >= 0) {
      elements.paramTarget.textContent = '（爆炸点 #' + (index + 1) + '）';
    } else {
      elements.paramTarget.textContent = '（无选中）';
    }
  }

  function syncControlsFromSelected(state: AppState, elements: ControlElements): void {
    const selected: Explosion | null = getSelectedExplosion(state);
    if (!selected) return;

    elements.bombType.value = selected.bombType;
    elements.yieldSlider.value = String(selected.yieldKilotons);
    elements.yieldValue.textContent = selected.yieldKilotons.toLocaleString();
    elements.burstHeight.value = String(selected.burstHeight);
  }

  function syncTerrainControlsFromState(state: AppState & { terrainPreset?: string; terrainSeed?: number }, elements: ControlElements): void {
    if (elements.terrainEnabled) elements.terrainEnabled.checked = state.terrainEnabled;
    if (elements.terrainPreset && state.terrainPreset) elements.terrainPreset.value = state.terrainPreset;
    if (elements.terrainIntensity) elements.terrainIntensity.value = String(state.terrainIntensity);
    if (elements.terrainIntensityValue) elements.terrainIntensityValue.textContent = state.terrainIntensity.toFixed(1);
    if (elements.showTerrainHeatmap) elements.showTerrainHeatmap.checked = state.showTerrainHeatmap;
    if (elements.showTerrainContours) elements.showTerrainContours.checked = state.showTerrainContours;
    updateTerrainInfo(state, elements);
  }

  function syncStateFromTerrainControls(state: AppState & { terrainPreset?: string; terrainSeed?: number }, elements: ControlElements): void {
    if (elements.terrainEnabled) state.terrainEnabled = elements.terrainEnabled.checked;
    if (elements.terrainPreset) state.terrainPreset = elements.terrainPreset.value;
    if (elements.terrainIntensity) state.terrainIntensity = parseFloat(elements.terrainIntensity.value);
    if (elements.showTerrainHeatmap) state.showTerrainHeatmap = elements.showTerrainHeatmap.checked;
    if (elements.showTerrainContours) state.showTerrainContours = elements.showTerrainContours.checked;
  }

  function updateTerrainInfo(state: AppState & { terrainPreset?: string }, elements: ControlElements): void {
    if (!state.terrainData || !state.terrainData.features) {
      if (elements.mountainCount) elements.mountainCount.textContent = '0';
      if (elements.hillCount) elements.hillCount.textContent = '0';
      if (elements.basinCount) elements.basinCount.textContent = '0';
      if (elements.maxElevation) elements.maxElevation.textContent = '0';
      return;
    }

    const FEATURE_TYPES: Record<string, TerrainFeatureType> = global.Physics.TERRAIN_FEATURE_TYPES;
    let mountainCount: number = 0, hillCount: number = 0, basinCount: number = 0, maxElev: number = 0;

    state.terrainData.features.forEach(function (f: any): void {
      if (f.type === FEATURE_TYPES.MOUNTAIN) mountainCount++;
      else if (f.type === FEATURE_TYPES.HILL) hillCount++;
      else if (f.type === FEATURE_TYPES.BASIN) basinCount++;
      if (f.heightPx > maxElev) maxElev = f.heightPx;
    });

    if (elements.mountainCount) elements.mountainCount.textContent = String(mountainCount);
    if (elements.hillCount) elements.hillCount.textContent = String(hillCount);
    if (elements.basinCount) elements.basinCount.textContent = String(basinCount);
    if (elements.maxElevation) elements.maxElevation.textContent = Math.round(maxElev).toLocaleString();
  }

  function regenerateTerrain(
    state: AppState & { terrainPreset?: string; terrainSeed?: number },
    elements: ControlElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    dataElements: any,
    forceNewSeed: boolean
  ): void {
    if (forceNewSeed) {
      state.terrainSeed = Math.floor(Math.random() * 100000);
    }
    global.App.regenerateTerrain();
    updateTerrainInfo(state, elements);
    global.DataDisplay.updateDataDisplay(dataElements, state);
    global.Renderer.drawMap(mapCtx, mapWrapper, state);
  }

  function syncSelectedFromControls(state: AppState, elements: ControlElements): void {
    const selected: Explosion | null = getSelectedExplosion(state);
    if (!selected) return;

    selected.bombType = elements.bombType.value as BombTypeKey;
    selected.yieldKilotons = parseInt(elements.yieldSlider.value, 10);
    selected.burstHeight = parseInt(elements.burstHeight.value, 10);
  }

  function selectExplosion(state: AppState, id: number, elements: ControlElements): void {
    state.selectedExplosionId = id;
    syncControlsFromSelected(state, elements);
    refreshExplosionList(state, elements);
  }

  function addExplosion(state: AppState, elements: ControlElements, mapWrapper: HTMLElement, position?: Point): Explosion {
    const rect: DOMRect = mapWrapper.getBoundingClientRect();
    let center: Point;
    if (position) {
      center = position;
    } else {
      center = {
        x: rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.4,
        y: rect.height / 2 + (Math.random() - 0.5) * rect.height * 0.4
      };
    }
    const newExp: Explosion = global.App.createExplosion({
      explosionCenter: center
    });
    updateCalculationsForExplosion(newExp);
    state.explosions.push(newExp);
    state.selectedExplosionId = newExp.id;
    syncControlsFromSelected(state, elements);
    refreshExplosionList(state, elements);
    return newExp;
  }

  function findNearestExplosion(x: number, y: number, state: AppState, thresholdPx: number): Explosion | null {
    let nearest: Explosion | null = null;
    let nearestDist: number = Infinity;
    state.explosions.forEach(function (exp: Explosion): void {
      if (!exp.explosionCenter) return;
      const dx: number = x - exp.explosionCenter.x;
      const dy: number = y - exp.explosionCenter.y;
      const dist: number = Math.sqrt(dx * dx + dy * dy);
      if (dist < thresholdPx && dist < nearestDist) {
        nearestDist = dist;
        nearest = exp;
      }
    });
    return nearest;
  }

  function removeSelectedExplosion(state: AppState, elements: ControlElements): void {
    if (state.explosions.length <= 1) {
      alert('至少需要保留 1 个爆炸点');
      return;
    }
    const index: number = state.explosions.findIndex(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; });
    if (index < 0) return;

    state.explosions.splice(index, 1);
    const newSelected: Explosion | undefined = state.explosions[Math.max(0, index - 1)];
    state.selectedExplosionId = newSelected ? newSelected.id : null;
    syncControlsFromSelected(state, elements);
    refreshExplosionList(state, elements);
  }

  function handleCanvasClick(
    e: MouseEvent,
    mapCanvas: HTMLCanvasElement,
    state: AppState,
    mapHint: HTMLElement,
    dataElements: any,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    elements: ControlElements
  ): void {
    if (state.isAnimating) return;

    const rect: DOMRect = mapCanvas.getBoundingClientRect();
    const x: number = e.clientX - rect.left;
    const y: number = e.clientY - rect.top;

    if (e.shiftKey) {
      const newExp: Explosion = addExplosion(state, elements, mapWrapper, { x: x, y: y });
      mapHint.classList.add('hidden');
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
      return;
    }

    const SELECT_THRESHOLD: number = 24;
    const nearest: Explosion | null = findNearestExplosion(x, y, state, SELECT_THRESHOLD);
    if (nearest) {
      selectExplosion(state, nearest.id, elements);
    } else {
      const selected: Explosion | null = getSelectedExplosion(state);
      if (!selected) {
        const firstWithPos: Explosion | undefined = state.explosions.find(function (e: Explosion): boolean { return !!e.explosionCenter; });
        if (firstWithPos) {
          selectExplosion(state, firstWithPos.id, elements);
        } else {
          alert('请先选中一个爆炸点');
          return;
        }
      }
      const currentSelected: Explosion | null = getSelectedExplosion(state);
      if (currentSelected) {
        currentSelected.explosionCenter = { x: x, y: y };
      }
      mapHint.classList.add('hidden');
      updateCalculationsForExplosion(currentSelected);
      refreshExplosionList(state, elements);
    }

    global.DataDisplay.updateDataDisplay(dataElements, state);
    global.Renderer.drawMap(mapCtx, mapWrapper, state);
  }

  function triggerDetonate(
    state: AppState,
    elements: ControlElements,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement,
    mapWrapper: HTMLElement,
    flashOverlay: HTMLElement
  ): void {
    const positionedExplosions: Explosion[] = state.explosions.filter(function (e: Explosion): boolean { return !!e.explosionCenter; });
    if (positionedExplosions.length === 0) {
      alert('请至少为一个爆炸点设置位置');
      return;
    }

    if (global.Timeline && global.Timeline.isActive()) {
      global.Timeline.stop();
    }

    global.Animation.animateExplosion(effectCtx, effectCanvas, mapWrapper, state, elements, flashOverlay);
  }

  function resetAll(
    state: AppState & { terrainPreset?: string; terrainSeed?: number; animationId?: number | null },
    elements: ControlElements,
    dataElements: any,
    effectCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    flashOverlay: HTMLElement,
    mapHint: HTMLElement,
    mapCtx: CanvasRenderingContext2D
  ): void {
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
    }

    if (global.Timeline && global.Timeline.isActive()) {
      global.Timeline.stop();
    }

    state.isAnimating = false;
    state.animationId = null;
    state.explosions = [];
    state.selectedExplosionId = null;

    elements.detonateBtn.disabled = false;
    flashOverlay.classList.remove('active');
    mapHint.classList.remove('hidden');

    const rect: DOMRect = mapWrapper.getBoundingClientRect();
    effectCtx.clearRect(0, 0, rect.width, rect.height);

    state.cities.forEach(function (city: City): void { city.destroyed = false; });

    state.terrainSeed = Math.floor(Math.random() * 100000);
    syncStateFromTerrainControls(state, elements);
    global.App.regenerateTerrain();
    updateTerrainInfo(state, elements);

    const firstExp: Explosion = global.App.createExplosion({
      explosionCenter: {
        x: rect.width / 2,
        y: rect.height / 2
      }
    });
    updateCalculationsForExplosion(firstExp);
    state.explosions.push(firstExp);
    state.selectedExplosionId = firstExp.id;

    mapHint.classList.add('hidden');
    syncControlsFromSelected(state, elements);
    syncTerrainControlsFromState(state, elements);
    refreshExplosionList(state, elements);
    updateAllCalculations(state);
    global.DataDisplay.updateDataDisplay(dataElements, state);
    global.Renderer.drawMap(mapCtx, mapWrapper, state);
  }

  function handleViewToggle(view: string, state: AppState, elements: ControlElements, dataElements: any): void {
    (state as any).viewMode = view;
    document.querySelectorAll('.toggle-btn').forEach(function (btn: Element): void {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
    });
    const combinedStats: HTMLElement | null = document.getElementById('combinedStats');
    if (combinedStats) {
      combinedStats.style.display = view === 'combined' ? 'block' : 'none';
    }
    global.DataDisplay.updateDataDisplay(dataElements, state);
  }

  function handleBuildingViewToggle(view: string, state: AppState, elements: ControlElements): void {
    (state as any).buildingViewMode = view;
    document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element): void {
      btn.classList.toggle('active', (btn as HTMLElement).dataset.buildingView === view);
    });

    if (elements.buildingSummaryView) {
      elements.buildingSummaryView.style.display = view === 'summary' ? 'block' : 'none';
    }
    if (elements.buildingByTypeView) {
      elements.buildingByTypeView.style.display = view === 'byType' ? 'block' : 'none';
    }
    if (elements.buildingByDamageView) {
      elements.buildingByDamageView.style.display = view === 'byDamage' ? 'block' : 'none';
    }
  }

  function recalculateEvacuation(
    state: AppState & { selectedShelterIndex?: number | null; evacuationRoads?: any[]; evacuationPlan?: any },
    elements: ControlElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ): void {
    if (!state.evacuationEnabled || !state.shelters || state.shelters.length === 0) {
      state.evacuationPlan = null;
      return;
    }

    const roads: any[] = global.Physics.generateRoadNetwork(
      mapWrapper.clientWidth,
      mapWrapper.clientHeight,
      state.cities,
      state.shelters
    );
    state.evacuationRoads = roads;

    const capacityMultiplier: number = parseFloat(elements.roadCapacity ? elements.roadCapacity.value : '1');
    const adjustedRoads: any[] = roads.map(function (road: any): any {
      return {
        ...road,
        capacity: road.capacity * capacityMultiplier
      };
    });

    const warningTime: number = parseInt(elements.warningTimeSlider ? elements.warningTimeSlider.value : '30', 10);

    const originalSpeed: number = global.Physics.VEHICLE_SPEED_KMH;
    const customSpeed: number = parseInt(elements.vehicleSpeed ? elements.vehicleSpeed.value : '60', 10);
    global.Physics.VEHICLE_SPEED_KMH = customSpeed;

    state.evacuationPlan = global.Physics.calculateEvacuationPlan(
      state.cities,
      state.shelters,
      adjustedRoads,
      state.scale,
      warningTime
    );

    global.Physics.VEHICLE_SPEED_KMH = originalSpeed;

    updateEvacuationDisplay(state, elements);
  }

  function updateEvacuationDisplay(
    state: AppState & { selectedShelterIndex?: number | null; evacuationPlan?: any },
    elements: ControlElements
  ): void {
    const plan: any = state.evacuationPlan;
    if (!plan) {
      if (elements.evacTotalPop) elements.evacTotalPop.textContent = '0';
      if (elements.evacEvacuated) elements.evacEvacuated.textContent = '0';
      if (elements.evacStranded) elements.evacStranded.textContent = '0';
      if (elements.evacRate) elements.evacRate.textContent = '0%';
      if (elements.evacProgress) elements.evacProgress.textContent = '0%';
      if (elements.evacProgressFill) elements.evacProgressFill.style.width = '0%';
      if (elements.evacTime) elements.evacTime.textContent = '0.0 小时';
      return;
    }

    if (elements.evacTotalPop) {
      elements.evacTotalPop.textContent = formatNumberShort(plan.totalPopulation);
    }
    if (elements.evacEvacuated) {
      elements.evacEvacuated.textContent = formatNumberShort(plan.totalEvacuated);
    }
    if (elements.evacStranded) {
      elements.evacStranded.textContent = formatNumberShort(plan.totalStranded);
    }
    if (elements.evacRate) {
      const rate: number = plan.evacuationRate * 100;
      if (rate < 0.1) {
        elements.evacRate.textContent = '<0.1%';
      } else if (rate < 1) {
        elements.evacRate.textContent = rate.toFixed(1) + '%';
      } else {
        elements.evacRate.textContent = Math.round(rate) + '%';
      }
    }

    const warningTime: number = parseInt(elements.warningTimeSlider ? elements.warningTimeSlider.value : '30', 10);
    if (elements.evacWarningTime) {
      elements.evacWarningTime.textContent = warningTime + ' 分钟';
    }
  }

  function formatNumberShort(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
  }

  function findNearestShelter(x: number, y: number, state: AppState & { selectedShelterIndex?: number | null }, threshold: number): { shelter: Shelter; index: number } | null {
    if (!state.shelters) return null;
    let nearest: { shelter: Shelter; index: number } | null = null;
    let minDist: number = Infinity;
    state.shelters.forEach(function (shelter: Shelter, idx: number): void {
      const dx: number = x - shelter.x;
      const dy: number = y - shelter.y;
      const dist: number = Math.sqrt(dx * dx + dy * dy);
      if (dist < threshold && dist < minDist) {
        minDist = dist;
        nearest = { shelter: shelter, index: idx };
      }
    });
    return nearest;
  }

  function handleEvacCanvasClick(
    e: MouseEvent,
    mapCanvas: HTMLCanvasElement,
    state: AppState & { selectedShelterIndex?: number | null; evacuationPlan?: any },
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement,
    elements: ControlElements
  ): void {
    if (!state.evacuationEnabled) return;

    const rect: DOMRect = mapCanvas.getBoundingClientRect();
    const x: number = e.clientX - rect.left;
    const y: number = e.clientY - rect.top;

    const SHELTER_THRESHOLD: number = 30;
    const nearest: { shelter: Shelter; index: number } | null = findNearestShelter(x, y, state, SHELTER_THRESHOLD);

    if (nearest) {
      state.selectedShelterIndex = nearest.index;
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
      return;
    }

    if (state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null) {
      const shelter: Shelter | undefined = state.shelters[state.selectedShelterIndex];
      if (shelter) {
        shelter.x = x;
        shelter.y = y;
        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
      }
    }
  }

  function addShelter(
    state: AppState & { selectedShelterIndex?: number | null; evacuationPlan?: any },
    elements: ControlElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ): void {
    const rect: DOMRect = mapWrapper.getBoundingClientRect();
    const count: number = state.shelters ? state.shelters.length : 0;
    const angle: number = count * Math.PI * 0.5 + Math.random() * 0.5;
    const dist: number = Math.min(rect.width, rect.height) * (0.2 + Math.random() * 0.2);

    const newShelter: Shelter = {
      id: count,
      x: rect.width / 2 + Math.cos(angle) * dist,
      y: rect.height / 2 + Math.sin(angle) * dist,
      capacity: 500000 + Math.floor(Math.random() * 500000),
      name: '避难所 #' + (count + 1)
    } as Shelter;

    if (!state.shelters) (state as any).shelters = [];
    state.shelters.push(newShelter);
    state.selectedShelterIndex = state.shelters.length - 1;

    if (elements.shelterCount) {
      elements.shelterCount.value = String(state.shelters.length);
    }

    recalculateEvacuation(state, elements, mapCtx, mapWrapper);
    global.Renderer.drawMap(mapCtx, mapWrapper, state);
  }

  function updateShelterCount(
    state: AppState & { selectedShelterIndex?: number | null; evacuationPlan?: any },
    elements: ControlElements,
    mapCtx: CanvasRenderingContext2D,
    mapWrapper: HTMLElement
  ): void {
    const count: number = parseInt(elements.shelterCount!.value, 10);
    const rect: DOMRect = mapWrapper.getBoundingClientRect();

    if (!state.shelters || state.shelters.length !== count) {
      state.shelters = global.Physics.generateShelters(
        rect.width, rect.height, count
      );
      state.selectedShelterIndex = null;
      recalculateEvacuation(state, elements, mapCtx, mapWrapper);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    }
  }

  function startEvacAnimation(
    state: AppState & { selectedShelterIndex?: number | null; evacuationPlan?: any },
    elements: ControlElements,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement
  ): void {
    if (!state.evacuationPlan) return;

    if (global.Evacuation.isEvacuating()) {
      global.Evacuation.stopEvacuationAnimation();
    }

    if (elements.evacStartBtn) {
      elements.evacStartBtn.disabled = true;
      elements.evacStartBtn.textContent = '▶ 播放中...';
    }
    if (elements.evacPauseBtn) {
      elements.evacPauseBtn.disabled = false;
    }
    if (elements.evacModeBadge) {
      elements.evacModeBadge.textContent = '播放中';
      elements.evacModeBadge.classList.add('playing');
    }

    const speed: number = parseFloat(elements.evacSpeed ? elements.evacSpeed.value : '1');
    global.Evacuation.setSpeed(speed);

    global.Evacuation.startEvacuationAnimation(
      effectCtx,
      effectCanvas,
      state,
      elements,
      state.evacuationPlan
    );
  }

  function pauseEvacAnimation(elements: ControlElements): void {
    if (global.Evacuation.isEvacuating()) {
      global.Evacuation.stopEvacuationAnimation();
    }
    if (elements.evacStartBtn) {
      elements.evacStartBtn.disabled = false;
      elements.evacStartBtn.textContent = '▶ 继续播放';
    }
    if (elements.evacPauseBtn) {
      elements.evacPauseBtn.disabled = true;
    }
    if (elements.evacModeBadge) {
      elements.evacModeBadge.textContent = '已暂停';
      elements.evacModeBadge.classList.remove('playing');
    }
  }

  function resetEvacAnimation(
    state: AppState & { selectedShelterIndex?: number | null; evacuationPlan?: any },
    elements: ControlElements,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement
  ): void {
    global.Evacuation.resetEvacuationAnimation(
      effectCtx,
      effectCanvas,
      state,
      state.evacuationPlan
    );
    if (elements.evacStartBtn) {
      elements.evacStartBtn.disabled = false;
      elements.evacStartBtn.textContent = '▶ 播放动画';
    }
    if (elements.evacPauseBtn) {
      elements.evacPauseBtn.disabled = true;
    }
    if (elements.evacModeBadge) {
      elements.evacModeBadge.textContent = '就绪';
      elements.evacModeBadge.classList.remove('playing');
    }
    if (elements.evacProgress) {
      elements.evacProgress.textContent = '0%';
    }
    if (elements.evacProgressFill) {
      elements.evacProgressFill.style.width = '0%';
    }
    if (elements.evacTime) {
      elements.evacTime.textContent = '0.0 小时';
    }
    updateEvacuationDisplay(state, elements);
  }

  function setupEventListeners(
    elements: ControlElements,
    dataElements: any,
    state: AppState & { terrainPreset?: string; terrainSeed?: number; buildingViewMode?: string; selectedShelterIndex?: number | null; evacuationRoads?: any[]; evacuationPlan?: any },
    mapCanvas: HTMLCanvasElement,
    mapCtx: CanvasRenderingContext2D,
    effectCtx: CanvasRenderingContext2D,
    effectCanvas: HTMLCanvasElement,
    mapWrapper: HTMLElement,
    flashOverlay: HTMLElement,
    mapHint: HTMLElement
  ): void {
    elements.bombType.addEventListener('change', function (e: Event): void {
      syncSelectedFromControls(state, elements);
      const selected: Explosion | null = getSelectedExplosion(state);
      const target: HTMLSelectElement = e.target as HTMLSelectElement;
      if (selected && target.value !== 'custom') {
        const bomb: BombType | undefined = BOMB_TYPES[target.value as BombTypeKey];
        if (bomb) {
          selected.yieldKilotons = bomb.yield;
          elements.yieldSlider.value = String(bomb.yield);
          elements.yieldValue.textContent = bomb.yield.toLocaleString();
        }
      }
      updateCalculationsForExplosion(getSelectedExplosion(state));
      refreshExplosionList(state, elements);
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    elements.yieldSlider.addEventListener('input', function (e: Event): void {
      syncSelectedFromControls(state, elements);
      elements.bombType.value = 'custom';
      const selected: Explosion | null = getSelectedExplosion(state);
      if (selected) selected.bombType = 'custom';
      updateCalculationsForExplosion(getSelectedExplosion(state));
      refreshExplosionList(state, elements);
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    elements.burstHeight.addEventListener('change', function (): void {
      syncSelectedFromControls(state, elements);
      updateCalculationsForExplosion(getSelectedExplosion(state));
      refreshExplosionList(state, elements);
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    elements.scaleSlider.addEventListener('input', function (e: Event): void {
      state.scale = parseInt((e.target as HTMLInputElement).value, 10);
      elements.scaleValue.textContent = String(state.scale);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    elements.showLabels.addEventListener('change', function (e: Event): void {
      state.showLabels = (e.target as HTMLInputElement).checked;
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    elements.showLegend.addEventListener('change', function (e: Event): void {
      state.showLegend = (e.target as HTMLInputElement).checked;
      elements.legend.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
    });

    elements.addExplosionBtn.addEventListener('click', function (): void {
      if (state.isAnimating) return;
      addExplosion(state, elements, mapWrapper);
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    elements.removeExplosionBtn.addEventListener('click', function (): void {
      if (state.isAnimating) return;
      removeSelectedExplosion(state, elements);
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
    });

    document.querySelectorAll('.toggle-btn').forEach(function (btn: Element): void {
      btn.addEventListener('click', function (): void {
        handleViewToggle((btn as HTMLElement).dataset.view!, state, elements, dataElements);
      });
    });

    elements.detonateBtn.addEventListener('click', function (): void {
      triggerDetonate(state, elements, effectCtx, effectCanvas, mapWrapper, flashOverlay);
    });

    elements.resetBtn.addEventListener('click', function (): void {
      resetAll(state, elements, dataElements, effectCtx, mapWrapper, flashOverlay, mapHint, mapCtx);
    });

    if (elements.terrainEnabled) {
      elements.terrainEnabled.addEventListener('change', function (e: Event): void {
        state.terrainEnabled = (e.target as HTMLInputElement).checked;
        regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
      });
    }

    if (elements.terrainPreset) {
      elements.terrainPreset.addEventListener('change', function (e: Event): void {
        state.terrainPreset = (e.target as HTMLSelectElement).value;
        regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
      });
    }

    if (elements.terrainIntensity) {
      elements.terrainIntensity.addEventListener('input', function (e: Event): void {
        state.terrainIntensity = parseFloat((e.target as HTMLInputElement).value);
        if (elements.terrainIntensityValue) {
          elements.terrainIntensityValue.textContent = state.terrainIntensity.toFixed(1);
        }
        regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
      });
    }

    if (elements.showTerrainHeatmap) {
      elements.showTerrainHeatmap.addEventListener('change', function (e: Event): void {
        state.showTerrainHeatmap = (e.target as HTMLInputElement).checked;
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
      });
    }

    if (elements.showTerrainContours) {
      elements.showTerrainContours.addEventListener('change', function (e: Event): void {
        state.showTerrainContours = (e.target as HTMLInputElement).checked;
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
      });
    }

    if (elements.regenerateTerrainBtn) {
      elements.regenerateTerrainBtn.addEventListener('click', function (): void {
        regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, true);
      });
    }

    if (elements.evacuationEnabled) {
      elements.evacuationEnabled.addEventListener('change', function (e: Event): void {
        state.evacuationEnabled = (e.target as HTMLInputElement).checked;
        if (state.evacuationEnabled && state.shelters && state.shelters.length > 0) {
          recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        }
        if (elements.evacuationPanel) {
          elements.evacuationPanel.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
        }
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
      });
    }

    if (elements.shelterCount) {
      elements.shelterCount.addEventListener('change', function (): void {
        updateShelterCount(state, elements, mapCtx, mapWrapper);
      });
    }

    if (elements.warningTimeSlider) {
      elements.warningTimeSlider.addEventListener('input', function (e: Event): void {
        const value: number = parseInt((e.target as HTMLInputElement).value, 10);
        if (elements.warningTimeValue) {
          elements.warningTimeValue.textContent = String(value);
        }
      });
      elements.warningTimeSlider.addEventListener('change', function (): void {
        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.roadCapacity) {
      elements.roadCapacity.addEventListener('change', function (): void {
        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.vehicleSpeed) {
      elements.vehicleSpeed.addEventListener('change', function (): void {
        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.recalcEvacBtn) {
      elements.recalcEvacBtn.addEventListener('click', function (): void {
        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.addShelterBtn) {
      elements.addShelterBtn.addEventListener('click', function (): void {
        addShelter(state, elements, mapCtx, mapWrapper);
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.evacStartBtn) {
      elements.evacStartBtn.addEventListener('click', function (): void {
        startEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.evacPauseBtn) {
      elements.evacPauseBtn.addEventListener('click', function (): void {
        pauseEvacAnimation(elements);
      });
    }

    if (elements.evacResetBtn) {
      elements.evacResetBtn.addEventListener('click', function (): void {
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      });
    }

    if (elements.evacSpeed) {
      elements.evacSpeed.addEventListener('change', function (e: Event): void {
        const speed: number = parseFloat((e.target as HTMLInputElement).value);
        global.Evacuation.setSpeed(speed);
      });
    }

    document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element): void {
      btn.addEventListener('click', function (): void {
        handleBuildingViewToggle((btn as HTMLElement).dataset.buildingView!, state, elements);
      });
    });

    if (elements.buildingCitySelect) {
      elements.buildingCitySelect.addEventListener('change', function (): void {
        global.DataDisplay.updateBuildingDisplay(elements as unknown as DataElements, state);
      });
    }

    mapCanvas.addEventListener('click', function (e: MouseEvent): void {
      if (state.evacuationEnabled && state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null) {
        handleEvacCanvasClick(e, mapCanvas, state, mapCtx, mapWrapper, elements);
        resetEvacAnimation(state, elements, effectCtx, effectCanvas);
      } else {
        handleCanvasClick(e, mapCanvas, state, mapHint, dataElements, mapCtx, mapWrapper, elements);
      }
      global.DataDisplay.updateBuildingDisplay(elements as unknown as DataElements, state);
    });

    let resizeTimeout: number | undefined;
    window.addEventListener('resize', function (): void {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function (): void {
        global.Renderer.setupCanvas(mapCanvas, null, mapCtx, effectCtx, mapWrapper, state);
        updateAllCalculations(state);
        global.App.regenerateTerrain();
        updateTerrainInfo(state, elements);
        global.DataDisplay.updateDataDisplay(dataElements, state);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
      }, 200);
    });

    let editingZoneKey: string | null = null;
    let draggedZoneIndex: number | null = null;

    function rgbToHex(r: number, g: number, b: number): string {
      return '#' + [r, g, b].map(function (x: number): string {
        const hex: string = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      }).join('');
    }

    function refreshZoneList(
      state: AppState,
      elements: ControlElements,
      mapCtx: CanvasRenderingContext2D,
      mapWrapper: HTMLElement,
      dataElements: any
    ): void {
      if (!elements.zoneList) return;

      const zones: ZoneDef[] = global.Physics.getZones();
      elements.zoneList.innerHTML = '';

      zones.forEach(function (zone: ZoneDef, index: number): void {
        const item: HTMLDivElement = document.createElement('div');
        item.className = 'zone-item';
        item.draggable = true;
        item.dataset.zoneKey = zone.key;
        item.dataset.index = String(index);

        const color: number[] = zone.color || [128, 128, 128];
        const hexColor: string = rgbToHex(color[0], color[1], color[2]);

        item.innerHTML = `
                    <div class="zone-drag-handle" title="拖动排序">⋮⋮</div>
                    <div class="zone-color-preview" style="background: ${hexColor};"></div>
                    <div class="zone-info">
                        <div class="zone-name">${zone.label}</div>
                        <div class="zone-key">${zone.key} · ${zone.overpressureThreshold} psi</div>
                    </div>
                    <div class="zone-actions">
                        <button class="zone-edit-btn" title="编辑">✏️</button>
                        <button class="zone-delete-btn" title="删除">🗑️</button>
                    </div>
                `;

        item.addEventListener('dragstart', function (e: DragEvent): void {
          draggedZoneIndex = index;
          item.classList.add('dragging');
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
          }
        });

        item.addEventListener('dragend', function (): void {
          item.classList.remove('dragging');
          draggedZoneIndex = null;
          document.querySelectorAll('.zone-item').forEach(function (el: Element): void {
            el.classList.remove('drag-over');
          });
        });

        item.addEventListener('dragover', function (e: DragEvent): void {
          e.preventDefault();
          if (draggedZoneIndex !== null && draggedZoneIndex !== index) {
            item.classList.add('drag-over');
          }
        });

        item.addEventListener('dragleave', function (): void {
          item.classList.remove('drag-over');
        });

        item.addEventListener('drop', function (e: DragEvent): void {
          e.preventDefault();
          item.classList.remove('drag-over');
          if (draggedZoneIndex !== null && draggedZoneIndex !== index) {
            const allZones: ZoneDef[] = global.Physics.getZones();
            const draggedKey: string = allZones[draggedZoneIndex].key;
            global.Physics.moveZone(draggedKey, index);
            refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
          }
        });

        const editBtn: Element | null = item.querySelector('.zone-edit-btn');
        if (editBtn) {
          editBtn.addEventListener('click', function (e: Event): void {
            e.stopPropagation();
            openZoneEditor(zone, elements);
          });
        }

        const deleteBtn: Element | null = item.querySelector('.zone-delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', function (e: Event): void {
            e.stopPropagation();
            if (zones.length <= 1) {
              alert('至少需要保留一个圈层！');
              return;
            }
            if (confirm('确定要删除圈层 "' + zone.label + '" 吗？')) {
              global.Physics.removeZone(zone.key);
              refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
            }
          });
        }

        elements.zoneList!.appendChild(item);
      });
    }

    function refreshAllZoneRelated(
      state: AppState,
      elements: ControlElements,
      mapCtx: CanvasRenderingContext2D,
      mapWrapper: HTMLElement,
      dataElements: any
    ): void {
      updateAllCalculations(state);
      global.DataDisplay.generateDataPanels(dataElements);
      global.DataDisplay.generateLegend(dataElements);
      global.DataDisplay.updateDataDisplay(dataElements, state);
      global.Renderer.drawMap(mapCtx, mapWrapper, state);
      refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements);
    }

    function openZoneEditor(zone: ZoneDef | null, elements: ControlElements): void {
      editingZoneKey = zone ? zone.key : null;

      if (zone) {
        if (elements.zoneEditorTitle) elements.zoneEditorTitle.textContent = '编辑圈层: ' + zone.label;
        if (elements.zoneKey) elements.zoneKey.value = zone.key;
        if (elements.zoneLabel) elements.zoneLabel.value = zone.label;
        const colorHex: string = rgbToHex(zone.color[0], zone.color[1], zone.color[2]);
        if (elements.zoneColor) elements.zoneColor.value = colorHex;
        if (elements.zoneColorText) elements.zoneColorText.value = colorHex;
        if (elements.zoneDescription) elements.zoneDescription.value = zone.description || '';
        if (elements.zoneMinRadius) elements.zoneMinRadius.value = String(zone.minRadius || 0.5);
        if (elements.zoneRadiusFormula) elements.zoneRadiusFormula.value = zone.radiusFormula || '';
        if (elements.zoneHeightFactor) elements.zoneHeightFactor.value = zone.heightFactorType || 'height';
        if (elements.zoneDash) {
          elements.zoneDash.value = typeof zone.dash === 'string' ? zone.dash : (zone.dash ? 'dashed4' : 'solid');
        }
        if (elements.zoneOverpressure) elements.zoneOverpressure.value = String(zone.overpressureThreshold || 5);
        if (elements.zoneAltitudeSens) elements.zoneAltitudeSens.value = String(zone.altitudeSensitivity || 0.3);
        if (elements.zoneAltitudeSensValue) {
          elements.zoneAltitudeSensValue.textContent = (zone.altitudeSensitivity || 0.3).toFixed(2);
        }
        if (elements.zoneDestroyed) {
          elements.zoneDestroyed.checked = zone.casualtyRates ? zone.casualtyRates.destroyed : false;
        }
        if (elements.zoneDeathRate) {
          elements.zoneDeathRate.value = String(zone.casualtyRates ? zone.casualtyRates.deaths : 0.1);
        }
        if (elements.zoneDeathRateValue) {
          elements.zoneDeathRateValue.textContent = (zone.casualtyRates ? zone.casualtyRates.deaths : 0.1).toFixed(2);
        }
        if (elements.zoneInjuryRate) {
          elements.zoneInjuryRate.value = String(zone.casualtyRates ? zone.casualtyRates.injured : 0.2);
        }
        if (elements.zoneInjuryRateValue) {
          elements.zoneInjuryRateValue.textContent = (zone.casualtyRates ? zone.casualtyRates.injured : 0.2).toFixed(2);
        }
      } else {
        if (elements.zoneEditorTitle) elements.zoneEditorTitle.textContent = '新增圈层';
        if (elements.zoneKey) elements.zoneKey.value = '';
        if (elements.zoneLabel) elements.zoneLabel.value = '';
        if (elements.zoneColor) elements.zoneColor.value = '#ff6600';
        if (elements.zoneColorText) elements.zoneColorText.value = '#ff6600';
        if (elements.zoneDescription) elements.zoneDescription.value = '';
        if (elements.zoneMinRadius) elements.zoneMinRadius.value = '0.5';
        if (elements.zoneRadiusFormula) elements.zoneRadiusFormula.value = '1.0 * Math.pow(W, 0.4)';
        if (elements.zoneHeightFactor) elements.zoneHeightFactor.value = 'height';
        if (elements.zoneDash) elements.zoneDash.value = 'solid';
        if (elements.zoneOverpressure) elements.zoneOverpressure.value = '5';
        if (elements.zoneAltitudeSens) elements.zoneAltitudeSens.value = '0.3';
        if (elements.zoneAltitudeSensValue) elements.zoneAltitudeSensValue.textContent = '0.30';
        if (elements.zoneDestroyed) elements.zoneDestroyed.checked = false;
        if (elements.zoneDeathRate) elements.zoneDeathRate.value = '0.1';
        if (elements.zoneDeathRateValue) elements.zoneDeathRateValue.textContent = '0.10';
        if (elements.zoneInjuryRate) elements.zoneInjuryRate.value = '0.2';
        if (elements.zoneInjuryRateValue) elements.zoneInjuryRateValue.textContent = '0.20';
      }

      if (elements.zoneEditorModal) {
        elements.zoneEditorModal.style.display = 'flex';
      }
    }

    function closeZoneEditor(elements: ControlElements): void {
      if (elements.zoneEditorModal) {
        elements.zoneEditorModal.style.display = 'none';
      }
      editingZoneKey = null;
    }

    function handleZoneSave(
      state: AppState,
      elements: ControlElements,
      mapCtx: CanvasRenderingContext2D,
      mapWrapper: HTMLElement,
      dataElements: any
    ): void {
      const key: string = elements.zoneKey ? elements.zoneKey.value.trim() : '';
      const label: string = elements.zoneLabel ? elements.zoneLabel.value.trim() : '';

      if (!key || !label) {
        alert('圈层标识和名称不能为空！');
        return;
      }

      if (!/^[a-z_][a-z0-9_]*$/i.test(key)) {
        alert('圈层标识只能包含字母、数字和下划线，且必须以字母或下划线开头！');
        return;
      }

      const colorValue: string = elements.zoneColorText ? elements.zoneColorText.value : '';
      const colorMatch: RegExpMatchArray | null = colorValue.match(/^#?([0-9a-f]{6})$/i);
      if (!colorMatch) {
        alert('请输入有效的颜色值（如 #ff0000）！');
        return;
      }

      const colorHex: string = colorMatch[1];
      const color: number[] = [
        parseInt(colorHex.substr(0, 2), 16),
        parseInt(colorHex.substr(2, 2), 16),
        parseInt(colorHex.substr(4, 2), 16)
      ];

      let dashValue: string | null = elements.zoneDash ? elements.zoneDash.value : 'solid';
      if (dashValue === 'solid') dashValue = null;

      const zoneDef: any = {
        key: key,
        label: label,
        color: color,
        description: elements.zoneDescription ? elements.zoneDescription.value.trim() : '',
        minRadius: elements.zoneMinRadius ? parseFloat(elements.zoneMinRadius.value) || 0.1 : 0.1,
        radiusFormula: elements.zoneRadiusFormula ? elements.zoneRadiusFormula.value.trim() : '',
        heightFactorType: elements.zoneHeightFactor ? elements.zoneHeightFactor.value : 'height',
        dash: dashValue,
        overpressureThreshold: elements.zoneOverpressure ? parseFloat(elements.zoneOverpressure.value) || 0 : 0,
        altitudeSensitivity: elements.zoneAltitudeSens ? parseFloat(elements.zoneAltitudeSens.value) || 0 : 0,
        casualtyRates: {
          deaths: elements.zoneDeathRate ? parseFloat(elements.zoneDeathRate.value) || 0 : 0,
          injured: elements.zoneInjuryRate ? parseFloat(elements.zoneInjuryRate.value) || 0 : 0,
          destroyed: elements.zoneDestroyed ? elements.zoneDestroyed.checked : false
        }
      };

      let result: { success: boolean; error?: string };
      if (editingZoneKey) {
        result = global.Physics.updateZone(editingZoneKey, zoneDef);
      } else {
        result = global.Physics.addZone(zoneDef);
      }

      if (result.success) {
        closeZoneEditor(elements);
        refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
      } else {
        alert('保存失败: ' + result.error);
      }
    }

    if (elements.addZoneBtn) {
      elements.addZoneBtn.addEventListener('click', function (): void {
        openZoneEditor(null, elements);
      });
    }

    if (elements.resetZonesBtn) {
      elements.resetZonesBtn.addEventListener('click', function (): void {
        if (confirm('确定要恢复所有默认圈层设置吗？当前的自定义修改将丢失。')) {
          global.Physics.resetZones();
          refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
        }
      });
    }

    if (elements.zoneEditorClose) {
      elements.zoneEditorClose.addEventListener('click', function (): void {
        closeZoneEditor(elements);
      });
    }

    if (elements.zoneEditorOverlay) {
      elements.zoneEditorOverlay.addEventListener('click', function (): void {
        closeZoneEditor(elements);
      });
    }

    if (elements.zoneEditorCancel) {
      elements.zoneEditorCancel.addEventListener('click', function (): void {
        closeZoneEditor(elements);
      });
    }

    if (elements.zoneEditorSave) {
      elements.zoneEditorSave.addEventListener('click', function (): void {
        handleZoneSave(state, elements, mapCtx, mapWrapper, dataElements);
      });
    }

    if (elements.zoneColor && elements.zoneColorText) {
      const zoneColorEl: HTMLInputElement = elements.zoneColor;
      const zoneColorTextEl: HTMLInputElement = elements.zoneColorText;
      zoneColorEl.addEventListener('input', function (): void {
        zoneColorTextEl.value = zoneColorEl.value;
      });
      zoneColorTextEl.addEventListener('input', function (): void {
        if (/^#?[0-9a-f]{6}$/i.test(zoneColorTextEl.value)) {
          zoneColorEl.value = zoneColorTextEl.value.startsWith('#')
            ? zoneColorTextEl.value
            : '#' + zoneColorTextEl.value;
        }
      });
    }

    if (elements.zoneAltitudeSens && elements.zoneAltitudeSensValue) {
      elements.zoneAltitudeSens.addEventListener('input', function (): void {
        if (elements.zoneAltitudeSensValue) {
          elements.zoneAltitudeSensValue.textContent = parseFloat(elements.zoneAltitudeSens!.value).toFixed(2);
        }
      });
    }

    if (elements.zoneDeathRate && elements.zoneDeathRateValue) {
      elements.zoneDeathRate.addEventListener('input', function (): void {
        if (elements.zoneDeathRateValue) {
          elements.zoneDeathRateValue.textContent = parseFloat(elements.zoneDeathRate!.value).toFixed(2);
        }
      });
    }

    if (elements.zoneInjuryRate && elements.zoneInjuryRateValue) {
      elements.zoneInjuryRate.addEventListener('input', function (): void {
        if (elements.zoneInjuryRateValue) {
          elements.zoneInjuryRateValue.textContent = parseFloat(elements.zoneInjuryRate!.value).toFixed(2);
        }
      });
    }

    global.DataDisplay.generateDataPanels(dataElements);
    global.DataDisplay.generateLegend(dataElements);
    refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements);
  }

  global.UI = {
    getControlElements: getControlElements,
    setupEventListeners: setupEventListeners,
    updateCalculations: updateCalculationsForExplosion,
    updateAllCalculations: updateAllCalculations,
    handleCanvasClick: handleCanvasClick,
    refreshExplosionList: refreshExplosionList,
    syncControlsFromSelected: syncControlsFromSelected,
    syncTerrainControlsFromState: syncTerrainControlsFromState,
    syncStateFromTerrainControls: syncStateFromTerrainControls,
    updateTerrainInfo: updateTerrainInfo,
    regenerateTerrain: regenerateTerrain,
    recalculateEvacuation: recalculateEvacuation,
    updateEvacuationDisplay: updateEvacuationDisplay,
    addShelter: addShelter,
    updateShelterCount: updateShelterCount,
    startEvacAnimation: startEvacAnimation,
    pauseEvacAnimation: pauseEvacAnimation,
    resetEvacAnimation: resetEvacAnimation,
    handleEvacCanvasClick: handleEvacCanvasClick,
    findNearestShelter: findNearestShelter
  };

})(window);