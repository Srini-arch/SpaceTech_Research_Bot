
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
  ArrowLeft
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

const STORAGE_KEY = 'mairis_prime_blueprint_v2';

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
  const [viewMode, setViewMode] = useState<'research' | 'design' | 'archive'>('research');
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
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsKeyRequired(!hasKey);
      } else {
        setIsKeyRequired(false);
      }
      setIsKeyChecking(false);
    };
    checkKey();
  }, []);

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

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setIsKeyRequired(false);
    }
  };

  const resetProgress = useCallback(() => {
    if (window.confirm('CRITICAL ACTION: Resetting Mairis Prime will wipe all engineering reports and readiness progress. Do you wish to proceed?')) {
      setKnowledge(INITIAL_KNOWLEDGE);
      localStorage.removeItem(STORAGE_KEY);
      setStage(ResearchStage.IDLE);
      setReport(null);
      setTopics([]);
      setHypotheses([]);
      setIsAutonomous(false);
      setIsLoading(false);
      addLog('System', 'CORE BLUEPRINT PURGED. ARCHIVE RESET.', 'warning');
    }
  }, [addLog]);

  const stopResearch = useCallback(() => {
    setIsLoading(false);
    setIsAutonomous(false);
    setStage(ResearchStage.IDLE);
    addLog('Orchestrator', 'Autonomous sequence halted.', 'warning');
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
    addLog('Orchestrator', `Cycle Initiated: Target ${target.toUpperCase()}`, 'info');

    try {
      setStage(ResearchStage.TOPIC_DISCOVERY);
      await new Promise(r => setTimeout(r, 1200));
      const discoveredTopics = await geminiService.discoverTopics(MOCK_PAPERS, knowledge, target);
      setTopics(discoveredTopics);
      addLog('Discovery Engine', `Research gaps identified. Novelty verified.`, 'success');

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
        addLog('System', 'API Key expired or project not found. Re-selection required.', 'error');
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
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        addLog('System', 'API Key re-authentication required.', 'error');
        setIsKeyRequired(true);
      } else {
        addLog('System', `Publication error: ${error instanceof Error ? error.message : 'Internal fault'}`, 'error');
      }
      setIsLoading(false);
      setIsAutonomous(false);
    }
  };

  const downloadReport = (rep: ResearchReport) => {
    const content = `
MAIRIS PRIME RESEARCH REPORT
ID: ${rep.id}
TITLE: ${rep.title}
JOURNAL: ${rep.journalName}
TIMESTAMP: ${rep.timestamp}

--- HYPOTHESIS ---
${rep.hypothesis.statement}

--- FORMAL MATHEMATICAL PROOF ---
${rep.formalProof}

--- LITERATURE CONTEXT ---
${rep.literatureReview}

--- METHODOLOGY ---
${rep.methodology}

--- VERIFICATION METRICS ---
Physics Audit Confidence: ${Math.round(rep.verificationSuite?.overallConfidence! * 100)}%

--- SIMULATION DATA ---
${rep.verificationSuite?.codeLabResults?.map(c => `
FILE: ${c.filename}
STATUS: ${c.status}
RESULTS: ${c.testResults}
`).join('\n')}
    `.trim();
    downloadFile(content, `${rep.title.toLowerCase().replace(/ /g, '_')}_proof.txt`, 'text/plain');
  };

  const downloadFullSystemState = () => {
    const content = JSON.stringify(knowledge, null, 2);
    downloadFile(content, `mairis_prime_blueprint_${Date.now()}.json`, 'application/json');
    addLog('System', 'MASTER DATA EXPORTED.', 'success');
  };

  const EngineSchematic = () => {
    const s = knowledge.subsystems;
    const avg = Math.round((s.propulsion.status + s.thermal.status + s.structural.status + s.avionics.status + s.fuel.status) / 5);
    
    return (
      <div className="relative w-full h-[600px] bg-slate-900/40 rounded-[4rem] border border-slate-800/50 flex flex-col lg:flex-row items-center justify-center p-12 overflow-hidden shadow-3xl group/engine">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="relative w-full lg:w-1/2 h-full flex flex-col items-center justify-center">
           <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full" />
           
           <div className="relative flex flex-col items-center w-64 space-y-1">
              <div 
                className={`relative z-10 cursor-pointer transition-all hover:scale-110 ${prioritySubsystem === 'avionics' ? 'brightness-125' : ''}`}
                onClick={() => setPrioritySubsystem('avionics')}
              >
                 <div className={`w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[90px] ${s.avionics.status > 50 ? 'border-b-blue-400 shadow-[0_20px_40px_rgba(59,130,246,0.3)]' : 'border-b-slate-700'} transition-all duration-1000`} />
                 <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                    AVIONICS: {s.avionics.status}%
                 </div>
              </div>

              <div className="relative w-36 h-64 border-x-4 border-slate-800 bg-slate-900/50 transition-all duration-1000 relative overflow-hidden rounded-lg">
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/30 transition-all duration-1000" style={{ height: `${s.fuel.status}%` }} />
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase text-slate-500 tracking-tighter rotate-90">Fuel Cell</div>
              </div>

              <div 
                className="relative cursor-pointer transition-all hover:scale-110"
                onClick={() => setPrioritySubsystem('propulsion')}
              >
                 <div className={`w-52 h-40 border-t-[100px] ${s.propulsion.status > 50 ? 'border-t-orange-500 shadow-[0_-30px_60px_rgba(249,115,22,0.3)]' : 'border-t-slate-800'} border-x-[50px] border-x-transparent transition-all duration-1000 relative`} />
                 <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-950 border border-slate-800 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                    PROPULSION: {s.propulsion.status}%
                 </div>
              </div>
           </div>
        </div>

        <div className="w-full lg:w-1/2 h-full flex flex-col justify-center space-y-8 pl-12 border-l border-slate-800/30 relative">
           <div className="flex items-center gap-6 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Power className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">System Integrity</div>
                <div className="text-4xl font-black text-white font-mono">{avg}%</div>
              </div>
           </div>

           <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
              {(Object.values(knowledge.subsystems) as EngineSubsystem[]).map((sub) => (
                <div 
                  key={sub.name} 
                  className={`p-5 bg-slate-950/60 border ${prioritySubsystem === sub.name.toLowerCase().split(' ')[0] ? 'border-blue-500/40 bg-blue-500/5' : 'border-slate-800/40'} rounded-3xl transition-all hover:translate-x-2 cursor-pointer relative overflow-hidden`}
                  onClick={() => setInspectingSub(sub)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black uppercase text-slate-300 tracking-wider">{sub.name}</span>
                    <span className="text-xs font-mono text-slate-500">{sub.status}%</span>
                  </div>
                  <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${sub.status}%` }} />
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  if (isKeyChecking) return <div className="h-screen w-full bg-[#020617] flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>;

  if (isKeyRequired) {
    return (
      <div className="fixed inset-0 z-[1000] bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[3rem] p-12 text-center relative overflow-hidden">
           <div className="w-20 h-20 bg-blue-600/10 rounded-3xl border border-blue-600/20 flex items-center justify-center text-blue-400 mx-auto mb-10">
              <Key className="w-10 h-10" />
           </div>
           <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-6">Mairis Prime Authenticator</h2>
           <p className="text-lg text-slate-400 font-light mb-12">Connect your <span className="text-blue-400 font-bold">Paid Gemini API Key</span> to proceed with autonomous aerospace engineering simulations.</p>
           <div className="space-y-6">
              <button 
                onClick={handleOpenSelectKey}
                className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all"
              >
                Connect Credentials
              </button>
              <div className="flex justify-center gap-8">
                 <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Get API Key</a>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Billing Docs</a>
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
        {/* Nav */}
        <div className="bg-slate-950/90 border-b border-slate-900/50 p-5 flex items-center justify-between backdrop-blur-xl sticky top-0 z-50">
          <div className="flex bg-slate-900/60 p-1 rounded-2xl border border-slate-800 shadow-xl">
             {[
               { id: 'research', label: 'Laboratory', icon: Flask },
               { id: 'design', label: 'Master Blueprint', icon: LayoutDashboard },
               { id: 'archive', label: 'Research Archive', icon: BookOpen }
             ].map((nav) => (
               <button 
                 key={nav.id}
                 onClick={() => setViewMode(nav.id as any)}
                 className={`flex items-center gap-2.5 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === nav.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
               >
                 <nav.icon className="w-3.5 h-3.5" /> {nav.label}
               </button>
             ))}
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={handleOpenSelectKey} className="p-3 bg-slate-900 text-slate-400 hover:text-blue-400 border border-slate-800 rounded-xl transition-all shadow-md active:scale-90" title="Change API Key">
               <Key className="w-4 h-4" />
             </button>
             <button 
               onClick={() => {
                 const newState = !isAutonomous;
                 setIsAutonomous(newState);
                 if (newState && stage === ResearchStage.IDLE) runCycle();
               }}
               className={`flex items-center gap-3 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                 isAutonomous ? 'bg-orange-600 text-white animate-pulse' : 'bg-slate-900 text-slate-500 border border-slate-800 hover:text-white'
               }`}
             >
               {isAutonomous ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
               {isAutonomous ? 'Loop Active' : 'Start Autonomous'}
             </button>
             <button onClick={downloadFullSystemState} className="p-3 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white rounded-xl transition-all border border-emerald-500/20 active:scale-90" title="Export State">
                <HardDriveDownload className="w-4 h-4" /> 
             </button>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto px-10 py-16 w-full">
          {stage === ResearchStage.IDLE && viewMode === 'research' && (
            <div className="text-center py-24 space-y-12">
               <div className="relative inline-block group cursor-pointer" onClick={runCycle}>
                 <div className="absolute inset-0 blur-[100px] bg-blue-500/20 rounded-full group-hover:bg-blue-500/40 transition-all duration-1000" />
                 <div className="p-12 bg-slate-900 border border-slate-800 rounded-[4rem] relative shadow-2xl transition-transform group-hover:scale-105">
                    <BrainCircuit className="w-24 h-24 text-blue-400" />
                 </div>
               </div>
               <div className="space-y-6">
                 <h1 className="text-8xl font-black uppercase tracking-tighter italic">Mairis Prime</h1>
                 <p className="text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                   Synthesis of 100% Viable Aerospace Propulsion through <span className="text-blue-400 font-bold underline decoration-blue-500/20">Recursive Mathematical Proof</span>.
                 </p>
               </div>
               <div className="flex flex-wrap justify-center gap-6 pt-8">
                 <button onClick={runCycle} className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center gap-6 shadow-2xl transition-all active:scale-95">
                   <Power className="w-5 h-5" /> Initialize Discovery
                 </button>
                 <button onClick={resetProgress} className="px-10 py-6 bg-slate-950 text-red-500 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] border border-slate-800 hover:border-red-600 transition-all flex items-center gap-3">
                   <RotateCcw className="w-4 h-4" /> System Reset
                 </button>
               </div>
            </div>
          )}

          {viewMode === 'design' && (
            <div className="space-y-12 pb-32">
               <h2 className="text-5xl font-black uppercase tracking-tighter flex items-center gap-6 border-b border-slate-900 pb-8">
                  <Layout className="w-12 h-12 text-blue-400" /> Shell Architecture
               </h2>
               <EngineSchematic />
               <div className="bg-slate-900/30 p-12 rounded-[3rem] border border-slate-800 shadow-xl">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-8 flex items-center gap-3">
                     <History className="w-4 h-4" /> Blueprint Trace
                  </h3>
                  <div className="text-xl leading-relaxed text-slate-400 font-light italic p-10 bg-slate-950/40 rounded-3xl border border-slate-900">
                     {knowledge.masterDesignDoc}
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'archive' && (
            <div className="space-y-12 pb-32">
               <h2 className="text-5xl font-black uppercase tracking-tighter flex items-center gap-6 border-b border-slate-900 pb-8">
                  <BookOpen className="w-12 h-12 text-emerald-400" /> Research Archive
               </h2>
               {knowledge.pastReports.length === 0 ? (
                 <div className="py-40 text-center opacity-30">
                    <p className="text-2xl font-light italic">The library is empty. Awaiting first breakthrough.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {knowledge.pastReports.map((rep) => (
                      <div key={rep.id} className="bg-slate-900/40 p-10 rounded-[3rem] border border-slate-800 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-xl">
                         <div className="flex justify-between items-start mb-8">
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${rep.isBreakthrough ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                               {rep.isBreakthrough ? 'Breakthrough Milestone' : 'Research Paper'}
                            </div>
                            <button onClick={() => downloadReport(rep)} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 hover:text-white transition-all">
                               <Download className="w-4 h-4" />
                            </button>
                         </div>
                         <h3 className="text-3xl font-black text-white mb-6 tracking-tight leading-tight">{rep.title}</h3>
                         <div className="flex items-center gap-6 mb-8 text-[11px] text-slate-500 font-mono">
                            <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> Cycle {rep.id.split('-')[1].substring(5)}</span>
                            <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                         </div>
                         <button 
                           onClick={() => { setReport(rep); setViewMode('research'); }}
                           className="w-full py-4 bg-slate-950 hover:bg-blue-600 hover:text-white text-blue-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-slate-800 transition-all flex items-center justify-center gap-3"
                         >
                            <FileText className="w-4 h-4" /> View Full Proof Package
                         </button>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {viewMode === 'research' && report && (
            <div className="animate-in slide-in-from-bottom-20 duration-700">
               <button onClick={() => setReport(null)} className="mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
               </button>
               
               <div className="bg-white text-slate-900 p-12 md:p-24 rounded-[5rem] shadow-3xl font-serif border border-slate-200 relative overflow-hidden">
                  <header className="border-b-8 border-slate-900 pb-16 mb-24 flex flex-col lg:flex-row justify-between items-end gap-12">
                     <div className="space-y-8 max-w-4xl">
                        <div className="flex items-center gap-4 text-blue-700 font-sans font-black uppercase text-[10px] tracking-[0.5em]">
                           <Milestone className="w-8 h-8" /> Mairis Prime Proof Package
                        </div>
                        <h1 className="text-8xl font-black uppercase leading-[0.85] tracking-tighter text-slate-900 italic">{report.title}</h1>
                     </div>
                     <div className="text-right font-sans shrink-0 space-y-4">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Audit Consensus</div>
                        <div className="text-5xl font-black bg-slate-900 text-white px-10 py-6 rounded-3xl flex items-center gap-4">
                           {Math.round(report.verificationSuite?.overallConfidence! * 100)}% <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                     </div>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-24">
                     <div className="lg:col-span-4 space-y-20 font-sans">
                        <div className="space-y-8 bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 border-l-8 border-emerald-600 pl-6 flex items-center gap-3">
                              Formal Proof
                           </h3>
                           <div className="text-sm leading-relaxed text-slate-600 font-mono whitespace-pre-wrap p-5 bg-white rounded-2xl border border-slate-200">
                             {report.formalProof}
                           </div>
                        </div>
                        
                        <div className="space-y-8">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 border-l-8 border-orange-500 pl-6">Validation Curve</h4>
                           <DataChart data={report.chartData} />
                        </div>
                     </div>

                     <div className="lg:col-span-8 space-y-24">
                        <section className="space-y-12">
                           <h3 className="text-4xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-10 font-sans">
                              <span className="w-20 h-2 bg-slate-900 rounded-full" /> Methodology
                           </h3>
                           <div className="text-3xl leading-relaxed text-slate-700 font-light italic">
                             {report.methodology}
                           </div>
                        </section>

                        <section className="bg-slate-50 p-12 rounded-[4rem] border border-slate-200 space-y-8 relative overflow-hidden group">
                           <h3 className="text-xl font-black font-sans uppercase tracking-[0.2em] flex items-center gap-4">
                              <Flask className="w-6 h-6 text-blue-500" /> Verification Lab Results
                           </h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {report.verificationSuite?.codeLabResults?.map((c, idx) => (
                                <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl flex justify-between items-center hover:border-blue-500 transition-all shadow-sm">
                                   <div className="flex items-center gap-3">
                                      <FileCode className="w-6 h-6 text-slate-300" />
                                      <div>
                                         <div className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{c.filename}</div>
                                         <div className="text-[9px] text-slate-500 font-mono">{c.status}</div>
                                      </div>
                                   </div>
                                   <button onClick={() => downloadFile(c.code, c.filename, 'text/plain')} className="text-slate-300 hover:text-blue-600"><Download className="w-4 h-4" /></button>
                                </div>
                              ))}
                           </div>
                        </section>

                        <section className="space-y-12">
                           <h3 className="text-4xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-10 font-sans">
                              <span className="w-20 h-2 bg-slate-900 rounded-full" /> Verdict
                           </h3>
                           <div className="text-4xl leading-relaxed text-slate-700 bg-slate-50 p-12 rounded-[4rem] border-2 border-slate-100 italic shadow-inner">
                             <p className="font-light">{report.conclusion}</p>
                           </div>
                        </section>
                        
                        <footer className="flex justify-end pt-10 border-t border-slate-200">
                          <button 
                            onClick={() => downloadReport(report)}
                            className="flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95"
                          >
                            <Download className="w-5 h-5" /> Export Data Artifacts
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
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60] bg-slate-950/95 backdrop-blur-2xl px-12 py-8 rounded-[4rem] border border-orange-500/30 shadow-3xl flex items-center gap-12 scale-110">
            <div className="flex items-center gap-8">
               <div className="relative">
                 <div className="w-16 h-16 border-8 border-orange-500/10 border-t-orange-500 rounded-full animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Database className="w-6 h-6 text-orange-500 animate-pulse" />
                 </div>
               </div>
               <div className="flex flex-col">
                 <span className="text-xl font-black text-white uppercase tracking-[0.2em] italic">Orchestrator Loop</span>
                 <span className="text-[10px] text-orange-500 font-black uppercase tracking-[0.4em]">{stage.replace('_', ' ')}...</span>
               </div>
            </div>
            <button onClick={() => setIsAutonomous(false)} className="p-5 bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white rounded-[2rem] border border-orange-500/20 shadow-xl transition-all active:scale-95">
              <Pause className="w-6 h-6" />
            </button>
         </div>
      )}

      {/* Inspection Modal */}
      {inspectingSub && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-12 animate-in fade-in zoom-in duration-300">
           <div className="bg-slate-900 border border-slate-800 rounded-[4rem] w-full max-w-4xl p-16 relative shadow-3xl">
              <button onClick={() => setInspectingSub(null)} className="absolute top-10 right-10 p-4 bg-slate-950 border border-slate-800 rounded-full text-slate-500 hover:text-white transition-all">
                <RotateCcw className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-10 mb-12">
                 <div className="w-24 h-24 rounded-3xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400">
                    <Layers className="w-12 h-12" />
                 </div>
                 <div>
                    <div className="text-[10px] font-black uppercase text-blue-500 tracking-[0.4em] mb-2">Subsystem Diagnostic</div>
                    <h2 className="text-5xl font-black uppercase tracking-tighter text-white">{inspectingSub.name}</h2>
                    <div className="text-xl font-black font-mono text-emerald-400">{inspectingSub.status}% VIABLE</div>
                 </div>
              </div>
              <div className="space-y-10">
                 <div className="bg-slate-950/50 p-10 rounded-3xl border border-slate-800">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-500 mb-4">Architecture Manifest</h3>
                    <p className="text-2xl text-slate-300 font-light italic leading-relaxed">"{inspectingSub.specifications}"</p>
                 </div>
                 <button 
                   onClick={() => { setPrioritySubsystem(inspectingSub.name.toLowerCase().split(' ')[0]); setInspectingSub(null); setViewMode('research'); runCycle(); }}
                   className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-500 transition-all active:scale-95"
                 >
                   Initiate Focal Research
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
