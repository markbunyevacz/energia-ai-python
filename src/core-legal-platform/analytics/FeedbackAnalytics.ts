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
    // console.log(`[Analytics] Generating report: "${title}" for ${format(dateRange.startDate, 'yyyy-MM-dd')} to ${format(dateRange.endDate, 'yyyy-MM-dd')}`);
    
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
   * Detects anomalies in agent performance based on a set of predefined rules.
   * A more advanced implementation could use statistical methods (e.g., standard deviation)
   * to identify outliers, but this rule-based approach is effective for clear-cut issues.
   */
  private detectAnomalies(analyses: FeedbackAnalysis[]): string[] {
    const anomalies: string[] = [];

    // Calculate overall average response time to use as a benchmark
    const allResponseTimes = analyses.map(a => a.performanceMetrics.averageResponseTimeMs).filter(t => t > 0);
    const overallAverageTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
      : 0;

    for (const analysis of analyses) {
      // Rule 1: Flag agent if satisfaction drops below 50% with significant feedback
      if (analysis.satisfactionScore < 0.5 && analysis.feedbackCount > 10) {
        anomalies.push(
          `Alacsony elégedettség: A(z) "${analysis.agentId}" ügynök elégedettségi mutatója (${(analysis.satisfactionScore * 100).toFixed(1)}%) alacsony.`
        );
      }
      
      // Rule 2: Flag agent for high volume of "Inaccurate" feedback
      const inaccurateRatio = analysis.feedbackCount > 0
        ? (analysis.categoryBreakdown['Inaccurate Information'] || 0) / analysis.feedbackCount
        : 0;
      if (inaccurateRatio > 0.4 && analysis.feedbackCount > 5) {
        anomalies.push(
          `Sok pontatlan visszajelzés: A(z) "${analysis.agentId}" ügynök sok "Pontatlan" visszajelzést kap.`
        );
      }

      // Rule 3: Flag agent for significantly higher response times than average
      if (overallAverageTime > 0 && analysis.performanceMetrics.averageResponseTimeMs > overallAverageTime * 2 && analysis.performanceMetrics.averageResponseTimeMs > 2000) {
        anomalies.push(
          `Lassú válaszidő: A(z) "${analysis.agentId}" ügynök átlagos válaszideje (${analysis.performanceMetrics.averageResponseTimeMs.toFixed(0)}ms) jelentősen meghaladja az átlagot.`
        );
      }
    }
    return anomalies;
  }
} 
