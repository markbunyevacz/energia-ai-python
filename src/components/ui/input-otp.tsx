/**
 * @fileoverview Input OTP UI Component - One-Time Password Input Fields
 * 
 * This file provides a complete OTP (One-Time Password) input component system
 * built on input-otp library, offering accessible multi-digit input fields
 * for authentication and verification in the Legal AI platform.
 * 
 * Key Features:
 * - Accessible OTP input with proper ARIA attributes and keyboard navigation
 * - Visual feedback with active slot highlighting and caret animation
 * - Flexible grouping and separator support for different OTP formats
 * - Auto-focus progression between input slots
 * - Paste support for complete OTP codes
 * - Disabled state support with visual feedback
 * - Built on input-otp for robust OTP input behavior
 * 
 * Components Exported:
 * - InputOTP: Root OTP input container with configuration
 * - InputOTPGroup: Grouping container for related OTP slots
 * - InputOTPSlot: Individual digit input slot with visual states
 * - InputOTPSeparator: Visual separator between OTP groups
 * 
 * Usage Examples:
 * - Two-factor authentication (2FA) code entry
 * - Email verification code input
 * - SMS verification for legal document access
 * - Secure login verification for legal professionals
 * - Account recovery verification codes
 * - Legal document access PIN entry
 * 
 * Integration Points:
 * - Used in authentication and verification workflows
 * - Integrates with security and user authentication systems
 * - Supports Hungarian localization for input labels and instructions
 * - Consistent with platform's accessibility and design standards
 * - Works with legal document security and access control systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
