import { AgentRegistry } from './AgentRegistry';
import { CrossDomainImpactAnalyzer } from './impact-analysis/CrossDomainImpactAnalyzer';

export function initializeAgents(): void {
  const agentRegistry = AgentRegistry.getInstance();

  // Register all agents here
  const crossDomainImpactAnalyzer = new CrossDomainImpactAnalyzer({
    id: 'cross-domain-impact-analyzer',
    name: 'Cross-Domain Impact Analyzer',
    description: 'Analyzes the impact of legal documents across different domains.',
    domainCode: 'energy', // This should be configurable
    enabled: true,
  });

  agentRegistry.registerAgent(crossDomainImpactAnalyzer);

  console.log('Agents initialized and registered.');
} 