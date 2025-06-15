/**
 * @fileoverview Main Application Component - Legal AI Platform Entry Point
 * @description Root component that orchestrates the entire Legal AI application with role-based
 * routing, authentication management, and session handling.
 * 
 * ARCHITECTURE OVERVIEW:
 * - React Router for client-side routing with protected routes
 * - Supabase authentication integration with automatic session management
 * - Role-based access control (admin, legal_manager, analyst, viewer)
 * - Context providers for global state management (Auth, MoE)
 * 
 * KEY FEATURES:
 * - Automatic authentication state restoration on app load
 * - Protected routes with role-based access control
 * - Loading states during authentication checks
 * - Automatic redirects for unauthenticated users
 * - Hungarian localization support
 * 
 * ROUTE STRUCTURE:
 * - /login - Public authentication page
 * - /reset-password* - Public password reset flow
 * - /admin - Admin dashboard (admin role only)
 * - /ai-setup - AI configuration (admin role only)
 * - /legal - Legal document analysis interface (legal_manager role)
 * - /analyst - Data analysis dashboard (analyst role)
 * - /dashboard - General dashboard (viewer+ roles)
 * - /viewer - Read-only interface (viewer role)
 * 
 * DEPENDENCIES:
 * - React Router for navigation
 * - Supabase for authentication and backend services
 * - Custom context providers for state management
 * - UI components from Radix UI library
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { ResetPasswordRequest } from './pages/ResetPasswordRequest';
import { ResetPassword } from './pages/ResetPassword';
import { supabase } from '@/lib/supabase';
import { LovableFrontend } from './components/LovableFrontend';
import { Session } from '@supabase/supabase-js';
import Dashboard from './pages/Dashboard';
import AISetupPage from './pages/AISetupPage';
import './App.css';
import { MoEProvider } from './contexts/MoEProvider';

/**
 * Main App Component
 * 
 * This is the root component of the Legal AI Application that handles:
 * - Supabase authentication state management.
 * - Route configuration for different user roles using React Router.
 * - Session management and automatic restoration.
 * - Loading states during authentication checks.
 *
 * The component sets up public routes (login, password reset) and protected routes
 * with role-based access control for admin, legal_manager, analyst, and viewer roles.
 * It ensures that users are redirected to the login page if they are not authenticated.
 */
export function App() {
  // Authentication state - stores current user session
  const [, setSession] = useState<Session | null>(null);
  
  // Loading state - prevents rendering routes until auth check is complete
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * useEffect for Authentication
   * 
   * This effect runs once on component mount to handle the initial authentication check.
   * 1. It retrieves the current session from Supabase.
   * 2. It sets up an authentication state change listener to respond to login/logout events.
   * 3. The listener subscription is cleaned up when the component unmounts.
   */
  useEffect(() => {
    // Get current session on app initialization
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login/logout/token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription on component unmount
    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <MoEProvider>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Authentication Routes */}
            {/* These routes are accessible without authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password-request" element={<ResetPasswordRequest />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Role-Based Routes */}
            {/* Each route requires specific user roles for access */}
            
            {/* Admin Dashboard - Full system access and management */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div>Admin Dashboard</div>
                </ProtectedRoute>
              }
            />

            {/* AI Setup - Model and API key management */}
            <Route
              path="/ai-setup"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AISetupPage />
                </ProtectedRoute>
              }
            />
            
            {/* Legal Manager Interface - Legal document management and analysis */}
            <Route
              path="/legal"
              element={
                <ProtectedRoute requiredRole="legal_manager">
                  <LovableFrontend />
                </ProtectedRoute>
              }
            />
            
            {/* Analyst Dashboard - Data analysis and reporting tools */}
            <Route
              path="/analyst"
              element={
                <ProtectedRoute requiredRole="analyst">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="viewer">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Viewer Dashboard - Read-only access to documents and reports */}
            <Route
              path="/viewer"
              element={
                <ProtectedRoute requiredRole="viewer">
                  <div>Viewer Dashboard</div>
                </ProtectedRoute>
              }
            />
            
            {/* Default Redirects */}
            {/* Redirect root path to dashboard page */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch-all route - redirect unknown paths to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </MoEProvider>
  );
}

export default App;
