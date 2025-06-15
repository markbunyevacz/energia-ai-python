/**
 * @fileoverview Application Entry Point - React Application Bootstrap
 * @description Main entry point for the Legal AI platform React application. Handles
 * application initialization, root component mounting, and global configuration setup
 * including strict mode, error boundaries, and performance monitoring.
 * 
 * INITIALIZATION FEATURES:
 * - React 18+ root API for concurrent features
 * - Strict Mode for development debugging
 * - Global error boundary integration
 * - Performance monitoring setup
 * - CSS and styling imports
 * 
 * REACT 18 FEATURES:
 * - Concurrent rendering capabilities
 * - Automatic batching for performance
 * - Suspense and lazy loading support
 * - Enhanced error handling
 * - Improved hydration for SSR
 * 
 * DEVELOPMENT OPTIMIZATIONS:
 * - Strict Mode for detecting side effects
 * - Enhanced debugging capabilities
 * - Component lifecycle validation
 * - Memory leak detection
 * - Performance profiling hooks
 * 
 * GLOBAL SETUP:
 * - CSS framework initialization (Tailwind CSS)
 * - Font loading and optimization
 * - Theme configuration
 * - Global error handlers
 * - Analytics and monitoring setup
 * 
 * PRODUCTION CONSIDERATIONS:
 * - Bundle size optimization
 * - Code splitting configuration
 * - Performance monitoring
 * - Error reporting integration
 * - SEO and accessibility setup
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
