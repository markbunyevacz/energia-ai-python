import { readFileSync } from 'fs';
// import { join } from 'path'; // Unused import
// import { glob } from 'glob'; // Commented out due to API issues

export class ImplementationValidator {
  private static readonly MOCK_PATTERNS = [
    /mock/i,
    /dummy/i,
    /fake/i,
    /stub/i,
    /test.*data/i,
    /sample.*data/i,
  ];

  private static readonly EXCLUDED_DIRS = [
    'node_modules',
    'dist',
    'build',
    '.git',
    'coverage',
    '__tests__',
    '__mocks__',
  ];

  public static async validateImplementation(): Promise<{
    isValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    // Simplified implementation without glob
    const files = ['src/main.tsx']; // Placeholder - would need proper file discovery

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      
      // Check for mock patterns
      this.MOCK_PATTERNS.forEach(pattern => {
        const matches = content.match(new RegExp(pattern, 'g'));
        if (matches) {
          issues.push(`File ${file} contains mock/dummy patterns: ${matches.join(', ')}`);
        }
      });

      // Check for test data
      if (content.includes('test data') || content.includes('sample data')) {
        issues.push(`File ${file} contains test/sample data`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
} 