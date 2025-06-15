/**
 * @fileoverview Aspect Ratio UI Component - Responsive Content Containers
 * 
 * This file provides a simple aspect ratio component built on Radix UI primitives,
 * offering consistent responsive containers that maintain specific width-to-height
 * ratios for media and content in the Legal AI platform.
 * 
 * Key Features:
 * - Maintains consistent aspect ratios across different screen sizes
 * - Built on Radix UI for reliable cross-browser compatibility
 * - Flexible ratio configuration (16:9, 4:3, 1:1, custom ratios)
 * - Responsive design that scales with container width
 * - Prevents layout shift during content loading
 * 
 * Usage Examples:
 * - Legal document preview thumbnails with consistent sizing
 * - Video content containers for legal training materials
 * - Chart and graph containers in analytics dashboards
 * - Image galleries for legal case documentation
 * - Placeholder containers during content loading
 * - Responsive iframe containers for embedded legal tools
 * 
 * Integration Points:
 * - Used throughout platform for consistent media presentation
 * - Integrates with legal document preview systems
 * - Supports responsive design across all platform interfaces
 * - Consistent with platform's design system and layout standards
 * - Works with image optimization and lazy loading systems
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

const AspectRatio = AspectRatioPrimitive.Root

export { AspectRatio }
