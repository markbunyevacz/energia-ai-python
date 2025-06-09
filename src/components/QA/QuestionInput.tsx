import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Loader2 } from 'lucide-react';
import { conversationContextManager } from '@/core-legal-platform/common/conversationContext';
import { AgentIndicator } from '@/components/AI/AgentIndicator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useMoE } from '@/contexts/MoEProvider';
import { AgentScore, MoEContext } from '@/core-legal-platform/routing/MixtureOfExpertsRouter';

interface QuestionInputProps {
  onSubmit: (question: string, agentId?: string, conversationContext?: any) => void;
  isLoading: boolean;
  results?: any;
  selectedQuestion: string;
  onQuestionChange: (question: string) => void;
  placeholder?: string;
}

export function QuestionInput({ 
  onSubmit, 
  isLoading, 
  selectedQuestion, 
  onQuestionChange,
  placeholder
}: QuestionInputProps) {
  const [question, setQuestion] = useState('');
  const [agentAnalysis, setAgentAnalysis] = useState<AgentScore | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { router } = useMoE();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalQuestion = selectedQuestion || question;
    if (finalQuestion.trim() && user && router) {
      const sessionId = user.id;
      const conversation = await conversationContextManager.getContext(sessionId, user.id);
      
      const context: MoEContext = {
        document: null, // This would come from uploaded documents
        conversation: conversation,
        user: {
            id: user.id,
            role: profile?.role || 'jogász',
            permissions: []
        },
        // @ts-ignore
        previousQuestions: conversation?.messages.slice(-3).map(m => m.question) || []
      };

      try {
        const analysis = await router.routeQuery(finalQuestion, context);
        
        if (analysis.length > 0) {
            const bestAgent = analysis[0];
            setAgentAnalysis(bestAgent);
            
            const conversationContext = {
              sessionId: sessionId,
              currentTopic: conversation?.currentTopic,
              userRole: profile?.role || 'jogász',
              messageCount: conversation?.messages.length || 0
            };
    
            onSubmit(finalQuestion, bestAgent.agent.getConfig().id, conversationContext);
        } else {
            // Fallback if no agent is found
            onSubmit(finalQuestion);
        }

        setQuestion('');
        onQuestionChange('');
      } catch (error) {
        console.error("Error analyzing question:", error);
        toast({
          title: "Hiba a kérdés elemzése során",
          description: "Nem sikerült meghatározni a megfelelő AI ágenst. Kérjük, próbálja újra.",
          variant: "destructive",
        });
        // Fallback to sending the raw question
        onSubmit(finalQuestion);
      }
    }
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    onQuestionChange(value);
    
    if (agentAnalysis) {
      setAgentAnalysis(null);
    }
  };

  const currentQuestion = selectedQuestion || question;

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {agentAnalysis && (
            <AgentIndicator 
              agent={agentAnalysis.agent}
              confidence={agentAnalysis.score}
            />
          )}
          
          <div className="space-y-2">
            <Textarea
              value={currentQuestion}
              onChange={(e) => handleQuestionChange(e.target.value)}
              placeholder={placeholder || "Tegye fel kérdését az energiajogi dokumentumokkal kapcsolatban..."}
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Az AI elemzi a kérdést és kiválasztja a megfelelő szakértői ágenst
            </p>
            <Button 
              type="submit" 
              disabled={!currentQuestion.trim() || isLoading}
              className="bg-mav-blue hover:bg-mav-blue-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Feldolgozás...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Kérdés elküldése
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
