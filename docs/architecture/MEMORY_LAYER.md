# Agent Memory Layer Architecture

## 1. Overview

To provide context-aware and personalized responses, the AI platform implements a multi-layered memory system. This system allows agents to recall past interactions, understand the current conversational context, and learn from resolved issues over time. The memory layer is divided into two primary components: Working Memory and Long-Term Memory.

## 2. Working Memory (Short-Term)

Working Memory provides immediate, session-based context for ongoing conversations. It ensures that follow-up questions are understood in the context of the current interaction.

-   **Component**: `ConversationContextManager` (located at `src/core-legal-platform/common/conversationContext.ts`)
-   **Storage**: In-memory cache (for speed) backed by a persistent Supabase table (`conversation_history`).
-   **Scope**: Session-specific, tied to a unique `sessionId`.
-   **Lifecycle**: The context is created at the start of a user session and can be persisted to the database. It is cleared or archived after the session ends or after a period of inactivity.

### 2.1. Data Structure (`ConversationMessage`)

Each turn in the conversation is stored with the following structure:

-   `id`: Unique identifier for the message.
-   `question`: The user's query.
-   `answer`: A summary of the agent's response.
-   `agentType`: The ID of the agent that handled the query (e.g., `contract-analysis-agent`).
-   `timestamp`: The time the interaction occurred.
-   `sources`: Any documents or data sources used to generate the response.
-   `sessionId`: The session this message belongs to.

### 2.2. Key Methods

-   `getContext(sessionId)`: Retrieves the current conversation history for a session.
-   `updateContext(sessionId, message)`: Adds a new message to the session's history.
-   `getRecentMessages(sessionId, count)`: Returns the last N messages from the history.
-   `getSummary(sessionId)`: (Future capability) Generates a summary of the conversation so far.

## 3. Long-Term Memory (Persistent)

Long-Term Memory provides the system with a persistent, searchable knowledge base of past interactions. This allows the platform to learn from historical data and improve its routing and response generation over time.

-   **Component**: (To be implemented) A new `VectorStoreService`.
-   **Storage**: A dedicated vector database (e.g., pgvector extension in Supabase).
-   **Scope**: Global, across all user sessions.
-   **Mechanism**: When a conversation is successfully resolved, its key interactions (questions, final answers, and outcomes) are anonymized and converted into vector embeddings. These embeddings are stored in the vector database.

### 3.1. Use Cases

-   **Semantic Search**: Find historically similar questions or problems to provide faster, more accurate answers. For example, if a new query is semantically similar to a previously resolved one, the system can retrieve the old solution.
-   **Agent Training**: (Future capability) The historical data can be used to fine-tune agent models and improve their accuracy.
-   **Proactive Assistance**: Identify recurring issues across the organization and suggest proactive measures or documentation updates.

### 3.2. Data Flow

1.  A user conversation is completed and marked as "resolved."
2.  A background process is triggered.
3.  The conversation transcript is anonymized to remove any personally identifiable information (PII).
4.  The key Q&A pairs are passed to an embedding model (e.g., OpenAI's `text-embedding-ada-002`) to create vector representations.
5.  These embeddings, along with references to the anonymized transcript, are stored in the `resolved_conversations_vectors` table in Supabase.
