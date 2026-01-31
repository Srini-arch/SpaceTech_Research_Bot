
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
  FileCode,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  BrainCircuit,
  Database,
  Milestone,
  Zap,
  Zap as Power,
  LayoutDashboard,
  Target,
  FlaskRound as Flask,
  Download,
  Shield,
  Monitor,
  Cpu,
  Layers,
  RotateCcw,
  FileText,
  HardDriveDownload,
  Key,
  Lock,
  Loader2,
  BookOpen,
  ArrowLeft,
  Settings,
  Box,
  AlertTriangle,
  RefreshCw
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

const STORAGE_KEY = 'mairis_prime_blueprint_v5';

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
             className="transition-all duration-1000"
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

  // Check API Key status on mount
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
      // If not in aistudio environment, rely on environment variable
      setIsKeyRequired(!process.env.API_KEY);
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

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      addLog('System', 'Opening API Key selection portal...', 'info');
      try {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Mandatory instruction: Assume success to mitigate race condition
        setIsKeyRequired(false);
        addLog('System', 'Key linked. Resuming engine access.', 'success');
      } catch (err) {
        addLog('System', 'Key portal failed to initialize.', 'error');
      }
    } else {
      alert("Project Key Portal is only available in the cloud execution environment.");
    }
  };

  const resetProgress = useCallback(() => {
    if (window.confirm('PERMANENT ACTION: Purge all verified research history and engine readiness?')) {
      setKnowledge(INITIAL_KNOWLEDGE);
      localStorage.removeItem(STORAGE_KEY);
      setStage(ResearchStage.IDLE);
      setReport(null);
      setIsAutonomous(false);
      setIsLoading(false);
      addLog('System', 'CORE DATA PURGE: SYSTEM RESET TO GENESIS.', 'warning');
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
    addLog('Orchestrator', `Recursion Initiated: Mapping Delta for ${target.toUpperCase()}.`, 'info');

    try {
      setStage(ResearchStage.TOPIC_DISCOVERY);
      const discoveredTopics = await geminiService.discoverTopics(MOCK_PAPERS, knowledge, target);
      setTopics(discoveredTopics);
      addLog('Discovery Engine', `Found ${discoveredTopics.length} potential innovation gaps.`, 'success');

      setStage(ResearchStage.LITERATURE_SYNTHESIS);
      const synthesis = await geminiService.synthesizeLiterature(MOCK_PAPERS);
      addLog('Synthesis Agent', 'Cross-correlation of findings complete.', 'success');
      
      setStage(ResearchStage.VISUAL_ANALYSIS);
      const visuals = await geminiService.analyzeVisuals(MOCK_PAPERS);
      setVisualFindings(visuals);
      addLog('Vision Agent', 'Multimodal analysis of diagrams complete.', 'success');

      setStage(ResearchStage.HYPOTHESIS_GENERATION);
      const hyp = await geminiService.generateHypotheses(synthesis, visuals, knowledge);
      setHypotheses(hyp);
      addLog('Hypothesis Generator', `Formulated ${hyp.length} testable conjectures.`, 'success');
      const selectedHyp = hyp[0];

      setStage(ResearchStage.CODE_VERIFICATION);
      const codeResults = await geminiService.runCodeLab(selectedHyp);
      addLog('Code Lab', 'First-principles physics simulations complete.', 'success');

      setStage(ResearchStage.SCIENTIFIC_VERIFICATION);
      const verification = await geminiService.verifyHypothesis(selectedHyp, visuals, codeResults);
      addLog('Verification Suite', 'Peer-level audit and verdict reached.', 'success');

      setStage(ResearchStage.JOURNAL_PUBLICATION);
      const newReport = await geminiService.publishJournal(selectedHyp, verification, visuals);
      setReport(newReport);
      addLog('Journal Editor', 'Formal scientific report published.', 'success');

      setStage(ResearchStage.KNOWLEDGE_INTEGRATION);
      const nextKnowledge = await geminiService.updateKnowledgeState(knowledge, newReport);
      setKnowledge(nextKnowledge);
      addLog('Learning Engine', 'Master Rocket Blueprint updated.', 'success');
      
      setStage(ResearchStage.COMPLETED);
      addLog('Orchestrator', `Cycle Complete: Integration successful.`, 'success');
      
      if (isAutonomousRef.current) {
        setTimeout(runCycle, 5000);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("Requested entity was not found")) {
        addLog('System', 'API key invalid. Re-selection required.', 'error');
        setIsKeyRequired(true);
      } else {
        addLog('Orchestrator', `Fault Detected: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      }
      setIsAutonomous(false);
    } finally {
      setIsLoading(false);
      setStage(ResearchStage.IDLE);
    }
  };

  const downloadFullSystemState = useCallback(() => {
    const content = JSON.stringify(knowledge, null, 2);
    downloadFile(content, `mairis-prime-state-${Date.now()}.json`, 'application/json');
    addLog('System', 'Global state trace exported.', 'success');
  }, [knowledge, addLog]);

  if (isKeyChecking) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (isKeyRequired) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-12 rounded-[3rem] shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">System Lock</h2>
          <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
            MAIRIS PRIME requires a verified API Key from a paid project.
            Link your credentials to initialize the research core.
          </p>
          <button 
            onClick={handleOpenSelectKey}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-lg"
          >
            <Key className="w-4 h-4" />
            Connect Project Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <Sidebar currentStage={stage} logs={logs} />
      
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(30,58,138,0.05),transparent)]">
        <header className="h-24 border-b border-slate-900/50 flex items-center justify-between px-10 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-6">
             <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
                {(['research', 'design', 'archive'] as const).map(mode => (
                  <button 
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    {mode === 'research' ? 'Laboratory' : mode === 'design' ? 'Engine Core' : 'Archives'}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleOpenSelectKey}
              className="px-6 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all flex items-center gap-3"
            >
              <RefreshCw className="w-4 h-4" /> Change Key
            </button>

            <div className="w-[1px] h-6 bg-slate-800 mx-2" />

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAutonomous(!isAutonomous)}
                className={`p-3 rounded-xl border transition-all ${isAutonomous ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'}`}
              >
                {isAutonomous ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              
              <button 
                onClick={runCycle}
                disabled={isLoading}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 shadow-lg"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                {isLoading ? "Executing..." : "Manual Cycle"}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {viewMode === 'research' && (
            <div className="max-w-7xl mx-auto space-y-12">
              {report ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        {report.isBreakthrough && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full">
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Breakthrough Identified</span>
                          </div>
                        )}
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{report.journalName}</span>
                      </div>
                      <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.9] mb-4">{report.title}</h2>
                      <div className="flex items-center gap-4 text-slate-500 text-xs font-mono">
                         <span>{new Date(report.timestamp).toLocaleString()}</span>
                         <span className="w-1 h-1 bg-slate-800 rounded-full" />
                         <span className="text-emerald-400">Verified Proof</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-8">
                      <div className="bg-slate-900/30 border border-slate-800/50 p-10 rounded-[2.5rem]">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6 flex items-center gap-3">
                           <FileText className="w-4 h-4" /> Formal Proof
                        </h3>
                        <div className="text-slate-300 font-serif leading-relaxed text-lg whitespace-pre-wrap">
                           {report.formalProof}
                        </div>
                      </div>
                      <DataChart data={report.chartData} />
                    </div>

                    <div className="space-y-8">
                      <div className="bg-blue-600 p-8 rounded-[2.5rem]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6">Verification Suite</h3>
                        <div className="text-5xl font-black text-white mb-4">{((report.verificationSuite?.overallConfidence || 0) * 100).toFixed(1)}%</div>
                        <p className="text-blue-100 text-xs uppercase tracking-widest font-bold">Physics Audit Confidence</p>
                      </div>
                      
                      <div className="bg-slate-900/30 border border-slate-800/50 p-8 rounded-[2.5rem]">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Simulation Traces</h3>
                        <div className="space-y-4">
                          {report.verificationSuite?.codeLabResults?.map((c, i) => (
                            <div key={i} className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex justify-between items-center">
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-white uppercase">{c.filename}</span>
                                  <span className="text-[8px] text-slate-500 uppercase">{c.status}</span>
                               </div>
                               <button onClick={() => downloadFile(c.code, c.filename, 'text/plain')} className="text-blue-400 hover:text-blue-300">
                                  <Download className="w-4 h-4" />
                               </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
                  <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin" />
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter animate-pulse">Deep Synthesis Underway...</h2>
                </div>
              ) : (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                   <BrainCircuit className="w-24 h-24 text-slate-600" />
                   <div className="max-w-md">
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">System Idle</h2>
                      <p className="text-slate-500 text-sm leading-relaxed mb-8">Initiate discovery to begin engine optimization cycles.</p>
                      <button onClick={runCycle} className="px-10 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all">
                        Initialize Cycle
                      </button>
                   </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'design' && (
            <div className="max-w-7xl mx-auto space-y-12">
               <div className="flex items-end justify-between">
                  <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter uppercase mb-4">Master Blueprint</h2>
                    {/* FIXED: Explicitly cast Object.values to EngineSubsystem[] to fix arithmetic and 'unknown' property errors */}
                    <p className="text-slate-500 text-sm font-mono">Integration State: {((Object.values(knowledge.subsystems) as EngineSubsystem[]).reduce((a, b) => a + b.status, 0) / 5).toFixed(1)}%</p>
                  </div>
                  <button onClick={downloadFullSystemState} className="px-6 py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <HardDriveDownload className="w-4 h-4" /> Export Blueprint
                  </button>
               </div>

               <div className="grid grid-cols-5 gap-6">
                  {/* FIXED: Explicitly cast Object.entries to fix property errors on 'unknown' type 'sub' */}
                  {(Object.entries(knowledge.subsystems) as [string, EngineSubsystem][]).map(([key, sub]) => (
                    <div key={key} onClick={() => setInspectingSub(sub)} className="group bg-slate-950/50 border border-slate-900 p-8 rounded-[2rem] hover:border-blue-500/50 transition-all cursor-pointer">
                      <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{sub.name}</div>
                      <div className="text-2xl font-black text-white tracking-tighter mb-4">RDY {sub.status}%</div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500" style={{ width: `${sub.status}%` }} />
                      </div>
                    </div>
                  ))}
               </div>

               <div className="grid grid-cols-2 gap-10 mt-12">
                  <div className="bg-slate-900/30 border border-slate-800 p-10 rounded-[2.5rem]">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">Key Breakthroughs</h3>
                    <div className="space-y-6">
                      {knowledge.breakthroughs.map(b => (
                        <div key={b.id} className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800">
                           <h4 className="text-sm font-black text-white uppercase mb-2">{b.title}</h4>
                           <p className="text-xs text-slate-400 mb-4">{b.description}</p>
                           <div className="text-[10px] font-mono text-blue-400 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 italic">
                             {b.proofOfConcept}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/30 border border-slate-800 p-10 rounded-[2.5rem]">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-3">Engineering Manifesto</h3>
                    <div className="p-8 bg-blue-500/5 rounded-2xl border border-blue-500/10 text-sm text-slate-300 font-serif leading-relaxed italic">
                      "{knowledge.masterDesignDoc}"
                    </div>
                  </div>
               </div>
            </div>
          )}

          {viewMode === 'archive' && (
            <div className="max-w-7xl mx-auto">
               <div className="flex items-end justify-between mb-12">
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase">Research Library</h2>
                  <button onClick={resetProgress} className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4" /> Wipe Local Storage
                  </button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {knowledge.pastReports.map(r => (
                    <div key={r.id} onClick={() => { setReport(r); setViewMode('research'); }} className="p-6 bg-slate-950/50 border border-slate-900 rounded-[1.5rem] hover:border-blue-500/50 transition-all cursor-pointer flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                         <div className={`p-3 rounded-lg border ${r.isBreakthrough ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                            {r.isBreakthrough ? <Zap className="w-5 h-5 fill-current" /> : <FileText className="w-5 h-5" />}
                         </div>
                         <div>
                            <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{r.journalName}</div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-blue-200">{r.title}</h4>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[10px] font-black text-white">{((r.verificationSuite?.overallConfidence || 0) * 100).toFixed(0)}%</div>
                         <div className="text-[8px] text-slate-600 uppercase">Confidence</div>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {inspectingSub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-10">
           <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-[3rem] p-12 relative overflow-hidden">
              <button onClick={() => setInspectingSub(null)} className="absolute top-10 right-10 p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4 mb-8">
                 <Cpu className="w-10 h-10 text-blue-500" />
                 <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{inspectingSub.name}</h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <div className="text-5xl font-black text-white tracking-tighter mb-2">{inspectingSub.status}%</div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Functional Readiness</div>
                 </div>
                 <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl text-xs font-mono text-blue-100 leading-relaxed italic">
                    {inspectingSub.specifications}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
