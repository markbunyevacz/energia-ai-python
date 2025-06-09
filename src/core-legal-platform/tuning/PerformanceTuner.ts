import { MixtureOfExpertsRouter } from '../routing/MixtureOfExpertsRouter';
import { BaseAgent } from '../agents/base-agents/BaseAgent';
import { ImprovementPlan, ImprovementAction } from '../feedback/types';
import { AgentConfig } from '../agents/base-agents/BaseAgent';

/**
 * The PerformanceTuner service is responsible for automatically adjusting agent
 * configurations and router scores based on generated improvement plans.
 */
export class PerformanceTuner {
  private moeRouter: MixtureOfExpertsRouter;
  private agentPool: Map<string, BaseAgent>;

  constructor(moeRouter: MixtureOfExpertsRouter, agentPool: Map<string, BaseAgent>) {
    this.moeRouter = moeRouter;
    this.agentPool = agentPool;
  }

  /**
   * Processes an improvement plan and applies the specified actions.
   * @param plan - The improvement plan to execute.
   */
  public async applyImprovementPlan(plan: ImprovementPlan): Promise<void> {
    console.log(`[Tuner] Applying improvement plan for agent: ${plan.agentId}`);
    for (const action of plan.actions) {
      await this.executeAction(plan.agentId, action);
    }
  }

  /**
   * Executes a single improvement action.
   * @param agentId - The ID of the agent to modify.
   * @param action - The improvement action to perform.
   */
  private async executeAction(agentId: string, action: ImprovementAction): Promise<void> {
    const agent = this.agentPool.get(agentId);
    if (!agent) {
      console.error(`[Tuner] Agent with ID ${agentId} not found in pool.`);
      return;
    }

    switch (action.type) {
      case 'ADJUST_ROUTING_SCORE':
        this.adjustRoutingScore(agentId, action.payload as { adjustment: number });
        break;
      case 'MODIFY_SYSTEM_PROMPT':
        await this.modifyAgentConfig(agent, { metadata: { systemPrompt: action.payload.prompt } });
        break;
      case 'FLAG_FOR_MANUAL_REVIEW':
        this.flagForManualReview(agentId, action.description);
        break;
      // Other cases like 'UPDATE_FINETUNING_DATA' would require more complex integration.
      default:
        console.warn(`[Tuner] Unhandled action type: ${action.type}`);
    }
  }

  /**
   * Adjusts the routing score for a specific agent in the MoE router.
   * @param agentId - The agent's ID.
   * @param payload - The data for the adjustment (e.g., { adjustment: 0.1 }).
   */
  private adjustRoutingScore(agentId: string, payload: { adjustment: number }): void {
    console.log(`[Tuner] Adjusting routing score for ${agentId} by ${payload.adjustment}`);
    // This method needs to be implemented in MixtureOfExpertsRouter
    // this.moeRouter.adjustAgentScore(agentId, payload.adjustment);
  }

  /**
   * Modifies the configuration of an agent.
   * @param agent - The agent instance to modify.
   * @param configUpdate - The partial configuration to update.
   */
  private async modifyAgentConfig(agent: BaseAgent, configUpdate: Partial<AgentConfig>): Promise<void> {
    console.log(`[Tuner] Modifying config for ${agent.getConfig().id}`, configUpdate);
    await agent.updateConfig(configUpdate);
  }

  /**
   * Flags an agent for manual review. In a real system, this would create a ticket
   * or send a notification.
   * @param agentId - The agent's ID.
   * @param reason - The reason for flagging.
   */
  private flagForManualReview(agentId: string, reason: string): void {
    console.log(`[Tuner] 🚩 Agent ${agentId} flagged for manual review: ${reason}`);
    // Integration with a ticketing system (e.g., Jira, Slack) would go here.
  }
} 