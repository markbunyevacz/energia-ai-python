/**
 * @fileoverview Slider UI Component - Range Selection Control
 * 
 * This file provides a slider component built on Radix UI primitives. It allows
 * users to select a value or a range of values from a specified continuum,
 * making it ideal for settings that require a continuous range of input.
 * 
 * Key Features:
 * - Fully accessible slider with keyboard navigation (arrow keys for fine-tuning)
 * - Supports single value and range (multi-thumb) selection
 * - Customizable with steps, min/max values, and orientation
 * - Consistent styling with the platform's design system
 * - Supports disabled state for read-only scenarios
 * - Built on Radix UI for robust, accessible, and reliable behavior
 * 
 * Usage Examples:
 * - Adjusting the confidence threshold for AI contract analysis (e.g., 0-100%)
 * - Selecting a date range for filtering legal documents
 * - Setting a numerical parameter for a search query, like "similarity score"
 * - Controlling zoom level in a document viewer
 * - As an input for any quantifiable setting in the platform
 * 
 * Integration Points:
 * - A key component for settings panels and advanced search filters
 * - Integrates with form state management libraries
 * - Can be used to control parameters for AI agent behavior
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
