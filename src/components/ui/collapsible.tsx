/**
 * @fileoverview Collapsible UI Component - Expandable Content Sections
 * 
 * This file provides a simple collapsible component system built on Radix UI primitives,
 * offering accessible expandable and collapsible content sections for the Legal AI platform.
 * 
 * Key Features:
 * - Accessible collapsible behavior with proper ARIA attributes
 * - Smooth expand/collapse animations and transitions
 * - Keyboard navigation support for accessibility
 * - Flexible trigger and content composition
 * - Built on Radix UI for robust cross-browser compatibility
 * - Programmatic control of expanded/collapsed states
 * 
 * Components Exported:
 * - Collapsible: Root collapsible container
 * - CollapsibleTrigger: Clickable element that toggles visibility
 * - CollapsibleContent: Content area that expands and collapses
 * 
 * Usage Examples:
 * - Legal document section toggles for detailed information
 * - Advanced search filter panels that can be hidden/shown
 * - FAQ sections with expandable answers
 * - Legal clause details in contract reviews
 * - Settings panels with collapsible option groups
 * - Dashboard widget content that can be minimized
 * 
 * Integration Points:
 * - Used throughout platform for space-efficient content organization
 * - Integrates with legal document viewers and analysis tools
 * - Supports Hungarian localization for trigger labels
 * - Consistent with platform's accessibility and design standards
 * - Works with legal workflow and document management systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
