import { BaseAgent } from './base-agents/BaseAgent';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {}

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public registerAgent(agent: BaseAgent): void {
    const agentId = agent.getConfig().id;
    if (this.agents.has(agentId)) {
      throw new Error(`Agent with id ${agentId} is already registered.`);
    }
    this.agents.set(agentId, agent);
  }

  public getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }

  public listAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
} 