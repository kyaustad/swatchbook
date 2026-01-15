// Color utility functions for palette generation and color manipulation using OKLCH color space

import { formatHex, oklch, parse, formatRgb } from "culori";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface OKLCH {
  l: number; // Lightness 0-1
  c: number; // Chroma (saturation) 0-0.4+
  h: number; // Hue 0-360 (can be undefined for grays)
}

/**
 * Convert hex color to OKLCH
 */
export function hexToOklch(hex: string): OKLCH {
  const color = parse(hex);
  if (!color) {
    throw new Error("Invalid hex color");
  }
  const oklchColor = oklch(color);
  if (!oklchColor) {
    throw new Error("Failed to convert color to OKLCH");
  }
  return {
    l: oklchColor.l ?? 0,
    c: oklchColor.c ?? 0,
    h: oklchColor.h ?? 0,
  };
}

/**
 * Convert OKLCH to hex
 */
export function oklchToHex(oklchColor: OKLCH): string {
  const color = oklch({
    mode: "oklch",
    l: oklchColor.l,
    c: oklchColor.c,
    h: oklchColor.h,
  });
  return formatHex(color) ?? "#000000";
}

/**
 * Convert hex color to RGB (legacy support)
 */
export function hexToRgb(hex: string): RGB {
  const color = parse(hex);
  if (!color) {
    throw new Error("Invalid hex color");
  }
  const rgb = formatRgb(color);
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    throw new Error("Failed to convert color to RGB");
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

/**
 * Convert RGB to hex (legacy support)
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export type ColorScheme =
  | "dichromatic"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "tetradic"
  | "analogous"
  | "monochromatic";

/**
 * Get the maximum chroma for a given lightness and hue in OKLCH
 * This ensures we generate colors within the sRGB gamut
 */
function getMaxChroma(l: number, h: number | undefined): number {
  // Approximate max chroma based on lightness
  // Lower lightness values have lower max chroma
  if (h === undefined || h === null) return 0;

  // This is a simplified approximation - culori handles gamut mapping
  // but we'll use reasonable limits
  if (l < 0.2 || l > 0.95) {
    return 0.1;
  }
  if (l < 0.4 || l > 0.8) {
    return 0.25;
  }
  return 0.3;
}

/**
 * Generate a color palette from a starting color using color theory schemes
 * All operations now use OKLCH for perceptually uniform color generation
 */
export function generatePalette(
  startColor: string,
  scheme: ColorScheme = "triadic",
  count: number = 5
): string[] {
  const oklchColor = hexToOklch(startColor);
  const palette: string[] = [startColor];

  let hueOffsets: number[] = [];

  switch (scheme) {
    case "dichromatic":
      // Two colors - complementary pair
      if (count > 1) {
        hueOffsets = [180];
      }
      break;

    case "complementary":
      // Two colors opposite on the color wheel
      hueOffsets = [180];
      break;

    case "split-complementary":
      // Base color + two colors adjacent to its complement (30° from complement)
      hueOffsets = [150, 210];
      break;

    case "triadic":
      // Three colors evenly spaced (120 degrees apart)
      if (count >= 3) {
        hueOffsets = [120, 240];
      } else if (count === 2) {
        hueOffsets = [120];
      }
      break;

    case "tetradic":
      // Four colors forming a rectangle on the color wheel (90° apart)
      if (count >= 4) {
        hueOffsets = [90, 180, 270];
      } else if (count === 3) {
        hueOffsets = [90, 180];
      } else if (count === 2) {
        hueOffsets = [90];
      }
      break;

    case "analogous":
      // Colors adjacent on the color wheel (typically 30° apart)
      // Generate evenly spaced colors around the base color
      if (count > 1) {
        const startOffset = -Math.floor((count - 1) / 2) * 30;
        hueOffsets = Array.from(
          { length: count - 1 },
          (_, i) => startOffset + i * 30
        );
      }
      break;

    case "monochromatic":
      // Variations of the same hue with different lightness/chroma
      hueOffsets = [];
      break;

    default:
      // Default to triadic
      if (count >= 3) {
        hueOffsets = [120, 240];
      } else if (count === 2) {
        hueOffsets = [120];
      }
  }

  // Generate colors based on scheme
  if (scheme === "monochromatic") {
    // For monochromatic, vary lightness and chroma while keeping hue constant
    if (count > 1) {
      const step = 1 / (count - 1);
      const baseL = oklchColor.l;
      const baseC = oklchColor.c;
      const baseH = oklchColor.h;

      // Use a range that keeps colors visible and distinct
      const lightnessRange = Math.min(0.7, Math.max(0.3, 1 - baseL * 2));
      const minL = Math.max(0.15, baseL - lightnessRange / 2);
      const maxL = Math.min(0.95, baseL + lightnessRange / 2);

      const minC = Math.max(0, baseC * 0.3);
      const maxC = Math.min(getMaxChroma(baseL, baseH), baseC * 1.5);
      const chromaRange = maxC - minC;

      for (let i = 1; i < count; i++) {
        const progress = i * step;
        // Use a curve for more natural progression
        const t = progress; // Linear for now, could use easeInOut

        const newL = minL + t * (maxL - minL);
        const newC = minC + (1 - Math.abs(progress - 0.5) * 2) * chromaRange;

        const newOklch: OKLCH = {
          l: newL,
          c: Math.max(0, Math.min(getMaxChroma(newL, baseH), newC)),
          h: baseH,
        };
        palette.push(oklchToHex(newOklch));
      }
    }
  } else {
    // For other schemes, use hue offsets
    const baseL = oklchColor.l;
    const baseC = oklchColor.c;
    const baseH = oklchColor.h ?? 0;

    // Generate colors with hue offsets
    for (let i = 0; i < hueOffsets.length && palette.length < count; i++) {
      const newH = (baseH + hueOffsets[i] + 360) % 360;
      const maxC = getMaxChroma(baseL, newH);

      const newOklch: OKLCH = {
        l: baseL,
        c: Math.min(maxC, baseC),
        h: newH,
      };
      palette.push(oklchToHex(newOklch));
    }

    // If we need more colors than the scheme provides, generate intermediate colors
    while (palette.length < count) {
      const lastColor = hexToOklch(palette[palette.length - 1]);
      const firstColor = hexToOklch(palette[0]);

      // Interpolate between first and last, or add variations
      const newH =
        lastColor.h !== undefined
          ? (lastColor.h + 30) % 360
          : firstColor.h !== undefined
          ? (firstColor.h + 30) % 360
          : 0;

      const newOklch: OKLCH = {
        l: Math.max(0.2, Math.min(0.9, lastColor.l)),
        c: Math.min(getMaxChroma(lastColor.l, newH), lastColor.c),
        h: newH,
      };
      palette.push(oklchToHex(newOklch));
    }
  }

  return palette.slice(0, count);
}

/**
 * Generate value gradient (lightness variation) using OKLCH
 * Uses perceptually uniform lightness interpolation
 */
export function generateValueGradient(
  color: string,
  steps: number = 5
): string[] {
  const oklchColor = hexToOklch(color);
  const gradient: string[] = [];

  const baseL = oklchColor.l;
  const baseC = oklchColor.c;
  const baseH = oklchColor.h;

  // Use a perceptually uniform range
  // OKLCH lightness is already perceptually uniform, so linear interpolation works well
  const lightnessRange = 0.6; // Use a wider range for better gradients
  const minL = Math.max(0.1, baseL - lightnessRange / 2);
  const maxL = Math.min(0.98, baseL + lightnessRange / 2);

  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    const newL = minL + progress * (maxL - minL);

    // Reduce chroma at extreme lightness values for more realistic colors
    const chromaMultiplier = 1 - Math.abs(progress - 0.5) * 0.4;
    const maxC = getMaxChroma(newL, baseH);
    const newC = Math.min(maxC, baseC * chromaMultiplier);

    const newOklch: OKLCH = {
      l: newL,
      c: newC,
      h: baseH,
    };
    gradient.push(oklchToHex(newOklch));
  }

  return gradient;
}

/**
 * Generate saturation (chroma) gradient using OKLCH
 * Uses perceptually uniform chroma interpolation
 */
export function generateSaturationGradient(
  color: string,
  steps: number = 5
): string[] {
  const oklchColor = hexToOklch(color);
  const gradient: string[] = [];

  const baseL = oklchColor.l;
  const baseC = oklchColor.c;
  const baseH = oklchColor.h;

  // Vary chroma from low to high
  const maxC = getMaxChroma(baseL, baseH);
  const minC = Math.max(0, baseC * 0.1); // Don't go completely desaturated
  const chromaRange = Math.max(0.15, maxC - minC);

  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);
    const newC = Math.min(maxC, minC + progress * chromaRange);

    const newOklch: OKLCH = {
      l: baseL,
      c: newC,
      h: baseH,
    };
    gradient.push(oklchToHex(newOklch));
  }

  return gradient;
}

/**
 * Generate combined value and saturation gradient using OKLCH
 * Interpolates both lightness and chroma for rich gradients
 */
export function generateCombinedGradient(
  color: string,
  steps: number = 5
): string[] {
  const oklchColor = hexToOklch(color);
  const gradient: string[] = [];

  const baseL = oklchColor.l;
  const baseC = oklchColor.c;
  const baseH = oklchColor.h;

  // Ranges for combined gradient
  const lightnessRange = 0.5;
  const minL = Math.max(0.15, baseL - lightnessRange / 2);
  const maxL = Math.min(0.95, baseL + lightnessRange / 2);

  const maxC = getMaxChroma(baseL, baseH);
  const minC = Math.max(0, baseC * 0.2);
  const chromaRange = Math.max(0.1, maxC - minC);

  for (let i = 0; i < steps; i++) {
    const progress = i / (steps - 1);

    const newL = minL + progress * (maxL - minL);
    // Vary chroma along with lightness - more chroma in middle range
    const chromaProgress = progress;
    const currentMaxC = getMaxChroma(newL, baseH);
    const newC = Math.min(currentMaxC, minC + chromaProgress * chromaRange);

    const newOklch: OKLCH = {
      l: newL,
      c: newC,
      h: baseH,
    };
    gradient.push(oklchToHex(newOklch));
  }

  return gradient;
}

/**
 * Get color at a specific position in a smooth gradient (0-1) using OKLCH
 * This is used for high-resolution smooth gradients to prevent banding
 */
export function getSmoothGradientColor(
  color: string,
  position: number,
  gradientType: "value" | "saturation" | "both"
): string {
  const oklchColor = hexToOklch(color);
  const baseL = oklchColor.l;
  const baseC = oklchColor.c;
  const baseH = oklchColor.h;

  let newOklch: OKLCH;

  switch (gradientType) {
    case "value": {
      const lightnessRange = 0.6;
      const minL = Math.max(0.1, baseL - lightnessRange / 2);
      const maxL = Math.min(0.98, baseL + lightnessRange / 2);
      const newL = minL + position * (maxL - minL);

      const chromaMultiplier = 1 - Math.abs(position - 0.5) * 0.4;
      const maxC = getMaxChroma(newL, baseH);
      const newC = Math.min(maxC, baseC * chromaMultiplier);

      newOklch = {
        l: newL,
        c: newC,
        h: baseH,
      };
      break;
    }
    case "saturation": {
      const maxC = getMaxChroma(baseL, baseH);
      const minC = Math.max(0, baseC * 0.1);
      const chromaRange = Math.max(0.15, maxC - minC);
      const newC = Math.min(maxC, minC + position * chromaRange);

      newOklch = {
        l: baseL,
        c: newC,
        h: baseH,
      };
      break;
    }
    case "both": {
      const lightnessRange = 0.5;
      const minL = Math.max(0.15, baseL - lightnessRange / 2);
      const maxL = Math.min(0.95, baseL + lightnessRange / 2);
      const newL = minL + position * (maxL - minL);

      const maxC = getMaxChroma(newL, baseH);
      const minC = Math.max(0, baseC * 0.2);
      const chromaRange = Math.max(0.1, maxC - minC);
      const currentMaxC = getMaxChroma(newL, baseH);
      const newC = Math.min(currentMaxC, minC + position * chromaRange);

      newOklch = {
        l: newL,
        c: newC,
        h: baseH,
      };
      break;
    }
  }

  return oklchToHex(newOklch);
}

// Legacy HSL functions kept for backward compatibility but not recommended
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert RGB to HSL (legacy - use OKLCH instead)
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

/**
 * Convert HSL to RGB (legacy - use OKLCH instead)
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t += 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}
