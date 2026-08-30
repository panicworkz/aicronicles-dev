import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-sm" | "icon-xs" | "icon-lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs border border-transparent",
      outline: "border border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-transparent",
      ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 border border-transparent",
      destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-transparent",
      link: "text-primary underline-offset-4 hover:underline border border-transparent",
    };

    const sizes = {
      default: "h-8 gap-2 px-3 text-xs font-medium rounded-md [&_svg:not([class*='size-'])]:size-3.5",
      xs: "h-6 gap-1 rounded-[5px] px-2 text-[11px] font-medium [&_svg:not([class*='size-'])]:size-3",
      sm: "h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5",
      lg: "h-9 gap-2.5 rounded-md px-4 text-sm font-medium [&_svg:not([class*='size-'])]:size-4",
      icon: "size-8 rounded-md [&_svg:not([class*='size-'])]:size-4",
      "icon-sm": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
      "icon-xs": "size-6 rounded-[5px] [&_svg:not([class*='size-'])]:size-3",
      "icon-lg": "size-9 rounded-md [&_svg:not([class*='size-'])]:size-4",
    };

    return (
      <button
        ref={ref}
        data-slot="button"
        className={cn(
          "inline-flex shrink-0 items-center justify-center leading-none whitespace-nowrap transition-all outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
