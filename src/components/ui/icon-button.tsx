import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * IconButton variants for consistent styling across the app.
 * All icon buttons should use this component to ensure accessibility.
 */
const iconButtonVariants = cva(
    "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-white/10 text-white hover:bg-white/20",
                primary: "bg-primary text-white hover:bg-primary-hover",
                ghost: "text-white/70 hover:text-white hover:bg-white/5",
                outline: "border border-white/20 text-white hover:bg-white/10",
                danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
            },
            size: {
                sm: "h-8 w-8",
                md: "h-10 w-10",
                lg: "h-12 w-12",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
)

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
    /**
     * Required: Accessible label for screen readers.
     * This is crucial for icon-only buttons.
     */
    "aria-label": string
    /** Use Slot for composition with custom components */
    asChild?: boolean
}

/**
 * Accessible icon button component.
 * 
 * Always requires an aria-label for screen reader accessibility.
 * Use this for all icon-only interactive elements.
 * 
 * @example
 * ```tsx
 * <IconButton aria-label="Close dialog" onClick={onClose}>
 *   <X size={20} />
 * </IconButton>
 * ```
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(iconButtonVariants({ variant, size, className }))}
                ref={ref}
                type="button"
                {...props}
            />
        )
    }
)
IconButton.displayName = "IconButton"

export { IconButton, iconButtonVariants }
