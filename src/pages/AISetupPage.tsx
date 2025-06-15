/**
 * @fileoverview AI Setup Page Component - AI Model Configuration Interface
 * @description Administrative interface for configuring AI models, API keys, and system
 * parameters for the Legal AI platform. Restricted to admin users only, provides
 * comprehensive AI service management and configuration capabilities.
 * 
 * CONFIGURATION FEATURES:
 * - AI model selection and parameter tuning
 * - API key management for external AI services
 * - System-wide AI configuration settings
 * - Model performance monitoring and analytics
 * - Backup and restore configuration options
 * 
 * SUPPORTED AI SERVICES:
 * - OpenAI GPT models (GPT-4, GPT-3.5-turbo)
 * - Custom embedding models configuration
 * - Local AI model integration options
 * - Third-party AI service connections
 * - Model fallback and redundancy settings
 * 
 * SECURITY FEATURES:
 * - Admin-only access with role verification
 * - Secure API key storage and encryption
 * - Configuration change audit logging
 * - Sensitive data masking in UI
 * - Secure configuration backup/restore
 * 
 * MANAGEMENT CAPABILITIES:
 * - Real-time model performance monitoring
 * - Usage analytics and cost tracking
 * - Model health checks and diagnostics
 * - Configuration validation and testing
 * - Automated failover configuration
 * 
 * USER INTERFACE:
 * - Intuitive configuration forms
 * - Real-time validation feedback
 * - Configuration preview and testing
 * - Import/export configuration files
 * - Responsive design for admin workflows
 * 
 * INTEGRATION POINTS:
 * - AI Factory for model instantiation
 * - Configuration service for settings persistence
 * - Monitoring service for performance tracking
 * - Audit service for change logging
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
import React from 'react';
import { AIModelManager } from '@/components/ai-setup/AIModelManager';

export const AISetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <AIModelManager />
    </div>
  );
};

export default AISetupPage; 
