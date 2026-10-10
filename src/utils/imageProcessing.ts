/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AdjustmentSettings,
  CurvePoint,
  CurveSettings,
  CutoutSettings,
  BorderSettings,
  FilterPreset,
} from '../types/editor';

export const DEFAULT_ADJUSTMENTS: AdjustmentSettings = {
  brightness: 0,
  contrast: 0,
  exposure: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  vibrance: 0,
  sharpness: 0,
  blur: 0,
  vignette: 0,
  grain: 0,
};

export const DEFAULT_CURVE_POINTS: CurvePoint[] = [
  { x: 0, y: 0 },
  { x: 255, y: 255 },
];

export const DEFAULT_CURVES: CurveSettings = {
  master: [...DEFAULT_CURVE_POINTS],
  red: [...DEFAULT_CURVE_POINTS],
  green: [...DEFAULT_CURVE_POINTS],
  blue: [...DEFAULT_CURVE_POINTS],
};

export const DEFAULT_CUTOUT: CutoutSettings = {
  enabled: false,
  targetColor: '#00ff00',
  tolerance: 35,
  feather: 4,
  invert: false,
};

export const DEFAULT_BORDERS: BorderSettings = {
  type: 'none',
  color: '#ffffff',
  width: 24,
  radius: 16,
  polaroidCaption: '',
};

/**
 * Monotone cubic spline interpolation for tone curves.
 * Guarantees smooth, non-oscillating curves that pass through all control points.
 */
export function buildSplineLUT(points: CurvePoint[]): Uint8Array {
  const lut = new Uint8Array(256);
  if (!points || points.length === 0) {
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  // Sort points by x coordinate
  const pts = [...points].sort((a, b) => a.x - b.x);

  // Ensure 0 and 255 endpoints exist
  if (pts[0].x > 0) {
    pts.unshift({ x: 0, y: pts[0].y });
  }
  if (pts[pts.length - 1].x < 255) {
    pts.push({ x: 255, y: pts[pts.length - 1].y });
  }

  const n = pts.length;
  if (n === 2) {
    // Simple linear interpolation
    const m = (pts[1].y - pts[0].y) / (pts[1].x - pts[0].x || 1);
    for (let i = 0; i < 256; i++) {
      const val = pts[0].y + m * (i - pts[0].x);
      lut[i] = Math.max(0, Math.min(255, Math.round(val)));
    }
    return lut;
  }

  // Slopes of secant lines
  const deltas = new Float32Array(n - 1);
  const m = new Float32Array(n);
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    deltas[i] = dx === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx;
  }

  // Tangents initialization
  m[0] = deltas[0];
  m[n - 1] = deltas[n - 2];
  for (let i = 1; i < n - 1; i++) {
    m[i] = (deltas[i - 1] + deltas[i]) * 0.5;
  }

  // Fritsch-Carlson monotonicity condition
  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = m[i] / deltas[i];
      const beta = m[i + 1] / deltas[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        m[i] = tau * alpha * deltas[i];
        m[i + 1] = tau * beta * deltas[i];
      }
    }
  }

  // Hermite spline evaluation
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    while (seg < n - 2 && x > pts[seg + 1].x) {
      seg++;
    }
    const x0 = pts[seg].x;
    const x1 = pts[seg + 1].x;
    const y0 = pts[seg].y;
    const y1 = pts[seg + 1].y;
    const h = x1 - x0;
    if (h === 0) {
      lut[x] = Math.max(0, Math.min(255, Math.round(y0)));
      continue;
    }
    const t = (x - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;

    const y = h00 * y0 + h10 * h * m[seg] + h01 * y1 + h11 * h * m[seg + 1];
    lut[x] = Math.max(0, Math.min(255, Math.round(y)));
  }

  return lut;
}

/**
 * Filter Presets with authentic color formulas & adjustments
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'Original',
    category: 'Modern',
    description: 'No preset filter applied',
    thumbnailColor: '#64748b',
    apply: () => ({}),
  },
  {
    id: 'cinematic',
    name: 'Cine Warm',
    category: 'Cinematic',
    description: 'Hollywood teal & amber color grade with rich shadows',
    thumbnailColor: '#f59e0b',
    apply: () => ({
      temperature: 18,
      tint: -4,
      contrast: 15,
      highlights: -12,
      shadows: 14,
      vibrance: 20,
      vignette: 25,
    }),
    lutTint: { r: 24, g: 8, b: -18, strength: 0.35 },
  },
  {
    id: 'portra',
    name: 'Kodak Portra',
    category: 'Vintage',
    description: 'Warm analog portrait tone, lifted blacks, soft skin highlights',
    thumbnailColor: '#f97316',
    apply: () => ({
      temperature: 14,
      contrast: -8,
      shadows: 22,
      highlights: -10,
      saturation: -6,
      vibrance: 12,
      grain: 16,
    }),
    lutTint: { r: 18, g: 10, b: -8, strength: 0.28 },
  },
  {
    id: 'velvia',
    name: 'Fuji Velvia',
    category: 'Cinematic',
    description: 'Ultra saturated landscape punch with deep blues & vivid greens',
    thumbnailColor: '#10b981',
    apply: () => ({
      contrast: 22,
      saturation: 32,
      vibrance: 25,
      highlights: -8,
      shadows: -10,
      sharpness: 24,
    }),
  },
  {
    id: 'monochrome',
    name: 'B&W Contrast',
    category: 'B&W',
    description: 'Clean silver monochrome with deep contrast & sharp midtones',
    thumbnailColor: '#475569',
    apply: () => ({
      saturation: -100,
      contrast: 32,
      brightness: 4,
      shadows: -14,
      highlights: 12,
      sharpness: 20,
    }),
  },
  {
    id: 'noir',
    name: 'Classic Noir',
    category: 'B&W',
    description: '1940s dramatic low-key monochrome with heavy shadows & film grain',
    thumbnailColor: '#1e293b',
    apply: () => ({
      saturation: -100,
      contrast: 45,
      brightness: -10,
      shadows: -35,
      highlights: 20,
      sharpness: 30,
      vignette: 50,
      grain: 32,
    }),
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'Cinematic',
    description: 'Radiant warm sunset illumination with soft glowing highlights',
    thumbnailColor: '#eab308',
    apply: () => ({
      temperature: 36,
      tint: 6,
      exposure: 6,
      highlights: -18,
      shadows: 16,
      vibrance: 24,
      vignette: 18,
    }),
    lutTint: { r: 35, g: 18, b: -22, strength: 0.4 },
  },
  {
    id: 'moody_forest',
    name: 'Moody Pine',
    category: 'Artistic',
    description: 'Desaturated organic greens, deep shadows, atmospheric damp feel',
    thumbnailColor: '#065f46',
    apply: () => ({
      temperature: -14,
      tint: -10,
      contrast: 18,
      saturation: -18,
      shadows: -20,
      highlights: -8,
      vignette: 30,
    }),
    lutTint: { r: -12, g: 15, b: 6, strength: 0.3 },
  },
  {
    id: 'vintage70s',
    name: 'Vintage 70s',
    category: 'Vintage',
    description: 'Faded warm memories, amber tint, soft contrast, matte vignette',
    thumbnailColor: '#d97706',
    apply: () => ({
      temperature: 24,
      tint: 8,
      contrast: -12,
      brightness: 6,
      shadows: 28,
      saturation: -12,
      vignette: 35,
      grain: 26,
    }),
    lutTint: { r: 28, g: 16, b: -14, strength: 0.35 },
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyber',
    category: 'Artistic',
    description: 'Electric cyan and neon magenta duo-split with punchy exposure',
    thumbnailColor: '#ec4899',
    apply: () => ({
      contrast: 28,
      vibrance: 40,
      temperature: -18,
      tint: 24,
      sharpness: 25,
      vignette: 30,
    }),
    lutTint: { r: 24, g: -12, b: 32, strength: 0.4 },
  },
  {
    id: 'bleach',
    name: 'Bleach Bypass',
    category: 'Cinematic',
    description: 'Desaturated high-silver retention action film look',
    thumbnailColor: '#94a3b8',
    apply: () => ({
      saturation: -45,
      contrast: 38,
      exposure: -6,
      shadows: -15,
      highlights: 15,
      sharpness: 35,
    }),
  },
  {
    id: 'chrome',
    name: 'Modern Chrome',
    category: 'Modern',
    description: 'Ultra-crisp commercial editorial grade with pristine clarity',
    thumbnailColor: '#38bdf8',
    apply: () => ({
      exposure: 4,
      contrast: 18,
      highlights: -15,
      shadows: 8,
      vibrance: 18,
      sharpness: 40,
    }),
  },
  {
    id: 'warm_matte',
    name: 'Warm Matte',
    category: 'Modern',
    description: 'Milk-white highlights, lifted shadow floor, gentle warmth',
    thumbnailColor: '#fbbf24',
    apply: () => ({
      temperature: 15,
      contrast: -14,
      shadows: 34,
      highlights: -18,
      vignette: 15,
    }),
  },
  {
    id: 'sepia',
    name: 'Sepia Heritage',
    category: 'Vintage',
    description: 'Archival 19th-century photographic print with rich toner',
    thumbnailColor: '#b45309',
    apply: () => ({
      saturation: -85,
      temperature: 45,
      tint: 15,
      contrast: 12,
      shadows: 10,
      vignette: 40,
      grain: 28,
    }),
    lutTint: { r: 40, g: 25, b: -10, strength: 0.5 },
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    category: 'Artistic',
    description: 'Soft luminous highlights, creamy midtones, gentle spring palette',
    thumbnailColor: '#f472b6',
    apply: () => ({
      exposure: 12,
      contrast: -15,
      highlights: -24,
      shadows: 26,
      saturation: -10,
      vibrance: 20,
    }),
    lutTint: { r: 12, g: -4, b: 16, strength: 0.2 },
  },
  {
    id: 'cross_process',
    name: 'Cross Process',
    category: 'Artistic',
    description: 'Color positive film developed in chemical negative bath',
    thumbnailColor: '#a855f7',
    apply: () => ({
      temperature: -8,
      tint: 30,
      contrast: 26,
      saturation: 15,
      shadows: -16,
      highlights: 14,
    }),
    lutTint: { r: -15, g: 25, b: -20, strength: 0.35 },
  },
  {
    id: 'faded_film',
    name: 'Faded Film',
    category: 'Vintage',
    description: 'Classic disposable camera nostalgia with soft washed colors',
    thumbnailColor: '#fdba74',
    apply: () => ({
      exposure: 8,
      contrast: -20,
      shadows: 38,
      highlights: -14,
      saturation: -15,
      grain: 24,
      vignette: 20,
    }),
  },
  {
    id: 'infrared',
    name: 'Infrared Aero',
    category: 'Artistic',
    description: 'Surreal Kodak Aerochrome false-color aesthetic',
    thumbnailColor: '#f43f5e',
    apply: () => ({
      temperature: 20,
      tint: 45,
      contrast: 22,
      saturation: 30,
      highlights: 12,
      shadows: -8,
    }),
    lutTint: { r: 50, g: -30, b: 20, strength: 0.45 },
  },
];

/**
 * Fast 3x3 convolution for sharpness filter
 */
function applySharpnessConvolution(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number // 0 to 1
) {
  if (amount <= 0.01) return;
  const s = amount * 0.8;
  const original = new Uint8ClampedArray(pixels);

  for (let y = 1; y < height - 1; y++) {
    const yRow = y * width;
    const yPrev = (y - 1) * width;
    const yNext = (y + 1) * width;

    for (let x = 1; x < width - 1; x++) {
      const idx = (yRow + x) * 4;
      const idxTop = (yPrev + x) * 4;
      const idxBottom = (yNext + x) * 4;
      const idxLeft = (yRow + x - 1) * 4;
      const idxRight = (yRow + x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const center = original[idx + c];
        const top = original[idxTop + c];
        const bottom = original[idxBottom + c];
        const left = original[idxLeft + c];
        const right = original[idxRight + c];

        // Laplacian kernel: center * (1 + 4*s) - (top + bottom + left + right) * s
        const val = center * (1 + 4 * s) - (top + bottom + left + right) * s;
        pixels[idx + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
}

/**
 * Fast box blur for depth-of-field / soft effects
 */
function applyFastBlur(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) {
  if (radius < 1) return;
  const r = Math.min(Math.round(radius), 12);
  const copy = new Uint8ClampedArray(pixels);

  // Horizontal blur pass
  for (let y = 0; y < height; y++) {
    const yRow = y * width;
    for (let x = 0; x < width; x++) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let k = -r; k <= r; k++) {
        const px = x + k;
        if (px >= 0 && px < width) {
          const idx = (yRow + px) * 4;
          rSum += copy[idx];
          gSum += copy[idx + 1];
          bSum += copy[idx + 2];
          count++;
        }
      }
      const outIdx = (yRow + x) * 4;
      pixels[outIdx] = rSum / count;
      pixels[outIdx + 1] = gSum / count;
      pixels[outIdx + 2] = bSum / count;
    }
  }
}

/**
 * Local chroma-key cutout / background removal.
 * Analyzes distance in RGB/Lab color space from the target color.
 */
function applyChromaCutout(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  cutout: CutoutSettings
) {
  if (!cutout.enabled) return;

  // Parse hex target color
  const hex = cutout.targetColor.replace('#', '');
  const targetR = parseInt(hex.substring(0, 2), 16) || 0;
  const targetG = parseInt(hex.substring(2, 4), 16) || 0;
  const targetB = parseInt(hex.substring(4, 6), 16) || 0;

  const maxToleranceDistance = (cutout.tolerance / 100) * 441.67; // sqrt(255^2 * 3) = 441.67
  const featherDist = (cutout.feather / 100) * 100 + 1;

  const totalPixels = width * height;
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];

    // Euclidean color distance with perceptual weights
    const dr = (r - targetR) * 0.3;
    const dg = (g - targetG) * 0.59;
    const db = (b - targetB) * 0.11;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db) * 2.2;

    let matchFactor = 0;
    if (distance < maxToleranceDistance) {
      matchFactor = 1.0;
    } else if (distance < maxToleranceDistance + featherDist) {
      // Smooth feather falloff
      matchFactor = 1.0 - (distance - maxToleranceDistance) / featherDist;
    }

    if (cutout.invert) {
      // Keep background, remove foreground
      pixels[idx + 3] = Math.round(pixels[idx + 3] * matchFactor);
    } else {
      // Remove background color
      pixels[idx + 3] = Math.round(pixels[idx + 3] * (1.0 - matchFactor));
    }
  }
}

/**
 * Main pixel-level pipeline processing function
 */
export function processImageData(
  sourceImageData: ImageData,
  adjustments: AdjustmentSettings,
  curves: CurveSettings,
  filterId: string = 'none',
  filterIntensity: number = 100,
  cutout: CutoutSettings = DEFAULT_CUTOUT
): ImageData {
  const width = sourceImageData.width;
  const height = sourceImageData.height;
  const output = new ImageData(
    new Uint8ClampedArray(sourceImageData.data),
    width,
    height
  );
  const pixels = output.data;

  // Build Tone Curve Look Up Tables
  const masterLUT = buildSplineLUT(curves.master);
  const redLUT = buildSplineLUT(curves.red);
  const greenLUT = buildSplineLUT(curves.green);
  const blueLUT = buildSplineLUT(curves.blue);

  // Find filter preset if any
  const filter = FILTER_PRESETS.find((f) => f.id === filterId);
  const filterAdj = filter && filter.id !== 'none' ? filter.apply(adjustments) : {};
  const filterAlpha = (filterIntensity / 100);

  // Combine adjustments with active filter values
  const brightness = adjustments.brightness + (filterAdj.brightness || 0) * filterAlpha;
  const contrast = adjustments.contrast + (filterAdj.contrast || 0) * filterAlpha;
  const exposure = adjustments.exposure + (filterAdj.exposure || 0) * filterAlpha;
  const saturation = adjustments.saturation + (filterAdj.saturation || 0) * filterAlpha;
  const temperature = adjustments.temperature + (filterAdj.temperature || 0) * filterAlpha;
  const tint = adjustments.tint + (filterAdj.tint || 0) * filterAlpha;
  const highlights = adjustments.highlights + (filterAdj.highlights || 0) * filterAlpha;
  const shadows = adjustments.shadows + (filterAdj.shadows || 0) * filterAlpha;
  const vibrance = adjustments.vibrance + (filterAdj.vibrance || 0) * filterAlpha;
  const sharpness = Math.min(100, adjustments.sharpness + (filterAdj.sharpness || 0) * filterAlpha);
  const blur = adjustments.blur + (filterAdj.blur || 0) * filterAlpha;
  const vignette = Math.min(100, adjustments.vignette + (filterAdj.vignette || 0) * filterAlpha);
  const grain = Math.min(100, adjustments.grain + (filterAdj.grain || 0) * filterAlpha);

  // Precompute factors
  const exposureFactor = Math.pow(2, exposure / 50);
  const contrastFactor = Math.tan(((contrast + 100) * Math.PI) / 400); // smooth contrast slope
  const satFactor = (saturation + 100) / 100;
  const vibFactor = vibrance / 100;

  // Temperature (Warmth: + Red, - Blue) and Tint (+ Magenta, - Green)
  const rTempShift = temperature * 0.45 + tint * 0.2;
  const gTempShift = -tint * 0.35;
  const bTempShift = -temperature * 0.45;

  const lutTint = filter?.lutTint;
  const filterTintR = lutTint ? lutTint.r * lutTint.strength * filterAlpha : 0;
  const filterTintG = lutTint ? lutTint.g * lutTint.strength * filterAlpha : 0;
  const filterTintB = lutTint ? lutTint.b * lutTint.strength * filterAlpha : 0;

  // Precalculate Center for Vignette
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    let r = pixels[idx];
    let g = pixels[idx + 1];
    let b = pixels[idx + 2];
    const a = pixels[idx + 3];

    if (a === 0) continue; // Skip completely transparent pixels

    // 1. Exposure
    if (exposure !== 0) {
      r = Math.min(255, r * exposureFactor);
      g = Math.min(255, g * exposureFactor);
      b = Math.min(255, b * exposureFactor);
    }

    // 2. Brightness
    if (brightness !== 0) {
      r = Math.max(0, Math.min(255, r + brightness * 1.2));
      g = Math.max(0, Math.min(255, g + brightness * 1.2));
      b = Math.max(0, Math.min(255, b + brightness * 1.2));
    }

    // 3. Contrast
    if (contrast !== 0) {
      r = Math.max(0, Math.min(255, (r - 128) * contrastFactor + 128));
      g = Math.max(0, Math.min(255, (g - 128) * contrastFactor + 128));
      b = Math.max(0, Math.min(255, (b - 128) * contrastFactor + 128));
    }

    // 4. Highlights & Shadows
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (highlights !== 0) {
      // Highlight mask: weight higher as luminance approaches 255
      const hlWeight = Math.max(0, (lum - 128) / 127);
      const hlDelta = (highlights / 100) * 45 * hlWeight;
      r = Math.max(0, Math.min(255, r + hlDelta));
      g = Math.max(0, Math.min(255, g + hlDelta));
      b = Math.max(0, Math.min(255, b + hlDelta));
    }

    if (shadows !== 0) {
      // Shadows mask: weight higher as luminance approaches 0
      const shWeight = Math.max(0, (128 - lum) / 128);
      const shDelta = (shadows / 100) * 45 * shWeight;
      r = Math.max(0, Math.min(255, r + shDelta));
      g = Math.max(0, Math.min(255, g + shDelta));
      b = Math.max(0, Math.min(255, b + shDelta));
    }

    // 5. White Balance: Temperature & Tint + Filter Tint
    r = Math.max(0, Math.min(255, r + rTempShift + filterTintR));
    g = Math.max(0, Math.min(255, g + gTempShift + filterTintG));
    b = Math.max(0, Math.min(255, b + bTempShift + filterTintB));

    // 6. Saturation & Vibrance
    if (saturation !== 0 || vibrance !== 0) {
      const currentLum = 0.299 * r + 0.587 * g + 0.114 * b;
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const currentSat = maxC === 0 ? 0 : (maxC - minC) / maxC;

      // Vibrance selectively boosts lower saturated colors without blowing out skin tones
      const vibranceBoost = (1.0 - currentSat) * vibFactor;
      const totalSatFactor = Math.max(0, satFactor + vibranceBoost);

      r = Math.max(0, Math.min(255, currentLum + (r - currentLum) * totalSatFactor));
      g = Math.max(0, Math.min(255, currentLum + (g - currentLum) * totalSatFactor));
      b = Math.max(0, Math.min(255, currentLum + (b - currentLum) * totalSatFactor));
    }

    // 7. RGB Tone Curves
    // First apply Master curve, then individual R, G, B channels
    const masterR = masterLUT[Math.round(r)];
    const masterG = masterLUT[Math.round(g)];
    const masterB = masterLUT[Math.round(b)];

    r = redLUT[masterR];
    g = greenLUT[masterG];
    b = blueLUT[masterB];

    // 8. Vignette (Smooth radial dark/light vignette falloff)
    if (vignette > 0) {
      const px = i % width;
      const py = Math.floor(i / width);
      const distFromCenter = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
      const normDist = distFromCenter / maxDist;
      if (normDist > 0.4) {
        const vigFactor = 1 - ((normDist - 0.4) / 0.6) * (vignette / 100);
        r *= vigFactor;
        g *= vigFactor;
        b *= vigFactor;
      }
    }

    // 9. Film Grain (Photographic analog grain in midtones)
    if (grain > 0) {
      const midtoneFactor = 1 - Math.abs(lum - 128) / 128; // Peaks at 128
      const noise = ((Math.random() - 0.5) * (grain / 100) * 50) * midtoneFactor;
      r = Math.max(0, Math.min(255, r + noise));
      g = Math.max(0, Math.min(255, g + noise));
      b = Math.max(0, Math.min(255, b + noise));
    }

    pixels[idx] = Math.round(r);
    pixels[idx + 1] = Math.round(g);
    pixels[idx + 2] = Math.round(b);
  }

  // 10. Sharpness pass
  if (sharpness > 0) {
    applySharpnessConvolution(pixels, width, height, sharpness / 100);
  }

  // 11. Blur pass
  if (blur > 0) {
    applyFastBlur(pixels, width, height, blur);
  }

  // 12. Local Chroma-Key Cutout
  if (cutout.enabled) {
    applyChromaCutout(pixels, width, height, cutout);
  }

  return output;
}

/**
 * Creates high resolution offline procedural sample images
 * (Landscape, Studio Portrait, Architecture) so user can test instantly with zero latency
 */
export function generateProceduralSamplePhoto(type: 'landscape' | 'portrait' | 'architecture'): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  if (type === 'landscape') {
    canvas.width = 1600;
    canvas.height = 900;

    // Sunset gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 500);
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.3, '#4c1d95');
    skyGrad.addColorStop(0.6, '#b45309');
    skyGrad.addColorStop(0.85, '#f59e0b');
    skyGrad.addColorStop(1, '#fef08a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, 500);

    // Glowing sun
    const sunGrad = ctx.createRadialGradient(800, 420, 20, 800, 420, 160);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#fef08a');
    sunGrad.addColorStop(0.7, '#f59e0b88');
    sunGrad.addColorStop(1, '#f59e0b00');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(800, 420, 160, 0, Math.PI * 2);
    ctx.fill();

    // Mountain silhouettes in background
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(250, 310);
    ctx.lineTo(500, 420);
    ctx.lineTo(800, 240);
    ctx.lineTo(1100, 430);
    ctx.lineTo(1350, 290);
    ctx.lineTo(1600, 490);
    ctx.lineTo(1600, 500);
    ctx.lineTo(0, 500);
    ctx.closePath();
    ctx.fill();

    // Foreground mountain silhouette
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 500);
    ctx.lineTo(180, 390);
    ctx.lineTo(420, 470);
    ctx.lineTo(700, 360);
    ctx.lineTo(1000, 480);
    ctx.lineTo(1280, 380);
    ctx.lineTo(1600, 500);
    ctx.closePath();
    ctx.fill();

    // Calm alpine lake reflection
    const waterGrad = ctx.createLinearGradient(0, 500, 0, 900);
    waterGrad.addColorStop(0, '#f59e0b');
    waterGrad.addColorStop(0.2, '#7c2d12');
    waterGrad.addColorStop(0.5, '#1e1b4b');
    waterGrad.addColorStop(1, '#020617');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 500, canvas.width, 400);

    // Lake reflections & gentle water ripples
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    for (let y = 520; y < 880; y += 12) {
      const w = 400 * Math.sin((y - 500) / 100);
      ctx.fillRect(800 - w / 2, y, w, 3);
    }

    // Foreground pine trees silhouette on right bank
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(1300, 900);
    ctx.lineTo(1350, 600);
    ctx.lineTo(1380, 650);
    ctx.lineTo(1420, 540);
    ctx.lineTo(1460, 620);
    ctx.lineTo(1500, 520);
    ctx.lineTo(1550, 640);
    ctx.lineTo(1600, 580);
    ctx.lineTo(1600, 900);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'portrait') {
    canvas.width = 1200;
    canvas.height = 1600;

    // Dark moody studio backdrop gradient
    const bgGrad = ctx.createRadialGradient(600, 700, 100, 600, 800, 900);
    bgGrad.addColorStop(0, '#2d3748');
    bgGrad.addColorStop(0.5, '#1a202c');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm soft key light rim
    const rimGrad = ctx.createRadialGradient(380, 550, 50, 380, 550, 450);
    rimGrad.addColorStop(0, 'rgba(251, 191, 36, 0.15)');
    rimGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stylized artistic portrait silhouette & facial geometry
    // Torso / shoulders
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(600, 1400, 480, 400, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = '#d97706';
    ctx.fillRect(520, 850, 160, 200);

    // Head base (warm skin base)
    const headGrad = ctx.createLinearGradient(400, 400, 800, 800);
    headGrad.addColorStop(0, '#fde68a');
    headGrad.addColorStop(0.4, '#f59e0b');
    headGrad.addColorStop(0.8, '#d97706');
    headGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(600, 620, 240, 320, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dramatic studio hair silhouette
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(600, 480, 270, Math.PI * 0.85, Math.PI * 2.15);
    ctx.bezierCurveTo(900, 750, 850, 950, 820, 1050);
    ctx.bezierCurveTo(750, 950, 750, 850, 750, 750);
    ctx.lineTo(450, 750);
    ctx.bezierCurveTo(450, 850, 450, 950, 380, 1050);
    ctx.bezierCurveTo(350, 950, 300, 750, 600, 480);
    ctx.fill();

    // Expressive stylized eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(500, 600, 35, 18, -0.1, 0, Math.PI * 2);
    ctx.ellipse(700, 600, 35, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Catchlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(505, 597, 6, 0, Math.PI * 2);
    ctx.arc(705, 597, 6, 0, Math.PI * 2);
    ctx.fill();

    // Lips
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.ellipse(600, 770, 50, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Architecture
    canvas.width = 1600;
    canvas.height = 1200;

    // Clear bright architectural blue sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1200);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.6, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Concrete brutalist building facade with geometric shadow
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(300, 1200);
    ctx.lineTo(300, 200);
    ctx.lineTo(1300, 100);
    ctx.lineTo(1300, 1200);
    ctx.closePath();
    ctx.fill();

    // Diagonal solar shadow across concrete
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.beginPath();
    ctx.moveTo(300, 500);
    ctx.lineTo(1300, 100);
    ctx.lineTo(1300, 900);
    ctx.lineTo(300, 1200);
    ctx.closePath();
    ctx.fill();

    // Architectural window glass modules
    ctx.fillStyle = '#0369a1';
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const wx = 420 + col * 160;
        const wy = 280 + row * 140;
        ctx.fillRect(wx, wy, 110, 85);
        // Window frame
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(wx, wy, 110, 85);
      }
    }
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
