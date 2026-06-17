import { AppState, ControlElements, DataElements, Explosion, ZoneDef, ZoneOperationResult, TerrainFeature } from '../types/index.ts';
import {
    BOMB_TYPES,
    TERRAIN_FEATURE_TYPES,
    generateRoadNetwork,
    calculateEvacuationPlan,
    VEHICLE_SPEED_KMH,
    setVehicleSpeed,
    generateShelters,
    getZones,
    moveZone,
    removeZone,
    updateZone,
    addZone,
    resetZones,
    calculateRadii
} from './physics.ts';
import {
    updateDataDisplay,
    updateBuildingDisplay,
    generateDataPanels,
    generateLegend,
    populateBuildingCitySelect
} from './data-display.ts';
import { drawMap, setupCanvas } from './renderer.ts';
import { animateExplosion } from './animation.ts';
import {
    isEvacuating,
    stopEvacuationAnimation,
    setSpeed,
    startEvacuationAnimation,
    resetEvacuationAnimation
} from './evacuation.ts';
import { isActive as isTimelineActive, stopTimelineMode as stopTimeline, startTimelineMode as startTimeline } from './timeline.ts';
import { createExplosion, regenerateTerrain as regenerateTerrainState } from './state.ts';

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

export function getControlElements(): ControlElements {
    const elements: ControlElements = {};
    controlElementIds.forEach(function (id: string) {
        elements[id] = document.getElementById(id);
    });
    return elements;
}

function getSelectedExplosion(state: AppState): Explosion | null {
    if (!state.selectedExplosionId) return null;
    return state.explosions.find(function (e: Explosion) { return e.id === state.selectedExplosionId; }) || null;
}

export function updateCalculations(explosion: Explosion | null): void {
    if (!explosion) return;
    explosion.radii = calculateRadii(explosion.yieldKilotons, explosion.burstHeight);
}

export function updateAllCalculations(state: AppState): void {
    state.explosions.forEach(updateCalculations);
}

function getBombTypeName(bombType: string, yieldKilotons: number): string {
    if (bombType === 'custom') return '自定义 ' + yieldKilotons.toLocaleString() + 'kt';
    const bomb = BOMB_TYPES[bombType];
    return bomb ? bomb.name : '自定义';
}

export function refreshExplosionList(state: AppState, elements: ControlElements): void {
    const list = elements.explosionList!;
    list.innerHTML = '';

    if (state.explosions.length === 0) {
        const tip = document.createElement('div');
        tip.className = 'empty-list-tip';
        tip.textContent = '点击「添加爆炸点」开始';
        list.appendChild(tip);
    } else {
        state.explosions.forEach(function (exp: Explosion, index: number) {
            const item = document.createElement('div');
            item.className = 'explosion-item' + (exp.id === state.selectedExplosionId ? ' active' : '');
            item.dataset.id = String(exp.id);

            const left = document.createElement('div');
            left.className = 'explosion-item-left';

            const num = document.createElement('div');
            num.className = 'explosion-number';
            num.textContent = String(index + 1);

            const meta = document.createElement('div');
            meta.className = 'explosion-meta';
            const title = document.createElement('div');
            title.className = 'explosion-title';
            title.textContent = '爆炸点 #' + (index + 1);
            const sub = document.createElement('div');
            sub.className = 'explosion-sub';
            sub.textContent = getBombTypeName(exp.bombType, exp.yieldKilotons) + ' · ' + exp.burstHeight + 'm';
            meta.appendChild(title);
            meta.appendChild(sub);

            left.appendChild(num);
            left.appendChild(meta);

            const indicator = document.createElement('div');
            indicator.className = 'explosion-position-indicator ' + (exp.explosionCenter ? 'set' : 'unset');
            indicator.title = exp.explosionCenter ? '位置已设置' : '位置未设置';

            item.appendChild(left);
            item.appendChild(indicator);

            item.addEventListener('click', function () {
                selectExplosion(state, exp.id, elements);
            });

            list.appendChild(item);
        });
    }

    elements.explosionCount!.textContent = String(state.explosions.length);
    updateParamTargetLabel(state, elements);
}

function updateParamTargetLabel(state: AppState, elements: ControlElements): void {
    const index = state.explosions.findIndex(function (e: Explosion) { return e.id === state.selectedExplosionId; });
    if (index >= 0) {
        elements.paramTarget!.textContent = '（爆炸点 #' + (index + 1) + '）';
    } else {
        elements.paramTarget!.textContent = '（无选中）';
    }
}

export function syncControlsFromSelected(state: AppState, elements: ControlElements): void {
    const selected = getSelectedExplosion(state);
    if (!selected) return;

    (elements.bombType as HTMLSelectElement)!.value = selected.bombType;
    (elements.yieldSlider as HTMLInputElement)!.value = String(selected.yieldKilotons);
    elements.yieldValue!.textContent = selected.yieldKilotons.toLocaleString();
    (elements.burstHeight as HTMLInputElement)!.value = String(selected.burstHeight);
}

export function syncTerrainControlsFromState(state: AppState, elements: ControlElements): void {
    if (elements.terrainEnabled) (elements.terrainEnabled as HTMLInputElement).checked = state.terrainEnabled;
    if (elements.terrainPreset) (elements.terrainPreset as HTMLSelectElement).value = state.terrainPreset;
    if (elements.terrainIntensity) (elements.terrainIntensity as HTMLInputElement).value = String(state.terrainIntensity);
    if (elements.terrainIntensityValue) elements.terrainIntensityValue.textContent = state.terrainIntensity.toFixed(1);
    if (elements.showTerrainHeatmap) (elements.showTerrainHeatmap as HTMLInputElement).checked = state.showTerrainHeatmap;
    if (elements.showTerrainContours) (elements.showTerrainContours as HTMLInputElement).checked = state.showTerrainContours;
    updateTerrainInfo(state, elements);
}

export function syncStateFromTerrainControls(state: AppState, elements: ControlElements): void {
    if (elements.terrainEnabled) state.terrainEnabled = (elements.terrainEnabled as HTMLInputElement).checked;
    if (elements.terrainPreset) state.terrainPreset = (elements.terrainPreset as HTMLSelectElement).value;
    if (elements.terrainIntensity) state.terrainIntensity = parseFloat((elements.terrainIntensity as HTMLInputElement).value);
    if (elements.showTerrainHeatmap) state.showTerrainHeatmap = (elements.showTerrainHeatmap as HTMLInputElement).checked;
    if (elements.showTerrainContours) state.showTerrainContours = (elements.showTerrainContours as HTMLInputElement).checked;
}

export function updateTerrainInfo(state: AppState, elements: ControlElements): void {
    if (!state.terrainData || !state.terrainData.features) {
        if (elements.mountainCount) elements.mountainCount.textContent = '0';
        if (elements.hillCount) elements.hillCount.textContent = '0';
        if (elements.basinCount) elements.basinCount.textContent = '0';
        if (elements.maxElevation) elements.maxElevation.textContent = '0';
        return;
    }

    const FEATURE_TYPES = TERRAIN_FEATURE_TYPES;
    let mountainCount = 0, hillCount = 0, basinCount = 0, maxElev = 0;

    state.terrainData.features.forEach(function (f: TerrainFeature) {
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

export function regenerateTerrain(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, dataElements: DataElements, forceNewSeed: boolean): void {
    if (forceNewSeed) {
        state.terrainSeed = Math.floor(Math.random() * 100000);
    }
    regenerateTerrainState();
    updateTerrainInfo(state, elements);
    updateDataDisplay(dataElements, state);
    drawMap(mapCtx, mapWrapper, state);
}

function syncSelectedFromControls(state: AppState, elements: ControlElements): void {
    const selected = getSelectedExplosion(state);
    if (!selected) return;

    selected.bombType = (elements.bombType as HTMLSelectElement)!.value;
    selected.yieldKilotons = parseInt((elements.yieldSlider as HTMLInputElement)!.value, 10);
    selected.burstHeight = parseInt((elements.burstHeight as HTMLInputElement)!.value, 10);
}

function selectExplosion(state: AppState, id: number, elements: ControlElements): void {
    state.selectedExplosionId = id;
    syncControlsFromSelected(state, elements);
    refreshExplosionList(state, elements);
}

function addExplosion(state: AppState, elements: ControlElements, mapWrapper: HTMLElement, position?: { x: number; y: number }): Explosion {
    const rect = mapWrapper.getBoundingClientRect();
    let center: { x: number; y: number };
    if (position) {
        center = position;
    } else {
        center = {
            x: rect.width / 2 + (Math.random() - 0.5) * rect.width * 0.4,
            y: rect.height / 2 + (Math.random() - 0.5) * rect.height * 0.4
        };
    }
    const newExp = createExplosion({
        explosionCenter: center
    });
    updateCalculations(newExp);
    state.explosions.push(newExp);
    state.selectedExplosionId = newExp.id;
    syncControlsFromSelected(state, elements);
    refreshExplosionList(state, elements);
    return newExp;
}

function findNearestExplosion(x: number, y: number, state: AppState, thresholdPx: number): Explosion | null {
    let nearest: Explosion | null = null;
    let nearestDist = Infinity;
    state.explosions.forEach(function (exp: Explosion) {
        if (!exp.explosionCenter) return;
        const dx = x - exp.explosionCenter.x;
        const dy = y - exp.explosionCenter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
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
    const index = state.explosions.findIndex(function (e: Explosion) { return e.id === state.selectedExplosionId; });
    if (index < 0) return;

    state.explosions.splice(index, 1);
    const newSelected = state.explosions[Math.max(0, index - 1)];
    state.selectedExplosionId = newSelected ? newSelected.id : null;
    syncControlsFromSelected(state, elements);
    refreshExplosionList(state, elements);
}

export function handleCanvasClick(e: MouseEvent, mapCanvas: HTMLCanvasElement, state: AppState, mapHint: HTMLElement, dataElements: DataElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, elements: ControlElements): void {
    if (state.isAnimating) return;

    const rect = mapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.shiftKey) {
        const newExp = addExplosion(state, elements, mapWrapper, { x: x, y: y });
        mapHint.classList.add('hidden');
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
        return;
    }

    const SELECT_THRESHOLD = 24;
    const nearest = findNearestExplosion(x, y, state, SELECT_THRESHOLD);
    if (nearest) {
        selectExplosion(state, nearest.id, elements);
    } else {
        const selected = getSelectedExplosion(state);
        if (!selected) {
            const firstWithPos = state.explosions.find(function (exp: Explosion) { return exp.explosionCenter; });
            if (firstWithPos) {
                selectExplosion(state, firstWithPos.id, elements);
            } else {
                alert('请先选中一个爆炸点');
                return;
            }
        }
        const currentSelected = getSelectedExplosion(state);
        currentSelected!.explosionCenter = { x: x, y: y };
        mapHint.classList.add('hidden');
        updateCalculations(currentSelected);
        refreshExplosionList(state, elements);
    }

    updateDataDisplay(dataElements, state);
    drawMap(mapCtx, mapWrapper, state);
}

function triggerDetonate(state: AppState, elements: ControlElements, effectCtx: CanvasRenderingContext2D, effectCanvas: HTMLCanvasElement, mapWrapper: HTMLElement, flashOverlay: HTMLElement): void {
    const positionedExplosions = state.explosions.filter(function (e: Explosion) { return e.explosionCenter; });
    if (positionedExplosions.length === 0) {
        alert('请至少为一个爆炸点设置位置');
        return;
    }

    if (isTimelineActive()) {
        stopTimeline();
    }

    animateExplosion(effectCtx, effectCanvas, mapWrapper, state, elements, flashOverlay);
}

function resetAll(state: AppState, elements: ControlElements, dataElements: DataElements, effectCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, flashOverlay: HTMLElement, mapHint: HTMLElement, mapCtx: CanvasRenderingContext2D): void {
    if (state.animationId) {
        cancelAnimationFrame(state.animationId);
    }

    if (isTimelineActive()) {
        stopTimeline();
    }

    state.isAnimating = false;
    state.animationId = null;
    state.explosions = [];
    state.selectedExplosionId = null;

    (elements.detonateBtn as HTMLButtonElement)!.disabled = false;
    flashOverlay.classList.remove('active');
    mapHint.classList.remove('hidden');

    const rect = mapWrapper.getBoundingClientRect();
    effectCtx.clearRect(0, 0, rect.width, rect.height);

    state.cities.forEach(function (city) { city.destroyed = false; });

    state.terrainSeed = Math.floor(Math.random() * 100000);
    syncStateFromTerrainControls(state, elements);
    regenerateTerrainState();
    updateTerrainInfo(state, elements);

    const firstExp = createExplosion({
        explosionCenter: {
            x: rect.width / 2,
            y: rect.height / 2
        }
    });
    updateCalculations(firstExp);
    state.explosions.push(firstExp);
    state.selectedExplosionId = firstExp.id;

    mapHint.classList.add('hidden');
    syncControlsFromSelected(state, elements);
    syncTerrainControlsFromState(state, elements);
    refreshExplosionList(state, elements);
    updateAllCalculations(state);
    updateDataDisplay(dataElements, state);
    drawMap(mapCtx, mapWrapper, state);
}

function handleViewToggle(view: string, state: AppState, elements: ControlElements, dataElements: DataElements): void {
    state.viewMode = view;
    document.querySelectorAll('.toggle-btn').forEach(function (btn: Element) {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.view === view);
    });
    const combinedStats = document.getElementById('combinedStats');
    if (combinedStats) {
        combinedStats.style.display = view === 'combined' ? 'block' : 'none';
    }
    updateDataDisplay(dataElements, state);
}

function handleBuildingViewToggle(view: string, state: AppState, elements: ControlElements): void {
    state.buildingViewMode = view;
    document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element) {
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

export function recalculateEvacuation(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement): void {
    if (!state.evacuationEnabled || !state.shelters || state.shelters.length === 0) {
        state.evacuationPlan = null;
        return;
    }

    const roads = generateRoadNetwork(
        mapWrapper.clientWidth,
        mapWrapper.clientHeight,
        state.cities,
        state.shelters
    );
    state.evacuationRoads = roads;

    const capacityMultiplier = parseFloat(elements.roadCapacity ? (elements.roadCapacity as HTMLInputElement).value : '1');
    const adjustedRoads = roads.map(function (road) {
        return {
            ...road,
            capacity: road.capacity! * capacityMultiplier
        };
    });

    const warningTime = parseInt(elements.warningTimeSlider ? (elements.warningTimeSlider as HTMLInputElement).value : '30', 10);

    const originalSpeed = VEHICLE_SPEED_KMH;
    const customSpeed = parseInt(elements.vehicleSpeed ? (elements.vehicleSpeed as HTMLInputElement).value : '60', 10);
    setVehicleSpeed(customSpeed);

    state.evacuationPlan = calculateEvacuationPlan(
        state.cities,
        state.shelters,
        adjustedRoads,
        state.scale,
        warningTime
    );

    setVehicleSpeed(originalSpeed);

    updateEvacuationDisplay(state, elements);
}

export function updateEvacuationDisplay(state: AppState, elements: ControlElements): void {
    const plan = state.evacuationPlan;
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
        const rate = plan.evacuationRate * 100;
        if (rate < 0.1) {
            elements.evacRate.textContent = '<0.1%';
        } else if (rate < 1) {
            elements.evacRate.textContent = rate.toFixed(1) + '%';
        } else {
            elements.evacRate.textContent = Math.round(rate) + '%';
        }
    }

    const warningTime = parseInt(elements.warningTimeSlider ? (elements.warningTimeSlider as HTMLInputElement).value : '30', 10);
    if (elements.evacWarningTime) {
        elements.evacWarningTime.textContent = warningTime + ' 分钟';
    }
}

function formatNumberShort(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
}

export function findNearestShelter(x: number, y: number, state: AppState, threshold: number): { shelter: any; index: number } | null {
    if (!state.shelters) return null;
    let nearest: { shelter: any; index: number } | null = null;
    let minDist = Infinity;
    state.shelters.forEach(function (shelter, idx) {
        const dx = x - shelter.x;
        const dy = y - shelter.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold && dist < minDist) {
            minDist = dist;
            nearest = { shelter: shelter, index: idx };
        }
    });
    return nearest;
}

export function handleEvacCanvasClick(e: MouseEvent, mapCanvas: HTMLCanvasElement, state: AppState, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, elements: ControlElements): void {
    if (!state.evacuationEnabled) return;

    const rect = mapCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const SHELTER_THRESHOLD = 30;
    const nearest = findNearestShelter(x, y, state, SHELTER_THRESHOLD);

    if (nearest) {
        state.selectedShelterIndex = nearest.index;
        drawMap(mapCtx, mapWrapper, state);
        return;
    }

    if (state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null) {
        const shelter = state.shelters[state.selectedShelterIndex];
        if (shelter) {
            shelter.x = x;
            shelter.y = y;
            recalculateEvacuation(state, elements, mapCtx, mapWrapper);
            drawMap(mapCtx, mapWrapper, state);
        }
    }
}

export function addShelter(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement): void {
    const rect = mapWrapper.getBoundingClientRect();
    const count = state.shelters ? state.shelters.length : 0;
    const angle = count * Math.PI * 0.5 + Math.random() * 0.5;
    const dist = Math.min(rect.width, rect.height) * (0.2 + Math.random() * 0.2);

    const newShelter = {
        id: count,
        x: rect.width / 2 + Math.cos(angle) * dist,
        y: rect.height / 2 + Math.sin(angle) * dist,
        capacity: 500000 + Math.floor(Math.random() * 500000),
        name: '避难所 #' + (count + 1)
    };

    if (!state.shelters) state.shelters = [];
    state.shelters.push(newShelter);
    state.selectedShelterIndex = state.shelters.length - 1;

    if (elements.shelterCount) {
        (elements.shelterCount as HTMLInputElement).value = String(state.shelters.length);
    }

    recalculateEvacuation(state, elements, mapCtx, mapWrapper);
    drawMap(mapCtx, mapWrapper, state);
}

export function updateShelterCount(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement): void {
    const count = parseInt((elements.shelterCount as HTMLInputElement)!.value, 10);
    const rect = mapWrapper.getBoundingClientRect();

    if (!state.shelters || state.shelters.length !== count) {
        state.shelters = generateShelters(
            rect.width, rect.height, count
        );
        state.selectedShelterIndex = null;
        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        drawMap(mapCtx, mapWrapper, state);
    }
}

export function startEvacAnimation(state: AppState, elements: ControlElements, effectCtx: CanvasRenderingContext2D, effectCanvas: HTMLCanvasElement): void {
    if (!state.evacuationPlan) return;

    if (isEvacuating()) {
        stopEvacuationAnimation();
    }

    if (elements.evacStartBtn) {
        (elements.evacStartBtn as HTMLButtonElement).disabled = true;
        (elements.evacStartBtn as HTMLButtonElement).textContent = '▶ 播放中...';
    }
    if (elements.evacPauseBtn) {
        (elements.evacPauseBtn as HTMLButtonElement).disabled = false;
    }
    if (elements.evacModeBadge) {
        elements.evacModeBadge.textContent = '播放中';
        elements.evacModeBadge.classList.add('playing');
    }

    const speed = parseFloat(elements.evacSpeed ? (elements.evacSpeed as HTMLInputElement).value : '1');
    setSpeed(speed);

    startEvacuationAnimation(
        effectCtx,
        effectCanvas,
        state,
        elements,
        state.evacuationPlan
    );
}

export function pauseEvacAnimation(elements: ControlElements): void {
    if (isEvacuating()) {
        stopEvacuationAnimation();
    }
    if (elements.evacStartBtn) {
        (elements.evacStartBtn as HTMLButtonElement).disabled = false;
        (elements.evacStartBtn as HTMLButtonElement).textContent = '▶ 继续播放';
    }
    if (elements.evacPauseBtn) {
        (elements.evacPauseBtn as HTMLButtonElement).disabled = true;
    }
    if (elements.evacModeBadge) {
        elements.evacModeBadge.textContent = '已暂停';
        elements.evacModeBadge.classList.remove('playing');
    }
}

export function resetEvacAnimation(state: AppState, elements: ControlElements, effectCtx: CanvasRenderingContext2D, effectCanvas: HTMLCanvasElement): void {
    resetEvacuationAnimation(
        effectCtx,
        effectCanvas,
        state,
        state.evacuationPlan
    );
    if (elements.evacStartBtn) {
        (elements.evacStartBtn as HTMLButtonElement).disabled = false;
        (elements.evacStartBtn as HTMLButtonElement).textContent = '▶ 播放动画';
    }
    if (elements.evacPauseBtn) {
        (elements.evacPauseBtn as HTMLButtonElement).disabled = true;
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

export function setupEventListeners(elements: ControlElements, dataElements: DataElements, state: AppState, mapCanvas: HTMLCanvasElement, mapCtx: CanvasRenderingContext2D, effectCtx: CanvasRenderingContext2D, effectCanvas: HTMLCanvasElement, mapWrapper: HTMLElement, flashOverlay: HTMLElement, mapHint: HTMLElement): void {
    (elements.bombType as HTMLSelectElement)!.addEventListener('change', function (e: Event) {
        syncSelectedFromControls(state, elements);
        const selected = getSelectedExplosion(state);
        if (selected && (e.target as HTMLSelectElement).value !== 'custom') {
            const bomb = BOMB_TYPES[(e.target as HTMLSelectElement).value];
            if (bomb) {
                selected.yieldKilotons = bomb.yield;
                (elements.yieldSlider as HTMLInputElement)!.value = String(bomb.yield);
                elements.yieldValue!.textContent = bomb.yield.toLocaleString();
            }
        }
        updateCalculations(getSelectedExplosion(state));
        refreshExplosionList(state, elements);
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
    });

    (elements.yieldSlider as HTMLInputElement)!.addEventListener('input', function () {
        syncSelectedFromControls(state, elements);
        (elements.bombType as HTMLSelectElement)!.value = 'custom';
        const selected = getSelectedExplosion(state);
        if (selected) selected.bombType = 'custom';
        updateCalculations(getSelectedExplosion(state));
        refreshExplosionList(state, elements);
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
    });

    (elements.burstHeight as HTMLInputElement)!.addEventListener('change', function () {
        syncSelectedFromControls(state, elements);
        updateCalculations(getSelectedExplosion(state));
        refreshExplosionList(state, elements);
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
    });

    (elements.scaleSlider as HTMLInputElement)!.addEventListener('input', function (e: Event) {
        state.scale = parseInt((e.target as HTMLInputElement).value, 10);
        elements.scaleValue!.textContent = String(state.scale);
        drawMap(mapCtx, mapWrapper, state);
    });

    (elements.showLabels as HTMLInputElement)!.addEventListener('change', function (e: Event) {
        state.showLabels = (e.target as HTMLInputElement).checked;
        drawMap(mapCtx, mapWrapper, state);
    });

    (elements.showLegend as HTMLInputElement)!.addEventListener('change', function (e: Event) {
        state.showLegend = (e.target as HTMLInputElement).checked;
        elements.legend!.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
    });

    elements.addExplosionBtn!.addEventListener('click', function () {
        if (state.isAnimating) return;
        addExplosion(state, elements, mapWrapper);
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
    });

    elements.removeExplosionBtn!.addEventListener('click', function () {
        if (state.isAnimating) return;
        removeSelectedExplosion(state, elements);
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
    });

    document.querySelectorAll('.toggle-btn').forEach(function (btn: Element) {
        btn.addEventListener('click', function () {
            handleViewToggle((btn as HTMLElement).dataset.view!, state, elements, dataElements);
        });
    });

    (elements.detonateBtn as HTMLButtonElement)!.addEventListener('click', function () {
        triggerDetonate(state, elements, effectCtx, effectCanvas, mapWrapper, flashOverlay);
    });

    (elements.resetBtn as HTMLButtonElement)!.addEventListener('click', function () {
        resetAll(state, elements, dataElements, effectCtx, mapWrapper, flashOverlay, mapHint, mapCtx);
    });

    if (elements.terrainEnabled) {
        elements.terrainEnabled.addEventListener('change', function (e: Event) {
            state.terrainEnabled = (e.target as HTMLInputElement).checked;
            regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
        });
    }

    if (elements.terrainPreset) {
        elements.terrainPreset.addEventListener('change', function (e: Event) {
            state.terrainPreset = (e.target as HTMLSelectElement).value;
            regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
        });
    }

    if (elements.terrainIntensity) {
        elements.terrainIntensity.addEventListener('input', function (e: Event) {
            state.terrainIntensity = parseFloat((e.target as HTMLInputElement).value);
            if (elements.terrainIntensityValue) {
                elements.terrainIntensityValue.textContent = state.terrainIntensity.toFixed(1);
            }
            regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
        });
    }

    if (elements.showTerrainHeatmap) {
        elements.showTerrainHeatmap.addEventListener('change', function (e: Event) {
            state.showTerrainHeatmap = (e.target as HTMLInputElement).checked;
            drawMap(mapCtx, mapWrapper, state);
        });
    }

    if (elements.showTerrainContours) {
        elements.showTerrainContours.addEventListener('change', function (e: Event) {
            state.showTerrainContours = (e.target as HTMLInputElement).checked;
            drawMap(mapCtx, mapWrapper, state);
        });
    }

    if (elements.regenerateTerrainBtn) {
        elements.regenerateTerrainBtn.addEventListener('click', function () {
            regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, true);
        });
    }

    if (elements.evacuationEnabled) {
        elements.evacuationEnabled.addEventListener('change', function (e: Event) {
            state.evacuationEnabled = (e.target as HTMLInputElement).checked;
            if (state.evacuationEnabled && state.shelters && state.shelters.length > 0) {
                recalculateEvacuation(state, elements, mapCtx, mapWrapper);
            }
            if (elements.evacuationPanel) {
                elements.evacuationPanel.classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
            }
            drawMap(mapCtx, mapWrapper, state);
        });
    }

    if (elements.shelterCount) {
        elements.shelterCount.addEventListener('change', function () {
            updateShelterCount(state, elements, mapCtx, mapWrapper);
        });
    }

    if (elements.warningTimeSlider) {
        elements.warningTimeSlider.addEventListener('input', function (e: Event) {
            const value = parseInt((e.target as HTMLInputElement).value, 10);
            if (elements.warningTimeValue) {
                elements.warningTimeValue.textContent = String(value);
            }
        });
        elements.warningTimeSlider.addEventListener('change', function () {
            recalculateEvacuation(state, elements, mapCtx, mapWrapper);
            drawMap(mapCtx, mapWrapper, state);
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.roadCapacity) {
        elements.roadCapacity.addEventListener('change', function () {
            recalculateEvacuation(state, elements, mapCtx, mapWrapper);
            drawMap(mapCtx, mapWrapper, state);
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.vehicleSpeed) {
        elements.vehicleSpeed.addEventListener('change', function () {
            recalculateEvacuation(state, elements, mapCtx, mapWrapper);
            drawMap(mapCtx, mapWrapper, state);
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.recalcEvacBtn) {
        elements.recalcEvacBtn.addEventListener('click', function () {
            recalculateEvacuation(state, elements, mapCtx, mapWrapper);
            drawMap(mapCtx, mapWrapper, state);
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.addShelterBtn) {
        elements.addShelterBtn.addEventListener('click', function () {
            addShelter(state, elements, mapCtx, mapWrapper);
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.evacStartBtn) {
        elements.evacStartBtn.addEventListener('click', function () {
            startEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.evacPauseBtn) {
        elements.evacPauseBtn.addEventListener('click', function () {
            pauseEvacAnimation(elements);
        });
    }

    if (elements.evacResetBtn) {
        elements.evacResetBtn.addEventListener('click', function () {
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        });
    }

    if (elements.evacSpeed) {
        elements.evacSpeed.addEventListener('change', function (e: Event) {
            const speed = parseFloat((e.target as HTMLInputElement).value);
            setSpeed(speed);
        });
    }

    document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element) {
        btn.addEventListener('click', function () {
            handleBuildingViewToggle((btn as HTMLElement).dataset.buildingView!, state, elements);
        });
    });

    if (elements.buildingCitySelect) {
        elements.buildingCitySelect.addEventListener('change', function () {
            updateBuildingDisplay(elements, state);
        });
    }

    mapCanvas.addEventListener('click', function (e: MouseEvent) {
        if (state.evacuationEnabled && state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null) {
            handleEvacCanvasClick(e, mapCanvas, state, mapCtx, mapWrapper, elements);
            resetEvacAnimation(state, elements, effectCtx, effectCanvas);
        } else {
            handleCanvasClick(e, mapCanvas, state, mapHint, dataElements, mapCtx, mapWrapper, elements);
        }
        updateBuildingDisplay(elements, state);
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            setupCanvas(mapCanvas, null, mapCtx, effectCtx, mapWrapper, state);
            updateAllCalculations(state);
            regenerateTerrainState();
            updateTerrainInfo(state, elements);
            updateDataDisplay(dataElements, state);
            drawMap(mapCtx, mapWrapper, state);
        }, 200);
    });

    let editingZoneKey: string | null = null;
    let draggedZoneIndex: number | null = null;

    function rgbToHex(r: number, g: number, b: number): string {
        return '#' + [r, g, b].map(function (x: number) {
            const hex = Math.round(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function refreshZoneList(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, dataElements: DataElements): void {
        if (!elements.zoneList) return;

        const zones = getZones();
        elements.zoneList.innerHTML = '';

        zones.forEach(function (zone: ZoneDef, index: number) {
            const item = document.createElement('div');
            item.className = 'zone-item';
            item.draggable = true;
            item.dataset.zoneKey = zone.key;
            item.dataset.index = String(index);

            const color = zone.color || [128, 128, 128];
            const hexColor = rgbToHex(color[0], color[1], color[2]);

            item.innerHTML = '<div class="zone-drag-handle" title="拖动排序">⋮⋮</div>' +
                '<div class="zone-color-preview" style="background: ' + hexColor + ';"></div>' +
                '<div class="zone-info">' +
                '<div class="zone-name">' + zone.label + '</div>' +
                '<div class="zone-key">' + zone.key + ' · ' + zone.overpressureThreshold + ' psi</div>' +
                '</div>' +
                '<div class="zone-actions">' +
                '<button class="zone-edit-btn" title="编辑">✏️</button>' +
                '<button class="zone-delete-btn" title="删除">🗑️</button>' +
                '</div>';

            item.addEventListener('dragstart', function (e: DragEvent) {
                draggedZoneIndex = index;
                item.classList.add('dragging');
                e.dataTransfer!.effectAllowed = 'move';
            });

            item.addEventListener('dragend', function () {
                item.classList.remove('dragging');
                draggedZoneIndex = null;
                document.querySelectorAll('.zone-item').forEach(function (el: Element) {
                    el.classList.remove('drag-over');
                });
            });

            item.addEventListener('dragover', function (e: DragEvent) {
                e.preventDefault();
                if (draggedZoneIndex !== null && draggedZoneIndex !== index) {
                    item.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', function () {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', function (e: DragEvent) {
                e.preventDefault();
                item.classList.remove('drag-over');
                if (draggedZoneIndex !== null && draggedZoneIndex !== index) {
                    const allZones = getZones();
                    const draggedKey = allZones[draggedZoneIndex].key;
                    moveZone(draggedKey, index);
                    refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
                }
            });

            const editBtn = item.querySelector('.zone-edit-btn')! as HTMLElement;
            editBtn.addEventListener('click', function (e: MouseEvent) {
                e.stopPropagation();
                openZoneEditor(zone, elements);
            });

            const deleteBtn = item.querySelector('.zone-delete-btn')! as HTMLElement;
            deleteBtn.addEventListener('click', function (e: MouseEvent) {
                e.stopPropagation();
                if (zones.length <= 1) {
                    alert('至少需要保留一个圈层！');
                    return;
                }
                if (confirm('确定要删除圈层 "' + zone.label + '" 吗？')) {
                    removeZone(zone.key);
                    refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
                }
            });

            elements.zoneList!.appendChild(item);
        });
    }

    function refreshAllZoneRelated(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, dataElements: DataElements): void {
        updateAllCalculations(state);
        generateDataPanels(dataElements);
        generateLegend(dataElements);
        updateDataDisplay(dataElements, state);
        drawMap(mapCtx, mapWrapper, state);
        refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements);
    }

    function openZoneEditor(zone: ZoneDef | null, elements: ControlElements): void {
        editingZoneKey = zone ? zone.key : null;

        if (zone) {
            elements.zoneEditorTitle!.textContent = '编辑圈层: ' + zone.label;
            (elements.zoneKey as HTMLInputElement)!.value = zone.key;
            (elements.zoneLabel as HTMLInputElement)!.value = zone.label;
            const colorHex = rgbToHex(zone.color[0], zone.color[1], zone.color[2]);
            (elements.zoneColor as HTMLInputElement)!.value = colorHex;
            (elements.zoneColorText as HTMLInputElement)!.value = colorHex;
            (elements.zoneDescription as HTMLTextAreaElement)!.value = zone.description || '';
            (elements.zoneMinRadius as HTMLInputElement)!.value = String(zone.minRadius || 0.5);
            (elements.zoneRadiusFormula as HTMLInputElement)!.value = zone.radiusFormula || '';
            (elements.zoneHeightFactor as HTMLSelectElement)!.value = zone.heightFactorType || 'height';
            (elements.zoneDash as HTMLSelectElement)!.value = typeof zone.dash === 'string' ? zone.dash : (zone.dash ? 'dashed4' : 'solid');
            (elements.zoneOverpressure as HTMLInputElement)!.value = String(zone.overpressureThreshold || 5);
            (elements.zoneAltitudeSens as HTMLInputElement)!.value = String(zone.altitudeSensitivity || 0.3);
            elements.zoneAltitudeSensValue!.textContent = (zone.altitudeSensitivity || 0.3).toFixed(2);
            (elements.zoneDestroyed as HTMLInputElement)!.checked = zone.casualtyRates ? zone.casualtyRates.destroyed : false;
            (elements.zoneDeathRate as HTMLInputElement)!.value = String(zone.casualtyRates ? zone.casualtyRates.deaths : 0.1);
            elements.zoneDeathRateValue!.textContent = (zone.casualtyRates ? zone.casualtyRates.deaths : 0.1).toFixed(2);
            (elements.zoneInjuryRate as HTMLInputElement)!.value = String(zone.casualtyRates ? zone.casualtyRates.injured : 0.2);
            elements.zoneInjuryRateValue!.textContent = (zone.casualtyRates ? zone.casualtyRates.injured : 0.2).toFixed(2);
        } else {
            elements.zoneEditorTitle!.textContent = '新增圈层';
            (elements.zoneKey as HTMLInputElement)!.value = '';
            (elements.zoneLabel as HTMLInputElement)!.value = '';
            (elements.zoneColor as HTMLInputElement)!.value = '#ff6600';
            (elements.zoneColorText as HTMLInputElement)!.value = '#ff6600';
            (elements.zoneDescription as HTMLTextAreaElement)!.value = '';
            (elements.zoneMinRadius as HTMLInputElement)!.value = '0.5';
            (elements.zoneRadiusFormula as HTMLInputElement)!.value = '1.0 * Math.pow(W, 0.4)';
            (elements.zoneHeightFactor as HTMLSelectElement)!.value = 'height';
            (elements.zoneDash as HTMLSelectElement)!.value = 'solid';
            (elements.zoneOverpressure as HTMLInputElement)!.value = '5';
            (elements.zoneAltitudeSens as HTMLInputElement)!.value = '0.3';
            elements.zoneAltitudeSensValue!.textContent = '0.30';
            (elements.zoneDestroyed as HTMLInputElement)!.checked = false;
            (elements.zoneDeathRate as HTMLInputElement)!.value = '0.1';
            elements.zoneDeathRateValue!.textContent = '0.10';
            (elements.zoneInjuryRate as HTMLInputElement)!.value = '0.2';
            elements.zoneInjuryRateValue!.textContent = '0.20';
        }

        elements.zoneEditorModal!.style.display = 'flex';
    }

    function closeZoneEditor(elements: ControlElements): void {
        elements.zoneEditorModal!.style.display = 'none';
        editingZoneKey = null;
    }

    function handleZoneSave(state: AppState, elements: ControlElements, mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, dataElements: DataElements): void {
        const key = (elements.zoneKey as HTMLInputElement)!.value.trim();
        const label = (elements.zoneLabel as HTMLInputElement)!.value.trim();

        if (!key || !label) {
            alert('圈层标识和名称不能为空！');
            return;
        }

        if (!/^[a-z_][a-z0-9_]*$/i.test(key)) {
            alert('圈层标识只能包含字母、数字和下划线，且必须以字母或下划线开头！');
            return;
        }

        const colorMatch = (elements.zoneColorText as HTMLInputElement)!.value.match(/^#?([0-9a-f]{6})$/i);
        if (!colorMatch) {
            alert('请输入有效的颜色值（如 #ff0000）！');
            return;
        }

        const colorHex = colorMatch[1];
        const color = [
            parseInt(colorHex.substr(0, 2), 16),
            parseInt(colorHex.substr(2, 2), 16),
            parseInt(colorHex.substr(4, 2), 16)
        ];

        let dashValue: string | null = (elements.zoneDash as HTMLSelectElement)!.value;
        if (dashValue === 'solid') dashValue = null;

        const zoneDef: ZoneDef = {
            key: key,
            label: label,
            color: color,
            description: (elements.zoneDescription as HTMLTextAreaElement)!.value.trim(),
            minRadius: parseFloat((elements.zoneMinRadius as HTMLInputElement)!.value) || 0.1,
            radiusFormula: (elements.zoneRadiusFormula as HTMLInputElement)!.value.trim(),
            heightFactorType: (elements.zoneHeightFactor as HTMLSelectElement)!.value,
            dash: dashValue,
            overpressureThreshold: parseFloat((elements.zoneOverpressure as HTMLInputElement)!.value) || 0,
            altitudeSensitivity: parseFloat((elements.zoneAltitudeSens as HTMLInputElement)!.value) || 0,
            casualtyRates: {
                deaths: parseFloat((elements.zoneDeathRate as HTMLInputElement)!.value) || 0,
                injured: parseFloat((elements.zoneInjuryRate as HTMLInputElement)!.value) || 0,
                destroyed: (elements.zoneDestroyed as HTMLInputElement)!.checked
            }
        };

        let result: ZoneOperationResult;
        if (editingZoneKey) {
            result = updateZone(editingZoneKey, zoneDef);
        } else {
            result = addZone(zoneDef);
        }

        if (result.success) {
            closeZoneEditor(elements);
            refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
        } else {
            alert('保存失败: ' + result.error);
        }
    }

    if (elements.addZoneBtn) {
        elements.addZoneBtn.addEventListener('click', function () {
            openZoneEditor(null, elements);
        });
    }

    if (elements.resetZonesBtn) {
        elements.resetZonesBtn.addEventListener('click', function () {
            if (confirm('确定要恢复所有默认圈层设置吗？当前的自定义修改将丢失。')) {
                resetZones();
                refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
            }
        });
    }

    if (elements.zoneEditorClose) {
        elements.zoneEditorClose.addEventListener('click', function () {
            closeZoneEditor(elements);
        });
    }

    if (elements.zoneEditorOverlay) {
        elements.zoneEditorOverlay.addEventListener('click', function () {
            closeZoneEditor(elements);
        });
    }

    if (elements.zoneEditorCancel) {
        elements.zoneEditorCancel.addEventListener('click', function () {
            closeZoneEditor(elements);
        });
    }

    if (elements.zoneEditorSave) {
        elements.zoneEditorSave.addEventListener('click', function () {
            handleZoneSave(state, elements, mapCtx, mapWrapper, dataElements);
        });
    }

    if (elements.zoneColor && elements.zoneColorText) {
        (elements.zoneColor as HTMLInputElement).addEventListener('input', function () {
            (elements.zoneColorText as HTMLInputElement).value = (elements.zoneColor as HTMLInputElement).value;
        });
        (elements.zoneColorText as HTMLInputElement).addEventListener('input', function () {
            if (/^#?[0-9a-f]{6}$/i.test((elements.zoneColorText as HTMLInputElement).value)) {
                (elements.zoneColor as HTMLInputElement).value = (elements.zoneColorText as HTMLInputElement).value.startsWith('#')
                    ? (elements.zoneColorText as HTMLInputElement).value
                    : '#' + (elements.zoneColorText as HTMLInputElement).value;
            }
        });
    }

    if (elements.zoneAltitudeSens && elements.zoneAltitudeSensValue) {
        (elements.zoneAltitudeSens as HTMLInputElement).addEventListener('input', function () {
            elements.zoneAltitudeSensValue!.textContent = parseFloat((elements.zoneAltitudeSens as HTMLInputElement).value).toFixed(2);
        });
    }

    if (elements.zoneDeathRate && elements.zoneDeathRateValue) {
        (elements.zoneDeathRate as HTMLInputElement).addEventListener('input', function () {
            elements.zoneDeathRateValue!.textContent = parseFloat((elements.zoneDeathRate as HTMLInputElement).value).toFixed(2);
        });
    }

    if (elements.zoneInjuryRate && elements.zoneInjuryRateValue) {
        (elements.zoneInjuryRate as HTMLInputElement).addEventListener('input', function () {
            elements.zoneInjuryRateValue!.textContent = parseFloat((elements.zoneInjuryRate as HTMLInputElement).value).toFixed(2);
        });
    }

    generateDataPanels(dataElements);
    generateLegend(dataElements);
    refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements);
}
