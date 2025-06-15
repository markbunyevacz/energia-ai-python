/**
 * @fileoverview Scroll Area UI Component - Styled Scrollable Container
 * 
 * This file provides a scroll area component built on Radix UI primitives.
 * It enhances a standard scrollable container with custom-styled scrollbars,
 * offering a consistent look and feel across different browsers and operating systems.
 * 
 * Key Features:
 * - Provides custom-styled scrollbars for both vertical and horizontal scrolling
 * - Hides default browser scrollbars while maintaining functionality
 * - Fully accessible and keyboard-navigable
 * - Supports both vertical and horizontal orientations
 * - Lightweight and performant, built on Radix UI for reliability
 * 
 * Components Exported:
 * - ScrollArea: The main container that provides the scrollable viewport
 * - ScrollBar: The custom-styled scrollbar component
 * 
 * Usage Examples:
 * - Displaying long legal documents or contract clauses in a fixed-height container
 * - Creating scrollable sidebars for navigation or tool palettes
 * - Scrollable dropdown menus or select component options
 * - Presenting tables with many rows or columns inside a card or dialog
 * - Displaying long lists of search results or notifications
 * 
 * Integration Points:
 * - Used in various components like `Select`, `Dialog`, and `Sheet` to manage overflowing content
 * - Ensures a consistent visual design for scrollable elements platform-wide
 * - Improves the aesthetics of the UI, particularly on Windows where scrollbars are more prominent
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
