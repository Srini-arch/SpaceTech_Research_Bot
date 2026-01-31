
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
  Loader2,
  BookOpen,
  ArrowLeft,
  Settings,
  ChevronRight,
  Box
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

const STORAGE_KEY = 'mairis_prime_blueprint_v3';

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
  const chartHeight = 160;
  const chartWidth = 400;
  
  return (
    <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl group relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{data.label}</span>
      </div>
      <div className="relative h-[160px] w-full flex items-end justify-between overflow-visible">
        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
           <path 
             d={`M ${data.points.map((p, i) => `${(i / (data.points.length - 1)) * chartWidth},${chartHeight - (p.y / maxVal) * chartHeight}`).join(' L ')}`}
             fill="none"
             stroke={data.color || '#3b82f6'}
             strokeWidth="3"
             strokeLinecap="round"
             className="transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
           />
           {data.points.map((p, i) => (
             <circle 
               key={i}
               cx={(i / (data.points.length - 1)) * chartWidth} 
               cy={chartHeight - (p.y / maxVal) * chartHeight} 
               r="4" 
               fill="#020617"
               stroke={data.color || '#3b82f6'} 
               strokeWidth="2"
             />
           ))}
        </svg>
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
  const [viewMode, setViewMode] = useState<'research' | 'design' | 'archive'>('research');
  const [prioritySubsystem, setPrioritySubsystem] = useState<string | null>(null);
  const [inspectingSub, setInspectingSub] = useState<EngineSubsystem | null>(null);
  
  const [isKeyRequired, setIsKeyRequired] = useState(false);
  const [isKeyChecking, setIsKeyChecking] = useState(true);

  const isAutonomousRef = useRef(isAutonomous);
  useEffect(() => { isAutonomousRef.current = isAutonomous; }, [isAutonomous]);

  const checkApiKeyStatus = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setIsKeyRequired(!hasKey);
    } else {
      setIsKeyRequired(false);
    }
    setIsKeyChecking(false);
  }, []);

  useEffect(() => {
    checkApiKeyStatus();
  }, [checkApiKeyStatus]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setKnowledge(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(knowledge));
  }, [knowledge]);

  const addLog = useCallback((agentName: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs(prev => [...prev, { agentName, message, timestamp: new Date().toISOString(), type }]);
  }, []);

  // Fix: Implemented downloadFullSystemState to handle full system state exports
  const downloadFullSystemState = useCallback(() => {
    const content = JSON.stringify(knowledge, null, 2);
    downloadFile(content, `mairis-prime-state-${Date.now()}.json`, 'application/json');
    addLog('System', 'Full state exported to JSON.', 'success');
  }, [knowledge, addLog]);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume successful selection as per prompt instructions
      setIsKeyRequired(false);
      addLog('System', 'Credentials updated via secure portal.', 'success');
    }
  };

  const resetProgress = useCallback(() => {
    if (window.confirm('WARNING: This will purge all research history and engine status. Confirm core reset?')) {
      setKnowledge(INITIAL_KNOWLEDGE);
      localStorage.removeItem(STORAGE_KEY);
      setStage(ResearchStage.IDLE);
      setReport(null);
      setIsAutonomous(false);
      setIsLoading(false);
      addLog('System', 'MASTER RESET COMPLETE.', 'warning');
    }
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

    const target = calculatePriority();
    addLog('Orchestrator', `Commencing research loop for ${target.toUpperCase()}...`, 'info');

    try {
      setStage(ResearchStage.TOPIC_DISCOVERY);
      await new Promise(r => setTimeout(r, 1000));
      const discoveredTopics = await geminiService.discoverTopics(MOCK_PAPERS, knowledge, target);
      setTopics(discoveredTopics);
      addLog('Discovery', `Strategic roadmap established. Novelty score: High.`, 'success');

      setStage(ResearchStage.LITERATURE_SYNTHESIS);
      const synthesis = await geminiService.synthesizeLiterature(MOCK_PAPERS);
      
      setStage(ResearchStage.VISUAL_ANALYSIS);
      const visuals = await geminiService.analyzeVisuals(MOCK_PAPERS);
      setVisualFindings(visuals);

      setStage(ResearchStage.HYPOTHESIS_GENERATION);
      const hyps = await geminiService.generateHypotheses(synthesis, visuals, knowledge);
      setHypotheses(hyps);

      if (isAutonomousRef.current) {
        await executeVerificationAndPublication(hyps[0]);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        addLog('System', 'API Authentication Failure. Re-selection triggered.', 'error');
        setIsKeyRequired(true);
      } else {
        addLog('Orchestrator', `Critical Fault: ${error instanceof Error ? error.message : 'Unknown'}`, 'error');
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
         setTimeout(() => { if (isAutonomousRef.current) runCycle(); }, 4000);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        setIsKeyRequired(true);
      } else {
        addLog('System', `Loop Terminated: ${error instanceof Error ? error.message : 'Error'}`, 'error');
      }
      setIsLoading(false);
      setIsAutonomous(false);
    }
  };

  const downloadReport = (rep: ResearchReport) => {
    const content = `TITLE: ${rep.title}\nID: ${rep.id}\nTIMESTAMP: ${rep.timestamp}\n\nHYPOTHESIS:\n${rep.hypothesis.statement}\n\nFORMAL PROOF:\n${rep.formalProof}\n\nCONCLUSION:\n${rep.conclusion}`;
    downloadFile(content, `${rep.id}.txt`, 'text/plain');
  };

  if (isKeyChecking) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  if (isKeyRequired) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#020617] flex items-center justify-center p-6 backdrop-blur-3xl">
        <div className="max-w-xl w-full bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-16 text-center shadow-3xl">
           <div className="w-24 h-24 bg-blue-600/10 rounded-[2rem] border-2 border-blue-600/20 flex items-center justify-center text-blue-400 mx-auto mb-10 animate-pulse">
              <Lock className="w-10 h-10" />
           </div>
           <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-6">Mairis Prime Key Selection</h2>
           <p className="text-slate-400 text-lg mb-12 font-light leading-relaxed">Please connect your project-linked <span className="text-blue-400 font-bold">API Key</span>. This system requires your own verified credentials to perform heavy computational research.</p>
           <button 
             onClick={handleOpenSelectKey}
             className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4"
           >
             <Key className="w-5 h-5" /> Select Project Key
           </button>
           <div className="mt-8 flex justify-center gap-6">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Generate Key</a>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Billing Settings</a>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-inter">
      <Sidebar currentStage={stage} logs={logs} />
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar flex flex-col bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {/* Universal Navbar */}
        <div className="bg-slate-950/90 border-b border-slate-900/50 p-4 px-8 flex items-center justify-between backdrop-blur-xl sticky top-0 z-[100] shadow-2xl">
          <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
             {[
               { id: 'research', label: 'Laboratory', icon: Flask },
               { id: 'design', label: 'Engine Core', icon: LayoutDashboard },
               { id: 'archive', label: 'Archives', icon: BookOpen }
             ].map((nav) => (
               <button 
                 key={nav.id}
                 onClick={() => { setViewMode(nav.id as any); setReport(null); }}
                 className={`flex items-center gap-3 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === nav.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
               >
                 <nav.icon className="w-3.5 h-3.5" /> {nav.label}
               </button>
             ))}
          </div>
          
          <div className="flex items-center gap-4">
             <button 
               onClick={handleOpenSelectKey}
               className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all shadow-md active:scale-95"
               title="Update API Key"
             >
               <Key className="w-4 h-4" /> Change Key
             </button>

             <div className="h-6 w-[1px] bg-slate-800 mx-2" />

             <button 
               onClick={() => {
                 const newState = !isAutonomous;
                 setIsAutonomous(newState);
                 if (newState && stage === ResearchStage.IDLE) runCycle();
               }}
               className={`flex items-center gap-3 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 ${
                 isAutonomous ? 'bg-orange-600 text-white animate-pulse' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'
               }`}
             >
               {isAutonomous ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
               {isAutonomous ? 'Loop Active' : 'Start Auto-Cycle'}
             </button>

             <button onClick={downloadFullSystemState} className="p-2.5 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-500/20 transition-all active:scale-90" title="State Export">
                <HardDriveDownload className="w-4 h-4" /> 
             </button>
          </div>
        </div>

        <div className="flex-1 max-w-6xl mx-auto px-8 py-12 w-full relative">
          {stage === ResearchStage.IDLE && viewMode === 'research' && !report && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-16 animate-in fade-in duration-1000">
               <div className="relative group cursor-pointer" onClick={runCycle}>
                 <div className="absolute inset-0 blur-[120px] bg-blue-500/10 rounded-full group-hover:bg-blue-500/30 transition-all" />
                 <div className="p-16 bg-slate-900/60 border border-slate-800 rounded-[5rem] relative shadow-3xl">
                    <BrainCircuit className="w-32 h-32 text-blue-400 group-hover:scale-110 transition-transform" />
                 </div>
               </div>
               <div className="space-y-6">
                 <h1 className="text-9xl font-black uppercase tracking-tighter leading-none italic">Mairis Prime</h1>
                 <p className="text-2xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">Accelerating aerospace engineering via <span className="text-blue-400 font-bold underline underline-offset-8">recursive mathematical synthesis</span>.</p>
               </div>
               <div className="flex gap-8">
                 <button onClick={runCycle} className="px-16 py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all active:scale-95 flex items-center gap-6">
                   <Power className="w-6 h-6" /> Start Laboratory
                 </button>
                 <button onClick={resetProgress} className="px-12 py-8 bg-slate-950 text-red-500 border border-slate-800 rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:border-red-600 transition-all">
                   Factory Reset
                 </button>
               </div>
            </div>
          )}

          {viewMode === 'design' && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <header className="flex items-center justify-between border-b border-slate-900 pb-8">
                  <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-6">
                     <Layout className="w-10 h-10 text-blue-400" /> Propulsion Master Shell
                  </h2>
               </header>
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 h-[600px]">
                 <div className="lg:col-span-7 bg-slate-900/40 rounded-[3rem] border border-slate-800 p-12 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full" />
                    <div className="relative w-64 space-y-4">
                       <div className="h-24 w-40 mx-auto bg-slate-800 border-4 border-slate-700 rounded-t-full shadow-2xl flex items-center justify-center">
                          <Monitor className="w-10 h-10 text-slate-600" />
                       </div>
                       <div className="h-64 w-40 mx-auto bg-blue-600/10 border-x-4 border-blue-500/20 rounded-b-xl relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 bg-blue-500/40 transition-all duration-1000" style={{ height: `${knowledge.subsystems.fuel.status}%` }} />
                       </div>
                       <div className="h-32 w-56 mx-auto bg-slate-800 border-t-8 border-orange-500/40 border-x-[40px] border-x-transparent shadow-[0_-20px_50px_rgba(249,115,22,0.1)]" />
                    </div>
                 </div>
                 <div className="lg:col-span-5 space-y-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* Fix: Explicitly cast Object.values to EngineSubsystem[] to resolve 'unknown' property access errors */}
                    {(Object.values(knowledge.subsystems) as EngineSubsystem[]).map((sub) => (
                      <div key={sub.name} className="p-6 bg-slate-950/60 border border-slate-800 rounded-3xl hover:border-blue-500/30 transition-all cursor-pointer group" onClick={() => setInspectingSub(sub)}>
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-xs font-black uppercase tracking-widest text-slate-200">{sub.name}</span>
                           <span className="text-sm font-mono text-blue-400 font-bold">{sub.status}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden mb-4">
                           <div className="h-full bg-blue-500 group-hover:bg-blue-400 transition-all duration-1000" style={{ width: `${sub.status}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-light italic truncate">"{sub.specifications}"</p>
                      </div>
                    ))}
                    <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] mt-4">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Integration Summary</h3>
                       <p className="text-sm text-slate-400 font-light italic leading-relaxed">"{knowledge.masterDesignDoc}"</p>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {viewMode === 'archive' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-12 duration-500 pb-20">
               <header className="flex items-center justify-between border-b border-slate-900 pb-8">
                  <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-6">
                     <BookOpen className="w-10 h-10 text-emerald-400" /> Research Archives
                  </h2>
               </header>
               {knowledge.pastReports.length === 0 ? (
                 <div className="py-40 text-center opacity-30">
                    <p className="text-2xl font-light italic">Laboratory archives are currently empty. Initiate research cycles to generate proofs.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {knowledge.pastReports.map((rep) => (
                      <div key={rep.id} className="bg-slate-900/40 border border-slate-800 p-8 rounded-[3rem] hover:border-blue-500/40 transition-all group flex flex-col shadow-xl">
                         <div className="flex justify-between items-start mb-6">
                            <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${rep.isBreakthrough ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                               {rep.isBreakthrough ? 'Critical Breakthrough' : 'Standard Proof'}
                            </div>
                            <button onClick={() => downloadReport(rep)} className="p-2 text-slate-500 hover:text-white transition-colors">
                               <Download className="w-4 h-4" />
                            </button>
                         </div>
                         <h3 className="text-2xl font-black text-white leading-tight mb-4 group-hover:text-blue-200 transition-colors">{rep.title}</h3>
                         <p className="text-[10px] text-slate-500 font-mono mb-8">Generated: {new Date(rep.timestamp).toLocaleString()}</p>
                         <div className="mt-auto space-y-4">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                               <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Confidence: {Math.round(rep.verificationSuite?.overallConfidence! * 100)}%
                            </div>
                            <button 
                              onClick={() => { setReport(rep); setViewMode('research'); }}
                              className="w-full py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-600 hover:text-white transition-all shadow-md"
                            >
                               Open Full Report
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {viewMode === 'research' && report && (
            <div className="animate-in fade-in duration-1000">
               <button onClick={() => setReport(null)} className="mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                  <ArrowLeft className="w-4 h-4" /> Return to Dashboard
               </button>
               
               <div className="bg-white text-slate-900 p-16 md:p-32 rounded-[6rem] shadow-4xl font-serif border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                     <Settings className="w-64 h-64 rotate-45" />
                  </div>
                  
                  <header className="border-b-[12px] border-slate-900 pb-16 mb-24 flex flex-col lg:flex-row justify-between items-end gap-12 relative z-10">
                     <div className="space-y-6">
                        <div className="flex items-center gap-4 text-blue-700 font-sans font-black uppercase text-[10px] tracking-[0.4em]">
                           <Milestone className="w-8 h-8" /> Mairis Prime Verified Proof Package
                        </div>
                        <h1 className="text-7xl font-black uppercase leading-[0.9] tracking-tighter text-slate-900 italic max-w-4xl">{report.title}</h1>
                     </div>
                     <div className="bg-slate-900 text-white p-8 rounded-[3rem] text-center min-w-[200px] shadow-2xl">
                        <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">Audit Status</div>
                        <div className="text-5xl font-black flex items-center justify-center gap-3">
                           {Math.round(report.verificationSuite?.overallConfidence! * 100)}% <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                     </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 relative z-10">
                     <div className="lg:col-span-4 space-y-16 font-sans">
                        <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-200 shadow-inner space-y-8">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                              <Box className="w-4 h-4 text-emerald-600" /> Proof Derivation
                           </h3>
                           <div className="text-sm leading-relaxed text-slate-600 font-mono bg-white p-6 rounded-3xl border border-slate-200 shadow-sm whitespace-pre-wrap italic">
                             {report.formalProof}
                           </div>
                        </div>
                        
                        <div className="space-y-8">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                              <TrendingUp className="w-4 h-4 text-orange-500" /> Delta Verification
                           </h4>
                           <DataChart data={report.chartData} />
                        </div>
                     </div>

                     <div className="lg:col-span-8 space-y-20">
                        <section className="space-y-10">
                           <h3 className="text-5xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-8 font-sans">
                              <span className="w-16 h-2 bg-slate-900 rounded-full" /> Methodology
                           </h3>
                           <div className="text-2xl leading-relaxed text-slate-700 font-light italic border-l-8 border-slate-100 pl-10">
                             {report.methodology}
                           </div>
                        </section>

                        <section className="bg-slate-50 p-12 rounded-[5rem] border border-slate-100 space-y-10">
                           <h3 className="text-xl font-black font-sans uppercase tracking-[0.2em] flex items-center gap-4 text-slate-500">
                              <Cpu className="w-6 h-6 text-blue-500" /> Simulation Lab Trace
                           </h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {report.verificationSuite?.codeLabResults?.map((c, idx) => (
                                <div key={idx} className="p-6 bg-white border border-slate-200 rounded-3xl flex items-center justify-between group/code hover:border-blue-500 transition-all shadow-sm">
                                   <div className="flex items-center gap-4">
                                      <FileCode className="w-8 h-8 text-slate-200 group-hover/code:text-blue-100 transition-colors" />
                                      <div>
                                         <div className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{c.filename}</div>
                                         <div className="text-[9px] text-slate-400 font-mono uppercase">{c.status}</div>
                                      </div>
                                   </div>
                                   <button onClick={() => downloadFile(c.code, c.filename, 'text/plain')} className="text-slate-300 hover:text-blue-600 p-2"><Download className="w-4 h-4" /></button>
                                </div>
                              ))}
                           </div>
                        </section>

                        <section className="space-y-10">
                           <h3 className="text-5xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-8 font-sans">
                              <span className="w-16 h-2 bg-slate-900 rounded-full" /> Logical Conclusion
                           </h3>
                           <div className="text-3xl leading-relaxed text-slate-800 font-light bg-slate-50 p-12 rounded-[4rem] italic border border-slate-200/50 shadow-inner">
                             {report.conclusion}
                           </div>
                        </section>
                        
                        <footer className="pt-12 border-t border-slate-100 flex justify-end">
                           <button 
                             onClick={() => downloadReport(report)}
                             className="px-12 py-5 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-4"
                           >
                             <HardDriveDownload className="w-5 h-5" /> Export Artifacts
                           </button>
                        </footer>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Autonomous Loop HUD */}
      {isAutonomous && (
         <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[200] bg-slate-950/98 backdrop-blur-3xl px-12 py-8 rounded-[4rem] border-2 border-orange-500/40 shadow-4xl flex items-center gap-12 scale-110">
            <div className="flex items-center gap-8">
               <div className="relative">
                 <div className="w-14 h-14 border-[6px] border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-6 h-6 text-orange-500 animate-pulse" />
                 </div>
               </div>
               <div className="flex flex-col">
                 <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Orchestrator Cycle</span>
                 <span className="text-[9px] text-orange-500 font-black uppercase tracking-[0.5em]">{stage.replace('_', ' ')}...</span>
               </div>
            </div>
            <button onClick={() => setIsAutonomous(false)} className="p-5 bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white rounded-[2rem] border-2 border-orange-500/20 shadow-xl transition-all active:scale-95">
              <Pause className="w-6 h-6" />
            </button>
         </div>
      )}

      {/* Subsystem Detail Modal */}
      {inspectingSub && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-8 animate-in zoom-in duration-300">
           <div className="max-w-4xl w-full bg-slate-900 border-2 border-slate-800 rounded-[4rem] p-16 relative shadow-4xl overflow-hidden">
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px]" />
              <button onClick={() => setInspectingSub(null)} className="absolute top-10 right-10 p-4 bg-slate-950 border border-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
                <RotateCcw className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-10 mb-12">
                 <div className="w-24 h-24 rounded-3xl bg-blue-600/10 border-2 border-blue-600/20 flex items-center justify-center text-blue-400 shadow-2xl">
                    <Layers className="w-12 h-12" />
                 </div>
                 <div>
                    <div className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-2">Core Component</div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white">{inspectingSub.name}</h2>
                    <div className="text-2xl font-black font-mono text-emerald-400 mt-2">{inspectingSub.status}% Operational readiness</div>
                 </div>
              </div>
              <div className="bg-slate-950/50 p-10 rounded-3xl border border-slate-800 mb-12">
                 <h3 className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-500 mb-6">Technical Manifest</h3>
                 <p className="text-2xl text-slate-300 font-light italic leading-relaxed">"{inspectingSub.specifications}"</p>
              </div>
              <button 
                onClick={() => { setPrioritySubsystem(inspectingSub.name.toLowerCase().split(' ')[0]); setInspectingSub(null); setViewMode('research'); runCycle(); }}
                className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-xl hover:bg-blue-500 transition-all active:scale-95"
              >
                Launch Focused Research Loop
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
