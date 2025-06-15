/**
 * @fileoverview Toggle Group UI Component - Grouped On/Off Buttons
 * 
 * This file provides a toggle group component system built on Radix UI primitives.
 * It is used to group multiple `Toggle` buttons, allowing for either single or
 * multiple selections from a set of options, behaving like a toolbar or segmented control.
 * 
 * Key Features:
 * - Groups multiple toggle items into a single, cohesive component
 * - Supports both single selection (like a radio group) and multiple selections (like checkboxes)
 * - Inherits styling variants (variant and size) from the `toggle` component via React Context
 * - Fully accessible with keyboard navigation within the group
 * - Built on Radix UI for robust and accessible group behavior
 * 
 * Components Exported:
 * - ToggleGroup: The root container for the group of toggle items
 * - ToggleGroupItem: An individual toggle button within the group
 * 
 * Usage Examples:
 * - A text alignment control in a rich text editor (left, center, right - single selection)
 * - A set of filter buttons for document types (e.g., "Contract," "NDA," "PPA" - multiple selections)
 * - A view switcher for a dashboard widget (e.g., "Day," "Week," "Month" - single selection)
 * - Font style controls (e.g., "Bold," "Italic," "Underline" - multiple selections)
 * 
 * Integration Points:
 * - Works in conjunction with the `Toggle` component and its variants
 * - A key component for toolbars and filter interfaces
 * - Integrates with form state management to handle its value (single string or array of strings)
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
