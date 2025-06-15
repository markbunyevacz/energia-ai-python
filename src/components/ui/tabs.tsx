/**
 * @fileoverview Tabs UI Component - Tabbed Content Views
 * 
 * This file provides a tabs component system built on Radix UI primitives.
 * It allows users to switch between different views or sections of content
 * within the same context, helping to organize information and reduce clutter.
 * 
 * Key Features:
 * - Fully accessible tabbed interface with keyboard navigation
 * - Clean visual distinction between active and inactive tabs
 * - Smooth transition and animation for the active tab indicator
 * - Supports both controlled and uncontrolled state management
 * - Built on Radix UI for robust, accessible, and reliable tab behavior
 * 
 * Components Exported:
 * - Tabs: The root container for the tabs component
 * - TabsList: The container for the list of tab triggers
 * - TabsTrigger: A button that activates a specific tab and its content
 * - TabsContent: The panel that displays the content for an active tab
 * 
 * Usage Examples:
 * - Switching between "Analysis Summary" and "Full Document View" in contract review
 * - Organizing user settings into categories like "Profile," "Notifications," and "Security"
 * - In a dashboard widget, toggling between a chart view and a table view of the data
 * - Displaying different sections of a legal case file (e.g., "Documents," "Notes," "Timeline")
 * 
 * Integration Points:
 * - A key component for organizing complex UIs and dashboards
 * - Can be used to manage different facets of a single data entity
 * - Supports Hungarian localization for tab titles
 * - Adheres to the platform's design system for a consistent user experience
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
