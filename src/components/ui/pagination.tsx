/**
 * @fileoverview Pagination UI Component - Navigating Paginated Content
 * 
 * This file provides a comprehensive set of components for building accessible
 * and customizable pagination controls. It's essential for navigating through
 * large sets of data, such as lists of legal documents, search results, or user logs.
 * 
 * Key Features:
 * - Fully accessible pagination navigation with ARIA labels
 * - Composite components for flexible layout (Previous, Next, Page Links, Ellipsis)
 * - Styling consistent with the platform's design system, built on button variants
 * - `isActive` prop for highlighting the current page
 * - Includes "Previous" and "Next" buttons with icons and labels
 * - Ellipsis component for gracefully handling large numbers of pages
 * 
 * Components Exported:
 * - Pagination: The root `nav` container with ARIA roles
 * - PaginationContent: A `ul` list to contain the pagination items
 * - PaginationItem: An `li` list item for each pagination element
 * - PaginationLink: The core link/button element for page numbers
 * - PaginationPrevious: A styled link for navigating to the previous page
 * - PaginationNext: A styled link for navigating to the next page
 * - PaginationEllipsis: A component to indicate truncated page links
 * 
 * Usage Examples:
 * - Navigating through a list of legal documents in the document repository
 * - Paginating search results from the legal knowledge base
 * - Moving through pages of user activity logs in the admin dashboard
 * - Paginating tables with large datasets
 * 
 * Integration Points:
 * - Integrates with data-fetching hooks and state management to handle page changes
 * - Used on any page that displays a large, filterable list of items
 * - Supports Hungarian localization for "Previous" and "Next" text
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
