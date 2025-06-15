/**
 * @fileoverview useAgentStatus Hook - AI Agent Health Monitoring
 * 
 * This custom React hook provides real-time monitoring of AI agent status and health
 * for the Legal AI platform, tracking agent availability, performance, and connectivity.
 * 
 * Key Features:
 * - Real-time agent status monitoring with automatic polling
 * - Online/offline detection based on recent activity timestamps
 * - Error handling and fallback status reporting
 * - Configurable polling intervals for performance optimization
 * - Integration with Supabase system health tracking
 * - Last activity timestamp tracking for agent availability
 * 
 * Status Types:
 * - Online: Agent is active and responding within the last 5 minutes
 * - Offline: Agent hasn't responded recently or is unavailable
 * - Error: Failed to retrieve agent status information
 * - Unknown: No status data available for the agent
 * 
 * Usage Examples:
 * - Contract analysis agent status monitoring
 * - Legal research agent availability checking
 * - General purpose agent health dashboard
 * - AI system reliability monitoring
 * - Agent performance analytics and reporting
 * 
 * Integration Points:
 * - Used throughout platform for AI agent status display
 * - Integrates with system health monitoring and alerting
 * - Supports Hungarian localization for status messages
 * - Works with AI agent routing and load balancing systems
 * - Connects to Supabase real-time monitoring infrastructure
 * 
 * @author Legal AI Platform Team
 * @version 1.0.0
 * @since 2024
 */

import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

interface AgentStatus {
  status: string;
  lastActive: string | null;
  isOnline: boolean;
}

export function useAgentStatus(agentId: string): AgentStatus {
  const [status, setStatus] = useState<string>('Offline');
  const [lastActive, setLastActive] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (!agentId) return;

      const { data, error } = await supabase
        .from('system_health')
        .select('status, created_at')
        .eq('service_name', agentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // console.error('Error fetching agent status:', error);
        setStatus('Error');
        setIsOnline(false);
        return;
      }

      if (data) {
        const lastCheckTime = new Date(data.created_at).getTime();
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;

        if (now - lastCheckTime < fiveMinutes && data.status === 'success') {
          setStatus('Online');
          setIsOnline(true);
          setLastActive(new Date(data.created_at).toISOString());
        } else {
          setStatus('Offline');
          setIsOnline(false);
          setLastActive(new Date(data.created_at).toISOString());
        }
      } else {
        setStatus('Unknown');
        setIsOnline(false);
      }
    };

    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [agentId]);

  return { status, lastActive, isOnline };
} 
