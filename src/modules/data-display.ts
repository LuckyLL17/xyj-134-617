import { DataElements, AppState, ZoneDef, AllCitiesBuildingDamageResult, Explosion, City } from '../types/index.js';
import { getZones, BUILDING_TYPES, BUILDING_TYPE_ORDER, DAMAGE_LEVELS, calculateRadii, calculateCasualtiesTerrainAware, calculateAffectedArea, calculateEnergy, calculateAllCombinedStats, calculateCityBuildingDamage, calculateAllCitiesBuildingDamage, calculateAvgStructureFactor, getOverpressureAtDistance } from './physics.ts';

export function rgba(r: number, g: number, b: number, a: number): string {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

export function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgba(r, g, b, alpha);
}

export function formatNumber(num: number): string {
    if (!isFinite(num)) return '0';
    if (num >= 100000000) return (num / 100000000).toFixed(2) + ' 亿';
    if (num >= 10000) return (num / 10000).toFixed(1) + ' 万';
    return Math.round(num).toLocaleString();
}

const elementIds: string[] = [
    'estimatedDeaths', 'estimatedInjured', 'affectedArea', 'energyReleased',
    'statExplosionCount', 'statCombinedArea', 'statTotalArea', 'statOverlapArea',
    'buildingTotalPop', 'buildingDestroyedPop', 'buildingAvgStrength',
    'buildingSurvivalRate', 'maxOverpressure', 'overpressureBar',
    'buildingTypeList', 'damageBarChart', 'damageStatsList',
    'buildingCitySelect', 'buildingSummaryView', 'buildingByTypeView', 'buildingByDamageView',
    'dataPanels', 'legendItems'
];

let radiusElementMap: Record<string, { radius: HTMLElement | null; diameter: HTMLElement | null }> = {};

export function generateDataPanels(elements: DataElements): void {
    if (!elements.dataPanels) return;

    const zones: ZoneDef[] = getZones();
    elements.dataPanels.innerHTML = '';
    radiusElementMap = {};

    zones.forEach(function (zone: ZoneDef) {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.dataset.zoneKey = zone.key;

        const colorStyle = zone.color ? `border-left: 3px solid rgb(${zone.color[0]}, ${zone.color[1]}, ${zone.color[2]});` : '';
        card.setAttribute('style', colorStyle);

        const radiusId = zone.key + 'Radius';
        const diameterId = zone.key + 'Diameter';

        card.innerHTML = `
                <h4>${zone.label}</h4>
                <div class="data-value"><span id="${radiusId}">0</span> <span class="unit">公里</span></div>
                <div class="data-desc">${zone.key === 'fireball' ? '直径约 <span id="' + diameterId + '">0</span> 公里' : (zone.description || zone.overpressureThreshold + ' psi 超压')}</div>
            `;

        elements.dataPanels!.appendChild(card);

        radiusElementMap[zone.key] = {
            radius: document.getElementById(radiusId),
            diameter: document.getElementById(diameterId)
        };
    });
}

export function generateLegend(elements: DataElements): void {
    if (!elements.legendItems) return;

    const zones: ZoneDef[] = getZones();
    elements.legendItems.innerHTML = '';

    zones.forEach(function (zone: ZoneDef) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.dataset.zoneKey = zone.key;

        const color = zone.color || [128, 128, 128];
        const colorStyle = `background: rgb(${color[0]}, ${color[1]}, ${color[2]});`;

        item.innerHTML = `
                <span class="legend-color" style="${colorStyle}"></span>
                <div class="legend-text">
                    <strong>${zone.label}</strong>
                    <span>${zone.description || ''}</span>
                </div>
            `;

        elements.legendItems!.appendChild(item);
    });
}

export function getElements(): DataElements {
    const elements: DataElements = {};
    elementIds.forEach(function (id: string) {
        elements[id] = document.getElementById(id);
    });
    return elements;
}

function getSelectedExplosion(state: AppState): Explosion | null {
    if (!state.selectedExplosionId) return null;
    return state.explosions.find(function (e: Explosion) { return e.id === state.selectedExplosionId; }) || null;
}

function updateRadiiDisplay(elements: DataElements, radii: Record<string, number> | null): void {
    const zones: ZoneDef[] = getZones();

    zones.forEach(function (zone: ZoneDef) {
        const radiusValue = radii && radii[zone.key] !== undefined ? radii[zone.key] : 0;
        const elementEntry = radiusElementMap[zone.key];

        if (elementEntry && elementEntry.radius) {
            elementEntry.radius.textContent = radiusValue.toFixed(2);
        }
        if (elementEntry && elementEntry.diameter) {
            elementEntry.diameter.textContent = (radiusValue * 2).toFixed(2);
        }
    });
}

function updateCombinedStats(elements: DataElements, stats: { count: number; combinedArea: number; totalArea: number; overlapArea: number }): void {
    elements.statExplosionCount!.textContent = String(stats.count);
    elements.statCombinedArea!.textContent = formatNumber(stats.combinedArea);
    elements.statTotalArea!.textContent = formatNumber(stats.totalArea);
    elements.statOverlapArea!.textContent = formatNumber(stats.overlapArea);
}

export function updateDataDisplay(elements: DataElements, state: AppState): void {
    const viewMode = state.viewMode || 'combined';

    if (!state.explosions || state.explosions.length === 0) {
        updateRadiiDisplay(elements, null);
        elements.estimatedDeaths!.textContent = '0';
        elements.estimatedInjured!.textContent = '0';
        elements.affectedArea!.textContent = '0';
        elements.energyReleased!.textContent = '0';
        updateCombinedStats(elements, { count: 0, combinedArea: 0, totalArea: 0, overlapArea: 0 });
        if (elements.buildingSummaryView) {
            updateBuildingDisplay(elements, state);
        }
        return;
    }

    if (viewMode === 'selected') {
        const selected = getSelectedExplosion(state);
        if (selected) {
            const r = selected.radii || calculateRadii(selected.yieldKilotons, selected.burstHeight);
            updateRadiiDisplay(elements, r);

            const casualties = calculateCasualtiesTerrainAware(
                state.cities,
                [selected],
                state.scale,
                state.terrainData
            );
            elements.estimatedDeaths!.textContent = formatNumber(casualties.deaths);
            elements.estimatedInjured!.textContent = formatNumber(casualties.injured);

            const area = calculateAffectedArea(r);
            elements.affectedArea!.textContent = formatNumber(area);

            const energy = calculateEnergy(selected.yieldKilotons);
            elements.energyReleased!.textContent = formatNumber(energy);
        } else {
            updateRadiiDisplay(elements, null);
            elements.estimatedDeaths!.textContent = '0';
            elements.estimatedInjured!.textContent = '0';
            elements.affectedArea!.textContent = '0';
            elements.energyReleased!.textContent = '0';
        }
    } else {
        const stats = calculateAllCombinedStats(state.explosions, state.scale);

        const casualties = calculateCasualtiesTerrainAware(
            state.cities,
            state.explosions,
            state.scale,
            state.terrainData
        );

        const maxRadiiPerZone = getMaxRadiiAcrossExplosions(state.explosions);
        updateRadiiDisplay(elements, maxRadiiPerZone);

        elements.estimatedDeaths!.textContent = formatNumber(casualties.deaths);
        elements.estimatedInjured!.textContent = formatNumber(casualties.injured);
        elements.affectedArea!.textContent = formatNumber(stats.combinedArea);
        elements.energyReleased!.textContent = formatNumber(stats.totalEnergy);

        updateCombinedStats(elements, stats);
    }

    if (elements.buildingSummaryView) {
        updateBuildingDisplay(elements, state);
    }
}

function getMaxRadiiAcrossExplosions(explosions: Explosion[]): Record<string, number> {
    const zones: ZoneDef[] = getZones();
    const result: Record<string, number> = {};
    zones.forEach(function (z: ZoneDef) {
        result[z.key] = 0;
    });

    explosions.forEach(function (exp: Explosion) {
        if (!exp.radii) return;
        const radii = exp.radii;
        zones.forEach(function (z: ZoneDef) {
            if (radii[z.key] !== undefined && radii[z.key] > result[z.key]) {
                result[z.key] = radii[z.key];
            }
        });
    });
    return result;
}

function getBuildingDamageData(state: AppState, elements: DataElements): AllCitiesBuildingDamageResult | null {
    const explosions = state.explosions || [];
    const cities = state.cities || [];
    const terrain = state.terrainData;
    const scale = state.scale;
    const selectedCityIndex = elements.buildingCitySelect ? (elements.buildingCitySelect as HTMLSelectElement).value : '';

    if (!explosions || explosions.length === 0 || !cities || cities.length === 0) {
        return null;
    }

    const positionedExplosions = explosions.filter(function (e: Explosion) { return e.explosionCenter; });
    if (positionedExplosions.length === 0) return null;

    if (selectedCityIndex && selectedCityIndex !== '') {
        const cityIdx = parseInt(selectedCityIndex, 10);
        const city = cities[cityIdx];
        if (city) {
            const result = calculateCityBuildingDamage(city, positionedExplosions, scale, terrain);
            return {
                cityResults: [result],
                totalDeaths: Math.round(result.totalDeaths),
                totalInjured: Math.round(result.totalInjured),
                totalDestroyedPop: Math.round(result.totalDestroyedPop),
                totalPopulation: city.population,
                totalByDamage: result.distByDamage,
                totalByBuildingType: result.buildingResults,
                overallSurvivalRate: result.survivalRate,
                maxOverpressure: result.maxOverpressure,
                avgStructureFactor: result.avgStructureFactor,
                isSingleCity: true,
                cityName: city.name
            };
        }
    }

    return calculateAllCitiesBuildingDamage(cities, positionedExplosions, scale, terrain);
}

export function updateBuildingDisplay(elements: DataElements, state: AppState): void {
    if (!elements.buildingSummaryView) return;

    const data = getBuildingDamageData(state, elements);

    if (!data) {
        elements.buildingTotalPop!.textContent = formatNumber(state.cities.reduce(function (sum: number, c: City) { return sum + c.population; }, 0));
        elements.buildingDestroyedPop!.textContent = '0';
        elements.buildingAvgStrength!.textContent = '—';
        elements.buildingSurvivalRate!.textContent = '—';
        elements.maxOverpressure!.textContent = '0 psi';
        elements.overpressureBar!.style.width = '0%';
        elements.buildingTypeList!.innerHTML = '';
        elements.damageBarChart!.innerHTML = '';
        elements.damageStatsList!.innerHTML = '';
        return;
    }

    elements.buildingTotalPop!.textContent = formatNumber(data.totalPopulation);
    elements.buildingDestroyedPop!.textContent = formatNumber(data.totalDestroyedPop);

    const avgStrength = data.avgStructureFactor !== undefined
        ? data.avgStructureFactor.toFixed(2)
        : calculateOverallStructureFactor(state.cities).toFixed(2);
    elements.buildingAvgStrength!.textContent = avgStrength;

    const survivalPct = (data.overallSurvivalRate * 100).toFixed(1);
    elements.buildingSurvivalRate!.textContent = survivalPct + '%';

    const maxOp = data.maxOverpressure || getMaxOverpressure(state);
    elements.maxOverpressure!.textContent = maxOp.toFixed(2) + ' psi';
    const opPercent = Math.min(100, (maxOp / 20) * 100);
    elements.overpressureBar!.style.width = opPercent + '%';

    updateBuildingTypeList(elements, data);
    updateDamageDistribution(elements, data);
}

function calculateOverallStructureFactor(cities: City[]): number {
    let totalPop = 0;
    let weightedFactor = 0;
    cities.forEach(function (city: City) {
        const factor = calculateAvgStructureFactor(city.buildingDistribution);
        totalPop += city.population;
        weightedFactor += factor * city.population;
    });
    return totalPop > 0 ? weightedFactor / totalPop : 0;
}

function getMaxOverpressure(state: AppState): number {
    const explosions = state.explosions || [];
    const cities = state.cities || [];
    let maxOp = 0;
    explosions.forEach(function (exp: Explosion) {
        if (!exp.explosionCenter) return;
        const center = exp.explosionCenter;
        cities.forEach(function (city: City) {
            const dx = city.x - center.x;
            const dy = city.y - center.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);
            const distKm = distPx / state.scale;
            const op = getOverpressureAtDistance(exp.yieldKilotons, distKm, exp.burstHeight);
            if (op > maxOp) maxOp = op;
        });
    });
    return maxOp;
}

function updateBuildingTypeList(elements: DataElements, data: AllCitiesBuildingDamageResult): void {
    if (!elements.buildingTypeList) return;

    let html = '';
    let totalPop = data.totalPopulation;

    BUILDING_TYPE_ORDER.forEach(function (type: string) {
        const bt = BUILDING_TYPES[type];
        let typeData;

        if (data.isSingleCity) {
            typeData = data.totalByBuildingType[type];
        } else {
            typeData = data.totalByBuildingType[type];
        }

        if (!typeData) return;

        const pop = typeData.population || 0;
        const deaths = typeData.deaths || 0;
        const injured = typeData.injured || 0;
        const damageLevel = typeData.damageLevel || getOverallDamageLevel(typeData);
        const pct = totalPop > 0 ? (pop / totalPop * 100).toFixed(1) : 0;

        html += '<div class="building-type-item" style="border-left-color: ' + bt.color + ';">';
        html += '  <div class="building-type-header">';
        html += '    <div class="building-type-name">';
        html += '      <span class="building-type-color" style="background: ' + bt.color + ';"></span>';
        html += '      ' + bt.name;
        html += '    </div>';
        html += '    <div class="building-type-pop">' + formatNumber(pop) + ' (' + pct + '%)</div>';
        html += '  </div>';
        html += '  <div class="building-type-bar-container">';
        html += '    <div class="building-type-bar" style="width: ' + pct + '%; background: ' + bt.color + ';"></div>';
        html += '  </div>';
        html += '  <div class="building-type-stats">';
        html += '    <span class="building-type-damage" style="color: ' + DAMAGE_LEVELS[damageLevel].color + ';">';
        html += '      破坏：' + DAMAGE_LEVELS[damageLevel].name;
        html += '    </span>';
        html += '    <span>';
        html += '      <span class="building-type-deaths">死亡 ' + formatNumber(Math.round(deaths)) + '</span>';
        html += '      <span style="margin: 0 6px; color: var(--text-muted);">|</span>';
        html += '      <span class="building-type-injured">受伤 ' + formatNumber(Math.round(injured)) + '</span>';
        html += '    </span>';
        html += '  </div>';
        html += '</div>';
    });

    elements.buildingTypeList!.innerHTML = html;
}

function getOverallDamageLevel(typeData: { population?: number; deaths?: number; damageLevel?: string }): string {
    if (typeData.damageLevel) return typeData.damageLevel;

    const pop = typeData.population || 1;
    const deaths = typeData.deaths || 0;
    const deathRate = deaths / pop;

    if (deathRate > 0.7) return 'destroyed';
    if (deathRate > 0.4) return 'severe';
    if (deathRate > 0.15) return 'moderate';
    if (deathRate > 0.03) return 'light';
    return 'intact';
}

function updateDamageDistribution(elements: DataElements, data: AllCitiesBuildingDamageResult): void {
    if (!elements.damageBarChart || !elements.damageStatsList) return;

    const damageOrder: string[] = ['intact', 'light', 'moderate', 'severe', 'destroyed'];
    const totalPop = data.totalPopulation;

    let maxValue = 0;
    damageOrder.forEach(function (level: string) {
        const val = data.totalByDamage[level] || 0;
        if (val > maxValue) maxValue = val;
    });

    let barHtml = '';
    damageOrder.forEach(function (level: string) {
        const dl = DAMAGE_LEVELS[level];
        const val = data.totalByDamage[level] || 0;
        const heightPct = maxValue > 0 ? (val / maxValue * 100) : 0;
        const pct = totalPop > 0 ? (val / totalPop * 100).toFixed(1) : 0;

        barHtml += '<div class="damage-bar-item">';
        barHtml += '  <div class="damage-bar-value">' + formatNumber(Math.round(val)) + '</div>';
        barHtml += '  <div class="damage-bar-fill" style="height: ' + Math.max(4, heightPct) + '%; background: ' + dl.color + ';"></div>';
        barHtml += '  <div class="damage-bar-label">' + dl.name + '</div>';
        barHtml += '</div>';
    });
    elements.damageBarChart!.innerHTML = barHtml;

    let statsHtml = '';
    damageOrder.forEach(function (level: string) {
        const dl = DAMAGE_LEVELS[level];
        const val = data.totalByDamage[level] || 0;
        const pct = totalPop > 0 ? (val / totalPop * 100).toFixed(1) : 0;

        statsHtml += '<div class="damage-stat-row">';
        statsHtml += '  <div class="damage-stat-name">';
        statsHtml += '    <span class="damage-dot" style="background: ' + dl.color + ';"></span>';
        statsHtml += '    ' + dl.name;
        statsHtml += '  </div>';
        statsHtml += '  <div>';
        statsHtml += '    <span class="damage-stat-value">' + formatNumber(Math.round(val)) + ' 人</span>';
        statsHtml += '    <span class="damage-stat-percent">' + pct + '%</span>';
        statsHtml += '  </div>';
        statsHtml += '</div>';
    });
    elements.damageStatsList!.innerHTML = statsHtml;
}

export function populateBuildingCitySelect(elements: DataElements, cities: AppState['cities']): void {
    if (!elements.buildingCitySelect) return;

    const currentValue = (elements.buildingCitySelect as HTMLSelectElement).value;
    let html = '<option value="">全部城市汇总</option>';

    cities.forEach(function (city: City, idx: number) {
        html += '<option value="' + idx + '">' + city.name + ' (' + formatNumber(city.population) + '人)</option>';
    });

    (elements.buildingCitySelect as HTMLSelectElement).innerHTML = html;
    if (currentValue) {
        (elements.buildingCitySelect as HTMLSelectElement).value = currentValue;
    }
}
