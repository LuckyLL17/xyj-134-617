import type {
    AppState,
    City,
    Shelter,
    EvacuationPlan,
    EvacuationNode,
    EvacuationEdge,
    DataDisplayElements
} from '../types';

(function (global: Window) {
    'use strict';

    const rgba = (global.DataDisplay as any).rgba;

    const VEHICLE_COLORS: string[] = [
        '#4a9eff', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc',
        '#26c6da', '#ffca28', '#8d6e63', '#ec407a', '#78909c'
    ];

    interface VehicleParticle {
        planIndex: number;
        pathIndex: number;
        pathProgress: number;
        startDelay: number;
        speed: number;
        size: number;
        color: string;
        active: boolean;
        completed: boolean;
        x: number;
        y: number;
    }

    interface CityPlan {
        cityIndex: number;
        evacuated: number;
        path: EvacuationEdge[];
        travelTimeHours: number;
        canEvacuate?: boolean;
    }

    interface ExtendedEvacuationPlan extends EvacuationPlan {
        cityPlans?: CityPlan[];
        roadDensities?: { edge: EvacuationEdge; density: number }[];
        graph?: { nodes: EvacuationNode[] };
        totalEvacuated?: number;
    }

    function createVehicleParticles(
        evacuationPlan: ExtendedEvacuationPlan,
        cities: City[],
        shelters: Shelter[],
        scale: number
    ): VehicleParticle[] {
        const particles: VehicleParticle[] = [];
        const cityPlans = evacuationPlan.cityPlans;

        if (!cityPlans) return particles;

        cityPlans.forEach(function (plan: CityPlan, planIdx: number) {
            if (plan.evacuated <= 0 || !plan.path || plan.path.length === 0) return;

            const city = cities[plan.cityIndex];
            const vehicleCount = Math.min(200, Math.floor(plan.evacuated / 100));

            for (let i = 0; i < vehicleCount; i++) {
                const startDelay = Math.random() * 0.6;
                const colorIdx = Math.floor(Math.random() * VEHICLE_COLORS.length);

                particles.push({
                    planIndex: planIdx,
                    pathIndex: 0,
                    pathProgress: 0,
                    startDelay: startDelay,
                    speed: 0.8 + Math.random() * 0.4,
                    size: 3 + Math.random() * 2,
                    color: VEHICLE_COLORS[colorIdx],
                    active: false,
                    completed: false,
                    x: city.x,
                    y: city.y
                });
            }
        });

        return particles;
    }

    interface VehicleStats {
        total: number;
        active: number;
        completed: number;
    }

    function updateVehicles(
        particles: VehicleParticle[],
        evacuationPlan: ExtendedEvacuationPlan,
        cities: City[],
        shelters: Shelter[],
        graph: { nodes: EvacuationNode[] },
        deltaTime: number,
        speedMultiplier: number
    ): VehicleStats {
        const nodes = graph.nodes;
        let completedCount = 0;
        let activeCount = 0;

        particles.forEach(function (p: VehicleParticle) {
            if (p.completed) {
                completedCount++;
                return;
            }

            const plan = evacuationPlan.cityPlans?.[p.planIndex];
            if (!plan || !plan.path || plan.path.length === 0) {
                p.completed = true;
                completedCount++;
                return;
            }

            if (p.startDelay > 0) {
                p.startDelay -= deltaTime * speedMultiplier * 0.5;
                return;
            }

            p.active = true;
            activeCount++;

            const currentEdge = plan.path[p.pathIndex];
            if (!currentEdge) {
                p.completed = true;
                completedCount++;
                return;
            }

            const fromNode = nodes[currentEdge.from];
            const toNode = nodes[currentEdge.to];

            const edgeLength = currentEdge.lengthPx;
            const progressPerSecond = (p.speed * 60) / edgeLength * 0.3;

            p.pathProgress += progressPerSecond * deltaTime * speedMultiplier;

            if (p.pathProgress >= 1) {
                p.pathProgress = 0;
                p.pathIndex++;

                if (p.pathIndex >= plan.path.length) {
                    p.completed = true;
                    completedCount++;
                    if (toNode) {
                        p.x = toNode.x;
                        p.y = toNode.y;
                    }
                    return;
                }
            }

            const t = p.pathProgress;
            p.x = fromNode.x + (toNode.x - fromNode.x) * t;
            p.y = fromNode.y + (toNode.y - fromNode.y) * t;
        });

        return {
            total: particles.length,
            active: activeCount,
            completed: completedCount
        };
    }

    function drawRoadDensity(
        ctx: CanvasRenderingContext2D,
        evacuationPlan: ExtendedEvacuationPlan,
        state: AppState
    ): void {
        const roadDensities = evacuationPlan.roadDensities;
        if (!roadDensities) return;

        roadDensities.forEach(function (rd: { edge: EvacuationEdge; density: number }) {
            const edge = rd.edge;
            const density = rd.density;

            const fromNode = evacuationPlan.graph?.nodes[edge.from];
            const toNode = evacuationPlan.graph?.nodes[edge.to];

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

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();
        });
    }

    function drawShelters(
        ctx: CanvasRenderingContext2D,
        shelters: Shelter[],
        state: AppState
    ): void {
        shelters.forEach(function (shelter: Shelter, idx: number) {
            const x = shelter.x;
            const y = shelter.y;
            const size = 24;

            const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
            glowGrad.addColorStop(0, rgba(0, 255, 136, 0.3));
            glowGrad.addColorStop(1, rgba(0, 255, 136, 0));
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(x, y, size * 2, 0, Math.PI * 2);
            ctx.fill();

            const bgGrad = ctx.createRadialGradient(x, y, 0, x, y, size);
            bgGrad.addColorStop(0, '#00ff88');
            bgGrad.addColorStop(0.7, '#00cc6a');
            bgGrad.addColorStop(1, '#008844');
            ctx.fillStyle = bgGrad;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏠', x, y);

            if (state.showLabels) {
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                const label = (shelter as any).name || `避难所${idx + 1}`;
                const tw = ctx.measureText(label).width;
                ctx.fillRect(x - tw / 2 - 6, y + size + 4, tw + 12, 18);
                ctx.fillStyle = '#00ff88';
                ctx.font = '11px sans-serif';
                ctx.fillText(label, x, y + size + 15);
            }

            if (state.showLabels) {
                const capLabel = '容量: ' + formatNumber(shelter.capacity);
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                const capTw = ctx.measureText(capLabel).width;
                ctx.fillRect(x - capTw / 2 - 6, y + size + 22, capTw + 12, 16);
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = '10px sans-serif';
                ctx.fillText(capLabel, x, y + size + 33);
            }
        });
    }

    function drawVehicles(
        ctx: CanvasRenderingContext2D,
        particles: VehicleParticle[]
    ): void {
        particles.forEach(function (p: VehicleParticle) {
            if (p.completed || !p.active) return;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }

    function drawEvacuationFlowArrows(
        ctx: CanvasRenderingContext2D,
        evacuationPlan: ExtendedEvacuationPlan
    ): void {
        const cityPlans = evacuationPlan.cityPlans;
        if (!cityPlans) return;

        cityPlans.forEach(function (plan: CityPlan) {
            if (!plan.path || plan.path.length === 0 || plan.evacuated <= 0) return;

            const nodes = evacuationPlan.graph?.nodes;
            if (!nodes) return;

            plan.path.forEach(function (edge: EvacuationEdge, edgeIdx: number) {
                const fromNode = nodes[edge.from];
                const toNode = nodes[edge.to];
                if (!fromNode || !toNode) return;

                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;

                const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
                const arrowSize = 8;

                let arrowAlpha: number;
                if (plan.canEvacuate) {
                    arrowAlpha = 0.6;
                } else {
                    arrowAlpha = 0.3;
                }

                ctx.save();
                ctx.translate(midX, midY);
                ctx.rotate(angle);

                ctx.fillStyle = plan.canEvacuate
                    ? rgba(100, 200, 255, arrowAlpha)
                    : rgba(255, 100, 100, arrowAlpha);

                ctx.beginPath();
                ctx.moveTo(arrowSize, 0);
                ctx.lineTo(-arrowSize / 2, -arrowSize / 2);
                ctx.lineTo(-arrowSize / 2, arrowSize / 2);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            });
        });
    }

    function formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toString();
    }

    interface AnimationState {
        isPlaying: boolean;
        animationId: number | null;
        startTime: number;
        lastTime: number;
        particles: VehicleParticle[];
        speed: number;
        currentTime: number;
        maxTime: number;
    }

    let animationState: AnimationState = {
        isPlaying: false,
        animationId: null,
        startTime: 0,
        lastTime: 0,
        particles: [],
        speed: 1,
        currentTime: 0,
        maxTime: 1
    };

    interface EvacuationElements {
        evacProgress?: HTMLElement;
        evacEvacuated?: HTMLElement;
        evacStranded?: HTMLElement;
        evacTime?: HTMLElement;
        evacStartBtn?: HTMLButtonElement;
        [key: string]: HTMLElement | HTMLButtonElement | undefined;
    }

    function startEvacuationAnimation(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        state: AppState,
        elements: EvacuationElements | undefined,
        evacuationPlan: ExtendedEvacuationPlan
    ): void {
        if (animationState.isPlaying) return;
        if (!evacuationPlan || !evacuationPlan.cityPlans) return;

        animationState.isPlaying = true;
        animationState.particles = createVehicleParticles(
            evacuationPlan,
            state.cities,
            state.shelters,
            state.scale
        );
        animationState.currentTime = 0;

        let maxTravelTime = 0;
        evacuationPlan.cityPlans.forEach(function (plan: CityPlan) {
            if (plan.travelTimeHours < Infinity && plan.travelTimeHours > maxTravelTime) {
                maxTravelTime = plan.travelTimeHours;
            }
        });
        animationState.maxTime = Math.max(0.5, maxTravelTime * 1.2);

        animationState.lastTime = performance.now();
        animationState.startTime = animationState.lastTime;

        function animate(now: number): void {
            if (!animationState.isPlaying) return;

            const deltaTime = (now - animationState.lastTime) / 1000;
            animationState.lastTime = now;

            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            const stats = updateVehicles(
                animationState.particles,
                evacuationPlan,
                state.cities,
                state.shelters,
                evacuationPlan.graph!,
                deltaTime,
                animationState.speed
            );

            animationState.currentTime += deltaTime * animationState.speed;

            ctx.clearRect(0, 0, width, height);

            drawRoadDensity(ctx, evacuationPlan, state);
            drawEvacuationFlowArrows(ctx, evacuationPlan);
            drawShelters(ctx, state.shelters, state);
            drawVehicles(ctx, animationState.particles);

            const progress = Math.min(1, animationState.currentTime / animationState.maxTime);
            const totalEvacuated = evacuationPlan.totalEvacuated || 0;
            const totalPopulation = evacuationPlan.totalPopulation;
            const evacuatedSoFar = Math.floor(totalEvacuated * Math.min(1, progress * 1.5));
            const strandedSoFar = totalPopulation - evacuatedSoFar;

            if (elements) {
                if (elements.evacProgress) {
                    elements.evacProgress.textContent = Math.round(progress * 100) + '%';
                }
                if (elements.evacEvacuated) {
                    elements.evacEvacuated.textContent = formatNumber(evacuatedSoFar);
                }
                if (elements.evacStranded) {
                    elements.evacStranded.textContent = formatNumber(Math.max(0, strandedSoFar));
                }
                if (elements.evacTime) {
                    elements.evacTime.textContent = animationState.currentTime.toFixed(1) + ' 小时';
                }
            }

            if (progress < 1 && stats.completed < stats.total) {
                animationState.animationId = requestAnimationFrame(animate);
            } else {
                animationState.isPlaying = false;
                if (elements && elements.evacStartBtn) {
                    elements.evacStartBtn.textContent = '▶ 重新播放';
                    elements.evacStartBtn.disabled = false;
                }
            }
        }

        animationState.animationId = requestAnimationFrame(animate);
    }

    function stopEvacuationAnimation(): void {
        animationState.isPlaying = false;
        if (animationState.animationId) {
            cancelAnimationFrame(animationState.animationId);
            animationState.animationId = null;
        }
    }

    function resetEvacuationAnimation(
        ctx: CanvasRenderingContext2D,
        canvas: HTMLCanvasElement,
        state: AppState,
        evacuationPlan: ExtendedEvacuationPlan
    ): void {
        stopEvacuationAnimation();
        animationState.currentTime = 0;
        animationState.particles = [];

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        if (evacuationPlan) {
            drawRoadDensity(ctx, evacuationPlan, state);
            drawEvacuationFlowArrows(ctx, evacuationPlan);
            drawShelters(ctx, state.shelters, state);
        }
    }

    function isEvacuating(): boolean {
        return animationState.isPlaying;
    }

    function setSpeed(speed: number): void {
        animationState.speed = speed;
    }

    function drawEvacuationStatic(
        ctx: CanvasRenderingContext2D,
        state: AppState,
        evacuationPlan: ExtendedEvacuationPlan
    ): void {
        if (!evacuationPlan) return;
        drawRoadDensity(ctx, evacuationPlan, state);
        drawEvacuationFlowArrows(ctx, evacuationPlan);
        drawShelters(ctx, state.shelters, state);
    }

    global.Evacuation = {
        createVehicleParticles: createVehicleParticles,
        updateVehicles: updateVehicles,
        drawRoadDensity: drawRoadDensity,
        drawShelters: drawShelters,
        drawVehicles: drawVehicles,
        drawEvacuationFlowArrows: drawEvacuationFlowArrows,
        drawEvacuationStatic: drawEvacuationStatic,
        startEvacuationAnimation: startEvacuationAnimation,
        stopEvacuationAnimation: stopEvacuationAnimation,
        resetEvacuationAnimation: resetEvacuationAnimation,
        isEvacuating: isEvacuating,
        setSpeed: setSpeed,
        formatNumber: formatNumber
    } as any;

})(window);
