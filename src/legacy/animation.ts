import type {
    AppState,
    Explosion,
    TerrainData,
    ZoneDef,
    TerrainBoundaryPoint
} from '../types';

(function (global: Window) {
    'use strict';

    const rgba = (global.DataDisplay as any).rgba;
    const hexToRgba = (global.DataDisplay as any).hexToRgba;
    const Renderer = global.Renderer as any;

    const SHOCKWAVE_SPEED_KM_S = 2.5;
    const TOTAL_ANIM_DURATION = 6000;

    interface RgbaResult {
        r: number;
        g: number;
        b: number;
        a: number;
    }

    function parseRgba(rgbaStr: string): RgbaResult {
        const match = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,?\s*([\d.]+)?\s*\)/);
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
        radii: { [key: string]: number };
        particles: Particle[];
        debris: Debris[];
        smoke: number[];
        maxShockwave: number;
        terrain: TerrainData | null | undefined;
        explosionRef: Explosion;
        tintIndex: number;
        zoneDisplayTimes: { [key: string]: number };
        zoneOrder: string[];
        maxRadiusKm: number;
        quakeStartTime: number;
        quakePeakTime: number;
        quakeEndTime: number;
        displayedZones: { [key: string]: boolean };
        soundTriggers: SoundTriggers;
    }

    function createExplosionAnimState(
        explosion: Explosion,
        index: number,
        scale: number,
        terrain: TerrainData | null | undefined
    ): ExplosionAnimState {
        let cx = explosion.explosionCenter!.x;
        let cy = explosion.explosionCenter!.y;
        let radii = explosion.radii;
        let safeScale = scale;

        if (!isFinite(cx)) cx = 400;
        if (!isFinite(cy)) cy = 300;
        if (!isFinite(safeScale) || safeScale <= 0) safeScale = 20;

        if (!radii || !isFinite((radii as any).fireball)) {
            const yieldKt = explosion.yieldKilotons || 15000;
            const burstH = explosion.burstHeight || 1000;
            radii = global.Physics.calculateRadii(yieldKt, burstH);
        }

        Object.keys(radii!).forEach(function (key: string) {
            if (radii && !isFinite((radii as any)[key])) (radii as any)[key] = 1;
        });

        const tint = index;

        const paletteColors = [
            { p1: '#ffdd00', p2: '#ff6600', p3: '#ff0000', smoke: [140, 90, 50] },
            { p1: '#00ffff', p2: '#6688ff', p3: '#0044ff', smoke: [90, 90, 140] },
            { p1: '#ccff88', p2: '#88ff00', p3: '#00cc44', smoke: [90, 130, 80] },
            { p1: '#ffcc66', p2: '#ff9944', p3: '#dd5500', smoke: [150, 100, 70] }
        ];
        const colors = paletteColors[tint % paletteColors.length];

        const particles: Particle[] = [];
        const particleCount = 150;
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = (2 + Math.random() * 4);
            const size = 2 + Math.random() * 6;
            const colorRand = Math.random();
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
        const debrisCount = 80;
        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (3 + Math.random() * 6);
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

        const zoneOrder = ['fireball', 'radiation', 'severe', 'moderate', 'light', 'thermal'];
        const zoneDisplayTimes: { [key: string]: number } = {};
        zoneOrder.forEach((key: string, idx: number) => {
            const radius = (radii as any)[key];
            zoneDisplayTimes[key] = radius / SHOCKWAVE_SPEED_KM_S;
        });

        const maxRadiusPx = (radii as any).thermal * safeScale * 1.2;
        const quakeStartTime = zoneDisplayTimes.severe;
        const quakePeakTime = zoneDisplayTimes.moderate;
        const quakeEndTime = zoneDisplayTimes.thermal + 1.5;

        return {
            cx: cx,
            cy: cy,
            scale: safeScale,
            radii: radii as any,
            particles: particles,
            debris: debris,
            smoke: colors.smoke,
            maxShockwave: maxRadiusPx,
            terrain: terrain,
            explosionRef: explosion,
            tintIndex: tint,
            zoneDisplayTimes: zoneDisplayTimes,
            zoneOrder: zoneOrder,
            maxRadiusKm: (radii as any).thermal,
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
        const fbRadius = a.radii.fireball * a.scale * (1 + Math.sin(progress * Math.PI) * 0.1);
        const fbAlpha = 0.7 * (1 - progress * 0.5);
        const fbGrad = effectCtx.createRadialGradient(a.cx, a.cy, 0, a.cx, a.cy, fbRadius);
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
        terrain: TerrainData | null | undefined,
        scale: number,
        zoneKey: string
    ): void {
        const useTerrain = !!(terrain && (terrain as any).features && (terrain as any).features.length > 0);
        const segments = 96;

        function getRadiusAtAngle(angle: number): number {
            if (!useTerrain || !a.explosionRef) return currentSW;
            return global.Physics.calculateShockwaveRadiusAtAngle(
                a.explosionRef,
                angle,
                zoneKey,
                terrain as any,
                scale,
                currentSW
            );
        }

        effectCtx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            let r: number;
            if (useTerrain) {
                r = getRadiusAtAngle(angle);
            } else {
                r = currentSW;
            }
            const x = a.cx + Math.cos(angle) * r;
            const y = a.cy + Math.sin(angle) * r;
            if (i === 0) effectCtx.moveTo(x, y);
            else {
                const prevAngle = ((i - 1) / segments) * Math.PI * 2;
                let prevR: number;
                if (useTerrain) {
                    prevR = getRadiusAtAngle(prevAngle);
                } else {
                    prevR = currentSW;
                }
                const prevX = a.cx + Math.cos(prevAngle) * prevR;
                const prevY = a.cy + Math.sin(prevAngle) * prevR;
                const midX = (prevX + x) / 2;
                const midY = (prevY + y) / 2;
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
        const p = t / 0.05;
        const fireballP = Math.min(p, 1);
        let currentFireballRadius = Math.pow(fireballP, 0.5) * a.radii.fireball * a.scale;

        if (!isFinite(currentFireballRadius)) currentFireballRadius = 1;

        const cx = isFinite(a.cx) ? a.cx : 400;
        const cy = isFinite(a.cy) ? a.cy : 300;

        if (currentFireballRadius > 0) {
            const r1 = Math.max(0.1, currentFireballRadius);
            if (isFinite(cx) && isFinite(cy) && isFinite(r1)) {
                const fbGrad = effectCtx.createRadialGradient(cx, cy, 0, cx, cy, r1);
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

        const flashAlpha = Math.max(0, 1 - p);
        if (flashAlpha > 0) {
            const r2 = Math.max(1, currentFireballRadius * 2);
            if (isFinite(cx) && isFinite(cy) && isFinite(r2)) {
                const flashGrad = effectCtx.createRadialGradient(cx, cy, 0, cx, cy, r2);
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
        const p = t / 0.3;
        drawPersistentFireball(effectCtx, a, p * 0.3);

        if (p < 1) {
            const fireballP = p;
            const currentFireballRadius = a.radii.fireball * a.scale * (fireballP < 1 ? Math.pow(fireballP, 0.5) : 1);
            const fbGrad = effectCtx.createRadialGradient(a.cx, a.cy, 0, a.cx, a.cy, currentFireballRadius * 0.9);
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
            const earlySWP = (p - 0.3) / 0.7;
            const earlySW = Math.pow(earlySWP, 0.4) * a.radii.fireball * a.scale * 2.5;
            const earlySWAlpha = 0.6 * (1 - earlySWP);

            effectCtx.lineWidth = 5;
            effectCtx.strokeStyle = rgba(255, 220, 150, earlySWAlpha * 0.9);
            drawShockwaveRing(effectCtx, a, earlySW, earlySWAlpha, a.terrain, a.scale, 'fireball');

            for (let i = 0; i < 3; i++) {
                const innerSW = earlySW * (1 - (i + 1) * 0.2);
                if (innerSW > 0) {
                    effectCtx.strokeStyle = rgba(255, 150, 80, earlySWAlpha * 0.5);
                    effectCtx.lineWidth = 2;
                    drawShockwaveRing(effectCtx, a, innerSW, earlySWAlpha, a.terrain, a.scale, 'fireball');
                }
            }
        }
    }

    interface ShockwaveFront {
        km: number;
        px: number;
        fraction: number;
    }

    function calculateShockwaveFront(a: ExplosionAnimState, t: number): ShockwaveFront {
        const currentRadiusKm = Math.min(t * SHOCKWAVE_SPEED_KM_S, a.maxRadiusKm);
        const currentRadiusPx = currentRadiusKm * a.scale;
        return {
            km: currentRadiusKm,
            px: currentRadiusPx,
            fraction: currentRadiusKm / a.maxRadiusKm
        };
    }

    function getQuakeIntensity(a: ExplosionAnimState, t: number): number {
        if (t < a.quakeStartTime) return 0;
        if (t > a.quakeEndTime) return 0;

        const riseTime = a.quakePeakTime - a.quakeStartTime;
        const fallTime = a.quakeEndTime - a.quakePeakTime;

        if (t < a.quakePeakTime) {
            const p = (t - a.quakeStartTime) / riseTime;
            return Math.pow(p, 0.7);
        } else {
            const p = (t - a.quakePeakTime) / fallTime;
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
        const zoneRadiusPx = a.radii[zoneKey] * a.scale;
        if (currentFrontPx < zoneRadiusPx * 0.05) return;

        const visibleRadius = Math.min(currentFrontPx, zoneRadiusPx);
        const progress = visibleRadius / zoneRadiusPx;
        const alpha = progress > 0.9 ? (1 - (progress - 0.9) * 10) : Math.min(1, progress * 2);

        const colors = Renderer.getZoneColors(zoneKey, a.tintIndex);
        const useTerrain = !!(a.terrain && (a.terrain as any).features && (a.terrain as any).features.length > 0);

        if (useTerrain) {
            const boundaryPoints = global.Physics.generateTerrainBoundaryPolygon(
                a.explosionRef,
                zoneKey,
                a.terrain as any,
                a.scale,
                72
            );
            if (boundaryPoints && boundaryPoints.length > 0) {
                const clippedPoints = boundaryPoints.map((pt: TerrainBoundaryPoint) => {
                    const dist = Math.sqrt(Math.pow(pt.x - a.cx, 2) + Math.pow(pt.y - a.cy, 2));
                    const clipFactor = Math.min(1, visibleRadius / Math.max(1, dist));
                    return {
                        x: a.cx + (pt.x - a.cx) * clipFactor,
                        y: a.cy + (pt.y - a.cy) * clipFactor,
                        angle: pt.angle
                    };
                });

                Renderer.drawPolygonPathFromPoints(effectCtx, clippedPoints as any, true);
                effectCtx.fillStyle = (colors as any).fill;
                effectCtx.fill();

                Renderer.drawPolygonPathFromPoints(effectCtx, clippedPoints as any, true);
                effectCtx.strokeStyle = (colors as any).border;
                effectCtx.lineWidth = 1.5;
                effectCtx.stroke();
            }
        } else {
            const fillColor = parseRgba((colors as any).fill);
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
            effectCtx.strokeStyle = (colors as any).border;
            effectCtx.lineWidth = 1.5;
            effectCtx.stroke();
        }
    }

    interface RippleColor {
        r: number;
        g: number;
        b: number;
    }

    function drawRippleWave(
        effectCtx: CanvasRenderingContext2D,
        a: ExplosionAnimState,
        radius: number,
        waveWidth: number,
        alpha: number,
        color: RippleColor
    ): void {
        if (radius <= 0 || waveWidth <= 0 || alpha <= 0) return;

        const useTerrain = !!(a.terrain && (a.terrain as any).features && (a.terrain as any).features.length > 0);
        const segments = 96;

        function getRadiusAtAngle(angle: number, baseRadius: number): number {
            if (!useTerrain || !a.explosionRef) return baseRadius;
            return global.Physics.calculateShockwaveRadiusAtAngle(
                a.explosionRef,
                angle,
                'severe',
                a.terrain as any,
                a.scale,
                baseRadius
            );
        }

        const innerRadius = Math.max(0, radius - waveWidth / 2);
        const outerRadius = radius + waveWidth / 2;

        effectCtx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const r = getRadiusAtAngle(angle, outerRadius);
            const x = a.cx + Math.cos(angle) * r;
            const y = a.cy + Math.sin(angle) * r;
            if (i === 0) effectCtx.moveTo(x, y);
            else effectCtx.lineTo(x, y);
        }
        for (let i = segments; i >= 0; i--) {
            const angle = (i / segments) * Math.PI * 2;
            const r = getRadiusAtAngle(angle, innerRadius);
            const x = a.cx + Math.cos(angle) * r;
            const y = a.cy + Math.sin(angle) * r;
            effectCtx.lineTo(x, y);
        }
        effectCtx.closePath();

        const grad = effectCtx.createRadialGradient(a.cx, a.cy, innerRadius, a.cx, a.cy, outerRadius);
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
        const shockwave = calculateShockwaveFront(a, t);
        const phaseProgress = (t - 0.3) / 1.7;

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
            const swAlpha = Math.max(0, 1 - shockwave.fraction * 0.6);
            const waveSpacing = 40;
            const waveWidth = 25;

            const numWaves = 5;
            for (let i = 0; i < numWaves; i++) {
                const waveOffset = i * waveSpacing;
                const waveRadius = shockwave.px - waveOffset;

                if (waveRadius > 0) {
                    const waveAlpha = swAlpha * Math.max(0, 1 - i * 0.22) * (0.4 + Math.sin(t * 8 - i * 1.5) * 0.3);
                    const widthFactor = 1 + i * 0.3;
                    const waveColor: RippleColor = i === 0
                        ? { r: 255, g: 240, b: 180 }
                        : i === 1
                        ? { r: 255, g: 180, b: 100 }
                        : i === 2
                        ? { r: 255, g: 120, b: 60 }
                        : i === 3
                        ? { r: 220, g: 80, b: 40 }
                        : { r: 180, g: 60, b: 30 };

                    drawRippleWave(effectCtx, a, waveRadius, waveWidth * widthFactor, waveAlpha * 0.7, waveColor);
                }
            }

            const glowRadius = shockwave.px * 0.98;
            if (glowRadius > 0) {
                const glowGrad = effectCtx.createRadialGradient(a.cx, a.cy, glowRadius * 0.95, a.cx, a.cy, glowRadius * 1.05);
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

        a.particles.forEach(function (particle: Particle) {
            particle.x += particle.vx * (1 + phaseProgress * 2);
            particle.y += particle.vy * (1 + phaseProgress * 1.5);
            particle.vy += particle.gravity;
            const particleAlpha = particle.life * Math.max(0, 1 - phaseProgress * 0.7);
            if (particleAlpha > 0) {
                effectCtx.beginPath();
                effectCtx.arc(particle.x, particle.y, particle.size * (1 + phaseProgress * 0.3), 0, Math.PI * 2);
                effectCtx.fillStyle = hexToRgba(particle.color, particleAlpha);
                effectCtx.fill();
            }
        });

        if (phaseProgress > 0.2) {
            a.debris.forEach(function (d: Debris) {
                const debrisPhase = (phaseProgress - 0.2) / 0.8;
                d.x += d.vx * (1 + debrisPhase);
                d.y += d.vy * (1 + debrisPhase * 0.8);
                d.vy += 0.08;
                d.rotation += d.rotSpeed;
                const debrisAlpha = d.life * Math.max(0, 1 - debrisPhase * 0.6);
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
        const phaseProgress = (t - 2.0) / 2.0;
        const mp = Math.min(1, phaseProgress);

        drawPersistentFireball(effectCtx, a, 0.7 + mp * 0.3);

        a.zoneOrder.forEach(zoneKey => {
            if (a.displayedZones[zoneKey]) {
                const zoneRadiusPx = a.radii[zoneKey] * a.scale;
                const colors = Renderer.getZoneColors(zoneKey, a.tintIndex);
                const useTerrain = !!(a.terrain && (a.terrain as any).features && (a.terrain as any).features.length > 0);
                const alpha = 0.16 * Math.max(0.3, 1 - mp * 0.5);

                if (useTerrain) {
                    const boundaryPoints = global.Physics.generateTerrainBoundaryPolygon(
                        a.explosionRef,
                        zoneKey,
                        a.terrain as any,
                        a.scale,
                        72
                    );
                    if (boundaryPoints && boundaryPoints.length > 0) {
                        Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints as any, true);
                        effectCtx.fillStyle = rgba(
                            parseInt((colors as any).fill.slice(5, 8)),
                            parseInt((colors as any).fill.slice(9, 12)),
                            parseInt((colors as any).fill.slice(13, 16)),
                            alpha
                        );
                        effectCtx.fill();

                        Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints as any, true);
                        effectCtx.strokeStyle = (colors as any).border;
                        effectCtx.lineWidth = 1.5;
                        effectCtx.stroke();
                    }
                } else {
                    const fillColor = parseRgba((colors as any).fill);
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
                    effectCtx.strokeStyle = (colors as any).border;
                    effectCtx.lineWidth = 1.5;
                    effectCtx.stroke();
                }
            }
        });

        const cloudY = a.cy - mp * 180 * a.scale / 20;
        const cloudBaseWidth = a.radii.fireball * a.scale * (1.5 + mp * 2.5);
        const cloudHeight = a.radii.fireball * a.scale * (0.8 + mp * 1.8);
        const stemWidth = a.radii.fireball * a.scale * (0.8 - mp * 0.4);

        const sr = a.smoke;
        const stemGrad = effectCtx.createLinearGradient(a.cx, a.cy, a.cx, cloudY);
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

        const cloudGrad = effectCtx.createRadialGradient(
            a.cx, cloudY, 0,
            a.cx, cloudY, cloudBaseWidth
        );
        cloudGrad.addColorStop(0, rgba(sr[0], sr[1], sr[2], 0.85 * (1 - mp * 0.4)));
        cloudGrad.addColorStop(0.5, rgba(sr[0] * 0.75, sr[1] * 0.55, sr[2] * 0.35, 0.7 * (1 - mp * 0.5)));
        cloudGrad.addColorStop(1, rgba(sr[0] * 0.45, sr[1] * 0.4, sr[2] * 0.3, 0));
        effectCtx.fillStyle = cloudGrad;
        effectCtx.beginPath();
        for (let ang = 0; ang < 8; ang++) {
            const angle = (ang / 8) * Math.PI * 2;
            const wobble = Math.sin(mp * Math.PI * 4 + ang) * cloudBaseWidth * 0.15;
            const r = cloudBaseWidth + wobble;
            const x = a.cx + Math.cos(angle) * r;
            const y = cloudY + Math.sin(angle) * cloudHeight * 0.6;
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
            const debrisAlpha = (mp - 0.3) / 0.7 * 0.5;
            for (let i = 0; i < 50; i++) {
                const angle = (i / 50) * Math.PI * 2 + mp * 2;
                const dist = cloudBaseWidth * (0.5 + (i * 0.017) % 0.8);
                const dx = a.cx + Math.cos(angle) * dist;
                const dy = cloudY + Math.sin(angle) * cloudHeight * 0.4 + (mp - 0.3) * 40;
                const ds = 2 + (i * 0.17) % 4;
                effectCtx.beginPath();
                effectCtx.arc(dx, dy, ds, 0, Math.PI * 2);
                effectCtx.fillStyle = rgba(sr[0] * 0.6, sr[1] * 0.5, sr[2] * 0.4, debrisAlpha * (0.5 + (i * 0.013) % 0.5));
                effectCtx.fill();
            }
        }

        a.particles.forEach(function (particle: Particle) {
            particle.x += particle.vx * 0.3;
            particle.y += particle.vy * 0.3;
            particle.vy += 0.02;
            const particleAlpha = particle.life * Math.max(0, 1 - phaseProgress);
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
        const phaseProgress = (t - 4.0) / 2.0;
        const mp = Math.min(1, phaseProgress);

        const fadeAlpha = Math.max(0, 1 - mp);

        a.zoneOrder.forEach(zoneKey => {
            if (a.displayedZones[zoneKey]) {
                const zoneRadiusPx = a.radii[zoneKey] * a.scale;
                const colors = Renderer.getZoneColors(zoneKey, a.tintIndex);
                const useTerrain = !!(a.terrain && (a.terrain as any).features && (a.terrain as any).features.length > 0);
                const alpha = 0.16 * fadeAlpha * 0.5;

                if (useTerrain) {
                    const boundaryPoints = global.Physics.generateTerrainBoundaryPolygon(
                        a.explosionRef,
                        zoneKey,
                        a.terrain as any,
                        a.scale,
                        72
                    );
                    if (boundaryPoints && boundaryPoints.length > 0) {
                        Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints as any, true);
                        effectCtx.fillStyle = rgba(
                            parseInt((colors as any).fill.slice(5, 8)),
                            parseInt((colors as any).fill.slice(9, 12)),
                            parseInt((colors as any).fill.slice(13, 16)),
                            alpha
                        );
                        effectCtx.fill();

                        Renderer.drawPolygonPathFromPoints(effectCtx, boundaryPoints as any, true);
                        effectCtx.strokeStyle = (colors as any).border;
                        effectCtx.lineWidth = 1.5;
                        effectCtx.stroke();
                    }
                } else {
                    const fillColor = parseRgba((colors as any).fill);
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

        const sr = a.smoke;
        const cloudY = a.cy - (1.0 + mp * 0.5) * 180 * a.scale / 20;
        const cloudBaseWidth = a.radii.fireball * a.scale * (4.0 + mp * 1.5);
        const cloudHeight = a.radii.fireball * a.scale * (2.6 + mp * 0.8);

        const cloudGrad = effectCtx.createRadialGradient(
            a.cx, cloudY, 0,
            a.cx, cloudY, cloudBaseWidth
        );
        cloudGrad.addColorStop(0, rgba(sr[0] * 0.8, sr[1] * 0.6, sr[2] * 0.4, 0.6 * fadeAlpha));
        cloudGrad.addColorStop(0.5, rgba(sr[0] * 0.6, sr[1] * 0.45, sr[2] * 0.3, 0.4 * fadeAlpha));
        cloudGrad.addColorStop(1, rgba(sr[0] * 0.35, sr[1] * 0.3, sr[2] * 0.25, 0));
        effectCtx.fillStyle = cloudGrad;
        effectCtx.beginPath();
        for (let ang = 0; ang < 8; ang++) {
            const angle = (ang / 8) * Math.PI * 2;
            const wobble = Math.sin((1 + mp) * Math.PI * 2 + ang) * cloudBaseWidth * 0.2;
            const r = cloudBaseWidth + wobble;
            const x = a.cx + Math.cos(angle) * r;
            const y = cloudY + Math.sin(angle) * cloudHeight * 0.6;
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

        const maxShake = 12 * totalQuakeIntensity;
        const shakeX = (Math.sin(time * 50) + Math.sin(time * 37) * 0.5) * maxShake;
        const shakeY = (Math.sin(time * 43) + Math.sin(time * 29) * 0.5) * maxShake;
        const rotate = (Math.sin(time * 25) * 0.015 + Math.sin(time * 18) * 0.008) * totalQuakeIntensity;

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
                if ((global as any).AudioManager) {
                    (global as any).AudioManager.playFlashSound();
                }
            }

            if (!a.soundTriggers.explosion && tSeconds >= 0.05) {
                a.soundTriggers.explosion = true;
                if ((global as any).AudioManager) {
                    (global as any).AudioManager.playExplosionSound(intensity);
                }
            }

            if (!a.soundTriggers.shockwaveNear && tSeconds >= a.zoneDisplayTimes.severe * 0.5) {
                a.soundTriggers.shockwaveNear = true;
                if ((global as any).AudioManager) {
                    (global as any).AudioManager.playShockwaveSound(a.radii.severe * 0.3, intensity);
                }
            }

            if (!a.soundTriggers.shockwaveFar && tSeconds >= a.zoneDisplayTimes.moderate) {
                a.soundTriggers.shockwaveFar = true;
                if ((global as any).AudioManager) {
                    (global as any).AudioManager.playShockwaveSound(a.radii.moderate * 0.5, intensity * 0.8);
                }
            }

            if (!a.soundTriggers.quake && tSeconds >= a.quakeStartTime) {
                a.soundTriggers.quake = true;
                if ((global as any).AudioManager) {
                    (global as any).AudioManager.playQuakeSound(intensity, 0);
                }
            }

            if (!a.soundTriggers.debris && tSeconds >= a.zoneDisplayTimes.moderate + 0.3) {
                a.soundTriggers.debris = true;
                if ((global as any).AudioManager) {
                    (global as any).AudioManager.playDebrisSound(intensity);
                }
            }
        });
    }

    interface AnimationElements {
        detonateBtn: HTMLButtonElement;
        [key: string]: HTMLElement | HTMLButtonElement | null;
    }

    function animateExplosion(
        effectCtx: CanvasRenderingContext2D,
        effectCanvas: HTMLCanvasElement,
        mapWrapper: HTMLElement,
        state: AppState,
        elements: AnimationElements,
        flashOverlay: HTMLElement
    ): void {
        if (state.isAnimating) return;

        const activeExplosions = state.explosions.filter(function (e: Explosion) {
            return e.explosionCenter && e.radii && e.radii.fireball && isFinite(e.radii.fireball);
        });
        if (activeExplosions.length === 0) return;

        activeExplosions.forEach(function (e: Explosion) {
            if (!e.yieldKilotons) e.yieldKilotons = 15000;
            if (!e.radii || !isFinite(e.radii.fireball)) {
                e.radii = global.Physics.calculateRadii(e.yieldKilotons, e.burstHeight || 1000);
            }
        });

        state.isAnimating = true;
        elements.detonateBtn.disabled = true;

        Renderer.drawMap(state.mapCtx!, mapWrapper, state);

        if ((global as any).AudioManager) {
            (global as any).AudioManager.init();
        }

        flashOverlay.classList.add('active');

        const rect = mapWrapper.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const animStates: ExplosionAnimState[] = activeExplosions.map(function (exp: Explosion, idx: number) {
            return createExplosionAnimState(exp, idx, state.scale, state.terrainData);
        });

        const totalYield = activeExplosions.reduce((sum: number, e: Explosion) => sum + (e.yieldKilotons || 15000), 0);
        const intensity = Math.min(1, totalYield / 50000);

        const startTime = performance.now();
        let earthquakeActive = false;

        function draw(now: number): void {
            const elapsed = now - startTime;
            const tSeconds = elapsed / 1000;
            const progress = Math.min(elapsed / TOTAL_ANIM_DURATION, 1);

            effectCtx.clearRect(0, 0, width, height);

            triggerSounds(animStates, tSeconds, intensity);

            let totalQuakeIntensity = 0;
            animStates.forEach(a => {
                totalQuakeIntensity = Math.max(totalQuakeIntensity, getQuakeIntensity(a, tSeconds));
            });

            if (totalQuakeIntensity > 0.05) {
                applyEarthquakeShake(state.mapCtx!, width, height, totalQuakeIntensity, tSeconds);
                Renderer.drawMap(state.mapCtx!, mapWrapper, state);
                restoreFromEarthquake(state.mapCtx!);
            } else {
                Renderer.drawMap(state.mapCtx!, mapWrapper, state);
            }

            if (progress <= 0.05) {
                animStates.forEach(function (a: ExplosionAnimState) { drawPhaseFlash(effectCtx, a, tSeconds); });
            } else if (progress <= 0.3) {
                animStates.forEach(function (a: ExplosionAnimState) { drawPhaseFireball(effectCtx, a, tSeconds); });
            } else if (progress <= 2.0) {
                animStates.forEach(function (a: ExplosionAnimState) { drawPhaseShockwave(effectCtx, a, tSeconds); });
            } else if (progress <= 4.0) {
                animStates.forEach(function (a: ExplosionAnimState) { drawPhaseMushroom(effectCtx, a, tSeconds); });
            } else {
                animStates.forEach(function (a: ExplosionAnimState) { drawPhaseFadeOut(effectCtx, a, tSeconds); });
            }

            if (progress < 1) {
                state.animationId = requestAnimationFrame(draw);
            } else {
                setTimeout(function () {
                    state.isAnimating = false;
                    elements.detonateBtn.disabled = false;
                    flashOverlay.classList.remove('active');

                    Renderer.drawMap(state.mapCtx!, mapWrapper, state);

                    if ((global as any).Timeline) {
                        (global as any).Timeline.start(state, effectCtx, effectCanvas);
                    }
                }, 800);
            }
        }

        state.animationId = requestAnimationFrame(draw);
    }

    global.Animation = {
        animateExplosion: animateExplosion
    } as any;

})(window);
