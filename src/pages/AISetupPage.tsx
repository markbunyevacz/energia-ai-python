import React from 'react';
import { AIModelManager } from '@/components/ai-setup/AIModelManager';

export const AISetupPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <AIModelManager />
    </div>
  );
};

export default AISetupPage; 