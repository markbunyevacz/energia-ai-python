/**
 * @fileoverview Protected Route Component - Role-Based Access Control for React Router
 * @description Security wrapper component that enforces role-based access control for protected
 * routes in the Legal AI platform. Integrates with Supabase authentication and provides
 * granular permission management for different user roles.
 * 
 * SECURITY FEATURES:
 * - Role-based access control (RBAC) enforcement
 * - Authentication state validation
 * - Automatic redirect for unauthorized users
 * - Loading states during permission checks
 * - Error handling for authentication failures
 * 
 * SUPPORTED ROLES:
 * - admin: Full system access and configuration
 * - legal_manager: Legal document analysis and management
 * - analyst: Data analysis and reporting capabilities
 * - viewer: Read-only access to documents and reports
 * 
 * COMPONENT ARCHITECTURE:
 * - Higher-order component (HOC) pattern
 * - React Router integration for seamless navigation
 * - Supabase authentication context integration
 * - Conditional rendering based on permissions
 * 
 * AUTHENTICATION FLOW:
 * 1. Check if user is authenticated via Supabase
 * 2. Validate user role against required role
 * 3. Allow access if authorized, redirect if not
 * 4. Handle loading and error states gracefully
 * 
 * USAGE PATTERNS:
 * - Wrap route components that require specific roles
 * - Automatic handling of authentication redirects
 * - Seamless integration with React Router
 * - Support for nested protected routes
 * 
 * INTEGRATION POINTS:
 * - Supabase Auth for user authentication
 * - React Router for navigation control
 * - AuthContext for global authentication state
 * - Role management system in database
 * 
 * ERROR HANDLING:
 * - Graceful degradation for auth failures
 * - User-friendly error messages
 * - Automatic retry mechanisms
 * - Fallback routes for unauthorized access
 * 
 * @author Legal AI Team
 * @version 1.1.0
 * @since 2024
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import type { UserRole } from '../lib/supabase';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

/**
 * ProtectedRoute Props Interface
 * 
 * Defines the properties for the ProtectedRoute component with comprehensive type safety
 */
interface ProtectedRouteProps {
  /** Child components to render if access is granted */
  children: React.ReactNode;
  
  /** 
   * Optional role requirement - if specified, user must have this exact role
   * If not provided, only authentication is required (any authenticated user can access)
   */
  requiredRole?: UserRole;
}

/**
 * ProtectedRoute Component Implementation
 * 
 * Implements comprehensive role-based access control with multiple security checks
 * and user-friendly error handling. Provides loading states and preserves navigation state.
 * 
 * @param children - Components to render if access is granted
 * @param requiredRole - Optional role requirement for access
 * @returns JSX element with protected content, loading state, error state, or redirect
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // ============================================================================
  // HOOKS AND STATE MANAGEMENT
  // ============================================================================
  
  /** Get authentication state from AuthContext */
  const { user, loading, error } = useAuth();
  
  /** Get current location for post-login redirect preservation */
  const location = useLocation();

  // ============================================================================
  // LOADING STATE HANDLING
  // ============================================================================
  
  /**
   * Show loading spinner while authentication state is being determined
   * This prevents flickering between login redirect and protected content
   * Uses the reusable LoadingSpinner component for consistent UX
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE HANDLING
  // ============================================================================
  
  /**
   * Handle authentication errors (network issues, invalid tokens, etc.)
   * Provides user-friendly error message with retry functionality
   * Uses the reusable ErrorMessage component for consistent error UX
   */
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message="Failed to load user data. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // ============================================================================
  // AUTHENTICATION CHECK
  // ============================================================================
  
  /**
   * Redirect to login if user is not authenticated
   * Preserves the intended destination in navigation state for post-login redirect
   * The 'replace' prop prevents adding the protected route to browser history
   */
  if (!user) {
    // Save the attempted URL for redirect after successful login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ============================================================================
  // AUTHORIZATION CHECKS
  // ============================================================================
  
  /**
   * Check if user has a role assigned when a specific role is required
   * This handles cases where user is authenticated but has no role assigned
   * Provides clear error message about missing permissions
   */
  if (requiredRole && !user.role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message="You don't have the required permissions to access this page."
        />
      </div>
    );
  }

  /**
   * TODO: Consider implementing role hierarchy (e.g., admin can access all roles)
   * TODO: Add security logging for unauthorized access attempts
   */

  // Defines the hierarchical level of each user role. A higher number
  // indicates a higher level of privilege. This is used to allow users with
  // higher roles to access routes intended for lower-level roles
  // (e.g., an 'admin' can access a 'viewer' page).
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    analyst: 2,
    legal_manager: 3,
    admin: 4,
  };

  // Checks if a role is required for the route and if the current user's
  // role meets the minimum level required. If the user's role is not
  // sufficient, they are shown an error message. This is the core of the
  // hierarchical RBAC system.
  if (requiredRole && (!user.role || roleHierarchy[user.role] < roleHierarchy[requiredRole])) {
    // TODO: Log unauthorized access attempt for security monitoring
    // securityLogger.logUnauthorizedAccess({
    //   userId: user.id,
    //   userRole: user.role,
    //   requiredRole,
    //   timestamp: new Date().toISOString(),
    //   route: location.pathname,
    //   userAgent: navigator.userAgent
    // });
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorMessage
          message={`You need ${requiredRole} role to access this page.`}
        />
      </div>
    );
  }

  // ============================================================================
  // RENDER PROTECTED CONTENT
  // ============================================================================
  
  /**
   * User is authenticated and authorized - render the protected content
   * The fragment wrapper ensures clean rendering without extra DOM elements
   * 
   * TODO: Consider adding analytics tracking for successful access
   * TODO: Add performance monitoring for protected route rendering
   */
  return <>{children}</>;
} 
