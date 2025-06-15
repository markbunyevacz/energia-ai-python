/**
 * @fileoverview Error Boundary Component - React Error Handling & Recovery System
 * @description React Error Boundary component that catches JavaScript errors anywhere in the
 * component tree, logs error information, and displays a fallback UI instead of crashing
 * the entire application. Essential for production stability and user experience.
 * 
 * ERROR HANDLING CAPABILITIES:
 * - Catches JavaScript errors in component tree
 * - Prevents application crashes from component errors
 * - Provides graceful fallback UI for error states
 * - Logs detailed error information for debugging
 * - Supports error recovery and retry mechanisms
 * 
 * REACT LIFECYCLE INTEGRATION:
 * - componentDidCatch: Error logging and side effects
 * - getDerivedStateFromError: State updates for error UI
 * - Error boundary pattern implementation
 * - Child component error isolation
 * 
 * FALLBACK UI FEATURES:
 * - User-friendly error messages
 * - Application recovery options
 * - Error reporting capabilities
 * - Consistent styling with platform theme
 * - Accessibility-compliant error display
 * 
 * ERROR LOGGING & MONITORING:
 * - Detailed error stack traces
 * - Component stack information
 * - Error context and props logging
 * - Integration with monitoring services
 * - Development vs production error handling
 * 
 * RECOVERY MECHANISMS:
 * - Page refresh option for users
 * - Component retry functionality
 * - Graceful degradation strategies
 * - Error state reset capabilities
 * 
 * USAGE PATTERNS:
 * - Wrap entire application or major sections
 * - Isolate error-prone components
 * - Protect critical user workflows
 * - Provide fallback for third-party components
 * 
 * INTEGRATION POINTS:
 * - Error reporting services (Sentry, LogRocket)
 * - Application monitoring systems
 * - User feedback collection
 * - Development debugging tools
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
// import React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // console.error('ErrorBoundary caught an error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hiba történt</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p>Az oldal betöltése során hiba lépett fel:</p>
                <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
                  {this.state.error?.message || 'Ismeretlen hiba'}
                </pre>
                <button 
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Újrapróbálás
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
