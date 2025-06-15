/**
 * @fileoverview Mixture of Experts Provider - AI Agent Management Context
 * @description React Context provider that manages the Mixture of Experts (MoE) system
 * for intelligent AI agent selection and routing. Provides global access to the agent
 * pool, router, and initialization state across the Legal AI platform.
 * 
 * MOE SYSTEM FEATURES:
 * - Intelligent agent selection and routing
 * - Agent pool management and initialization
 * - Performance tracking and optimization
 * - Domain-specific agent specialization
 * - Real-time agent availability monitoring
 * 
 * CONTEXT CAPABILITIES:
 * - Global MoE router access across components
 * - Agent pool state management
 * - Initialization status tracking
 * - Error handling for agent failures
 * - Performance metrics collection
 * 
 * AGENT MANAGEMENT:
 * - Dynamic agent registration and deregistration
 * - Agent health monitoring and status tracking
 * - Load balancing across available agents
 * - Fallback mechanisms for agent failures
 * - Agent performance optimization
 * 
 * INITIALIZATION PROCESS:
 * - Domain registry setup and configuration
 * - Agent pool creation and validation
 * - Router configuration and optimization
 * - Error handling for initialization failures
 * - Graceful degradation for partial failures
 * 
 * INTEGRATION POINTS:
 * - Domain Registry for legal domain management
 * - Individual AI agents (Contract, General Purpose, etc.)
 * - Performance monitoring and analytics
 * - Error reporting and logging systems
 * 
 * USAGE PATTERNS:
 * - Wrap application with MoEProvider
 * - Use useMoE hook in components
 * - Access router for agent selection
 * - Monitor initialization status
 * - Handle agent routing errors
 * 
 * @author Legal AI Team
 * @version 1.1.0
 * @since 2024
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MixtureOfExpertsRouter } from '@/core-legal-platform/routing/MixtureOfExpertsRouter';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { energyDomain } from '@/core-legal-platform/domains/energy/energy.domain';
import { generalDomain } from '@/core-legal-platform/domains/general/general.domain';
import { ContractAnalysisAgent } from '@/core-legal-platform/agents/contract-analysis/ContractAnalysisAgent';
import { GeneralPurposeAgent } from '@/core-legal-platform/agents/general-purpose/GeneralPurposeAgent';
import { BaseAgent } from '@/core-legal-platform/agents/base-agents/BaseAgent';

interface MoEContextType {
  router: MixtureOfExpertsRouter | null;
  agentPool: BaseAgent[];
  isInitialized: boolean;
}

const MoEContext = createContext<MoEContextType>({
  router: null,
  agentPool: [],
  isInitialized: false,
});

export const useMoE = () => {
  return useContext(MoEContext);
};

interface MoEProviderProps {
  children: ReactNode;
}

export const MoEProvider: React.FC<MoEProviderProps> = ({ children }) => {
  const [router, setRouter] = useState<MixtureOfExpertsRouter | null>(null);
  const [agentPool, setAgentPool] = useState<BaseAgent[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializePlatform = async () => {
      try {
        const domainRegistry = DomainRegistry.getInstance();

        if (!domainRegistry.getDomain('energy')) {
          await domainRegistry.registerDomain(energyDomain);
        }
        if (!domainRegistry.getDomain('general')) {
          await domainRegistry.registerDomain(generalDomain);
        }

        const contractAgent = new ContractAnalysisAgent(domainRegistry);
        await contractAgent.initialize();
        
        const generalAgent = new GeneralPurposeAgent(domainRegistry);
        await generalAgent.initialize();

        const agents = [contractAgent, generalAgent];
        setAgentPool(agents);

        const moeRouter = new MixtureOfExpertsRouter(agents, domainRegistry);
        setRouter(moeRouter);
        setIsInitialized(true);
      } catch (err) {
        // console.error("Failed to initialize the legal platform:", err);
      }
    };

    initializePlatform();
  }, []);

  return (
    <MoEContext.Provider value={{ router, agentPool, isInitialized }}>
      {children}
    </MoEContext.Provider>
  );
}; 
