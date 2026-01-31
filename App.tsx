
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { 
  Paper, 
  ResearchTopic, 
  Hypothesis, 
  ResearchReport, 
  ResearchStage, 
  AgentLog, 
  VisualFinding,
  RocketKnowledgeState,
  EngineSubsystem,
  ChartPoint,
  Breakthrough
} from './types';
import { MOCK_PAPERS } from './constants';
import { geminiService } from './services/geminiService';
import { 
  CheckCircle,
  Terminal,
  FileCode,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  BrainCircuit,
  Database,
  Search,
  Milestone,
  Zap,
  ArrowRight,
  Award,
  History,
  Lightbulb,
  Zap as Power,
  Layout,
  LayoutDashboard,
  Target,
  FlaskRound as Flask,
  Info,
  Download,
  Eye,
  Shield,
  Gauge,
  Monitor,
  Cpu,
  Layers,
  Square,
  RotateCcw,
  FileText,
  Save,
  Code2,
  FunctionSquare,
  HardDriveDownload,
  Fingerprint,
  Key,
  ExternalLink,
  Lock,
  Loader2
} from 'lucide-react';

const INITIAL_KNOWLEDGE: RocketKnowledgeState = {
  subsystems: {
    propulsion: { name: 'Propulsion Unit', status: 12, specifications: 'Baseline methalox combustion chamber v1.', lastUpdate: 'Genesis' },
    thermal: { name: 'Thermal Systems', status: 8, specifications: 'Passive ablative heat shield cooling.', lastUpdate: 'Genesis' },
    structural: { name: 'Structural Integrity', status: 15, specifications: 'Aluminum-lithium alloy framework.', lastUpdate: 'Genesis' },
    avionics: { name: 'Avionics & Control', status: 5, specifications: 'Standard PID flight controllers.', lastUpdate: 'Genesis' },
    fuel: { name: 'Fuel Management', status: 10, specifications: 'Single-stage pump system.', lastUpdate: 'Genesis' },
  },
  masterDesignDoc: "Initial architectural framework established. Goal: 100% viability.",
  cycleCount: 0,
  totalPapersProcessed: 0,
  breakthroughs: [],
  pastReports: []
};

// Removed redundant global declaration of aistudio as it is pre-configured in the environment.

const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const DataChart: React.FC<{ data: { label: string, points: ChartPoint[], color: string } }> = ({ data }) => {
  const maxVal = Math.max(...data.points.map(p => p.y), 1);
  const chartHeight = 200;
  const chartWidth = 500;
  
  return (
    <div className="bg-slate-950/80 p-8 rounded-[3rem] border border-slate-800 shadow-2xl group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{data.label}</span>
        </div>
      </div>
      <div className="relative h-[200px] w-full flex items-end justify-between overflow-visible">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[8px] font-mono text-slate-700 -ml-6">
           <span>{Math.round(maxVal)}</span>
           <span>{Math.round(maxVal/2)}</span>
           <span>0</span>
        </div>
        
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
           {[0, 0.25, 0.5, 0.75, 1].map(v => (
             <line 
               key={v} 
               x1="0" y1={chartHeight * v} 
               x2={chartWidth} y2={chartHeight * v} 
               stroke="#1e293b" 
               strokeWidth="1" 
             />
           ))}
           
           <path 
             d={`M ${data.points.map((p, i) => `${(i / (data.points.length - 1)) * chartWidth},${chartHeight - (p.y / maxVal) * chartHeight}`).join(' L ')}`}
             fill="none"
             stroke={data.color || '#3b82f6'}
             strokeWidth="4"
             strokeLinecap="round"
             className="transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
           />
           
           {data.points.map((p, i) => (
             <g key={i} className="group/point cursor-pointer">
               <circle 
                 cx={(i / (data.points.length - 1)) * chartWidth} 
                 cy={chartHeight - (p.y / maxVal) * chartHeight} 
                 r="6" 
                 fill="#020617"
                 stroke={data.color || '#3b82f6'} 
                 strokeWidth="2"
               />
             </g>
           ))}
        </svg>
      </div>
      <div className="flex justify-between text-[8px] font-mono text-slate-600 mt-6 pt-4 border-t border-slate-900 px-2">
         {data.points.map((p, i) => <span key={i}>{p.x}</span>)}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [stage, setStage] = useState<ResearchStage>(ResearchStage.IDLE);
  const [topics, setTopics] = useState<ResearchTopic[]>([]);
  const [visualFindings, setVisualFindings] = useState<VisualFinding[]>([]);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [knowledge, setKnowledge] = useState<RocketKnowledgeState>(INITIAL_KNOWLEDGE);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [viewMode, setViewMode] = useState<'research' | 'design' | 'breakthroughs'>('research');
  const [prioritySubsystem, setPrioritySubsystem] = useState<string | null>(null);
  const [inspectingSub, setInspectingSub] = useState<EngineSubsystem | null>(null);
  
  // API Key Selection State
  const [isKeyRequired, setIsKeyRequired] = useState(false);
  const [isKeyChecking, setIsKeyChecking] = useState(true);

  const isAutonomousRef = useRef(isAutonomous);
  useEffect(() => { isAutonomousRef.current = isAutonomous; }, [isAutonomous]);

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore: aistudio is globally defined in the environment
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyRequired(!hasKey);
      } else {
        // Fallback for non-aistudio environments (standard deployment with env var)
        setIsKeyRequired(false);
      }
      setIsKeyChecking(false);
    };
    checkKey();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('astra_master_blueprint_v12');
    if (saved) setKnowledge(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('astra_master_blueprint_v12', JSON.stringify(knowledge));
  }, [knowledge]);

  const addLog = useCallback((agentName: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [...prev, { agentName, message, timestamp: new Date().toISOString(), type }]);
  }, []);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeyRequired(false);
    }
  };

  const resetProgress = useCallback(() => {
    if (window.confirm('WARNING: CORE RESET. This will permanently wipe all verified breakthroughs and mathematical proofs. Proceed?')) {
      setKnowledge(INITIAL_KNOWLEDGE);
      localStorage.removeItem('astra_master_blueprint_v12');
      setStage(ResearchStage.IDLE);
      setReport(null);
      setTopics([]);
      setHypotheses([]);
      setIsAutonomous(false);
      setIsLoading(false);
      addLog('System', 'CORE DATA PURGED. SYSTEM RESET TO GENESIS.', 'warning');
    }
  }, [addLog]);

  const stopResearch = useCallback(() => {
    setIsLoading(false);
    setIsAutonomous(false);
    setStage(ResearchStage.IDLE);
    addLog('Orchestrator', 'Research sequence halted manually.', 'warning');
  }, [addLog]);

  const calculatePriority = useCallback(() => {
    if (prioritySubsystem) return prioritySubsystem;
    const subs = Object.entries(knowledge.subsystems) as [string, EngineSubsystem][];
    const weakest = subs.reduce((prev, curr) => (curr[1].status < prev[1].status ? curr : prev));
    return weakest[0];
  }, [knowledge.subsystems, prioritySubsystem]);

  const runCycle = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setReport(null);
    setTopics([]);
    setHypotheses([]);

    const target = calculatePriority();
    addLog('Orchestrator', `Cycle Initiated. Focal Subsystem: ${target.toUpperCase()}`, 'info');

    try {
      setStage(ResearchStage.TOPIC_DISCOVERY);
      await new Promise(r => setTimeout(r, 1200));
      const discoveredTopics = await geminiService.discoverTopics(MOCK_PAPERS, knowledge, target);
      setTopics(discoveredTopics);
      addLog('Discovery Engine', `Analysis complete. Gap mapping successful.`, 'success');

      setStage(ResearchStage.LITERATURE_SYNTHESIS);
      await geminiService.synthesizeLiterature(MOCK_PAPERS);
      
      setStage(ResearchStage.VISUAL_ANALYSIS);
      const visuals = await geminiService.analyzeVisuals(MOCK_PAPERS);
      setVisualFindings(visuals);

      setStage(ResearchStage.HYPOTHESIS_GENERATION);
      const hyps = await geminiService.generateHypotheses("", visuals, knowledge);
      setHypotheses(hyps);

      if (isAutonomousRef.current) {
        const bestHyp = hyps[0];
        await executeVerificationAndPublication(bestHyp);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        addLog('System', 'API Authentication Fault. Re-selection required.', 'error');
        setIsKeyRequired(true);
      } else {
        addLog('Orchestrator', `Fault: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
      }
      setIsLoading(false);
      setIsAutonomous(false);
    }
  };

  const executeVerificationAndPublication = async (hyp: Hypothesis) => {
    setIsLoading(true);

    try {
      setStage(ResearchStage.CODE_VERIFICATION);
      const codeResults = await geminiService.runCodeLab(hyp);
      
      setStage(ResearchStage.SCIENTIFIC_VERIFICATION);
      const verif = await geminiService.verifyHypothesis(hyp, visualFindings, codeResults);
      
      setStage(ResearchStage.JOURNAL_PUBLICATION);
      const publishedReport = await geminiService.publishJournal(hyp, verif, visualFindings);
      setReport(publishedReport);

      setStage(ResearchStage.KNOWLEDGE_INTEGRATION);
      const updatedKnowledge = await geminiService.updateKnowledgeState(knowledge, publishedReport);
      setKnowledge(updatedKnowledge);

      setStage(ResearchStage.COMPLETED);
      setIsLoading(false);

      if (isAutonomousRef.current) {
         setTimeout(() => { if (isAutonomousRef.current) runCycle(); }, 5000);
      }
    } catch (error) {
      addLog('System', `Publication Failed: ${error instanceof Error ? error.message : 'Internal error'}`, 'error');
      setIsLoading(false);
      setIsAutonomous(false);
    }
  };

  const downloadReport = (rep: ResearchReport) => {
    const content = `
TITLE: ${rep.title}
JOURNAL: ${rep.journalName}
TIMESTAMP: ${rep.timestamp}

HYPOTHESIS:
${rep.hypothesis.statement}

FORMAL PROOF & LOGICAL DERIVATION:
${rep.formalProof}

LITERATURE REVIEW:
${rep.literatureReview}

METHODOLOGY:
${rep.methodology}

RESULTS PREVIEW:
${rep.resultsPreview}

CONCLUSION:
${rep.conclusion}

VERIFICATION CONFIDENCE: ${Math.round(rep.verificationSuite?.overallConfidence! * 100)}%

--- SOURCE CODE LAB RESULTS ---
${rep.verificationSuite?.codeLabResults?.map(c => `
FILE: ${c.filename} (${c.language})
STATUS: ${c.status}
CODE:
${c.code}
RESULTS:
${c.testResults}
`).join('\n') || 'No simulation code attached.'}
    `.trim();
    downloadFile(content, `${rep.title.toLowerCase().replace(/ /g, '_')}_technical_proof.txt`, 'text/plain');
  };

  const downloadFullSystemState = () => {
    const content = JSON.stringify(knowledge, null, 2);
    downloadFile(content, `astra_emergency_state_dump_${Date.now()}.json`, 'application/json');
    addLog('System', 'EMERGENCY DATA RECOVERY COMPLETED. MASTER JSON GENERATED.', 'success');
  };

  const EngineSchematic = () => {
    const s = knowledge.subsystems;
    const avg = Math.round((s.propulsion.status + s.thermal.status + s.structural.status + s.avionics.status + s.fuel.status) / 5);
    
    return (
      <div className="relative w-full h-[650px] bg-slate-900/60 rounded-[4rem] border border-slate-800/50 flex flex-col lg:flex-row items-center justify-center p-12 overflow-hidden shadow-3xl group/engine">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="relative w-full lg:w-1/2 h-full flex flex-col items-center justify-center">
           <div className="absolute inset-0 bg-blue-500/5 blur-[150px] rounded-full" />
           
           <div className="relative flex flex-col items-center w-64 space-y-1">
              <div 
                className={`relative z-10 cursor-pointer transition-all hover:scale-110 active:scale-95 ${prioritySubsystem === 'avionics' ? 'brightness-125' : ''}`}
                onClick={() => setPrioritySubsystem('avionics')}
              >
                 <div className={`w-0 h-0 border-l-[65px] border-l-transparent border-r-[65px] border-r-transparent border-b-[100px] ${s.avionics.status > 50 ? 'border-b-blue-400 shadow-[0_20px_40px_rgba(59,130,246,0.3)]' : 'border-b-slate-700'} transition-all duration-1000`} />
                 <div className={`absolute -top-14 left-1/2 -translate-x-1/2 px-5 py-2 bg-slate-950 border ${prioritySubsystem === 'avionics' ? 'border-blue-500 shadow-[0_0_20px_blue]' : 'border-slate-800'} rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap`}>
                    <Monitor className="w-3.5 h-3.5" /> Avionics: {s.avionics.status}%
                 </div>
              </div>

              <div 
                className="relative w-40 flex flex-col items-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                onClick={() => setPrioritySubsystem('structural')}
              >
                 <div className={`w-40 h-72 border-x-8 ${s.fuel.status > 50 ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50'} transition-all duration-1000 relative overflow-hidden rounded-xl`}>
                    <div className="absolute bottom-0 left-0 right-0 bg-blue-600/40 transition-all duration-1000" style={{ height: `${s.fuel.status}%` }} />
                 </div>
                 <div className={`absolute top-1/2 -left-40 -translate-y-1/2 px-5 py-2 bg-slate-950 border ${prioritySubsystem === 'structural' ? 'border-emerald-500 shadow-[0_0_20px_emerald]' : 'border-slate-800'} rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap`}>
                    <Shield className="w-3.5 h-3.5" /> Structural: {s.structural.status}%
                 </div>
              </div>

              <div 
                className="relative cursor-pointer transition-all hover:scale-110 active:scale-95"
                onClick={() => setPrioritySubsystem('propulsion')}
              >
                 <div className={`w-60 h-48 border-t-[120px] ${s.propulsion.status > 50 ? 'border-t-orange-500 shadow-[0_-40px_80px_rgba(249,115,22,0.4)]' : 'border-t-slate-800'} border-x-[60px] border-x-transparent transition-all duration-1000 relative`}>
                    {s.propulsion.status > 80 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[300px] bg-gradient-to-b from-orange-400/80 to-transparent blur-3xl animate-pulse" />
                    )}
                 </div>
                 <div className={`absolute -bottom-14 left-1/2 -translate-x-1/2 px-5 py-2 bg-slate-950 border ${prioritySubsystem === 'propulsion' ? 'border-orange-500 shadow-[0_0_20px_orange]' : 'border-slate-800'} rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap`}>
                    <Gauge className="w-3.5 h-3.5" /> Propulsion: {s.propulsion.status}%
                 </div>
              </div>
           </div>
        </div>

        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center space-y-12 pl-12 border-l border-slate-800/50 relative">
           <div className="absolute top-0 left-12 p-8 bg-slate-950/90 backdrop-blur-xl rounded-[3rem] border border-slate-800 shadow-2xl flex items-center gap-6 translate-y-[-50%]">
              <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Power className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em]">Engine Viability</div>
                <div className="text-5xl font-black text-white font-mono tracking-tighter">{avg}%</div>
              </div>
           </div>

           <div className="space-y-10">
              <div className="flex items-center justify-between pr-10">
                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-slate-600 mb-12 flex items-center gap-4">
                   <Terminal className="w-6 h-6" /> System Configuration
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-6 max-h-[450px] overflow-y-auto pr-6 custom-scrollbar">
                {(Object.values(knowledge.subsystems) as EngineSubsystem[]).map((sub) => (
                  <div 
                    key={sub.name} 
                    className={`group/sub p-6 bg-slate-950/80 border ${prioritySubsystem === sub.name.toLowerCase().split(' ')[0] ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-800/60'} rounded-[2.5rem] transition-all hover:translate-x-4 cursor-pointer relative overflow-hidden`}
                    onClick={() => setInspectingSub(sub)}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full" />
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${sub.status > 75 ? 'bg-emerald-500 shadow-[0_0_10px_emerald]' : sub.status > 30 ? 'bg-blue-500 shadow-[0_0_10px_blue]' : 'bg-red-500 shadow-[0_0_10px_red]'}`} />
                        <span className="text-sm font-black uppercase text-slate-200 tracking-wider">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-slate-500 font-bold">{sub.status}%</span>
                        <Eye className="w-4 h-4 text-slate-700 group-hover/sub:text-blue-400 transition-colors" />
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-3 relative z-10">
                      <div className={`h-full ${sub.status > 75 ? 'bg-emerald-500' : 'bg-blue-600'} transition-all duration-1000`} style={{ width: `${sub.status}%` }} />
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    );
  };

  // API Key Gateway
  if (isKeyChecking) {
    return (
      <div className="h-screen w-full bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isKeyRequired) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-6 backdrop-blur-3xl">
        <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="w-full max-w-2xl bg-slate-900/90 border-2 border-slate-800 rounded-[5rem] p-16 md:p-24 shadow-[0_100px_200px_rgba(0,0,0,0.9)] relative overflow-hidden text-center animate-in fade-in zoom-in-95 duration-700">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
           
           <div className="w-32 h-32 bg-blue-600/10 rounded-[3rem] border-2 border-blue-600/20 flex items-center justify-center text-blue-400 mx-auto mb-16 shadow-2xl animate-pulse">
              <Lock className="w-14 h-14" />
           </div>
           
           <h2 className="text-6xl font-black uppercase tracking-tighter text-white mb-8">Access Astra Core</h2>
           <p className="text-2xl text-slate-400 font-light leading-relaxed mb-16 px-4">
              To proceed with high-fidelity aerospace simulations and mathematical verification, please connect your <span className="text-blue-400 font-bold">Paid Gemini API Key</span>.
           </p>
           
           <div className="space-y-8">
              <button 
                onClick={handleOpenSelectKey}
                className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[3rem] font-black text-base uppercase tracking-[0.4em] shadow-[0_25px_60px_rgba(37,99,235,0.4)] transition-all active:scale-95 flex items-center justify-center gap-6"
              >
                <Key className="w-6 h-6" /> Connect API Key
              </button>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-10 pt-4">
                 <a 
                   href="https://aistudio.google.com/app/apikey" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors text-[11px] font-black uppercase tracking-widest group"
                 >
                   Get Key from Google <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </a>
                 <div className="hidden md:block w-1.5 h-1.5 bg-slate-800 rounded-full" />
                 <a 
                   href="https://ai.google.dev/gemini-api/docs/billing" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors text-[11px] font-black uppercase tracking-widest group"
                 >
                   Billing Documentation <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                 </a>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden">
      <Sidebar currentStage={stage} logs={logs} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col">
        {/* Navigation Bar */}
        <div className="bg-slate-950/95 border-b border-slate-900/50 p-6 flex items-center justify-between backdrop-blur-3xl sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-900/80 p-1.5 rounded-[2rem] border border-slate-800 shadow-2xl">
               {[
                 { id: 'research', label: 'Discovery Lab', icon: Flask },
                 { id: 'design', label: 'Master Shell', icon: LayoutDashboard },
                 { id: 'breakthroughs', label: 'Evolution Traces', icon: Award }
               ].map((nav) => (
                 <button 
                   key={nav.id}
                   onClick={() => setViewMode(nav.id as any)}
                   className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${viewMode === nav.id ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 hover:text-white'}`}
                 >
                   <nav.icon className="w-4 h-4" /> {nav.label}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={() => {
                 const newState = !isAutonomous;
                 setIsAutonomous(newState);
                 if (newState && stage === ResearchStage.IDLE) runCycle();
                 addLog('System', newState ? 'AUTONOMOUS LOOP ENGAGED' : 'AUTONOMOUS LOOP PAUSED', newState ? 'success' : 'warning');
               }}
               className={`flex items-center gap-4 px-10 py-4 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 ${
                 isAutonomous ? 'bg-orange-600 text-white animate-pulse shadow-[0_0_50px_rgba(249,115,22,0.6)]' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'
               }`}
             >
               {isAutonomous ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
               {isAutonomous ? 'PAUSE LOOP' : 'RESUME LOOP'}
             </button>

             <button 
               onClick={downloadFullSystemState}
               className="p-4 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-[1.5rem] transition-all border border-emerald-500/20 shadow-lg active:scale-90 flex items-center gap-3 px-6"
               title="EMERGENCY RECOVERY: Export everything to JSON"
             >
                <HardDriveDownload className="w-5 h-5" /> 
                <span className="text-[10px] font-black uppercase tracking-widest">RECOVERY</span>
             </button>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto px-12 py-20 w-full relative">
          {stage === ResearchStage.IDLE && viewMode === 'research' && (
            <div className="text-center py-20 space-y-20 animate-in fade-in slide-in-from-bottom-24 duration-1000">
               <div className="relative inline-block group cursor-pointer" onClick={runCycle}>
                 <div className="absolute inset-0 blur-[150px] bg-blue-500/40 rounded-full group-hover:bg-blue-400/60 transition-all duration-1000 animate-pulse" />
                 <div className="p-16 bg-slate-900 border-2 border-slate-800 rounded-[5rem] relative shadow-[0_40px_100px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-105">
                    <BrainCircuit className="w-32 h-32 text-blue-400" />
                 </div>
               </div>
               <div className="space-y-10">
                 <h1 className="text-[10rem] font-black uppercase tracking-tighter leading-[0.75] italic">
                   Astra <br/><span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-indigo-500 to-emerald-400">Omniscient</span>
                 </h1>
                 <p className="text-3xl text-slate-400 max-w-4xl mx-auto font-light leading-relaxed tracking-tight">
                   Building a 100% Viable Aerospace System through <span className="text-blue-400 font-bold underline decoration-blue-500/30">Autonomous Mathematical Proof</span>.
                 </p>
               </div>
               <div className="flex flex-wrap justify-center gap-10 pt-10">
                 <button onClick={runCycle} className="group px-20 py-10 bg-blue-600 hover:bg-blue-500 text-white rounded-[4rem] font-black text-base uppercase tracking-[0.5em] flex items-center gap-10 shadow-[0_50px_120px_rgba(37,99,235,0.6)] transition-all active:scale-95">
                   <Power className="w-8 h-8" /> Start Discovery
                 </button>
                 <button onClick={resetProgress} className="px-12 py-10 bg-slate-950 text-red-500 rounded-[4rem] font-black text-sm uppercase tracking-[0.3em] border-2 border-slate-800 hover:border-red-600 transition-all flex items-center gap-4">
                   <RotateCcw className="w-6 h-6" /> Factory Reset
                 </button>
               </div>
            </div>
          )}

          {viewMode === 'design' && (
            <div className="space-y-16 animate-in fade-in duration-1000 pb-32">
               <h2 className="text-7xl font-black uppercase tracking-tighter flex items-center gap-8 border-b border-slate-900 pb-12">
                  <Layout className="w-20 h-20 text-blue-400" />
                  Design Shell Core
               </h2>
               <EngineSchematic />
               <div className="bg-slate-900/50 p-16 rounded-[5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                  <h3 className="text-xs font-black uppercase tracking-[0.5em] text-slate-600 mb-12 flex items-center gap-4">
                     <History className="w-6 h-6" /> Master Blueprint Trace
                  </h3>
                  <div className="text-3xl leading-[2] text-slate-300 font-light italic p-16 bg-slate-950/60 rounded-[4rem] border border-slate-800 relative overflow-hidden">
                     <p>{knowledge.masterDesignDoc}</p>
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'breakthroughs' && (
            <div className="space-y-16 animate-in fade-in duration-800 pb-32">
               <h2 className="text-7xl font-black uppercase tracking-tighter flex items-center gap-8 border-b border-slate-900 pb-12">
                  <Award className="w-20 h-20 text-orange-400" />
                  Evolution Trace
               </h2>
               {knowledge.breakthroughs.length === 0 ? (
                 <div className="py-56 text-center opacity-40">
                    <p className="text-3xl font-light italic">No architectural milestones recorded.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    {knowledge.breakthroughs.map((bt) => (
                      <div key={bt.id} className="bg-slate-900/50 p-16 rounded-[5rem] border border-orange-500/10 hover:border-orange-500/40 transition-all group relative overflow-hidden shadow-3xl">
                         <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px]" />
                         <div className="flex justify-between items-start mb-12">
                            <div className="px-8 py-3 bg-orange-500/10 text-orange-400 rounded-full text-[12px] font-black uppercase tracking-widest border border-orange-500/20">Critical Achievement</div>
                            {bt.reportId && (
                              <button 
                                onClick={() => {
                                  const r = knowledge.pastReports.find(pr => pr.id === bt.reportId);
                                  if (r) { setReport(r); setViewMode('research'); }
                                }}
                                className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-blue-500 hover:text-white transition-all"
                              >
                                <FileText className="w-6 h-6" />
                              </button>
                            )}
                         </div>
                         <h3 className="text-6xl font-black text-white mb-10 tracking-tight leading-[0.85]">{bt.title}</h3>
                         <p className="text-2xl text-slate-400 leading-relaxed font-light italic mb-12">"{bt.description}"</p>
                         
                         <div className="bg-slate-950/80 p-10 rounded-[3rem] border border-slate-800/60 mb-12">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-3">
                               <Fingerprint className="w-4 h-4" /> Mathematical Proof Summary
                            </h4>
                            <p className="text-xl text-slate-400 font-mono leading-relaxed whitespace-pre-wrap italic">
                               {bt.proofOfConcept || "See detailed technical package for proof."}
                            </p>
                         </div>

                         <div className="mt-auto pt-12 border-t border-slate-800 flex items-center justify-between">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Impact Rank</span>
                               <span className="text-4xl font-black text-orange-400 tracking-tighter">{bt.impactScore}σ</span>
                            </div>
                            <div className="text-xl font-mono text-slate-500">{bt.date}</div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {viewMode === 'research' && report && (
            <div className="animate-in slide-in-from-bottom-32 duration-1000">
               <div className="bg-white text-slate-900 p-20 md:p-40 rounded-[7rem] shadow-3xl font-serif border border-slate-200 relative overflow-hidden">
                  <header className="border-b-[18px] border-slate-900 pb-28 mb-40 flex flex-col lg:flex-row justify-between items-end gap-20">
                     <div className="space-y-12 max-w-7xl">
                        <div className="flex items-center gap-6 text-blue-700 font-sans font-black uppercase text-sm tracking-[0.7em]">
                           <Milestone className="w-10 h-10" /> Cycle {knowledge.cycleCount} • Proof Package
                        </div>
                        <h1 className="text-[10rem] font-black uppercase leading-[0.75] tracking-tighter text-slate-900 italic">{report.title}</h1>
                     </div>
                     <div className="text-right font-sans shrink-0 space-y-8">
                        <div className="text-sm font-black uppercase text-slate-400 tracking-[0.6em]">Consensus Audit</div>
                        <div className="text-7xl font-black bg-slate-900 text-white px-16 py-10 rounded-[3rem] flex items-center gap-6">
                           {Math.round(report.verificationSuite?.overallConfidence! * 100)}% <CheckCircle className="w-12 h-12 text-emerald-400" />
                        </div>
                     </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-40">
                     <div className="lg:col-span-4 space-y-32 font-sans">
                        <div className="space-y-14 bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-100 shadow-inner">
                           <h3 className="text-sm font-black uppercase tracking-[0.7em] text-slate-400 border-l-[12px] border-emerald-600 pl-12 flex items-center gap-4">
                              <FunctionSquare className="w-6 h-6 text-emerald-600" /> Formal Proof
                           </h3>
                           <div className="text-xl leading-[1.7] text-slate-600 font-mono whitespace-pre-wrap p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                             {report.formalProof}
                           </div>
                        </div>
                        
                        <div className="space-y-14">
                           <h4 className="text-sm font-black uppercase tracking-[0.7em] text-slate-400 border-l-[12px] border-orange-500 pl-12">Optimization Curve</h4>
                           <DataChart data={report.chartData} />
                        </div>

                        <div className="space-y-12">
                           {report.evidenceData.map((d, i) => (
                             <div key={i} className="p-12 bg-slate-50 border border-slate-200 rounded-[4rem]">
                                <div className="flex justify-between items-center mb-6">
                                   <span className="text-[14px] font-black text-slate-400 uppercase tracking-[0.5em]">{d.label}</span>
                                   {d.trend === 'rising' ? <TrendingUp className="w-8 h-8 text-emerald-500" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
                                </div>
                                <div className="text-8xl font-black text-slate-900 tracking-tighter leading-none">{d.value}<span className="text-2xl text-slate-400 ml-4 font-normal">σ</span></div>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="lg:col-span-8 space-y-36">
                        <section className="space-y-20">
                           <h3 className="text-6xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-16 font-sans">
                              <span className="w-32 h-4 bg-slate-900 rounded-full" /> I. Methodology
                           </h3>
                           <div className="text-5xl leading-[1.8] text-slate-700 font-light first-letter:text-[15rem] first-letter:font-black first-letter:mr-10 first-letter:float-left first-letter:leading-none">
                             {report.methodology}
                           </div>
                        </section>

                        <section className="bg-slate-50 p-20 rounded-[6rem] border-2 border-slate-100 space-y-12 relative overflow-hidden group">
                           <Cpu className="absolute top-0 right-0 w-40 h-40 p-8 text-blue-600/10 group-hover:text-blue-600/20 transition-colors" />
                           <h3 className="text-4xl font-black font-sans uppercase tracking-[0.3em] flex items-center gap-6 relative z-10">
                              <Flask className="w-8 h-8 text-blue-500" /> Simulation Artifacts
                           </h3>
                           <div className="space-y-4 relative z-10">
                              {report.verificationSuite?.codeLabResults?.map((c, idx) => (
                                <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl flex justify-between items-center group/item hover:border-blue-500 transition-all">
                                   <div className="flex items-center gap-4">
                                      <FileCode className="w-8 h-8 text-slate-400" />
                                      <div>
                                         <div className="text-[14px] font-black text-slate-900 uppercase tracking-wider">{c.filename}</div>
                                         <div className="text-[11px] text-slate-500 font-mono uppercase">{c.status} • {c.language}</div>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={() => downloadFile(c.code, c.filename, 'text/plain')}
                                     className="p-4 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 opacity-0 group-hover/item:opacity-100 transition-all"
                                   >
                                      <Download className="w-5 h-5" />
                                   </button>
                                </div>
                              ))}
                           </div>
                        </section>

                        <section className="space-y-20">
                           <h3 className="text-6xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-16 font-sans">
                              <span className="w-32 h-4 bg-slate-900 rounded-full" /> II. Verdict
                           </h3>
                           <div className="text-5xl leading-[1.9] text-slate-700 bg-slate-50 p-24 rounded-[6rem] border-4 border-slate-100 italic shadow-inner relative">
                             <p className="relative z-10 font-light">{report.conclusion}</p>
                           </div>
                        </section>
                        
                        <footer className="flex justify-end pt-12 border-t border-slate-200 gap-6">
                          <button 
                            onClick={() => downloadReport(report)}
                            className="flex items-center gap-4 px-12 py-6 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all active:scale-95"
                          >
                            <Download className="w-6 h-6" /> Export Technical Package
                          </button>
                        </footer>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Autonomous Hud */}
      {isAutonomous && (
         <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-slate-950/98 backdrop-blur-3xl px-16 py-12 rounded-[5rem] border-2 border-orange-500/50 shadow-3xl flex items-center gap-20 scale-110">
            <div className="flex items-center gap-12">
               <div className="relative">
                 <div className="w-24 h-24 border-[10px] border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-10 h-10 text-orange-500 animate-pulse" />
                 </div>
               </div>
               <div className="flex flex-col">
                 <span className="text-3xl font-black text-white uppercase tracking-[0.3em] italic">Autonomous Loop</span>
                 <span className="text-[12px] text-orange-500 font-black uppercase tracking-[0.6em]">{stage.replace('_', ' ')}...</span>
               </div>
            </div>
            <button onClick={() => setIsAutonomous(false)} className="p-8 bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white rounded-[3rem] border-2 border-orange-500/20 shadow-2xl transition-all active:scale-95">
              <Pause className="w-10 h-10" />
            </button>
         </div>
      )}

      {/* Inspection Modal */}
      {inspectingSub && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center p-12 animate-in fade-in zoom-in duration-500">
           <div className="bg-slate-900 border-2 border-slate-800 rounded-[5rem] w-full max-w-5xl p-24 relative shadow-3xl overflow-hidden">
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -mr-[300px] -mt-[300px]" />
              <button onClick={() => setInspectingSub(null)} className="absolute top-12 right-12 p-6 bg-slate-950 border border-slate-800 rounded-full text-slate-500 hover:text-white transition-all hover:rotate-90">
                <RotateCcw className="w-8 h-8" />
              </button>
              <div className="flex items-center gap-12 mb-20">
                 <div className="w-32 h-32 rounded-[2.5rem] bg-blue-600/10 border-2 border-blue-600/20 flex items-center justify-center text-blue-400 shadow-2xl">
                    <Layers className="w-16 h-16" />
                 </div>
                 <div>
                    <div className="text-[12px] font-black uppercase text-blue-500 tracking-[0.5em] mb-4">Core Module</div>
                    <h2 className="text-7xl font-black uppercase tracking-tighter text-white leading-none mb-6">{inspectingSub.name}</h2>
                    <div className="text-3xl font-black font-mono text-emerald-400">{inspectingSub.status}% READY</div>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                 <div className="space-y-12">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-500">Architecture Spec</h3>
                    <p className="text-4xl text-slate-300 font-light leading-relaxed italic border-l-8 border-blue-600/30 pl-12">"{inspectingSub.specifications}"</p>
                 </div>
                 <div className="bg-slate-950/80 p-16 rounded-[4rem] border-2 border-slate-800 flex flex-col items-center justify-center text-center space-y-10">
                    <Target className="w-24 h-24 text-blue-500 animate-pulse" />
                    <div className="space-y-6">
                       <h4 className="text-3xl font-black text-white uppercase tracking-tight">Dedicated Discovery</h4>
                       <p className="text-xl text-slate-500 font-light">Focus research purely on this module.</p>
                    </div>
                    <button 
                      onClick={() => { setPrioritySubsystem(inspectingSub.name.toLowerCase().split(' ')[0]); setInspectingSub(null); setViewMode('research'); runCycle(); }}
                      className="w-full py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-500 transition-all active:scale-95"
                    >
                      Launch Focal Research
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
