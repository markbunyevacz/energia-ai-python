import React, { useEffect, useState } from 'react';
import { PersonalizationService } from '@/core-legal-platform/personalization/PersonalizationService';

interface Insight {
  id: string;
  text: string;
}

const personalizationService = new PersonalizationService();
const FAKE_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Placeholder user ID

const ActionableInsights: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const domains = await personalizationService.getTopUserDomains(FAKE_USER_ID);
        const domainInsights = domains.map(d => ({
          id: d.domain,
          text: `You have ${d.count} documents related to ${d.domain}. Would you like to review them?`
        }));
        setInsights(domainInsights);
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      }
      setLoading(false);
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Actionable Insights</h2>
        <p>Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Actionable Insights</h2>
      <div className="flex flex-col space-y-3">
        {insights.length === 0 ? (
          <p>No specific insights for you at this time.</p>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="w-3 h-3 rounded-full mr-4 bg-blue-500"></span>
              <p className="flex-grow text-gray-800">{insight.text}</p>
              <button
                onClick={() => alert(`Navigating to documents tagged with ${insight.id}...`)}
                className="ml-4 px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                View
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActionableInsights; 