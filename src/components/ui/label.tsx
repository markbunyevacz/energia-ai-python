/**
 * @fileoverview Label UI Component - Form Field Labels and Accessibility
 * 
 * This file provides a simple but essential label component for form fields,
 * offering accessible labeling with consistent styling and proper semantic
 * associations for the Legal AI platform.
 * 
 * Key Features:
 * - Semantic HTML label element with proper form field association
 * - Consistent typography and styling with platform design system
 * - Disabled state support with visual feedback
 * - Accessible cursor behavior for associated form controls
 * - Flexible styling with className override support
 * 
 * Usage Examples:
 * - Legal form field labels (contract details, client information)
 * - Settings and preference option labels
 * - Legal document metadata input labels
 * - User profile and account information labels
 * - AI analysis parameter and configuration labels
 * - Legal compliance checklist item labels
 * 
 * Integration Points:
 * - Used throughout platform for form field labeling
 * - Integrates with all form input components for accessibility
 * - Supports Hungarian localization for legal form labels
 * - Consistent with platform's accessibility and design standards
 * - Works with form validation and error handling systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import { cn } from "@/lib/utils"

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  // Additional props can be added here if needed
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
