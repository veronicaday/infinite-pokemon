/**
 * Procedural SVG sprite generator.
 *
 * Generates unique creature sprites using SVG with gradients, bezier curves,
 * and CSS animations. Deterministic from creature name (MD5 seed).
 */

import type { CreatureData } from '../types/game';
import { typeColors } from '../styles/theme';

// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

class SeededRng {
  private next: () => number;

  constructor(seed: string) {
    this.next = mulberry32(hashString(seed));
    // Warm up
    for (let i = 0; i < 10; i++) this.next();
  }

  random(): number {
    return this.next();
  }

  randint(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  uniform(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbStr(r: number, g: number, b: number, a?: number): string {
  if (a !== undefined) return `rgba(${r},${g},${b},${a})`;
  return `rgb(${r},${g},${b})`;
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbStr(
    Math.min(255, r + amount),
    Math.min(255, g + amount),
    Math.min(255, b + amount)
  );
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbStr(
    Math.max(0, r - amount),
    Math.max(0, g - amount),
    Math.max(0, b - amount)
  );
}

export function generateSvgSprite(creature: CreatureData, size: number = 128): string {
  const rng = new SeededRng(creature.name);
  const s = size;
  const cx = s / 2;
  const cy = s / 2;

  const primaryHex = typeColors[creature.types[0]] || '#808080';
  const secondaryHex =
    creature.types.length > 1
      ? typeColors[creature.types[1]] || primaryHex
      : lighten(primaryHex, 40);
  const darkColor = darken(primaryHex, 60);
  const highlight = lighten(primaryHex, 80);
  const [pr, pg, pb] = hexToRgb(primaryHex);

  const stats = creature.base_stats;
  const id = creature.name.replace(/[^a-zA-Z0-9]/g, '');

  // Body dimensions
  const bodyScale = 0.25 + (stats.hp / 100) * 0.25;
  let bodyW = Math.round(s * bodyScale);
  let bodyH = Math.round(s * bodyScale * rng.uniform(0.8, 1.3));
  if (stats.speed > 60) { bodyH = Math.round(bodyH * 1.2); bodyW = Math.round(bodyW * 0.85); }
  if (stats.defense > 60) { bodyW = Math.round(bodyW * 1.2); bodyH = Math.round(bodyH * 0.9); }
  const bodyY = cy - bodyH / 4;

  const bodyType = rng.choice(['round', 'diamond', 'blob', 'angular', 'tall']);
  const eyeStyle = rng.choice(['round', 'angry', 'cute', 'glow', 'slit']);
  const armStyle = rng.choice(['claw', 'arm', 'tentacle', 'wing_arm']);
  const legStyle = rng.choice(['feet', 'stubs', 'tail', 'hover', 'claws']);
  const headFeature = rng.choice(['horn', 'ears', 'crown', 'antenna', 'crest', 'none']);
  const mouthStyle = rng.choice(['smile', 'fangs', 'beak', 'none', 'open']);

  let defs = '';
  let elements = '';
  let animations = '';

  // --- Gradient defs ---
  defs += `<linearGradient id="bg_${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${primaryHex}"/>
    <stop offset="100%" stop-color="${secondaryHex}"/>
  </linearGradient>
  <radialGradient id="glow_${id}" cx="50%" cy="40%" r="50%">
    <stop offset="0%" stop-color="${highlight}" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="${primaryHex}" stop-opacity="0"/>
  </radialGradient>
  <filter id="blur_${id}"><feGaussianBlur stdDeviation="2"/></filter>
  <filter id="shadow_${id}"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/></filter>`;

  // --- Sp.Attack > 60: aura glow ---
  if (stats.sp_attack > 60) {
    const auraSize = bodyW * 0.8 + (stats.sp_attack / 100) * bodyW * 0.3;
    for (let i = 0; i < 3; i++) {
      const r = auraSize + i * 6;
      const alpha = (0.15 - i * 0.04).toFixed(2);
      elements += `<ellipse cx="${cx}" cy="${bodyY - 5}" rx="${r}" ry="${r * 0.6}" fill="${highlight}" opacity="${alpha}" filter="url(#blur_${id})"/>`;
    }
  }

  // --- Body ---
  if (bodyType === 'round') {
    elements += `<ellipse cx="${cx}" cy="${bodyY}" rx="${bodyW / 2}" ry="${bodyH / 2}" fill="url(#bg_${id})" filter="url(#shadow_${id})"/>`;
    elements += `<ellipse cx="${cx}" cy="${bodyY + bodyH / 6}" rx="${(bodyW - 8) / 2}" ry="${bodyH / 4}" fill="${secondaryHex}" opacity="0.7"/>`;
  } else if (bodyType === 'diamond') {
    const pts = `${cx},${bodyY - bodyH / 2} ${cx + bodyW / 2},${bodyY} ${cx},${bodyY + bodyH / 2} ${cx - bodyW / 2},${bodyY}`;
    elements += `<polygon points="${pts}" fill="url(#bg_${id})" filter="url(#shadow_${id})"/>`;
    const inner = `${cx},${bodyY - bodyH * 0.35} ${cx + bodyW * 0.35},${bodyY} ${cx},${bodyY + bodyH * 0.35} ${cx - bodyW * 0.35},${bodyY}`;
    elements += `<polygon points="${inner}" fill="${secondaryHex}" opacity="0.6"/>`;
  } else if (bodyType === 'blob') {
    const pts: string[] = [];
    const numPts = 12;
    for (let i = 0; i < numPts; i++) {
      const angle = (i / numPts) * Math.PI * 2;
      const rx = bodyW / 2 + rng.randint(-4, 4);
      const ry = bodyH / 2 + rng.randint(-4, 4);
      pts.push(`${cx + rx * Math.cos(angle)},${bodyY + ry * Math.sin(angle)}`);
    }
    // Convert polygon to smooth bezier path
    const path = smoothPolygonPath(pts.map(p => p.split(',').map(Number) as [number, number]));
    elements += `<path d="${path}" fill="url(#bg_${id})" filter="url(#shadow_${id})"/>`;
    // Inner blob
    const innerPts: [number, number][] = [];
    for (let i = 0; i < numPts; i++) {
      const angle = (i / numPts) * Math.PI * 2;
      const rx = (bodyW - 10) / 2 + rng.randint(-3, 3);
      const ry = (bodyH - 10) / 2 + rng.randint(-3, 3);
      innerPts.push([cx + rx * Math.cos(angle), bodyY + 4 + ry * Math.sin(angle)]);
    }
    elements += `<path d="${smoothPolygonPath(innerPts)}" fill="${secondaryHex}" opacity="0.6"/>`;
  } else if (bodyType === 'angular') {
    const hw = bodyW / 2, hh = bodyH / 2;
    const pts = `${cx - hw},${bodyY - hh / 2} ${cx - hw / 3},${bodyY - hh} ${cx + hw / 3},${bodyY - hh} ${cx + hw},${bodyY - hh / 2} ${cx + hw},${bodyY + hh} ${cx - hw},${bodyY + hh}`;
    elements += `<polygon points="${pts}" fill="url(#bg_${id})" stroke="${darkColor}" stroke-width="2" filter="url(#shadow_${id})"/>`;
  } else if (bodyType === 'tall') {
    const rx = bodyW / 6;
    elements += `<rect x="${cx - bodyW / 2}" y="${bodyY - bodyH / 2}" width="${bodyW}" height="${bodyH}" rx="${rx}" fill="url(#bg_${id})" filter="url(#shadow_${id})"/>`;
    elements += `<rect x="${cx - bodyW / 2 + 4}" y="${bodyY - bodyH / 2 + 4}" width="${bodyW - 8}" height="${bodyH - 8}" rx="${rx}" fill="${secondaryHex}" opacity="0.5"/>`;
  }

  // --- Defense > 60: armor outline ---
  if (stats.defense > 60) {
    const alpha = Math.min(0.7, 0.3 + stats.defense / 200).toFixed(2);
    if (bodyType === 'round') {
      elements += `<ellipse cx="${cx}" cy="${bodyY}" rx="${bodyW / 2 + 3}" ry="${bodyH / 2 + 3}" fill="none" stroke="${darkColor}" stroke-width="3" opacity="${alpha}"/>`;
    } else {
      elements += `<rect x="${cx - bodyW / 2 - 3}" y="${bodyY - bodyH / 2 - 3}" width="${bodyW + 6}" height="${bodyH + 6}" rx="6" fill="none" stroke="${darkColor}" stroke-width="3" opacity="${alpha}"/>`;
    }
  }

  // --- Eyes ---
  const eyeY = bodyY - bodyH / 6;
  const eyeSpacing = bodyW / 4;
  const eyeSize = Math.max(3, s * 0.04 + (stats.sp_attack / 100) * s * 0.03);

  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpacing;
    if (eyeStyle === 'round') {
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize}" fill="white"/>`;
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize / 2}" fill="#141414"/>`;
    } else if (eyeStyle === 'angry') {
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize}" fill="#ff3c3c"/>`;
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize / 2}" fill="#141414"/>`;
      const bdir = side;
      elements += `<line x1="${ex - eyeSize}" y1="${eyeY - eyeSize}" x2="${ex + eyeSize * bdir}" y2="${eyeY - eyeSize - 3}" stroke="${darkColor}" stroke-width="2" stroke-linecap="round"/>`;
    } else if (eyeStyle === 'cute') {
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize}" fill="#141414"/>`;
      elements += `<circle cx="${ex - eyeSize / 3}" cy="${eyeY - eyeSize / 3}" r="${eyeSize / 3}" fill="white"/>`;
    } else if (eyeStyle === 'glow') {
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize + 3}" fill="${highlight}" opacity="0.3" filter="url(#blur_${id})"/>`;
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize}" fill="${highlight}"/>`;
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize / 2}" fill="white"/>`;
    } else if (eyeStyle === 'slit') {
      elements += `<circle cx="${ex}" cy="${eyeY}" r="${eyeSize}" fill="#c8c832"/>`;
      elements += `<ellipse cx="${ex}" cy="${eyeY}" rx="${eyeSize / 4}" ry="${eyeSize}" fill="#141414"/>`;
    }
  }

  // --- Head features ---
  const headY = bodyY - bodyH / 2;
  if (headFeature === 'horn') {
    const hornH = 10 + stats.attack / 8;
    elements += `<polygon points="${cx - 4},${headY} ${cx},${headY - hornH} ${cx + 4},${headY}" fill="${darkColor}"/>`;
  } else if (headFeature === 'ears') {
    for (const side of [-1, 1]) {
      const earX = cx + side * bodyW / 4;
      elements += `<polygon points="${earX},${headY} ${earX + side * 10},${headY - 16} ${earX + side * 2},${headY}" fill="${primaryHex}"/>`;
      elements += `<polygon points="${earX},${headY + 2} ${earX + side * 6},${headY - 11} ${earX + side * 1},${headY + 2}" fill="${secondaryHex}"/>`;
    }
  } else if (headFeature === 'crown') {
    for (let i = 0; i < 3; i++) {
      const px = cx - 10 + i * 10;
      elements += `<polygon points="${px - 3},${headY} ${px},${headY - 12} ${px + 3},${headY}" fill="#ffd700"/>`;
    }
  } else if (headFeature === 'antenna') {
    for (const side of [-1, 1]) {
      const ax = cx + side * bodyW / 5;
      elements += `<line x1="${ax}" y1="${headY}" x2="${ax + side * 8}" y2="${headY - 18}" stroke="${darkColor}" stroke-width="2" stroke-linecap="round"/>`;
      elements += `<circle cx="${ax + side * 8}" cy="${headY - 18}" r="3" fill="${highlight}"/>`;
    }
  } else if (headFeature === 'crest') {
    elements += `<polygon points="${cx - bodyW / 4},${headY} ${cx},${headY - 20} ${cx + bodyW / 4},${headY}" fill="${secondaryHex}"/>`;
  }

  // --- Mouth ---
  const mouthY = bodyY + bodyH / 8;
  if (mouthStyle === 'smile') {
    elements += `<path d="M${cx - 6},${mouthY} Q${cx},${mouthY + 6} ${cx + 6},${mouthY}" fill="none" stroke="${darkColor}" stroke-width="2" stroke-linecap="round"/>`;
  } else if (mouthStyle === 'fangs') {
    elements += `<line x1="${cx - 8}" y1="${mouthY}" x2="${cx + 8}" y2="${mouthY}" stroke="${darkColor}" stroke-width="2"/>`;
    elements += `<line x1="${cx - 5}" y1="${mouthY}" x2="${cx - 5}" y2="${mouthY + 5}" stroke="white" stroke-width="2"/>`;
    elements += `<line x1="${cx + 5}" y1="${mouthY}" x2="${cx + 5}" y2="${mouthY + 5}" stroke="white" stroke-width="2"/>`;
  } else if (mouthStyle === 'beak') {
    elements += `<polygon points="${cx - 4},${mouthY} ${cx},${mouthY + 9} ${cx + 4},${mouthY}" fill="#dcb432"/>`;
  } else if (mouthStyle === 'open') {
    elements += `<ellipse cx="${cx}" cy="${mouthY}" rx="5" ry="3" fill="${darkColor}"/>`;
  }

  // --- Arms ---
  if (stats.attack > 40) {
    const armLen = bodyW * 0.4 + (stats.attack / 100) * bodyW * 0.4;
    const armW = Math.max(2, 3 + stats.attack / 30);
    const armY = bodyY;

    for (const side of [-1, 1]) {
      const ax = cx + side * bodyW / 2;
      if (armStyle === 'claw') {
        const endX = ax + side * armLen;
        elements += `<line x1="${ax}" y1="${armY}" x2="${endX}" y2="${armY - 8}" stroke="${darkColor}" stroke-width="${armW}" stroke-linecap="round"/>`;
        for (const angle of [-30, 0, 30]) {
          const rad = (angle * Math.PI) / 180;
          const tipX = endX + side * 8 * Math.cos(rad);
          const tipY = armY - 8 + 8 * Math.sin(rad);
          elements += `<line x1="${endX}" y1="${armY - 8}" x2="${tipX}" y2="${tipY}" stroke="${darkColor}" stroke-width="2" stroke-linecap="round"/>`;
        }
      } else if (armStyle === 'arm') {
        const endX = ax + side * armLen;
        elements += `<line x1="${ax}" y1="${armY}" x2="${endX}" y2="${armY + 5}" stroke="${darkColor}" stroke-width="${armW}" stroke-linecap="round"/>`;
        elements += `<circle cx="${endX}" cy="${armY + 5}" r="${armW + 1}" fill="${secondaryHex}"/>`;
      } else if (armStyle === 'tentacle') {
        let px = ax, py = armY;
        let d = `M${px},${py}`;
        for (let i = 1; i <= 4; i++) {
          const t = i / 4;
          px = ax + side * armLen * t;
          py = armY + Math.sin(t * Math.PI * 2) * 8;
          d += ` L${px},${py}`;
        }
        elements += `<path d="${d}" fill="none" stroke="${darkColor}" stroke-width="${armW}" stroke-linecap="round"/>`;
      } else if (armStyle === 'wing_arm') {
        const pts = `${ax},${armY - bodyH / 4} ${ax + side * armLen},${armY - bodyH / 2} ${ax + side * armLen * 0.7},${armY} ${ax},${armY + bodyH / 6}`;
        elements += `<polygon points="${pts}" fill="${secondaryHex}" stroke="${darkColor}" stroke-width="1.5" opacity="0.8"/>`;
      }
    }
  }

  // --- Legs ---
  const footY = bodyY + bodyH / 2;
  const legSpread = bodyW / 3;

  if (legStyle === 'feet') {
    for (const side of [-1, 1]) {
      const lx = cx + side * legSpread;
      elements += `<rect x="${lx - 5}" y="${footY}" width="10" height="8" rx="2" fill="${darkColor}"/>`;
    }
  } else if (legStyle === 'stubs') {
    for (const side of [-1, 1]) {
      const lx = cx + side * legSpread;
      elements += `<ellipse cx="${lx}" cy="${footY + 3}" rx="6" ry="5" fill="${darkColor}"/>`;
    }
  } else if (legStyle === 'tail') {
    let d = `M${cx},${footY}`;
    for (let i = 1; i <= 5; i++) {
      const t = i / 5;
      d += ` L${cx + bodyW * 0.4 * t},${footY + 15 * t}`;
    }
    elements += `<path d="${d}" fill="none" stroke="${darkColor}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (legStyle === 'hover') {
    elements += `<ellipse cx="${cx}" cy="${footY + 12}" rx="${bodyW / 2}" ry="4" fill="black" opacity="0.15"/>`;
  } else if (legStyle === 'claws') {
    for (const side of [-1, 1]) {
      const lx = cx + side * legSpread;
      for (const dx of [-3, 0, 3]) {
        elements += `<line x1="${lx + dx}" y1="${footY}" x2="${lx + dx + side * 2}" y2="${footY + 8}" stroke="${darkColor}" stroke-width="2" stroke-linecap="round"/>`;
      }
    }
  }

  // --- Type-specific features ---
  const typeFx = typeFeatures(creature.types[0], cx, bodyY, bodyW, bodyH, rng, primaryHex, id);
  elements += typeFx.elements;
  if (typeFx.animations) animations += typeFx.animations;

  // --- Idle breathing animation ---
  animations += `
    @keyframes breathe_${id} {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.02); }
    }`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
    <defs>${defs}</defs>
    <style>${animations}</style>
    <g style="animation: breathe_${id} 3s ease-in-out infinite; transform-origin: ${cx}px ${bodyY + bodyH / 2}px;">
      ${elements}
    </g>
  </svg>`;
}

function smoothPolygonPath(points: [number, number][]): string {
  if (points.length < 3) return '';
  const n = points.length;
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d + ' Z';
}

function typeFeatures(
  typeName: string,
  cx: number, cy: number,
  bw: number, bh: number,
  rng: SeededRng,
  colorHex: string,
  id: string
): { elements: string; animations: string } {
  let elements = '';
  let animations = '';
  const [cr, cg, cb] = hexToRgb(colorHex);

  switch (typeName) {
    case 'Fire': {
      animations += `@keyframes flicker_${id} { 0%,100%{opacity:0.8;transform:translateY(0)} 50%{opacity:1;transform:translateY(-3px)} }`;
      for (let i = 0; i < 4; i++) {
        const fx = cx + rng.randint(-bw / 3, bw / 3);
        const fy = cy - bh / 2 - rng.randint(5, 20);
        const fs = rng.randint(5, 10);
        elements += `<polygon points="${fx},${fy - fs} ${fx + fs / 2},${fy} ${fx - fs / 2},${fy}" fill="rgba(255,160,40,0.8)" style="animation:flicker_${id} ${0.5 + rng.random() * 0.5}s ease-in-out infinite ${rng.random() * 0.5}s"/>`;
      }
      break;
    }
    case 'Water': {
      animations += `@keyframes drip_${id} { 0%,100%{opacity:0.6;transform:translateY(0)} 50%{opacity:0.9;transform:translateY(3px)} }`;
      for (let i = 0; i < 4; i++) {
        const dx = cx + rng.randint(-bw / 2, bw / 2);
        const dy = cy + rng.randint(-bh / 3, bh / 2);
        elements += `<circle cx="${dx}" cy="${dy}" r="3" fill="rgba(100,180,255,0.5)" style="animation:drip_${id} ${1 + rng.random()}s ease-in-out infinite ${rng.random()}s"/>`;
      }
      break;
    }
    case 'Electric': {
      animations += `@keyframes zap_${id} { 0%,100%{opacity:1} 50%{opacity:0.4} }`;
      for (let i = 0; i < 2; i++) {
        let sx = cx + rng.randint(-bw / 2, bw / 2);
        let sy = cy + rng.randint(-bh / 2, bh / 2);
        let d = `M${sx},${sy}`;
        for (let j = 0; j < 3; j++) {
          sx += rng.randint(-5, 5);
          sy += rng.randint(3, 7);
          d += ` L${sx},${sy}`;
        }
        elements += `<path d="${d}" fill="none" stroke="#ffff64" stroke-width="2" stroke-linecap="round" style="animation:zap_${id} ${0.3 + rng.random() * 0.3}s step-end infinite ${rng.random() * 0.5}s"/>`;
      }
      break;
    }
    case 'Ice': {
      for (let i = 0; i < 5; i++) {
        const ix = cx + rng.randint(-bw / 2, bw / 2);
        const iy = cy + rng.randint(-bh / 2, bh / 2);
        const sz = rng.randint(3, 7);
        let d = '';
        for (let a = 0; a < 360; a += 60) {
          const rad = (a * Math.PI) / 180;
          d += `M${ix},${iy} L${ix + sz * Math.cos(rad)},${iy + sz * Math.sin(rad)} `;
        }
        elements += `<path d="${d}" fill="none" stroke="rgba(200,230,255,0.7)" stroke-width="1"/>`;
      }
      break;
    }
    case 'Ghost': {
      animations += `@keyframes fade_${id} { 0%,100%{opacity:0.2} 50%{opacity:0.5} }`;
      for (let i = 0; i < 3; i++) {
        const gx = cx + rng.randint(-bw / 2, bw / 2);
        const gy = cy + bh / 2 + rng.randint(0, 10);
        elements += `<circle cx="${gx}" cy="${gy}" r="6" fill="${rgbStr(cr, cg, cb, 0.3)}" filter="url(#blur_${id})" style="animation:fade_${id} ${2 + rng.random()}s ease-in-out infinite ${rng.random()}s"/>`;
      }
      break;
    }
    case 'Dragon': {
      for (const side of [-1, 1]) {
        const wx = cx + side * (bw / 2 + 5);
        const pts = `${wx},${cy - 5} ${wx + side * 20},${cy - 18} ${wx + side * 14},${cy} ${wx + side * 20},${cy + 12} ${wx},${cy + 5}`;
        elements += `<polygon points="${pts}" fill="${darken(colorHex, 30)}" opacity="0.9"/>`;
      }
      break;
    }
    case 'Cosmic': {
      animations += `@keyframes orbit_${id} { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`;
      elements += `<g style="animation:orbit_${id} 6s linear infinite; transform-origin:${cx}px ${cy}px">`;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const ox = cx + bw * 0.6 * Math.cos(angle);
        const oy = cy + bh * 0.4 * Math.sin(angle);
        elements += `<circle cx="${ox}" cy="${oy}" r="3" fill="rgba(200,180,255,0.6)"/>`;
        elements += `<circle cx="${ox}" cy="${oy}" r="1" fill="white"/>`;
      }
      elements += `</g>`;
      break;
    }
    case 'Sound': {
      animations += `@keyframes pulse_${id} { 0%{opacity:0.5;transform:scale(1)} 100%{opacity:0;transform:scale(1.3)} }`;
      for (let i = 0; i < 3; i++) {
        const r = bw / 2 + 8 + i * 10;
        elements += `<circle cx="${cx + bw / 2 + 5}" cy="${cy}" r="${r}" fill="none" stroke="${rgbStr(cr, cg, cb, 0.3)}" stroke-width="2" style="animation:pulse_${id} ${1.5}s ease-out infinite ${i * 0.3}s"/>`;
      }
      break;
    }
    case 'Digital': {
      animations += `@keyframes glitch_${id} { 0%,100%{transform:translate(0,0)} 25%{transform:translate(2px,-1px)} 75%{transform:translate(-2px,1px)} }`;
      for (let i = 0; i < 8; i++) {
        const gx = cx + rng.randint(-bw / 2, bw / 2);
        const gy = cy + rng.randint(-bh / 2, bh / 2);
        const gw = rng.randint(3, 8);
        const gh = rng.randint(2, 4);
        const alpha = rng.uniform(0.3, 0.6).toFixed(2);
        elements += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="${rgbStr(cr, cg, cb, parseFloat(alpha))}" style="animation:glitch_${id} ${0.2 + rng.random() * 0.3}s step-end infinite"/>`;
      }
      break;
    }
    case 'Fairy': {
      animations += `@keyframes sparkle_${id} { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`;
      for (let i = 0; i < 5; i++) {
        const sx = cx + rng.randint(-bw / 2 - 5, bw / 2 + 5);
        const sy = cy + rng.randint(-bh / 2 - 5, bh / 2 + 5);
        const sz = rng.randint(3, 6);
        elements += `<g style="animation:sparkle_${id} ${1 + rng.random()}s ease-in-out infinite ${rng.random()}s">
          <line x1="${sx - sz}" y1="${sy}" x2="${sx + sz}" y2="${sy}" stroke="#ffffd0" stroke-width="1"/>
          <line x1="${sx}" y1="${sy - sz}" x2="${sx}" y2="${sy + sz}" stroke="#ffffd0" stroke-width="1"/>
          <circle cx="${sx}" cy="${sy}" r="1" fill="white"/>
        </g>`;
      }
      break;
    }
    case 'Poison': {
      animations += `@keyframes bubble_${id} { 0%,100%{transform:translateY(0);opacity:0.4} 50%{transform:translateY(-4px);opacity:0.7} }`;
      for (let i = 0; i < 4; i++) {
        const bx = cx + rng.randint(-bw / 3, bw / 3);
        const by = cy + rng.randint(-bh / 3, bh / 3);
        const br = rng.randint(3, 6);
        elements += `<circle cx="${bx}" cy="${by}" r="${br}" fill="${rgbStr(cr, cg, cb, 0.35)}" style="animation:bubble_${id} ${1.5 + rng.random()}s ease-in-out infinite ${rng.random()}s"/>`;
        elements += `<circle cx="${bx - 1}" cy="${by - 1}" r="${br / 2}" fill="rgba(255,255,255,0.3)"/>`;
      }
      break;
    }
    case 'Flying': {
      for (const side of [-1, 1]) {
        const wx = cx + side * (bw / 2 + 3);
        elements += `<path d="M${wx},${cy} Q${wx + side * 16},${cy - 14} ${wx + side * 6},${cy - 6}" fill="none" stroke="${rgbStr(cr, cg, cb, 0.6)}" stroke-width="2"/>`;
      }
      break;
    }
    case 'Psychic': {
      animations += `@keyframes psywave_${id} { 0%,100%{opacity:0.2} 50%{opacity:0.5} }`;
      for (let i = 0; i < 2; i++) {
        const r = bw / 2 + 10 + i * 8;
        elements += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.5}" fill="none" stroke="rgba(248,88,136,0.3)" stroke-width="1.5" stroke-dasharray="4 3" style="animation:psywave_${id} ${2 + i}s ease-in-out infinite"/>`;
      }
      break;
    }
    case 'Rock': {
      for (let i = 0; i < 3; i++) {
        const rx = cx + rng.randint(-bw / 3, bw / 3);
        const ry = cy + rng.randint(-bh / 4, bh / 3);
        const rs = rng.randint(3, 6);
        elements += `<rect x="${rx}" y="${ry}" width="${rs}" height="${rs}" fill="${darken(colorHex, 20)}" transform="rotate(${rng.randint(0, 45)} ${rx + rs / 2} ${ry + rs / 2})"/>`;
      }
      break;
    }
    case 'Steel': {
      elements += `<ellipse cx="${cx}" cy="${cy}" rx="${bw / 2}" ry="${bh / 2}" fill="none" stroke="rgba(200,200,220,0.3)" stroke-width="2" stroke-dasharray="2 4"/>`;
      break;
    }
    case 'Grass': {
      for (let i = 0; i < 3; i++) {
        const lx = cx + rng.randint(-bw / 2, bw / 2);
        const ly = cy - bh / 2 - rng.randint(2, 10);
        elements += `<path d="M${lx},${ly} Q${lx + rng.randint(-8, 8)},${ly - 12} ${lx + rng.randint(-4, 4)},${ly - 16}" fill="none" stroke="#5a9e30" stroke-width="2" stroke-linecap="round"/>`;
      }
      break;
    }
    case 'Ground': {
      for (let i = 0; i < 3; i++) {
        const gx = cx + rng.randint(-bw / 2, bw / 2);
        const gy = cy + bh / 2 + rng.randint(2, 8);
        elements += `<ellipse cx="${gx}" cy="${gy}" rx="${rng.randint(4, 8)}" ry="2" fill="${darken(colorHex, 20)}" opacity="0.5"/>`;
      }
      break;
    }
    case 'Dark': {
      animations += `@keyframes darkpulse_${id} { 0%,100%{opacity:0.15} 50%{opacity:0.35} }`;
      elements += `<ellipse cx="${cx}" cy="${cy}" rx="${bw * 0.7}" ry="${bh * 0.5}" fill="black" opacity="0.2" filter="url(#blur_${id})" style="animation:darkpulse_${id} 3s ease-in-out infinite"/>`;
      break;
    }
    case 'Bug': {
      for (const side of [-1, 1]) {
        const wx = cx + side * (bw / 2 + 2);
        elements += `<ellipse cx="${wx + side * 8}" cy="${cy - 4}" rx="8" ry="5" fill="${rgbStr(cr, cg, cb, 0.4)}" stroke="${darken(colorHex, 30)}" stroke-width="1" transform="rotate(${side * -20} ${wx + side * 8} ${cy - 4})"/>`;
      }
      break;
    }
    case 'Fighting': {
      for (const side of [-1, 1]) {
        const fx = cx + side * (bw / 2 + 10);
        elements += `<line x1="${fx}" y1="${cy + 2}" x2="${fx + side * 4}" y2="${cy - 5}" stroke="${rgbStr(cr, cg, cb, 0.6)}" stroke-width="3" stroke-linecap="round"/>`;
      }
      break;
    }
    default: {
      // Normal and any unhandled types — no special decoration
      break;
    }
  }

  return { elements, animations };
}
