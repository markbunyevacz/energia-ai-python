/**
 * @fileoverview Drawer UI Component - Mobile-First Slide-Up Panels
 * 
 * This file provides a complete drawer implementation built on Vaul,
 * offering accessible slide-up panels optimized for mobile interfaces
 * in the Legal AI platform.
 * 
 * Key Features:
 * - Mobile-optimized slide-up drawer with touch gestures
 * - Accessible modal behavior with focus management
 * - Backdrop overlay with optional background scaling
 * - Drag handle indicator for intuitive interaction
 * - Flexible content layout with header and footer sections
 * - Smooth animations and spring physics
 * - Portal rendering for proper z-index layering
 * - Built on Vaul for robust mobile drawer behavior
 * 
 * Components Exported:
 * - Drawer: Root drawer container with configuration options
 * - DrawerTrigger: Element that opens the drawer
 * - DrawerContent: Main drawer content container with drag handle
 * - DrawerHeader: Header section for titles and descriptions
 * - DrawerFooter: Footer section for actions and buttons
 * - DrawerTitle: Drawer title with proper heading semantics
 * - DrawerDescription: Descriptive text for the drawer content
 * - DrawerClose: Close button or trigger element
 * - DrawerOverlay: Background overlay component
 * 
 * Usage Examples:
 * - Mobile legal document quick actions and details
 * - Contract analysis results and recommendations
 * - User profile and settings panels on mobile
 * - Legal form inputs and data collection
 * - AI agent selection and configuration
 * - Mobile navigation and menu systems
 * 
 * Integration Points:
 * - Used throughout platform for mobile-optimized interfaces
 * - Integrates with legal document management and analysis systems
 * - Supports Hungarian localization for drawer content
 * - Consistent with platform's accessibility and design standards
 * - Works with responsive design patterns and mobile workflows
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

const DrawerTrigger = DrawerPrimitive.Trigger

const DrawerPortal = DrawerPrimitive.Portal

const DrawerClose = DrawerPrimitive.Close

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
