The `AIAgentRouter` is responsible for receiving a user query and routing it to the most appropriate specialized agent based on keywords and context. See `DATA_FLOW.md` for a visual representation.

## 3. Roster of Specialized Agents

This section documents the primary specialized agents that extend the `BaseAgent`.

### 3.1. `ContractAnalysisAgent`

-   **Agent Type**: `contract`
-   **File Location**: `src/core-legal-platform/agents/contract-analysis/ContractAnalysisAgent.ts`
-   **Purpose**: This is a highly specialized agent designed to perform in-depth analysis of legal contracts. It is the designated agent for all queries related to contract review, risk assessment, and compliance checking.
-   **Key Functionalities**:
    -   **Risk Highlighting**: Identifies potential risks, ambiguities, and missing clauses in a contract.
    -   **Compliance Checking**: Suggests improvements to ensure the contract complies with relevant regulations.
    -   **Clause Extraction**: (Future capability) Can extract and summarize specific clauses.
-   **Associated Domains**: This agent is primarily associated with domains that have a heavy emphasis on contracts, such as the `energy` domain.

## 4. Mixture-of-Experts (MoE) Routing

To achieve a higher degree of accuracy and flexibility, the system is moving from a simple keyword-based router to a Mixture-of-Experts (MoE) model. This new router will be located at `src/core-legal-platform/routing/MixtureOfExpertsRouter.ts`.

### 4.1. Core Logic

The MoE router treats each specialized agent as an "expert." Instead of routing a query to a single agent, the MoE router evaluates the query against all available experts and returns a ranked list of the most suitable agents, each with a confidence score. This allows the UI to present multiple options to the user or even combine the outputs of multiple agents for a more comprehensive answer.

### 4.2. Scoring Model

The router will use a weighted scoring model to rank each agent. The final confidence score for an agent is a combination of several factors:

1.  **Keyword Score (Weight: 0.5)**: The existing keyword matching logic. This provides a strong baseline for relevance based on the query text itself.

2.  **Context Score (Weight: 0.3)**: This score boosts agents whose domain aligns with the context of the query.
    -   **Document Type**: If the `documentTypes` in the `AgentContext` match the types defined in an agent's associated domain, that agent's score is increased.
    -   **User Role**: If the `userRole` in the `AgentContext` is particularly relevant to a domain (e.g., a "compliance officer" for a compliance-focused domain), that agent's score is boosted.

3.  **History Score (Weight: 0.2)**: This score gives preference to agents that have been recently used in the user's session. This leverages the assumption that users often ask follow-up questions related to the same topic. (Note: This will be fully implemented with the persistent memory layer).

The scores are normalized and combined to produce a final confidence score between 0 and 1 for each agent.

### 4.3. Response and Fallback

-   **Response**: The `routeQuery` method will return an array of the top 1-3 agents that exceed a minimum confidence threshold. Each entry will include the agent and its score.
-   **Fallback Strategy**: If no agent meets the minimum confidence threshold, the router will return the `GeneralPurposeAgent` as a fallback. This ensures that the user always receives a response, even for queries that do not fit neatly into a specialized domain. 

export interface UserFeedback {
  id: string;
  sessionId: string;
  messageId: string;
  agentId: string;
  userId?: string;
  feedbackType: 'rating' | 'correction' | 'suggestion' | 'complaint';
  rating?: number; // 1-5 scale
  comment?: string;
  suggestedCorrection?: string;
  timestamp: Date;
  resolved: boolean;
}

export interface FeedbackAnalysis {
  agentId: string;
  averageRating: number;
  commonIssues: string[];
  improvementSuggestions: string[];
  trendsOverTime: { date: Date; rating: number }[];
} 