# Domain Model Architecture

This document specifies the architecture for managing multiple, independent legal domains within the system. It is the source of truth for the domain model.

## 1. Core Concepts

The system is designed to be domain-agnostic. Each area of law (e.g., energy, labor, tax) is represented as a `LegalDomain`. This allows for specialized logic, data, and processing rules to be encapsulated within a domain, while the core platform remains generic.

## 2. `LegalDomain` Interface

The `LegalDomain` is the central interface for defining a legal domain. All domains must adhere to this structure.

```typescript
interface LegalDomain {
  // A unique string identifier for the domain (e.g., "energy", "labor").
  code: string;

  // The human-readable name of the domain (e.g., "Energy Law").
  name: string;

  // A brief description of the domain's scope.
  description: string;

  // An array of document types relevant to this domain (e.g., "contract", "policy").
  documentTypes: string[];

  // Agent-specific configurations, such as keywords for routing.
  agentConfig: {
    contract?: {
      keywords: string[];
    };
    legal_research?: {
      keywords: string[];
    };
    compliance?: {
      keywords: string[];
    };
  };

  // Indicates if the domain is currently active and available for processing.
  active: boolean;
}
```

## 3. `DomainRegistry` Service

The `DomainRegistry` is a singleton service responsible for loading, managing, and providing access to all available `LegalDomain` instances.

### Responsibilities:
-   **Loading**: Fetches domain definitions from the `legal_domains` database table.
-   **Caching**: Holds domain information in memory for quick access.
-   **Access**: Provides methods to retrieve specific or all active domains.

### Class Definition

```typescript
class DomainRegistry {
  /**
   * Returns the singleton instance of the registry.
   */
  public static getInstance(): DomainRegistry;

  /**
   * Loads all active domain configurations from the database.
   * This should be called during application startup.
   */
  public async loadDomainsFromDb(): Promise<void>;

  /**
   * Retrieves a single domain by its unique code.
   * @param code The unique code of the domain.
   * @returns The LegalDomain object or null if not found.
   */
  public getDomain(code: string): LegalDomain | null;

  /**
   * Returns an array of all currently active domains.
   * @returns An array of LegalDomain objects.
   */
  public getActiveDomains(): LegalDomain[];
}
```

## 4. Example Domain Implementation: Energy Law

The following is a concrete example of how a domain is defined. This object is located at `src/core-legal-platform/domains/energy/energy.domain.ts` and is registered with the `DomainRegistry` at application startup.

```typescript
import { LegalDomain } from "../../../legal-domains/types";

export const energyDomain: LegalDomain = {
  code: 'energy',
  name: 'Energiajog',
  description: 'Az energiaágazat szabályozásával, szerződéseivel és megfelelőségével kapcsolatos jogi terület.',
  active: true,
  documentTypes: [
    'villamosenergia-kereskedelmi_szerződés',
    'hálózathasználati_szerződés',
    'csatlakozási_szerződés',
    'szállítói_keretszerződés'
  ],
  agentConfig: {
    contract: {
      keywords: [
        'szerződés',
        'megállapodás',
        'feltétel',
        'felmondás',
        'hálózathasználati',
        'villamosenergia',
        // ... and other keywords
      ]
    },
    compliance: {
      keywords: [
        'megfelelőség',
        'előírás',
        'szabályozás',
        'mekh',
        // ... and other keywords
      ]
    }
  }
};
```

## 5. Data Storage

Legal domain configurations can be stored in the `legal_domains` table in the Supabase database and loaded via the `loadDomainsFromDb` method, or they can be defined in code and registered programmatically via the `registerDomain` method.

## 6. Architectural Rules

1.  **Domain Isolation**: No domain-specific logic should exist outside of its domain configuration. The core platform must not have hardcoded dependencies on any single domain.
2.  **Registry as Single Source of Truth**: All components requiring domain information (e.g., `AIAgentRouter`, `BaseAgent`) must retrieve it from the `DomainRegistry`.
3.  **Dynamic Configuration**: The system should be able to add, remove, or modify domains by changing the data in the `legal_domains` table without requiring a code deployment. 