/**
 * @fileoverview Textarea UI Component - Multi-line Text Input
 * 
 * This file provides a customizable textarea component for multi-line text input
 * in the Legal AI platform, ensuring consistent styling and accessibility for forms.
 * 
 * Key Features:
 * - Accessible multi-line text input with placeholder support
 * - Consistent styling with platform design system
 * - Focus management with visible focus rings
 * - Disabled state support with appropriate visual feedback
 * - Customizable height and resize behavior
 * - Built with standard HTML textarea for maximum compatibility
 * 
 * Usage Examples:
 * - Legal document summaries and annotations
 * - Contract clause text editing and review
 * - User feedback and support request forms
 * - AI agent interaction and prompt engineering
 * - Note-taking and collaboration features
 * - Detailed descriptions in legal case management
 * 
 * Integration Points:
 * - Used in forms throughout the platform for detailed text input
 * - Integrates with form validation and state management libraries
 * - Supports Hungarian localization for placeholder text
 * - Consistent with platform's accessibility and design standards
 * - Works with legal document editing and analysis workflows
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
