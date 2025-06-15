/**
 * @fileoverview Table UI Component - Displaying Tabular Data
 * 
 * This file provides a set of components for creating accessible and consistently
 * styled tables. It is designed to be a flexible foundation for displaying any
 * kind of tabular data within the Legal AI platform.
 * 
 * Key Features:
 * - Built with standard `<table>` semantics for maximum accessibility
 * - Includes components for all parts of a table: Header, Body, Footer, Rows, Cells, and Caption
 * - Styled to match the platform's design system, with hover states and proper spacing
 * - The root `Table` component is wrapped in a `div` with `overflow-auto` to handle responsiveness
 * - Supports data-heavy displays with clear and readable typography
 * 
 * Components Exported:
 * - Table: The root `<table>` element, wrapped for responsiveness
 * - TableHeader: The `<thead>` element for column headers
 * - TableBody: The `<tbody>` element for table data rows
 * - TableFooter: The `<tfoot>` element for summary rows
 * - TableRow: The `<tr>` element for defining a row
 * - TableHead: The `<th>` element for a header cell
 * - TableCell: The `<td>` element for a data cell
 * - TableCaption: The `<caption>` element for a table description
 * 
 * Usage Examples:
 * - Displaying a list of legal documents with metadata (name, date, status)
 * - Presenting results from a contract analysis, such as extracted clauses and risks
 * - Showing user management data in the admin dashboard
 * - Displaying logs or performance metrics
 * 
 * Integration Points:
 * - Often used with pagination for navigating large datasets
 * - Can be combined with sorting and filtering controls for interactive data exploration
 * - A fundamental component for any data-grid or list view in the platform
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
