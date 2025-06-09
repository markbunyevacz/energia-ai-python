# Architecture Guardrails

This document outlines the key architectural principles and guardrails for the Jogi AI project. Its purpose is to ensure the codebase remains maintainable, scalable, and consistent as new features are added. All new development should adhere to these principles.

## 1. Core Principles

- **Separation of Concerns (SoC)**: Logic should be separated based on its responsibility.
  - **UI Components (`/src/components`)**: Should contain presentation logic only. They receive data and emit user events. They should not contain complex business logic.
  - **Core Services (`/src/core-legal-platform`)**: Contain the primary business logic. Services should be self-contained and focus on a specific domain (e.g., `FeedbackService`, `PerformanceTuner`).
  - **State Management**: Complex state should be managed via React Contexts (`/src/contexts`) or dedicated state management libraries, not within individual components.

- **Unidirectional Data Flow**: Data should flow in a single, predictable direction. For the feedback loop, the flow is:
  `UI -> FeedbackService -> Database -> Analytics -> Tuner -> Router`
  Avoid creating circular dependencies or having services directly call UI components.

- **Modularity and Reusability**:
  - Build small, reusable components. The `DetailedFeedbackModal` is a good example.
  - Services should be designed to be testable in isolation.

## 2. Backend and Data

- **Database Schema**: All database changes must be documented via SQL scripts in the `/docs` directory.
- **Security First**: All new tables that may contain user or sensitive data MUST implement Row-Level Security (RLS) policies. Default to denying access and open up permissions explicitly.
- **Service Interaction**: Services should interact with the database via the Supabase client (`/src/integrations/supabase/client.ts`). Avoid raw database connections elsewhere.

## 3. Agents and Routing

- **Agent Independence**: Agents (`/src/core-legal-platform/agents`) should be self-contained and not have direct knowledge of other agents.
- **Telemetry is Not Optional**: All public-facing agent processing methods should be wrapped in a telemetry layer (e.g., `processWithTelemetry`) to log performance metrics. This is crucial for the learning loop.
- **Routing Logic**: The `MixtureOfExpertsRouter` is the single point of entry for routing queries to agents. Do not bypass this router.

## 4. Frontend

- **Component Library**: Utilize the existing UI library (`@/components/ui`) for all new UI elements to ensure visual consistency.
- **Error Handling**: Use `ErrorBoundary` components to gracefully handle rendering errors and provide useful feedback to the user.

## 5. Testing

- **Unit Tests**: All new services and complex utility functions should have corresponding unit tests.
- **Integration Tests**: New, complex features (like the feedback loop) require an integration test file that outlines how the components work together. Place these in `/src/core-legal-platform/tests`.

---
*This document is a living standard. It should be updated as the architecture evolves.* 