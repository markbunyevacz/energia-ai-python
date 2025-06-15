/**
 * @fileoverview Radio Group UI Component - Mutually Exclusive Selection
 * 
 * This file provides a radio group component system built on Radix UI primitives.
 * It allows users to select one option from a set, which is a common requirement
 * in forms and settings throughout the Legal AI platform.
 * 
 * Key Features:
 * - Fully accessible radio group with keyboard navigation (arrow keys)
 * - Supports semantic grouping of options with a clear visual indicator for the selected item
 * - Consistent styling with the platform's design system
 * - Supports disabled states for both the group and individual items
 * - Built on Radix UI for robust, accessible, and predictable behavior
 * 
 * Components Exported:
 * - RadioGroup: The root container that manages the state of the radio buttons
 * - RadioGroupItem: An individual radio button option within the group
 * 
 * Usage Examples:
 * - Selecting an AI model for contract analysis (e.g., GPT-3.5 vs. GPT-4)
 * - Choosing a user role during account setup (e.g., Analyst, Manager, Admin)
 * - Form inputs where only one option is possible, such as document status
 * - Filtering options for legal search (e.g., sort by relevance or date)
 * - User preferences for notification frequency
 * 
 * Integration Points:
 * - Essential for forms and settings pages across the platform
 * - Integrates with form state management libraries
 * - Supports Hungarian localization for labels associated with each radio item
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-2.5 w-2.5 fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
