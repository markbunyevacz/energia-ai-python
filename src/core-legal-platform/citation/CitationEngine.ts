export interface Citation {
  fullCitation: string;
  shortCitation: string;
}

export class CitationEngine {
  // Regex for common Hungarian (e.g., B.H. 2023.123) and EU (e.g., C-123/23) citation formats
  private readonly HU_CITATION_REGEX = /^[A-Z\.]+ ?\d{4}\.\d+$/;
  private readonly EU_CITATION_REGEX = /^[A-Z]-\d{1,4}\/\d{2,4}$/;

  public generateCitation(document: any): Citation {
    const caseNumber = document.case_number || 'Unknown Case';
    const courtName = document.court_name || 'Unknown Court';
    const year = document.decision_date ? new Date(document.decision_date).getFullYear() : 'N.D.';
    const jurisdiction = document.jurisdiction || 'Unknown Jurisdiction';

    let fullCitation: string;
    // Customize citation format based on jurisdiction
    if (jurisdiction.toUpperCase() === 'HU') {
      fullCitation = `${courtName}, ${caseNumber} (${year})`;
    } else if (jurisdiction.toUpperCase() === 'EU') {
      fullCitation = `Case ${caseNumber}, ${courtName}, ${year}`;
    } else {
      fullCitation = `${caseNumber} (${courtName}, ${year})`;
    }

    return {
      fullCitation,
      shortCitation: `${caseNumber}`,
    };
  }

  public validateCitation(citation: string): boolean {
    if (!citation) return false;
    // Check against both Hungarian and EU formats
    return this.HU_CITATION_REGEX.test(citation) || this.EU_CITATION_REGEX.test(citation);
  }
} 