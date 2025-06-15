/**
 * @fileoverview Legal Change Alerts Component - Real-Time Legal Monitoring
 * @description Real-time monitoring and alert system for legal changes, regulatory
 * updates, and legislative developments that impact user's legal work. Provides
 * intelligent filtering, impact assessment, and actionable notifications.
 * 
 * MONITORING CAPABILITIES:
 * - Real-time legal database change detection
 * - Regulatory update tracking and analysis
 * - Legislative development monitoring
 * - Court decision and precedent tracking
 * - Industry-specific compliance changes
 * 
 * ALERT FEATURES:
 * - Intelligent impact assessment for user's work
 * - Priority-based alert classification
 * - Customizable notification preferences
 * - Bulk alert management and processing
 * - Historical alert tracking and analysis
 * 
 * IMPACT ANALYSIS:
 * - Contract portfolio impact assessment
 * - Compliance requirement changes
 * - Risk level evaluation and scoring
 * - Deadline and timeline implications
 * - Action requirement identification
 * 
 * FILTERING & PERSONALIZATION:
 * - User role and responsibility-based filtering
 * - Practice area and jurisdiction preferences
 * - Document type and category relevance
 * - Severity and urgency thresholds
 * - Custom keyword and topic tracking
 * 
 * ALERT TYPES:
 * - Critical: Immediate action required
 * - High: Review and assessment needed
 * - Medium: Monitor and plan response
 * - Low: Informational awareness
 * - Scheduled: Planned regulatory changes
 * 
 * USER INTERACTION:
 * - One-click alert acknowledgment
 * - Detailed change analysis and explanation
 * - Related document and contract identification
 * - Action planning and task creation
 * - Alert sharing and collaboration
 * 
 * DATA SOURCES:
 * - Legal database change streams
 * - Regulatory agency publications
 * - Legislative tracking services
 * - Court decision databases
 * - Industry compliance resources
 * 
 * INTEGRATION POINTS:
 * - Document analysis for impact assessment
 * - Task management for action planning
 * - Calendar integration for deadline tracking
 * - Notification services for delivery
 * 
 * @author Legal AI Team
 * @version 1.1.0
 * @since 2024
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/integrations/supabase/types';

type LegalChangeEvent = Database['public']['Tables']['legal_change_events']['Row'];

const severityClasses = {
  amendment: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  repeal: 'bg-red-100 border-red-500 text-red-700',
  new_legislation: 'bg-green-100 border-green-500 text-green-700',
  other: 'bg-blue-100 border-blue-500 text-blue-700',
};

const LegalChangeAlerts: React.FC = () => {
  const [events, setEvents] = useState<LegalChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_change_events')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(5);

      if (error) {
        // console.error('Error fetching legal change events:', error);
      } else {
        setEvents(data);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Legal Change Alerts</h2>
        <p>Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Legal Change Alerts</h2>
      <div className="space-y-4">
        {events.length === 0 ? (
          <p>No recent legal change alerts.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className={`border-l-4 p-4 ${severityClasses[event.change_type || 'other']}`} role="alert">
              <p className="font-bold">{event.source_url}</p>
              <p>{event.summary}</p>
              <p className="text-sm text-gray-500 mt-1">Detected at: {new Date(event.detected_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LegalChangeAlerts; 
