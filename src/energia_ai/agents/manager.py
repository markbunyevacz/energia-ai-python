import structlog
from typing import Dict, Optional, Type
from .base import BaseAgent


logger = structlog.get_logger(__name__)


class AgentManager:
    """
    Manages the registration, retrieval, and lifecycle of all agents.
    """

    def __init__(self):
        self._agents: Dict[str, BaseAgent] = {}
        logger.info("AgentManager initialized.")

    def register_agent(self, agent: BaseAgent):
        """
        Registers a new agent instance with the manager.

        Args:
            agent: An instance of a class that inherits from BaseAgent.
        """
        if agent.agent_name in self._agents:
            logger.warning("Agent already registered. Overwriting.", agent_name=agent.agent_name)
        self._agents[agent.agent_name] = agent
        logger.info("Agent registered successfully.", agent_name=agent.agent_name)

    def get_agent(self, agent_name: str) -> Optional[BaseAgent]:
        """
        Retrieves a registered agent by its name.

        Args:
            agent_name: The name of the agent to retrieve.

        Returns:
            An instance of the agent, or None if not found.
        """
        agent = self._agents.get(agent_name)
        if not agent:
            logger.error("Attempted to retrieve an unregistered agent.", agent_name=agent_name)
        return agent

    def list_agents(self) -> Dict[str, str]:
        """Returns a dictionary of registered agents and their descriptions."""
        return {name: agent.agent_description for name, agent in self._agents.items()}

    async def route_task(self, agent_name: str, query: str, context: Optional[Dict] = None):
        """
        Routes a task to the specified agent for execution.

        Args:
            agent_name: The name of the target agent.
            query: The query or task for the agent.
            context: Additional context for the agent.

        Returns:
            The result from the agent's execute method.
        """
        agent = self.get_agent(agent_name)
        if not agent:
            raise ValueError(f"Agent '{agent_name}' not found.")

        logger.info("Routing task to agent.", agent_name=agent_name, query=query)
        return await agent.execute(query, context)


# Singleton instance
agent_manager = AgentManager() 