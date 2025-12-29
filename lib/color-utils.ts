// Color utility functions for palette generation and color manipulation

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error("Invalid hex color");
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
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
 * Convert HSL to RGB
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
      if (t > 1) t -= 1;
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

export type ColorScheme =
  | "dichromatic"
  | "complementary"
  | "split-complementary"
  | "triadic"
  | "tetradic"
  | "analogous"
  | "monochromatic";

/**
 * Generate a color palette from a starting color using color theory schemes
 */
export function generatePalette(
  startColor: string,
  scheme: ColorScheme = "triadic",
  count: number = 5
): string[] {
  const rgb = hexToRgb(startColor);
  const hsl = rgbToHsl(rgb);

  const palette: string[] = [startColor];

  let hueOffsets: number[] = [];

  switch (scheme) {
    case "dichromatic":
      // Two colors - just the base color
      if (count > 1) {
        hueOffsets = [180]; // Complementary
      }
      break;

    case "complementary":
      // Two colors opposite on the color wheel
      hueOffsets = [180];
      break;

    case "split-complementary":
      // Base color + two colors adjacent to its complement
      hueOffsets = [150, 210];
      break;

    case "triadic":
      // Three colors evenly spaced (120 degrees apart)
      hueOffsets = [120, 240];
      break;

    case "tetradic":
      // Four colors forming a rectangle on the color wheel
      hueOffsets = [90, 180, 270];
      break;

    case "analogous":
      // Colors adjacent on the color wheel
      hueOffsets = Array.from({ length: count - 1 }, (_, i) => (i + 1) * 30);
      break;

    case "monochromatic":
      // Variations of the same hue with different saturation/lightness
      hueOffsets = [];
      break;

    default:
      // Default to triadic
      hueOffsets = [120, 240];
  }

  // Generate colors based on scheme
  if (scheme === "monochromatic") {
    // For monochromatic, vary saturation and lightness
    const step = count > 1 ? 1 / (count - 1) : 1;
    for (let i = 1; i < count; i++) {
      const progress = i * step;
      const newHsl: HSL = {
        h: hsl.h,
        s: Math.max(20, Math.min(100, hsl.s * (0.5 + progress * 0.5))),
        l: Math.max(10, Math.min(90, 20 + progress * 70)),
      };
      const newRgb = hslToRgb(newHsl);
      palette.push(rgbToHex(newRgb));
    }
  } else {
    // For other schemes, use hue offsets
    const colorsToGenerate = Math.min(count - 1, hueOffsets.length);
    for (let i = 0; i < colorsToGenerate; i++) {
      const newHue = (hsl.h + hueOffsets[i]) % 360;
      const newHsl: HSL = {
        h: newHue,
        s: Math.max(30, Math.min(100, hsl.s)),
        l: Math.max(20, Math.min(80, hsl.l)),
      };
      const newRgb = hslToRgb(newHsl);
      palette.push(rgbToHex(newRgb));
    }

    // If we need more colors, fill with variations
    while (palette.length < count) {
      const lastColor = palette[palette.length - 1];
      const lastRgb = hexToRgb(lastColor);
      const lastHsl = rgbToHsl(lastRgb);
      const newHsl: HSL = {
        h: (lastHsl.h + 30) % 360,
        s: Math.max(30, Math.min(100, lastHsl.s)),
        l: Math.max(20, Math.min(80, lastHsl.l)),
      };
      const newRgb = hslToRgb(newHsl);
      palette.push(rgbToHex(newRgb));
    }
  }

  return palette.slice(0, count);
}

/**
 * Generate value gradient (lightness variation) - clamped to starting color range
 */
export function generateValueGradient(
  color: string,
  steps: number = 5
): string[] {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);

  const gradient: string[] = [];

  // Clamp lightness range based on starting color (avoid pure black/white)
  // Use 30% range centered around the starting lightness
  const range = 30; // 30% range
  const minL = Math.max(5, hsl.l - range / 2);
  const maxL = Math.min(95, hsl.l + range / 2);
  const lightnessStep = (maxL - minL) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const newL = minL + lightnessStep * i;
    const newHsl: HSL = {
      h: hsl.h,
      s: hsl.s,
      l: Math.max(5, Math.min(95, newL)),
    };
    const newRgb = hslToRgb(newHsl);
    gradient.push(rgbToHex(newRgb));
  }

  return gradient;
}

/**
 * Generate saturation gradient - clamped to starting color range
 */
export function generateSaturationGradient(
  color: string,
  steps: number = 5
): string[] {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);

  const gradient: string[] = [];

  // Clamp saturation range based on starting color
  // Use 50% range centered around the starting saturation
  const range = 50; // 50% range
  const minS = Math.max(10, hsl.s - range / 2);
  const maxS = Math.min(100, hsl.s + range / 2);
  const saturationStep = (maxS - minS) / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const newS = minS + saturationStep * i;
    const newHsl: HSL = {
      h: hsl.h,
      s: Math.max(10, Math.min(100, newS)),
      l: hsl.l,
    };
    const newRgb = hslToRgb(newHsl);
    gradient.push(rgbToHex(newRgb));
  }

  return gradient;
}

/**
 * Generate combined value and saturation gradient - clamped to starting color range
 */
export function generateCombinedGradient(
  color: string,
  steps: number = 5
): string[] {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);

  const gradient: string[] = [];
  const step = steps - 1;

  // Clamp ranges based on starting color
  const lightnessRange = 30;
  const saturationRange = 50;
  const minL = Math.max(5, hsl.l - lightnessRange / 2);
  const maxL = Math.min(95, hsl.l + lightnessRange / 2);
  const minS = Math.max(10, hsl.s - saturationRange / 2);
  const maxS = Math.min(100, hsl.s + saturationRange / 2);

  for (let i = 0; i < steps; i++) {
    const progress = i / step;

    const newL = minL + progress * (maxL - minL);
    const newS = minS + progress * (maxS - minS);

    const newHsl: HSL = {
      h: hsl.h,
      s: Math.max(10, Math.min(100, newS)),
      l: Math.max(5, Math.min(95, newL)),
    };
    const newRgb = hslToRgb(newHsl);
    gradient.push(rgbToHex(newRgb));
  }

  return gradient;
}

/**
 * Get color at a specific position in a smooth gradient (0-1) - clamped to starting color range
 */
export function getSmoothGradientColor(
  color: string,
  position: number,
  gradientType: "value" | "saturation" | "both"
): string {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);

  let newHsl: HSL;

  switch (gradientType) {
    case "value": {
      // Clamp lightness range based on starting color
      const range = 30;
      const minL = Math.max(5, hsl.l - range / 2);
      const maxL = Math.min(95, hsl.l + range / 2);
      newHsl = {
        h: hsl.h,
        s: hsl.s,
        l: minL + position * (maxL - minL),
      };
      break;
    }
    case "saturation": {
      // Clamp saturation range based on starting color
      const range = 50;
      const minS = Math.max(10, hsl.s - range / 2);
      const maxS = Math.min(100, hsl.s + range / 2);
      newHsl = {
        h: hsl.h,
        s: minS + position * (maxS - minS),
        l: hsl.l,
      };
      break;
    }
    case "both": {
      // Clamp both ranges
      const lightnessRange = 30;
      const saturationRange = 50;
      const minL = Math.max(5, hsl.l - lightnessRange / 2);
      const maxL = Math.min(95, hsl.l + lightnessRange / 2);
      const minS = Math.max(10, hsl.s - saturationRange / 2);
      const maxS = Math.min(100, hsl.s + saturationRange / 2);
      newHsl = {
        h: hsl.h,
        s: minS + position * (maxS - minS),
        l: minL + position * (maxL - minL),
      };
      break;
    }
  }

  const newRgb = hslToRgb(newHsl);
  return rgbToHex(newRgb);
}
