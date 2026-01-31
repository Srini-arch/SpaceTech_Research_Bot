
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
  optimizationPotential: number; // 0-100
  feasibilityRisk: 'Low' | 'Medium' | 'High';
}

export interface VisualFinding {
  figureId: string;
  type: 'chart' | 'diagram' | 'graph' | 'flow_simulation';
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
  executionMetrics?: {
    convergenceRate: number;
    stabilityIndex: number;
    computeTimeMs: number;
    mhdStabilityLevel: number; // 0-1
  };
}

export interface VerificationAgentResponse {
  agentName: string;
  role: string;
  verdict: 'VALIDATED' | 'SKEPTICAL' | 'FLAWED';
  rationale: string;
  feasibilityRating: number; // 1-10
  practicalityBottleneck?: string;
}

export interface VerificationSuiteResults {
  physicsReview: VerificationAgentResponse;
  materialReview: VerificationAgentResponse;
  engineeringReview: VerificationAgentResponse;
  manufacturingReview: VerificationAgentResponse;
  codeLabResults?: CodeVerification[];
  overallConfidence: number;
  practicalityScore: number; // 1-100
  readinessLevel: number; // TRL 1-9
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
  isOptimizationFocus: boolean;
}

export interface EngineSubsystem {
  name: string;
  status: number; // 0-100 (TRL progress)
  specifications: string; // Highly detailed technical string
  costEfficiency: number; // 0-100 (higher = more cost effective)
  lastUpdate: string;
  optimizationHistory: { cycle: number; delta: number; verified: boolean }[];
  feasibilityAudit: {
    practicalityIndex: number;
    primaryRisk: string;
    manufacturingStatus: 'Theoretical' | 'Prototyping' | 'Production';
  };
}

export interface Breakthrough {
  id: string;
  title: string;
  date: string;
  impactScore: number;
  description: string;
  proofOfConcept: string; 
  blueprintImpact: string; 
  reportId?: string;
  visualUrl?: string; 
}

export interface SimulationTelemetry {
  plasmaPressure: number;
  fuelFlowRate: number;
  neutronFlux: number;
  containmentStability: number;
  thermalGradient: number;
  mhdConvergence: boolean;
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
  simulationTelemetry?: SimulationTelemetry;
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
  simulationSummary: {
    plasmaStability: number;
    fuelThroughput: number;
    thermalGradient: string;
    mhdConvergence: boolean;
  };
  isBreakthrough?: boolean;
  timestamp: string;
  visualUrl?: string;
}

export interface BotObservation {
  category: string;
  severity: 'low' | 'medium' | 'high';
  finding: string;
  suggestedAction: string;
}

export interface BotReport {
  timestamp: string;
  systemHealth: number;
  agentEfficiency: number;
  observations: BotObservation[];
  performanceMetrics: {
    label: string;
    value: number;
  }[];
  summary: string;
}

export enum ResearchStage {
  IDLE = 'IDLE',
  TOPIC_DISCOVERY = 'TOPIC_DISCOVERY',
  LITERATURE_SYNTHESIS = 'LITERATURE_SYNTHESIS',
  HYPOTHESIS_GENERATION = 'HYPOTHESIS_GENERATION',
  MHD_SIMULATION = 'MHD_SIMULATION',
  FUEL_DYNAMICS_CFD = 'FUEL_DYNAMICS_CFD',
  CODE_VERIFICATION = 'CODE_VERIFICATION',
  SCIENTIFIC_VERIFICATION = 'SCIENTIFIC_VERIFICATION',
  JOURNAL_PUBLICATION = 'JOURNAL_PUBLICATION',
  KNOWLEDGE_INTEGRATION = 'KNOWLEDGE_INTEGRATION',
  BOT_ANALYSIS = 'BOT_ANALYSIS',
  COMPLETED = 'COMPLETED'
}

export interface AgentLog {
  agentName: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'sim' | 'vis';
}
