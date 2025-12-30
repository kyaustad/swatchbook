"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import {
  Palette,
  Grid3x3,
  Sparkles,
  Download,
  Layers,
  RotateCw,
} from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-12 min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center gap-4 pt-8">
        <Image src="/logo.png" alt="Swatchbook" width={100} height={100} />
        <div className="flex items-center gap-3 mb-2">
          <Palette className="size-10 text-primary" />
          <h1 className="text-5xl font-bold">Swatchbook</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Create beautiful color palettes and textures for your indie game
          projects. Generate downloadable swatches and gradients with ease.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-5xl mx-auto w-full">
        {/* Swatches Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Palette className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Color Swatches</CardTitle>
            </div>
            <CardDescription className="text-base">
              Create and customize color palettes with professional color theory
              schemes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Sparkles className="size-4 mt-0.5 text-primary shrink-0" />
                <span>
                  Choose from 7 color schemes: complementary, triadic,
                  analogous, and more
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Layers className="size-4 mt-0.5 text-primary shrink-0" />
                <span>
                  Generate smooth or step-based gradients for each color
                </span>
              </li>
              <li className="flex items-start gap-2">
                <RotateCw className="size-4 mt-0.5 text-primary shrink-0" />
                <span>
                  Control gradient direction: horizontal, vertical, or diagonal
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Download className="size-4 mt-0.5 text-primary shrink-0" />
                <span>
                  Export high-resolution textures up to 16x scale (4K+ ready)
                </span>
              </li>
            </ul>
            <Button
              onClick={() => router.push("/swatches")}
              className="w-full mt-4"
              size="lg"
            >
              Open Swatches
            </Button>
          </CardContent>
        </Card>

        {/* Sprites Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group opacity-60">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Grid3x3 className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Sprites</CardTitle>
            </div>
            <CardDescription className="text-base">
              Coming soon: Create and manage sprite sheets for your game assets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>This feature is currently under development.</p>
              <p>
                Future capabilities will include sprite sheet generation,
                texture packing, and asset management tools.
              </p>
            </div>
            <Button
              onClick={() => router.push("/sprites")}
              className="w-full mt-4"
              size="lg"
              variant="outline"
              disabled
            >
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Info */}
      <div className="max-w-3xl mx-auto w-full">
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with Swatchbook in just a few steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside text-sm">
              <li>
                <strong>Select a starting color</strong> using the color picker
                or hex input
              </li>
              <li>
                <strong>Choose a color scheme</strong> that fits your project
                (triadic, complementary, etc.)
              </li>
              <li>
                <strong>Customize your palette</strong> by adding, removing, or
                editing colors
              </li>
              <li>
                <strong>Configure gradients</strong> with smooth or step-based
                styles, and adjust direction
              </li>
              <li>
                <strong>Export your texture</strong> at your desired resolution
                for use in your game engine
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
