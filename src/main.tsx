/**
 * Main Application Entry Point
 * 
 * This is the entry point for the Legal AI Application React application.
 * It initializes the React app using React 18's createRoot API and mounts
 * the main App component to the DOM.
 * 
 * Key Responsibilities:
 * - Bootstrap the React application using the modern React 18 API
 * - Mount the root App component to the HTML element with id "root"
 * - Import global CSS styles for the application
 * 
 * Architecture:
 * - Uses React 18's concurrent features via createRoot()
 * - Strict mode is not explicitly enabled here but can be added for development
 * - CSS imports are processed by Vite's build system
 * 
 * File Dependencies:
 * - ./App.tsx: Main application component with routing and authentication
 * - ./index.css: Global CSS styles including Tailwind CSS imports
 * 
 * @fileoverview Application entry point and React root initialization
 * @author Legal AI Team
 * @since 1.0.0
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
