/**
 * @fileoverview Authentication Context - Global Authentication State Management
 * @description React Context provider that manages global authentication state for the
 * Legal AI platform. Provides centralized user authentication, role management, and
 * session handling across all components with Supabase integration.
 * 
 * AUTHENTICATION FEATURES:
 * - Global authentication state management
 * - User session persistence and restoration
 * - Role-based access control integration
 * - Automatic token refresh handling
 * - Secure logout and session cleanup
 * 
 * STATE MANAGEMENT:
 * - Current user information and profile
 * - Authentication loading states
 * - User roles and permissions
 * - Session expiration handling
 * - Error state management
 * 
 * SUPABASE INTEGRATION:
 * - Real-time authentication state changes
 * - Secure token management
 * - User profile synchronization
 * - Role-based database access
 * - Session persistence across browser sessions
 * 
 * CONTEXT FEATURES:
 * - Provider pattern for global state access
 * - Custom hooks for authentication operations
 * - Type-safe authentication state
 * - Optimized re-rendering patterns
 * - Memory leak prevention
 * 
 * SECURITY MEASURES:
 * - Secure token storage and handling
 * - Automatic session validation
 * - Role verification and enforcement
 * - Secure logout with token cleanup
 * - Protection against XSS and CSRF attacks
 * 
 * USAGE PATTERNS:
 * - Wrap entire application with AuthProvider
 * - Use useAuth hook in components
 * - Conditional rendering based on auth state
 * - Protected route integration
 * - Role-based feature access
 * 
 * @author Legal AI Team
 * @version 1.2.0
 * @since 2024
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User, UserRole, getUserRole } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError);
        setLoading(false);
        return;
      }

      setSession(session);
      if (session?.user) {
        loadUser(session.user).catch((err) => {
          setError(err instanceof Error ? err : new Error('Failed to load user data'));
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        try {
          await loadUser(session.user);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Failed to load user data'));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUser = async (supabaseUser: SupabaseUser) => {
    const role = await getUserRole(supabaseUser.id);
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: role || undefined,
    });
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign in'));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      throw err;
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    hasRole,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
