/**
 * @fileoverview Main Dashboard Component - Personalized Legal Intelligence Hub
 * @description Central dashboard that provides real-time legal insights, proactive recommendations,
 * and actionable intelligence for legal professionals and analysts.
 * 
 * CORE FUNCTIONALITY:
 * - Real-time legal change monitoring via Supabase subscriptions
 * - Proactive recommendations based on user context and document analysis
 * - Legal change alerts with impact assessment
 * - Actionable insights dashboard with prioritized tasks
 * 
 * REAL-TIME FEATURES:
 * - PostgreSQL change detection via Supabase realtime
 * - Automatic UI updates when legal_change_events are modified
 * - Live notification system for critical legal updates
 * 
 * COMPONENT ARCHITECTURE:
 * - Grid-based responsive layout (3-column on large screens)
 * - Modular component structure for easy maintenance
 * - Real-time subscription management with cleanup
 * 
 * CHILD COMPONENTS:
 * - LegalChangeAlerts: Displays recent legal changes with impact levels
 * - ProactiveRecommendations: AI-powered suggestions based on user activity
 * - ActionableInsights: Prioritized tasks and required actions
 * 
 * DATA SOURCES:
 * - legal_change_events table (Supabase)
 * - User activity patterns
 * - Document analysis results
 * - AI-generated recommendations
 * 
 * CURRENT STATUS: 
 * - Real-time subscriptions: ✅ Implemented
 * - Component rendering: ✅ Implemented  
 * - Data fetching: 🔄 Partially mocked (needs backend integration)
 * - AI recommendations: 🔄 Placeholder implementation
 * 
 * @author Legal AI Team
 * @version 1.0.0
 * @since 2024
 */
import React, { useEffect, useState } from 'react';
import ProactiveRecommendations from '@/components/Dashboard/ProactiveRecommendations';
import LegalChangeAlerts from '@/components/Dashboard/LegalChangeAlerts';
import ActionableInsights from '@/components/Dashboard/ActionableInsights';
import { supabase } from '@/lib/supabase';

const Dashboard: React.FC = () => {
  const [, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const channel = supabase
      .channel('realtime-legal-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'legal_change_events' },
        (payload) => {
          // console.log('Change received!', payload);
          // For now, just re-render the component to simulate an update.
          // A more robust implementation would fetch the new data and update the state.
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Your Personalized Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LegalChangeAlerts />
        </div>
        <div className="lg:col-span-1">
          <ProactiveRecommendations />
        </div>
        <div className="lg:col-span-3">
          <ActionableInsights />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
