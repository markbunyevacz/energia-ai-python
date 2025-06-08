# Data Flow

This document visualizes how data moves through the system, from user interaction to the final response. The architecture is designed to be a clear, one-way data flow that is easy to trace and debug.

## Data Flow Diagram

The following diagram illustrates the primary path of a user query through the system.

```mermaid
graph TD
    subgraph UI Layer
        A[User Interface (React Components)]
    end

    subgraph Core Legal Platform
        B[AIAgentRouter]
        C[DomainRegistry]
        D[Specialized Agents (e.g., ContractAgent, ResearchAgent)]
        E[Core Services (e.g., DocumentProcessor, EmbeddingService)]
    end

    subgraph Data & Integrations
        F[Database (Supabase)]
        G[Language Models (e.g., OpenAI)]
    end

    A -- Query / Document --> B
    B -- Requests Domain Info --> C
    C -- Returns Active Domains & Keywords --> B
    B -- Routes to Appropriate Agent --> D
    D -- Uses Core Services --> E
    E -- Accesses Data / LLMs --> F
    E -- Accesses Data / LLMs --> G
    F -- Returns Data --> E
    G -- Returns Analysis --> E
    E -- Returns Processed Info --> D
    D -- Returns Final Response --> A
```

## Explanation of Stages

1.  **User Input**: The user interacts with the React components in the `UI Layer`. This could be submitting a question, uploading a document, or interacting with a dashboard.

2.  **Routing**: The request is sent to the `AIAgentRouter` within the `Core Legal Platform`. The router is the central entry point for all AI-powered queries.

3.  **Domain Contextualization**: The `AIAgentRouter` consults the `DomainRegistry` to get a list of active legal domains and their associated keywords and configurations. This step is what makes the system domain-agnostic.

4.  **Agent Selection**: Based on the user's query and the domain information, the router selects the most appropriate `Specialized Agent` to handle the request.

5.  **Core Processing**: The selected agent uses various `Core Services` to execute its task. This might involve processing a document with the `DocumentProcessor`, generating vector embeddings with the `EmbeddingService`, or fetching data from the `Database`.

6.  **External Integrations**: The core services interact with external systems, such as the `Supabase` database for data storage and retrieval, or third-party `Language Models` for advanced analysis.

7.  **Response Aggregation**: The agent aggregates the results from the services and formulates a final response.

8.  **Display to User**: The final response is sent back to the `UI Layer`, where it is displayed to the user.
