# Testing Strategy

This document outlines the testing strategy for the Jogi AI platform. The goal is to ensure code quality, prevent regressions, and build a stable and reliable system.

## 1. Guiding Principles

-   **Test for Confidence:** We write tests to be confident in the code we ship. Tests should be meaningful and catch real bugs.
-   **Clarity and Readability:** Tests should be easy to understand. A good test serves as documentation for the code it covers.
-   **Automation:** All tests should be automated and integrated into the CI/CD pipeline.
-   **Right Tool for the Job:** We will use different testing types and tools based on what is most effective for a given component.

## 2. Test Types & Scope

We will employ a mix of testing types, following the "testing trophy" model, which prioritizes a balanced portfolio of tests.

### 2.1. Unit Tests

-   **Goal:** Verify the functionality of individual components (e.g., a single function, class, or React component) in isolation.
-   **Framework:** [Vitest](https://vitest.dev/)
-   **Location:** `src/components/MyComponent/__tests__/MyComponent.test.ts` or `src/lib/my-function.test.ts` (alongside the code).
-   **Mocks:** External dependencies (APIs, services, etc.) will be mocked to ensure isolation.

### 2.2. Integration Tests

-   **Goal:** Verify that multiple components work together as expected. This includes testing interactions between our code and external services like the Supabase database or external APIs.
-   **Framework:** [Vitest](https://vitest.dev/)
-   **Location:** `tests/integration/`
-   **Details:** These tests will run against a real (but controlled) test database to ensure that our application logic, database schema, and RLS policies are all working correctly together.

### 2.3. End-to-End (E2E) Tests

-   **Goal:** Simulate real user workflows from the frontend to the backend. This ensures the entire application is functioning correctly from the user's perspective.
-   **Framework:** [Playwright](https://playwright.dev/) (to be configured)
-   **Location:** `tests/e2e/`
-   **Details:** E2E tests will cover critical user paths, such as user login, document upload and analysis, and interacting with agents.

## 3. Tools & Frameworks

-   **Test Runner:** Vitest will be used for both unit and integration tests.
-   **E2E Testing:** Playwright will be used for end-to-end testing.
-   **CI/CD:** GitHub Actions will be used to run all tests automatically on every push and pull request.

## 4. Code Coverage

-   **Target:** We aim for a minimum of **80% code coverage** for all new code.
-   **Reporting:** Coverage reports will be generated and monitored to track progress and identify gaps.

## 5. Test Directory Structure

To maintain a clean and organized codebase, we will use the following structure:

```
.
├── src/
│   ├── components/
│   │   └── MyComponent/
│   │       ├── MyComponent.tsx
│   │       └── __tests__/
│   │           └── MyComponent.test.ts  # Unit Test
│   └── ...
├── tests/
│   ├── integration/
│   │   └── auth.integration.test.ts     # Integration Test
│   └── e2e/
│       └── login.e2e.test.ts            # E2E Test
└── ...
```

This combination of co-located unit tests and a top-level `tests` directory for integration and E2E tests provides a good balance of separation and discoverability. 