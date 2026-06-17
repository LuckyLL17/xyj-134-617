import type {
    ZoneDef,
    AppState,
    TerrainData,
    TerrainFeature,
    TerrainBoundaryPoint,
    City,
    Road,
    EvacuationNode,
    EvacuationEdge,
    Shelter,
    BuildingType,
    Explosion,
    ExplosionRadii
} from '../types';

(function (global: Window): void {
    'use strict';

    const rgba: (r: number, g: number, b: number, a: number) => string = (global.DataDisplay as any).rgba;

    function getZoneDefs(): ZoneDef[] {
        return global.Physics.getZones();
    }

    function getZoneColors(key: string, tintIndex: number): { fill: string; border: string } {
        const zones: ZoneDef[] = getZoneDefs();
        const zone: ZoneDef | undefined = zones.find(function (z: ZoneDef): boolean { return z.key === key; });
        let baseColor: number[] = zone && zone.color ? zone.color : [128, 128, 128];

        const tintMultipliers: number[][] = [
            [1.0, 1.0, 1.0],
            [0.4, 0.67, 1.0],
            [0.67, 1.0, 0.4],
            [1.0, 0.78, 0.4]
        ];
        const mult: number[] = tintMultipliers[tintIndex % tintMultipliers.length];
        const c: number[] = [
            Math.min(255, Math.round(baseColor[0] * mult[0])),
            Math.min(255, Math.round(baseColor[1] * mult[1])),
            Math.min(255, Math.round(baseColor[2] * mult[2]))
        ];

        return {
            fill: rgba(c[0], c[1], c[2], 0.16),
            border: rgba(c[0], c[1], c[2], 0.55)
        };
    }

    function setupCanvas(
        mapCanvas: HTMLCanvasElement,
        effectCanvas: HTMLCanvasElement | null,
        mapCtx: CanvasRenderingContext2D,
        effectCtx: CanvasRenderingContext2D,
        mapWrapper: HTMLElement,
        state: AppState
    ): void {
        const rect: DOMRect = mapWrapper.getBoundingClientRect();
        const dpr: number = window.devicePixelRatio || 1;

        mapCanvas.width = rect.width * dpr;
        mapCanvas.height = rect.height * dpr;
        mapCanvas.style.width = rect.width + 'px';
        mapCanvas.style.height = rect.height + 'px';
        mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        if (effectCanvas) {
            effectCanvas.width = rect.width * dpr;
            effectCanvas.height = rect.height * dpr;
            effectCanvas.style.width = rect.width + 'px';
            effectCanvas.style.height = rect.height + 'px';
            effectCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const width: number = rect.width;
        const height: number = rect.height;

        state.cities = global.Physics.generateCities(width, height);
        drawMap(mapCtx, mapWrapper, state);
    }

    function drawMap(mapCtx: CanvasRenderingContext2D, mapWrapper: HTMLElement, state: AppState): void {
        const rect: DOMRect = mapWrapper.getBoundingClientRect();
        const width: number = rect.width;
        const height: number = rect.height;

        mapCtx.clearRect(0, 0, width, height);

        drawTerrain(mapCtx, width, height);

        if (state.showTerrainHeatmap) {
            drawTerrainHeatmap(mapCtx, width, height, state.terrainData);
        }

        drawGrid(mapCtx, width, height, state.scale);
        drawWaterBodies(mapCtx, width, height);

        if (state.showTerrainContours) {
            drawTerrainContours(mapCtx, width, height, state.terrainData);
        }

        if (state.evacuationEnabled && state.evacuationPlan && (state.evacuationPlan as any).roadDensities) {
            drawEvacuationRoads(mapCtx, state);
        } else {
            drawRoadsLayer(mapCtx, width, height, state.cities);
        }

        drawCities(mapCtx, state);

        if (state.evacuationEnabled && state.shelters && state.shelters.length > 0) {
            drawSheltersOnMap(mapCtx, state);
        }

        if (!state.isAnimating) {
            drawExplosionZones(mapCtx, width, height, state);
        }
    }

    function drawTerrain(mapCtx: CanvasRenderingContext2D, width: number, height: number): void {
        const gradient: CanvasGradient = mapCtx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.7
        );
        gradient.addColorStop(0, '#2a3a2a');
        gradient.addColorStop(0.5, '#1e2e1e');
        gradient.addColorStop(1, '#141f14');

        mapCtx.fillStyle = gradient;
        mapCtx.fillRect(0, 0, width, height);

        mapCtx.globalAlpha = 0.1;
        for (let i: number = 0; i < 200; i++) {
            const x: number = (i * 137.5) % width;
            const y: number = (i * 89.3) % height;
            const r: number = 20 + (i * 17) % 60;
            mapCtx.beginPath();
            mapCtx.arc(x, y, r, 0, Math.PI * 2);
            const terrainType: number = i % 3;
            if (terrainType === 0) {
                mapCtx.fillStyle = '#3a4a3a';
            } else if (terrainType === 1) {
                mapCtx.fillStyle = '#2a3a4a';
            } else {
                mapCtx.fillStyle = '#4a3a2a';
            }
            mapCtx.fill();
        }
        mapCtx.globalAlpha = 1;
    }

    function getTerrainColor(elevation: number): { r: number; g: number; b: number } {
        if (elevation <= -100) {
            return { r: 30, g: 50, b: 90 };
        } else if (elevation <= 0) {
            const t: number = (elevation - (-100)) / 100;
            return {
                r: Math.round(30 + t * 40),
                g: Math.round(50 + t * 40),
                b: Math.round(90 - t * 40)
            };
        } else if (elevation <= 200) {
            const t: number = elevation / 200;
            return {
                r: Math.round(70 + t * 20),
                g: Math.round(90 + t * 50),
                b: Math.round(50 - t * 10)
            };
        } else if (elevation <= 800) {
            const t: number = (elevation - 200) / 600;
            return {
                r: Math.round(90 + t * 60),
                g: Math.round(140 + t * 30),
                b: Math.round(40 - t * 10)
            };
        } else if (elevation <= 2000) {
            const t: number = (elevation - 800) / 1200;
            return {
                r: Math.round(150 + t * 60),
                g: Math.round(170 - t * 30),
                b: Math.round(30 + t * 30)
            };
        } else if (elevation <= 4000) {
            const t: number = (elevation - 2000) / 2000;
            return {
                r: Math.round(210 + t * 30),
                g: Math.round(140 - t * 30),
                b: Math.round(60 + t * 50)
            };
        } else {
            const t: number = Math.min(1, (elevation - 4000) / 3000);
            return {
                r: Math.round(240 - t * 20),
                g: Math.round(110 + t * 130),
                b: Math.round(110 + t * 130)
            };
        }
    }

    function drawTerrainHeatmap(mapCtx: CanvasRenderingContext2D, width: number, height: number, terrain: TerrainData | null): void {
        if (!terrain || !terrain.features || terrain.features.length === 0) return;

        const step: number = 8;
        for (let y: number = 0; y < height; y += step) {
            for (let x: number = 0; x < width; x += step) {
                const elev: number = global.Physics.getElevationAt(x + step / 2, y + step / 2, terrain);
                if (Math.abs(elev) < 5) continue;

                const color: { r: number; g: number; b: number } = getTerrainColor(elev);
                const intensity: number = Math.min(0.35, Math.abs(elev) / 8000 + 0.05);
                mapCtx.fillStyle = rgba(color.r, color.g, color.b, intensity);
                mapCtx.fillRect(x, y, step, step);
            }
        }

        const FEATURE_TYPES: { [key: string]: string } = global.Physics.TERRAIN_FEATURE_TYPES;
        terrain.features.forEach(function (f: TerrainFeature): void {
            if (f.type === FEATURE_TYPES.MOUNTAIN) {
                const innerGrad: CanvasGradient = mapCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 1.2);
                innerGrad.addColorStop(0, rgba(200, 180, 160, 0.2));
                innerGrad.addColorStop(0.3, rgba(180, 120, 90, 0.15));
                innerGrad.addColorStop(0.7, rgba(90, 130, 60, 0.1));
                innerGrad.addColorStop(1, rgba(0, 0, 0, 0));
                mapCtx.fillStyle = innerGrad;
                mapCtx.beginPath();
                mapCtx.arc(f.x, f.y, f.radius * 1.2, 0, Math.PI * 2);
                mapCtx.fill();

                mapCtx.strokeStyle = rgba(255, 255, 255, 0.35);
                mapCtx.lineWidth = 1.5;
                mapCtx.beginPath();
                mapCtx.arc(f.x, f.y, f.radius * 0.25, 0, Math.PI * 2);
                mapCtx.stroke();
            } else if (f.type === FEATURE_TYPES.HILL) {
                const grad: CanvasGradient = mapCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
                grad.addColorStop(0, rgba(140, 160, 80, 0.18));
                grad.addColorStop(0.6, rgba(100, 130, 60, 0.1));
                grad.addColorStop(1, rgba(0, 0, 0, 0));
                mapCtx.fillStyle = grad;
                mapCtx.beginPath();
                mapCtx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                mapCtx.fill();
            } else if (f.type === FEATURE_TYPES.BASIN) {
                const grad: CanvasGradient = mapCtx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * 1.5);
                grad.addColorStop(0, rgba(60, 100, 140, 0.25));
                grad.addColorStop(0.5, rgba(40, 70, 110, 0.15));
                grad.addColorStop(1, rgba(0, 0, 0, 0));
                mapCtx.fillStyle = grad;
                mapCtx.beginPath();
                mapCtx.arc(f.x, f.y, f.radius * 1.5, 0, Math.PI * 2);
                mapCtx.fill();
            }
        });

        terrain.features.forEach(function (f: TerrainFeature): void {
            if (f.height > 1000) {
                const dx: number = f.radius * 0.6;
                const dy: number = f.radius * 0.6;
                mapCtx.fillStyle = 'rgba(255,255,255,0.03)';
                mapCtx.beginPath();
                mapCtx.moveTo(f.x - dx, f.y + dy);
                mapCtx.lineTo(f.x + dx, f.y + dy);
                mapCtx.lineTo(f.x, f.y - dy * 0.8);
                mapCtx.closePath();
                mapCtx.fill();
            }
        });
    }

    function drawTerrainContours(mapCtx: CanvasRenderingContext2D, width: number, height: number, terrain: TerrainData | null): void {
        if (!terrain || !terrain.features || terrain.features.length === 0) return;

        const contourLevels: number[] = [300, 600, 1000, 1500, 2500, 4000];
        const contourColors: string[] = [
            rgba(100, 180, 100, 0.25),
            rgba(140, 170, 80, 0.28),
            rgba(180, 150, 60, 0.30),
            rgba(200, 120, 80, 0.32),
            rgba(200, 90, 110, 0.35),
            rgba(180, 180, 220, 0.40)
        ];

        const step: number = 5;

        contourLevels.forEach(function (level: number, levelIdx: number): void {
            mapCtx.strokeStyle = contourColors[levelIdx];
            mapCtx.lineWidth = levelIdx >= 4 ? 1.2 : 0.8;
            mapCtx.beginPath();

            for (let y: number = step; y < height - step; y += step * 2) {
                for (let x: number = step; x < width - step; x += step * 2) {
                    const e0: number = global.Physics.getElevationAt(x, y, terrain);
                    const e1: number = global.Physics.getElevationAt(x + step, y, terrain);
                    const e2: number = global.Physics.getElevationAt(x + step, y + step, terrain);
                    const e3: number = global.Physics.getElevationAt(x, y + step, terrain);

                    let crossings: { x: number; y: number }[] = [];
                    const pairs: number[][] = [
                        [e0, e1, x, y, x + step, y],
                        [e1, e2, x + step, y, x + step, y + step],
                        [e2, e3, x + step, y + step, x, y + step],
                        [e3, e0, x, y + step, x, y]
                    ];

                    pairs.forEach(function (pair: number[]): void {
                        const ea: number = pair[0];
                        const eb: number = pair[1];
                        const xa: number = pair[2];
                        const ya: number = pair[3];
                        const xb: number = pair[4];
                        const yb: number = pair[5];
                        if ((ea < level && eb >= level) || (ea >= level && eb < level)) {
                            const t: number = (level - ea) / (eb - ea);
                            crossings.push({
                                x: xa + (xb - xa) * t,
                                y: ya + (yb - ya) * t
                            });
                        }
                    });

                    if (crossings.length >= 2) {
                        mapCtx.moveTo(crossings[0].x, crossings[0].y);
                        mapCtx.lineTo(crossings[1].x, crossings[1].y);
                    }
                }
            }
            mapCtx.stroke();
        });

        const FEATURE_TYPES: { [key: string]: string } = global.Physics.TERRAIN_FEATURE_TYPES;
        terrain.features.forEach(function (f: TerrainFeature): void {
            let label: string | undefined;
            let color: string | undefined;
            if (f.type === FEATURE_TYPES.MOUNTAIN && f.height > 1500) {
                label = '▲ ' + Math.round(f.height) + 'm';
                color = rgba(220, 220, 255, 0.7);
            } else if (f.type === FEATURE_TYPES.BASIN && f.height < -200) {
                label = '▼ ' + Math.round(Math.abs(f.height)) + 'm';
                color = rgba(100, 160, 220, 0.7);
            } else {
                return;
            }

            if (f.radius > 40) {
                mapCtx.font = '10px sans-serif';
                mapCtx.textAlign = 'center';
                mapCtx.fillStyle = rgba(0, 0, 0, 0.55);
                const tw: number = mapCtx.measureText(label as string).width;
                mapCtx.fillRect(f.x - tw / 2 - 3, f.y - 4, tw + 6, 13);
                mapCtx.fillStyle = color as string;
                mapCtx.fillText(label as string, f.x, f.y + 5);
            }
        });
    }

    function drawPolygonPathFromPoints(ctx: CanvasRenderingContext2D, points: TerrainBoundaryPoint[], close?: boolean): void {
        if (!points || points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i: number = 1; i < points.length; i++) {
            const prev: TerrainBoundaryPoint = points[i - 1];
            const curr: TerrainBoundaryPoint = points[i];
            const midX: number = (prev.x + curr.x) / 2;
            const midY: number = (prev.y + curr.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
        }
        if (close !== false) {
            const last: TerrainBoundaryPoint = points[points.length - 1];
            const first: TerrainBoundaryPoint = points[0];
            const midX: number = (last.x + first.x) / 2;
            const midY: number = (last.y + first.y) / 2;
            ctx.quadraticCurveTo(last.x, last.y, midX, midY);
            ctx.closePath();
        }
    }

    function drawGrid(mapCtx: CanvasRenderingContext2D, width: number, height: number, scale: number): void {
        const step: number = scale * 5;

        mapCtx.strokeStyle = rgba(255, 255, 255, 0.04);
        mapCtx.lineWidth = 1;

        mapCtx.beginPath();
        for (let x: number = 0; x <= width; x += step) {
            mapCtx.moveTo(x, 0);
            mapCtx.lineTo(x, height);
        }
        for (let y: number = 0; y <= height; y += step) {
            mapCtx.moveTo(0, y);
            mapCtx.lineTo(width, y);
        }
        mapCtx.stroke();

        mapCtx.strokeStyle = rgba(255, 255, 255, 0.1);
        mapCtx.lineWidth = 1;
        const bigStep: number = step * 4;
        mapCtx.beginPath();
        for (let x: number = 0; x <= width; x += bigStep) {
            mapCtx.moveTo(x, 0);
            mapCtx.lineTo(x, height);
        }
        for (let y: number = 0; y <= height; y += bigStep) {
            mapCtx.moveTo(0, y);
            mapCtx.lineTo(width, y);
        }
        mapCtx.stroke();

        mapCtx.fillStyle = rgba(255, 255, 255, 0.15);
        mapCtx.font = '10px monospace';
        mapCtx.textAlign = 'center';
        for (let x: number = bigStep; x <= width; x += bigStep) {
            const km: number = Math.round((x - width / 2) / scale);
            mapCtx.fillText(km + 'km', x, height - 6);
        }
        mapCtx.textAlign = 'right';
        for (let y: number = bigStep; y <= height; y += bigStep) {
            const km: number = Math.round((height / 2 - y) / scale);
            mapCtx.fillText(km + 'km', width - 6, y + 3);
        }
    }

    function drawWaterBodies(mapCtx: CanvasRenderingContext2D, width: number, height: number): void {
        mapCtx.fillStyle = rgba(40, 60, 90, 0.6);

        mapCtx.beginPath();
        mapCtx.ellipse(width * 0.15, height * 0.85, width * 0.12, height * 0.08, -0.3, 0, Math.PI * 2);
        mapCtx.fill();

        mapCtx.beginPath();
        mapCtx.ellipse(width * 0.85, height * 0.15, width * 0.1, height * 0.06, 0.5, 0, Math.PI * 2);
        mapCtx.fill();

        mapCtx.strokeStyle = rgba(100, 140, 180, 0.3);
        mapCtx.lineWidth = 8;
        mapCtx.beginPath();
        mapCtx.moveTo(0, height * 0.3);
        mapCtx.bezierCurveTo(
            width * 0.3, height * 0.4,
            width * 0.5, height * 0.2,
            width, height * 0.35
        );
        mapCtx.stroke();
    }

    function drawRoadsLayer(mapCtx: CanvasRenderingContext2D, width: number, height: number, cities: City[]): void {
        const roads: Road[] = global.Physics.generateRoads(width, height, cities);
        mapCtx.strokeStyle = rgba(150, 140, 100, 0.25);
        mapCtx.lineWidth = 2;
        mapCtx.setLineDash([]);
        roads.forEach(function (road: Road): void {
            mapCtx.beginPath();
            mapCtx.moveTo(road.x1, road.y1);
            mapCtx.lineTo(road.x2, road.y2);
            mapCtx.stroke();
        });
    }

    function drawEvacuationRoads(mapCtx: CanvasRenderingContext2D, state: AppState): void {
        const plan: any = state.evacuationPlan as any;
        const roadDensities: any[] = plan.roadDensities;
        const nodes: EvacuationNode[] = plan.graph.nodes;

        roadDensities.forEach(function (rd: any): void {
            const edge: EvacuationEdge = rd.edge;
            const density: number = rd.density;

            const fromNode: EvacuationNode | undefined = nodes[edge.from];
            const toNode: EvacuationNode | undefined = nodes[edge.to];

            if (!fromNode || !toNode) return;

            let color: string;
            let lineWidth: number;

            if (density < 0.3) {
                color = rgba(100, 200, 100, 0.6);
                lineWidth = 3;
            } else if (density < 0.6) {
                color = rgba(255, 200, 50, 0.7);
                lineWidth = 4;
            } else if (density < 1) {
                color = rgba(255, 100, 50, 0.8);
                lineWidth = 5;
            } else {
                color = rgba(255, 50, 50, 0.9);
                lineWidth = 6;
            }

            mapCtx.strokeStyle = color;
            mapCtx.lineWidth = lineWidth;
            mapCtx.lineCap = 'round';

            mapCtx.beginPath();
            mapCtx.moveTo(fromNode.x, fromNode.y);
            mapCtx.lineTo(toNode.x, toNode.y);
            mapCtx.stroke();
        });

        drawEvacuationArrows(mapCtx, state);
    }

    function drawEvacuationArrows(mapCtx: CanvasRenderingContext2D, state: AppState): void {
        const plan: any = state.evacuationPlan as any;
        const cityPlans: any[] = plan.cityPlans;
        const nodes: EvacuationNode[] = plan.graph.nodes;

        cityPlans.forEach(function (planItem: any): void {
            if (!planItem.path || planItem.path.length === 0 || planItem.evacuated <= 0) return;

            planItem.path.forEach(function (edge: EvacuationEdge): void {
                const fromNode: EvacuationNode | undefined = nodes[edge.from];
                const toNode: EvacuationNode | undefined = nodes[edge.to];
                if (!fromNode || !toNode) return;

                const midX: number = (fromNode.x + toNode.x) / 2;
                const midY: number = (fromNode.y + toNode.y) / 2;

                const angle: number = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                const arrowSize: number = 10;

                const arrowAlpha: number = planItem.canEvacuate ? 0.7 : 0.4;

                mapCtx.save();
                mapCtx.translate(midX, midY);
                mapCtx.rotate(angle);

                mapCtx.fillStyle = planItem.canEvacuate
                    ? rgba(100, 200, 255, arrowAlpha)
                    : rgba(255, 100, 100, arrowAlpha);

                mapCtx.beginPath();
                mapCtx.moveTo(arrowSize, 0);
                mapCtx.lineTo(-arrowSize / 2, -arrowSize / 2);
                mapCtx.lineTo(-arrowSize / 2, arrowSize / 2);
                mapCtx.closePath();
                mapCtx.fill();

                mapCtx.restore();
            });
        });
    }

    function drawSheltersOnMap(mapCtx: CanvasRenderingContext2D, state: AppState): void {
        state.shelters.forEach(function (shelter: Shelter, idx: number): void {
            const x: number = shelter.x;
            const y: number = shelter.y;
            const size: number = 22;
            const isSelected: boolean = state.selectedShelterIndex === idx;

            const glowGrad: CanvasGradient = mapCtx.createRadialGradient(x, y, 0, x, y, size * 2.5);
            glowGrad.addColorStop(0, rgba(0, 255, 136, isSelected ? 0.4 : 0.2));
            glowGrad.addColorStop(1, rgba(0, 255, 136, 0));
            mapCtx.fillStyle = glowGrad;
            mapCtx.beginPath();
            mapCtx.arc(x, y, size * 2.5, 0, Math.PI * 2);
            mapCtx.fill();

            if (isSelected) {
                mapCtx.beginPath();
                mapCtx.arc(x, y, size + 6, 0, Math.PI * 2);
                mapCtx.strokeStyle = rgba(255, 255, 255, 0.6);
                mapCtx.lineWidth = 2;
                mapCtx.setLineDash([6, 4]);
                mapCtx.stroke();
                mapCtx.setLineDash([]);
            }

            const bgGrad: CanvasGradient = mapCtx.createRadialGradient(x, y, 0, x, y, size);
            bgGrad.addColorStop(0, '#00ff88');
            bgGrad.addColorStop(0.7, '#00cc6a');
            bgGrad.addColorStop(1, '#007744');
            mapCtx.fillStyle = bgGrad;
            mapCtx.beginPath();
            mapCtx.arc(x, y, size, 0, Math.PI * 2);
            mapCtx.fill();

            mapCtx.strokeStyle = isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)';
            mapCtx.lineWidth = isSelected ? 3 : 2;
            mapCtx.stroke();

            mapCtx.fillStyle = '#ffffff';
            mapCtx.font = 'bold 18px sans-serif';
            mapCtx.textAlign = 'center';
            mapCtx.textBaseline = 'middle';
            mapCtx.fillText('🏠', x, y);

            if (state.showLabels) {
                mapCtx.fillStyle = 'rgba(0,0,0,0.75)';
                const label: string = (shelter as any).name;
                mapCtx.font = '11px sans-serif';
                const tw: number = mapCtx.measureText(label).width;
                mapCtx.fillRect(x - tw / 2 - 6, y + size + 4, tw + 12, 18);
                mapCtx.fillStyle = '#00ff88';
                mapCtx.fillText(label, x, y + size + 15);

                const capLabel: string = formatCapacity(shelter.capacity);
                mapCtx.fillStyle = 'rgba(0,0,0,0.6)';
                mapCtx.font = '10px sans-serif';
                const capTw: number = mapCtx.measureText(capLabel).width;
                mapCtx.fillRect(x - capTw / 2 - 6, y + size + 22, capTw + 12, 16);
                mapCtx.fillStyle = 'rgba(255,255,255,0.8)';
                mapCtx.fillText(capLabel, x, y + size + 32);
            }
        });

        mapCtx.textBaseline = 'alphabetic';
    }

    function formatCapacity(cap: number): string {
        if (cap >= 1000000) return (cap / 1000000).toFixed(1) + 'M 人';
        if (cap >= 1000) return (cap / 1000).toFixed(0) + 'K 人';
        return cap + ' 人';
    }

    function drawCities(mapCtx: CanvasRenderingContext2D, state: AppState): void {
        const BUILDING_TYPES: { [key: string]: BuildingType } = global.Physics.BUILDING_TYPES;
        const BUILDING_TYPE_ORDER: string[] = global.Physics.BUILDING_TYPE_ORDER;

        state.cities.forEach(function (city: City, index: number): void {
            const isCentral: boolean = index === 0;
            const size: number = city.size;

            const buildingGradient: CanvasGradient = mapCtx.createRadialGradient(
                city.x, city.y, 0,
                city.x, city.y, size
            );
            buildingGradient.addColorStop(0, isCentral ? '#8888aa' : '#666677');
            buildingGradient.addColorStop(0.6, isCentral ? '#555577' : '#444455');
            buildingGradient.addColorStop(1, rgba(60, 60, 80, 0));

            mapCtx.fillStyle = buildingGradient;
            mapCtx.beginPath();
            mapCtx.arc(city.x, city.y, size, 0, Math.PI * 2);
            mapCtx.fill();

            const blocks: number = isCentral ? 15 : 8;
            mapCtx.fillStyle = isCentral ? '#aaaacc' : '#888899';
            for (let i: number = 0; i < blocks; i++) {
                const angle: number = (i / blocks) * Math.PI * 2;
                const dist: number = size * (0.2 + Math.random() * 0.6);
                const bx: number = city.x + Math.cos(angle) * dist;
                const by: number = city.y + Math.sin(angle) * dist;
                const bs: number = (isCentral ? 4 : 3) + Math.random() * 3;
                mapCtx.fillRect(bx - bs / 2, by - bs / 2, bs, bs);
            }

            if (city.buildingDistribution && size > 18) {
                const ringRadius: number = size + 4;
                const ringWidth: number = 3;
                let startAngle: number = -Math.PI / 2;

                BUILDING_TYPE_ORDER.forEach(function (type: string): void {
                    const ratio: number = city.buildingDistribution[type] || 0;
                    if (ratio <= 0.01) return;

                    const bt: BuildingType = BUILDING_TYPES[type];
                    const arcAngle: number = ratio * Math.PI * 2;

                    mapCtx.beginPath();
                    mapCtx.arc(city.x, city.y, ringRadius, startAngle, startAngle + arcAngle);
                    mapCtx.strokeStyle = bt.color;
                    mapCtx.lineWidth = ringWidth;
                    mapCtx.stroke();

                    startAngle += arcAngle;
                });
            }

            if (city.destroyed) {
                mapCtx.fillStyle = rgba(100, 30, 20, 0.7);
                mapCtx.beginPath();
                mapCtx.arc(city.x, city.y, size, 0, Math.PI * 2);
                mapCtx.fill();
            }

            if (state.showLabels && size > 20) {
                mapCtx.fillStyle = rgba(255, 255, 255, 0.6);
                mapCtx.font = (isCentral ? 'bold 11px' : '10px') + ' sans-serif';
                mapCtx.textAlign = 'center';
                mapCtx.fillText(city.name, city.x, city.y + size + 14);
            }
        });
    }

    function drawExplosionZones(mapCtx: CanvasRenderingContext2D, width: number, height: number, state: AppState): void {
        if (!state.explosions || state.explosions.length === 0) return;

        state.explosions.forEach(function (exp: Explosion, index: number): void {
            if (!exp.explosionCenter || !exp.radii) return;
            drawOneExplosionZones(mapCtx, exp, index, state);
        });

        drawAllOverlapHighlights(mapCtx, state);

        state.explosions.forEach(function (exp: Explosion, index: number): void {
            if (!exp.explosionCenter) return;
            const isSelected: boolean = exp.id === state.selectedExplosionId;
            drawExplosionMarker(mapCtx, exp.explosionCenter.x, exp.explosionCenter.y, index + 1, isSelected);
        });
    }

    function getOverlayHatchColors(): { [key: string]: { line: string; fill: string; angle: number; spacing: number } } {
        const zones: ZoneDef[] = getZoneDefs();
        const result: { [key: string]: { line: string; fill: string; angle: number; spacing: number } } = {};
        const angles: number[] = [Math.PI / 5, -Math.PI / 5, Math.PI / 4, -Math.PI / 4, Math.PI / 3, 0, Math.PI / 6, -Math.PI / 6];
        const spacings: number[] = [9, 9, 8, 7, 7, 6, 8, 7];

        zones.forEach(function (zone: ZoneDef, index: number): void {
            const color: number[] = zone.color || [128, 128, 128];
            const angle: number = angles[index % angles.length];
            const spacing: number = spacings[index % spacings.length];
            result[zone.key] = {
                line: rgba(color[0], color[1], color[2], 0.55 + (index % 3) * 0.05),
                fill: rgba(color[0], color[1], color[2], 0.10 + (index % 3) * 0.02),
                angle: angle,
                spacing: spacing
            };
        });

        return result;
    }

    const OVERLAP_LEVEL_STYLES: { [key: number]: any } = {
        2: null,
        3: {
            fillBase: [
                'rgba(255, 255, 255, 0.25)',
                'rgba(255, 255, 255, 0.27)',
                'rgba(255, 255, 255, 0.29)',
                'rgba(255, 255, 255, 0.30)',
                'rgba(255, 255, 255, 0.31)',
                'rgba(255, 255, 255, 0.33)'
            ],
            hatch2: true,
            lineAlpha: 0.85,
            lineWidth: 2.0,
            spacing2: 6,
            outline: true,
            outlineColor: 'rgba(255, 255, 255, 0.55)',
            outlineWidth: 2.0,
            label: '3圆'
        },
        4: {
            fillBase: [
                'rgba(255, 220, 80, 0.28)',
                'rgba(255, 210, 70, 0.30)',
                'rgba(255, 200, 60, 0.32)',
                'rgba(255, 190, 50, 0.34)',
                'rgba(255, 180, 40, 0.36)',
                'rgba(255, 170, 30, 0.38)'
            ],
            hatch2: true,
            lineAlpha: 0.92,
            lineWidth: 2.2,
            spacing2: 5,
            outline: true,
            outlineColor: 'rgba(255, 230, 120, 0.80)',
            outlineWidth: 2.5,
            label: '4圆+'
        }
    };

    function generateCombinations(arr: any[], k: number): any[][] {
        const result: any[][] = [];
        const n: number = arr.length;
        if (k > n) return result;
        const idx: number[] = [];
        for (let i: number = 0; i < k; i++) idx.push(i);
        while (true) {
            result.push(idx.map(function (i: number): any { return arr[i]; }));
            let pos: number = k - 1;
            while (pos >= 0 && idx[pos] === n - k + pos) pos--;
            if (pos < 0) break;
            idx[pos]++;
            for (let j: number = pos + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
        }
        return result;
    }

    function drawMultiCircleOverlap(ctx: CanvasRenderingContext2D, circles: { cx: number; cy: number; r: number }[], zoneIndex: number, level: number): void {
        const cw: number = ctx.canvas.width / (window.devicePixelRatio || 1);
        const ch: number = ctx.canvas.height / (window.devicePixelRatio || 1);
        const diag: number = Math.sqrt(cw * cw + ch * ch);
        const cx: number = cw / 2;
        const cy: number = ch / 2;

        for (let c: number = 0; c < circles.length; c++) {
            const r: number = circles[c].r;
            if (r <= 1) return;
        }

        ctx.save();
        for (let c: number = 0; c < circles.length; c++) {
            ctx.beginPath();
            ctx.arc(circles[c].cx, circles[c].cy, circles[c].r, 0, Math.PI * 2);
            ctx.clip();
        }

        const lvlStyle: any = OVERLAP_LEVEL_STYLES[level];
        if (!lvlStyle) {
            ctx.restore();
            return;
        }

        if (lvlStyle.fillBase) {
            ctx.fillStyle = lvlStyle.fillBase[zoneIndex % lvlStyle.fillBase.length];
            ctx.fillRect(0, 0, cw, ch);
        }

        if (lvlStyle.hatch2) {
            const zoneDefs: ZoneDef[] = getZoneDefs();
            const overlayHatchColors: { [key: string]: { line: string; fill: string; angle: number; spacing: number } } = getOverlayHatchColors();
            const baseStyle: { line: string; fill: string; angle: number; spacing: number } = overlayHatchColors[zoneDefs[zoneIndex].key];
            const lineRgbMatch: RegExpMatchArray | null = baseStyle.line.match(/rgba?\(([^)]+)\)/);
            let lineColor: string = baseStyle.line;
            if (lineRgbMatch) {
                const parts: string[] = lineRgbMatch[1].split(',').map(function (s: string): string { return s.trim(); });
                lineColor = 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + lvlStyle.lineAlpha + ')';
            }
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = lvlStyle.lineWidth || 1.5;
            ctx.beginPath();
            const angle2: number = -baseStyle.angle + Math.PI / 2;
            const cos1: number = Math.cos(baseStyle.angle);
            const sin1: number = Math.sin(baseStyle.angle);
            const cos2: number = Math.cos(angle2);
            const sin2: number = Math.sin(angle2);
            const sp1: number = baseStyle.spacing;
            const sp2: number = lvlStyle.spacing2;
            for (let t: number = -diag; t <= diag; t += sp1) {
                ctx.moveTo(cx + (-diag) * cos1 + t * (-sin1), cy + (-diag) * sin1 + t * cos1);
                ctx.lineTo(cx + diag * cos1 + t * (-sin1), cy + diag * sin1 + t * cos1);
            }
            for (let t: number = -diag; t <= diag; t += sp2) {
                ctx.moveTo(cx + (-diag) * cos2 + t * (-sin2), cy + (-diag) * sin2 + t * cos2);
                ctx.lineTo(cx + diag * cos2 + t * (-sin2), cy + diag * sin2 + t * cos2);
            }
            ctx.stroke();
        }

        ctx.restore();

        if (lvlStyle.outline) {
            const color: string = lvlStyle.outlineColor;
            const width: number = lvlStyle.outlineWidth || 2.0;
            const k: number = circles.length;
            for (let i: number = 0; i < k; i++) {
                ctx.save();
                for (let j: number = 0; j < k; j++) {
                    if (j === i) continue;
                    ctx.beginPath();
                    ctx.arc(circles[j].cx, circles[j].cy, circles[j].r, 0, Math.PI * 2);
                    ctx.clip();
                }
                ctx.beginPath();
                ctx.arc(circles[i].cx, circles[i].cy, circles[i].r, 0, Math.PI * 2);
                ctx.strokeStyle = color;
                ctx.lineWidth = width;
                ctx.stroke();
                ctx.restore();
            }
        }
    }

    function buildCircleIntersectionPath(
        ctx: CanvasRenderingContext2D,
        x1: number, y1: number, r1: number,
        x2: number, y2: number, r2: number
    ): boolean {
        const dx: number = x2 - x1;
        const dy: number = y2 - y1;
        const d: number = Math.sqrt(dx * dx + dy * dy);

        if (d >= r1 + r2 - 0.5) return false;
        if (d <= Math.abs(r1 - r2) + 0.5) {
            const minR: number = Math.min(r1, r2);
            const cx: number = r1 < r2 ? x1 : x2;
            const cy: number = r1 < r2 ? y1 : y2;
            ctx.beginPath();
            ctx.arc(cx, cy, minR, 0, Math.PI * 2);
            return true;
        }

        const a: number = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
        const hSq: number = r1 * r1 - a * a;
        if (hSq < 0) return false;
        const h: number = Math.sqrt(hSq);

        const px: number = x1 + a * dx / d;
        const py: number = y1 + a * dy / d;
        const ix: number = -h * dy / d;
        const iy: number = h * dx / d;

        const p1x: number = px + ix, p1y: number = py + iy;
        const p2x: number = px - ix, p2y: number = py - iy;

        const angA1: number = Math.atan2(p1y - y1, p1x - x1);
        const angA2: number = Math.atan2(p2y - y1, p2x - x1);
        const angB1: number = Math.atan2(p1y - y2, p1x - x2);
        const angB2: number = Math.atan2(p2y - y2, p2x - x2);

        ctx.beginPath();
        ctx.arc(x1, y1, r1, angA1, angA2, false);
        ctx.arc(x2, y2, r2, angB2, angB1, false);
        ctx.closePath();
        return true;
    }

    function drawHatchInsidePath(ctx: CanvasRenderingContext2D, style: { line: string; fill: string; angle: number; spacing: number }): void {
        ctx.save();
        ctx.clip();

        const cw: number = ctx.canvas.width / (window.devicePixelRatio || 1);
        const ch: number = ctx.canvas.height / (window.devicePixelRatio || 1);

        const diag: number = Math.sqrt(cw * cw + ch * ch);
        const cos: number = Math.cos(style.angle);
        const sin: number = Math.sin(style.angle);
        const cx: number = cw / 2;
        const cy: number = ch / 2;

        ctx.strokeStyle = style.line;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let t: number = -diag; t <= diag; t += style.spacing) {
            const sx: number = cx + (-diag) * cos + t * (-sin);
            const sy: number = cy + (-diag) * sin + t * cos;
            const ex: number = cx + diag * cos + t * (-sin);
            const ey: number = cy + diag * sin + t * cos;
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
        }
        ctx.stroke();

        ctx.restore();
    }

    function drawAllOverlapHighlights(mapCtx: CanvasRenderingContext2D, state: AppState): void {
        const scaled: { cx: number; cy: number; r: { [key: string]: number } }[] = [];
        state.explosions.forEach(function (exp: Explosion): void {
            if (!exp.explosionCenter || !exp.radii) return;
            const circles: { [key: string]: number } = {};
            getZoneDefs().forEach(function (zone: ZoneDef): void {
                circles[zone.key] = (exp.radii as ExplosionRadii)[zone.key] * state.scale;
            });
            scaled.push({ cx: exp.explosionCenter.x, cy: exp.explosionCenter.y, r: circles });
        });

        if (scaled.length < 2) return;

        const n: number = scaled.length;
        const maxLevel: number = Math.min(n, 6);
        const zoneDefs: ZoneDef[] = getZoneDefs();
        const overlayHatchColors: { [key: string]: { line: string; fill: string; angle: number; spacing: number } } = getOverlayHatchColors();

        zoneDefs.forEach(function (zone: ZoneDef, zoneIndex: number): void {
            const zk: string = zone.key;
            const baseStyle: { line: string; fill: string; angle: number; spacing: number } = overlayHatchColors[zk];

            for (let level: number = 2; level <= maxLevel; level++) {
                const combos: any[][] = generateCombinations(scaled, level);
                for (let ci: number = 0; ci < combos.length; ci++) {
                    const combo: any[] = combos[ci];
                    const circlesWithR: { cx: number; cy: number; r: number }[] = [];
                    for (let k: number = 0; k < combo.length; k++) {
                        const r: number = combo[k].r[zk];
                        if (r > 1) {
                            circlesWithR.push({ cx: combo[k].cx, cy: combo[k].cy, r: r });
                        }
                    }
                    if (circlesWithR.length < level) continue;

                    if (level === 2) {
                        const A: { cx: number; cy: number; r: number } = circlesWithR[0];
                        const B: { cx: number; cy: number; r: number } = circlesWithR[1];
                        const hasInt: boolean = buildCircleIntersectionPath(mapCtx, A.cx, A.cy, A.r, B.cx, B.cy, B.r);
                        if (hasInt) {
                            mapCtx.fillStyle = baseStyle.fill;
                            mapCtx.fill();
                            drawHatchInsidePath(mapCtx, baseStyle);
                        }
                    } else {
                        drawMultiCircleOverlap(mapCtx, circlesWithR, zoneIndex, level);
                    }
                }
            }
        });
    }

    function drawOneExplosionZones(
        mapCtx: CanvasRenderingContext2D,
        exp: Explosion,
        tintIndex: number,
        state: AppState
    ): void {
        const cx: number = exp.explosionCenter!.x;
        const cy: number = exp.explosionCenter!.y;
        const scale: number = state.scale;
        const radii: ExplosionRadii = exp.radii as ExplosionRadii;
        const isSelected: boolean = exp.id === state.selectedExplosionId;
        const terrain: TerrainData | null = state.terrainData;
        const useTerrain: boolean = !!(terrain && terrain.features && terrain.features.length > 0);
        const zoneDefs: ZoneDef[] = getZoneDefs();

        const boundaryCache: { [key: string]: TerrainBoundaryPoint[] | null } = {};
        if (useTerrain) {
            zoneDefs.forEach(function (zone: ZoneDef): void {
                boundaryCache[zone.key] = global.Physics.generateTerrainBoundaryPolygon(
                    exp, zone.key, terrain as TerrainData, scale, 72
                );
            });
        }

        zoneDefs.forEach(function (zone: ZoneDef): void {
            const colors: { fill: string; border: string } = getZoneColors(zone.key, tintIndex);
            const pxRadius: number = radii[zone.key] * scale;

            let dashStyle: number[] | string | null = zone.dash;
            if (typeof dashStyle === 'string') {
                switch (dashStyle) {
                    case 'dashed4': dashStyle = [4, 4]; break;
                    case 'dashed8': dashStyle = [8, 4]; break;
                    case 'dotted': dashStyle = [2, 2]; break;
                    case 'solid':
                    default: dashStyle = null; break;
                }
            }

            if (useTerrain && boundaryCache[zone.key]) {
                const points: TerrainBoundaryPoint[] = boundaryCache[zone.key] as TerrainBoundaryPoint[];
                drawPolygonPathFromPoints(mapCtx, points, true);
                mapCtx.fillStyle = colors.fill;
                mapCtx.fill();

                drawPolygonPathFromPoints(mapCtx, points, true);
                mapCtx.strokeStyle = colors.border;
                mapCtx.lineWidth = isSelected ? 2.5 : 1.5;
                if (dashStyle) {
                    mapCtx.setLineDash(dashStyle as number[]);
                } else {
                    mapCtx.setLineDash([]);
                }
                mapCtx.stroke();
                mapCtx.setLineDash([]);
            } else {
                mapCtx.beginPath();
                mapCtx.arc(cx, cy, pxRadius, 0, Math.PI * 2);
                mapCtx.fillStyle = colors.fill;
                mapCtx.fill();

                mapCtx.strokeStyle = colors.border;
                mapCtx.lineWidth = isSelected ? 2.5 : 1.5;
                if (dashStyle) {
                    mapCtx.setLineDash(dashStyle as number[]);
                } else {
                    mapCtx.setLineDash([]);
                }
                mapCtx.stroke();
                mapCtx.setLineDash([]);
            }

            if (state.showLabels && pxRadius > 30 && isSelected) {
                const labelAngle: number = -Math.PI / 4;
                let labelRadius: number = pxRadius;
                if (useTerrain && boundaryCache[zone.key]) {
                    const points: TerrainBoundaryPoint[] = boundaryCache[zone.key] as TerrainBoundaryPoint[];
                    let closestIdx: number = 0;
                    let closestDiff: number = Infinity;
                    for (let i: number = 0; i < points.length; i++) {
                        const ang: number = points[i].angle;
                        let diff: number = Math.abs(ang - labelAngle);
                        if (diff > Math.PI) diff = Math.PI * 2 - diff;
                        if (diff < closestDiff) {
                            closestDiff = diff;
                            closestIdx = i;
                        }
                    }
                    const pt: TerrainBoundaryPoint = points[closestIdx];
                    labelRadius = Math.sqrt(
                        Math.pow(pt.x - cx, 2) + Math.pow(pt.y - cy, 2)
                    );
                }
                const labelX: number = cx + Math.cos(labelAngle) * labelRadius * 0.8;
                const labelY: number = cy + Math.sin(labelAngle) * labelRadius * 0.8;
                const labelText: string = zone.label + ' ' + radii[zone.key].toFixed(1) + 'km';
                const textWidth: number = mapCtx.measureText(labelText).width;
                mapCtx.fillStyle = rgba(0, 0, 0, 0.6);
                mapCtx.fillRect(labelX - 2, labelY - 10, textWidth + 8, 16);
                mapCtx.fillStyle = colors.border;
                mapCtx.font = 'bold 11px sans-serif';
                mapCtx.textAlign = 'left';
                mapCtx.fillText(labelText, labelX + 2, labelY + 2);
            }
        });
    }

    function drawExplosionMarker(
        mapCtx: CanvasRenderingContext2D,
        cx: number, cy: number,
        number: number,
        isSelected: boolean
    ): void {
        const ringRadius: number = isSelected ? 12 : 9;
        const innerRadius: number = isSelected ? 9 : 6;

        if (isSelected) {
            mapCtx.beginPath();
            mapCtx.arc(cx, cy, ringRadius + 4, 0, Math.PI * 2);
            mapCtx.strokeStyle = rgba(255, 255, 255, 0.4);
            mapCtx.lineWidth = 2;
            mapCtx.setLineDash([4, 3]);
            mapCtx.stroke();
            mapCtx.setLineDash([]);
        }

        mapCtx.beginPath();
        mapCtx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        const centerGrad: CanvasGradient = mapCtx.createRadialGradient(cx, cy, 0, cx, cy, ringRadius);
        if (isSelected) {
            centerGrad.addColorStop(0, '#ffffff');
            centerGrad.addColorStop(0.5, '#ffdd00');
            centerGrad.addColorStop(1, '#ff8800');
        } else {
            centerGrad.addColorStop(0, '#ffffff');
            centerGrad.addColorStop(0.5, '#ff6666');
            centerGrad.addColorStop(1, '#cc2222');
        }
        mapCtx.fillStyle = centerGrad;
        mapCtx.fill();

        mapCtx.strokeStyle = rgba(255, 255, 255, 0.9);
        mapCtx.lineWidth = 2;
        mapCtx.stroke();

        mapCtx.beginPath();
        mapCtx.moveTo(cx - 10, cy);
        mapCtx.lineTo(cx + 10, cy);
        mapCtx.moveTo(cx, cy - 10);
        mapCtx.lineTo(cx, cy + 10);
        mapCtx.strokeStyle = rgba(0, 0, 0, 0.6);
        mapCtx.lineWidth = 1;
        mapCtx.stroke();

        mapCtx.fillStyle = '#ffffff';
        mapCtx.font = 'bold ' + (isSelected ? '12px' : '11px') + ' sans-serif';
        mapCtx.textAlign = 'center';
        mapCtx.textBaseline = 'middle';
        mapCtx.strokeStyle = rgba(0, 0, 0, 0.8);
        mapCtx.lineWidth = 3;
        mapCtx.strokeText('#' + number, cx, cy);
        mapCtx.fillText('#' + number, cx, cy);
        mapCtx.textBaseline = 'alphabetic';

        if (isSelected) {
            mapCtx.fillStyle = rgba(255, 221, 0, 0.95);
            mapCtx.font = 'bold 10px sans-serif';
            mapCtx.textAlign = 'center';
            const label: string = '爆炸点 #' + number;
            const tw: number = mapCtx.measureText(label).width;
            const lx: number = cx;
            const ly: number = cy - ringRadius - 10;
            mapCtx.fillStyle = rgba(0, 0, 0, 0.75);
            mapCtx.fillRect(lx - tw / 2 - 6, ly - 12, tw + 12, 16);
            mapCtx.fillStyle = '#ffdd00';
            mapCtx.fillText(label, lx, ly);
        }
    }

    global.Renderer = {
        setupCanvas: setupCanvas,
        drawMap: drawMap,
        drawOneExplosionZones: drawOneExplosionZones,
        drawAllOverlapHighlights: drawAllOverlapHighlights,
        drawPolygonPathFromPoints: drawPolygonPathFromPoints,
        getZoneColors: getZoneColors,
        getZoneDefs: getZoneDefs,
        getOverlayHatchColors: getOverlayHatchColors
    };

})(window);
