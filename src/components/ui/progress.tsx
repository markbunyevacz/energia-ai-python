/**
 * @fileoverview Progress UI Component - Loading and Process Indicator
 * 
 * This file provides a progress bar component built on Radix UI primitives.
 * It is used to display the progress of a determinate operation, such as a
 * file upload, data processing, or a multi-step form completion.
 * 
 * Key Features:
 * - Accessible progress indicator with proper ARIA attributes
 * - Visual representation of progress from 0% to 100%
 * - Smooth animation for progress changes
 * - Consistent styling with the platform's design system
 * - Can be used for both determinate and indeterminate (by styling) states
 * - Built on Radix UI for robust and accessible behavior
 * 
 * Usage Examples:
 * - Showing the progress of legal document uploads or downloads
 * - Indicating the completion status of an AI contract analysis
 * - Visualizing steps in a multi-stage legal workflow
 * - Displaying loading progress for large datasets or reports
 * - User onboarding or profile completion progress
 * 
 * Integration Points:
 * - Used to provide feedback for long-running operations
 * - Can be programmatically updated based on background processes
 * - Integrates with file handling and AI processing services
 * - Part of the core UI library for communicating system status
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
