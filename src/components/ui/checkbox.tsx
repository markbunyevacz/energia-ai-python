/**
 * @fileoverview Checkbox UI Component - Form Input Controls
 * 
 * This file provides a complete checkbox component built on Radix UI primitives,
 * offering accessible form input controls with consistent styling and behavior
 * for the Legal AI platform.
 * 
 * Key Features:
 * - Accessible checkbox with proper ARIA attributes and keyboard navigation
 * - Visual check indicator with smooth animations
 * - Consistent styling with platform design system
 * - Focus management with visible focus rings
 * - Disabled state support with appropriate visual feedback
 * - Built on Radix UI for robust cross-browser compatibility
 * 
 * Usage Examples:
 * - Legal document selection in bulk operations
 * - Terms and conditions acceptance in legal forms
 * - Feature toggles in user preferences and settings
 * - Multi-select filters in legal document searches
 * - Permission and role assignment interfaces
 * - Legal compliance checklist items
 * - Contract clause selection and review workflows
 * 
 * Integration Points:
 * - Used throughout platform for boolean input collection
 * - Integrates with form validation and submission systems
 * - Supports Hungarian localization for legal form labels
 * - Consistent with platform's accessibility and design standards
 * - Works with legal document management and workflow systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
