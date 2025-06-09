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
        console.error("Failed to initialize the legal platform:", err);
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