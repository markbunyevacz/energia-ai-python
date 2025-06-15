/**
 * @fileoverview Avatar UI Component - User Profile Images and Fallbacks
 * 
 * This file provides a complete avatar component system built on Radix UI primitives,
 * offering accessible user profile image display with automatic fallback handling
 * for the Legal AI platform.
 * 
 * Key Features:
 * - Accessible image display with proper alt text support
 * - Automatic fallback to initials or placeholder when image fails to load
 * - Consistent circular styling with responsive sizing
 * - Built on Radix UI for robust image loading and error handling
 * - Flexible sizing and styling customization
 * 
 * Components Exported:
 * - Avatar: Root avatar container with circular styling
 * - AvatarImage: Profile image component with loading states
 * - AvatarFallback: Fallback content (initials, icons) when image unavailable
 * 
 * Usage Examples:
 * - User profile displays in navigation and settings
 * - Legal professional identification in document reviews
 * - Team member listings in collaboration features
 * - Comment and activity feed user identification
 * - Admin panel user management interfaces
 * 
 * Integration Points:
 * - Used throughout platform for user identification
 * - Integrates with authentication and user profile systems
 * - Supports Hungarian legal professional naming conventions
 * - Consistent with platform's accessibility and design standards
 * - Works with user management and role-based access control
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
