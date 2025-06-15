/**
 * @fileoverview Badge UI Component - Status Indicators and Labels
 * 
 * This file provides a flexible badge component system for displaying status indicators,
 * labels, and categorical information throughout the Legal AI platform interface.
 * 
 * Key Features:
 * - Multiple badge variants for different status types and contexts
 * - Consistent styling with platform design system
 * - Accessible color contrast and text sizing
 * - Responsive design with proper focus states
 * - Flexible content support for text, numbers, and icons
 * 
 * Badge Variants:
 * - default: Primary status badges with brand colors
 * - secondary: Neutral status badges for general information
 * - destructive: Error, warning, or critical status indicators
 * - outline: Subtle badges with border styling
 * 
 * Usage Examples:
 * - Legal document status indicators (draft, reviewed, approved)
 * - Contract analysis confidence scores and ratings
 * - User role and permission level displays
 * - Notification counts and unread message indicators
 * - Legal domain and practice area tags
 * - Processing status for AI analysis tasks
 * 
 * Integration Points:
 * - Used throughout platform for status communication
 * - Integrates with legal document workflow systems
 * - Supports Hungarian localization for legal status terms
 * - Consistent with platform's accessibility and design standards
 * - Works with notification and alert systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
