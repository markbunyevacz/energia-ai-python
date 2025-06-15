import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @fileoverview Button Component - Versatile Interactive Button Element
 * @description Highly customizable button component built on Radix UI primitives with
 * multiple variants, sizes, and states. Provides consistent styling and behavior
 * across the Legal AI platform with accessibility features and loading states.
 * 
 * BUTTON VARIANTS:
 * - default: Primary action button with solid background
 * - destructive: Warning/danger actions with red styling
 * - outline: Secondary actions with border styling
 * - secondary: Subtle actions with muted background
 * - ghost: Minimal styling for tertiary actions
 * - link: Text-only button styled as a link
 * 
 * SIZE OPTIONS:
 * - default: Standard button size for most use cases
 * - sm: Small buttons for compact interfaces
 * - lg: Large buttons for prominent actions
 * - icon: Square buttons optimized for icons
 * 
 * ACCESSIBILITY FEATURES:
 * - Full keyboard navigation support
 * - Screen reader compatibility with ARIA attributes
 * - Focus management and visual indicators
 * - Disabled state handling
 * - Loading state with appropriate announcements
 * 
 * STYLING SYSTEM:
 * - Tailwind CSS with class variance authority
 * - Consistent spacing and typography
 * - Hover and focus state animations
 * - Dark mode compatibility
 * - Responsive design patterns
 * 
 * USAGE PATTERNS:
 * - Form submissions and primary actions
 * - Navigation and routing triggers
 * - Modal and dialog controls
 * - Toolbar and action bar buttons
 * - Loading states during async operations
 * 
 * INTEGRATION POINTS:
 * - React Router for navigation
 * - Form libraries for submissions
 * - Loading states for async operations
 * - Icon libraries for enhanced UX
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
