
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  url: string;
  noveltyScore?: number;
}

export interface ResearchTopic {
  title: string;
  description: string;
  noveltyScore: number;
  gapIdentified: string;
}

export interface VisualFinding {
  figureId: string;
  type: 'chart' | 'diagram' | 'graph';
  analysis: string;
  extractedData: string;
  sourcePaper: string;
  imageUrl?: string;
}

export interface CodeVerification {
  filename: string;
  language: string;
  code: string;
  testResults: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
}

export interface VerificationAgentResponse {
  agentName: string;
  role: string;
  verdict: 'VALIDATED' | 'SKEPTICAL' | 'FLAWED';
  rationale: string;
}

export interface VerificationSuiteResults {
  physicsReview: VerificationAgentResponse;
  materialReview: VerificationAgentResponse;
  engineeringReview: VerificationAgentResponse;
  codeLabResults?: CodeVerification[];
  overallConfidence: number;
}

export interface Hypothesis {
  title: string;
  statement: string;
  supportingEvidence: string;
  verificationAnalysis: {
    confidence: number;
    dataAdequacy: string;
  };
  methodology: string;
  expectedContribution: string;
}

export interface EngineSubsystem {
  name: string;
  status: number; // 0-100
  specifications: string;
  lastUpdate: string;
}

export interface Breakthrough {
  id: string;
  title: string;
  date: string;
  impactScore: number;
  description: string;
  proofOfConcept: string; 
  reportId?: string;
}

export interface RocketKnowledgeState {
  subsystems: {
    propulsion: EngineSubsystem;
    thermal: EngineSubsystem;
    structural: EngineSubsystem;
    avionics: EngineSubsystem;
    fuel: EngineSubsystem;
  };
  masterDesignDoc: string;
  cycleCount: number;
  totalPapersProcessed: number;
  breakthroughs: Breakthrough[];
  pastReports: ResearchReport[];
}

export interface ChartPoint {
  x: string | number;
  y: number;
}

export interface ResearchReport {
  id: string;
  title: string;
  journalName: string;
  literatureReview: string;
  hypothesis: Hypothesis;
  verificationSuite?: VerificationSuiteResults;
  methodology: string;
  formalProof: string; 
  resultsPreview: string;
  conclusion: string;
  visualFindings?: VisualFinding[];
  evidenceData: {
    label: string;
    value: number;
    trend: 'rising' | 'falling' | 'stable';
  }[];
  chartData: {
    label: string;
    points: ChartPoint[];
    color: string;
  };
  qualityValidation?: {
    novelty: number;
    rigor: number;
    impact: number;
    decision: 'PUBLISH' | 'REVISE' | 'REJECT';
    critique: string;
  };
  isBreakthrough?: boolean;
  timestamp: string;
}

export enum ResearchStage {
  IDLE = 'IDLE',
  TOPIC_DISCOVERY = 'TOPIC_DISCOVERY',
  DATA_INGESTION = 'DATA_INGESTION',
  LITERATURE_SYNTHESIS = 'LITERATURE_SYNTHESIS',
  VISUAL_ANALYSIS = 'VISUAL_ANALYSIS',
  HYPOTHESIS_GENERATION = 'HYPOTHESIS_GENERATION',
  CODE_VERIFICATION = 'CODE_VERIFICATION',
  SCIENTIFIC_VERIFICATION = 'SCIENTIFIC_VERIFICATION',
  JOURNAL_PUBLICATION = 'JOURNAL_PUBLICATION',
  KNOWLEDGE_INTEGRATION = 'KNOWLEDGE_INTEGRATION',
  COMPLETED = 'COMPLETED'
}

export interface AgentLog {
  agentName: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
