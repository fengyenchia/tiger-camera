"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-6 w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-pill bg-primary/15">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block size-5 rounded-pill border-2 border-primary bg-background shadow-sm transition-all duration-600 hover:bg-secondary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 motion-reduce:transition-none" />
    </SliderPrimitive.Root>
  );
}

export { Slider };
