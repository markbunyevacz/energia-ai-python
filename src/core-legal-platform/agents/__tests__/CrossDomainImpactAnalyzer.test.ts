import { CrossDomainImpactAnalyzer } from '../impact-analysis/CrossDomainImpactAnalyzer';
import { AgentConfig, AgentContext } from '../base-agents/BaseAgent';
import { LegalDocument } from '../../legal-domains/types';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// NOTE: These are unit tests that heavily rely on mocking external services.
// For a complete validation of the agent's functionality, integration tests
// that interact with actual Supabase and Embedding services are recommended.

describe('CrossDomainImpactAnalyzer', () => {
    let analyzer: CrossDomainImpactAnalyzer;
    const config: AgentConfig = {
        id: 'cross-domain-impact-analyzer',
        name: 'Cross Domain Impact Analyzer',
        description: 'Analyzes impacts across different legal domains',
        domainCode: 'cross-domain',
        enabled: true,
        cacheConfig: {
            ttl: 300,
            maxSize: 100
        },
        batchConfig: {
            maxBatchSize: 5,
            batchTimeout: 5000
        }
    };

    beforeEach(() => {
        analyzer = new CrossDomainImpactAnalyzer(config);
        vi.clearAllMocks();
    });

    describe('Domain Independence Tests', () => {
        it('should work with energy law documents', async () => {
            const energyDoc = createTestDocument('energy', 'law', 'Energy regulation content');
            const result = await processDocumentWithMocks(energyDoc, 'regulatory');
            
            expect(result.success).toBe(true);
            expect(result.data.impacts).toHaveLength(1);
            expect(result.data.impacts[0].domain).toBe('regulatory');
        });

        it('should work with tax law documents', async () => {
            const taxDoc = createTestDocument('tax', 'regulation', 'Tax code provisions');
            const result = await processDocumentWithMocks(taxDoc, 'labor');
            
            expect(result.success).toBe(true);
            expect(result.data.impacts).toHaveLength(1);
            expect(result.data.impacts[0].domain).toBe('labor');
        });

        it('should work with labor law documents', async () => {
            const laborDoc = createTestDocument('labor', 'policy', 'Employment regulations');
            const result = await processDocumentWithMocks(laborDoc, 'energy');
            
            expect(result.success).toBe(true);
            expect(result.data.impacts).toHaveLength(1);
            expect(result.data.impacts[0].domain).toBe('energy');
        });
    });

    describe('Error Handling Tests', () => {
        it('should handle empty document content gracefully', async () => {
            const doc = createTestDocument('energy', 'law', '');
            const context: AgentContext = { document: doc, domain: 'energy' };

            const result = await analyzer.process(context);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Document content is empty');
        });

        it('should handle embedding service failures gracefully', async () => {
            const doc = createTestDocument('energy', 'law', 'Test content');
            const embeddingService = (analyzer as any).embeddingService;
            
            vi.spyOn(embeddingService, 'getEmbedding').mockRejectedValue(new Error('Embedding service unavailable'));

            const result = await analyzer.process({ document: doc, domain: 'energy' });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('Risk Scoring Tests', () => {
        it('should calculate higher risk for shorter impact chains', async () => {
            const doc = createTestDocument('energy', 'law', 'Test content');
            const embeddingService = (analyzer as any).embeddingService;
            const impactAnalyzer = (analyzer as any).impactAnalyzer;

            vi.spyOn(embeddingService, 'getEmbedding').mockResolvedValue([0.1, 0.2, 0.3]);
            vi.spyOn(embeddingService, 'findSimilarDocuments').mockResolvedValue([
                { id: 'doc1', content: 'content1', metadata: { domain: 'regulatory', importance: 1 } },
                { id: 'doc2', content: 'content2', metadata: { domain: 'regulatory', importance: 1 } }
            ]);
            vi.spyOn(impactAnalyzer, 'analyzeImpact')
                .mockResolvedValueOnce([{ impact_path: ['doc1'] }])
                .mockResolvedValueOnce([{ impact_path: ['doc2', 'doc3', 'doc4'] }]);

            const result = await analyzer.process({ document: doc, domain: 'energy' });
            
            expect(result.success).toBe(true);
            expect(result.data.impacts).toHaveLength(2);
            
            const shortChainRisk = result.data.impacts[0].riskScore;
            const longChainRisk = result.data.impacts[1].riskScore;
            
            expect(shortChainRisk).toBeGreaterThan(longChainRisk);
        });
    });

    describe('Visualization Tests', () => {
        it('should generate valid Mermaid diagram', async () => {
            const doc = createTestDocument('energy', 'law', 'Test content');
            const result = await processDocumentWithMocks(doc, 'regulatory');

            expect(result.data.visualization).toContain('graph TD');
            expect(result.data.visualization).toContain('cross-domain');
            expect(result.data.visualization).toContain('-->');
        });

        it('should handle no impacts gracefully in visualization', async () => {
            const doc = createTestDocument('energy', 'law', 'Test content');
            setupEmptyMocks();

            const result = await analyzer.process({ document: doc, domain: 'energy' });

            expect(result.success).toBe(true);
            expect(result.data.visualization).toBe('');
        });
    });

    // Helper functions
    function createTestDocument(domain: string, type: any, content: string): LegalDocument {
        return {
            id: `test-doc-${Date.now()}`,
            title: `Test ${domain} document`,
            content,
            documentType: type,
            domainId: domain,
            metadata: {
                domain,
                importance: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };
    }

    async function processDocumentWithMocks(doc: LegalDocument, targetDomain: string) {
        setupMocks(targetDomain);
        return await analyzer.process({ document: doc, domain: doc.metadata.domain });
    }

    function setupMocks(targetDomain: string = 'regulatory') {
        const embeddingService = (analyzer as any).embeddingService;
        const impactAnalyzer = (analyzer as any).impactAnalyzer;

        vi.spyOn(embeddingService, 'getEmbedding').mockResolvedValue([0.1, 0.2, 0.3]);
        
        embeddingService.findSimilarDocuments = vi.fn().mockImplementation(
            (embedding: number[], threshold: number, limit: number, options?: { excludeDomainId?: string }) => {
                if (options?.excludeDomainId && options.excludeDomainId !== targetDomain) {
                    return Promise.resolve([
                        {
                            id: 'similar-doc-1',
                            title: 'Similar Document 1',
                            content: 'Similar content',
                            documentType: 'regulation',
                            domainId: targetDomain,
                            metadata: { domain: targetDomain, importance: 3 }
                        }
                    ]);
                }
                // Default mock for most tests which expect a cross-domain result.
                if (!options?.excludeDomainId) {
                     return Promise.resolve([
                        {
                            id: 'similar-doc-1',
                            title: 'Similar Document 1',
                            content: 'Similar content',
                            documentType: 'regulation',
                            domainId: targetDomain,
                            metadata: { domain: targetDomain, importance: 3 }
                        }
                    ]);
                }
                return Promise.resolve([]);
            }
        );

        vi.spyOn(impactAnalyzer, 'analyzeImpact').mockResolvedValue([
            { id: 'chain-1', root_document_id: 'similar-doc-1', affected_document_id: 'impact-doc-2', impact_path: ['similar-doc-1', 'impact-doc-2', 'impact-doc-3'], impact_level: 'indirect' }
        ]);
    }

    function setupEmptyMocks() {
        const embeddingService = (analyzer as any).embeddingService;
        
        vi.spyOn(embeddingService, 'getEmbedding').mockResolvedValue([0.1, 0.2, 0.3]);
        embeddingService.findSimilarDocuments = vi.fn().mockResolvedValue([]);
    }
}); 