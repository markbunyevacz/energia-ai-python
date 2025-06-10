import React, { useEffect, useState } from 'react';
import { PersonalizationService } from '@/core-legal-platform/personalization/PersonalizationService';

interface Recommendation {
  id: string;
  title: string;
  summary: string;
  link: string;
}

const personalizationService = new PersonalizationService();
const FAKE_USER_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Placeholder user ID

const ProactiveRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const recs = await personalizationService.getProactiveRecommendations(FAKE_USER_ID);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      }
      setLoading(false);
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Proactive Recommendations</h2>
        <p>Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Proactive Recommendations</h2>
      <ul className="space-y-4">
        {recommendations.length === 0 ? (
          <p>No specific recommendations for you at this time.</p>
        ) : (
          recommendations.map((rec) => (
            <li key={rec.id} className="border-b pb-4 last:border-b-0">
              <h3 className="font-semibold">{rec.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{rec.summary}</p>
              <a href={rec.link} className="text-blue-500 hover:underline text-sm mt-2 inline-block">
                Learn more
              </a>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ProactiveRecommendations; 