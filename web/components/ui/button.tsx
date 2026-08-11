import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-pill px-5 text-sm font-extrabold transition-all duration-600 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary-hover",
        secondary:
          "border border-primary/40 bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary-hover",
        ghost:
          "text-primary hover:bg-pink hover:text-primary-strong",
        destructive:
          "border border-destructive bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive-hover",
      },
      size: {
        default: "h-12",
        sm: "h-11 px-4",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
