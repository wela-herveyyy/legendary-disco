import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@repo/ui/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--primary),black_18%)] hover:brightness-105 active:shadow-none",
        outline:
          "border-2 border-border bg-card text-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--border),black_8%)] hover:bg-muted active:shadow-none",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_3px_0_0_color-mix(in_oklch,var(--secondary),black_18%)] hover:brightness-105 active:shadow-none",
        ghost: "hover:bg-primary/10 hover:text-primary",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-5",
        xs: "h-7 gap-1 px-3 text-xs",
        sm: "h-9 gap-1 px-4 text-[0.8rem]",
        lg: "h-12 gap-2 px-7 text-base",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
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
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
