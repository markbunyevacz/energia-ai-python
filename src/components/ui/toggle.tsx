/**
 * @fileoverview Toggle UI Component - On/Off State Button
 * 
 * This file provides a toggle button component built on Radix UI primitives.
 * It's a simple, two-state button that can be either "on" or "off", often used
 * for simple filtering or to enable/disable a specific mode.
 * 
 * Key Features:
 * - Accessible toggle button with ARIA `pressed` state
 * - Supports different visual variants (e.g., default, outline) and sizes
 * - Clear visual distinction for the "on" state (`data-[state=on]`)
 * - Consistent styling with the platform's button and input components
 * - Built on Radix UI for robust, accessible toggle behavior
 * 
 * Components Exported:
 * - Toggle: The toggle button component itself
 * - toggleVariants: The CVA configuration for styling the toggle
 * 
 * Usage Examples:
 * - A "bold" or "italic" button in a rich text editor
 * - A filter button in a search interface that can be toggled on or off
 * - A button to switch a chart between "line" and "bar" views
 * - Any simple on/off control that doesn't need the visual style of a `Switch`
 * 
 * Integration Points:
 * - Often used within a `ToggleGroup` for multiple-choice selections
 * - Can be used as a standalone button for a single binary option
 * - Integrates with state management to control its on/off state
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
