// globalSetup.ts
import { Config } from '@jest/types';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

export default async (globalConfig: Config.GlobalConfig, projectConfig: Config.ProjectConfig) => {
  console.log('Global setup: Executing before all test suites.');
  // Set up any global state or services here
}; 