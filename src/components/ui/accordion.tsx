/**
 * @fileoverview Accordion UI Component - Collapsible Content Sections
 * 
 * This file provides a complete accordion implementation built on Radix UI primitives,
 * offering accessible and customizable collapsible content sections for the Legal AI platform.
 * 
 * Key Features:
 * - Accessible accordion with keyboard navigation and screen reader support
 * - Smooth expand/collapse animations with chevron rotation indicators
 * - Flexible single or multiple panel expansion modes
 * - Consistent styling with platform design system
 * - Built on Radix UI for robust accessibility and behavior
 * 
 * Components Exported:
 * - Accordion: Root container component
 * - AccordionItem: Individual accordion section wrapper
 * - AccordionTrigger: Clickable header with expand/collapse functionality
 * - AccordionContent: Collapsible content area with smooth animations
 * 
 * Usage Examples:
 * - FAQ sections in help documentation
 * - Legal document section navigation
 * - Contract clause organization
 * - Settings panel groupings
 * - Dashboard widget organization
 * 
 * Integration Points:
 * - Used throughout the platform for organizing complex information
 * - Integrates with legal document viewers for section navigation
 * - Supports Hungarian localization for legal professional workflows
 * - Consistent with platform's accessibility standards
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))

AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
