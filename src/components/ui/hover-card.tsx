/**
 * @fileoverview Hover Card UI Component - Contextual Information Popover
 * 
 * This file provides a hover card component built on Radix UI primitives,
 * offering accessible contextual information display on hover interactions
 * for the Legal AI platform.
 * 
 * Key Features:
 * - Accessible hover interactions with proper ARIA attributes
 * - Intelligent positioning with collision detection and side preferences
 * - Smooth fade and zoom animations for content appearance
 * - Configurable delay and timing for hover activation
 * - Portal rendering for proper z-index layering
 * - Built on Radix UI for robust cross-browser compatibility
 * 
 * Components Exported:
 * - HoverCard: Root hover card container
 * - HoverCardTrigger: Element that triggers the hover card on hover
 * - HoverCardContent: Content container with positioning and animations
 * 
 * Usage Examples:
 * - Legal professional profile previews on name hover
 * - Legal document metadata and summary previews
 * - Contract clause explanations and definitions
 * - Legal term glossary and definition tooltips
 * - AI analysis confidence score details
 * - User avatar information cards
 * 
 * Integration Points:
 * - Used throughout platform for contextual information display
 * - Integrates with legal document management and user systems
 * - Supports Hungarian localization for hover card content
 * - Consistent with platform's accessibility and design standards
 * - Works with legal glossary and knowledge management systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
