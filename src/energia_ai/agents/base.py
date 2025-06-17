from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class AgentResult:
    """Standardized result format from an agent execution."""
    status: str  # e.g., 'completed', 'failed', 'in_progress'
    output: Any
    error: Optional[str] = None
    metadata: Dict[str, Any] = None


class BaseAgent(ABC):
    """
    Abstract Base Class for all specialized agents in the Energia AI system.

    This class defines the common interface and lifecycle that all agents must adhere to,
    ensuring consistency and interoperability within the agentic framework.
    """
    agent_name: str
    agent_description: str

    @abstractmethod
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """
        The main execution method for the agent.

        Args:
            query: The primary input or question for the agent to process.
            context: Optional dictionary containing additional data, state, or configuration
                     needed for the execution.

        Returns:
            An AgentResult object containing the output and status of the execution.
        """
        pass

    def get_info(self) -> Dict[str, str]:
        """Returns metadata about the agent."""
        return {
            "name": self.agent_name,
            "description": self.agent_description,
        } 