import { CrossDomainImpactAnalyzer, CrossDomainImpact } from '@/core-legal-platform/agents/impact-analysis/CrossDomainImpactAnalyzer';
import { AgentConfig, AgentContext } from '@/core-legal-platform/agents/base-agents/BaseAgent';
import { LegalDocument } from '@/core-legal-platform/legal-domains/types';
import { supabase } from '@/integrations/supabase/client';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * REAL INTEGRATION TESTS - NO MOCKS
 * 
 * These tests use actual Supabase database and embedding services
 * to validate the CrossDomainImpactAnalyzer functionality
 */
describe('CrossDomainImpactAnalyzer Integration Tests', () => {
    let analyzer: CrossDomainImpactAnalyzer;
    let testDocumentIds: string[] = [];

    const config: AgentConfig = {
        id: 'cross-domain-analyzer',
        name: 'Cross-Domain Impact Analyzer',
        description: 'Integration test configuration',
        domainCode: 'cross-domain',
        enabled: true,
    };

    beforeAll(async () => {
        analyzer = new CrossDomainImpactAnalyzer(config);
        await analyzer.initialize();

        // Create test documents in different domains for real testing
        await setupTestDocuments();
    });

    afterAll(async () => {
        // Clean up test documents
        await cleanupTestDocuments();
    });

    it('should analyze real cross-domain impacts between energy and regulatory domains', async () => {
        const energyDocument: LegalDocument = {
            id: testDocumentIds[0],
            title: 'Renewable Energy Act Amendment',
            content: 'This act amends the renewable energy framework to align with new regulatory standards for carbon emissions and environmental compliance.',
            documentType: 'law',
            domainId: 'energy',
            metadata: {
                domain: 'energy',
                importance: 3,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        };

        const context: AgentContext = {
            document: energyDocument,
            domain: 'energy',
            metadata: { domain: 'energy' }
        };

        const result = await analyzer.process(context);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        
        const analysisResult = result.data;
        expect(analysisResult.impacts).toBeDefined();
        expect(analysisResult.visualization).toBeDefined();
        expect(analysisResult.contractImpacts).toBeDefined();
        expect(analysisResult.metadata).toBeDefined();

        // Verify cross-domain detection
        if (analysisResult.impacts.length > 0) {
            const crossDomainImpact = analysisResult.impacts.find((impact: CrossDomainImpact) => 
                impact.domain !== 'energy'
            );
            expect(crossDomainImpact).toBeDefined();
        }
    }, 45000); // Longer timeout for real API calls

    it('should integrate with contract analysis for real impact assessment', async () => {
        const regulatoryDocument: LegalDocument = {
            id: testDocumentIds[1],
            title: 'Environmental Compliance Directive',
            content: 'New compliance requirements for industrial operations regarding environmental protection and waste management.',
            documentType: 'regulation',
            domainId: 'regulatory',
            metadata: {
                domain: 'regulatory',
                importance: 4,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        };

        const context: AgentContext = {
            document: regulatoryDocument,
            domain: 'regulatory',
            metadata: { domain: 'regulatory' }
        };

        const result = await analyzer.process(context);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        
        const analysisResult = result.data;
        expect(analysisResult.contractImpacts).toBeDefined();
        expect(analysisResult.contractImpacts.recommendations).toBeDefined();
        expect(Array.isArray(analysisResult.contractImpacts.recommendations)).toBe(true);

        // Verify contract analysis integration
        if (analysisResult.impacts.length > 0) {
            const impactWithContractAnalysis = analysisResult.impacts.find((impact: CrossDomainImpact) => 
                impact.contractAnalysis !== undefined
            );
            
            if (impactWithContractAnalysis) {
                expect(impactWithContractAnalysis.contractAnalysis.riskLevel).toMatch(/^(low|medium|high)$/);
                expect(Array.isArray(impactWithContractAnalysis.contractAnalysis.affectedContracts)).toBe(true);
                expect(Array.isArray(impactWithContractAnalysis.contractAnalysis.recommendations)).toBe(true);
            }
        }
    }, 45000);

    it('should generate meaningful risk scores based on real impact chains', async () => {
        const laborDocument: LegalDocument = {
            id: testDocumentIds[2],
            title: 'Employment Rights Update',
            content: 'Updated employment rights regarding working hours, benefits, and workplace safety standards.',
            documentType: 'policy',
            domainId: 'labor',
            metadata: {
                domain: 'labor',
                importance: 2,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        };

        const context: AgentContext = {
            document: laborDocument,
            domain: 'labor',
            metadata: { domain: 'labor' }
        };

        const result = await analyzer.process(context);

        expect(result.success).toBe(true);
        
        if (result.data && result.data.impacts.length > 0) {
            const impacts = result.data.impacts;
            
            // Verify risk scores are realistic
            impacts.forEach((impact: CrossDomainImpact) => {
                expect(impact.riskScore).toBeGreaterThanOrEqual(0);
                expect(impact.riskScore).toBeLessThanOrEqual(1);
                expect(typeof impact.riskScore).toBe('number');
            });

            // Verify impact chain structure
            impacts.forEach((impact: CrossDomainImpact) => {
                expect(Array.isArray(impact.impactChain)).toBe(true);
                expect(impact.impactChain.length).toBeGreaterThan(0);
            });
        }
    }, 45000);

    it('should handle real embedding service errors gracefully', async () => {
        // Test with empty content to trigger real error handling
        const invalidDocument: LegalDocument = {
            id: 'invalid-doc-id',
            title: 'Invalid Document',
            content: '', // Empty content should trigger error
            documentType: 'other',
            domainId: 'test',
            metadata: {
                domain: 'test',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            }
        };

        const context: AgentContext = {
            document: invalidDocument,
            domain: 'test',
            metadata: { domain: 'test' }
        };

        const result = await analyzer.process(context);

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.message).toContain('empty');
    });

    async function setupTestDocuments(): Promise<void> {
        // Insert test documents into the actual database
        const testDocs = [
            {
                id: crypto.randomUUID(),
                title: 'Test Energy Document',
                content: 'Energy law test content for cross-domain analysis',
                document_type: 'law',
                domain_id: 'energy',
                metadata: { domain: 'energy', importance: 3 }
            },
            {
                id: crypto.randomUUID(),
                title: 'Test Regulatory Document',
                content: 'Regulatory test content for cross-domain impact testing',
                document_type: 'regulation',
                domain_id: 'regulatory',
                metadata: { domain: 'regulatory', importance: 4 }
            },
            {
                id: crypto.randomUUID(),
                title: 'Test Labor Document',
                content: 'Labor law test content for employment regulations',
                document_type: 'policy',
                domain_id: 'labor',
                metadata: { domain: 'labor', importance: 2 }
            }
        ];

        for (const doc of testDocs) {
            const { error } = await supabase
                .from('legal_documents')
                .insert(doc);
            
            if (!error) {
                testDocumentIds.push(doc.id);
            }
        }

        // Also create some citation relationships for impact chain testing
        if (testDocumentIds.length >= 2) {
            await supabase
                .from('citation_edges')
                .insert({
                    source_document_id: testDocumentIds[0],
                    target_document_id: testDocumentIds[1],
                    citation_type: 'explicit',
                    metadata: { test: true }
                });
        }
    }

    async function cleanupTestDocuments(): Promise<void> {
        // Clean up test citation relationships
        await supabase
            .from('citation_edges')
            .delete()
            .in('source_document_id', testDocumentIds);

        // Clean up test documents
        await supabase
            .from('legal_documents')
            .delete()
            .in('id', testDocumentIds);
    }
}); 