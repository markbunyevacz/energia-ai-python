/**
 * @fileoverview Sonner Toaster UI Component - Themed Toast Notifications
 * 
 * This file provides a themed toaster component using the 'sonner' library.
 * It is responsible for rendering toast notifications that are consistent
 * with the application's theme (light/dark mode), managed via `next-themes`.
 * 
 * Key Features:
 * - Automatically adapts toast notifications to the current application theme
 * - Provides a clean, modern, and non-intrusive notification system
 * - Exports the `toast` function for easy, imperative toast creation from anywhere in the app
 * - Highly customizable toast options (e.g., icons, action buttons, duration)
 * - The `Toaster` component is placed once in the application layout
 * 
 * Components Exported:
 * - Toaster: The component that renders the toast container and manages notifications
 * - toast: The function used to trigger new toast notifications
 * 
 * Usage Examples:
 * - Notifying users of successful legal document uploads
 * - Displaying error messages from AI analysis or API calls
 * - Informing users of background process completion (e.g., "Contract analysis complete")
 * - Showing confirmation messages after a user saves settings
 * 
 * Integration Points:
 * - Integrates with `next-themes` to provide a seamless themed experience
 * - `Toaster` should be rendered in the root layout of the application (`App.tsx` or similar)
 * - The `toast` function can be called from services, hooks, and components
 * - Supports Hungarian localization in the content passed to the `toast` function
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
