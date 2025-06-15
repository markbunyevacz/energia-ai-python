/**
 * @fileoverview Separator UI Component - Visual Divider Line
 * 
 * This file provides a separator component built on Radix UI primitives.
 * It is used to create a visual and semantic division between elements or
 * groups of content, improving the layout and organization of the UI.
 * 
 * Key Features:
 * - Renders a horizontal or vertical line to separate content
 * - Can be purely decorative or a semantic separator for accessibility
 * - Customizable orientation (horizontal or vertical)
 * - Consistent styling with the platform's design system (uses `bg-border`)
 * - Lightweight and simple to implement
 * 
 * Usage Examples:
 * - Separating menu items in a dropdown or context menu
 * - Dividing sections within a settings page or form
 * - Visually separating toolbar actions
 * - Creating distinct layout regions in a dashboard widget or card
 * - Dividing content in a list of legal documents
 * 
 * Integration Points:
 * - Used throughout the UI component library to build more complex components
 * - Helps enforce visual hierarchy and content grouping
 * - Aligns with the platform's overall design language for consistency
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
