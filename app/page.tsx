"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1>Home</h1>
      <div className="flex flex-row gap-4">
        <Button
          onClick={() => {
            router.push("/sprites");
          }}
        >
          Sprites
        </Button>
        <Button
          onClick={() => {
            router.push("/swatches");
          }}
        >
          Swatches
        </Button>
      </div>
    </div>
  );
}
