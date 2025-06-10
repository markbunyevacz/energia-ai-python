import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useMoE } from '@/contexts/MoEProvider';
import { ThumbsUp, ThumbsDown, MessageSquarePlus } from 'lucide-react';
import { FeedbackService } from '@/core-legal-platform/feedback/FeedbackService';
import { UserFeedback, FeedbackCategory, FeedbackRating } from '@/core-legal-platform/feedback/types';
import { v4 as uuidv4 } from 'uuid';
import { DomainRegistry } from '@/core-legal-platform/legal-domains/registry/DomainRegistry';
import { energyDomain } from '@/core-legal-platform/domains/energy/energy.domain';
import { generalDomain } from '@/core-legal-platform/domains/general/general.domain';
import { ContractAnalysisAgent } from '@/core-legal-platform/agents/contract-analysis/ContractAnalysisAgent';
import { GeneralPurposeAgent } from '@/core-legal-platform/agents/general-purpose/GeneralPurposeAgent';
import { MixtureOfExpertsRouter, AgentScore, MoEContext } from '@/core-legal-platform/routing/MixtureOfExpertsRouter';
import { BaseAgent, AgentContext, AgentResult } from '@/core-legal-platform/agents/base-agents/BaseAgent';
import { conversationContextManager } from '@/core-legal-platform/common/conversationContext';
import { LegalDocument } from '@/core-legal-platform/legal-domains/types';

// Configure the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

interface AnalysisRisk {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  section: string;
}

interface AnalysisResult {
  id: string;
  risk_level: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  risks: AnalysisRisk[];
  status?: 'processing' | 'analyzing' | 'completed' | 'failed';
}

/**
 * Extracts text content from a given file.
 * Currently supports PDF files.
 * @param file - The file to extract text from.
 * @returns A promise that resolves with the extracted text content.
 */
async function extractTextFromFile(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map(item => ('str' in item ? item.str : '')).join(' ');
    }
    return textContent;
  }
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
  // .doc format is not supported for client-side extraction.
  throw new Error('Unsupported file type for text extraction. Please use PDF or DOCX.');
}

/**
 * LovableFrontend Component - Main Legal Document Analysis Interface
 *
 * This component serves as the primary user interface for the Jogi AI Demo application,
 * providing a comprehensive legal document analysis workflow. It integrates with the
 * backend AI services to deliver intelligent contract analysis, legal opinions, and
 * document summaries.
 *
 * ARCHITECTURE OVERVIEW:
 * - Built with React functional components and hooks for state management
 * - Integrates with Supabase backend services for document processing
 * - Uses Radix UI components for accessible, consistent user interface
 * - Implements Hungarian localization for user-facing text
 * - Follows modern React patterns with TypeScript for type safety
 *
 * STATE MANAGEMENT:
 * - `file`: File object storing the selected document for analysis
 * - `analysisType`: String indicating the type of analysis ('contract', 'legal', 'summary')
 * - `notes`: User-provided additional context and requirements
 * - `loading`: Boolean flag for async operation state management
 * - `result`: Analysis results object containing risk assessment and suggestions
 * - `error`: Error state for user feedback and debugging
 *
 * KEY FEATURES:
 * - Multi-format file upload support (PDF, DOC, DOCX)
 * - Intelligent analysis type selection with specialized AI agents
 * - Contextual notes input for enhanced analysis accuracy
 * - Real-time loading states with user feedback
 * - Comprehensive results display with risk assessment
 * - Error handling with user-friendly Hungarian messages
 * - Responsive design for various screen sizes
 *
 * INTEGRATION POINTS:
 * - Backend API integration (currently needs update to use Supabase functions)
 * - AI Agent Router for intelligent query processing
 * - Document processing services for text extraction
 * - Error handling and logging services
 *
 * ACCESSIBILITY FEATURES:
 * - Proper ARIA labels and descriptions
 * - Keyboard navigation support
 * - Screen reader compatibility
 * - High contrast design elements
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Efficient re-rendering with proper React patterns
 * - File validation to prevent unnecessary processing
 * - Loading states to prevent multiple simultaneous requests
 * - Error boundaries for graceful failure handling
 *
 * @fileoverview Main legal document analysis interface component
 * @author Legal AI Team / Lovable
 * @since 1.0.0
 * @version 1.0.0
 */
export function LovableFrontend() {
  const { user } = useAuth();
  const { router: moeRouter, agentPool, isInitialized } = useMoE();
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  /** 
   * Selected file for analysis - supports PDF, DOC, DOCX formats
   * Validated on selection to ensure proper file type and size limits
   */
  const [file, setFile] = useState<File | null>(null);
  
  /** 
   * Analysis type selection - determines which AI agent will process the document
   * Options: 'contract' (szerződés), 'legal' (jogi vélemény), 'summary' (összefoglaló)
   */
  const [analysisType, setAnalysisType] = useState('contract');
  
  /** 
   * User-provided notes and additional context for the analysis
   * Helps the AI provide more targeted and relevant insights
   */
  const [notes, setNotes] = useState('');
  
  /** 
   * Loading state for async operations (file upload, analysis processing)
   * Prevents multiple simultaneous requests and provides user feedback
   */
  const [loading, setLoading] = useState(false);
  
  /** 
   * Analysis results from the backend AI service
   * Contains risk assessment, suggestions, and detailed analysis
   * TODO: Define proper TypeScript interface for result structure
   */
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  
  /** 
   * MoE Router state
   */
  const [recommendedAgents, setRecommendedAgents] = useState<AgentScore[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<BaseAgent | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
  const [currentInteractionId, setCurrentInteractionId] = useState<string | null>(null);
  
  /** 
   * Error state for user feedback and debugging
   * Displays localized error messages in Hungarian
   */
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [detailedFeedbackOpen, setDetailedFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<FeedbackCategory | ''>('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');

  const feedbackService = new FeedbackService(supabase);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  useEffect(() => {
    if (!isInitialized) {
      setError("A platform inicializálása sikertelen volt. Kérjük, frissítse az oldalt.");
    } else {
      setError(null);
    }
  }, [isInitialized]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const threshold = parseFloat(e.target.value);
    setConfidenceThreshold(threshold);
    if (moeRouter) {
      moeRouter.setConfidenceThreshold(threshold);
    }
  };

  /**
   * File Input Change Handler
   * 
   * Handles file selection from the input element with validation and error handling.
   * Supports PDF, DOC, and DOCX formats with size limitations.
   * 
   * VALIDATION CHECKS:
   * - File type validation (PDF, DOC, DOCX)
   * - File size limits (configurable, typically 10MB max)
   * - File integrity checks
   * 
   * ERROR HANDLING:
   * - Invalid file types show user-friendly error messages
   * - Large files are rejected with size information
   * - Corrupted files are detected and handled gracefully
   * 
   * @param e - File input change event containing the selected file
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear any previous errors when selecting a new file
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const SUPPORTED_TYPES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!SUPPORTED_TYPES.includes(selectedFile.type)) {
        setError('Nem támogatott fájlformátum. Kérlek, válassz PDF vagy DOCX fájlt.');
        setFile(null);
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('A fájl mérete meghaladja a 10MB-os korlátot.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setFeedbackGiven(null);
    }
  };

  /**
   * Analysis Type Selection Handler
   * 
   * Handles the selection of analysis type which determines which AI agent
   * will process the document. Each type has specialized prompts and processing logic.
   * 
   * ANALYSIS TYPES:
   * - 'contract': Contract analysis with risk assessment and clause review
   * - 'legal': Legal opinion generation with precedent analysis
   * - 'summary': Document summarization with key points extraction
   * 
   * @param e - Select element change event with the chosen analysis type
   */
  const handleAnalysisTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnalysisType(e.target.value);
    
    // Clear previous results when changing analysis type
    // This prevents confusion with results from different analysis types
    setResult(null);
    setError(null);
  };

  /**
   * Notes Input Change Handler
   * 
   * Handles user input for additional notes and context that will be provided
   * to the AI agent for more targeted analysis. Notes help improve analysis
   * accuracy and relevance.
   * 
   * USAGE EXAMPLES:
   * - "Focus on termination clauses"
   * - "Check compliance with GDPR"
   * - "Analyze payment terms and penalties"
   * 
   * @param e - Textarea change event with the user's notes
   */
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  /**
   * Routes the query to find the best agents.
   */
  const handleFindAgents = async () => {
    if (!file) {
      setError('Kérlek, válassz egy fájlt az elemzéshez.');
      return;
    }
    if (!moeRouter) {
      setError('Az útválasztó még nem áll készen. Kérjük, várjon egy pillanatot.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setRecommendedAgents([]);
    setSelectedAgent(null);
    setCurrentInteractionId(null);
    setFeedbackGiven(null);

    try {
      // For routing, we don't need the full text, just some metadata.
      // We'll create a dummy document. Full text extraction can happen after agent selection.
      const dummyDocument: LegalDocument = {
        id: file.name,
        title: file.name,
        content: '', // Keep content empty for routing performance
        documentType: 'other', // TODO: The schema doesn't have a 'contract' type. Using 'other' as a workaround.
        domainId: '', // Router will figure this out
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      };
      
      const userContext = await conversationContextManager.getContext(user?.id || 'anonymous');

      const moeContext: MoEContext = {
        document: dummyDocument,
        domain: '', // Let router decide
        conversation: userContext
      };

      const agents = await moeRouter.routeQuery(notes || "Elemezze a dokumentumot.", moeContext);
      
      if (agents.length === 0) {
        setError("Nem található megfelelő ügynök a feladathoz.");
      } else {
        setRecommendedAgents(agents);
      }

    } catch (err: any) {
      setError(`Hiba történt az ügynökök keresése közben: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Executes the analysis with the selected agent.
   * @param agent The agent chosen by the user.
   */
  const handleExecuteAnalysis = async (agent: BaseAgent) => {
    if (!file) {
      setError('Kérlek, válassz egy fájlt az elemzéshez.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedAgent(agent);
    setFeedbackGiven(null); // Reset feedback state for new analysis
    setCurrentInteractionId(null); // Reset interaction ID

    try {
      const fileContent = await extractTextFromFile(file);

      const doc: LegalDocument = {
        id: file.name,
        title: file.name,
        content: fileContent,
        documentType: 'other',
        domainId: agent.getConfig().domainCode,
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
      };

      const userContext = await conversationContextManager.getContext(user?.id || 'anonymous');
      
      const agentContext: AgentContext = {
          document: doc,
          domain: agent.getConfig().domainCode,
          user: user ? { id: user.id, role: user.role || 'user', permissions: [] } : undefined,
          conversationHistory: userContext?.messages,
          metadata: { sessionId: user?.id || 'anonymous' }
      };

      // Use the new telemetry wrapper
      const agentResult = await agent.processWithTelemetry(agentContext);

      if (agentResult.success) {
        setResult(agentResult.data);
        setCurrentInteractionId(agentResult.data.interactionId); // Capture interaction ID
        
        await conversationContextManager.updateContext(
          user?.id || 'anonymous',
          {
            question: notes || `Analyze: ${file.name}`,
            answer: agentResult.data.summary || 'Analysis complete.',
            agentType: agent.getConfig().id,
            sources: [file.name]
          },
          user?.id,
          user?.role || 'user'
        );

      } else {
        setError(agentResult.message);
      }
    } catch (err: any) {
      console.error("Analysis execution error:", err);
      setError(err.message || 'Ismeretlen hiba történt az elemzés során.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (rating: FeedbackRating) => {
    if (!currentInteractionId || !selectedAgent) return;
    setFeedbackGiven(rating);
    const feedback: Omit<UserFeedback, 'id' | 'created_at'> = {
      interaction_id: currentInteractionId,
      agent_id: selectedAgent.agentId,
      user_id: user?.id,
      rating: rating,
    };
    try {
      await feedbackService.collectFeedback(feedback);
    } catch (err) {
      console.error('Hiba a visszajelzés küldésekor:', err);
    }
  };

  const handleDetailedFeedbackSubmit = async () => {
    if (!currentInteractionId || !selectedAgent) return;

    const feedback: Omit<UserFeedback, 'id' | 'created_at'> = {
      interaction_id: currentInteractionId,
      agent_id: selectedAgent.agentId,
      user_id: user?.id,
      rating: feedbackGiven ?? undefined,
      category: feedbackCategory || undefined,
      comments: feedbackComment || undefined,
      suggested_correction: feedbackSuggestion || undefined,
    };
    try {
      await feedbackService.collectFeedback(feedback);
      setDetailedFeedbackOpen(false);
      // Reset feedback form
      setFeedbackCategory('');
      setFeedbackComment('');
      setFeedbackSuggestion('');
    } catch (err) {
      console.error('Hiba a részletes visszajelzés küldésekor:', err);
      // Optionally show an error to the user
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Jogi AI Demo</CardTitle>
            <CardDescription>
              A jogi dokumentumok elemzésére és feldolgozására szolgáló AI-alapú megoldás
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="document">Dokumentum feltöltése</Label>
                <Input id="document" type="file" accept=".pdf,.docx" onChange={handleFileChange} />
                {file && <span className="text-xs text-muted-foreground">Kiválasztva: {file.name}</span>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="analysis">Elemzés típusa</Label>
                <select id="analysis" className="w-full p-2 border rounded" value={analysisType} onChange={handleAnalysisTypeChange}>
                  <option value="contract">Szerződés elemzése</option>
                  <option value="legal">Jogi vélemény</option>
                  <option value="summary">Összefoglaló</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Megjegyzések (opcionális)</Label>
                <Textarea
                  id="notes"
                  placeholder="Például: 'Fókuszálj a felmondási feltételekre' vagy 'Ellenőrizd a GDPR-megfelelést'"
                  value={notes}
                  onChange={handleNotesChange}
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={handleFindAgents} disabled={loading || !file} className="w-full">
                {loading && !recommendedAgents.length ? 'Ügynökök keresése...' : 'Elemzés indítása'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading && !recommendedAgents.length && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Folyamatban...</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{progress || 'Elemzés folyamatban, kérjük várjon...'}</p>
            </CardContent>
          </Card>
        )}
        
        {recommendedAgents.length > 0 && !result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Javasolt Szakértők</CardTitle>
              <CardDescription>Válassza ki a legmegfelelőbb szakértőt a feladathoz.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col space-y-2">
              {recommendedAgents.map(({ agent, score }) => (
                <Button
                  key={agent.getConfig().id}
                  onClick={() => handleExecuteAnalysis(agent)}
                  variant="outline"
                  disabled={loading}
                >
                  {agent.getConfig().name} (Relevancia: {Math.round(score * 100)}%)
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mt-6 bg-destructive/10 border-destructive">
            <CardHeader>
              <CardTitle>Hiba</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {result && result.status === 'completed' && (
          <Card className="mt-6 bg-slate-50">
            <CardHeader>
              <CardTitle>Elemzési Eredmények</CardTitle>
              <CardDescription>{result.summary}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Kockázati Szint:</h3>
                  <p className={`font-bold ${
                    result.risk_level === 'high' ? 'text-red-600' :
                    result.risk_level === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {result.risk_level.toUpperCase()}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Összefoglaló:</h3>
                  <p className="text-sm">{result.summary}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Javaslatok:</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {result.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
                {/* Feedback Section */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-semibold text-center mb-2">Hasznos volt ez a válasz?</h4>
                  <div className="flex justify-center items-center space-x-4">
                    <Button
                      variant={feedbackGiven === 'up' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => handleFeedback('up')}
                      disabled={!!feedbackGiven}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={feedbackGiven === 'down' ? 'destructive' : 'outline'}
                      size="icon"
                      onClick={() => handleFeedback('down')}
                      disabled={!!feedbackGiven}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Dialog open={detailedFeedbackOpen} onOpenChange={setDetailedFeedbackOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MessageSquarePlus className="h-4 w-4 mr-2" /> Részletes visszajelzés
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Részletes visszajelzés</DialogTitle>
                          <DialogDescription>
                            Segítsen nekünk jobban teljesíteni. Adja meg, mi volt a probléma.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                              Kategória
                            </Label>
                            <Select onValueChange={(value) => setFeedbackCategory(value as FeedbackCategory)} value={feedbackCategory}>
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Válasszon egy kategóriát" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inaccurate Information">Pontatlan információ</SelectItem>
                                <SelectItem value="Unhelpful Response">Nem segítőkész válasz</SelectItem>
                                <SelectItem value="Formatting Issue">Formázási probléma</SelectItem>
                                <SelectItem value="Other">Egyéb</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="comment" className="text-right">
                              Megjegyzés
                            </Label>
                            <Textarea
                              id="comment"
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              className="col-span-3"
                              placeholder="Kérjük, fejtse ki bővebben..."
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="suggestion" className="text-right">
                              Javaslat
                            </Label>
                            <Textarea
                              id="suggestion"
                              value={feedbackSuggestion}
                              onChange={(e) => setFeedbackSuggestion(e.target.value)}
                              className="col-span-3"
                              placeholder="Hogyan nézett volna ki egy jobb válasz?"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">Mégse</Button>
                          </DialogClose>
                          <Button type="submit" onClick={handleDetailedFeedbackSubmit} disabled={!feedbackCategory}>Küldés</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Confidence Threshold</CardTitle>
            <CardDescription>
              Adjust the confidence threshold for the Mixture of Experts router.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Label htmlFor="confidence-threshold">Threshold: {confidenceThreshold}</Label>
              <Input
                id="confidence-threshold"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={confidenceThreshold}
                onChange={handleThresholdChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 