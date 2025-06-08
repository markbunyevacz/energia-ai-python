# System Overview

This document provides a high-level overview of the Jogi AI system architecture. It outlines the primary components, their responsibilities, and the overall structure of the application.

## 1. Core Philosophy

The system is designed as a **domain-agnostic legal AI platform**. The core logic is completely decoupled from any specific legal domain (e.g., energy, labor) and is orchestrated through a central `DomainRegistry`. This allows for new legal domains to be added and managed via database configuration without requiring code changes.

## 2. Directory Structure

The `src` directory is organized to enforce a clean separation of concerns between the core platform, the UI, and the application's entry point.

-   `src/`
    -   `main.tsx`: The main entry point of the React application.
    -   `App.tsx`: The root React component, responsible for setting up routing and global providers.
    -   `components/`: Contains all UI components, organized by feature or page.
    -   `pages/`: Represents the main pages of the application, composed of UI components.
    -   `hooks/`: Reusable React hooks.
    -   `utils/`: Generic utility functions that are not specific to any component or service.
    -   `types/`: Global TypeScript type definitions.
    -   `integrations/`: Houses third-party service clients (e.g., Supabase, OpenAI).
    -   `core-legal-platform/`: **The heart of the application.** This directory contains all the core business logic, AI agent definitions, and services that make up the legal processing engine.
        -   `agents/`: Contains the `BaseAgent` and all specialized agent implementations.
        -   `legal-domains/`: Manages the domain abstraction layer, including the `DomainRegistry`.
        -   `routing/`: Home of the `AIAgentRouter`, which dynamically routes queries based on domain data.
        -   `document/`: Contains services for document processing, chunking, and analysis.
        -   `embedding/`: Services related to creating vector embeddings for text.
        -   `common/`: Cross-cutting services like logging, error handling, and web sockets.
        -   `...and other core modules`

## 3. High-Level User Flow

1.  **User Interaction**: A user interacts with the UI, typically by asking a question or uploading a document through a component in the `pages` directory.
2.  **Request Routing**: The UI component calls the `AIAgentRouter` located in `core-legal-platform/routing`.
3.  **Domain-Aware Processing**: The router, using the `DomainRegistry`, analyzes the request and selects the appropriate specialized AI agent to handle it.
4.  **Agent Execution**: The selected agent processes the request, potentially using other core services for document analysis, embedding generation, or database access.
5.  **Response to UI**: The result is returned to the UI component, which then displays it to the user.

This architecture ensures that the UI layer is completely decoupled from the core business logic, which in turn is decoupled from specific legal domains, creating a robust, maintainable, and extensible system. 