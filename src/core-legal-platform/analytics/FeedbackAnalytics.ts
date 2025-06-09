import { supabase } from '@/integrations/supabase/client';
import { FeedbackService } from '../feedback/FeedbackService';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import {
  FeedbackAnalysis,
  DateRange,
} from '../feedback/types';

// A simple structure for a report
export interface PerformanceReport {
  title: string;
  dateRange: DateRange;
  agentPerformances: FeedbackAnalysis[];
  summary: string;
  anomalies: string[];
}

/**
 * Service for generating automated reports and analytics on agent performance
 * based on user feedback.
 */
export class FeedbackAnalytics {
  private feedbackService: FeedbackService;

  constructor() {
    // Assuming a singleton or easily accessible instance of FeedbackService
    this.feedbackService = new FeedbackService(supabase);
  }

  /**
   * Generates a daily performance report for all agents.
   */
  public async generateDailyReport(): Promise<PerformanceReport> {
    const today = new Date();
    const dateRange = {
      startDate: startOfDay(subDays(today, 1)),
      endDate: endOfDay(subDays(today, 1)),
    };
    
    return this.generateReportForDateRange('Napi Teljesítményriport', dateRange);
  }

  /**
   * Generates a weekly performance report for all agents.
   */
  public async generateWeeklyReport(): Promise<PerformanceReport> {
    const today = new Date();
    const dateRange = {
      startDate: startOfDay(subDays(today, 7)),
      endDate: endOfDay(subDays(today, 1)),
    };

    return this.generateReportForDateRange('Heti Teljesítményriport', dateRange);
  }
  
  /**
   * Generic report generation logic.
   * @param title - The title of the report.
   * @param dateRange - The date range for the report.
   */
  private async generateReportForDateRange(title: string, dateRange: DateRange): Promise<PerformanceReport> {
    console.log(`[Analytics] Generating report: "${title}" for ${format(dateRange.startDate, 'yyyy-MM-dd')} to ${format(dateRange.endDate, 'yyyy-MM-dd')}`);
    
    // In a real application, you would fetch all active agent IDs
    const agentIds = ['ContractAnalysisAgent', 'GeneralPurposeAgent']; 
    
    const agentPerformances = await Promise.all(
      agentIds.map(id => this.feedbackService.analyzeFeedback(id, dateRange))
    );

    const summary = this.summarizePerformance(agentPerformances);
    const anomalies = this.detectAnomalies(agentPerformances);

    return {
      title,
      dateRange,
      agentPerformances,
      summary,
      anomalies,
    };
  }

  /**
   * Creates a high-level summary of the performance data.
   */
  private summarizePerformance(analyses: FeedbackAnalysis[]): string {
    const totalFeedback = analyses.reduce((sum, a) => sum + a.feedbackCount, 0);
    const averageSatisfaction = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.satisfactionScore, 0) / analyses.length
      : 0;

    return `Összesen ${totalFeedback} visszajelzés érkezett. Az átlagos elégedettségi mutató ${(averageSatisfaction * 100).toFixed(1)}%.`;
  }

  /**
   * Placeholder for anomaly detection logic.
   */
  private detectAnomalies(analyses: FeedbackAnalysis[]): string[] {
    const anomalies: string[] = [];
    for (const analysis of analyses) {
      // Example rule: flag agent if satisfaction drops below 50% with significant feedback
      if (analysis.satisfactionScore < 0.5 && analysis.feedbackCount > 10) {
        anomalies.push(
          `Figyelem: A(z) "${analysis.agentId}" ügynök elégedettségi mutatója (${(analysis.satisfactionScore * 100).toFixed(1)}%) alacsony.`
        );
      }
      // Example rule: flag agent for high volume of "Inaccurate" feedback
      const inaccurateRatio = analysis.categoryBreakdown['Inaccurate Information'] / analysis.feedbackCount;
      if (inaccurateRatio > 0.4 && analysis.feedbackCount > 5) {
        anomalies.push(
          `Figyelem: A(z) "${analysis.agentId}" ügynök sok "Pontatlan" visszajelzést kap.`
        );
      }
    }
    return anomalies;
  }
} 