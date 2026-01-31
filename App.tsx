
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { 
  ResearchReport, 
  ResearchStage, 
  AgentLog, 
  RocketKnowledgeState,
  EngineSubsystem,
  ChartPoint,
  Breakthrough,
  SimulationTelemetry,
  BotReport
} from './types';
import { geminiService } from './services/geminiService';
import { 
  Play,
  Pause,
  Download,
  Settings,
  Loader2,
  Key,
  Lock,
  ArrowLeft,
  X,
  Activity,
  FileText,
  HardDriveDownload,
  Upload,
  ShieldCheck,
  ChevronDown,
  Coins,
  Cpu as Microchip,
  Terminal,
  Target,
  History,
  Image as ImageIcon,
  FileDown,
  Zap,
  RotateCcw,
  Gauge,
  Maximize2,
  ZoomIn,
  Wind,
  Flame,
  Activity as Pulse,
  Box,
  Layers,
  Thermometer,
  CloudRain,
  Compass,
  Database,
  Eye,
  BrainCircuit,
  ScanSearch,
  AlertTriangle,
  ClipboardCheck,
  Radar
} from 'lucide-react';

const STORAGE_KEY = 'mairis_prime_fusion_state_v23';

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};

const downloadImage = (url: string, fileName: string) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const INITIAL_KNOWLEDGE: RocketKnowledgeState = {
  subsystems: {
    propulsion: { 
      name: 'D-D Self-Breeding Fusion Core', 
      status: 25, 
      specifications: 'Initial configuration: Dual-loop magnetic confinement using standard industrial SC coils. Target: Deuterium-Deuterium self-sustaining plasma at 150 keV.', 
      costEfficiency: 45,
      lastUpdate: 'Cycle 0',
      optimizationHistory: [],
      feasibilityAudit: { practicalityIndex: 30, primaryRisk: 'MHD Turbulence', manufacturingStatus: 'Theoretical' }
    },
    thermal: { 
      name: 'Practical Heat Recovery', 
      status: 20, 
      specifications: 'Single-stage S-CO2 Brayton cycle. Heat rejection via modular honeycomb radiator panels. Lithium-lead blanket design for 2.45 MeV neutron capture.', 
      costEfficiency: 50,
      lastUpdate: 'Cycle 0',
      optimizationHistory: [],
      feasibilityAudit: { practicalityIndex: 35, primaryRisk: 'Material Corrosion', manufacturingStatus: 'Theoretical' }
    },
    structural: { 
      name: 'Vessel Core Architecture', 
      status: 30, 
      specifications: 'Low-activation ferritic/martensitic steel pressure vessel. SiC/SiC first wall inserts for high-flux neutron resistance.', 
      costEfficiency: 60,
      lastUpdate: 'Cycle 0',
      optimizationHistory: [],
      feasibilityAudit: { practicalityIndex: 45, primaryRisk: 'Neutron Embrittlement', manufacturingStatus: 'Theoretical' }
    },
    avionics: { 
      name: 'Low-Latency Control System', 
      status: 40, 
      specifications: 'FPGA-based real-time plasma diagnostic loop. AI-driven adaptive shaping for instability mitigation. Latency threshold: 100μs.', 
      costEfficiency: 75,
      lastUpdate: 'Cycle 0',
      optimizationHistory: [],
      feasibilityAudit: { practicalityIndex: 80, primaryRisk: 'Signal Jitter', manufacturingStatus: 'Prototyping' }
    },
    fuel: { 
      name: 'Seawater Deuterium Extraction', 
      status: 60, 
      specifications: 'Industrial Girdler-Sulfide process for D2O procurement. Onboard electrolysis and cryogenic purification. Supply: Abundant seawater.', 
      costEfficiency: 95,
      lastUpdate: 'Cycle 0',
      optimizationHistory: [],
      feasibilityAudit: { practicalityIndex: 90, primaryRisk: 'Scaling Energy Costs', manufacturingStatus: 'Production' }
    },
  },
  masterDesignDoc: "The Mairis Prime D-D Architecture focuses on bypassing the scarcity of He-3 and Tritium. By utilizing abundant seawater-derived Deuterium, the engine achieves unparalleled cost-effectiveness. The current design roadmap iterates on plasma boundary stability to reach a self-sustaining catalytic cycle.",
  cycleCount: 0,
  totalPapersProcessed: 0,
  breakthroughs: [],
  pastReports: [],
  simulationTelemetry: {
    plasmaPressure: 1.2e6,
    fuelFlowRate: 0.05,
    neutronFlux: 2.4e14,
    containmentStability: 0.42,
    thermalGradient: 450,
    mhdConvergence: false
  }
};

const ParticleVisualizer: React.FC<{ mode: 'plasma' | 'fuel' | 'fusion', active: boolean, intensity: number }> = ({ mode, active, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: any[] = [];
    const count = mode === 'plasma' ? 120 : mode === 'fuel' ? 200 : 80;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (mode === 'plasma' ? 8 : 2) * intensity,
        vy: (Math.random() - 0.5) * (mode === 'plasma' ? 8 : 2) * intensity,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        color: mode === 'plasma' ? `hsla(${180 + Math.random() * 60}, 100%, 70%, ` : 
               mode === 'fuel' ? `hsla(210, 80%, 50%, ` : `hsla(20, 100%, 60%, `
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();

        if (mode === 'plasma') {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color + '0.5)';
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [active, mode, intensity]);

  return (
    <div className="relative w-full h-48 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
      <canvas ref={canvasRef} width={600} height={200} className="w-full h-full opacity-70" />
      <div className="absolute top-4 left-4">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          {mode === 'plasma' && <Flame className="w-3 h-3 text-orange-500" />}
          {mode === 'fuel' && <Wind className="w-3 h-3 text-blue-500" />}
          {mode === 'fusion' && <Zap className="w-3 h-3 text-emerald-500" />}
          {mode} Flow Sim
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [stage, setStage] = useState<ResearchStage>(ResearchStage.IDLE);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [knowledge, setKnowledge] = useState<RocketKnowledgeState>(INITIAL_KNOWLEDGE);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [viewMode, setViewMode] = useState<'research' | 'simulator' | 'visualizer' | 'design' | 'dossier' | 'archive' | 'observatory'>('research');
  const [inspectingSub, setInspectingSub] = useState<EngineSubsystem | null>(null);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [selectedZoomImage, setSelectedZoomImage] = useState<{url: string, title: string} | null>(null);
  const [simFrames, setSimFrames] = useState<{[key: string]: string}>({});
  const [subsystemVisuals, setSubsystemVisuals] = useState<{[key: string]: string}>({});
  const [isGeneratingVisual, setIsGeneratingVisual] = useState<string | null>(null);
  
  // Bot State
  const [botReport, setBotReport] = useState<BotReport | null>(null);
  const [isBotAnalyzing, setIsBotAnalyzing] = useState(false);
  
  const [isKeyRequired, setIsKeyRequired] = useState(false);
  const [isKeyChecking, setIsKeyChecking] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const autonomousTimeoutRef = useRef<number | null>(null);
  const isAutonomousRef = useRef(isAutonomous);

  useEffect(() => { isAutonomousRef.current = isAutonomous; }, [isAutonomous]);

  useEffect(() => {
    return () => {
      if (autonomousTimeoutRef.current) window.clearTimeout(autonomousTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.subsystems) setKnowledge(parsed);
      } catch (e) {
        console.error("State Restore Error:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));
  }, [knowledge]);

  const checkApiKeyStatus = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio) {
      try {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyRequired(!hasKey);
      } catch (e) {
        setIsKeyRequired(true);
      }
    } else {
      setIsKeyRequired(!process.env.API_KEY);
    }
    setIsKeyChecking(false);
  }, []);

  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]);

  const addLog = useCallback((agentName: string, message: string, type: 'info' | 'success' | 'warning' | 'error' | 'sim' | 'vis' = 'info') => {
    setLogs(prev => [...prev, { agentName, message, timestamp: new Date().toISOString(), type }]);
  }, []);

  const calculatePriority = useCallback(() => {
    const subs = Object.entries(knowledge.subsystems) as [string, EngineSubsystem][];
    const weakest = subs.reduce((prev, curr) => (curr[1].status < prev[1].status ? curr : prev));
    return weakest[0];
  }, [knowledge.subsystems]);

  const runCycle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setReport(null);

    const target = calculatePriority();
    addLog('Orchestrator', `Cycle ${knowledge.cycleCount + 1}: Targeting Blueprint Completion for ${target.toUpperCase()}.`, 'info');

    try {
      setStage(ResearchStage.TOPIC_DISCOVERY);
      const discoveredTopics = await geminiService.discoverTopics([], knowledge, target);
      addLog('Strategy', `Focus: ${discoveredTopics[0]?.title}. Optimization potential: ${discoveredTopics[0]?.optimizationPotential}%.`, 'success');

      setStage(ResearchStage.LITERATURE_SYNTHESIS);
      const synthesis = await geminiService.synthesizeLiterature([]);
      addLog('Synthesis', 'MHD benchmarks successfully cross-correlated with material constraints.', 'success');

      setStage(ResearchStage.HYPOTHESIS_GENERATION);
      const hyp = await geminiService.generateHypotheses(synthesis, knowledge);
      const selectedHyp = hyp[0];
      addLog('Design Forge', `Formulated Design Hypothesis: ${selectedHyp.title}`, 'info');

      setStage(ResearchStage.MHD_SIMULATION);
      addLog('MHD Specialist', 'Modeling plasma boundary layer stability...', 'sim');
      const telemetry = await geminiService.generateSimulationTelemetry(selectedHyp);
      
      setStage(ResearchStage.FUEL_DYNAMICS_CFD);
      addLog('Fluid Architect', 'Calculating fuel injection throughput vectors...', 'sim');
      const visualUrl = await geminiService.generateFusionVisual(selectedHyp.statement, 'fusion');
      const plasmaFrame = await geminiService.generateFusionVisual(selectedHyp.statement, 'plasma');
      const fuelFrame = await geminiService.generateFusionVisual(selectedHyp.statement, 'fuel');

      setSimFrames({
        fusion: visualUrl || '',
        plasma: plasmaFrame || '',
        fuel: fuelFrame || ''
      });

      setStage(ResearchStage.CODE_VERIFICATION);
      addLog('Code Lab', 'Executing thermal stress verification scripts...', 'sim');
      const codeResults = await geminiService.runCodeLab(selectedHyp);
      
      setStage(ResearchStage.SCIENTIFIC_VERIFICATION);
      const verification = await geminiService.verifyHypothesis(selectedHyp, codeResults);
      addLog('Audit', `Practicality Rating: ${verification.practicalityScore}% | TRL Upgrade Pending.`, 'success');

      setStage(ResearchStage.JOURNAL_PUBLICATION);
      const newReport = await geminiService.publishJournal(selectedHyp, verification);
      newReport.visualUrl = visualUrl;
      setReport(newReport);

      setStage(ResearchStage.KNOWLEDGE_INTEGRATION);
      const nextKnowledge = await geminiService.updateKnowledgeState(knowledge, newReport);
      
      setKnowledge({
        ...nextKnowledge,
        simulationTelemetry: telemetry
      });
      addLog('Chronos', `Blueprint Revision ${nextKnowledge.cycleCount} successfully committed to memory.`, 'success');
      
      setStage(ResearchStage.COMPLETED);
      
      if (isAutonomousRef.current) {
        autonomousTimeoutRef.current = window.setTimeout(runCycle, 5000);
      }
    } catch (error: any) {
      addLog('Orchestrator', `Fault: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
      setIsAutonomous(false);
    } finally {
      setIsLoading(false);
      setStage(ResearchStage.IDLE);
    }
  };

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      addLog('System', 'Awaiting Project Credential synchronization...', 'info');
      try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        setIsKeyRequired(false);
        setIsSystemMenuOpen(false);
        addLog('System', 'Secure handshake successful. Simulation authority granted.', 'success');
      } catch (err) {
        addLog('System', 'Key handshake failed or cancelled.', 'warning');
      }
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.subsystems) setKnowledge(parsed);
      } catch (e) {
        addLog('System', 'Blueprint Import Failed: Checksum Mismatch', 'error');
      }
    };
    reader.readAsText(file);
    setIsSystemMenuOpen(false);
  };

  const generateTechnicalVisual = async (subsystemKey: string) => {
    if (isGeneratingVisual) return;
    setIsGeneratingVisual(subsystemKey);
    const subsystem = knowledge.subsystems[subsystemKey as keyof typeof knowledge.subsystems];
    addLog('Visualizer', `Rendering high-fidelity schematic for ${subsystem.name}...`, 'vis');
    
    try {
      const visualUrl = await geminiService.generateFusionVisual(
        `Detailed technical CAD schematic of the ${subsystem.name}. Specifications: ${subsystem.specifications}. Industrial precision, high-contrast blueprint style.`,
        subsystemKey === 'propulsion' ? 'fusion' : subsystemKey === 'fuel' ? 'fuel' : 'plasma'
      );
      if (visualUrl) {
        setSubsystemVisuals(prev => ({ ...prev, [subsystemKey]: visualUrl }));
        addLog('Visualizer', `Technical schematic for ${subsystem.name} finalized.`, 'success');
      }
    } catch (e) {
      addLog('Visualizer', `Rendering error for ${subsystem.name}.`, 'error');
    } finally {
      setIsGeneratingVisual(null);
    }
  };

  const runBotAnalysis = async () => {
    if (isBotAnalyzing) return;
    setIsBotAnalyzing(true);
    setStage(ResearchStage.BOT_ANALYSIS);
    addLog('M-O1 Bot', 'Initiating cross-system metadata diagnostic...', 'info');
    
    try {
      const report = await geminiService.runMetaAnalysis(knowledge, logs);
      setBotReport(report);
      addLog('M-O1 Bot', 'System observation finalized. Strategic report compiled.', 'success');
    } catch (e) {
      addLog('M-O1 Bot', 'Audit failed due to processing overflow.', 'error');
    } finally {
      setIsBotAnalyzing(false);
      setStage(ResearchStage.IDLE);
    }
  };

  const totalProgress = (Object.values(knowledge.subsystems) as EngineSubsystem[]).reduce((acc, s) => acc + s.status, 0) / 5;

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
      <Sidebar currentStage={stage} logs={logs} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.05),transparent)]">
        <header className="h-24 border-b border-slate-900/50 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="flex items-center gap-6">
             <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 shadow-lg">
                {(['research', 'simulator', 'visualizer', 'design', 'observatory', 'dossier', 'archive'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}>
                    {mode === 'research' ? 'Validation' : mode === 'simulator' ? 'Sim Core' : mode === 'visualizer' ? 'Visualizer' : mode === 'design' ? 'Blueprint' : mode === 'observatory' ? 'Meta-Observatory' : mode === 'dossier' ? 'Breakthroughs' : 'Archive'}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-slate-900/40 px-6 py-3 rounded-2xl border border-slate-800 shadow-inner group">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Completion</span>
                  <div className="flex items-center gap-2">
                     <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${totalProgress}%` }} />
                     </div>
                     <span className="text-xs font-black text-emerald-400">{totalProgress.toFixed(1)}%</span>
                  </div>
               </div>
            </div>

            <div className="relative">
              <button onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all">
                <Settings className={`w-5 h-5 text-slate-400 ${isSystemMenuOpen ? 'rotate-90' : ''}`} />
              </button>
              {isSystemMenuOpen && (
                <div className="absolute right-0 mt-4 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-2">
                   <button onClick={handleOpenSelectKey} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-950 hover:bg-blue-600 text-[10px] font-black uppercase rounded-xl transition-all"><Key className="w-4 h-4" /> Swap Secure Key</button>
                   <button onClick={() => downloadFile(JSON.stringify(knowledge, null, 2), `mairis-blueprint.json`, 'application/json')} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-[10px] font-black uppercase rounded-xl transition-all"><HardDriveDownload className="w-4 h-4" /> Backup State</button>
                   <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 bg-slate-950 hover:bg-slate-800 text-[10px] font-black uppercase rounded-xl transition-all"><Upload className="w-4 h-4" /> Restore State</button>
                   <input type="file" ref={fileInputRef} onChange={handleImport} className="hidden" accept=".json" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setIsAutonomous(!isAutonomous)} className={`p-3 rounded-xl border transition-all ${isAutonomous ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                {isAutonomous ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button onClick={runCycle} disabled={isLoading} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-2xl">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isLoading ? "Simulating..." : "Run Sim"}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar blueprint-grid">
          {viewMode === 'research' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
              {report ? (
                <div className="grid grid-cols-12 gap-10">
                   <div className="col-span-8 space-y-8">
                      <div className="flex justify-between items-end">
                         <div className="space-y-4">
                            <div className="flex gap-2">
                               <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest rounded-lg">Cycle {knowledge.cycleCount}</span>
                               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-lg">VERIFIED</span>
                            </div>
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none text-glow-blue">{report.title}</h2>
                         </div>
                      </div>
                      {report.visualUrl && (
                        <div 
                         className="w-full h-[500px] bg-slate-900 rounded-[4rem] overflow-hidden border border-slate-800 shadow-2xl relative group ring-1 ring-blue-500/20 cursor-zoom-in"
                         onClick={() => setSelectedZoomImage({url: report.visualUrl!, title: report.title})}
                        >
                           <img src={report.visualUrl} alt="Flow Sim" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-[3000ms]" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />
                           <div className="absolute bottom-10 left-10">
                              <span className="text-xl font-black text-white uppercase tracking-tight">MHD Core Optimization v{knowledge.cycleCount}</span>
                           </div>
                        </div>
                      )}
                      <div className="p-12 bg-slate-950/90 border border-slate-900 rounded-[4rem] shadow-2xl">
                         <p className="text-xl text-slate-300 leading-relaxed font-medium opacity-95 border-l-4 border-blue-600 pl-8 italic">{report.conclusion}</p>
                      </div>
                   </div>
                   <div className="col-span-4 space-y-10">
                      <div className="bg-slate-900/60 backdrop-blur-2xl p-12 rounded-[4rem] border border-slate-800 shadow-2xl">
                         <h3 className="text-[11px] font-black text-blue-400 uppercase tracking-[0.2em] mb-10">AUDIT RESULTS</h3>
                         <div className="space-y-6">
                            {[
                              { label: 'Physics', val: report.verificationSuite?.physicsReview?.feasibilityRating || 0 },
                              { label: 'Engineering', val: report.verificationSuite?.engineeringReview?.feasibilityRating || 0 },
                              { label: 'Manufacturing', val: report.verificationSuite?.manufacturingReview?.feasibilityRating || 0 }
                            ].map(a => (
                              <div key={a.label} className="flex justify-between items-center border-b border-slate-800/50 pb-6 last:border-0">
                                 <span className="text-[11px] font-bold text-white uppercase tracking-tight">{a.label}</span>
                                 <span className="text-2xl font-black text-emerald-500">{a.val}/10</span>
                              </div>
                            ))}
                         </div>
                         <div className="mt-10 p-8 bg-blue-600 rounded-[3rem] text-center shadow-2xl">
                            <span className="text-[10px] font-black text-white/70 uppercase mb-2 block">Practicality Score</span>
                            <div className="text-6xl font-black text-white">{report.verificationSuite?.practicalityScore}%</div>
                         </div>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="h-[75vh] flex flex-col items-center justify-center text-center">
                   <div className="w-44 h-44 bg-slate-900 border border-slate-800 rounded-[4rem] flex items-center justify-center shadow-2xl ring-1 ring-white/5 mb-10">
                     {isLoading ? <Loader2 className="w-16 h-16 text-blue-500 animate-spin" /> : <Microchip className="w-16 h-16 text-slate-800" />}
                   </div>
                   <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 text-glow-blue">
                     {isLoading ? `REFINING BLUEPRINT CYCLE ${knowledge.cycleCount + 1}` : 'DESIGN AUTHORITY READY'}
                   </h2>
                   <p className="text-slate-500 text-sm max-w-lg mx-auto uppercase tracking-widest opacity-80 leading-loose">
                     Initiate design authority to stress-test existing D-D fusion parameters.
                   </p>
                </div>
              )}
            </div>
          )}

          {viewMode === 'simulator' && (
             <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                   <div>
                      <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none text-glow-blue">MASTER BLUEPRINT SIMULATOR</h2>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-5">LIVE CFD AND PLASMA DIAGNOSTICS</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl min-w-[160px]">
                         <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Containment</span>
                         <span className={`text-3xl font-black ${knowledge.simulationTelemetry?.containmentStability && knowledge.simulationTelemetry.containmentStability > 0.8 ? 'text-emerald-400' : 'text-orange-400'}`}>
                           {(knowledge.simulationTelemetry?.containmentStability || 0 * 100).toFixed(1)}%
                         </span>
                      </div>
                      <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl min-w-[160px]">
                         <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">MHD Converge</span>
                         <span className={`text-xl font-black ${knowledge.simulationTelemetry?.mhdConvergence ? 'text-emerald-400' : 'text-red-400'}`}>
                           {knowledge.simulationTelemetry?.mhdConvergence ? 'STABLE' : 'UNSTABLE'}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-12 gap-12">
                   <div className="col-span-8 space-y-12">
                      <div className="relative w-full h-[550px] bg-slate-950 rounded-[4rem] overflow-hidden border border-slate-800 shadow-2xl group ring-1 ring-blue-500/20">
                         {simFrames.fusion ? (
                           <img src={simFrames.fusion} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[5000ms]" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-slate-900/20"><Wind className="w-20 h-20 text-slate-800 animate-pulse" /></div>
                         )}
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.8))]" />
                         <div className="absolute top-10 right-10 flex gap-3">
                            {simFrames.fusion && <button onClick={() => setSelectedZoomImage({url: simFrames.fusion, title: 'Master Core Sim'})} className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/20"><Maximize2 className="w-6 h-6" /></button>}
                            <button onClick={() => simFrames.fusion && downloadImage(simFrames.fusion, 'core-sim.png')} className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/20"><FileDown className="w-6 h-6" /></button>
                         </div>
                         <div className="absolute bottom-10 left-10 p-10 bg-black/40 backdrop-blur-xl border border-white/5 rounded-[3rem] max-w-md">
                            <span className="text-[11px] font-black text-blue-500 uppercase block mb-4 tracking-widest">Simulation Core Frame</span>
                            <p className="text-sm text-slate-300 leading-relaxed font-medium">Full-body CAD cross-section of the D-D catalyst chamber. Modeling magnetic flux integration and thermal rejection paths.</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <ParticleVisualizer mode="plasma" active={true} intensity={knowledge.simulationTelemetry?.plasmaPressure ? 1.5 : 0.5} />
                            <div className="flex justify-between items-center px-6">
                               <span className="text-[10px] font-black text-slate-500 uppercase">Plasma Press</span>
                               <span className="text-lg font-black text-white">{knowledge.simulationTelemetry?.plasmaPressure?.toExponential(2) || '0.00e0'} Pa</span>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <ParticleVisualizer mode="fuel" active={true} intensity={knowledge.simulationTelemetry?.fuelFlowRate ? 2.0 : 0.2} />
                            <div className="flex justify-between items-center px-6">
                               <span className="text-[10px] font-black text-slate-500 uppercase">Fuel Influx</span>
                               <span className="text-lg font-black text-white">{knowledge.simulationTelemetry?.fuelFlowRate?.toFixed(3) || '0.000'} kg/s</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="col-span-4 space-y-12">
                      <div className="bg-slate-900/60 backdrop-blur-3xl p-12 rounded-[5rem] border border-slate-800 shadow-2xl space-y-12 h-full ring-1 ring-white/5">
                         <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-5">
                           <Pulse className="w-8 h-8" /> TELEMETRY STREAM
                         </h3>
                         
                         <div className="space-y-10">
                            {[
                              { label: 'Thermal Gradient', val: (knowledge.simulationTelemetry?.thermalGradient || 0) / 1000, icon: <Thermometer className="w-6 h-6 text-orange-400" />, unit: 'K/m' },
                              { label: 'Neutron Flux', val: (knowledge.simulationTelemetry?.neutronFlux || 0) / 1e15, icon: <Zap className="w-6 h-6 text-yellow-400" />, unit: 'n/cm²' },
                              { label: 'Fuel Recovery', val: 0.94, icon: <CloudRain className="w-6 h-6 text-blue-400" />, unit: '%' },
                              { label: 'Containment', val: knowledge.simulationTelemetry?.containmentStability || 0, icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, unit: '%' }
                            ].map(m => (
                              <div key={m.label} className="p-8 bg-slate-950/60 border border-slate-800 rounded-[3rem] space-y-6 group hover:border-blue-500/30 transition-all">
                                 <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                       <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">{m.icon}</div>
                                       <span className="text-[11px] font-black text-white uppercase tracking-wider">{m.label}</span>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-2xl font-black text-white">{(m.val * (m.unit === '%' ? 100 : 1)).toFixed(m.unit === '%' ? 1 : 2)}</div>
                                       <div className="text-[8px] font-black text-slate-500 uppercase">{m.unit}</div>
                                    </div>
                                 </div>
                                 <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 group-hover:bg-blue-400 transition-all duration-1000" style={{ width: `${Math.min(m.val * 100, 100)}%` }} />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {viewMode === 'observatory' && (
             <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                   <div>
                      <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none text-glow-blue flex items-center gap-6">
                        <ScanSearch className="w-14 h-14" /> META-OBSERVATORY
                      </h2>
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-5">SYSTEM-WIDE AUDIT AND OPTIMIZATION INTELLIGENCE</p>
                   </div>
                   <button 
                    onClick={runBotAnalysis} 
                    disabled={isBotAnalyzing}
                    className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-[2.5rem] font-black uppercase tracking-widest text-xs transition-all flex items-center gap-4 shadow-2xl"
                   >
                     {isBotAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radar className="w-5 h-5" />}
                     {isBotAnalyzing ? "Observing..." : "Initiate Audit"}
                   </button>
                </div>

                {botReport ? (
                   <div className="grid grid-cols-12 gap-12">
                      <div className="col-span-4 space-y-10">
                         <div className="bg-slate-900/60 backdrop-blur-3xl p-12 rounded-[5rem] border border-slate-800 shadow-2xl space-y-12 h-full">
                            <h3 className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-4">
                               <BrainCircuit className="w-8 h-8" /> M-O1 CORE ANALYTICS
                            </h3>
                            
                            <div className="flex flex-col items-center gap-6 p-10 bg-slate-950/50 rounded-[4rem] border border-slate-800 ring-1 ring-white/5">
                               <div className="relative w-48 h-48 flex items-center justify-center">
                                  <svg className="w-full h-full transform -rotate-90">
                                     <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                                     <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={552.92} strokeDashoffset={552.92 - (552.92 * botReport.systemHealth) / 100} className="text-emerald-500 transition-all duration-1000" />
                                  </svg>
                                  <div className="absolute flex flex-col items-center">
                                     <span className="text-5xl font-black text-white">{botReport.systemHealth}%</span>
                                     <span className="text-[9px] font-black text-slate-500 uppercase">Health Index</span>
                                  </div>
                               </div>
                               <div className="text-center">
                                  <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Agent Synergy</div>
                                  <div className="text-2xl font-black text-white">{botReport.agentEfficiency}%</div>
                               </div>
                            </div>

                            <div className="space-y-6">
                               {botReport.performanceMetrics.map((m, idx) => (
                                  <div key={idx} className="space-y-2">
                                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500">{m.label}</span>
                                        <span className="text-white">{m.value}%</span>
                                     </div>
                                     <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${m.value}%` }} />
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="col-span-8 space-y-12">
                         <div className="bg-slate-900/40 p-16 rounded-[5rem] border border-slate-800 shadow-2xl space-y-12">
                            <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] flex items-center gap-5">
                               <Eye className="w-8 h-8" /> RECENT OBSERVATIONS
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-6">
                               {botReport.observations.map((o, idx) => (
                                  <div key={idx} className="flex gap-10 p-10 bg-slate-950/80 rounded-[4rem] border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-all">
                                     <div className={`p-6 rounded-3xl border flex items-center justify-center shrink-0 ${
                                        o.severity === 'high' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        o.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                     }`}>
                                        <AlertTriangle className="w-10 h-10" />
                                     </div>
                                     <div className="flex-1 space-y-4">
                                        <div className="flex justify-between items-center">
                                           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{o.category}</span>
                                           <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase border ${
                                              o.severity === 'high' ? 'bg-red-500 text-white border-red-400' : 'bg-slate-800 text-slate-400 border-slate-700'
                                           }`}>{o.severity} severity</span>
                                        </div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{o.finding}</h4>
                                        <div className="p-8 bg-emerald-600/5 border border-emerald-500/10 rounded-3xl">
                                           <div className="text-[9px] font-black text-emerald-500 uppercase mb-2 flex items-center gap-2">
                                              <ClipboardCheck className="w-3 h-3" /> M-O1 SUGGESTION
                                           </div>
                                           <p className="text-sm text-slate-300 font-medium leading-relaxed italic">"{o.suggestedAction}"</p>
                                        </div>
                                     </div>
                                  </div>
                               ))}
                            </div>

                            <div className="p-16 bg-slate-950 border border-slate-800 rounded-[4rem] shadow-inner space-y-6">
                               <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                                  <Terminal className="w-5 h-5" /> EXECUTIVE SUMMARY
                               </h4>
                               <p className="text-2xl text-slate-300 font-mono leading-relaxed opacity-90 pl-10 border-l-2 border-emerald-500 italic">
                                  {botReport.summary}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                ) : (
                   <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                      <div className="w-48 h-48 bg-slate-900 border border-slate-800 rounded-[4rem] flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden group">
                         <Radar className={`w-20 h-20 text-slate-800 ${isBotAnalyzing ? 'animate-[ping_3s_linear_infinite] text-emerald-500' : ''}`} />
                         <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 text-glow-emerald">
                        {isBotAnalyzing ? "SCANNING ARCHITECTURE" : "M-O1 STANDBY"}
                      </h2>
                      <p className="text-slate-500 text-sm max-w-lg mx-auto uppercase tracking-widest opacity-80 leading-loose">
                         {isBotAnalyzing ? "Measuring system metrics, analyzing agent log cadence, and performing cross-subsystem heuristic audits." : "Initiate a Meta-Analysis for deep insights into your propulsion synthesis performance."}
                      </p>
                   </div>
                )}
             </div>
          )}

          {viewMode === 'visualizer' && (
            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none text-glow-blue">MASTER VISUALIZER</h2>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-5">TECHNICAL SCHEMATIC REPOSITORY</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="px-6 py-3 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                        <Database className="w-5 h-5 text-blue-400" />
                        <span className="text-xs font-black uppercase text-white tracking-widest">{Object.keys(subsystemVisuals).length} Schematics Loaded</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-12 gap-10">
                  <div className="col-span-12 grid grid-cols-3 gap-10">
                    {(Object.entries(knowledge.subsystems) as [string, EngineSubsystem][]).map(([key, sub]) => (
                      <div key={key} className="bg-slate-900/40 p-10 rounded-[4rem] border border-slate-800 shadow-2xl flex flex-col group overflow-hidden relative">
                         <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                         
                         <div className="flex justify-between items-center mb-8 relative z-10">
                            <div className="flex items-center gap-3">
                               <Compass className="w-5 h-5 text-blue-500" />
                               <span className="text-lg font-black text-white uppercase tracking-tight">{sub.name}</span>
                            </div>
                            <div className="text-[10px] font-black text-emerald-500 uppercase">TRL {sub.status}%</div>
                         </div>

                         <div className="w-full h-64 bg-slate-950 rounded-[2.5rem] mb-8 border border-slate-800 relative overflow-hidden flex items-center justify-center">
                            {subsystemVisuals[key] ? (
                              <img src={subsystemVisuals[key]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={sub.name} />
                            ) : (
                              <div className="flex flex-col items-center gap-4 text-slate-700">
                                 <ImageIcon className="w-16 h-16 opacity-20" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">No schematic generated</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                            {subsystemVisuals[key] && (
                               <button 
                                onClick={() => setSelectedZoomImage({url: subsystemVisuals[key], title: sub.name})}
                                className="absolute bottom-6 right-6 p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20"
                               >
                                  <ZoomIn className="w-5 h-5" />
                               </button>
                            )}
                         </div>

                         <div className="flex-1 space-y-6 mb-8 relative z-10">
                            <p className="text-xs text-slate-400 font-mono leading-relaxed line-clamp-3 pl-4 border-l border-slate-800 italic">
                               {sub.specifications}
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Practicality</span>
                                  <span className="text-sm font-black text-blue-400">{sub.feasibilityAudit.practicalityIndex}%</span>
                               </div>
                               <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Efficiency</span>
                                  <span className="text-sm font-black text-emerald-400">{sub.costEfficiency}%</span>
                               </div>
                            </div>
                         </div>

                         <button 
                          onClick={() => generateTechnicalVisual(key)}
                          disabled={isGeneratingVisual !== null}
                          className={`w-full py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10 flex items-center justify-center gap-3 ${
                            isGeneratingVisual === key ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'
                          }`}
                         >
                            {isGeneratingVisual === key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            {subsystemVisuals[key] ? 'Regenerate Schematic' : 'Generate Technical Render'}
                         </button>
                      </div>
                    ))}
                  </div>

                  <div className="col-span-12 bg-slate-900/40 p-16 rounded-[5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                     <div className="flex justify-between items-center mb-16">
                        <div>
                          <h3 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">INTEGRATED DESIGN DOCUMENTATION</h3>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-5">CERTIFIED ENGINEERING MASTER SPEC</p>
                        </div>
                        <button onClick={() => downloadFile(knowledge.masterDesignDoc, 'master-spec.txt', 'text/plain')} className="px-10 py-5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center gap-4">
                           <Download className="w-5 h-5" /> Export Specs
                        </button>
                     </div>
                     <div className="p-16 bg-slate-950/90 border border-slate-800 rounded-[4rem] shadow-inner font-mono text-xl text-slate-300 leading-relaxed whitespace-pre-line opacity-90 pl-16 border-l-4 border-blue-600">
                        {knowledge.masterDesignDoc}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'design' && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
               <div className="grid grid-cols-12 gap-12">
                  <div className="col-span-8 space-y-12">
                    <div className="bg-slate-900/40 p-16 rounded-[5rem] border border-slate-800 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
                      <div className="flex justify-between items-center mb-16 relative z-10">
                         <div>
                            <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-4">
                               MASTER BLUEPRINT <span className="text-blue-500 text-glow-blue">REV {knowledge.cycleCount}.0</span>
                            </h2>
                            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mt-5">CERTIFIED D-D SUSTAINABILITY SCHEMA</p>
                         </div>
                         <div className="p-10 bg-slate-800/50 rounded-[3rem] text-center px-14 border border-slate-800 shadow-xl">
                            <div className="text-5xl font-black text-white tracking-tighter">{totalProgress.toFixed(1)}%</div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 block">Global TRL</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-10 relative z-10">
                        {(Object.entries(knowledge.subsystems) as [string, EngineSubsystem][]).map(([key, sub]) => (
                          <div key={key} onClick={() => setInspectingSub(sub)} className="group bg-slate-950/80 p-12 rounded-[4rem] border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer shadow-2xl">
                            <div className="flex justify-between items-center mb-8">
                              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{sub.name}</span>
                              <div className={`px-4 py-1 rounded-full text-[9px] font-black border uppercase ${sub.feasibilityAudit.manufacturingStatus === 'Production' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                 {sub.feasibilityAudit.manufacturingStatus}
                              </div>
                            </div>
                            <div className="text-6xl font-black text-white mb-10 leading-none group-hover:text-blue-500 transition-colors">{sub.status}%</div>
                            <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-600">
                               <span className="flex items-center gap-3"><Target className="w-4 h-4" /> Ready: <span className="text-blue-500">{sub.feasibilityAudit.practicalityIndex}%</span></span>
                               <span className="flex items-center gap-3"><Coins className="w-4 h-4" /> Eff: <span className="text-emerald-500">{sub.costEfficiency}%</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-16 bg-slate-900/20 border border-slate-800 rounded-[5rem] shadow-xl ring-1 ring-white/5">
                       <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] mb-12 flex items-center gap-5"><Layers className="w-7 h-7" /> DESIGN SPECIFICATION LOG</h3>
                       <p className="text-xl text-slate-300 leading-relaxed font-mono whitespace-pre-line opacity-90 pl-10 border-l-2 border-blue-600">{knowledge.masterDesignDoc}</p>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-12">
                    <div className="bg-slate-900/40 p-12 rounded-[5rem] border border-slate-800 h-full shadow-2xl ring-1 ring-white/5">
                       <h3 className="text-[12px] font-black text-blue-400 uppercase tracking-[0.4em] mb-14 flex items-center gap-5"><History className="w-7 h-7" /> EVOLUTION TRACE</h3>
                       <div className="space-y-10 relative">
                         {knowledge.breakthroughs.slice().reverse().map((bt) => (
                           <div key={bt.id} className="p-10 bg-slate-950/90 border border-slate-800 rounded-[3rem] shadow-xl hover:bg-slate-900 transition-all cursor-default group">
                             <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-3">{bt.date}</div>
                             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 leading-tight group-hover:text-blue-400 transition-colors">{bt.title}</h4>
                             <p className="text-[11px] text-slate-500 leading-loose line-clamp-3 font-medium italic">"{bt.description}"</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'dossier' && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
               <h2 className="text-6xl font-black text-white uppercase tracking-tighter mb-16 text-glow-blue">ENGINEERING BREAKTHROUGHS</h2>
               <div className="grid grid-cols-2 gap-16">
                  {knowledge.breakthroughs.map((bt) => (
                    <div key={bt.id} className="group bg-slate-900/40 border border-slate-800 rounded-[5rem] overflow-hidden flex flex-col hover:border-blue-500/60 transition-all shadow-2xl ring-1 ring-white/5">
                       <div 
                        className="w-full h-[400px] bg-slate-950 relative overflow-hidden cursor-zoom-in"
                        onClick={() => bt.visualUrl && setSelectedZoomImage({url: bt.visualUrl, title: bt.title})}
                       >
                          {bt.visualUrl ? (
                            <img src={bt.visualUrl} alt={bt.title} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[4000ms]" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-950/50"><ImageIcon className="w-24 h-24 text-slate-800" /></div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />
                          <div className="absolute top-10 left-10">
                             <div className="px-6 py-3 bg-blue-600/90 backdrop-blur-2xl rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-2xl border border-white/10 flex items-center gap-3">
                                <Zap className="w-4 h-4" /> VERIFIED PRACTICALITY
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-16 flex-1 flex flex-col">
                          <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-10 leading-none group-hover:text-blue-500 transition-colors">{bt.title}</h3>
                          <div className="space-y-12 flex-1">
                             <div className="p-10 bg-black/60 border border-slate-800 rounded-[3rem] shadow-inner ring-1 ring-white/5">
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-4"><Gauge className="w-5 h-5" /> BLUEPRINT INTEGRATION</div>
                                <p className="text-[12px] font-mono text-emerald-400/90 leading-loose">{bt.blueprintImpact}</p>
                             </div>
                          </div>
                          <button onClick={() => downloadFile(bt.description, `${bt.id}-dossier.txt`, 'text/plain')} className="mt-12 w-full py-7 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-5 shadow-2xl">
                             <FileDown className="w-6 h-6" /> EXPORT TECHNICAL DOSSIER
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {viewMode === 'archive' && (
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
               <h2 className="text-6xl font-black text-white uppercase tracking-tighter leading-none text-glow-blue mb-16">VALIDATION ARCHIVE</h2>
               <div className="grid grid-cols-1 gap-12">
                  {knowledge.pastReports.map((r) => (
                    <div key={r.id} onClick={() => { setReport(r); setViewMode('research'); }} className="group p-16 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[4rem] flex items-center justify-between hover:bg-slate-900/80 transition-all cursor-pointer shadow-2xl hover:translate-x-3">
                       <div className="flex items-center gap-16">
                          <div className="p-10 bg-slate-950 rounded-[3rem] border border-slate-800 text-slate-700 group-hover:text-blue-500 group-hover:scale-110 transition-all shadow-xl ring-1 ring-white/5">
                            <FileText className="w-14 h-14" />
                          </div>
                          <div>
                            <h3 className="text-4xl font-black text-white uppercase tracking-tight mb-5 leading-none group-hover:text-blue-500 transition-colors">{r.title}</h3>
                            <p className="text-[12px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-8">
                               {new Date(r.timestamp).toLocaleDateString()} <span className="w-2 h-2 bg-slate-800 rounded-full" /> TRL {r.verificationSuite?.readinessLevel} COMPLIANT
                            </p>
                          </div>
                       </div>
                       <div className="text-right px-12">
                          <div className="text-[11px] font-black text-slate-600 uppercase mb-4 tracking-[0.2em]">PRACTICALITY</div>
                          <div className="text-6xl font-black text-white tracking-tighter text-glow-blue">{r.verificationSuite?.practicalityScore}%</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {inspectingSub && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-950/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-[5rem] p-24 shadow-2xl relative overflow-hidden group">
            <button onClick={() => setInspectingSub(null)} className="absolute top-16 right-16 p-6 hover:bg-slate-800 rounded-[2.5rem] transition-all">
              <X className="w-10 h-10 text-slate-500" />
            </button>
            <div className="flex items-center gap-12 mb-20 relative z-10">
              <div className="p-12 bg-blue-500/10 border border-blue-500/20 rounded-[4rem] text-blue-500 shadow-2xl">
                <Settings className="w-24 h-24" />
              </div>
              <div>
                <h3 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{inspectingSub.name}</h3>
                <div className="flex gap-16 mt-12">
                   <div className="text-center">
                      <div className="text-[12px] font-black text-slate-500 uppercase mb-3">Readiness</div>
                      <div className="text-4xl font-black text-white">{inspectingSub.status}%</div>
                   </div>
                   <div className="text-center">
                      <div className="text-[12px] font-black text-slate-500 uppercase mb-3">Efficiency</div>
                      <div className="text-4xl font-black text-emerald-500">{inspectingSub.costEfficiency}%</div>
                   </div>
                </div>
              </div>
            </div>
            <div className="p-16 bg-slate-950 border border-slate-800 rounded-[4rem] shadow-inner relative z-10 mb-16 ring-1 ring-white/5">
              <p className="text-2xl text-slate-300 leading-relaxed font-mono opacity-90 pl-10 border-l-2 border-blue-600">{inspectingSub.specifications}</p>
            </div>
            <button onClick={() => downloadFile(inspectingSub.specifications, `${inspectingSub.name}-spec.txt`, 'text/plain')} className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[3rem] text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-6 shadow-2xl relative z-10">
               <Download className="w-8 h-8" /> EXPORT TECHNICAL SPECIFICATION
            </button>
          </div>
        </div>
      )}

      {selectedZoomImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-12 animate-in fade-in duration-500"
          onClick={() => setSelectedZoomImage(null)}
        >
          <div 
            className="relative max-w-[95vw] max-h-[90vh] flex flex-col items-center gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedZoomImage(null)} className="absolute -top-12 right-0 text-white/50 hover:text-white transition-all"><X className="w-10 h-10" /></button>
            <div className="relative group overflow-hidden rounded-[4rem] shadow-[0_0_120px_rgba(37,99,235,0.3)] border border-white/10 bg-slate-900">
               <img src={selectedZoomImage.url} alt={selectedZoomImage.title} className="max-w-full max-h-[75vh] object-contain" />
               <div className="absolute bottom-12 right-12">
                  <button onClick={() => downloadImage(selectedZoomImage.url, `sim-${selectedZoomImage.title.toLowerCase().replace(/ /g, '-')}.png`)} className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl transition-transform hover:scale-105">
                    <FileDown className="w-6 h-6 inline mr-3" /> Download High-Res Frame
                  </button>
               </div>
            </div>
            <h3 className="text-4xl font-black text-white uppercase tracking-tighter text-glow-blue">{selectedZoomImage.title}</h3>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
