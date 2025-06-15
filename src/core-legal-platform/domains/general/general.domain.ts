import { LegalDomain } from '../types';

export const generalDomain: LegalDomain = {
  code: 'general',
  name: 'Általános Jogi Kérdések',
  description: 'Általános célú jogi kérdések, amelyek nem tartoznak egyetlen specializált területhez sem.',
  documentTypes: ['other'],
  agentConfig: {
    legal_research: { // Assuming general agent does research
      keywords: ['jogi', 'törvény', 'szabály', 'kérdés', 'vélemény', 'tanács'],
    },
  },
  active: true,
}; 
