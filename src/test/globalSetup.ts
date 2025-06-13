import { config } from 'dotenv';
import { resolve } from 'path';

export default async () => {
  config({ path: resolve(__dirname, '../../.env') });
}; 