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
        console.error('Error fetching agent status:', error);
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