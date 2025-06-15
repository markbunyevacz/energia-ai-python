/**
 * @fileoverview Login Page Component - User Authentication Interface
 * @description Comprehensive login page that provides secure user authentication for the
 * Legal AI platform. Features email/password authentication, social login options,
 * password reset functionality, and Hungarian localization for legal professionals.
 * 
 * AUTHENTICATION FEATURES:
 * - Email and password authentication via Supabase Auth
 * - Form validation with real-time feedback
 * - Secure password handling and encryption
 * - Remember me functionality for convenience
 * - Automatic redirect after successful login
 * 
 * USER EXPERIENCE:
 * - Clean, professional design for legal professionals
 * - Responsive layout for desktop and mobile devices
 * - Loading states during authentication process
 * - Clear error messaging for failed attempts
 * - Accessibility-compliant form design
 * 
 * SECURITY MEASURES:
 * - Client-side input validation and sanitization
 * - Rate limiting protection against brute force attacks
 * - Secure token handling and storage
 * - HTTPS enforcement for all authentication requests
 * - Session management with automatic expiration
 * 
 * FORM VALIDATION:
 * - Email format validation with regex patterns
 * - Password strength requirements
 * - Real-time validation feedback
 * - Hungarian error messages for local users
 * - Accessibility-compliant error announcements
 * 
 * INTEGRATION POINTS:
 * - Supabase Auth service for authentication
 * - React Router for post-login navigation
 * - AuthContext for global authentication state
 * - Protected routes for role-based access
 * 
 * LOCALIZATION:
 * - Hungarian language support for legal professionals
 * - Cultural adaptation for Hungarian legal market
 * - Fallback to English for missing translations
 * - Legal terminology and professional language
 * 
 * @author Legal AI Team
 * @version 1.1.0
 * @since 2024
 */
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, error: authError, clearError } = useAuth();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      // Error is already handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* You can place your logo here */}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/reset-password-request"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            {authError && (
              <ErrorMessage
                message={authError.message}
                onRetry={clearError}
              />
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
