
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ResearchTopic, 
  Paper, 
  Hypothesis, 
  ResearchReport, 
  VerificationSuiteResults, 
  RocketKnowledgeState,
  CodeVerification,
  SimulationTelemetry,
  BotReport
} from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async discoverTopics(papers: Paper[], knowledge: RocketKnowledgeState, targetSubsystem: string): Promise<ResearchTopic[]> {
    const ai = getAI();
    const subsystem = knowledge.subsystems[targetSubsystem as keyof typeof knowledge.subsystems];

    const prompt = `Task: Identify 3 high-impact research topics for INCREMENTAL IMPROVEMENT of the ${subsystem.name}.
    SPECS: ${subsystem.specifications}. TRL: ${subsystem.status}%.
    Focus: Cost reduction and engineering practicality.
    Return JSON array of 3 objects with properties: title, description, noveltyScore (1-100), gapIdentified, optimizationPotential (1-100), feasibilityRisk (Low|Medium|High).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Topic discovery parsing failed", e);
      return [];
    }
  },

  async runMetaAnalysis(knowledge: RocketKnowledgeState, logs: any[]): Promise<BotReport> {
    const ai = getAI();
    const prompt = `You are MAIRIS-OBSERVATORY-1 (M-O1), a micro-bot dedicated to observing, measuring, and reporting on the Mairis Prime Rocketry Synthesis System.
    Analyze the current system state and recent agent logs to suggest improvements.
    
    SYSTEM STATE: ${JSON.stringify(knowledge.subsystems)}
    RECENT LOGS: ${JSON.stringify(logs.slice(-20))}
    
    TASK: Output a detailed strategic audit in JSON format:
    - timestamp (ISO)
    - systemHealth (0-100, based on subsystem status and stability)
    - agentEfficiency (0-100, based on log frequency and success types)
    - observations (Array of { category, severity: 'low'|'medium'|'high', finding, suggestedAction })
    - performanceMetrics (Array of { label, value: 0-100 })
    - summary (Concise technical summary of the system's evolutionary path)
    
    DO NOT suggest changes to the UI code. Focus ONLY on the research process, subsystem optimization strategies, and agent coordination.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      console.error("Meta-analysis parsing failed", e);
      throw new Error("Meta-analysis failed");
    }
  },

  async generateSimulationTelemetry(hypothesis: Hypothesis): Promise<SimulationTelemetry> {
    const ai = getAI();
    const prompt = `Simulate the impact of this design modification on a D-D fusion core: "${hypothesis.statement}".
    Output 6 technical telemetry metrics as a JSON object:
    - plasmaPressure (Pa)
    - fuelFlowRate (kg/s)
    - neutronFlux (n/cm2/s)
    - containmentStability (0-1.0)
    - thermalGradient (K/m)
    - mhdConvergence (boolean)
    Ensure values are physically plausible for a high-performance fusion engine.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { plasmaPressure: 0, fuelFlowRate: 0, neutronFlux: 0, containmentStability: 0, thermalGradient: 0, mhdConvergence: false };
    }
  },

  async generateFusionVisual(description: string, mode: 'plasma' | 'fuel' | 'fusion' = 'fusion'): Promise<string | undefined> {
    const ai = getAI();
    try {
      const modePrompt = mode === 'plasma' ? 'High-energy magnetic plasma confinement' : 
                         mode === 'fuel' ? 'High-velocity fluid fuel injection streamlines' : 
                         '3D cross-section of a D-D fusion reaction core';
      
      const prompt = `Professional technical 3D CAD simulation visualization: ${modePrompt}. 
      Context: ${description}. 
      Style: Scientific ray-tracing, glowing energetic particles, volumetric lighting, dark blueprints background. 
      High-resolution 4K render.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (error) {
      console.error("Visual generation failed:", error);
    }
    return undefined;
  },

  async synthesizeLiterature(papers: Paper[]): Promise<string> {
    const ai = getAI();
    const prompt = `Concisely synthesize current industrial state-of-the-art for D-D fusion core materials and MHD stability. Focus on actionable engineering data.`;
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Synthesis failed.";
  },

  async runCodeLab(hypothesis: Hypothesis): Promise<CodeVerification[]> {
    const ai = getAI();
    const prompt = `Generate a concise Python script to verify the thermal efficiency of: "${hypothesis.statement}".
    Include mock execution results. Return as JSON array of 1 CodeVerification object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  },

  async verifyHypothesis(hypothesis: Hypothesis, codeLab: CodeVerification[]): Promise<VerificationSuiteResults> {
    const ai = getAI();
    const prompt = `Rigorous Verification Audit: Evaluate hypothesis "${hypothesis.title}" for practical D-D fusion engine implementation.
    Include verdicts for Physics, Engineering, and Manufacturing. 
    Assign practicalityScore (1-100) and readinessLevel (TRL 1-9).
    Return JSON VerificationSuiteResults object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      throw new Error("Verification synthesis failed");
    }
  },

  async generateHypotheses(literature: string, knowledge: RocketKnowledgeState): Promise<Hypothesis[]> {
    const ai = getAI();
    const prompt = `Forge a single, testable, high-impact engineering hypothesis to improve the Master Blueprint. 
    Context: ${literature}. 
    Return as JSON array of 1 Hypothesis object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      return [];
    }
  },

  async publishJournal(hypothesis: Hypothesis, verification: VerificationSuiteResults): Promise<ResearchReport> {
    const ai = getAI();
    const prompt = `Publish final optimization report for: ${hypothesis.title}.
    Highlight confirmed improvements to the blueprint.
    Return JSON ResearchReport object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      id: `rep-${Date.now()}`,
      title: hypothesis.title,
      hypothesis,
      verificationSuite: verification,
      timestamp: new Date().toISOString(),
      ...parsed
    };
  },

  async updateKnowledgeState(current: RocketKnowledgeState, report: ResearchReport): Promise<RocketKnowledgeState> {
    const ai = getAI();
    const prompt = `Update the Master Design Blueprint based on the latest findings: ${report.title}.
    Target completion of all subsystems to 100% status (TRL 9). 
    Adjust 'specifications', 'status', and 'costEfficiency' of the relevant subsystems.
    Current State: ${JSON.stringify(current.subsystems)}
    Return updated JSON RocketKnowledgeState object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    try {
      const nextState = JSON.parse(response.text || JSON.stringify(current));
      return {
        ...nextState,
        pastReports: [report, ...(current.pastReports || [])].slice(0, 50)
      };
    } catch (e) {
      return current;
    }
  }
};
