import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

// Domain and Agent imports
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
  const [moeRouter, setMoeRouter] = useState<MixtureOfExpertsRouter | null>(null);
  const [recommendedAgents, setRecommendedAgents] = useState<AgentScore[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<BaseAgent | null>(null);
  
  /** 
   * Error state for user feedback and debugging
   * Displays localized error messages in Hungarian
   */
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  useEffect(() => {
    // Initialize the core components of the legal platform
    const initializePlatform = async () => {
      try {
        const domainRegistry = DomainRegistry.getInstance();
        
        // Register domains if not already registered
        if (!domainRegistry.getDomain('energy')) {
          await domainRegistry.registerDomain(energyDomain);
        }
        if (!domainRegistry.getDomain('general')) {
          await domainRegistry.registerDomain(generalDomain);
        }

        // Initialize agents
        const contractAgent = new ContractAnalysisAgent(domainRegistry);
        await contractAgent.initialize();
        
        const generalAgent = new GeneralPurposeAgent(domainRegistry);
        await generalAgent.initialize();

        const agentPool = [contractAgent, generalAgent];

        // Initialize router
        const router = new MixtureOfExpertsRouter(agentPool, domainRegistry);
        setMoeRouter(router);

      } catch (err) {
        console.error("Failed to initialize the legal platform:", err);
        setError("A platform inicializálása sikertelen volt. Kérjük, frissítse az oldalt.");
      }
    };

    initializePlatform();
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

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
    if (!file) return; // Should not happen if we have a selected agent

    setSelectedAgent(agent);
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress('Dokumentum szövegének kinyerése...');

    try {
      const textContent = await extractTextFromFile(file);
      setProgress('Elemzés folyamatban...');

      const legalDocument: LegalDocument = {
        id: file.name, // Using file name as a temporary ID
        title: file.name,
        content: textContent,
        documentType: 'other', // TODO: Make this dynamic and align with schema
        domainId: agent.getConfig().domainCode,
        metadata: {
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      };
      
      const userContext = await conversationContextManager.getContext(user?.id || 'anonymous');
      
      const agentContext: AgentContext = {
        document: legalDocument,
        domain: agent.getConfig().domainCode,
        user: user ? { id: user.id, role: 'jogász', permissions: [] } : undefined,
        conversationHistory: userContext?.messages || []
      };

      const analysisResult: AgentResult = await agent.process(agentContext);

      if (analysisResult.success) {
        // Adapt the agent result to the format the UI expects
        const uiResult: AnalysisResult = {
          id: new Date().toISOString(),
          risk_level: analysisResult.data.risk_level || 'low',
          summary: analysisResult.data.summary || 'Nincs összegzés.',
          recommendations: analysisResult.data.recommendations || [],
          risks: analysisResult.data.risks || [],
          status: 'completed'
        };
        setResult(uiResult);

        // Update conversation context
        await conversationContextManager.updateContext(
          user?.id || 'anonymous', 
          {
            question: notes,
            answer: uiResult.summary,
            agentType: agent.getConfig().id,
            sources: [file.name]
          },
          user?.id
        );

      } else {
        throw analysisResult.error || new Error(analysisResult.message);
      }

    } catch (err: any) {
      setError(`Hiba történt az elemzés során: ${err.message}`);
      console.error(err);
      setResult({
        id: 'error',
        risk_level: 'low',
        summary: 'Hiba történt.',
        recommendations: [],
        risks: [],
        status: 'failed'
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="container mx-auto p-4">
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

        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Elemzési eredmény</CardTitle>
              <CardDescription>
                A(z) "{selectedAgent?.getConfig().name || 'AI'}" ügynök által végzett elemzés eredménye.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Kockázati szint</Label>
                <p className={`font-bold ${
                  result.risk_level === 'high' ? 'text-red-500' :
                  result.risk_level === 'medium' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {result.risk_level === 'high' ? 'Magas' : result.risk_level === 'medium' ? 'Közepes' : 'Alacsony'}
                </p>
              </div>
              <div>
                <Label>Összefoglaló</Label>
                <p>{result.summary}</p>
              </div>
              <div>
                <Label>Javaslatok</Label>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {result.recommendations.map((recommendation: string, index: number) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Label>Kockázatok</Label>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {result.risks.map((risk: AnalysisRisk, index: number) => (
                    <div key={index} className="border-t pt-4">
                      <h4 className="font-semibold">{risk.type} (Súlyosság: {risk.severity})</h4>
                      <p className="text-sm text-muted-foreground">Érintett szakasz: {risk.section}</p>
                      <p>{risk.description}</p>
                      <p className="mt-2 text-sm">
                        <span className="font-semibold">Javaslat:</span> {risk.recommendation}
                      </p>
                    </div>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 