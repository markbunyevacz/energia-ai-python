/**
 * @fileoverview Alert UI Component - Status and Notification Messages
 * 
 * This file provides a flexible alert component system for displaying important messages,
 * notifications, and status updates throughout the Legal AI platform interface.
 * 
 * Key Features:
 * - Multiple alert variants (default, destructive) for different message types
 * - Accessible alert role for screen readers and assistive technologies
 * - Icon support with proper spacing and positioning
 * - Consistent styling with platform design system
 * - Responsive design with proper text scaling
 * 
 * Components Exported:
 * - Alert: Main alert container with variant styling
 * - AlertTitle: Bold title/heading for the alert message
 * - AlertDescription: Detailed description or body text
 * 
 * Alert Variants:
 * - default: Standard informational alerts
 * - destructive: Error, warning, or critical status alerts
 * 
 * Usage Examples:
 * - Legal document processing status notifications
 * - Contract analysis error messages
 * - System status updates and maintenance notices
 * - User action confirmations and feedback
 * - Validation errors in legal forms
 * 
 * Integration Points:
 * - Used across all platform pages for user feedback
 * - Integrates with error handling and notification systems
 * - Supports Hungarian localization for legal professionals
 * - Consistent with platform's accessibility and design standards
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
