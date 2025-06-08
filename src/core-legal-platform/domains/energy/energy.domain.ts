import { LegalDomain } from './types';

export const energyDomain: LegalDomain = {
  code: 'energy',
  name: 'Energiajog',
  description: 'Az energiajoggal kapcsolatos szerződések és megfeleőségi kérdések.',
  // TODO: Align with the actual document types in the database schema
  documentTypes: ['other'], 
  agentConfig: {
    contract: {
      keywords: ['szerződés', 'megállapodás', 'villamosenergia', 'földgáz', 'ellátás', 'vásárlás'],
    },
    compliance: {
      keywords: ['megfelelőség', 'jogszabály', 'MEKH', 'rendelet', 'engedély'],
    },
  },
  active: true,
}; 