import type {
    AppState,
    Explosion,
    ZoneDef,
    City,
    AllCitiesBuildingDamageResult,
    CityBuildingDamageResult,
    DataDisplayElements,
    BuildingResult,
    DistByDamage,
    DamageLevelKey,
    BuildingType
} from '../types';

(function (global: Window) {
    'use strict';

    function rgba(r: number, g: number, b: number, a: number): string {
        return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    }

    function hexToRgba(hex: string, alpha: number): string {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
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

    interface RadiusElementMap {
        [key: string]: {
            radius: HTMLElement | null;
            diameter: HTMLElement | null;
        };
    }

    let radiusElementMap: RadiusElementMap = {};

    function generateDataPanels(elements: DataDisplayElements): void {
        if (!elements.dataPanels) return;

        const zones: ZoneDef[] = global.Physics.getZones();
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

            elements.dataPanels?.appendChild(card);

            radiusElementMap[zone.key] = {
                radius: document.getElementById(radiusId),
                diameter: document.getElementById(diameterId)
            };
        });
    }

    function generateLegend(elements: DataDisplayElements): void {
        if (!elements.legendItems) return;

        const zones: ZoneDef[] = global.Physics.getZones();
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

            elements.legendItems?.appendChild(item);
        });
    }

    function getElements(): DataDisplayElements {
        const elements: DataDisplayElements = {};
        elementIds.forEach(function (id: string) {
            elements[id] = document.getElementById(id);
        });
        return elements;
    }

    function getSelectedExplosion(state: AppState): Explosion | null {
        if (!state.selectedExplosionId) return null;
        return state.explosions.find(function (e: Explosion) { return e.id === state.selectedExplosionId; }) || null;
    }

    function updateRadiiDisplay(elements: DataDisplayElements, radii: { [key: string]: number } | null): void {
        const zones: ZoneDef[] = global.Physics.getZones();

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

    interface CombinedStats {
        count: number;
        combinedArea: number;
        totalArea: number;
        overlapArea: number;
    }

    function updateCombinedStats(elements: DataDisplayElements, stats: CombinedStats): void {
        if (elements.statExplosionCount) {
            elements.statExplosionCount.textContent = String(stats.count);
        }
        if (elements.statCombinedArea) {
            elements.statCombinedArea.textContent = formatNumber(stats.combinedArea);
        }
        if (elements.statTotalArea) {
            elements.statTotalArea.textContent = formatNumber(stats.totalArea);
        }
        if (elements.statOverlapArea) {
            elements.statOverlapArea.textContent = formatNumber(stats.overlapArea);
        }
    }

    function updateDataDisplay(elements: DataDisplayElements, state: AppState): void {
        const viewMode = state.viewMode || 'combined';

        if (!state.explosions || state.explosions.length === 0) {
            updateRadiiDisplay(elements, null);
            if (elements.estimatedDeaths) {
                elements.estimatedDeaths.textContent = '0';
            }
            if (elements.estimatedInjured) {
                elements.estimatedInjured.textContent = '0';
            }
            if (elements.affectedArea) {
                elements.affectedArea.textContent = '0';
            }
            if (elements.energyReleased) {
                elements.energyReleased.textContent = '0';
            }
            updateCombinedStats(elements, { count: 0, combinedArea: 0, totalArea: 0, overlapArea: 0 });
            if (elements.buildingSummaryView) {
                updateBuildingDisplay(elements, state);
            }
            return;
        }

        if (viewMode === 'selected') {
            const selected = getSelectedExplosion(state);
            if (selected) {
                const r = selected.radii || global.Physics.calculateRadii(selected.yieldKilotons, selected.burstHeight);
                updateRadiiDisplay(elements, r);

                const casualties = global.Physics.calculateCasualtiesTerrainAware(
                    state.cities,
                    [selected],
                    state.scale,
                    state.terrainData as any
                );
                if (elements.estimatedDeaths) {
                    elements.estimatedDeaths.textContent = formatNumber(casualties.deaths);
                }
                if (elements.estimatedInjured) {
                    elements.estimatedInjured.textContent = formatNumber(casualties.injured);
                }

                const area = global.Physics.calculateAffectedArea(r);
                if (elements.affectedArea) {
                    elements.affectedArea.textContent = formatNumber(area);
                }

                const energy = global.Physics.calculateEnergy(selected.yieldKilotons);
                if (elements.energyReleased) {
                    elements.energyReleased.textContent = formatNumber(energy);
                }
            } else {
                updateRadiiDisplay(elements, null);
                if (elements.estimatedDeaths) {
                    elements.estimatedDeaths.textContent = '0';
                }
                if (elements.estimatedInjured) {
                    elements.estimatedInjured.textContent = '0';
                }
                if (elements.affectedArea) {
                    elements.affectedArea.textContent = '0';
                }
                if (elements.energyReleased) {
                    elements.energyReleased.textContent = '0';
                }
            }
        } else {
            const stats = global.Physics.calculateAllCombinedStats(state.explosions, state.scale);

            const casualties = global.Physics.calculateCasualtiesTerrainAware(
                state.cities,
                state.explosions,
                state.scale,
                state.terrainData as any
            );

            const maxRadiiPerZone = getMaxRadiiAcrossExplosions(state.explosions);
            updateRadiiDisplay(elements, maxRadiiPerZone);

            if (elements.estimatedDeaths) {
                elements.estimatedDeaths.textContent = formatNumber(casualties.deaths);
            }
            if (elements.estimatedInjured) {
                elements.estimatedInjured.textContent = formatNumber(casualties.injured);
            }
            if (elements.affectedArea) {
                elements.affectedArea.textContent = formatNumber(stats.combinedArea);
            }
            if (elements.energyReleased) {
                elements.energyReleased.textContent = formatNumber(stats.totalEnergy);
            }

            updateCombinedStats(elements, stats);
        }

        if (elements.buildingSummaryView) {
            updateBuildingDisplay(elements, state);
        }
    }

    function getMaxRadiiAcrossExplosions(explosions: Explosion[]): { [key: string]: number } {
        const zones: ZoneDef[] = global.Physics.getZones();
        const result: { [key: string]: number } = {};
        zones.forEach(function (z: ZoneDef) {
            result[z.key] = 0;
        });

        explosions.forEach(function (exp: Explosion) {
            if (!exp.radii) return;
            zones.forEach(function (z: ZoneDef) {
                if (exp.radii && exp.radii[z.key] !== undefined && exp.radii[z.key] > result[z.key]) {
                    result[z.key] = exp.radii[z.key];
                }
            });
        });
        return result;
    }

    interface BuildingDamageData extends AllCitiesBuildingDamageResult {
        isSingleCity?: boolean;
        cityName?: string;
        maxOverpressure?: number;
        avgStructureFactor?: number;
    }

    function getBuildingDamageData(state: AppState, elements: DataDisplayElements): BuildingDamageData | null {
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
                const result: CityBuildingDamageResult = global.Physics.calculateCityBuildingDamage(
                    city,
                    positionedExplosions,
                    scale,
                    terrain as any
                );
                return {
                    cityResults: [result],
                    totalDeaths: Math.round(result.totalDeaths),
                    totalInjured: Math.round(result.totalInjured),
                    totalDestroyedPop: Math.round(result.totalDestroyedPop),
                    totalPopulation: city.population,
                    totalByDamage: result.distByDamage,
                    totalByBuildingType: result.buildingResults as any,
                    overallSurvivalRate: result.survivalRate,
                    maxOverpressure: result.maxOverpressure,
                    avgStructureFactor: result.avgStructureFactor,
                    isSingleCity: true,
                    cityName: city.name
                };
            }
        }

        return global.Physics.calculateAllCitiesBuildingDamage(cities, positionedExplosions, scale, terrain as any);
    }

    function updateBuildingDisplay(elements: DataDisplayElements, state: AppState): void {
        if (!elements.buildingSummaryView) return;

        const data = getBuildingDamageData(state, elements);

        if (!data) {
            if (elements.buildingTotalPop) {
                elements.buildingTotalPop.textContent = formatNumber(
                    state.cities.reduce(function (sum: number, c: City) { return sum + c.population; }, 0)
                );
            }
            if (elements.buildingDestroyedPop) {
                elements.buildingDestroyedPop.textContent = '0';
            }
            if (elements.buildingAvgStrength) {
                elements.buildingAvgStrength.textContent = '—';
            }
            if (elements.buildingSurvivalRate) {
                elements.buildingSurvivalRate.textContent = '—';
            }
            if (elements.maxOverpressure) {
                elements.maxOverpressure.textContent = '0 psi';
            }
            if (elements.overpressureBar) {
                (elements.overpressureBar as HTMLElement).style.width = '0%';
            }
            if (elements.buildingTypeList) {
                elements.buildingTypeList.innerHTML = '';
            }
            if (elements.damageBarChart) {
                elements.damageBarChart.innerHTML = '';
            }
            if (elements.damageStatsList) {
                elements.damageStatsList.innerHTML = '';
            }
            return;
        }

        if (elements.buildingTotalPop) {
            elements.buildingTotalPop.textContent = formatNumber(data.totalPopulation);
        }
        if (elements.buildingDestroyedPop) {
            elements.buildingDestroyedPop.textContent = formatNumber(data.totalDestroyedPop);
        }

        const avgStrength = data.avgStructureFactor !== undefined
            ? data.avgStructureFactor.toFixed(2)
            : calculateOverallStructureFactor(state.cities).toFixed(2);
        if (elements.buildingAvgStrength) {
            elements.buildingAvgStrength.textContent = avgStrength;
        }

        const survivalPct = (data.overallSurvivalRate * 100).toFixed(1);
        if (elements.buildingSurvivalRate) {
            elements.buildingSurvivalRate.textContent = survivalPct + '%';
        }

        const maxOp = data.maxOverpressure || getMaxOverpressure(state);
        if (elements.maxOverpressure) {
            elements.maxOverpressure.textContent = maxOp.toFixed(2) + ' psi';
        }
        const opPercent = Math.min(100, (maxOp / 20) * 100);
        if (elements.overpressureBar) {
            (elements.overpressureBar as HTMLElement).style.width = opPercent + '%';
        }

        updateBuildingTypeList(elements, data);
        updateDamageDistribution(elements, data);
    }

    function calculateOverallStructureFactor(cities: City[]): number {
        let totalPop = 0;
        let weightedFactor = 0;
        cities.forEach(function (city: City) {
            const factor = global.Physics.calculateAvgStructureFactor(city.buildingDistribution);
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
            cities.forEach(function (city: City) {
                if (!exp.explosionCenter) return;
                const dx = city.x - exp.explosionCenter.x;
                const dy = city.y - exp.explosionCenter.y;
                const distPx = Math.sqrt(dx * dx + dy * dy);
                const distKm = distPx / state.scale;
                const op = global.Physics.getOverpressureAtDistance(exp.yieldKilotons, distKm, exp.burstHeight);
                if (op > maxOp) maxOp = op;
            });
        });
        return maxOp;
    }

    function updateBuildingTypeList(elements: DataDisplayElements, data: BuildingDamageData): void {
        if (!elements.buildingTypeList) return;

        const BUILDING_TYPES: { [key: string]: BuildingType } = global.Physics.BUILDING_TYPES;
        const BUILDING_TYPE_ORDER: string[] = global.Physics.BUILDING_TYPE_ORDER;
        const DAMAGE_LEVELS: { [key: string]: { name: string; color: string } } = global.Physics.DAMAGE_LEVELS;

        let html = '';
        const totalPop = data.totalPopulation;

        BUILDING_TYPE_ORDER.forEach(function (type: string) {
            const bt = BUILDING_TYPES[type];
            let typeData: BuildingResult | any;

            if (data.isSingleCity) {
                typeData = (data.totalByBuildingType as any)[type];
            } else {
                typeData = (data.totalByBuildingType as any)[type];
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

        elements.buildingTypeList.innerHTML = html;
    }

    function getOverallDamageLevel(typeData: any): DamageLevelKey {
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

    function updateDamageDistribution(elements: DataDisplayElements, data: BuildingDamageData): void {
        if (!elements.damageBarChart || !elements.damageStatsList) return;

        const DAMAGE_LEVELS: { [key: string]: { name: string; color: string } } = global.Physics.DAMAGE_LEVELS;
        const damageOrder: DamageLevelKey[] = ['intact', 'light', 'moderate', 'severe', 'destroyed'];
        const totalPop = data.totalPopulation;

        let maxValue = 0;
        damageOrder.forEach(function (level: DamageLevelKey) {
            const val = (data.totalByDamage as DistByDamage)[level] || 0;
            if (val > maxValue) maxValue = val;
        });

        let barHtml = '';
        damageOrder.forEach(function (level: DamageLevelKey) {
            const dl = DAMAGE_LEVELS[level];
            const val = (data.totalByDamage as DistByDamage)[level] || 0;
            const heightPct = maxValue > 0 ? (val / maxValue * 100) : 0;
            const pct = totalPop > 0 ? (val / totalPop * 100).toFixed(1) : 0;

            barHtml += '<div class="damage-bar-item">';
            barHtml += '  <div class="damage-bar-value">' + formatNumber(Math.round(val)) + '</div>';
            barHtml += '  <div class="damage-bar-fill" style="height: ' + Math.max(4, heightPct) + '%; background: ' + dl.color + ';"></div>';
            barHtml += '  <div class="damage-bar-label">' + dl.name + '</div>';
            barHtml += '</div>';
        });
        elements.damageBarChart.innerHTML = barHtml;

        let statsHtml = '';
        damageOrder.forEach(function (level: DamageLevelKey) {
            const dl = DAMAGE_LEVELS[level];
            const val = (data.totalByDamage as DistByDamage)[level] || 0;
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
        elements.damageStatsList.innerHTML = statsHtml;
    }

    function populateBuildingCitySelect(elements: DataDisplayElements, cities: City[]): void {
        if (!elements.buildingCitySelect) return;

        const currentValue = (elements.buildingCitySelect as HTMLSelectElement).value;
        let html = '<option value="">全部城市汇总</option>';

        cities.forEach(function (city: City, idx: number) {
            html += '<option value="' + idx + '">' + city.name + ' (' + formatNumber(city.population) + '人)</option>';
        });

        elements.buildingCitySelect.innerHTML = html;
        if (currentValue) {
            (elements.buildingCitySelect as HTMLSelectElement).value = currentValue;
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
    } as any;

})(window);
