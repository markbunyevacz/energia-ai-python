"""
This file implements a DSPy agent that uses tools from an MCP server
to act as an airline customer service agent.
"""

import asyncio
import os

import dspy
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="python",
    args=["enhancements/mcp_server.py"],
    env=None,
)

class DSPyAirlineCustomerService(dspy.Signature):
    """You are an airline customer service agent. You are given a list of tools to handle user requests.
    You should decide the right tool to use in order to fulfill users' requests."""

    user_request: str = dspy.InputField()
    process_result: str = dspy.OutputField(
        desc=(
            "Message that summarizes the process result, and the information users need, "
            "e.g., the confirmation_number if it's a flight booking request."
        )
    )

async def run_agent(user_request: str):
    """Connects to the MCP server, sets up the agent, and runs the request."""
    # It's recommended to load API keys from a secure configuration,
    # not from environment variables directly in the code.
    # For example, using the project's settings management:
    # from src.energia_ai.config.settings import settings
    # os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
    if not os.environ.get("OPENAI_API_KEY"):
        print("Please set the OPENAI_API_KEY environment variable.")
        return

    # Configure DSPy to use an LM. The tutorial uses OpenAI.
    # For this project, you might use Claude like this:
    # from src.energia_ai.config.settings import settings
    # claude = dspy.Claude(model='claude-3-opus-20240229', api_key=settings.ANTHROPIC_API_KEY)
    # dspy.configure(lm=claude)
    dspy.configure(lm=dspy.OpenAI(model="gpt-4o-mini"))

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            
            mcp_tools = await session.list_tools()

            dspy_tools = [dspy.Tool.from_mcp_tool(session, tool) for tool in mcp_tools.tools]
            
            agent = dspy.ReAct(DSPyAirlineCustomerService, tools=dspy_tools)

            result = await agent.acall(user_request=user_request)
            print(result.process_result)

async def main():
    """Main function to run the MCP agent demo."""
    print("--- Running MCP Agent Demo ---")
    await run_agent("please help me book a flight from SFO to JFK on 09/01/2025, my name is Adam")

if __name__ == "__main__":
    asyncio.run(main()) 