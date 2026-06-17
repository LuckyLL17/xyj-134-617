import type {
  UIElements,
  DataDisplayElements,
  ZoneDef,
  BombType,
  Road,
  Explosion,
  AppState,
  Point,
  TerrainFeature,
  City,
  Shelter,
  EvacuationPlan
} from '../types';

(function (global: Window): void {
    'use strict';

    const BOMB_TYPES: { [key: string]: BombType } = global.Physics.BOMB_TYPES;

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

    function getControlElements(): UIElements {
        const elements: UIElements = {};
        controlElementIds.forEach(function (id: string): void {
            elements[id] = document.getElementById(id);
        });
        return elements;
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
        const bomb: BombType | undefined = BOMB_TYPES[bombType];
        return bomb ? bomb.name : '自定义';
    }

    function refreshExplosionList(state: AppState, elements: UIElements): void {
        const list: HTMLElement = elements.explosionList as HTMLElement;
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

        (elements.explosionCount as HTMLElement).textContent = String(state.explosions.length);
        updateParamTargetLabel(state, elements);
    }

    function updateParamTargetLabel(state: AppState, elements: UIElements): void {
        const index: number = state.explosions.findIndex(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; });
        if (index >= 0) {
            (elements.paramTarget as HTMLElement).textContent = '（爆炸点 #' + (index + 1) + '）';
        } else {
            (elements.paramTarget as HTMLElement).textContent = '（无选中）';
        }
    }

    function syncControlsFromSelected(state: AppState, elements: UIElements): void {
        const selected: Explosion | null = getSelectedExplosion(state);
        if (!selected) return;

        (elements.bombType as HTMLSelectElement).value = selected.bombType;
        (elements.yieldSlider as HTMLInputElement).value = String(selected.yieldKilotons);
        (elements.yieldValue as HTMLElement).textContent = selected.yieldKilotons.toLocaleString();
        (elements.burstHeight as HTMLInputElement).value = String(selected.burstHeight);
    }

    function syncTerrainControlsFromState(state: AppState, elements: UIElements): void {
        if (elements.terrainEnabled) (elements.terrainEnabled as HTMLInputElement).checked = state.terrainEnabled;
        if (elements.terrainPreset) (elements.terrainPreset as HTMLSelectElement).value = state.terrainPreset;
        if (elements.terrainIntensity) (elements.terrainIntensity as HTMLInputElement).value = String(state.terrainIntensity);
        if (elements.terrainIntensityValue) (elements.terrainIntensityValue as HTMLElement).textContent = state.terrainIntensity.toFixed(1);
        if (elements.showTerrainHeatmap) (elements.showTerrainHeatmap as HTMLInputElement).checked = state.showTerrainHeatmap;
        if (elements.showTerrainContours) (elements.showTerrainContours as HTMLInputElement).checked = state.showTerrainContours;
        updateTerrainInfo(state, elements);
    }

    function syncStateFromTerrainControls(state: AppState, elements: UIElements): void {
        if (elements.terrainEnabled) state.terrainEnabled = (elements.terrainEnabled as HTMLInputElement).checked;
        if (elements.terrainPreset) state.terrainPreset = (elements.terrainPreset as HTMLSelectElement).value;
        if (elements.terrainIntensity) state.terrainIntensity = parseFloat((elements.terrainIntensity as HTMLInputElement).value);
        if (elements.showTerrainHeatmap) state.showTerrainHeatmap = (elements.showTerrainHeatmap as HTMLInputElement).checked;
        if (elements.showTerrainContours) state.showTerrainContours = (elements.showTerrainContours as HTMLInputElement).checked;
    }

    function updateTerrainInfo(state: AppState, elements: UIElements): void {
        if (!state.terrainData || !state.terrainData.features) {
            if (elements.mountainCount) (elements.mountainCount as HTMLElement).textContent = '0';
            if (elements.hillCount) (elements.hillCount as HTMLElement).textContent = '0';
            if (elements.basinCount) (elements.basinCount as HTMLElement).textContent = '0';
            if (elements.maxElevation) (elements.maxElevation as HTMLElement).textContent = '0';
            return;
        }

        const FEATURE_TYPES: { [key: string]: string } = global.Physics.TERRAIN_FEATURE_TYPES;
        let mountainCount: number = 0, hillCount: number = 0, basinCount: number = 0, maxElev: number = 0;

        state.terrainData.features.forEach(function (f: TerrainFeature): void {
            if (f.type === FEATURE_TYPES.MOUNTAIN) mountainCount++;
            else if (f.type === FEATURE_TYPES.HILL) hillCount++;
            else if (f.type === FEATURE_TYPES.BASIN) basinCount++;
            if (f.heightPx > maxElev) maxElev = f.heightPx;
        });

        if (elements.mountainCount) (elements.mountainCount as HTMLElement).textContent = String(mountainCount);
        if (elements.hillCount) (elements.hillCount as HTMLElement).textContent = String(hillCount);
        if (elements.basinCount) (elements.basinCount as HTMLElement).textContent = String(basinCount);
        if (elements.maxElevation) (elements.maxElevation as HTMLElement).textContent = Math.round(maxElev).toLocaleString();
    }

    function regenerateTerrain(
        state: AppState,
        elements: UIElements,
        mapCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement,
        dataElements: DataDisplayElements,
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

    function syncSelectedFromControls(state: AppState, elements: UIElements): void {
        const selected: Explosion | null = getSelectedExplosion(state);
        if (!selected) return;

        selected.bombType = (elements.bombType as HTMLSelectElement).value;
        selected.yieldKilotons = parseInt((elements.yieldSlider as HTMLInputElement).value, 10);
        selected.burstHeight = parseInt((elements.burstHeight as HTMLInputElement).value, 10);
    }

    function selectExplosion(state: AppState, id: number, elements: UIElements): void {
        state.selectedExplosionId = id;
        syncControlsFromSelected(state, elements);
        refreshExplosionList(state, elements);
    }

    function addExplosion(state: AppState, elements: UIElements, mapWrapper: HTMLElement, position?: Point): Explosion {
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

    function removeSelectedExplosion(state: AppState, elements: UIElements): void {
        if (state.explosions.length <= 1) {
            alert('至少需要保留 1 个爆炸点');
            return;
        }
        const index: number = state.explosions.findIndex(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; });
        if (index < 0) return;

        state.explosions.splice(index, 1);
        const newSelected: Explosion = state.explosions[Math.max(0, index - 1)];
        state.selectedExplosionId = newSelected ? newSelected.id : null;
        syncControlsFromSelected(state, elements);
        refreshExplosionList(state, elements);
    }

    function handleCanvasClick(
        e: MouseEvent,
        mapCanvas: HTMLCanvasElement,
        state: AppState,
        mapHint: HTMLElement,
        dataElements: DataDisplayElements,
        mapCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement,
        elements: UIElements
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
            (currentSelected as Explosion).explosionCenter = { x: x, y: y };
            mapHint.classList.add('hidden');
            updateCalculationsForExplosion(currentSelected as Explosion);
            refreshExplosionList(state, elements);
        }

        global.DataDisplay.updateDataDisplay(dataElements, state);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
    }

    function triggerDetonate(
        state: AppState,
        elements: UIElements,
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

        if (global.Timeline && (global.Timeline as any).isActive()) {
            (global.Timeline as any).stop();
        }

        (global.Animation as any).animateExplosion(effectCtx, effectCanvas, mapWrapper, state, elements, flashOverlay);
    }

    function resetAll(
        state: AppState,
        elements: UIElements,
        dataElements: DataDisplayElements,
        effectCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement,
        flashOverlay: HTMLElement,
        mapHint: HTMLElement,
        mapCtx: CanvasRenderingContext2D
    ): void {
        if (state.animationId) {
            cancelAnimationFrame(state.animationId);
        }

        if (global.Timeline && (global.Timeline as any).isActive()) {
            (global.Timeline as any).stop();
        }

        state.isAnimating = false;
        state.animationId = null;
        state.explosions = [];
        state.selectedExplosionId = null;

        (elements.detonateBtn as HTMLButtonElement).disabled = false;
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

    function handleViewToggle(view: string, state: AppState, elements: UIElements, dataElements: DataDisplayElements): void {
        state.viewMode = view;
        document.querySelectorAll('.toggle-btn').forEach(function (btn: Element): void {
            (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.view === view);
        });
        const combinedStats: HTMLElement | null = document.getElementById('combinedStats');
        if (combinedStats) {
            combinedStats.style.display = view === 'combined' ? 'block' : 'none';
        }
        global.DataDisplay.updateDataDisplay(dataElements, state);
    }

    function handleBuildingViewToggle(view: string, state: AppState, elements: UIElements): void {
        (state as any).buildingViewMode = view;
        document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element): void {
            (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.buildingView === view);
        });

        if (elements.buildingSummaryView) {
            (elements.buildingSummaryView as HTMLElement).style.display = view === 'summary' ? 'block' : 'none';
        }
        if (elements.buildingByTypeView) {
            (elements.buildingByTypeView as HTMLElement).style.display = view === 'byType' ? 'block' : 'none';
        }
        if (elements.buildingByDamageView) {
            (elements.buildingByDamageView as HTMLElement).style.display = view === 'byDamage' ? 'block' : 'none';
        }
    }

    function recalculateEvacuation(
        state: AppState,
        elements: UIElements,
        mapCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement
    ): void {
        if (!state.evacuationEnabled || !state.shelters || state.shelters.length === 0) {
            state.evacuationPlan = null;
            return;
        }

        const roads: Road[] = global.Physics.generateRoadNetwork(
            mapWrapper.clientWidth,
            mapWrapper.clientHeight,
            state.cities,
            state.shelters
        );
        state.evacuationRoads = roads;

        const capacityMultiplier: number = parseFloat(elements.roadCapacity ? (elements.roadCapacity as HTMLInputElement).value : '1');
        const adjustedRoads: Road[] = roads.map(function (road: Road): Road {
            return {
                ...road,
                capacity: (road.capacity ?? 1) * capacityMultiplier
            };
        });

        const warningTime: number = parseInt(elements.warningTimeSlider ? (elements.warningTimeSlider as HTMLInputElement).value : '30', 10);

        const originalSpeed: number = global.Physics.VEHICLE_SPEED_KMH;
        const customSpeed: number = parseInt(elements.vehicleSpeed ? (elements.vehicleSpeed as HTMLInputElement).value : '60', 10);
        (global.Physics as any).VEHICLE_SPEED_KMH = customSpeed;

        state.evacuationPlan = (global.Physics as any).calculateEvacuationPlan(
            state.cities,
            state.shelters,
            adjustedRoads,
            state.scale,
            warningTime
        );

        (global.Physics as any).VEHICLE_SPEED_KMH = originalSpeed;

        updateEvacuationDisplay(state, elements);
    }

    function updateEvacuationDisplay(state: AppState, elements: UIElements): void {
        const plan: EvacuationPlan | null = state.evacuationPlan;
        if (!plan) {
            if (elements.evacTotalPop) (elements.evacTotalPop as HTMLElement).textContent = '0';
            if (elements.evacEvacuated) (elements.evacEvacuated as HTMLElement).textContent = '0';
            if (elements.evacStranded) (elements.evacStranded as HTMLElement).textContent = '0';
            if (elements.evacRate) (elements.evacRate as HTMLElement).textContent = '0%';
            if (elements.evacProgress) (elements.evacProgress as HTMLElement).textContent = '0%';
            if (elements.evacProgressFill) (elements.evacProgressFill as HTMLElement).style.width = '0%';
            if (elements.evacTime) (elements.evacTime as HTMLElement).textContent = '0.0 小时';
            return;
        }

        if (elements.evacTotalPop) {
            (elements.evacTotalPop as HTMLElement).textContent = formatNumberShort(plan.totalPopulation);
        }
        if (elements.evacEvacuated) {
            (elements.evacEvacuated as HTMLElement).textContent = formatNumberShort((plan as any).totalEvacuated);
        }
        if (elements.evacStranded) {
            (elements.evacStranded as HTMLElement).textContent = formatNumberShort((plan as any).totalStranded);
        }
        if (elements.evacRate) {
            const rate: number = plan.evacuationRate * 100;
            if (rate < 0.1) {
                (elements.evacRate as HTMLElement).textContent = '<0.1%';
            } else if (rate < 1) {
                (elements.evacRate as HTMLElement).textContent = rate.toFixed(1) + '%';
            } else {
                (elements.evacRate as HTMLElement).textContent = Math.round(rate) + '%';
            }
        }

        const warningTime: number = parseInt(elements.warningTimeSlider ? (elements.warningTimeSlider as HTMLInputElement).value : '30', 10);
        if (elements.evacWarningTime) {
            (elements.evacWarningTime as HTMLElement).textContent = warningTime + ' 分钟';
        }
    }

    function formatNumberShort(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toString();
    }

    function findNearestShelter(x: number, y: number, state: AppState, threshold: number): { shelter: Shelter; index: number } | null {
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
        state: AppState,
        mapCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement,
        elements: UIElements
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
        state: AppState,
        elements: UIElements,
        mapCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement
    ): void {
        const rect: DOMRect = mapWrapper.getBoundingClientRect();
        const count: number = state.shelters ? state.shelters.length : 0;
        const angle: number = count * Math.PI * 0.5 + Math.random() * 0.5;
        const dist: number = Math.min(rect.width, rect.height) * (0.2 + Math.random() * 0.2);

        const newShelter: Shelter & { id: number; name: string } = {
            id: count,
            x: rect.width / 2 + Math.cos(angle) * dist,
            y: rect.height / 2 + Math.sin(angle) * dist,
            capacity: 500000 + Math.floor(Math.random() * 500000),
            name: '避难所 #' + (count + 1)
        } as any;

        if (!state.shelters) state.shelters = [];
        state.shelters.push(newShelter as any);
        state.selectedShelterIndex = state.shelters.length - 1;

        if (elements.shelterCount) {
            (elements.shelterCount as HTMLInputElement).value = String(state.shelters.length);
        }

        recalculateEvacuation(state, elements, mapCtx, mapWrapper);
        global.Renderer.drawMap(mapCtx, mapWrapper, state);
    }

    function updateShelterCount(
        state: AppState,
        elements: UIElements,
        mapCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement
    ): void {
        const count: number = parseInt((elements.shelterCount as HTMLInputElement).value, 10);
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
        state: AppState,
        elements: UIElements,
        effectCtx: CanvasRenderingContext2D,
        effectCanvas: HTMLCanvasElement
    ): void {
        if (!state.evacuationPlan) return;

        if ((global.Evacuation as any).isEvacuating()) {
            (global.Evacuation as any).stopEvacuationAnimation();
        }

        if (elements.evacStartBtn) {
            (elements.evacStartBtn as HTMLButtonElement).disabled = true;
            (elements.evacStartBtn as HTMLButtonElement).textContent = '▶ 播放中...';
        }
        if (elements.evacPauseBtn) {
            (elements.evacPauseBtn as HTMLButtonElement).disabled = false;
        }
        if (elements.evacModeBadge) {
            (elements.evacModeBadge as HTMLElement).textContent = '播放中';
            (elements.evacModeBadge as HTMLElement).classList.add('playing');
        }

        const speed: number = parseFloat(elements.evacSpeed ? (elements.evacSpeed as HTMLInputElement).value : '1');
        (global.Evacuation as any).setSpeed(speed);

        (global.Evacuation as any).startEvacuationAnimation(
            effectCtx,
            effectCanvas,
            state,
            elements,
            state.evacuationPlan
        );
    }

    function pauseEvacAnimation(elements: UIElements): void {
        if ((global.Evacuation as any).isEvacuating()) {
            (global.Evacuation as any).stopEvacuationAnimation();
        }
        if (elements.evacStartBtn) {
            (elements.evacStartBtn as HTMLButtonElement).disabled = false;
            (elements.evacStartBtn as HTMLButtonElement).textContent = '▶ 继续播放';
        }
        if (elements.evacPauseBtn) {
            (elements.evacPauseBtn as HTMLButtonElement).disabled = true;
        }
        if (elements.evacModeBadge) {
            (elements.evacModeBadge as HTMLElement).textContent = '已暂停';
            (elements.evacModeBadge as HTMLElement).classList.remove('playing');
        }
    }

    function resetEvacAnimation(
        state: AppState,
        elements: UIElements,
        effectCtx: CanvasRenderingContext2D,
        effectCanvas: HTMLCanvasElement
    ): void {
        (global.Evacuation as any).resetEvacuationAnimation(
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
            (elements.evacModeBadge as HTMLElement).textContent = '就绪';
            (elements.evacModeBadge as HTMLElement).classList.remove('playing');
        }
        if (elements.evacProgress) {
            (elements.evacProgress as HTMLElement).textContent = '0%';
        }
        if (elements.evacProgressFill) {
            (elements.evacProgressFill as HTMLElement).style.width = '0%';
        }
        if (elements.evacTime) {
            (elements.evacTime as HTMLElement).textContent = '0.0 小时';
        }
        updateEvacuationDisplay(state, elements);
    }

    function setupEventListeners(
        elements: UIElements,
        dataElements: DataDisplayElements,
        state: AppState,
        mapCanvas: HTMLCanvasElement,
        mapCtx: CanvasRenderingContext2D,
        effectCtx: CanvasRenderingContext2D,
        effectCanvas: HTMLCanvasElement,
        mapWrapper: HTMLElement,
        flashOverlay: HTMLElement,
        mapHint: HTMLElement
    ): void {
        (elements.bombType as HTMLSelectElement).addEventListener('change', function (e: Event): void {
            syncSelectedFromControls(state, elements);
            const selected: Explosion | null = getSelectedExplosion(state);
            if (selected && (e.target as HTMLSelectElement).value !== 'custom') {
                const bomb: BombType | undefined = BOMB_TYPES[(e.target as HTMLSelectElement).value];
                if (bomb) {
                    selected.yieldKilotons = bomb.yield;
                    (elements.yieldSlider as HTMLInputElement).value = String(bomb.yield);
                    (elements.yieldValue as HTMLElement).textContent = bomb.yield.toLocaleString();
                }
            }
            updateCalculationsForExplosion(getSelectedExplosion(state));
            refreshExplosionList(state, elements);
            global.DataDisplay.updateDataDisplay(dataElements, state);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        (elements.yieldSlider as HTMLInputElement).addEventListener('input', function (e: Event): void {
            syncSelectedFromControls(state, elements);
            (elements.bombType as HTMLSelectElement).value = 'custom';
            const selected: Explosion | null = getSelectedExplosion(state);
            if (selected) selected.bombType = 'custom';
            updateCalculationsForExplosion(getSelectedExplosion(state));
            refreshExplosionList(state, elements);
            global.DataDisplay.updateDataDisplay(dataElements, state);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        (elements.burstHeight as HTMLInputElement).addEventListener('change', function (): void {
            syncSelectedFromControls(state, elements);
            updateCalculationsForExplosion(getSelectedExplosion(state));
            refreshExplosionList(state, elements);
            global.DataDisplay.updateDataDisplay(dataElements, state);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        (elements.scaleSlider as HTMLInputElement).addEventListener('input', function (e: Event): void {
            state.scale = parseInt((e.target as HTMLInputElement).value, 10);
            (elements.scaleValue as HTMLElement).textContent = String(state.scale);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        (elements.showLabels as HTMLInputElement).addEventListener('change', function (e: Event): void {
            state.showLabels = (e.target as HTMLInputElement).checked;
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        (elements.showLegend as HTMLInputElement).addEventListener('change', function (e: Event): void {
            state.showLegend = (e.target as HTMLInputElement).checked;
            (elements.legend as HTMLElement).classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
        });

        (elements.addExplosionBtn as HTMLButtonElement).addEventListener('click', function (): void {
            if (state.isAnimating) return;
            addExplosion(state, elements, mapWrapper);
            global.DataDisplay.updateDataDisplay(dataElements, state);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        (elements.removeExplosionBtn as HTMLButtonElement).addEventListener('click', function (): void {
            if (state.isAnimating) return;
            removeSelectedExplosion(state, elements);
            global.DataDisplay.updateDataDisplay(dataElements, state);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
        });

        document.querySelectorAll('.toggle-btn').forEach(function (btn: Element): void {
            (btn as HTMLElement).addEventListener('click', function (): void {
                handleViewToggle((btn as HTMLElement).dataset.view as string, state, elements, dataElements);
            });
        });

        (elements.detonateBtn as HTMLButtonElement).addEventListener('click', function (): void {
            triggerDetonate(state, elements, effectCtx, effectCanvas, mapWrapper, flashOverlay);
        });

        (elements.resetBtn as HTMLButtonElement).addEventListener('click', function (): void {
            resetAll(state, elements, dataElements, effectCtx, mapWrapper, flashOverlay, mapHint, mapCtx);
        });

        if (elements.terrainEnabled) {
            (elements.terrainEnabled as HTMLInputElement).addEventListener('change', function (e: Event): void {
                state.terrainEnabled = (e.target as HTMLInputElement).checked;
                regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
            });
        }

        if (elements.terrainPreset) {
            (elements.terrainPreset as HTMLSelectElement).addEventListener('change', function (e: Event): void {
                state.terrainPreset = (e.target as HTMLSelectElement).value;
                regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
            });
        }

        if (elements.terrainIntensity) {
            (elements.terrainIntensity as HTMLInputElement).addEventListener('input', function (e: Event): void {
                state.terrainIntensity = parseFloat((e.target as HTMLInputElement).value);
                if (elements.terrainIntensityValue) {
                    (elements.terrainIntensityValue as HTMLElement).textContent = state.terrainIntensity.toFixed(1);
                }
                regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, false);
            });
        }

        if (elements.showTerrainHeatmap) {
            (elements.showTerrainHeatmap as HTMLInputElement).addEventListener('change', function (e: Event): void {
                state.showTerrainHeatmap = (e.target as HTMLInputElement).checked;
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
            });
        }

        if (elements.showTerrainContours) {
            (elements.showTerrainContours as HTMLInputElement).addEventListener('change', function (e: Event): void {
                state.showTerrainContours = (e.target as HTMLInputElement).checked;
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
            });
        }

        if (elements.regenerateTerrainBtn) {
            (elements.regenerateTerrainBtn as HTMLButtonElement).addEventListener('click', function (): void {
                regenerateTerrain(state, elements, mapCtx, mapWrapper, dataElements, true);
            });
        }

        if (elements.evacuationEnabled) {
            (elements.evacuationEnabled as HTMLInputElement).addEventListener('change', function (e: Event): void {
                state.evacuationEnabled = (e.target as HTMLInputElement).checked;
                if (state.evacuationEnabled && state.shelters && state.shelters.length > 0) {
                    recalculateEvacuation(state, elements, mapCtx, mapWrapper);
                }
                if (elements.evacuationPanel) {
                    (elements.evacuationPanel as HTMLElement).classList.toggle('hidden', !(e.target as HTMLInputElement).checked);
                }
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
            });
        }

        if (elements.shelterCount) {
            (elements.shelterCount as HTMLInputElement).addEventListener('change', function (): void {
                updateShelterCount(state, elements, mapCtx, mapWrapper);
            });
        }

        if (elements.warningTimeSlider) {
            (elements.warningTimeSlider as HTMLInputElement).addEventListener('input', function (e: Event): void {
                const value: number = parseInt((e.target as HTMLInputElement).value, 10);
                if (elements.warningTimeValue) {
                    (elements.warningTimeValue as HTMLElement).textContent = String(value);
                }
            });
            (elements.warningTimeSlider as HTMLInputElement).addEventListener('change', function (): void {
                recalculateEvacuation(state, elements, mapCtx, mapWrapper);
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.roadCapacity) {
            (elements.roadCapacity as HTMLInputElement).addEventListener('change', function (): void {
                recalculateEvacuation(state, elements, mapCtx, mapWrapper);
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.vehicleSpeed) {
            (elements.vehicleSpeed as HTMLInputElement).addEventListener('change', function (): void {
                recalculateEvacuation(state, elements, mapCtx, mapWrapper);
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.recalcEvacBtn) {
            (elements.recalcEvacBtn as HTMLButtonElement).addEventListener('click', function (): void {
                recalculateEvacuation(state, elements, mapCtx, mapWrapper);
                global.Renderer.drawMap(mapCtx, mapWrapper, state);
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.addShelterBtn) {
            (elements.addShelterBtn as HTMLButtonElement).addEventListener('click', function (): void {
                addShelter(state, elements, mapCtx, mapWrapper);
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.evacStartBtn) {
            (elements.evacStartBtn as HTMLButtonElement).addEventListener('click', function (): void {
                startEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.evacPauseBtn) {
            (elements.evacPauseBtn as HTMLButtonElement).addEventListener('click', function (): void {
                pauseEvacAnimation(elements);
            });
        }

        if (elements.evacResetBtn) {
            (elements.evacResetBtn as HTMLButtonElement).addEventListener('click', function (): void {
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            });
        }

        if (elements.evacSpeed) {
            (elements.evacSpeed as HTMLInputElement).addEventListener('change', function (e: Event): void {
                const speed: number = parseFloat((e.target as HTMLInputElement).value);
                (global.Evacuation as any).setSpeed(speed);
            });
        }

        document.querySelectorAll('.building-toggle-btn').forEach(function (btn: Element): void {
            (btn as HTMLElement).addEventListener('click', function (): void {
                handleBuildingViewToggle((btn as HTMLElement).dataset.buildingView as string, state, elements);
            });
        });

        if (elements.buildingCitySelect) {
            (elements.buildingCitySelect as HTMLSelectElement).addEventListener('change', function (): void {
                (global.DataDisplay as any).updateBuildingDisplay(elements, state);
            });
        }

        mapCanvas.addEventListener('click', function (e: MouseEvent): void {
            if (state.evacuationEnabled && state.selectedShelterIndex !== undefined && state.selectedShelterIndex !== null) {
                handleEvacCanvasClick(e, mapCanvas, state, mapCtx, mapWrapper, elements);
                resetEvacAnimation(state, elements, effectCtx, effectCanvas);
            } else {
                handleCanvasClick(e, mapCanvas, state, mapHint, dataElements, mapCtx, mapWrapper, elements);
            }
            (global.DataDisplay as any).updateBuildingDisplay(elements, state);
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
            elements: UIElements,
            mapCtx: CanvasRenderingContext2D,
            mapWrapper: HTMLElement,
            dataElements: DataDisplayElements
        ): void {
            if (!elements.zoneList) return;

            const zones: ZoneDef[] = global.Physics.getZones();
            (elements.zoneList as HTMLElement).innerHTML = '';

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
                    (e.dataTransfer as DataTransfer).effectAllowed = 'move';
                });

                item.addEventListener('dragend', function (): void {
                    item.classList.remove('dragging');
                    draggedZoneIndex = null;
                    document.querySelectorAll('.zone-item').forEach(function (el: Element): void {
                        (el as HTMLElement).classList.remove('drag-over');
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
                (editBtn as HTMLElement).addEventListener('click', function (e: Event): void {
                    e.stopPropagation();
                    openZoneEditor(zone, elements);
                });

                const deleteBtn: Element | null = item.querySelector('.zone-delete-btn');
                (deleteBtn as HTMLElement).addEventListener('click', function (e: Event): void {
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

                (elements.zoneList as HTMLElement).appendChild(item);
            });
        }

        function refreshAllZoneRelated(
            state: AppState,
            elements: UIElements,
            mapCtx: CanvasRenderingContext2D,
            mapWrapper: HTMLElement,
            dataElements: DataDisplayElements
        ): void {
            updateAllCalculations(state);
            global.DataDisplay.generateDataPanels(dataElements);
            global.DataDisplay.generateLegend(dataElements);
            global.DataDisplay.updateDataDisplay(dataElements, state);
            global.Renderer.drawMap(mapCtx, mapWrapper, state);
            refreshZoneList(state, elements, mapCtx, mapWrapper, dataElements);
        }

        function openZoneEditor(zone: ZoneDef | null, elements: UIElements): void {
            editingZoneKey = zone ? zone.key : null;

            if (zone) {
                (elements.zoneEditorTitle as HTMLElement).textContent = '编辑圈层: ' + zone.label;
                (elements.zoneKey as HTMLInputElement).value = zone.key;
                (elements.zoneLabel as HTMLInputElement).value = zone.label;
                const colorHex: string = rgbToHex(zone.color[0], zone.color[1], zone.color[2]);
                (elements.zoneColor as HTMLInputElement).value = colorHex;
                (elements.zoneColorText as HTMLInputElement).value = colorHex;
                (elements.zoneDescription as HTMLInputElement).value = zone.description || '';
                (elements.zoneMinRadius as HTMLInputElement).value = String(zone.minRadius || 0.5);
                (elements.zoneRadiusFormula as HTMLInputElement).value = zone.radiusFormula || '';
                (elements.zoneHeightFactor as HTMLSelectElement).value = zone.heightFactorType || 'height';
                (elements.zoneDash as HTMLSelectElement).value = typeof zone.dash === 'string' ? zone.dash : (zone.dash ? 'dashed4' : 'solid');
                (elements.zoneOverpressure as HTMLInputElement).value = String(zone.overpressureThreshold || 5);
                (elements.zoneAltitudeSens as HTMLInputElement).value = String(zone.altitudeSensitivity || 0.3);
                (elements.zoneAltitudeSensValue as HTMLElement).textContent = (zone.altitudeSensitivity || 0.3).toFixed(2);
                (elements.zoneDestroyed as HTMLInputElement).checked = zone.casualtyRates ? zone.casualtyRates.destroyed : false;
                (elements.zoneDeathRate as HTMLInputElement).value = String(zone.casualtyRates ? zone.casualtyRates.deaths : 0.1);
                (elements.zoneDeathRateValue as HTMLElement).textContent = (zone.casualtyRates ? zone.casualtyRates.deaths : 0.1).toFixed(2);
                (elements.zoneInjuryRate as HTMLInputElement).value = String(zone.casualtyRates ? zone.casualtyRates.injured : 0.2);
                (elements.zoneInjuryRateValue as HTMLElement).textContent = (zone.casualtyRates ? zone.casualtyRates.injured : 0.2).toFixed(2);
            } else {
                (elements.zoneEditorTitle as HTMLElement).textContent = '新增圈层';
                (elements.zoneKey as HTMLInputElement).value = '';
                (elements.zoneLabel as HTMLInputElement).value = '';
                (elements.zoneColor as HTMLInputElement).value = '#ff6600';
                (elements.zoneColorText as HTMLInputElement).value = '#ff6600';
                (elements.zoneDescription as HTMLInputElement).value = '';
                (elements.zoneMinRadius as HTMLInputElement).value = '0.5';
                (elements.zoneRadiusFormula as HTMLInputElement).value = '1.0 * Math.pow(W, 0.4)';
                (elements.zoneHeightFactor as HTMLSelectElement).value = 'height';
                (elements.zoneDash as HTMLSelectElement).value = 'solid';
                (elements.zoneOverpressure as HTMLInputElement).value = '5';
                (elements.zoneAltitudeSens as HTMLInputElement).value = '0.3';
                (elements.zoneAltitudeSensValue as HTMLElement).textContent = '0.30';
                (elements.zoneDestroyed as HTMLInputElement).checked = false;
                (elements.zoneDeathRate as HTMLInputElement).value = '0.1';
                (elements.zoneDeathRateValue as HTMLElement).textContent = '0.10';
                (elements.zoneInjuryRate as HTMLInputElement).value = '0.2';
                (elements.zoneInjuryRateValue as HTMLElement).textContent = '0.20';
            }

            (elements.zoneEditorModal as HTMLElement).style.display = 'flex';
        }

        function closeZoneEditor(elements: UIElements): void {
            (elements.zoneEditorModal as HTMLElement).style.display = 'none';
            editingZoneKey = null;
        }

        function handleZoneSave(
            state: AppState,
            elements: UIElements,
            mapCtx: CanvasRenderingContext2D,
            mapWrapper: HTMLElement,
            dataElements: DataDisplayElements
        ): void {
            const key: string = (elements.zoneKey as HTMLInputElement).value.trim();
            const label: string = (elements.zoneLabel as HTMLInputElement).value.trim();

            if (!key || !label) {
                alert('圈层标识和名称不能为空！');
                return;
            }

            if (!/^[a-z_][a-z0-9_]*$/i.test(key)) {
                alert('圈层标识只能包含字母、数字和下划线，且必须以字母或下划线开头！');
                return;
            }

            const colorMatch: RegExpMatchArray | null = (elements.zoneColorText as HTMLInputElement).value.match(/^#?([0-9a-f]{6})$/i);
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

            let dashValue: string | null = (elements.zoneDash as HTMLSelectElement).value;
            if (dashValue === 'solid') dashValue = null;

            const zoneDef: Partial<ZoneDef> & { key: string; label: string } = {
                key: key,
                label: label,
                color: color,
                description: (elements.zoneDescription as HTMLInputElement).value.trim(),
                minRadius: parseFloat((elements.zoneMinRadius as HTMLInputElement).value) || 0.1,
                radiusFormula: (elements.zoneRadiusFormula as HTMLInputElement).value.trim(),
                heightFactorType: (elements.zoneHeightFactor as HTMLSelectElement).value,
                dash: dashValue as any,
                overpressureThreshold: parseFloat((elements.zoneOverpressure as HTMLInputElement).value) || 0,
                altitudeSensitivity: parseFloat((elements.zoneAltitudeSens as HTMLInputElement).value) || 0,
                casualtyRates: {
                    deaths: parseFloat((elements.zoneDeathRate as HTMLInputElement).value) || 0,
                    injured: parseFloat((elements.zoneInjuryRate as HTMLInputElement).value) || 0,
                    destroyed: (elements.zoneDestroyed as HTMLInputElement).checked
                }
            };

            let result: { success: boolean; error?: string; zone?: ZoneDef };
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
            (elements.addZoneBtn as HTMLButtonElement).addEventListener('click', function (): void {
                openZoneEditor(null, elements);
            });
        }

        if (elements.resetZonesBtn) {
            (elements.resetZonesBtn as HTMLButtonElement).addEventListener('click', function (): void {
                if (confirm('确定要恢复所有默认圈层设置吗？当前的自定义修改将丢失。')) {
                    global.Physics.resetZones();
                    refreshAllZoneRelated(state, elements, mapCtx, mapWrapper, dataElements);
                }
            });
        }

        if (elements.zoneEditorClose) {
            (elements.zoneEditorClose as HTMLElement).addEventListener('click', function (): void {
                closeZoneEditor(elements);
            });
        }

        if (elements.zoneEditorOverlay) {
            (elements.zoneEditorOverlay as HTMLElement).addEventListener('click', function (): void {
                closeZoneEditor(elements);
            });
        }

        if (elements.zoneEditorCancel) {
            (elements.zoneEditorCancel as HTMLButtonElement).addEventListener('click', function (): void {
                closeZoneEditor(elements);
            });
        }

        if (elements.zoneEditorSave) {
            (elements.zoneEditorSave as HTMLButtonElement).addEventListener('click', function (): void {
                handleZoneSave(state, elements, mapCtx, mapWrapper, dataElements);
            });
        }

        if (elements.zoneColor && elements.zoneColorText) {
            (elements.zoneColor as HTMLInputElement).addEventListener('input', function (): void {
                (elements.zoneColorText as HTMLInputElement).value = (elements.zoneColor as HTMLInputElement).value;
            });
            (elements.zoneColorText as HTMLInputElement).addEventListener('input', function (): void {
                if (/^#?[0-9a-f]{6}$/i.test((elements.zoneColorText as HTMLInputElement).value)) {
                    (elements.zoneColor as HTMLInputElement).value = (elements.zoneColorText as HTMLInputElement).value.startsWith('#')
                        ? (elements.zoneColorText as HTMLInputElement).value
                        : '#' + (elements.zoneColorText as HTMLInputElement).value;
                }
            });
        }

        if (elements.zoneAltitudeSens && elements.zoneAltitudeSensValue) {
            (elements.zoneAltitudeSens as HTMLInputElement).addEventListener('input', function (): void {
                (elements.zoneAltitudeSensValue as HTMLElement).textContent = parseFloat((elements.zoneAltitudeSens as HTMLInputElement).value).toFixed(2);
            });
        }

        if (elements.zoneDeathRate && elements.zoneDeathRateValue) {
            (elements.zoneDeathRate as HTMLInputElement).addEventListener('input', function (): void {
                (elements.zoneDeathRateValue as HTMLElement).textContent = parseFloat((elements.zoneDeathRate as HTMLInputElement).value).toFixed(2);
            });
        }

        if (elements.zoneInjuryRate && elements.zoneInjuryRateValue) {
            (elements.zoneInjuryRate as HTMLInputElement).addEventListener('input', function (): void {
                (elements.zoneInjuryRateValue as HTMLElement).textContent = parseFloat((elements.zoneInjuryRate as HTMLInputElement).value).toFixed(2);
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
    } as any;

})(window);
