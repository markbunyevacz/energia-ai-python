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
        console.error('Error fetching legal change events:', error);
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