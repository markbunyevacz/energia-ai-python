import { config } from 'dotenv';
import path from 'path';

/**
 * Vitest Global Setup
 *
 * This script runs ONCE before all test suites.
 * Its purpose is to load environment variables from the root .env file
 * and make them available to the entire test environment (process.env).
 *
 * This is the CORRECT way to manage environment variables for tests,
 * as it ensures they are loaded *before* any application code (like the Supabase client)
 * is imported and initialized.
 *
 * It is configured in `vitest.config.ts` via the `globalSetup` option.
 */
export default async () => {
  console.log('--- Loading environment variables for tests from .env file ---');
  const envPath = path.resolve(__dirname, '../../.env');
  const result = config({ path: envPath });

  if (result.error) {
    console.error(
      '!!! FAILED TO LOAD .env FILE FOR TESTS. This will cause authentication errors. !!!'
    );
    console.error('Error details:', result.error);
    throw result.error;
  }

  console.log('--- .env file loaded successfully for tests ---');
}; 