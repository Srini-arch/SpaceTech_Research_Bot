
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ResearchTopic, 
  Paper, 
  Hypothesis, 
  ResearchReport, 
  VisualFinding, 
  VerificationSuiteResults, 
  RocketKnowledgeState,
  CodeVerification,
} from "../types";

// Helper to get a fresh AI instance with current key
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async discoverTopics(papers: Paper[], knowledge: RocketKnowledgeState, prioritySubsystem?: string): Promise<ResearchTopic[]> {
    const ai = getAI();
    const subsystemStatus = Object.entries(knowledge.subsystems)
      .map(([name, sub]) => `${name}: ${sub.status}% (Spec: ${sub.specifications.substring(0, 50)}...)`).join(', ');

    const prompt = `You are the Strategic Topic Discovery Engine. 
    Current Engine Readiness: ${subsystemStatus}.
    ${prioritySubsystem ? `CRITICAL PRIORITY TARGET: ${prioritySubsystem.toUpperCase()}` : 'GOAL: Identify the next logical breakthrough across all systems.'}
    
    TASK: Identify 5 research topics that act as "Breakthrough Accelerators". 
    Focus specifically on moving the ${prioritySubsystem || 'weakest'} subsystem closer to 100% viability.
    
    RECENT RESEARCH CONTEXT:
    ${papers.map(p => `- ${p.title}: ${p.summary}`).join('\n')}
    
    Return a JSON array of 5 topics with novelty scores (1-10) and the specific architectural gap they bridge. Ensure the topics are technically rigorous and focused on hardware/physics breakthroughs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              noveltyScore: { type: Type.NUMBER },
              gapIdentified: { type: Type.STRING }
            },
            required: ["title", "description", "noveltyScore", "gapIdentified"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  },

  async synthesizeLiterature(papers: Paper[]): Promise<string> {
    const ai = getAI();
    const prompt = `As the Scientific Synthesis Agent, extract the "Gold Standard" parameters from these papers for high-performance rocket engines.
    Focus on:
    1. Regenerative cooling coefficients.
    2. Specific Impulse (Isp) limits for Methalox.
    3. Structural mass fractions using additive manufacturing.
    
    Papers:
    ${papers.map(p => `- ${p.title}: ${p.summary}`).join('\n')}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Synthesis failed.";
  },

  async analyzeVisuals(papers: Paper[]): Promise<VisualFinding[]> {
    const ai = getAI();
    const prompt = `Simulate Multimodal Vision Analysis. Analyze complex engine diagrams for geometric breakthroughs.
    Return JSON array of 3 findings with specific "extractedData" (e.g., nozzle expansion ratios, turbine blade pitch).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              figureId: { type: Type.STRING },
              type: { type: Type.STRING },
              analysis: { type: Type.STRING },
              extractedData: { type: Type.STRING },
              sourcePaper: { type: Type.STRING }
            },
            required: ["figureId", "type", "analysis", "extractedData", "sourcePaper"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  },

  async runCodeLab(hypothesis: Hypothesis): Promise<CodeVerification[]> {
    const ai = getAI();
    const prompt = `Verification Lab: Rigorous audit of "${hypothesis.statement}".
    Write 2 simulation scripts (Python/C++ style) that model the physics.
    Provide detailed "testResults" strings that include numerical delta from baseline.
    
    Return JSON array of 2 CodeVerification objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              filename: { type: Type.STRING },
              language: { type: Type.STRING },
              code: { type: Type.STRING },
              testResults: { type: Type.STRING },
              status: { type: Type.STRING }
            },
            required: ["filename", "language", "code", "testResults", "status"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  },

  async verifyHypothesis(hypothesis: Hypothesis, visuals: VisualFinding[], codeLab: CodeVerification[]): Promise<VerificationSuiteResults> {
    const ai = getAI();
    const prompt = `Lead Verifier: Final audit of Breakthrough Hypothesis.
    Evidence: ${codeLab.map(c => c.testResults).join('; ')}.
    Verdict logic: If simulation PASSED and Visuals support, overallConfidence should be > 0.9.
    
    Return JSON VerificationSuiteResults.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            physicsReview: {
              type: Type.OBJECT,
              properties: { agentName: {type: Type.STRING}, verdict: {type: Type.STRING}, rationale: {type: Type.STRING} },
              required: ["agentName", "verdict", "rationale"]
            },
            materialReview: {
              type: Type.OBJECT,
              properties: { agentName: {type: Type.STRING}, verdict: {type: Type.STRING}, rationale: {type: Type.STRING} },
              required: ["agentName", "verdict", "rationale"]
            },
            engineeringReview: {
              type: Type.OBJECT,
              properties: { agentName: {type: Type.STRING}, verdict: {type: Type.STRING}, rationale: {type: Type.STRING} },
              required: ["agentName", "verdict", "rationale"]
            },
            overallConfidence: { type: Type.NUMBER }
          },
          required: ["physicsReview", "materialReview", "engineeringReview", "overallConfidence"]
        }
      }
    });

    try {
      const parsed = JSON.parse(response.text || '{}');
      return { ...parsed, codeLabResults: codeLab };
    } catch (e) {
      throw new Error("Verification parsing error");
    }
  },

  async generateHypotheses(literature: string, visuals: VisualFinding[], knowledge: RocketKnowledgeState): Promise<Hypothesis[]> {
    const ai = getAI();
    const prompt = `Forge Agent: Create 3 high-impact conjectures to reach 100% engine viability. 
    Focus on subsystems under 50% readiness. Target "Breakthrough" outcomes.
    
    Return JSON array of 3 Hypothesis objects.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              statement: { type: Type.STRING },
              supportingEvidence: { type: Type.STRING },
              verificationAnalysis: {
                type: Type.OBJECT,
                properties: { confidence: { type: Type.NUMBER }, dataAdequacy: { type: Type.STRING } },
                required: ["confidence", "dataAdequacy"]
              },
              methodology: { type: Type.STRING },
              expectedContribution: { type: Type.STRING }
            },
            required: ["title", "statement", "supportingEvidence", "verificationAnalysis", "methodology", "expectedContribution"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  },

  async publishJournal(hypothesis: Hypothesis, verification: VerificationSuiteResults, visuals: VisualFinding[]): Promise<ResearchReport> {
    const ai = getAI();
    const prompt = `Editor-in-Chief: Formalize findings for "${hypothesis.title}".
    
    CRITICAL MANDATE: Provide a "formalProof" section. 
    The proof must be a rigorous mathematical derivation using TeX-style notation where appropriate.
    Include conservation laws (mass, energy, momentum) and specific numerical proof of the delta.
    
    Determine isBreakthrough based on confidence > 0.92 and novelty.
    Generate 5-8 data points for a "Performance Improvement Chart".
    
    Return JSON ResearchReport.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            journalName: { type: Type.STRING },
            literatureReview: { type: Type.STRING },
            methodology: { type: Type.STRING },
            formalProof: { type: Type.STRING, description: "Highly detailed mathematical and physical proof of the breakthrough." },
            resultsPreview: { type: Type.STRING },
            conclusion: { type: Type.STRING },
            isBreakthrough: { type: Type.BOOLEAN },
            evidenceData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { label: {type: Type.STRING}, value: {type: Type.NUMBER}, trend: {type: Type.STRING} },
                required: ["label", "value", "trend"]
              }
            },
            chartData: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                color: { type: Type.STRING },
                points: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      x: { type: Type.STRING },
                      y: { type: Type.NUMBER }
                    },
                    required: ["x", "y"]
                  }
                }
              },
              required: ["label", "points", "color"]
            }
          },
          required: ["journalName", "literatureReview", "methodology", "formalProof", "resultsPreview", "conclusion", "evidenceData", "isBreakthrough", "chartData"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      id: `report-${Date.now()}`,
      title: hypothesis.title,
      hypothesis,
      verificationSuite: verification,
      visualFindings: visuals,
      timestamp: new Date().toISOString(),
      ...parsed
    };
  },

  async updateKnowledgeState(current: RocketKnowledgeState, report: ResearchReport): Promise<RocketKnowledgeState> {
    const ai = getAI();
    const prompt = `Chronos Intelligence: Integrate findings into the 100% Viability Master Blueprint.
    Subsystem Status: ${JSON.stringify(current.subsystems)}.
    Research Outcome: ${report.conclusion}. 
    
    TASK:
    1. Increment subsystem readiness (3-12%).
    2. Update technical specifications for affected subsystems.
    3. If breakthrough, add to breakthroughs array. 
       MANDATORY: Populate the "proofOfConcept" field with a dense summary of the mathematical derivation from the report.
    
    Return updated JSON RocketKnowledgeState.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subsystems: {
              type: Type.OBJECT,
              properties: {
                propulsion: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, status: {type: Type.NUMBER}, specifications: {type: Type.STRING}, lastUpdate: {type: Type.STRING} }, required: ["name", "status", "specifications", "lastUpdate"] },
                thermal: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, status: {type: Type.NUMBER}, specifications: {type: Type.STRING}, lastUpdate: {type: Type.STRING} }, required: ["name", "status", "specifications", "lastUpdate"] },
                structural: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, status: {type: Type.NUMBER}, specifications: {type: Type.STRING}, lastUpdate: {type: Type.STRING} }, required: ["name", "status", "specifications", "lastUpdate"] },
                avionics: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, status: {type: Type.NUMBER}, specifications: {type: Type.STRING}, lastUpdate: {type: Type.STRING} }, required: ["name", "status", "specifications", "lastUpdate"] },
                fuel: { type: Type.OBJECT, properties: { name: {type: Type.STRING}, status: {type: Type.NUMBER}, specifications: {type: Type.STRING}, lastUpdate: {type: Type.STRING} }, required: ["name", "status", "specifications", "lastUpdate"] },
              },
              required: ["propulsion", "thermal", "structural", "avionics", "fuel"]
            },
            masterDesignDoc: { type: Type.STRING },
            cycleCount: { type: Type.NUMBER },
            totalPapersProcessed: { type: Type.NUMBER },
            breakthroughs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { 
                  id: {type: Type.STRING}, 
                  title: {type: Type.STRING}, 
                  date: {type: Type.STRING}, 
                  impactScore: {type: Type.NUMBER}, 
                  description: {type: Type.STRING},
                  proofOfConcept: {type: Type.STRING} 
                },
                required: ["id", "title", "date", "impactScore", "description", "proofOfConcept"]
              }
            }
          },
          required: ["subsystems", "masterDesignDoc", "cycleCount", "totalPapersProcessed", "breakthroughs"]
        }
      }
    });

    const nextState = JSON.parse(response.text || JSON.stringify(current));
    
    return {
      ...nextState,
      pastReports: [report, ...(current.pastReports || [])].slice(0, 50)
    };
  }
};
