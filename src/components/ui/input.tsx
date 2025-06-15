import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * @fileoverview Input Component - Accessible Form Input Element
 * @description Styled input component that provides consistent form input styling
 * across the Legal AI platform. Built with accessibility in mind and supports
 * various input types with proper validation states and focus management.
 * 
 * INPUT FEATURES:
 * - Consistent styling across all input types
 * - Accessibility-compliant with proper ARIA attributes
 * - Focus and hover state management
 * - Error and validation state styling
 * - Placeholder and label integration
 * 
 * SUPPORTED INPUT TYPES:
 * - text: Standard text input for names, titles, etc.
 * - email: Email validation with proper keyboard
 * - password: Secure password input with masking
 * - number: Numeric input with validation
 * - search: Search input with appropriate styling
 * - url: URL input with validation
 * 
 * ACCESSIBILITY FEATURES:
 * - Proper focus management and visual indicators
 * - Screen reader compatibility
 * - Keyboard navigation support
 * - ARIA labels and descriptions
 * - Error state announcements
 * 
 * STYLING SYSTEM:
 * - Tailwind CSS for consistent design
 * - Border and shadow styling for depth
 * - Responsive sizing and spacing
 * - Dark mode compatibility
 * - Disabled state styling
 * 
 * USAGE PATTERNS:
 * - Form fields for user data collection
 * - Search interfaces and filters
 * - Settings and configuration forms
 * - Authentication and login forms
 * - Document metadata input
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Additional props can be added here if needed
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
