# Human Feedback System Architecture

This document outlines the architecture for the human feedback collection, analysis, and learning loop system for the Jogi AI platform.

## 1. Overview

The Human Feedback System is designed to continuously improve the performance and accuracy of our AI agents by incorporating user feedback directly into the development and operational lifecycle. This system enables us to learn from real-world interactions, identify areas for improvement, and automate the process of agent tuning.

## 2. Feedback Collection Points

Feedback will be collected at multiple points in the user journey to capture a comprehensive view of user satisfaction and agent performance.

### 2.1. Post-Interaction Ratings

-   **Location**: Immediately following an agent's response in the chat interface (`LovableFrontend.tsx`).
-   **Mechanism**: Simple "thumbs up" / "thumbs down" buttons.
-   **Purpose**: To gather a quick, low-friction signal of the response's quality.

### 2.2. Detailed Feedback Modal

-   **Location**: Accessible via a "Provide Detailed Feedback" button next to the rating buttons (`ConversationDisplay.tsx`).
-   **Mechanism**: A modal window with a form for:
    -   Categorizing the feedback (e.g., "Inaccurate Information", "Unhelpful Response", "Formatting Issue", "Other").
    -   Providing detailed textual comments.
    -   Suggesting a corrected or improved response.
-   **Purpose**: To collect in-depth, specific feedback for root cause analysis.

### 2.3. Proactive Feedback Surveys

-   **Location**: Emailed to users periodically or after a certain number of interactions.
-   **Mechanism**: Web-based survey form.
-   **Purpose**: To gather general feedback about the user's overall experience with the platform.

## 3. Feedback Types

The system will handle several types of feedback data.

| Type                      | Data Points                                                                 | Source                       |
| ------------------------- | --------------------------------------------------------------------------- | ---------------------------- |
| **Simple Rating**         | `interaction_id`, `agent_id`, `rating` (`up`/`down`), `timestamp`           | Post-interaction buttons     |
| **Detailed Feedback**     | `interaction_id`, `agent_id`, `category`, `comments`, `suggestion`, `timestamp` | Detailed feedback modal      |
| **Correction Suggestion** | `interaction_id`, `original_response`, `suggested_correction`             | Detailed feedback modal      |
| **Performance Metrics**   | `interaction_id`, `agent_id`, `response_time_ms`, `confidence_score`      | `BaseAgent.ts` (backend)     |

## 4. Feedback Analysis Pipeline

1.  **Ingestion**: The `FeedbackService` collects feedback from all sources and stores it in the `UserFeedback` and `InteractionMetrics` tables in our Supabase database.
2.  **Aggregation**: A scheduled job (e.g., daily) runs `FeedbackService.analyzeFeedback`.
3.  **Analysis**: This service queries the database, aggregates feedback for each agent over a specified time range, and calculates key metrics:
    -   Satisfaction Score (Up-vote / Down-vote ratio).
    -   Volume of feedback by category.
    -   Common themes in textual comments (using basic NLP for keyword extraction).
    -   Correlation between performance metrics (e.g., response time) and user satisfaction.
4.  **Reporting**: The results are stored in a `FeedbackAnalysis` object and visualized in the Admin Dashboard (`AdminDashboard.tsx`).

## 5. Agent Improvement Workflow

1.  **Plan Generation**: Based on the `FeedbackAnalysis`, `FeedbackService.generateImprovementPlan` creates an `ImprovementPlan`. This plan might suggest:
    -   Updating an agent's fine-tuning dataset with corrected examples.
    -   Adjusting an agent's system prompt or parameters.
    -   Flagging an agent for manual review and retraining.
    -   Modifying the routing score in the `MixtureOfExpertsRouter`.
2.  **Automated Tuning**: The `PerformanceTuner` service automatically applies parameter and score adjustments as defined in the improvement plan.
3.  **Manual Review**: For complex issues, the system alerts the development team, providing a link to the relevant feedback and analysis in the admin dashboard.
4.  **Closing the Loop**: The system tracks the impact of implemented changes on agent performance, creating a continuous learning loop.

## 6. Data Schema

See `src/core-legal-platform/feedback/types.ts` for the detailed data models. The primary Supabase tables will be:
-   `user_feedback`
-   `interaction_metrics`
-   `agent_performance_analysis` 