import type { Explosion, City, TerrainData, CasualtyResult } from '../types';

interface TimelineStageDef {
  id: number;
  name: string;
  timeLabel: string;
  description: string;
  falloutRadiusFactor: number;
  deathFactor: number;
  injuredFactor: number;
}

interface WindDirection {
  angle: number;
  name: string;
}

interface TimelineState {
  isActive: boolean;
  isPlaying: boolean;
  currentProgress: number;
  speed: number;
  animationId: number | null;
  lastTimestamp: number | null;
  baseCasualties: CasualtyResult;
  baseFalloutRadius: number;
  windDirection: number;
  windStrength: number;
  explosions: Explosion[];
  cities: City[];
  scale: number;
  terrainData: TerrainData | null;
}

interface InterpolatedValues {
  stage: TimelineStageDef;
  nextStage?: TimelineStageDef;
  stageProgress?: number;
  falloutRadiusFactor: number;
  deathFactor: number;
  injuredFactor: number;
}

interface TrendData {
  deaths: number[];
  injured: number[];
}

interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface Point2D {
  x: number;
  y: number;
}

type TimelineElements = Record<string, HTMLElement | null>;

(function (global: Window & typeof globalThis): void {
  'use strict';

  const rgba: (r: number, g: number, b: number, a: number) => string = (global as any).DataDisplay.rgba;
  const formatNumber: (num: number) => string = (global as any).DataDisplay.formatNumber;

  const TIMELINE_STAGES: TimelineStageDef[] = [
    {
      id: 0,
      name: '爆炸瞬间',
      timeLabel: 'T+0',
      description: '核爆炸发生的瞬间，冲击波、热辐射和初始核辐射立即释放',
      falloutRadiusFactor: 0.1,
      deathFactor: 0.6,
      injuredFactor: 0.3
    },
    {
      id: 1,
      name: '早期沉降',
      timeLabel: '1小时',
      description: '大颗粒放射性尘埃在爆炸后数小时内沉降到爆炸点附近',
      falloutRadiusFactor: 0.35,
      deathFactor: 0.78,
      injuredFactor: 0.55
    },
    {
      id: 2,
      name: '中期扩散',
      timeLabel: '1天',
      description: '放射性云团随风扩散，中等颗粒沉降到更远区域',
      falloutRadiusFactor: 0.65,
      deathFactor: 0.88,
      injuredFactor: 0.75
    },
    {
      id: 3,
      name: '晚期沉降',
      timeLabel: '1周',
      description: '细小放射性颗粒随大气环流扩散，造成大范围污染',
      falloutRadiusFactor: 0.85,
      deathFactor: 0.94,
      injuredFactor: 0.88
    },
    {
      id: 4,
      name: '长期影响',
      timeLabel: '1月',
      description: '长期放射性沾染，致癌和遗传效应逐渐显现',
      falloutRadiusFactor: 1.0,
      deathFactor: 1.0,
      injuredFactor: 1.0
    }
  ];

  const WIN_DIRECTIONS: WindDirection[] = [
    { angle: 0, name: '东风' },
    { angle: Math.PI / 4, name: '东南风' },
    { angle: Math.PI / 2, name: '南风' },
    { angle: Math.PI * 3 / 4, name: '西南风' },
    { angle: Math.PI, name: '西风' },
    { angle: Math.PI * 5 / 4, name: '西北风' },
    { angle: Math.PI * 3 / 2, name: '北风' },
    { angle: Math.PI * 7 / 4, name: '东北风' }
  ];

  let timelineState: TimelineState = {
    isActive: false,
    isPlaying: false,
    currentProgress: 0,
    speed: 1,
    animationId: null,
    lastTimestamp: 0,
    baseCasualties: { deaths: 0, injured: 0 },
    baseFalloutRadius: 0,
    windDirection: 0,
    windStrength: 1,
    explosions: [],
    cities: [],
    scale: 20,
    terrainData: null
  };

  let elements: TimelineElements = {};
  let effectCtx: CanvasRenderingContext2D | null = null;
  let effectCanvas: HTMLCanvasElement | null = null;
  let trendChartCtx: CanvasRenderingContext2D | null = null;
  let trendChartCanvas: HTMLCanvasElement | null = null;

  function initTimeline(): void {
    const elementIds: string[] = [
      'timelinePanel', 'timelineModeBadge', 'timelineStages',
      'timelinePlayBtn', 'timelineResetBtn', 'timelineSlider', 'timelineSpeed',
      'timelineCurrentTime', 'timelineDeaths', 'timelineInjured', 'timelineFalloutArea',
      'trendChartCanvas', 'effectCanvas'
    ];

    elementIds.forEach(function (id: string): void {
      elements[id] = document.getElementById(id);
    });

    effectCanvas = elements.effectCanvas as HTMLCanvasElement | null;
    if (effectCanvas) {
      effectCtx = effectCanvas.getContext('2d');
    }

    trendChartCanvas = elements.trendChartCanvas as HTMLCanvasElement | null;
    if (trendChartCanvas) {
      trendChartCtx = trendChartCanvas.getContext('2d');
      setupTrendChartCanvas();
    }

    setupEventListeners();
  }

  function setupTrendChartCanvas(): void {
    const dpr: number = window.devicePixelRatio || 1;
    const rect: DOMRect = trendChartCanvas!.getBoundingClientRect();
    trendChartCanvas!.width = rect.width * dpr;
    trendChartCanvas!.height = 180 * dpr;
    trendChartCtx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function setupEventListeners(): void {
    if (elements.timelinePlayBtn) {
      elements.timelinePlayBtn.addEventListener('click', togglePlay);
    }

    if (elements.timelineResetBtn) {
      elements.timelineResetBtn.addEventListener('click', resetTimeline);
    }

    if (elements.timelineSlider) {
      elements.timelineSlider.addEventListener('input', function (e: Event): void {
        if (!timelineState.isActive) return;
        const progress: number = parseInt((e.target as HTMLInputElement).value, 10) / 1000;
        setTimelineProgress(progress);
      });
    }

    if (elements.timelineSpeed) {
      elements.timelineSpeed.addEventListener('change', function (e: Event): void {
        timelineState.speed = parseFloat((e.target as HTMLSelectElement).value);
      });
    }

    if (elements.timelineStages) {
      elements.timelineStages.querySelectorAll('.stage-dot').forEach(function (dot: Element): void {
        dot.addEventListener('click', function (): void {
          if (!timelineState.isActive) return;
          const stageId: number = parseInt((dot as HTMLElement).dataset.stage!, 10);
          const progress: number = stageId / (TIMELINE_STAGES.length - 1);
          setTimelineProgress(progress);
        });
      });
    }

    let resizeTimeout: number | undefined;
    window.addEventListener('resize', function (): void {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function (): void {
        if (trendChartCanvas) {
          setupTrendChartCanvas();
          drawTrendChart();
        }
      }, 200);
    });
  }

  function startTimelineMode(state: any, ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null): void {
    const activeExplosions: Explosion[] = state.explosions.filter(function (e: Explosion): boolean {
      return !!e.explosionCenter && !!e.radii;
    });

    if (activeExplosions.length === 0) return;

    timelineState.isActive = true;
    timelineState.isPlaying = false;
    timelineState.currentProgress = 0;
    timelineState.explosions = activeExplosions;
    timelineState.cities = state.cities;
    timelineState.scale = state.scale;
    timelineState.terrainData = state.terrainData;

    const casualties: CasualtyResult = (global as any).Physics.calculateCasualtiesTerrainAware(
      state.cities, activeExplosions, state.scale, state.terrainData
    );
    timelineState.baseCasualties = casualties;

    let maxFalloutRadius: number = 0;
    activeExplosions.forEach(function (exp: Explosion): void {
      const falloutR: number = (exp.radii as Record<string, number>).thermal * 2.5;
      if (falloutR > maxFalloutRadius) maxFalloutRadius = falloutR;
    });
    timelineState.baseFalloutRadius = maxFalloutRadius;

    const randIdx: number = Math.floor(Math.random() * WIN_DIRECTIONS.length);
    timelineState.windDirection = WIN_DIRECTIONS[randIdx].angle;
    timelineState.windStrength = 0.8 + Math.random() * 0.6;

    if (ctx) effectCtx = ctx;
    if (canvas) effectCanvas = canvas;

    enableControls(true);
    updateModeBadge(true);
    setTimelineProgress(0);
    drawTrendChart();
  }

  function stopTimelineMode(): void {
    if (timelineState.animationId) {
      cancelAnimationFrame(timelineState.animationId);
      timelineState.animationId = null;
    }

    timelineState.isActive = false;
    timelineState.isPlaying = false;
    timelineState.currentProgress = 0;

    enableControls(false);
    updateModeBadge(false);
    clearFalloutOverlay();
  }

  function enableControls(enabled: boolean): void {
    if (elements.timelinePlayBtn) (elements.timelinePlayBtn as HTMLButtonElement).disabled = !enabled;
    if (elements.timelineResetBtn) (elements.timelineResetBtn as HTMLButtonElement).disabled = !enabled;
    if (elements.timelineSlider) (elements.timelineSlider as HTMLInputElement).disabled = !enabled;
    if (elements.timelineSpeed) (elements.timelineSpeed as HTMLSelectElement).disabled = !enabled;

    elements.timelineStages!.querySelectorAll('.stage-dot').forEach(function (dot: Element): void {
      if (enabled) {
        dot.classList.remove('disabled');
      } else {
        dot.classList.add('disabled');
      }
    });
  }

  function updateModeBadge(active: boolean): void {
    if (!elements.timelineModeBadge) return;
    if (active) {
      elements.timelineModeBadge.textContent = '推演模式';
      elements.timelineModeBadge.classList.add('active');
    } else {
      elements.timelineModeBadge.textContent = '待机中';
      elements.timelineModeBadge.classList.remove('active');
    }
  }

  function togglePlay(): void {
    if (!timelineState.isActive) return;

    if (timelineState.isPlaying) {
      pauseTimeline();
    } else {
      playTimeline();
    }
  }

  function playTimeline(): void {
    if (!timelineState.isActive) return;
    if (timelineState.currentProgress >= 1) {
      timelineState.currentProgress = 0;
    }

    timelineState.isPlaying = true;
    timelineState.lastTimestamp = null;

    if (elements.timelinePlayBtn) {
      elements.timelinePlayBtn.innerHTML = '<span class="btn-icon">⏸</span> 暂停';
      elements.timelinePlayBtn.classList.add('playing');
    }

    timelineState.animationId = requestAnimationFrame(animateTimeline);
  }

  function pauseTimeline(): void {
    timelineState.isPlaying = false;

    if (timelineState.animationId) {
      cancelAnimationFrame(timelineState.animationId);
      timelineState.animationId = null;
    }

    if (elements.timelinePlayBtn) {
      elements.timelinePlayBtn.innerHTML = '<span class="btn-icon">▶</span> 播放';
      elements.timelinePlayBtn.classList.remove('playing');
    }
  }

  function resetTimeline(): void {
    if (!timelineState.isActive) return;
    pauseTimeline();
    setTimelineProgress(0);
  }

  function animateTimeline(timestamp: number): void {
    if (!timelineState.isPlaying) return;

    if (!timelineState.lastTimestamp) {
      timelineState.lastTimestamp = timestamp;
    }

    const delta: number = timestamp - timelineState.lastTimestamp;
    timelineState.lastTimestamp = timestamp;

    const progressIncrement: number = (delta / 1000) * 0.1 * timelineState.speed;
    let newProgress: number = timelineState.currentProgress + progressIncrement;

    if (newProgress >= 1) {
      newProgress = 1;
      setTimelineProgress(1);
      pauseTimeline();
      return;
    }

    setTimelineProgress(newProgress);
    timelineState.animationId = requestAnimationFrame(animateTimeline);
  }

  function setTimelineProgress(progress: number): void {
    timelineState.currentProgress = Math.max(0, Math.min(1, progress));

    if (elements.timelineSlider) {
      (elements.timelineSlider as HTMLInputElement).value = Math.round(timelineState.currentProgress * 1000).toString();
    }

    updateStageIndicators();
    updateTimelineInfo();
    drawFalloutOverlay();
    drawTrendChart();
  }

  function updateStageIndicators(): void {
    const stageCount: number = TIMELINE_STAGES.length;
    const currentStageFloat: number = timelineState.currentProgress * (stageCount - 1);
    const currentStageIdx: number = Math.round(currentStageFloat);

    elements.timelineStages!.querySelectorAll('.stage-dot').forEach(function (dot: Element, idx: number): void {
      dot.classList.remove('active', 'completed');

      if (idx < currentStageIdx) {
        dot.classList.add('completed');
      } else if (idx === currentStageIdx) {
        dot.classList.add('active');
      }
    });

    const stageLines: NodeListOf<Element> = elements.timelineStages!.querySelectorAll('.stage-line');
    stageLines.forEach(function (line: Element, idx: number): void {
      if (idx < currentStageIdx) {
        line.classList.add('filled');
      } else {
        line.classList.remove('filled');
      }
    });
  }

  function getInterpolatedValues(progress: number): InterpolatedValues {
    const stageCount: number = TIMELINE_STAGES.length;
    const stageFloat: number = progress * (stageCount - 1);
    const stageIdx: number = Math.floor(stageFloat);
    const stageProgress: number = stageFloat - stageIdx;

    if (stageIdx >= stageCount - 1) {
      const last: TimelineStageDef = TIMELINE_STAGES[stageCount - 1];
      return {
        stage: last,
        falloutRadiusFactor: last.falloutRadiusFactor,
        deathFactor: last.deathFactor,
        injuredFactor: last.injuredFactor
      };
    }

    const current: TimelineStageDef = TIMELINE_STAGES[stageIdx];
    const next: TimelineStageDef = TIMELINE_STAGES[stageIdx + 1];

    const easeProgress: number = easeInOutCubic(stageProgress);

    return {
      stage: current,
      nextStage: next,
      stageProgress: stageProgress,
      falloutRadiusFactor: lerp(current.falloutRadiusFactor, next.falloutRadiusFactor, easeProgress),
      deathFactor: lerp(current.deathFactor, next.deathFactor, easeProgress),
      injuredFactor: lerp(current.injuredFactor, next.injuredFactor, easeProgress)
    };
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function updateTimelineInfo(): void {
    const values: InterpolatedValues = getInterpolatedValues(timelineState.currentProgress);
    const stageIdx: number = Math.round(timelineState.currentProgress * (TIMELINE_STAGES.length - 1));
    const stage: TimelineStageDef = TIMELINE_STAGES[stageIdx];

    const deaths: number = Math.round(timelineState.baseCasualties.deaths * values.deathFactor);
    const injured: number = Math.round(timelineState.baseCasualties.injured * values.injuredFactor);
    const falloutRadius: number = timelineState.baseFalloutRadius * values.falloutRadiusFactor;
    const falloutArea: number = Math.round(Math.PI * falloutRadius * falloutRadius);

    if (elements.timelineCurrentTime) {
      elements.timelineCurrentTime.textContent = stage.name + ' (' + stage.timeLabel + ')';
    }
    if (elements.timelineDeaths) {
      elements.timelineDeaths.textContent = formatNumber(deaths);
    }
    if (elements.timelineInjured) {
      elements.timelineInjured.textContent = formatNumber(injured);
    }
    if (elements.timelineFalloutArea) {
      elements.timelineFalloutArea.textContent = formatNumber(falloutArea) + ' km²';
    }
  }

  function drawFalloutOverlay(): void {
    if (!effectCtx || !effectCanvas) return;

    const rect: DOMRect = effectCanvas.getBoundingClientRect();
    const width: number = rect.width;
    const height: number = rect.height;

    effectCtx.clearRect(0, 0, width, height);

    if (!timelineState.isActive) return;

    const values: InterpolatedValues = getInterpolatedValues(timelineState.currentProgress);

    timelineState.explosions.forEach(function (exp: Explosion, expIdx: number): void {
      const cx: number = exp.explosionCenter!.x;
      const cy: number = exp.explosionCenter!.y;
      const baseRadius: number = (exp.radii as Record<string, number>).thermal * timelineState.scale * 1.5;
      const currentRadius: number = baseRadius * values.falloutRadiusFactor;

      drawFalloutCloud(cx, cy, currentRadius, expIdx, values.falloutRadiusFactor);
    });
  }

  function drawFalloutCloud(cx: number, cy: number, radius: number, expIndex: number, intensity: number): void {
    if (radius <= 0) return;

    const windAngle: number = timelineState.windDirection;
    const windStrength: number = timelineState.windStrength;
    const driftX: number = Math.cos(windAngle) * radius * 0.4 * windStrength;
    const driftY: number = Math.sin(windAngle) * radius * 0.4 * windStrength;

    const cloudGrad: CanvasGradient = effectCtx!.createRadialGradient(
      cx + driftX * 0.3, cy + driftY * 0.3, 0,
      cx + driftX * 0.5, cy + driftY * 0.5, radius
    );

    const baseAlpha: number = 0.15 + intensity * 0.25;

    cloudGrad.addColorStop(0, rgba(180, 200, 100, baseAlpha * 0.8));
    cloudGrad.addColorStop(0.3, rgba(140, 170, 80, baseAlpha * 0.6));
    cloudGrad.addColorStop(0.6, rgba(100, 140, 60, baseAlpha * 0.4));
    cloudGrad.addColorStop(1, rgba(80, 120, 50, 0));

    effectCtx!.beginPath();
    effectCtx!.ellipse(
      cx + driftX * 0.5,
      cy + driftY * 0.5,
      radius * (1 + windStrength * 0.2),
      radius * (1 - windStrength * 0.1),
      windAngle,
      0, Math.PI * 2
    );
    effectCtx!.fillStyle = cloudGrad;
    effectCtx!.fill();

    const innerRadius: number = radius * 0.5;
    const innerGrad: CanvasGradient = effectCtx!.createRadialGradient(
      cx, cy, 0,
      cx, cy, innerRadius
    );
    innerGrad.addColorStop(0, rgba(255, 255, 150, baseAlpha * 0.5));
    innerGrad.addColorStop(0.5, rgba(200, 220, 100, baseAlpha * 0.3));
    innerGrad.addColorStop(1, rgba(150, 180, 80, 0));

    effectCtx!.beginPath();
    effectCtx!.arc(cx, cy, innerRadius, 0, Math.PI * 2);
    effectCtx!.fillStyle = innerGrad;
    effectCtx!.fill();

    if (intensity > 0.3) {
      const particleCount: number = Math.floor(30 + intensity * 50);
      for (let i: number = 0; i < particleCount; i++) {
        const angle: number = Math.random() * Math.PI * 2;
        const dist: number = Math.random() * radius * 0.8;
        const px: number = cx + Math.cos(angle) * dist + driftX * (dist / radius);
        const py: number = cy + Math.sin(angle) * dist + driftY * (dist / radius);
        const psize: number = 1 + Math.random() * 2;
        const palpha: number = 0.3 + Math.random() * 0.4;

        effectCtx!.beginPath();
        effectCtx!.arc(px, py, psize, 0, Math.PI * 2);
        effectCtx!.fillStyle = rgba(180, 255, 120, palpha * intensity);
        effectCtx!.fill();
      }
    }

    if (intensity > 0.2) {
      const ringAlpha: number = intensity * 0.3;
      effectCtx!.strokeStyle = rgba(0, 255, 136, ringAlpha);
      effectCtx!.lineWidth = 2;
      effectCtx!.setLineDash([6, 4]);
      effectCtx!.beginPath();
      effectCtx!.ellipse(
        cx + driftX * 0.5,
        cy + driftY * 0.5,
        radius * (1 + windStrength * 0.2),
        radius * (1 - windStrength * 0.1),
        windAngle,
        0, Math.PI * 2
      );
      effectCtx!.stroke();
      effectCtx!.setLineDash([]);
    }
  }

  function clearFalloutOverlay(): void {
    if (!effectCtx || !effectCanvas) return;
    const rect: DOMRect = effectCanvas.getBoundingClientRect();
    effectCtx.clearRect(0, 0, rect.width, rect.height);
  }

  function drawTrendChart(): void {
    if (!trendChartCtx || !trendChartCanvas) return;

    const rect: DOMRect = trendChartCanvas.getBoundingClientRect();
    const width: number = rect.width;
    const height: number = 180;
    const padding: ChartPadding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth: number = width - padding.left - padding.right;
    const chartHeight: number = height - padding.top - padding.bottom;

    trendChartCtx.clearRect(0, 0, width, height);

    const dataPoints: TrendData = generateTrendData();
    const maxValue: number = Math.max(
      dataPoints.deaths[dataPoints.deaths.length - 1],
      dataPoints.injured[dataPoints.injured.length - 1]
    ) * 1.1 || 1;

    drawChartGrid(trendChartCtx, padding, chartWidth, chartHeight, maxValue);
    drawTrendLine(trendChartCtx, dataPoints.deaths, padding, chartWidth, chartHeight, maxValue, '#ff4444', 0.15);
    drawTrendLine(trendChartCtx, dataPoints.injured, padding, chartWidth, chartHeight, maxValue, '#ffaa00', 0.1);

    const currentIdx: number = Math.floor(timelineState.currentProgress * (dataPoints.deaths.length - 1));
    drawCurrentIndicator(
      trendChartCtx,
      currentIdx,
      dataPoints,
      padding,
      chartWidth,
      chartHeight,
      maxValue
    );

    drawXLabels(trendChartCtx, padding, chartWidth, chartHeight);
  }

  function generateTrendData(): TrendData {
    const pointCount: number = 50;
    const deaths: number[] = [];
    const injured: number[] = [];

    for (let i: number = 0; i < pointCount; i++) {
      const progress: number = i / (pointCount - 1);
      const values: InterpolatedValues = getInterpolatedValues(progress);
      deaths.push(timelineState.baseCasualties.deaths * values.deathFactor);
      injured.push(timelineState.baseCasualties.injured * values.injuredFactor);
    }

    return { deaths: deaths, injured: injured };
  }

  function drawChartGrid(
    ctx: CanvasRenderingContext2D,
    padding: ChartPadding,
    chartWidth: number,
    chartHeight: number,
    maxValue: number
  ): void {
    ctx.strokeStyle = rgba(100, 100, 140, 0.15);
    ctx.lineWidth = 1;

    const gridLines: number = 4;
    for (let i: number = 0; i <= gridLines; i++) {
      const y: number = padding.top + (chartHeight / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();

      const value: number = maxValue * (1 - i / gridLines);
      ctx.fillStyle = rgba(160, 160, 184, 0.7);
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(formatNumber(Math.round(value)), padding.left - 8, y + 3);
    }
  }

  function drawTrendLine(
    ctx: CanvasRenderingContext2D,
    data: number[],
    padding: ChartPadding,
    chartWidth: number,
    chartHeight: number,
    maxValue: number,
    color: string,
    fillAlpha: number
  ): void {
    if (data.length < 2) return;

    const points: Point2D[] = data.map(function (value: number, idx: number): Point2D {
      const x: number = padding.left + (chartWidth / (data.length - 1)) * idx;
      const y: number = padding.top + chartHeight - (value / maxValue) * chartHeight;
      return { x: x, y: y };
    });

    const grad: CanvasGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
    const colorMatch: RegExpMatchArray | null = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (colorMatch) {
      const r: number = parseInt(colorMatch[1], 16);
      const g: number = parseInt(colorMatch[2], 16);
      const b: number = parseInt(colorMatch[3], 16);
      grad.addColorStop(0, rgba(r, g, b, fillAlpha));
      grad.addColorStop(1, rgba(r, g, b, 0));
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, padding.top + chartHeight);
    for (let i: number = 0; i < points.length; i++) {
      if (i === 0) {
        ctx.lineTo(points[i].x, points[i].y);
      } else {
        const prev: Point2D = points[i - 1];
        const curr: Point2D = points[i];
        const midX: number = (prev.x + curr.x) / 2;
        const midY: number = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
    }
    ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i: number = 0; i < points.length; i++) {
      if (i === 0) {
        ctx.moveTo(points[i].x, points[i].y);
      } else {
        const prev: Point2D = points[i - 1];
        const curr: Point2D = points[i];
        const midX: number = (prev.x + curr.x) / 2;
        const midY: number = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawCurrentIndicator(
    ctx: CanvasRenderingContext2D,
    idx: number,
    data: TrendData,
    padding: ChartPadding,
    chartWidth: number,
    chartHeight: number,
    maxValue: number
  ): void {
    if (idx < 0 || idx >= data.deaths.length) return;

    const x: number = padding.left + (chartWidth / (data.deaths.length - 1)) * idx;

    ctx.strokeStyle = rgba(255, 255, 255, 0.3);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    const deathY: number = padding.top + chartHeight - (data.deaths[idx] / maxValue) * chartHeight;
    const injuredY: number = padding.top + chartHeight - (data.injured[idx] / maxValue) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, deathY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, injuredY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffaa00';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawXLabels(
    ctx: CanvasRenderingContext2D,
    padding: ChartPadding,
    chartWidth: number,
    chartHeight: number
  ): void {
    ctx.fillStyle = rgba(160, 160, 184, 0.7);
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';

    const labelCount: number = TIMELINE_STAGES.length;
    for (let i: number = 0; i < labelCount; i++) {
      const x: number = padding.left + (chartWidth / (labelCount - 1)) * i;
      const y: number = padding.top + chartHeight + 18;
      ctx.fillText(TIMELINE_STAGES[i].timeLabel, x, y);
    }
  }

  global.Timeline = {
    init: initTimeline,
    start: startTimelineMode,
    stop: stopTimelineMode,
    play: playTimeline,
    pause: pauseTimeline,
    reset: resetTimeline,
    togglePlay: togglePlay,
    setProgress: setTimelineProgress,
    isActive: function (): boolean { return timelineState.isActive; },
    isPlaying: function (): boolean { return timelineState.isPlaying; },
    getCurrentProgress: function (): number { return timelineState.currentProgress; },
    STAGES: TIMELINE_STAGES
  };

  document.addEventListener('DOMContentLoaded', initTimeline);

})(window);
