import type {
  ZoneDef,
  Explosion,
  AppState,
  City,
  CombinedStats,
  CasualtyResult,
  BuildingTypeKey,
  DamageLevelKey,
  BuildingType,
  DamageLevel,
  CityBuildingDamageResult,
  AllCitiesBuildingDamageResult,
  Point,
  BombType,
  BombTypeKey,
  Shelter,
  TerrainFeatureType
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

interface RadiusElementEntry {
  radius: HTMLElement | null;
  diameter: HTMLElement | null;
}

interface BuildingDamageData {
  cityResults: CityBuildingDamageResult[];
  totalDeaths: number;
  totalInjured: number;
  totalDestroyedPop: number;
  totalPopulation: number;
  totalByDamage: Record<DamageLevelKey, number>;
  totalByBuildingType: Record<BuildingTypeKey, { population: number; deaths: number; injured: number }>;
  overallSurvivalRate: number;
  maxOverpressure?: number;
  avgStructureFactor?: number;
  isSingleCity?: boolean;
  cityName?: string;
}

(function (global: Window & typeof globalThis): void {
  'use strict';

  function rgba(r: number, g: number, b: number, a: number): string {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function hexToRgba(hex: string, alpha: number): string {
    const r: number = parseInt(hex.slice(1, 3), 16);
    const g: number = parseInt(hex.slice(3, 5), 16);
    const b: number = parseInt(hex.slice(5, 7), 16);
    return rgba(r, g, b, alpha);
  }

  function formatNumber(num: number): string {
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

  let radiusElementMap: Record<string, RadiusElementEntry> = {};

  function generateDataPanels(elements: DataElements): void {
    if (!elements.dataPanels) return;

    const zones: ZoneDef[] = global.Physics.getZones();
    elements.dataPanels.innerHTML = '';
    radiusElementMap = {};

    zones.forEach(function (zone: ZoneDef): void {
      const card: HTMLDivElement = document.createElement('div');
      card.className = 'data-card';
      card.dataset.zoneKey = zone.key;

      const colorStyle: string = zone.color ? `border-left: 3px solid rgb(${zone.color[0]}, ${zone.color[1]}, ${zone.color[2]});` : '';
      card.setAttribute('style', colorStyle);

      const radiusId: string = zone.key + 'Radius';
      const diameterId: string = zone.key + 'Diameter';

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

  function generateLegend(elements: DataElements): void {
    if (!elements.legendItems) return;

    const zones: ZoneDef[] = global.Physics.getZones();
    elements.legendItems.innerHTML = '';

    zones.forEach(function (zone: ZoneDef): void {
      const item: HTMLDivElement = document.createElement('div');
      item.className = 'legend-item';
      item.dataset.zoneKey = zone.key;

      const color: number[] = zone.color || [128, 128, 128];
      const colorStyle: string = `background: rgb(${color[0]}, ${color[1]}, ${color[2]});`;

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

  function getElements(): DataElements {
    const elements: Partial<DataElements> = {};
    elementIds.forEach(function (id: string): void {
      (elements as Record<string, HTMLElement | null>)[id] = document.getElementById(id);
    });
    return elements as DataElements;
  }

  function getSelectedExplosion(state: AppState): Explosion | null {
    if (!state.selectedExplosionId) return null;
    return state.explosions.find(function (e: Explosion): boolean { return e.id === state.selectedExplosionId; }) || null;
  }

  function updateRadiiDisplay(elements: DataElements, radii: Record<string, number> | null): void {
    const zones: ZoneDef[] = global.Physics.getZones();

    zones.forEach(function (zone: ZoneDef): void {
      const radiusValue: number = radii && radii[zone.key] !== undefined ? radii[zone.key] : 0;
      const elementEntry: RadiusElementEntry | undefined = radiusElementMap[zone.key];

      if (elementEntry && elementEntry.radius) {
        elementEntry.radius.textContent = radiusValue.toFixed(2);
      }
      if (elementEntry && elementEntry.diameter) {
        elementEntry.diameter.textContent = (radiusValue * 2).toFixed(2);
      }
    });
  }

  function updateCombinedStats(elements: DataElements, stats: CombinedStats): void {
    if (elements.statExplosionCount) elements.statExplosionCount.textContent = String(stats.count);
    if (elements.statCombinedArea) elements.statCombinedArea.textContent = formatNumber(stats.combinedArea);
    if (elements.statTotalArea) elements.statTotalArea.textContent = formatNumber(stats.totalArea);
    if (elements.statOverlapArea) elements.statOverlapArea.textContent = formatNumber(stats.overlapArea);
  }

  function updateDataDisplay(elements: DataElements, state: AppState): void {
    const viewMode: string = state.viewMode || 'combined';

    if (!state.explosions || state.explosions.length === 0) {
      updateRadiiDisplay(elements, null);
      if (elements.estimatedDeaths) elements.estimatedDeaths.textContent = '0';
      if (elements.estimatedInjured) elements.estimatedInjured.textContent = '0';
      if (elements.affectedArea) elements.affectedArea.textContent = '0';
      if (elements.energyReleased) elements.energyReleased.textContent = '0';
      updateCombinedStats(elements, { count: 0, combinedArea: 0, totalArea: 0, overlapArea: 0, totalEnergy: 0, perZone: {} });
      if (elements.buildingSummaryView) {
        updateBuildingDisplay(elements, state);
      }
      return;
    }

    if (viewMode === 'selected') {
      const selected: Explosion | null = getSelectedExplosion(state);
      if (selected) {
        const r: Record<string, number> = selected.radii || global.Physics.calculateRadii(selected.yieldKilotons, selected.burstHeight);
        updateRadiiDisplay(elements, r);

        const casualties: CasualtyResult = global.Physics.calculateCasualtiesTerrainAware(
          state.cities,
          [selected],
          state.scale,
          state.terrainData
        );
        if (elements.estimatedDeaths) elements.estimatedDeaths.textContent = formatNumber(casualties.deaths);
        if (elements.estimatedInjured) elements.estimatedInjured.textContent = formatNumber(casualties.injured);

        const area: number = global.Physics.calculateAffectedArea(r);
        if (elements.affectedArea) elements.affectedArea.textContent = formatNumber(area);

        const energy: number = global.Physics.calculateEnergy(selected.yieldKilotons);
        if (elements.energyReleased) elements.energyReleased.textContent = formatNumber(energy);
      } else {
        updateRadiiDisplay(elements, null);
        if (elements.estimatedDeaths) elements.estimatedDeaths.textContent = '0';
        if (elements.estimatedInjured) elements.estimatedInjured.textContent = '0';
        if (elements.affectedArea) elements.affectedArea.textContent = '0';
        if (elements.energyReleased) elements.energyReleased.textContent = '0';
      }
    } else {
      const stats: CombinedStats = global.Physics.calculateAllCombinedStats(state.explosions, state.scale);

      const casualties: CasualtyResult = global.Physics.calculateCasualtiesTerrainAware(
        state.cities,
        state.explosions,
        state.scale,
        state.terrainData
      );

      const maxRadiiPerZone: Record<string, number> = getMaxRadiiAcrossExplosions(state.explosions);
      updateRadiiDisplay(elements, maxRadiiPerZone);

      if (elements.estimatedDeaths) elements.estimatedDeaths.textContent = formatNumber(casualties.deaths);
      if (elements.estimatedInjured) elements.estimatedInjured.textContent = formatNumber(casualties.injured);
      if (elements.affectedArea) elements.affectedArea.textContent = formatNumber(stats.combinedArea);
      if (elements.energyReleased) elements.energyReleased.textContent = formatNumber(stats.totalEnergy);

      updateCombinedStats(elements, stats);
    }

    if (elements.buildingSummaryView) {
      updateBuildingDisplay(elements, state);
    }
  }

  function getMaxRadiiAcrossExplosions(explosions: Explosion[]): Record<string, number> {
    const zones: ZoneDef[] = global.Physics.getZones();
    const result: Record<string, number> = {};
    zones.forEach(function (z: ZoneDef): void {
      result[z.key] = 0;
    });

    explosions.forEach(function (exp: Explosion): void {
      if (!exp.radii) return;
      const radii: Record<string, number> = exp.radii;
      zones.forEach(function (z: ZoneDef): void {
        if (radii[z.key] !== undefined && radii[z.key] > result[z.key]) {
          result[z.key] = radii[z.key];
        }
      });
    });
    return result;
  }

  function getBuildingDamageData(state: AppState, elements: DataElements): BuildingDamageData | null {
    const explosions: Explosion[] = state.explosions || [];
    const cities: City[] = state.cities || [];
    const terrain: any = state.terrainData;
    const scale: number = state.scale;
    const selectedCityIndex: string = elements.buildingCitySelect ? elements.buildingCitySelect.value : '';

    if (!explosions || explosions.length === 0 || !cities || cities.length === 0) {
      return null;
    }

    const positionedExplosions: Explosion[] = explosions.filter(function (e: Explosion): boolean { return !!e.explosionCenter; });
    if (positionedExplosions.length === 0) return null;

    if (selectedCityIndex && selectedCityIndex !== '') {
      const cityIdx: number = parseInt(selectedCityIndex, 10);
      const city: City | undefined = cities[cityIdx];
      if (city) {
        const result: CityBuildingDamageResult = global.Physics.calculateCityBuildingDamage(city, positionedExplosions, scale, terrain);
        return {
          cityResults: [result],
          totalDeaths: Math.round(result.totalDeaths),
          totalInjured: Math.round(result.totalInjured),
          totalDestroyedPop: Math.round(result.totalDestroyedPop),
          totalPopulation: city.population,
          totalByDamage: result.distByDamage,
          totalByBuildingType: result.buildingResults as unknown as Record<BuildingTypeKey, { population: number; deaths: number; injured: number }>,
          overallSurvivalRate: result.survivalRate,
          maxOverpressure: result.maxOverpressure,
          avgStructureFactor: result.avgStructureFactor,
          isSingleCity: true,
          cityName: city.name
        };
      }
    }

    return global.Physics.calculateAllCitiesBuildingDamage(cities, positionedExplosions, scale, terrain);
  }

  function updateBuildingDisplay(elements: DataElements, state: AppState): void {
    if (!elements.buildingSummaryView) return;

    const data: BuildingDamageData | null = getBuildingDamageData(state, elements);

    if (!data) {
      if (elements.buildingTotalPop) elements.buildingTotalPop.textContent = formatNumber(state.cities.reduce(function (sum: number, c: City): number { return sum + c.population; }, 0));
      if (elements.buildingDestroyedPop) elements.buildingDestroyedPop.textContent = '0';
      if (elements.buildingAvgStrength) elements.buildingAvgStrength.textContent = '—';
      if (elements.buildingSurvivalRate) elements.buildingSurvivalRate.textContent = '—';
      if (elements.maxOverpressure) elements.maxOverpressure.textContent = '0 psi';
      if (elements.overpressureBar) elements.overpressureBar.style.width = '0%';
      if (elements.buildingTypeList) elements.buildingTypeList.innerHTML = '';
      if (elements.damageBarChart) elements.damageBarChart.innerHTML = '';
      if (elements.damageStatsList) elements.damageStatsList.innerHTML = '';
      return;
    }

    if (elements.buildingTotalPop) elements.buildingTotalPop.textContent = formatNumber(data.totalPopulation);
    if (elements.buildingDestroyedPop) elements.buildingDestroyedPop.textContent = formatNumber(data.totalDestroyedPop);

    const avgStrength: string = data.avgStructureFactor !== undefined
      ? data.avgStructureFactor.toFixed(2)
      : calculateOverallStructureFactor(state.cities).toFixed(2);
    if (elements.buildingAvgStrength) elements.buildingAvgStrength.textContent = avgStrength;

    const survivalPct: string = (data.overallSurvivalRate * 100).toFixed(1);
    if (elements.buildingSurvivalRate) elements.buildingSurvivalRate.textContent = survivalPct + '%';

    const maxOp: number = data.maxOverpressure || getMaxOverpressure(state);
    if (elements.maxOverpressure) elements.maxOverpressure.textContent = maxOp.toFixed(2) + ' psi';
    const opPercent: number = Math.min(100, (maxOp / 20) * 100);
    if (elements.overpressureBar) elements.overpressureBar.style.width = opPercent + '%';

    updateBuildingTypeList(elements, data);
    updateDamageDistribution(elements, data);
  }

  function calculateOverallStructureFactor(cities: City[]): number {
    let totalPop: number = 0;
    let weightedFactor: number = 0;
    cities.forEach(function (city: City): void {
      const factor: number = global.Physics.calculateAvgStructureFactor(city.buildingDistribution);
      totalPop += city.population;
      weightedFactor += factor * city.population;
    });
    return totalPop > 0 ? weightedFactor / totalPop : 0;
  }

  function getMaxOverpressure(state: AppState): number {
    const explosions: Explosion[] = state.explosions || [];
    const cities: City[] = state.cities || [];
    let maxOp: number = 0;
    explosions.forEach(function (exp: Explosion): void {
      if (!exp.explosionCenter) return;
      cities.forEach(function (city: City): void {
        const dx: number = city.x - exp.explosionCenter!.x;
        const dy: number = city.y - exp.explosionCenter!.y;
        const distPx: number = Math.sqrt(dx * dx + dy * dy);
        const distKm: number = distPx / state.scale;
        const op: number = global.Physics.getOverpressureAtDistance(exp.yieldKilotons, distKm, exp.burstHeight);
        if (op > maxOp) maxOp = op;
      });
    });
    return maxOp;
  }

  function updateBuildingTypeList(elements: DataElements, data: BuildingDamageData): void {
    if (!elements.buildingTypeList) return;

    const BUILDING_TYPES: Record<BuildingTypeKey, BuildingType> = global.Physics.BUILDING_TYPES;
    const BUILDING_TYPE_ORDER: BuildingTypeKey[] = global.Physics.BUILDING_TYPE_ORDER;
    const DAMAGE_LEVELS: Record<DamageLevelKey, DamageLevel> = global.Physics.DAMAGE_LEVELS;

    let html: string = '';
    const totalPop: number = data.totalPopulation;

    BUILDING_TYPE_ORDER.forEach(function (type: BuildingTypeKey): void {
      const bt: BuildingType = BUILDING_TYPES[type];
      let typeData: { population: number; deaths: number; injured: number; damageLevel?: DamageLevelKey } | undefined;

      typeData = data.totalByBuildingType[type];

      if (!typeData) return;

      const pop: number = typeData.population || 0;
      const deaths: number = typeData.deaths || 0;
      const injured: number = typeData.injured || 0;
      const damageLevel: DamageLevelKey = typeData.damageLevel || getOverallDamageLevel(typeData);
      const pct: string = totalPop > 0 ? (pop / totalPop * 100).toFixed(1) : '0';

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

    elements.buildingTypeList.innerHTML = html;
  }

  function getOverallDamageLevel(typeData: { population: number; deaths: number; damageLevel?: DamageLevelKey }): DamageLevelKey {
    if (typeData.damageLevel) return typeData.damageLevel;

    const pop: number = typeData.population || 1;
    const deaths: number = typeData.deaths || 0;
    const deathRate: number = deaths / pop;

    if (deathRate > 0.7) return 'destroyed';
    if (deathRate > 0.4) return 'severe';
    if (deathRate > 0.15) return 'moderate';
    if (deathRate > 0.03) return 'light';
    return 'intact';
  }

  function updateDamageDistribution(elements: DataElements, data: BuildingDamageData): void {
    if (!elements.damageBarChart || !elements.damageStatsList) return;

    const DAMAGE_LEVELS: Record<DamageLevelKey, DamageLevel> = global.Physics.DAMAGE_LEVELS;
    const damageOrder: DamageLevelKey[] = ['intact', 'light', 'moderate', 'severe', 'destroyed'];
    const totalPop: number = data.totalPopulation;

    let maxValue: number = 0;
    damageOrder.forEach(function (level: DamageLevelKey): void {
      const val: number = data.totalByDamage[level] || 0;
      if (val > maxValue) maxValue = val;
    });

    let barHtml: string = '';
    damageOrder.forEach(function (level: DamageLevelKey): void {
      const dl: DamageLevel = DAMAGE_LEVELS[level];
      const val: number = data.totalByDamage[level] || 0;
      const heightPct: number = maxValue > 0 ? (val / maxValue * 100) : 0;
      const pct: string = totalPop > 0 ? (val / totalPop * 100).toFixed(1) : '0';

      barHtml += '<div class="damage-bar-item">';
      barHtml += '  <div class="damage-bar-value">' + formatNumber(Math.round(val)) + '</div>';
      barHtml += '  <div class="damage-bar-fill" style="height: ' + Math.max(4, heightPct) + '%; background: ' + dl.color + ';"></div>';
      barHtml += '  <div class="damage-bar-label">' + dl.name + '</div>';
      barHtml += '</div>';
    });
    elements.damageBarChart.innerHTML = barHtml;

    let statsHtml: string = '';
    damageOrder.forEach(function (level: DamageLevelKey): void {
      const dl: DamageLevel = DAMAGE_LEVELS[level];
      const val: number = data.totalByDamage[level] || 0;
      const pct: string = totalPop > 0 ? (val / totalPop * 100).toFixed(1) : '0';

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
    elements.damageStatsList.innerHTML = statsHtml;
  }

  function populateBuildingCitySelect(elements: DataElements, cities: City[]): void {
    if (!elements.buildingCitySelect) return;

    const currentValue: string = elements.buildingCitySelect.value;
    let html: string = '<option value="">全部城市汇总</option>';

    cities.forEach(function (city: City, idx: number): void {
      html += '<option value="' + idx + '">' + city.name + ' (' + formatNumber(city.population) + '人)</option>';
    });

    elements.buildingCitySelect.innerHTML = html;
    if (currentValue) {
      elements.buildingCitySelect.value = currentValue;
    }
  }

  global.DataDisplay = {
    rgba: rgba,
    hexToRgba: hexToRgba,
    formatNumber: formatNumber,
    getElements: getElements,
    generateDataPanels: generateDataPanels,
    generateLegend: generateLegend,
    updateDataDisplay: updateDataDisplay,
    updateBuildingDisplay: updateBuildingDisplay,
    populateBuildingCitySelect: populateBuildingCitySelect
  };

})(window);
