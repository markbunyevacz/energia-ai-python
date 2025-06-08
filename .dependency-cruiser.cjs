/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'core-logic-cannot-depend-on-ui',
      severity: 'error',
      comment: 'The core logic (core-legal-platform) should not depend on any UI components (components, pages). This prevents UI coupling and ensures the core is reusable.',
      from: { path: '^src/core-legal-platform' },
      to: { path: ['^src/components', '^src/pages'] }
    },
    {
      name: 'services-cannot-depend-on-ui',
      severity: 'error',
      comment: 'Services should be self-contained and not have any dependencies on the UI layer.',
      from: { path: '^src/services' },
      to: { path: ['^src/components', '^src/pages'] }
    },
    {
        name: 'core-logic-cannot-depend-on-specific-integrations',
        severity: 'warn',
        comment: 'The core platform should ideally be independent of specific third-party integrations. This rule is a warning to allow for exceptions but encourage loose coupling.',
        from: { path: '^src/core-legal-platform' },
        to: { path: '^src/integrations' }
    },
    {
        name: 'no-domain-specific-logic-in-core',
        comment: 'Core platform must remain domain-agnostic. This rule prevents specialized, domain-specific modules from being imported into the core.',
        severity: 'error',
        from: { path: '^src/core-legal-platform'},
        to: {
            // Preventing dependency on a specific crawler implementation as an example of domain-specific logic
            path: '^src/lib/crawler/magyar-kozlony-crawler.ts'
        }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    tsPreCompilationDeps: true,
    reporterOptions: {
      dot: {
        theme: {
          graph: {
            splines: "ortho"
          },
          modules: [
            {
              criteria: { source: "^src/core-legal-platform" },
              attributes: { fillcolor: "lightskyblue", color: "lightskyblue" }
            },
            {
              criteria: { source: "^src/services" },
              attributes: { fillcolor: "lightgreen", color: "lightgreen" }
            },
            {
              criteria: { source: "^src/components" },
              attributes: { fillcolor: "gold", color: "gold" }
            },
            {
              criteria: { source: "^src/pages" },
              attributes: { fillcolor: "lightsalmon", color: "lightsalmon" }
            }
          ],
          dependencies: [
            {
              criteria: { "rules[0].severity": "error" },
              attributes: { fontcolor: "red", color: "red" }
            },
            {
              criteria: { "rules[0].severity": "warn" },
              attributes: { fontcolor: "orange", color: "orange" }
            }
          ]
        }
      }
    }
  }
}; 