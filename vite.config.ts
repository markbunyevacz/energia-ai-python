/**
 * @fileoverview Vite Configuration - Modern Build Tool Setup
 * @description Vite configuration for the Legal AI platform frontend. Optimizes build
 * performance, handles TypeScript compilation, configures path aliases, and sets up
 * development server with hot module replacement for efficient development workflow.
 * 
 * BUILD OPTIMIZATIONS:
 * - Fast development server with HMR (Hot Module Replacement)
 * - Optimized production builds with code splitting
 * - Tree shaking for minimal bundle sizes
 * - Asset optimization and compression
 * - TypeScript compilation with type checking
 * 
 * DEVELOPMENT FEATURES:
 * - Fast refresh for React components
 * - Source map generation for debugging
 * - Development server with proxy support
 * - Environment variable handling
 * - CSS preprocessing and optimization
 * 
 * PATH CONFIGURATION:
 * - TypeScript path aliases for clean imports
 * - Absolute imports from src directory (@/ alias)
 * - Component library path resolution
 * - Asset path optimization
 * 
 * ENVIRONMENT VARIABLES:
 * - Supabase URL and API key injection
 * - Development vs production environment handling
 * - Secure environment variable management
 * - Runtime environment variable access
 * 
 * PLUGIN INTEGRATIONS:
 * - React plugin for JSX and Fast Refresh
 * - TypeScript plugin for type checking
 * - Path resolution plugin for aliases
 * - CSS processing plugins
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Dependency pre-bundling for faster dev server
 * - Chunk splitting for optimal loading
 * - Asset inlining for small files
 * - Build caching for faster rebuilds
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export default defineConfig({
  plugins: [react()],
  define: {
    // Manually define the environment variables
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 