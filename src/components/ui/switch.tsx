/**
 * @fileoverview Switch UI Component - On/Off Toggle Control
 * 
 * This file provides a switch component built on Radix UI primitives,
 * offering an accessible and stylish on/off toggle control for the 
 * Legal AI platform. It's used for boolean settings and preferences.
 * 
 * Key Features:
 * - Fully accessible toggle with ARIA roles and states
 * - Smooth transition animation between checked and unchecked states
 * - Consistent styling with the platform's design system
 * - Supports disabled state for read-only scenarios
 * - Keyboard navigable and easily integrated into forms
 * - Built on Radix UI for robust, accessible switch behavior
 * 
 * Usage Examples:
 * - Enabling or disabling AI analysis features
 * - Toggling notification preferences in user settings
 * - Activating or deactivating specific legal search filters
 * - User consent for terms and conditions
 * - Dark mode / light mode theme switching
 * 
 * Integration Points:
 * - Used in settings pages, forms, and preference panels
 * - Integrates with form state management libraries
 * - Supports localization of associated labels
 * - A key component for user-configurable features
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
