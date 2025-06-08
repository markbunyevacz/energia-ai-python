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