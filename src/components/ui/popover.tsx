/**
 * @fileoverview Popover UI Component - Floating Content Panel
 * 
 * This file provides a popover component system built on Radix UI primitives.
 * Popovers are used to display floating content in relation to a trigger element,
 * ideal for menus, information displays, and other contextual UIs.
 * 
 * Key Features:
 * - Fully accessible with focus management and keyboard navigation
 * - Intelligent positioning with collision detection and alignment options
 * - Triggered by a click or other user interaction
 * - Smooth entrance and exit animations
 * - Portal rendering to avoid z-index and clipping issues
 * - Built on Radix UI for robust and accessible popover behavior
 * 
 * Components Exported:
 * - Popover: The root component for a popover instance
 * - PopoverTrigger: The element that opens the popover on click
 * - PopoverContent: The floating content panel with styling and animations
 * 
 * Usage Examples:
 * - Date picker calendar that appears when clicking an input field
 * - Color picker for highlighting or annotations
 * - A "share" menu with social media links for a legal document
 * - Complex filter selection for a search interface
 * - User profile menu in the application header
 * 
 * Integration Points:
 * - A versatile building block for many other UI components
 * - Used to create complex, interactive UI without cluttering the main layout
 * - Supports Hungarian localization within the popover content
 * - Adheres to the platform's design system for a consistent look and feel
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
