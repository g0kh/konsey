import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-[15px] font-medium whitespace-nowrap transition-all duration-150 ease outline-none select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-[#1765cc]",
        outline:
          "border-border bg-white text-text-secondary hover:border-border-strong hover:text-text-primary hover:bg-surface-2",
        secondary:
          "border-border bg-white text-text-secondary hover:border-border-strong hover:text-text-primary hover:bg-surface-2",
        ghost:
          "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        destructive:
          "bg-urgent text-white hover:bg-destructive-hover",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 px-5 py-2.5",
        xs: "h-7 gap-1 rounded-md px-2.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 rounded-md px-4 text-[14px] [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 gap-2 px-6 text-[16px]",
        icon: "size-11",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9 rounded-md",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

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
  )
}

export { Button, buttonVariants }
