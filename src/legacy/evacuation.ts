import type { City, Shelter, EvacNode, EvacEdge } from '../types';

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
  path: EvacEdge[];
  evacuated: number;
  travelTimeHours: number;
  canEvacuate: boolean;
}

interface RoadDensity {
  edge: EvacEdge;
  density: number;
}

interface EvacuationGraph {
  nodes: EvacNode[];
  edges: EvacEdge[];
}

interface EvacuationPlan {
  cityPlans: CityPlan[];
  roadDensities: RoadDensity[];
  graph: EvacuationGraph;
  totalEvacuated: number;
  totalPopulation: number;
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

interface EvacuationElements {
  evacProgress?: HTMLElement | null;
  evacEvacuated?: HTMLElement | null;
  evacStranded?: HTMLElement | null;
  evacTime?: HTMLElement | null;
  evacStartBtn?: HTMLElement | null;
}

interface VehicleStats {
  total: number;
  active: number;
  completed: number;
}

(function (global: Window & typeof globalThis): void {
  'use strict';

  const rgba: (r: number, g: number, b: number, a: number) => string = (global as any).DataDisplay.rgba;

  const VEHICLE_COLORS: string[] = [
    '#4a9eff', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc',
    '#26c6da', '#ffca28', '#8d6e63', '#ec407a', '#78909c'
  ];

  function createVehicleParticles(
    evacuationPlan: EvacuationPlan,
    cities: City[],
    shelters: Shelter[],
    scale: number
  ): VehicleParticle[] {
    const particles: VehicleParticle[] = [];
    const cityPlans: CityPlan[] = evacuationPlan.cityPlans;

    cityPlans.forEach(function (plan: CityPlan, planIdx: number): void {
      if (plan.evacuated <= 0 || !plan.path || plan.path.length === 0) return;

      const city: City = cities[plan.cityIndex];
      const vehicleCount: number = Math.min(200, Math.floor(plan.evacuated / 100));

      for (let i: number = 0; i < vehicleCount; i++) {
        const startDelay: number = Math.random() * 0.6;
        const colorIdx: number = Math.floor(Math.random() * VEHICLE_COLORS.length);

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

  function updateVehicles(
    particles: VehicleParticle[],
    evacuationPlan: EvacuationPlan,
    cities: City[],
    shelters: Shelter[],
    graph: EvacuationGraph,
    deltaTime: number,
    speedMultiplier: number
  ): VehicleStats {
    const nodes: EvacNode[] = graph.nodes;
    let completedCount: number = 0;
    let activeCount: number = 0;

    particles.forEach(function (p: VehicleParticle): void {
      if (p.completed) {
        completedCount++;
        return;
      }

      const plan: CityPlan = evacuationPlan.cityPlans[p.planIndex];
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

      const currentEdge: EvacEdge = plan.path[p.pathIndex];
      if (!currentEdge) {
        p.completed = true;
        completedCount++;
        return;
      }

      const fromNode: EvacNode = nodes[currentEdge.from];
      const toNode: EvacNode = nodes[currentEdge.to];

      const edgeLength: number = currentEdge.lengthPx;
      const progressPerSecond: number = (p.speed * 60) / edgeLength * 0.3;

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

      const t: number = p.pathProgress;
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
    evacuationPlan: EvacuationPlan,
    state: any
  ): void {
    const roadDensities: RoadDensity[] = evacuationPlan.roadDensities;

    roadDensities.forEach(function (rd: RoadDensity): void {
      const edge: EvacEdge = rd.edge;
      const density: number = rd.density;

      const fromNode: EvacNode = evacuationPlan.graph.nodes[edge.from];
      const toNode: EvacNode = evacuationPlan.graph.nodes[edge.to];

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
    state: any
  ): void {
    shelters.forEach(function (shelter: Shelter, idx: number): void {
      const x: number = shelter.x;
      const y: number = shelter.y;
      const size: number = 24;

      const glowGrad: CanvasGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      glowGrad.addColorStop(0, rgba(0, 255, 136, 0.3));
      glowGrad.addColorStop(1, rgba(0, 255, 136, 0));
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();

      const bgGrad: CanvasGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
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
        const label: string = (shelter as any).name || '';
        const tw: number = ctx.measureText(label).width;
        ctx.fillRect(x - tw / 2 - 6, y + size + 4, tw + 12, 18);
        ctx.fillStyle = '#00ff88';
        ctx.font = '11px sans-serif';
        ctx.fillText(label, x, y + size + 15);
      }

      if (state.showLabels) {
        const capLabel: string = '容量: ' + formatNumber(shelter.capacity);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        const capTw: number = ctx.measureText(capLabel).width;
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
    particles.forEach(function (p: VehicleParticle): void {
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
    evacuationPlan: EvacuationPlan
  ): void {
    const cityPlans: CityPlan[] = evacuationPlan.cityPlans;

    cityPlans.forEach(function (plan: CityPlan): void {
      if (!plan.path || plan.path.length === 0 || plan.evacuated <= 0) return;

      const nodes: EvacNode[] = evacuationPlan.graph.nodes;

      plan.path.forEach(function (edge: EvacEdge, edgeIdx: number): void {
        const fromNode: EvacNode = nodes[edge.from];
        const toNode: EvacNode = nodes[edge.to];
        if (!fromNode || !toNode) return;

        const midX: number = (fromNode.x + toNode.x) / 2;
        const midY: number = (fromNode.y + toNode.y) / 2;

        const angle: number = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowSize: number = 8;

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

  function startEvacuationAnimation(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: any,
    elements: EvacuationElements | null,
    evacuationPlan: EvacuationPlan
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

    let maxTravelTime: number = 0;
    evacuationPlan.cityPlans.forEach(function (plan: CityPlan): void {
      if (plan.travelTimeHours < Infinity && plan.travelTimeHours > maxTravelTime) {
        maxTravelTime = plan.travelTimeHours;
      }
    });
    animationState.maxTime = Math.max(0.5, maxTravelTime * 1.2);

    animationState.lastTime = performance.now();
    animationState.startTime = animationState.lastTime;

    function animate(now: number): void {
      if (!animationState.isPlaying) return;

      const deltaTime: number = (now - animationState.lastTime) / 1000;
      animationState.lastTime = now;

      const rect: DOMRect = canvas.getBoundingClientRect();
      const width: number = rect.width;
      const height: number = rect.height;

      const stats: VehicleStats = updateVehicles(
        animationState.particles,
        evacuationPlan,
        state.cities,
        state.shelters,
        evacuationPlan.graph,
        deltaTime,
        animationState.speed
      );

      animationState.currentTime += deltaTime * animationState.speed;

      ctx.clearRect(0, 0, width, height);

      drawRoadDensity(ctx, evacuationPlan, state);
      drawEvacuationFlowArrows(ctx, evacuationPlan);
      drawShelters(ctx, state.shelters, state);
      drawVehicles(ctx, animationState.particles);

      const progress: number = Math.min(1, animationState.currentTime / animationState.maxTime);
      const evacuatedSoFar: number = Math.floor(evacuationPlan.totalEvacuated * Math.min(1, progress * 1.5));
      const strandedSoFar: number = evacuationPlan.totalPopulation - evacuatedSoFar;

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
          (elements.evacStartBtn as HTMLButtonElement).disabled = false;
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
    state: any,
    evacuationPlan: EvacuationPlan
  ): void {
    stopEvacuationAnimation();
    animationState.currentTime = 0;
    animationState.particles = [];

    const rect: DOMRect = canvas.getBoundingClientRect();
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
    state: any,
    evacuationPlan: EvacuationPlan
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
  };

})(window);
