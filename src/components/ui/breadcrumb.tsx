/**
 * @fileoverview Breadcrumb UI Component - Navigation Path Indicators
 * 
 * This file provides a complete breadcrumb navigation system for displaying hierarchical
 * navigation paths and current page location within the Legal AI platform.
 * 
 * Key Features:
 * - Accessible navigation with proper ARIA labels and semantics
 * - Flexible separator customization with default chevron icons
 * - Ellipsis support for truncating long navigation paths
 * - Responsive design with proper text wrapping
 * - Current page indication with disabled link styling
 * - Support for custom link components via Radix Slot
 * 
 * Components Exported:
 * - Breadcrumb: Root navigation container with accessibility labels
 * - BreadcrumbList: Ordered list container for breadcrumb items
 * - BreadcrumbItem: Individual breadcrumb item wrapper
 * - BreadcrumbLink: Clickable navigation links with hover states
 * - BreadcrumbPage: Current page indicator (non-clickable)
 * - BreadcrumbSeparator: Visual separator between breadcrumb items
 * - BreadcrumbEllipsis: Truncation indicator for long paths
 * 
 * Usage Examples:
 * - Legal document hierarchy navigation (Contracts > Energy > 2024 > Document.pdf)
 * - Dashboard section navigation (Dashboard > Analytics > Performance)
 * - Settings page navigation (Settings > User Management > Roles)
 * - Legal case file navigation (Cases > Energy Sector > Case Details)
 * - Document review workflow navigation
 * 
 * Integration Points:
 * - Used throughout platform for hierarchical navigation
 * - Integrates with routing system for dynamic path generation
 * - Supports Hungarian localization for legal navigation terms
 * - Consistent with platform's accessibility and design standards
 * - Works with legal document management and case organization
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
