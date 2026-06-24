import type {
  Explosion,
  AppState,
  TerrainData,
} from '../types';

interface RgbaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
  gravity: number;
}

interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  color: string;
}

interface SoundTriggers {
  flash: boolean;
  explosion: boolean;
  shockwaveNear: boolean;
  shockwaveFar: boolean;
  quake: boolean;
  debris: boolean;
}

interface ExplosionAnimState {
  cx: number;
  cy: number;
  scale: number;
  radii: Record<string, number>;
  particles: Particle[];
  debris: Debris[];
  smoke: number[];
  maxShockwave: number;
  terrain: TerrainData | null;
  explosionRef: Explosion;
  tintIndex: number;
  zoneDisplayTimes: Record<string, number>;
  zoneOrder: string[];
  maxRadiusKm: number;
  quakeStartTime: number;
  quakePeakTime: number;
  quakeEndTime: number;
  displayedZones: Record<string, boolean>;
  soundTriggers: SoundTriggers;
}

interface ShockwaveFront {
  km: number;
  px: number;
  fraction: number;
}

interface AnimationState extends AppState {
  mapCtx?: CanvasRenderingContext2D;
  animationId?: number;
}

interface AnimElements {
  detonateBtn: HTMLButtonElement;
  [key: string]: HTMLElement | HTMLButtonElement | null;
}

(function (global: Window & typeof globalThis): void {
    'use strict';

    const rgba: (r: number, g: number, b: number, a: number) => string = global.DataDisplay.rgba;
    const hexToRgba: (hex: string, alpha: number) => string = global.DataDisplay.hexToRgba;

    const SHOCKWAVE_SPEED_KM_S: number = 2.5;
    const TOTAL_ANIM_DURATION: number = 6000;

    function parseRgba(rgbaStr: string): RgbaColor {
        const match: RegExpMatchArray | null = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([\d.]+)?\s*\)/);
        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
                a: match[4] !== undefined ? parseFloat(match[4]) : 1
            };
        }
        return { r: 255, g: 255, b: 255, a: 1 };
    }

    function createExplosionAnimState(
        explosion: Explosion,
        index: number,
        scale: number,
        terrain: TerrainData | null
    ): ExplosionAnimState {
        let cx: number = explosion.explosionCenter!.x;
        let cy: number = explosion.explosionCenter!.y;
        let radii: Record<string, number> = explosion.radii!;
        let safeScale: number = scale;

        if (!isFinite(cx)) cx = 400;
        if (!isFinite(cy)) cy = 300;
        if (!isFinite(safeScale) || safeScale <= 0) safeScale = 20;

        if (!radii || !isFinite(radii.fireball)) {
            const yieldKt: number = explosion.yieldKilotons || 15000;
            const burstH: number = explosion.burstHeight || 1000;
            radii = global.Physics.calculateRadii(yieldKt, burstH);
        }

        Object.keys(radii).forEach(function (key: string): void {
            if (!isFinite(radii[key])) radii[key] = 1;
        });

        const tint: number = index;

        const paletteColors: Array<{ p1: string; p2: string; p3: string; smoke: number[] }> = [
            { p1: '#ffdd00', p2: '#ff6600', p3: '#ff0000', smoke: [140, 90, 50] },
            { p1: '#00ffff', p2: '#6688ff', p3: '#0044ff', smoke: [90, 90, 140] },
            { p1: '#ccff88', p2: '#88ff00', p3: '#00cc44', smoke: [90, 130, 80] },
            { p1: '#ffcc66', p2: '#ff9944', p3: '#dd5500', smoke: [150, 100, 70] }
        ];
        const colors: { p1: string; p2: string; p3: string; smoke: number[] } = paletteColors[tint % paletteColors.length];

        const particles: Particle[] = [];
        const particleCount: number = 150;
        for (let i: number = 0; i < particleCount; i++) {
            const angle: number = (i / particleCount) * Math.PI * 2;
            const speed: number = (2 + Math.random() * 4);
            const size: number = 2 + Math.random() * 6;
            const colorRand: number = Math.random();
            let pcolor: string;
            if (colorRand < 0.33) pcolor = colors.p1;
            else if (colorRand < 0.66) pcolor = colors.p2;
            else pcolor = colors.p3;
            particles.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (1 + Math.random() * 3),
                size: size,
                life: 0.6 + Math.random() * 0.4,
                color: pcolor,
                gravity: 0.05 + Math.random() * 0.03
            });
        }

        const debris: Debris[] = [];
        const debrisCount: number = 80;
        for (let i: number = 0; i < debrisCount; i++) {
            const angle: number = Math.random() * Math.PI * 2;
            const speed: number = (3 + Math.random() * 6);
            debris.push({
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (2 + Math.random() * 4),
                size: 1 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3,
                life: 0.8 + Math.random() * 0.6,
                color: `rgba(${120 + Math.random() * 60},${90 + Math.random() * 40},${60 + Math.random() * 30},1)`
            });
        }

        const zoneOrder: string[] = ['fireball', 'radiation', 'severe', 'moderate', 'light', 'thermal'];
        const zoneDisplayTimes: Record<string, number> = {};
        zoneOrder.forEach((key: string, idx: number): void => {
            const radius: number = radii[key];
            zoneDisplayTimes[key] = radius / SHOCKWAVE_SPEED_KM_S;
        });

        const maxRadiusPx: number = radii.thermal * safeScale * 1.2;
        const quakeStartTime: number = zoneDisplayTimes.severe;
        const quakePeakTime: number = zoneDisplayTimes.moderate;
        const quakeEndTime: number = zoneDisplayTimes.thermal + 1.5;

        return {
            cx: cx,
            cy: cy,
            scale: safeScale,
            radii: radii,
            particles: particles,
            debris: debris,
            smoke: colors.smoke,
            maxShockwave: maxRadiusPx,
            terrain: terrain,
            explosionRef: explosion,
            tintIndex: tint,
            zoneDisplayTimes: zoneDisplayTimes,
            zoneOrder: zoneOrder,
            maxRadiusKm: radii.thermal,
            quakeStartTime: quakeStartTime,
            quakePeakTime: quakePeakTime,
            quakeEndTime: quakeEndTime,
            displayedZones: {},
            soundTriggers: {
                flash: false,
                explosion: false,
                shockwaveNear: false,
                shockwaveFar: false,
                quake: false,
                debris: false
            }
        };
    }

    function drawPersistentFireball(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        progress: number
    ): void {
        const fbRadius: number = a.radii.fireball * a.scale * (1 + Math.sin(progress * Math.PI) * 0.1);
        const fbAlpha: number = 0.7 * (1 - progress * 0.5);
        const fbGrad: CanvasGradient = effectCtx.createRadialGradient(a.cx, a.cy, 0, a.cx, a.cy, fbRadius);
        fbGrad.addColorStop(0, rgba(255, 255, 220, fbAlpha));
        fbGrad.addColorStop(0.4, rgba(255, 180, 80, fbAlpha * 0.8));
        fbGrad.addColorStop(0.7, rgba(255, 100, 30, fbAlpha * 0.5));
        fbGrad.addColorStop(1, rgba(255, 50, 0, 0));
        effectCtx.beginPath();
        effectCtx.arc(a.cx, a.cy, fbRadius, 0, Math.PI * 2);
        effectCtx.fillStyle = fbGrad;
        effectCtx.fill();
    }

    function drawShockwaveRing(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        currentSW: number,
        swAlpha: number,
        terrain: TerrainData | null,
        scale: number,
        zoneKey: string
    ): void {
        const useTerrain: boolean = !!(terrain && terrain.features && terrain.features.length > 0);
        const segments: number = 96;

        function getRadiusAtAngle(angle: number): number {
            if (!useTerrain || !a.explosionRef) return currentSW;
            return global.Physics.calculateShockwaveRadiusAtAngle(
                a.explosionRef, angle, zoneKey, terrain, scale, currentSW
            );
        }

        effectCtx.beginPath();
        for (let i: number = 0; i <= segments; i++) {
            const angle: number = (i / segments) * Math.PI * 2;
            let r: number;
            if (useTerrain) {
                r = getRadiusAtAngle(angle);
            } else {
                r = currentSW;
            }
            const x: number = a.cx + Math.cos(angle) * r;
            const y: number = a.cy + Math.sin(angle) * r;
            if (i === 0) effectCtx.moveTo(x, y);
            else {
                const prevAngle: number = ((i - 1) / segments) * Math.PI * 2;
                let prevR: number;
                if (useTerrain) {
                    prevR = getRadiusAtAngle(prevAngle);
                } else {
                    prevR = currentSW;
                }
                const prevX: number = a.cx + Math.cos(prevAngle) * prevR;
                const prevY: number = a.cy + Math.sin(prevAngle) * prevR;
                const midX: number = (prevX + x) / 2;
                const midY: number = (prevY + y) / 2;
                effectCtx.quadraticCurveTo(prevX, prevY, midX, midY);
            }
        }
        effectCtx.stroke();
    }

    function drawPhaseFlash(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        t: number
    ): void {
        const p: number = t / 0.05;
        const fireballP: number = Math.min(p, 1);
        let currentFireballRadius: number = Math.pow(fireballP, 0.5) * a.radii.fireball * a.scale;

        if (!isFinite(currentFireballRadius)) currentFireballRadius = 1;

        const cx: number = isFinite(a.cx) ? a.cx : 400;
        const cy: number = isFinite(a.cy) ? a.cy : 300;

        if (currentFireballRadius > 0) {
            const r1: number = Math.max(0.1, currentFireballRadius);
            if (isFinite(cx) && isFinite(cy) && isFinite(r1)) {
                const fbGrad: CanvasGradient = effectCtx.createRadialGradient(cx, cy, 0, cx, cy, r1);
                fbGrad.addColorStop(0, rgba(255, 255, 255, 1));
                fbGrad.addColorStop(0.3, rgba(255, 255, 200, 0.95));
                fbGrad.addColorStop(0.6, rgba(255, 200, 100, 0.85));
                fbGrad.addColorStop(0.85, rgba(255, 100, 0, 0.7));
                fbGrad.addColorStop(1, rgba(255, 50, 0, 0));
                effectCtx.beginPath();
                effectCtx.arc(cx, cy, currentFireballRadius, 0, Math.PI * 2);
                effectCtx.fillStyle = fbGrad;
                effectCtx.fill();
            }
        }

        const flashAlpha: number = Math.max(0, 1 - p);
        if (flashAlpha > 0) {
            const r2: number = Math.max(1, currentFireballRadius * 2);
            if (isFinite(cx) && isFinite(cy) && isFinite(r2)) {
                const flashGrad: CanvasGradient = effectCtx.createRadialGradient(cx, cy, 0, cx, cy, r2);
                flashGrad.addColorStop(0, rgba(255, 255, 255, flashAlpha * 0.8));
                flashGrad.addColorStop(0.5, rgba(255, 255, 255, flashAlpha * 0.4));
                flashGrad.addColorStop(1, rgba(255, 200, 100, 0));
                effectCtx.beginPath();
                effectCtx.arc(cx, cy, currentFireballRadius * 2, 0, Math.PI * 2);
                effectCtx.fillStyle = flashGrad;
                effectCtx.fill();
            }
        }
    }

    function drawPhaseFireball(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        t: number
    ): void {
        const p: number = t / 0.3;
        drawPersistentFireball(effectCtx, a, p * 0.3);

        if (p < 1) {
            const fireballP: number = p;
            const currentFireballRadius: number = a.radii.fireball * a.scale * (fireballP < 1 ? Math.pow(fireballP, 0.5) : 1);
            const fbGrad: CanvasGradient = effectCtx.createRadialGradient(a.cx, a.cy, 0, a.cx, a.cy, currentFireballRadius * 0.9);
            fbGrad.addColorStop(0, rgba(255, 255, 255, 0.95));
            fbGrad.addColorStop(0.4, rgba(255, 240, 180, 0.9));
            fbGrad.addColorStop(0.7, rgba(255, 180, 80, 0.75));
            fbGrad.addColorStop(1, rgba(255, 80, 0, 0));
            effectCtx.beginPath();
            effectCtx.arc(a.cx, a.cy, currentFireballRadius * 0.9, 0, Math.PI * 2);
            effectCtx.fillStyle = fbGrad;
            effectCtx.fill();
        }

        if (p > 0.3) {
            const earlySWP: number = (p - 0.3) / 0.7;
            const earlySW: number = Math.pow(earlySWP, 0.4) * a.radii.fireball * a.scale * 2.5;
            const earlySWAlpha: number = 0.6 * (1 - earlySWP);

            effectCtx.lineWidth = 5;
            effectCtx.strokeStyle = rgba(255, 220, 150, earlySWAlpha * 0.9);
            drawShockwaveRing(effectCtx, a, earlySW, earlySWAlpha, a.terrain, a.scale, 'fireball');

            for (let i: number = 0; i < 3; i++) {
                const innerSW: number = earlySW * (1 - (i + 1) * 0.2);
                if (innerSW > 0) {
                    effectCtx.strokeStyle = rgba(255, 150, 80, earlySWAlpha * 0.5);
                    effectCtx.lineWidth = 2;
                    drawShockwaveRing(effectCtx, a, innerSW, earlySWAlpha, a.terrain, a.scale, 'fireball');
                }
            }
        }
    }

    function calculateShockwaveFront(a: ExplosionAnimState, t: number): ShockwaveFront {
        const currentRadiusKm: number = Math.min(t * SHOCKWAVE_SPEED_KM_S, a.maxRadiusKm);
        const currentRadiusPx: number = currentRadiusKm * a.scale;
        return {
            km: currentRadiusKm,
            px: currentRadiusPx,
            fraction: currentRadiusKm / a.maxRadiusKm
        };
    }

    function getQuakeIntensity(a: ExplosionAnimState, t: number): number {
        if (t < a.quakeStartTime) return 0;
        if (t > a.quakeEndTime) return 0;

        const riseTime: number = a.quakePeakTime - a.quakeStartTime;
        const fallTime: number = a.quakeEndTime - a.quakePeakTime;

        if (t < a.quakePeakTime) {
            const p: number = (t - a.quakeStartTime) / riseTime;
            return Math.pow(p, 0.7);
        } else {
            const p: number = (t - a.quakePeakTime) / fallTime;
            return Math.pow(1 - p, 0.5);
        }
    }

    function drawZoneProgress(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        zoneKey: string,
        currentFrontPx: number,
        t: number
    ): void {
        const zoneRadiusPx: number = a.radii[zoneKey] * a.scale;
        if (currentFrontPx < zoneRadiusPx * 0.05) return;

        const visibleRadius: number = Math.min(currentFrontPx, zoneRadiusPx);
        const progress: number = visibleRadius / zoneRadiusPx;
        const alpha: number = progress > 0.9 ? (1 - (progress - 0.9) * 10) : Math.min(1, progress * 2);

        const colors: { fill: string; border: string } = global.Renderer.getZoneColors(zoneKey, a.tintIndex);
        const useTerrain: boolean = !!(a.terrain && a.terrain.features && a.terrain.features.length > 0);

        if (useTerrain) {
            const boundaryPoints: any[] = global.Physics.generateTerrainBoundaryPolygon(
                a.explosionRef, zoneKey, a.terrain, a.scale, 72
            );
            if (boundaryPoints && boundaryPoints.length > 0) {
                const clippedPoints: Array<{ x: number; y: number; angle: number }> = boundaryPoints.map(pt => {
                    const dist: number = Math.sqrt(Math.pow(pt.x - a.cx, 2) + Math.pow(pt.y - a.cy, 2));
                    const clipFactor: number = Math.min(1, visibleRadius / Math.max(1, dist));
                    return {
                        x: a.cx + (pt.x - a.cx) * clipFactor,
                        y: a.cy + (pt.y - a.cy) * clipFactor,
                        angle: pt.angle
                    };
                });

                global.Renderer.drawPolygonPathFromPoints(effectCtx, clippedPoints, true);
                effectCtx.fillStyle = colors.fill;
                effectCtx.fill();

                global.Renderer.drawPolygonPathFromPoints(effectCtx, clippedPoints, true);
                effectCtx.strokeStyle = colors.border;
                effectCtx.lineWidth = 1.5;
                effectCtx.stroke();
            }
        } else {
            const fillColor: RgbaColor = parseRgba(colors.fill);
            effectCtx.beginPath();
            effectCtx.arc(a.cx, a.cy, visibleRadius, 0, Math.PI * 2);
            effectCtx.fillStyle = rgba(
                fillColor.r,
                fillColor.g,
                fillColor.b,
                alpha * fillColor.a
            );
            effectCtx.fill();

            effectCtx.beginPath();
            effectCtx.arc(a.cx, a.cy, visibleRadius, 0, Math.PI * 2);
            effectCtx.strokeStyle = colors.border;
            effectCtx.lineWidth = 1.5;
            effectCtx.stroke();
        }
    }

    function drawRippleWave(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        radius: number,
        waveWidth: number,
        alpha: number,
        color: RgbaColor
    ): void {
        if (radius <= 0 || waveWidth <= 0 || alpha <= 0) return;

        const useTerrain: boolean = !!(a.terrain && a.terrain.features && a.terrain.features.length > 0);
        const segments: number = 96;

        function getRadiusAtAngle(angle: number, baseRadius: number): number {
            if (!useTerrain || !a.explosionRef) return baseRadius;
            return global.Physics.calculateShockwaveRadiusAtAngle(
                a.explosionRef, angle, 'severe', a.terrain, a.scale, baseRadius
            );
        }

        const innerRadius: number = Math.max(0, radius - waveWidth / 2);
        const outerRadius: number = radius + waveWidth / 2;

        effectCtx.beginPath();
        for (let i: number = 0; i <= segments; i++) {
            const angle: number = (i / segments) * Math.PI * 2;
            const r: number = getRadiusAtAngle(angle, outerRadius);
            const x: number = a.cx + Math.cos(angle) * r;
            const y: number = a.cy + Math.sin(angle) * r;
            if (i === 0) effectCtx.moveTo(x, y);
            else effectCtx.lineTo(x, y);
        }
        for (let i: number = segments; i >= 0; i--) {
            const angle: number = (i / segments) * Math.PI * 2;
            const r: number = getRadiusAtAngle(angle, innerRadius);
            const x: number = a.cx + Math.cos(angle) * r;
            const y: number = a.cy + Math.sin(angle) * r;
            effectCtx.lineTo(x, y);
        }
        effectCtx.closePath();

        const grad: CanvasGradient = effectCtx.createRadialGradient(a.cx, a.cy, innerRadius, a.cx, a.cy, outerRadius);
        grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        grad.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
        grad.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        grad.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        effectCtx.fillStyle = grad;
        effectCtx.fill();
    }

    function drawPhaseShockwave(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        t: number
    ): void {
        const shockwave: ShockwaveFront = calculateShockwaveFront(a, t);
        const phaseProgress: number = (t - 0.3) / 1.7;

        drawPersistentFireball(effectCtx, a, 0.3 + phaseProgress * 0.4);

        a.zoneOrder.forEach(zoneKey => {
            if (!a.displayedZones[zoneKey] && t >= a.zoneDisplayTimes[zoneKey] * 0.9) {
                a.displayedZones[zoneKey] = true;
            }
            if (a.displayedZones[zoneKey]) {
                drawZoneProgress(effectCtx, a, zoneKey, shockwave.px, t);
            }
        });

        if (shockwave.px > 0) {
            const swAlpha: number = Math.max(0, 1 - shockwave.fraction * 0.6);
            const waveSpacing: number = 40;
            const waveWidth: number = 25;

            const numWaves: number = 5;
            for (let i: number = 0; i < numWaves; i++) {
                const waveOffset: number = i * waveSpacing;
                const waveRadius: number = shockwave.px - waveOffset;

                if (waveRadius > 0) {
                    const waveAlpha: number = swAlpha * Math.max(0, 1 - i * 0.22) * (0.4 + Math.sin(t * 8 - i * 1.5) * 0.3);
                    const widthFactor: number = 1 + i * 0.3;
                    const waveColor: RgbaColor = i === 0
                        ? { r: 255, g: 240, b: 180, a: 1 }
                        : i === 1
                        ? { r: 255, g: 180, b: 100, a: 1 }
                        : i === 2
                        ? { r: 255, g: 120, b: 60, a: 1 }
                        : i === 3
                        ? { r: 220, g: 80, b: 40, a: 1 }
                        : { r: 180, g: 60, b: 30, a: 1 };

                    drawRippleWave(effectCtx, a, waveRadius, waveWidth * widthFactor, waveAlpha * 0.7, waveColor);
                }
            }

            const glowRadius: number = shockwave.px * 0.98;
            if (glowRadius > 0) {
                const glowGrad: CanvasGradient = effectCtx.createRadialGradient(a.cx, a.cy, glowRadius * 0.95, a.cx, a.cy, glowRadius * 1.05);
                glowGrad.addColorStop(0, `rgba(255, 255, 220, 0)`);
                glowGrad.addColorStop(0.5, `rgba(255, 255, 200, ${swAlpha * 0.3})`);
                glowGrad.addColorStop(1, `rgba(255, 255, 220, 0)`);

                effectCtx.beginPath();
                effectCtx.arc(a.cx, a.cy, glowRadius * 1.05, 0, Math.PI * 2);
                effectCtx.arc(a.cx, a.cy, glowRadius * 0.95, 0, Math.PI * 2, true);
                effectCtx.fillStyle = glowGrad;
                effectCtx.fill();
            }
        }

        a.particles.forEach(function (particle: Particle): void {
            particle.x += particle.vx * (1 + phaseProgress * 2);
            particle.y += particle.vy * (1 + phaseProgress * 1.5);
            particle.vy += particle.gravity;
            const particleAlpha: number = particle.life * Math.max(0, 1 - phaseProgress * 0.7);
            if (particleAlpha > 0) {
                effectCtx.beginPath();
                effectCtx.arc(particle.x, particle.y, particle.size * (1 + phaseProgress * 0.3), 0, Math.PI * 2);
                effectCtx.fillStyle = hexToRgba(particle.color, particleAlpha);
                effectCtx.fill();
            }
        });

        if (phaseProgress > 0.2) {
            a.debris.forEach(function (d: Debris): void {
                const debrisPhase: number = (phaseProgress - 0.2) / 0.8;
                d.x += d.vx * (1 + debrisPhase);
                d.y += d.vy * (1 + debrisPhase * 0.8);
                d.vy += 0.08;
                d.rotation += d.rotSpeed;
                const debrisAlpha: number = d.life * Math.max(0, 1 - debrisPhase * 0.6);
                if (debrisAlpha > 0) {
                    effectCtx.save();
                    effectCtx.translate(d.x, d.y);
                    effectCtx.rotate(d.rotation);
                    effectCtx.fillStyle = d.color.replace(/,1\)$/, `,${debrisAlpha})`);
                    effectCtx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size * 1.5);
                    effectCtx.restore();
                }
            });
        }
    }

    function drawPhaseMushroom(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        t: number
    ): void {
        const phaseProgress: number = (t - 2.0) / 2.0;
        const mp: number = Math.min(1, phaseProgress);

        drawPersistentFireball(effectCtx, a, 0.7 + mp * 0.3);

        a.zoneOrder.forEach(zoneKey => {
            if (a.displayedZones[zoneKey]) {
                const zoneRadiusPx: number = a.radii[zoneKey] * a.scale;
                const colors: { fill: string; border: string } = global.Renderer.getZoneColors(zoneKey, a.tintIndex);
                const useTerrain: boolean = !!(a.terrain && a.terrain.features && a.terrain.features.length > 0);
                const alpha: number = 0.16 * Math.max(0.3, 1 - mp * 0.5);

                if (useTerrain) {
                    const boundaryPoints: any[] = global.Physics.generateTerrainBoundaryPolygon(
                        a.explosionRef, zoneKey, a.terrain, a.scale, 72
                    );
                    if (boundaryPoints && boundaryPoints.length > 0) {
                        global.Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints, true);
                        effectCtx.fillStyle = rgba(
                            parseInt(colors.fill.slice(5, 8)),
                            parseInt(colors.fill.slice(9, 12)),
                            parseInt(colors.fill.slice(13, 16)),
                            alpha
                        );
                        effectCtx.fill();

                        global.Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints, true);
                        effectCtx.strokeStyle = colors.border;
                        effectCtx.lineWidth = 1.5;
                        effectCtx.stroke();
                    }
                } else {
                    const fillColor: RgbaColor = parseRgba(colors.fill);
                    effectCtx.beginPath();
                    effectCtx.arc(a.cx, a.cy, zoneRadiusPx, 0, Math.PI * 2);
                    effectCtx.fillStyle = rgba(
                        fillColor.r,
                        fillColor.g,
                        fillColor.b,
                        alpha
                    );
                    effectCtx.fill();

                    effectCtx.beginPath();
                    effectCtx.arc(a.cx, a.cy, zoneRadiusPx, 0, Math.PI * 2);
                    effectCtx.strokeStyle = colors.border;
                    effectCtx.lineWidth = 1.5;
                    effectCtx.stroke();
                }
            }
        });

        const cloudY: number = a.cy - mp * 180 * a.scale / 20;
        const cloudBaseWidth: number = a.radii.fireball * a.scale * (1.5 + mp * 2.5);
        const cloudHeight: number = a.radii.fireball * a.scale * (0.8 + mp * 1.8);
        const stemWidth: number = a.radii.fireball * a.scale * (0.8 - mp * 0.4);

        const sr: number[] = a.smoke;
        const stemGrad: CanvasGradient = effectCtx.createLinearGradient(a.cx, a.cy, a.cx, cloudY);
        stemGrad.addColorStop(0, rgba(sr[0] * 0.7, sr[1] * 0.5, sr[2] * 0.4, 0.8 * (1 - mp * 0.3)));
        stemGrad.addColorStop(1, rgba(sr[0] * 0.5, sr[1] * 0.35, sr[2] * 0.25, 0.4 * (1 - mp * 0.5)));
        effectCtx.fillStyle = stemGrad;
        effectCtx.beginPath();
        effectCtx.moveTo(a.cx - stemWidth * 0.6, a.cy);
        effectCtx.quadraticCurveTo(a.cx - stemWidth * 0.3, cloudY + (a.cy - cloudY) * 0.5, a.cx - stemWidth * 0.2, cloudY);
        effectCtx.lineTo(a.cx + stemWidth * 0.2, cloudY);
        effectCtx.quadraticCurveTo(a.cx + stemWidth * 0.3, cloudY + (a.cy - cloudY) * 0.5, a.cx + stemWidth * 0.6, a.cy);
        effectCtx.closePath();
        effectCtx.fill();

        const cloudGrad: CanvasGradient = effectCtx.createRadialGradient(
            a.cx, cloudY, 0,
            a.cx, cloudY, cloudBaseWidth
        );
        cloudGrad.addColorStop(0, rgba(sr[0], sr[1], sr[2], 0.85 * (1 - mp * 0.4)));
        cloudGrad.addColorStop(0.5, rgba(sr[0] * 0.75, sr[1] * 0.55, sr[2] * 0.35, 0.7 * (1 - mp * 0.5)));
        cloudGrad.addColorStop(1, rgba(sr[0] * 0.45, sr[1] * 0.4, sr[2] * 0.3, 0));
        effectCtx.fillStyle = cloudGrad;
        effectCtx.beginPath();
        for (let ang: number = 0; ang < 8; ang++) {
            const angle: number = (ang / 8) * Math.PI * 2;
            const wobble: number = Math.sin(mp * Math.PI * 4 + ang) * cloudBaseWidth * 0.15;
            const r: number = cloudBaseWidth + wobble;
            const x: number = a.cx + Math.cos(angle) * r;
            const y: number = cloudY + Math.sin(angle) * cloudHeight * 0.6;
            if (ang === 0) effectCtx.moveTo(x, y);
            else effectCtx.quadraticCurveTo(
                a.cx + Math.cos(angle - Math.PI / 8) * (cloudBaseWidth * 1.1),
                cloudY + Math.sin(angle - Math.PI / 8) * cloudHeight * 0.7,
                x, y
            );
        }
        effectCtx.closePath();
        effectCtx.fill();

        if (mp > 0.3) {
            const debrisAlpha: number = (mp - 0.3) / 0.7 * 0.5;
            for (let i: number = 0; i < 50; i++) {
                const angle: number = (i / 50) * Math.PI * 2 + mp * 2;
                const dist: number = cloudBaseWidth * (0.5 + (i * 0.017) % 0.8);
                const dx: number = a.cx + Math.cos(angle) * dist;
                const dy: number = cloudY + Math.sin(angle) * cloudHeight * 0.4 + (mp - 0.3) * 40;
                const ds: number = 2 + (i * 0.17) % 4;
                effectCtx.beginPath();
                effectCtx.arc(dx, dy, ds, 0, Math.PI * 2);
                effectCtx.fillStyle = rgba(sr[0] * 0.6, sr[1] * 0.5, sr[2] * 0.4, debrisAlpha * (0.5 + (i * 0.013) % 0.5));
                effectCtx.fill();
            }
        }

        a.particles.forEach(function (particle: Particle): void {
            particle.x += particle.vx * 0.3;
            particle.y += particle.vy * 0.3;
            particle.vy += 0.02;
            const particleAlpha: number = particle.life * Math.max(0, 1 - phaseProgress);
            if (particleAlpha > 0) {
                effectCtx.beginPath();
                effectCtx.arc(particle.x, particle.y, particle.size * 0.8, 0, Math.PI * 2);
                effectCtx.fillStyle = hexToRgba(particle.color, particleAlpha * 0.3);
                effectCtx.fill();
            }
        });
    }

    function drawPhaseFadeOut(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        t: number
    ): void {
        const phaseProgress: number = (t - 4.0) / 2.0;
        const mp: number = Math.min(1, phaseProgress);

        const fadeAlpha: number = Math.max(0, 1 - mp);

        a.zoneOrder.forEach(zoneKey => {
            if (a.displayedZones[zoneKey]) {
                const zoneRadiusPx: number = a.radii[zoneKey] * a.scale;
                const colors: { fill: string; border: string } = global.Renderer.getZoneColors(zoneKey, a.tintIndex);
                const useTerrain: boolean = !!(a.terrain && a.terrain.features && a.terrain.features.length > 0);
                const alpha: number = 0.16 * fadeAlpha * 0.5;

                if (useTerrain) {
                    const boundaryPoints: any[] = global.Physics.generateTerrainBoundaryPolygon(
                        a.explosionRef, zoneKey, a.terrain, a.scale, 72
                    );
                    if (boundaryPoints && boundaryPoints.length > 0) {
                        global.Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints, true);
                        effectCtx.fillStyle = rgba(
                            parseInt(colors.fill.slice(5, 8)),
                            parseInt(colors.fill.slice(9, 12)),
                            parseInt(colors.fill.slice(13, 16)),
                            alpha
                        );
                        effectCtx.fill();

                        global.Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints, true);
                        effectCtx.strokeStyle = colors.border;
                        effectCtx.lineWidth = 1.5;
                        effectCtx.stroke();
                    }
                } else {
                    const fillColor: RgbaColor = parseRgba(colors.fill);
                    effectCtx.beginPath();
                    effectCtx.arc(a.cx, a.cy, zoneRadiusPx, 0, Math.PI * 2);
                    effectCtx.fillStyle = rgba(
                        fillColor.r,
                        fillColor.g,
                        fillColor.b,
                        alpha
                    );
                    effectCtx.fill();
                }
            }
        });

        const sr: number[] = a.smoke;
        const cloudY: number = a.cy - (1.0 + mp * 0.5) * 180 * a.scale / 20;
        const cloudBaseWidth: number = a.radii.fireball * a.scale * (4.0 + mp * 1.5);
        const cloudHeight: number = a.radii.fireball * a.scale * (2.6 + mp * 0.8);

        const cloudGrad: CanvasGradient = effectCtx.createRadialGradient(
            a.cx, cloudY, 0,
            a.cx, cloudY, cloudBaseWidth
        );
        cloudGrad.addColorStop(0, rgba(sr[0] * 0.8, sr[1] * 0.6, sr[2] * 0.4, 0.6 * fadeAlpha));
        cloudGrad.addColorStop(0.5, rgba(sr[0] * 0.6, sr[1] * 0.45, sr[2] * 0.3, 0.4 * fadeAlpha));
        cloudGrad.addColorStop(1, rgba(sr[0] * 0.35, sr[1] * 0.3, sr[2] * 0.25, 0));
        effectCtx.fillStyle = cloudGrad;
        effectCtx.beginPath();
        for (let ang: number = 0; ang < 8; ang++) {
            const angle: number = (ang / 8) * Math.PI * 2;
            const wobble: number = Math.sin((1 + mp) * Math.PI * 2 + ang) * cloudBaseWidth * 0.2;
            const r: number = cloudBaseWidth + wobble;
            const x: number = a.cx + Math.cos(angle) * r;
            const y: number = cloudY + Math.sin(angle) * cloudHeight * 0.6;
            if (ang === 0) effectCtx.moveTo(x, y);
            else effectCtx.quadraticCurveTo(
                a.cx + Math.cos(angle - Math.PI / 8) * (cloudBaseWidth * 1.15),
                cloudY + Math.sin(angle - Math.PI / 8) * cloudHeight * 0.75,
                x, y
            );
        }
        effectCtx.closePath();
        effectCtx.fill();
    }

    function applyEarthquakeShake(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        totalQuakeIntensity: number,
        time: number
    ): void {
        if (totalQuakeIntensity <= 0) return;

        const maxShake: number = 12 * totalQuakeIntensity;
        const shakeX: number = (Math.sin(time * 50) + Math.sin(time * 37) * 0.5) * maxShake;
        const shakeY: number = (Math.sin(time * 43) + Math.sin(time * 29) * 0.5) * maxShake;
        const rotate: number = (Math.sin(time * 25) * 0.015 + Math.sin(time * 18) * 0.008) * totalQuakeIntensity;

        ctx.save();
        ctx.translate(width / 2 + shakeX, height / 2 + shakeY);
        ctx.rotate(rotate);
        ctx.translate(-width / 2, -height / 2);
    }

    function restoreFromEarthquake(ctx: CanvasRenderingContext2D): void {
        ctx.restore();
    }

    function triggerSounds(
        animStates: ExplosionAnimState[],
        tSeconds: number,
        intensity: number
    ): void {
        animStates.forEach(a => {
            if (!a.soundTriggers.flash && tSeconds >= 0) {
                a.soundTriggers.flash = true;
                if (global.AudioManager) {
                    global.AudioManager.playFlashSound();
                }
            }

            if (!a.soundTriggers.explosion && tSeconds >= 0.05) {
                a.soundTriggers.explosion = true;
                if (global.AudioManager) {
                    global.AudioManager.playExplosionSound(intensity);
                }
            }

            if (!a.soundTriggers.shockwaveNear && tSeconds >= a.zoneDisplayTimes.severe * 0.5) {
                a.soundTriggers.shockwaveNear = true;
                if (global.AudioManager) {
                    global.AudioManager.playShockwaveSound(a.radii.severe * 0.3, intensity);
                }
            }

            if (!a.soundTriggers.shockwaveFar && tSeconds >= a.zoneDisplayTimes.moderate) {
                a.soundTriggers.shockwaveFar = true;
                if (global.AudioManager) {
                    global.AudioManager.playShockwaveSound(a.radii.moderate * 0.5, intensity * 0.8);
                }
            }

            if (!a.soundTriggers.quake && tSeconds >= a.quakeStartTime) {
                a.soundTriggers.quake = true;
                if (global.AudioManager) {
                    global.AudioManager.playQuakeSound(intensity, 0);
                }
            }

            if (!a.soundTriggers.debris && tSeconds >= a.zoneDisplayTimes.moderate + 0.3) {
                a.soundTriggers.debris = true;
                if (global.AudioManager) {
                    global.AudioManager.playDebrisSound(intensity);
                }
            }
        });
    }

    function animateExplosion(
        effectCtx: CanvasRenderingContext2D,
        effectCanvas: HTMLCanvasElement,
        mapWrapper: HTMLElement,
        state: AnimationState,
        elements: AnimElements,
        flashOverlay: HTMLElement
    ): void {
        if (state.isAnimating) return;

        const activeExplosions: Explosion[] = state.explosions.filter(function (e: Explosion): boolean {
            return !!(e.explosionCenter && e.radii && e.radii.fireball && isFinite(e.radii.fireball));
        });
        if (activeExplosions.length === 0) return;

        activeExplosions.forEach(function (e: Explosion): void {
            if (!e.yieldKilotons) e.yieldKilotons = 15000;
            if (!e.radii || !isFinite(e.radii.fireball)) {
                e.radii = global.Physics.calculateRadii(e.yieldKilotons, e.burstHeight || 1000);
            }
        });

        state.isAnimating = true;
        elements.detonateBtn.disabled = true;

        global.Renderer.drawMap(state.mapCtx, mapWrapper, state);

        if (global.AudioManager) {
            global.AudioManager.init();
        }

        flashOverlay.classList.add('active');

        const rect: DOMRect = mapWrapper.getBoundingClientRect();
        const width: number = rect.width;
        const height: number = rect.height;

        const animStates: ExplosionAnimState[] = activeExplosions.map(function (exp: Explosion, idx: number): ExplosionAnimState {
            return createExplosionAnimState(exp, idx, state.scale, state.terrainData);
        });

        const totalYield: number = activeExplosions.reduce((sum: number, e: Explosion) => sum + (e.yieldKilotons || 15000), 0);
        const intensity: number = Math.min(1, totalYield / 50000);

        const startTime: number = performance.now();
        let earthquakeActive: boolean = false;

        function draw(now: number): void {
            const elapsed: number = now - startTime;
            const tSeconds: number = elapsed / 1000;
            const progress: number = Math.min(elapsed / TOTAL_ANIM_DURATION, 1);

            effectCtx.clearRect(0, 0, width, height);

            triggerSounds(animStates, tSeconds, intensity);

            let totalQuakeIntensity: number = 0;
            animStates.forEach(a => {
                totalQuakeIntensity = Math.max(totalQuakeIntensity, getQuakeIntensity(a, tSeconds));
            });

            if (totalQuakeIntensity > 0.05) {
                applyEarthquakeShake(state.mapCtx!, width, height, totalQuakeIntensity, tSeconds);
                global.Renderer.drawMap(state.mapCtx, mapWrapper, state);
                restoreFromEarthquake(state.mapCtx!);
            } else {
                global.Renderer.drawMap(state.mapCtx, mapWrapper, state);
            }

            if (progress <= 0.05) {
                animStates.forEach(function (a: ExplosionAnimState): void { drawPhaseFlash(effectCtx, a, tSeconds); });
            } else if (progress <= 0.3) {
                animStates.forEach(function (a: ExplosionAnimState): void { drawPhaseFireball(effectCtx, a, tSeconds); });
            } else if (progress <= 2.0) {
                animStates.forEach(function (a: ExplosionAnimState): void { drawPhaseShockwave(effectCtx, a, tSeconds); });
            } else if (progress <= 4.0) {
                animStates.forEach(function (a: ExplosionAnimState): void { drawPhaseMushroom(effectCtx, a, tSeconds); });
            } else {
                animStates.forEach(function (a: ExplosionAnimState): void { drawPhaseFadeOut(effectCtx, a, tSeconds); });
            }

            if (progress < 1) {
                state.animationId = requestAnimationFrame(draw);
            } else {
                setTimeout(function (): void {
                    state.isAnimating = false;
                    elements.detonateBtn.disabled = false;
                    flashOverlay.classList.remove('active');

                    global.Renderer.drawMap(state.mapCtx, mapWrapper, state);

                    if (global.Timeline) {
                        global.Timeline.start(state, effectCtx, effectCanvas);
                    }
                }, 800);
            }
        }

        state.animationId = requestAnimationFrame(draw);
    }

    global.Animation = {
        animateExplosion: animateExplosion
    };

})(window);
