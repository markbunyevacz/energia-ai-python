// globalTeardown.ts
import { Config } from '@jest/types';

export default async (globalConfig: Config.GlobalConfig, projectConfig: Config.ProjectConfig) => {
  console.log('Global teardown: Executing after all test suites.');
  // Tear down any global state or services here
};
 