import structlog
import json
from typing import Any, Dict, Optional

from energia_ai.agents.base import BaseAgent, AgentResult
from energia_ai.ai.claude_client import get_claude_client, ClaudeClient

logger = structlog.get_logger(__name__)


class TaskUnderstandingAgent(BaseAgent):
    """
    An agent specialized in parsing natural language queries into a structured,
    machine-readable execution plan.
    """
    agent_name = "task_understanding_agent"
    agent_description = "Parses user queries to determine intent and create an execution plan."

    def __init__(self, claude_client: ClaudeClient = None):
        self._claude_client = claude_client

    async def _get_client(self) -> ClaudeClient:
        if self._claude_client is None:
            self._claude_client = await get_claude_client()
        return self._claude_client

    def _build_prompt(self, query: str) -> str:
        """Builds the prompt for the LLM to parse the query."""
        return f"""
You are a specialized AI assistant responsible for parsing user requests into a structured, multi-step plan.
Analyze the following user query and break it down into a JSON object representing the plan.

The plan should have a "steps" array. Each step must have an "agent" name and a "query" for that agent.
Available agents and their functions:
- "information_retrieval_agent": Searches for and retrieves legal documents. Use for queries about finding laws.
- "document_analysis_agent": Analyzes the content of a specific document. Use for queries about summarizing or extracting info from a provided text.
- "comparison_agent": Compares two or more legal documents.

User Query: "{query}"

Based on the query, generate a JSON object with the execution plan. For example:
- For a query like "Find the latest environmental protection law", the plan might be:
  `{{"plan": {{"steps": [{{"agent": "information_retrieval_agent", "query": "latest environmental protection law"}}]}}}}`
- For a query like "Summarize the document I uploaded about contract law", the plan might be:
  `{{"plan": {{"steps": [{{"agent": "document_analysis_agent", "query": "Summarize the document on contract law"}}]}}}}`

The output MUST be only the JSON object, with no other text.
"""

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None) -> AgentResult:
        """
        Uses an LLM to parse the query and generate an execution plan.
        """
        client = await self._get_client()
        prompt = self._build_prompt(query)

        logger.info("Executing TaskUnderstandingAgent", query=query)

        try:
            # Using a generic call to Claude, assuming a method like 'generate_text' exists
            # This will be adapted based on the actual ClaudeClient implementation
            response = await client.client.messages.create(
                model=client.model,
                max_tokens=1024,
                temperature=0.0,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            response_text = response.content[0].text
            
            # Clean up the response to get only the JSON
            json_text = response_text.strip()
            if json_text.startswith("```json"):
                json_text = json_text[7:]
            if json_text.endswith("```"):
                json_text = json_text[:-3]

            parsed_plan = json.loads(json_text)
            logger.info("Successfully parsed query into a plan.", plan=parsed_plan)
            return AgentResult(status="completed", output=parsed_plan)

        except json.JSONDecodeError as e:
            logger.error("Failed to parse LLM response as JSON.", error=str(e), response_text=response_text)
            return AgentResult(status="failed", output=None, error=f"JSON Decode Error: {e}")
        except Exception as e:
            logger.error("An unexpected error occurred during task understanding.", error=str(e))
            return AgentResult(status="failed", output=None, error=str(e)) 