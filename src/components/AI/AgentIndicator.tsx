import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Search, Shield } from 'lucide-react';
import { BaseAgent } from '@/core-legal-platform/agents/base-agents/BaseAgent';

interface AgentIndicatorProps {
  agent: BaseAgent;
  confidence: number;
}

export function AgentIndicator({ agent, confidence }: AgentIndicatorProps) {
  const getAgentConfig = (agentId: string) => {
    const configs: { [key: string]: { icon: React.ElementType, label: string, color: string } } = {
      'contract-analysis': {
        icon: FileText,
        label: 'Szerződés Ágens',
        color: 'bg-blue-100 text-blue-800'
      },
      'legal-research': {
        icon: Search,
        label: 'Jogi Kutatás Ágens',
        color: 'bg-green-100 text-green-800'
      },
      'compliance': {
        icon: Shield,
        label: 'Megfelelőségi Ágens',
        color: 'bg-orange-100 text-orange-800'
      },
      'general-purpose': {
        icon: Brain,
        label: 'Általános Ágens',
        color: 'bg-gray-100 text-gray-800'
      }
    };

    return configs[agentId] || configs['general-purpose'];
  };

  const config = getAgentConfig(agent.getConfig().id);
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border">
      <Icon className="w-5 h-5 text-mav-blue" />
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <Badge className={config.color}>
            {config.label}
          </Badge>
          <Badge variant="outline">
            {Math.round(confidence * 100)}% megbízhatóság
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mt-1">{agent.getConfig().description}</p>
      </div>
    </div>
  );
}
