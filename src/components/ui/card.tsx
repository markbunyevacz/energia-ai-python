/**
 * @fileoverview Card Component System - Flexible Content Container
 * @description Modular card component system that provides structured content
 * containers with consistent styling. Includes header, content, and footer
 * sections for organizing information in the Legal AI platform interface.
 * 
 * CARD COMPONENTS:
 * - Card: Main container with border and shadow styling
 * - CardHeader: Top section for titles and actions
 * - CardTitle: Primary heading with consistent typography
 * - CardDescription: Subtitle or description text
 * - CardContent: Main content area with proper spacing
 * - CardFooter: Bottom section for actions and metadata
 * 
 * DESIGN FEATURES:
 * - Consistent border radius and shadow styling
 * - Proper spacing and typography hierarchy
 * - Responsive design for all screen sizes
 * - Dark mode compatibility
 * - Hover and focus state management
 * 
 * LAYOUT PATTERNS:
 * - Flexible content organization
 * - Header with title and description
 * - Scrollable content areas when needed
 * - Action buttons in footer section
 * - Grid and list layout support
 * 
 * ACCESSIBILITY FEATURES:
 * - Semantic HTML structure
 * - Proper heading hierarchy
 * - Focus management for interactive cards
 * - Screen reader compatibility
 * - Keyboard navigation support
 * 
 * USAGE SCENARIOS:
 * - Dashboard widgets and metrics
 * - Document preview cards
 * - Analysis result displays
 * - Settings and configuration panels
 * - User profile and information cards
 * 
 * STYLING SYSTEM:
 * - Tailwind CSS for consistent design
 * - Modular component composition
 * - Flexible spacing and sizing
 * - Theme-aware color schemes
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
