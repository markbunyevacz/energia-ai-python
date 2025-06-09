import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { FeedbackService } from '@/core-legal-platform/feedback/FeedbackService';
import { FeedbackAnalysis } from '@/core-legal-platform/feedback/types';
import { subDays } from 'date-fns';

export function AdminDashboard() {
  const [feedbackService] = useState(() => new FeedbackService(supabase));
  const [analysis, setAnalysis] = useState<FeedbackAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedbackAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real app, you would get a list of agent IDs
        const agentIds = ['ContractAnalysisAgent', 'GeneralPurposeAgent']; 
        const timeRange = {
          startDate: subDays(new Date(), 30),
          endDate: new Date(),
        };

        const analyses = await Promise.all(
          agentIds.map(id => feedbackService.analyzeFeedback(id, timeRange))
        );
        
        setAnalysis(analyses);
      } catch (err: any) {
        setError(err.message || 'Hiba történt az elemzések betöltése közben.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbackAnalysis();
  }, [feedbackService]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Műszerfal: Visszajelzések</h1>
      
      {loading && <p>Betöltés...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {analysis.map(agentAnalysis => (
          <Card key={agentAnalysis.agentId}>
            <CardHeader>
              <CardTitle>{agentAnalysis.agentId}</CardTitle>
              <CardDescription>
                Az elmúlt 30 nap teljesítménye
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Elégedettségi mutató</h4>
                <p className="text-2xl font-bold">
                  {(agentAnalysis.satisfactionScore * 100).toFixed(1)}%
                </p>
                <span className="text-sm text-muted-foreground">
                  ({agentAnalysis.feedbackCount} visszajelzés alapján)
                </span>
              </div>
              <div>
                <h4 className="font-semibold">Átlagos válaszidő</h4>
                <p className="text-2xl font-bold">
                  {agentAnalysis.performanceMetrics.averageResponseTimeMs.toFixed(0)} ms
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Visszajelzések kategóriánként</h4>
                <ul className="list-disc list-inside text-sm">
                  {Object.entries(agentAnalysis.categoryBreakdown).map(([category, count]) => (
                    <li key={category}>
                      {category}: {count}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 