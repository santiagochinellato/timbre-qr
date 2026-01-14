"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Note: I'm not using cva/radix here as I haven't installed them, implementing simple version first as per request
// But standard shadcn uses them. I will use simple props for now to match the user's "Atomic Button" request without over-adding deps if not needed.
// User didn't ask for Radix.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    // Basic implementation without extra deps
    const Comp = "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg-app transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20":
              variant === "primary",
            "border border-border-subtle bg-bg-card hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-text-main text-text-main":
              variant === "outline",
            "hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-text-main text-text-main":
              variant === "ghost",
            "bg-status-alert text-white hover:bg-status-alert/90 shadow-md shadow-red-500/20":
              variant === "destructive",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
