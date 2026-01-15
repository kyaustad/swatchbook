"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Plus,
  X,
  RotateCcw,
  RotateCw,
  Home,
  ArrowLeft,
  LandPlot,
  PencilLine,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  generatePalette,
  generateValueGradient,
  generateSaturationGradient,
  generateCombinedGradient,
  getSmoothGradientColor,
  hexToOklch,
  oklchToHex,
  type ColorScheme,
} from "@/lib/color-utils";
import { useRouter } from "next/navigation";

type GradientType = "value" | "saturation" | "both";
type GradientStyle = "steps" | "smooth" | "both";
type GradientDirection =
  | "horizontal"
  | "vertical"
  | "diagonal-tl-br"
  | "diagonal-tr-bl";

export default function SwatchesPage() {
  const [startColor, setStartColor] = useState("#3b82f6");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("triadic");
  const [paletteCount, setPaletteCount] = useState(5);
  const [paletteCountInput, setPaletteCountInput] = useState("5");
  const [customPalette, setCustomPalette] = useState<string[]>([]);
  const [gradientType, setGradientType] = useState<GradientType>("value");
  const [gradientStyle, setGradientStyle] = useState<GradientStyle>("smooth");
  const [gradientSteps, setGradientSteps] = useState(5);
  const [gradientDirection, setGradientDirection] =
    useState<GradientDirection>("horizontal");
  const [exportScale, setExportScale] = useState(2); // 1x, 2x, 4x, 8x, etc.
  const [margin, setMargin] = useState(10); // Margin/padding between swatches and edges
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const router = useRouter();

  // Generate base palette when start color or scheme changes
  const basePalette = useMemo(() => {
    return generatePalette(startColor, colorScheme, paletteCount);
  }, [startColor, colorScheme, paletteCount]);

  // Sync paletteCountInput when paletteCount changes externally
  useEffect(() => {
    setPaletteCountInput(paletteCount.toString());
  }, [paletteCount]);

  // Use custom palette if it exists, otherwise use base palette
  const palette = customPalette.length > 0 ? customPalette : basePalette;

  // Calculate export dimensions
  const exportDimensions = useMemo(() => {
    const baseSquareSize = 200;
    const padding = margin * exportScale;
    const squareSize = baseSquareSize * exportScale;
    const totalColors = palette.length;

    // If "both" style, each color gets 2 squares (smooth + steps)
    const squaresPerColor = gradientStyle === "both" ? 2 : 1;
    const totalSquares = totalColors * squaresPerColor;

    // Calculate grid dimensions to make it as square as possible
    const cols = Math.ceil(Math.sqrt(totalSquares));
    const rows = Math.ceil(totalSquares / cols);

    const width = cols * (squareSize + padding) + padding;
    const height = rows * (squareSize + padding) + padding;

    return { width, height };
  }, [palette.length, gradientStyle, exportScale, margin]);

  // Reset to base palette
  const resetToBasePalette = () => {
    setCustomPalette([]);
  };

  // Rotate gradient direction
  const rotateGradientDirection = () => {
    const directions: GradientDirection[] = [
      "horizontal",
      "vertical",
      "diagonal-tl-br",
      "diagonal-tr-bl",
    ];
    const currentIndex = directions.indexOf(gradientDirection);
    const nextIndex = (currentIndex + 1) % directions.length;
    setGradientDirection(directions[nextIndex]);
  };

  // Get gradient coordinates based on direction
  const getGradientCoordinates = useCallback(
    (x: number, y: number, size: number, direction: GradientDirection) => {
      switch (direction) {
        case "horizontal":
          return { x1: x, y1: y, x2: x + size, y2: y };
        case "vertical":
          return { x1: x, y1: y, x2: x, y2: y + size };
        case "diagonal-tl-br":
          return { x1: x, y1: y, x2: x + size, y2: y + size };
        case "diagonal-tr-bl":
          return { x1: x + size, y1: y, x2: x, y2: y + size };
      }
    },
    []
  );

  // Generate texture on a canvas (can be preview or export canvas)
  const drawTextureOnCanvas = useCallback(
    (canvas: HTMLCanvasElement, scale: number = 1) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const baseSquareSize = 200;
      const padding = margin * scale;
      const squareSize = baseSquareSize * scale;
      const totalColors = palette.length;

      // If "both" style, each color gets 2 squares (smooth + steps)
      const squaresPerColor = gradientStyle === "both" ? 2 : 1;
      const totalSquares = totalColors * squaresPerColor;

      // Calculate grid dimensions to make it as square as possible
      const cols = Math.ceil(Math.sqrt(totalSquares));
      const rows = Math.ceil(totalSquares / cols);

      const canvasWidth = cols * (squareSize + padding) + padding;
      const canvasHeight = rows * (squareSize + padding) + padding;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Clear canvas
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw gradient squares for each color in palette
      palette.forEach((color, colorIndex) => {
        if (gradientStyle === "both") {
          // Draw both smooth and step gradients side by side
          const squareIndex = colorIndex * 2;
          const col = squareIndex % cols;
          const row = Math.floor(squareIndex / cols);

          // Draw smooth gradient
          const smoothX = padding + col * (squareSize + padding);
          const smoothY = padding + row * (squareSize + padding);
          const smoothCoords = getGradientCoordinates(
            smoothX,
            smoothY,
            squareSize,
            gradientDirection
          );
          const smoothGradient = ctx.createLinearGradient(
            smoothCoords.x1,
            smoothCoords.y1,
            smoothCoords.x2,
            smoothCoords.y2
          );

          // Use more stops for smoother gradients in OKLCH (prevents banding)
          const numStops = 150;
          for (let i = 0; i <= numStops; i++) {
            const position = i / numStops;
            const gradColor = getSmoothGradientColor(
              color,
              position,
              gradientType
            );
            smoothGradient.addColorStop(position, gradColor);
          }

          ctx.fillStyle = smoothGradient;
          ctx.fillRect(smoothX, smoothY, squareSize, squareSize);

          // Draw step-based gradient
          const stepCol = (squareIndex + 1) % cols;
          const stepRow = Math.floor((squareIndex + 1) / cols);
          const stepX = padding + stepCol * (squareSize + padding);
          const stepY = padding + stepRow * (squareSize + padding);

          let gradientColors: string[] = [];
          switch (gradientType) {
            case "value":
              gradientColors = generateValueGradient(color, gradientSteps);
              break;
            case "saturation":
              gradientColors = generateSaturationGradient(color, gradientSteps);
              break;
            case "both":
              gradientColors = generateCombinedGradient(color, gradientSteps);
              break;
          }

          // Draw step-based gradient based on direction
          if (gradientDirection === "horizontal") {
            const gradientStepSize = squareSize / gradientSteps;
            gradientColors.forEach((gradColor, gradIndex) => {
              ctx.fillStyle = gradColor;
              ctx.fillRect(
                stepX + gradIndex * gradientStepSize,
                stepY,
                gradientStepSize,
                squareSize
              );
            });
          } else if (gradientDirection === "vertical") {
            const gradientStepSize = squareSize / gradientSteps;
            gradientColors.forEach((gradColor, gradIndex) => {
              ctx.fillStyle = gradColor;
              ctx.fillRect(
                stepX,
                stepY + gradIndex * gradientStepSize,
                squareSize,
                gradientStepSize
              );
            });
          } else {
            // For diagonal, draw as horizontal steps (diagonal smooth gradients are handled separately)
            const gradientStepSize = squareSize / gradientSteps;
            gradientColors.forEach((gradColor, gradIndex) => {
              ctx.fillStyle = gradColor;
              ctx.fillRect(
                stepX + gradIndex * gradientStepSize,
                stepY,
                gradientStepSize,
                squareSize
              );
            });
          }
        } else {
          // Draw single gradient (smooth or steps)
          const col = colorIndex % cols;
          const row = Math.floor(colorIndex / cols);

          const x = padding + col * (squareSize + padding);
          const y = padding + row * (squareSize + padding);

          if (gradientStyle === "smooth") {
            // Draw smooth gradient
            const coords = getGradientCoordinates(
              x,
              y,
              squareSize,
              gradientDirection
            );
            const gradient = ctx.createLinearGradient(
              coords.x1,
              coords.y1,
              coords.x2,
              coords.y2
            );

            // Create gradient stops - use many stops for smooth gradients in OKLCH
            const numStops = 100; // High resolution for smooth gradient (prevents banding)
            for (let i = 0; i <= numStops; i++) {
              const position = i / numStops;
              const gradColor = getSmoothGradientColor(
                color,
                position,
                gradientType
              );
              gradient.addColorStop(position, gradColor);
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, squareSize, squareSize);
          } else {
            // Draw step-based gradient
            let gradientColors: string[] = [];

            switch (gradientType) {
              case "value":
                gradientColors = generateValueGradient(color, gradientSteps);
                break;
              case "saturation":
                gradientColors = generateSaturationGradient(
                  color,
                  gradientSteps
                );
                break;
              case "both":
                gradientColors = generateCombinedGradient(color, gradientSteps);
                break;
            }

            // Draw step-based gradient based on direction
            if (gradientDirection === "horizontal") {
              const gradientStepSize = squareSize / gradientSteps;
              gradientColors.forEach((gradColor, gradIndex) => {
                ctx.fillStyle = gradColor;
                ctx.fillRect(
                  x + gradIndex * gradientStepSize,
                  y,
                  gradientStepSize,
                  squareSize
                );
              });
            } else if (gradientDirection === "vertical") {
              const gradientStepSize = squareSize / gradientSteps;
              gradientColors.forEach((gradColor, gradIndex) => {
                ctx.fillStyle = gradColor;
                ctx.fillRect(
                  x,
                  y + gradIndex * gradientStepSize,
                  squareSize,
                  gradientStepSize
                );
              });
            } else {
              // For diagonal, draw as horizontal steps (diagonal smooth gradients are handled separately)
              const gradientStepSize = squareSize / gradientSteps;
              gradientColors.forEach((gradColor, gradIndex) => {
                ctx.fillStyle = gradColor;
                ctx.fillRect(
                  x + gradIndex * gradientStepSize,
                  y,
                  gradientStepSize,
                  squareSize
                );
              });
            }
          }
        }
      });
    },
    [
      palette,
      gradientType,
      gradientStyle,
      gradientSteps,
      gradientDirection,
      getGradientCoordinates,
      margin,
    ]
  );

  // Generate texture for preview (1x scale)
  const generateTexture = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawTextureOnCanvas(canvas, 1);
  }, [drawTextureOnCanvas]);

  // Generate texture when palette or settings change (preview at 1x)
  useEffect(() => {
    if (palette.length > 0 && canvasRef.current) {
      generateTexture();
    }
  }, [
    palette,
    gradientType,
    gradientStyle,
    gradientSteps,
    gradientDirection,
    margin,
    generateTexture,
  ]);

  const downloadTexture = () => {
    // Create a temporary canvas for high-resolution export
    const tempCanvas = document.createElement("canvas");

    // Generate texture at export scale on temporary canvas
    drawTextureOnCanvas(tempCanvas, exportScale);

    // Download the high-res canvas
    tempCanvas.toBlob(
      (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const dimensions = `${tempCanvas.width}x${tempCanvas.height}`;
        link.download = `swatch-texture-${startColor.slice(
          1
        )}-${exportScale}x-${dimensions}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      "image/png",
      1.0
    );
  };

  const addColorToPalette = () => {
    // Add a new color based on the last color in palette
    const lastColor = palette[palette.length - 1] || startColor;
    const newPalette = [
      ...(customPalette.length > 0 ? customPalette : basePalette),
    ];

    // Generate a slight variation using OKLCH
    const oklchColor = hexToOklch(lastColor);
    const baseH = oklchColor.h ?? 0;
    const newOklch = {
      l: Math.max(0.2, Math.min(0.9, oklchColor.l)),
      c: Math.max(0, Math.min(0.3, oklchColor.c)),
      h: (baseH + 30) % 360,
    };
    const newColor = oklchToHex(newOklch);

    newPalette.push(newColor);
    setCustomPalette(newPalette);
  };

  const removeColorFromPalette = (index: number) => {
    const newPalette = [...palette];
    newPalette.splice(index, 1);
    setCustomPalette(newPalette);
  };

  const updateColorInPalette = (index: number, newColor: string) => {
    const newPalette = [...palette];
    newPalette[index] = newColor;
    setCustomPalette(newPalette);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Fixed top left home button*/}
      <Button
        variant="home"
        size="lg"
        onClick={() => router.push("/")}
        className="rounded-full"
      >
        <ArrowLeft className="size-6 text-foreground" />
        <Home className="size-6 text-foreground" />
      </Button>
      <div>
        <h1 className="text-3xl font-bold mb-2">Color Swatches</h1>
        <p className="text-muted-foreground">
          Create color palettes and generate downloadable texture gradients for
          your projects
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Color Selection & Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Color Selection</CardTitle>
            <CardDescription>
              Choose a starting color and color scheme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <LandPlot className="size-6" />
                <Label htmlFor="color-picker">Starting Color</Label>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Input
                    id="color-picker"
                    type="color"
                    value={startColor}
                    onChange={(e) => setStartColor(e.target.value)}
                    className="h-12 w-24 cursor-pointer"
                  />
                </div>
                <Input
                  type="text"
                  value={startColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setStartColor(e.target.value);
                    }
                  }}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-scheme">Color Scheme</Label>
              <Select
                value={colorScheme}
                onValueChange={(value) => setColorScheme(value as ColorScheme)}
              >
                <SelectTrigger id="color-scheme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dichromatic">Dichromatic</SelectItem>
                  <SelectItem value="complementary">Complementary</SelectItem>
                  <SelectItem value="split-complementary">
                    Split Complementary
                  </SelectItem>
                  <SelectItem value="triadic">Triadic</SelectItem>
                  <SelectItem value="tetradic">Tetradic</SelectItem>
                  <SelectItem value="analogous">Analogous</SelectItem>
                  <SelectItem value="monochromatic">Monochromatic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="palette-count">Number of Colors</Label>
              <Input
                id="palette-count"
                type="number"
                min="2"
                max="20"
                value={paletteCountInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string or any input while typing
                  setPaletteCountInput(value);
                  const numValue = parseInt(value, 10);
                  // Update paletteCount if we have a valid number
                  if (!isNaN(numValue) && numValue >= 2 && numValue <= 20) {
                    setPaletteCount(numValue);
                  }
                }}
                onBlur={(e) => {
                  // Clamp to valid range when input loses focus
                  const value = e.target.value;
                  const numValue = parseInt(value, 10);
                  if (value === "" || isNaN(numValue) || numValue < 2) {
                    setPaletteCount(5);
                    setPaletteCountInput("5");
                  } else if (numValue > 20) {
                    setPaletteCount(20);
                    setPaletteCountInput("20");
                  } else {
                    setPaletteCount(numValue);
                    setPaletteCountInput(numValue.toString());
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradient-type">Gradient Type</Label>
              <Select
                value={gradientType}
                onValueChange={(value) =>
                  setGradientType(value as GradientType)
                }
              >
                <SelectTrigger id="gradient-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Value (Lightness)</SelectItem>
                  <SelectItem value="saturation">Saturation</SelectItem>
                  <SelectItem value="both">
                    Both (Value & Saturation)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gradient-style">Gradient Style</Label>
              <Select
                value={gradientStyle}
                onValueChange={(value) =>
                  setGradientStyle(value as GradientStyle)
                }
              >
                <SelectTrigger id="gradient-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="steps">Steps</SelectItem>
                  <SelectItem value="both">Both (Smooth + Steps)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gradientStyle === "steps" && (
              <div className="space-y-2">
                <Label htmlFor="gradient-steps">Gradient Steps</Label>
                <Input
                  id="gradient-steps"
                  type="number"
                  min="2"
                  max="10"
                  value={gradientSteps}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value >= 2 && value <= 10) {
                      setGradientSteps(value);
                    }
                  }}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Gradient Direction</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={rotateGradientDirection}
                  variant="outline"
                  className="gap-2 flex-1"
                >
                  <RotateCw className="size-4" />
                  {gradientDirection === "horizontal" && "Horizontal (→)"}
                  {gradientDirection === "vertical" && "Vertical (↓)"}
                  {gradientDirection === "diagonal-tl-br" && "Diagonal (↘)"}
                  {gradientDirection === "diagonal-tr-bl" && "Diagonal (↙)"}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="margin">Margin/Padding</Label>
                <span className="text-sm text-muted-foreground">
                  {margin}px
                </span>
              </div>
              <Slider
                id="margin"
                value={[margin]}
                onValueChange={(value) => setMargin(value[0])}
                min={0}
                max={50}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust the spacing between swatches and image edges
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Palette Display */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Palette</CardTitle>
                <CardDescription>
                  Color palette generated from your starting color
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {customPalette.length > 0 && (
                  <Button
                    onClick={resetToBasePalette}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    title="Reset to scheme palette"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                )}
                <Button
                  onClick={addColorToPalette}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  Add Color
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {palette.map((color, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="relative group">
                    <div
                      className="w-16 h-16 rounded-md border-2 border-border shadow-sm cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
                      style={{ backgroundColor: color }}
                      onClick={() => setStartColor(color)}
                      title={`Click to use as starting color: ${color}`}
                    >
                      <LandPlot className="size-6" />
                    </div>
                    {palette.length > 2 && (
                      <Button
                        onClick={() => removeColorFromPalette(index)}
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) =>
                        updateColorInPalette(index, e.target.value)
                      }
                      className="w-16 h-8 cursor-pointer pr-8"
                      title="Click to edit color"
                    />
                    <PencilLine className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {color}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Texture Preview & Download */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle>Texture Preview</CardTitle>
              <CardDescription>
                Gradient squares for each color in your palette
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="export-scale"
                  className="text-sm whitespace-nowrap"
                >
                  Export Scale:
                </Label>
                <Select
                  value={exportScale.toString()}
                  onValueChange={(value) => setExportScale(parseInt(value))}
                >
                  <SelectTrigger id="export-scale" className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                    <SelectItem value="8">8x</SelectItem>
                    <SelectItem value="16">16x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">
                {exportDimensions.width} × {exportDimensions.height} px
              </div>
              <Button onClick={downloadTexture} className="gap-2">
                <Download className="size-4" />
                Download Texture
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-muted/30 overflow-auto">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto"
              style={{ display: "block" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
