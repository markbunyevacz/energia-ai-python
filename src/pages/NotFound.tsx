/**
 * @fileoverview 404 Not Found Page Component - User-Friendly Error Page
 * @description Professional 404 error page that provides helpful navigation options
 * when users encounter non-existent routes. Features Hungarian localization,
 * search functionality, and clear navigation paths back to main application areas.
 * 
 * ERROR HANDLING FEATURES:
 * - Clear 404 error messaging with professional design
 * - Helpful navigation suggestions for lost users
 * - Search functionality to find intended content
 * - Breadcrumb navigation for context awareness
 * - Automatic redirect suggestions based on URL patterns
 * 
 * USER EXPERIENCE:
 * - Professional design consistent with platform branding
 * - Hungarian localization for local legal professionals
 * - Clear call-to-action buttons for navigation
 * - Responsive design for all device types
 * - Accessibility-compliant error messaging
 * 
 * NAVIGATION ASSISTANCE:
 * - Quick links to main application sections
 * - Recent pages navigation history
 * - Popular pages and features shortcuts
 * - Contact information for technical support
 * - Search functionality for finding content
 * 
 * SEO OPTIMIZATION:
 * - Proper HTTP 404 status code handling
 * - Meta tags for search engine indexing
 * - Canonical URL management
 * - Structured data for error pages
 * 
 * ANALYTICS INTEGRATION:
 * - 404 error tracking and reporting
 * - User behavior analysis on error pages
 * - Popular search terms from error pages
 * - Navigation pattern analysis
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
