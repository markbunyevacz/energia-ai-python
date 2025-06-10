import React, { useEffect, useState } from 'react';
import ProactiveRecommendations from '@/components/Dashboard/ProactiveRecommendations';
import LegalChangeAlerts from '@/components/Dashboard/LegalChangeAlerts';
import ActionableInsights from '@/components/Dashboard/ActionableInsights';
import { supabase } from '@/lib/supabase';

const Dashboard: React.FC = () => {
  const [_, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const channel = supabase
      .channel('realtime-legal-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'legal_change_events' },
        (payload) => {
          console.log('Change received!', payload);
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