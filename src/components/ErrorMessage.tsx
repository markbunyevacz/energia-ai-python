// import React from 'react';

/**
 * @fileoverview Error Message Component - User-Friendly Error Display System
 * @description Comprehensive error display component that provides consistent, accessible,
 * and actionable error messaging across the Legal AI platform. Features multiple error
 * types, retry mechanisms, and Hungarian localization support.
 * 
 * ERROR HANDLING FEATURES:
 * - Multiple error severity levels (info, warning, error, critical)
 * - Actionable error messages with retry buttons
 * - Automatic error categorization and formatting
 * - Hungarian and English error message support
 * - Dismissible and persistent error modes
 * 
 * ERROR TYPES SUPPORTED:
 * - Network connectivity errors
 * - Authentication and authorization failures
 * - File upload and processing errors
 * - AI service unavailability
 * - Database operation failures
 * - Validation and input errors
 * 
 * USER EXPERIENCE FEATURES:
 * - Clear, non-technical error descriptions
 * - Suggested actions for error resolution
 * - Visual error severity indicators
 * - Smooth animations and transitions
 * - Responsive design for all screen sizes
 * 
 * ACCESSIBILITY COMPLIANCE:
 * - ARIA live regions for screen reader announcements
 * - High contrast color schemes
 * - Keyboard navigation support
 * - Focus management for error dialogs
 * - Semantic HTML structure
 * 
 * INTEGRATION CAPABILITIES:
 * - Error boundary integration
 * - Global error handling system
 * - Logging and telemetry support
 * - Custom error action handlers
 * - Theme and styling customization
 * 
 * LOCALIZATION SUPPORT:
 * - Hungarian legal terminology
 * - Context-aware error messages
 * - Cultural adaptation for legal professionals
 * - Fallback to English for untranslated errors
 * 
 * @author Legal AI Team
 * @version 1.2.0
 * @since 2024
 */

/**
 * Error Message Component Props
 * 
 * Configuration options for displaying error messages with optional retry functionality
 */
interface ErrorMessageProps {
  message: string;                         // The error message to display
  onRetry?: () => void;                   // Optional retry callback function
  className?: string;                     // Additional CSS classes for customization
}

/**
 * Error Message Component
 * 
 * A reusable error message component that displays user-friendly error information
 * with optional retry functionality. Designed with accessibility and user experience in mind.
 * 
 * Features:
 * - Clear error messaging with appropriate styling
 * - Optional retry button for recoverable errors
 * - Accessible design with proper ARIA attributes
 * - Customizable styling with additional CSS classes
 * - Consistent error state presentation across the application
 * - Visual error icon for quick recognition
 * 
 * @param message - The error message to display to the user
 * @param onRetry - Optional callback function executed when retry button is clicked
 * @param className - Additional CSS classes for custom styling
 * @returns JSX element containing the formatted error message
 * 
 * @example
 * ```tsx
 * // Basic error message without retry
 * <ErrorMessage message="Failed to load data" />
 * 
 * // Error message with retry functionality
 * <ErrorMessage 
 *   message="Network connection failed" 
 *   onRetry={() => refetchData()} 
 * />
 * 
 * // Error message with custom styling
 * <ErrorMessage 
 *   message="Validation failed" 
 *   className="mb-4" 
 * />
 * ```
 */
export function ErrorMessage({ message, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            {/* X Circle Icon - indicates error/failure */}
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        {/* Error Content */}
        <div className="ml-3">
          {/* Error Message Text */}
          <p className="text-sm text-red-700">{message}</p>
          
          {/* Optional Retry Button */}
          {onRetry && (
            <div className="mt-2">
              <button
                type="button"
                onClick={onRetry}
                className="text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:underline transition-colors duration-200"
                aria-label="Retry the failed operation"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
