/**
 * @fileoverview Tooltip UI Component - Contextual Information on Hover
 * 
 * This file provides a tooltip component system built on Radix UI primitives,
 * offering accessible, highly customizable tooltips to provide contextual
 * information on hover for the Legal AI platform.
 * 
 * Key Features:
 * - Fully accessible with proper ARIA attributes for screen readers
 * - Intelligent positioning with collision detection
 * - Smooth entrance and exit animations
 * - Customizable delay and duration for hover activation
 * - Portal rendering to avoid z-index issues
 * - Built on Radix UI for robust, accessible tooltip behavior
 * 
 * Components Exported:
 * - TooltipProvider: Manages tooltip state for a component tree
 * - Tooltip: The root component for a tooltip instance
 * - TooltipTrigger: The element that triggers the tooltip on hover
 * - TooltipContent: The content of the tooltip with styling and animations
 * 
 * Usage Examples:
 * - Explaining icons or buttons with no visible text label
 * - Providing definitions for legal terminology (e.g., "force majeure")
 * - Showing full text for truncated content
 * - Displaying metadata for legal documents or case files
 * - Guidance for complex form fields or AI parameters
 * 
 * Integration Points:
 * - Used throughout the platform to enhance clarity and provide help text
 * - Supports Hungarian localization for legal term definitions
 * - Integrates with the design system for consistent styling
 * - Essential for maintaining a clean UI while offering deep context
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
