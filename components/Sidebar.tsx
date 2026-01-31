
import React from 'react';
import { AGENT_CONFIGS } from '../constants';
import { ResearchStage } from '../types';
import { Rocket, CheckCircle2, Loader2, Circle, ChevronRight } from 'lucide-react';

interface SidebarProps {
  currentStage: ResearchStage;
  logs: any[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentStage, logs }) => {
  const stagesOrder = [
    { stage: ResearchStage.TOPIC_DISCOVERY, label: 'Discovery' },
    { stage: ResearchStage.LITERATURE_SYNTHESIS, label: 'Synthesis' },
    { stage: ResearchStage.VISUAL_ANALYSIS, label: 'Multimodal' },
    { stage: ResearchStage.HYPOTHESIS_GENERATION, label: 'Hypothesis' },
    { stage: ResearchStage.CODE_VERIFICATION, label: 'Code Lab' },
    { stage: ResearchStage.SCIENTIFIC_VERIFICATION, label: 'Verification' },
    { stage: ResearchStage.JOURNAL_PUBLICATION, label: 'Publication' },
    { stage: ResearchStage.KNOWLEDGE_INTEGRATION, label: 'Learning' },
  ];

  const getStageIcon = (stage: ResearchStage) => {
    const currentIndex = stagesOrder.findIndex(s => s.stage === currentStage);
    const targetIndex = stagesOrder.findIndex(s => s.stage === stage);

    if (currentIndex > targetIndex || currentStage === ResearchStage.COMPLETED) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (currentIndex === targetIndex) {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    }
    return <Circle className="w-4 h-4 text-slate-800" />;
  };

  return (
    <div className="w-72 bg-slate-950 border-r border-slate-900/50 flex flex-col h-full sticky top-0 z-40">
      <div className="p-8 border-b border-slate-900">
        <div className="flex items-center gap-3 text-blue-400 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">ASTRA AI</h1>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Research Engine v3.0</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8">
        <nav className="px-6 space-y-12">
          <div>
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
               Cycle Progress
            </h3>
            <div className="space-y-2">
              {stagesOrder.map((s) => (
                <div 
                  key={s.label} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    currentStage === s.stage ? 'bg-slate-900 border border-slate-800 shadow-xl scale-105' : 'opacity-40 grayscale'
                  }`}
                >
                  {getStageIcon(s.stage)}
                  <span className={`text-[11px] font-bold uppercase tracking-widest ${currentStage === s.stage ? 'text-white' : 'text-slate-500'}`}>
                    {s.label}
                  </span>
                  {currentStage === s.stage && <ChevronRight className="w-3 h-3 ml-auto text-blue-500 animate-pulse" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
               Active Agents
            </h3>
            <div className="space-y-4">
              {AGENT_CONFIGS.map((agent) => (
                <div key={agent.id} className="group px-4 py-3 flex items-center gap-4 bg-slate-900/20 border border-slate-900/40 rounded-2xl hover:border-slate-800 transition-all">
                  <div className="p-2 bg-slate-950 text-slate-600 group-hover:text-blue-400 rounded-lg transition-colors border border-slate-900">
                    {agent.icon}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-300 group-hover:text-white leading-none mb-1">{agent.name}</div>
                    <div className="text-[9px] text-slate-600 uppercase font-medium tracking-tight leading-none">{agent.role.substring(0, 24)}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="p-6 bg-slate-900/20 border-t border-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Telemetry</span>
          </div>
        </div>
        <div className="h-44 overflow-y-auto text-[10px] font-mono space-y-3 custom-scrollbar pr-2 scroll-smooth">
          {logs.slice(-15).reverse().map((log, i) => (
            <div key={i} className={`pb-2 border-b border-slate-900/50 group ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              <div className="flex justify-between items-center opacity-40 mb-1">
                <span className="font-bold text-[8px] uppercase tracking-widest">{log.agentName}</span>
                <span className="text-[8px]">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
              </div>
              <p className="leading-tight group-hover:text-white transition-colors">{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
