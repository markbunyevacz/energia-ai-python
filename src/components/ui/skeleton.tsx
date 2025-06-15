/**
 * @fileoverview Skeleton UI Component - Content Loading Placeholder
 * 
 * This file provides a skeleton component used to display a placeholder preview
 * of content before it has finished loading, improving the user experience by
 * reducing layout shifts and indicating that data is forthcoming.
 * 
 * Key Features:
 * - Animated pulse effect to indicate loading activity
 * - Consistent styling with platform design system
 * - Prevents layout shift by occupying the final space of the content
 * - Highly customizable with standard `className` and style props
 * - Lightweight and performant for use in lists and complex layouts
 * 
 * Usage Examples:
 * - Placeholder for legal document cards while fetching data
 * - Loading state for user profile information or dashboard widgets
 * - Simulating text lines, avatars, and other shapes during load
 * - Indication of data fetching in tables and search results
 * - AI analysis results placeholder
 * 
 * Integration Points:
 * - Used across the platform to provide a better loading experience
 * - Integrates with data-fetching hooks (`useSWR`, `React Query`) to show loading states
 * - Part of the core UI library for creating a cohesive user experience
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
