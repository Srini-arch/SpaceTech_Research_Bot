
import React from 'react';
import { 
  Telescope, 
  Library, 
  Lightbulb, 
  PenTool, 
  ShieldCheck, 
  Activity, 
  LayoutDashboard,
  Binary,
  Cpu,
  Microscope,
  HardDrive
} from 'lucide-react';

export const AGENT_CONFIGS = [
  {
    id: 1,
    name: 'Topic Discovery Engine',
    role: 'Identifying research gaps and novel directions',
    icon: <Telescope className="w-5 h-5" />,
    temp: 0.5,
  },
  {
    id: 2,
    name: 'Scientific Synthesis Agent',
    role: 'Cross-correlating findings across 100+ papers',
    icon: <Library className="w-5 h-5" />,
    temp: 0.3,
  },
  {
    id: 3,
    name: 'Hypothesis Generator',
    role: 'Formulating testable aerospace conjectures',
    icon: <Lightbulb className="w-5 h-5" />,
    temp: 0.4,
  },
  {
    id: 4,
    name: 'Verification Suite (Physics)',
    role: 'First-principles validation of engine mechanics',
    icon: <Binary className="w-5 h-5" />,
    temp: 0.2,
  },
  {
    id: 5,
    name: 'Verification Suite (Materials)',
    role: 'Assessing thermal and structural feasibility',
    icon: <Microscope className="w-5 h-5" />,
    temp: 0.2,
  },
  {
    id: 6,
    name: 'Journal Editor',
    role: 'Formal scientific publication formatting',
    icon: <PenTool className="w-5 h-5" />,
    temp: 0.4,
  },
  {
    id: 7,
    name: 'Chronos Learning Engine',
    role: 'Integrating findings into the Master Rocket Blueprint',
    icon: <HardDrive className="w-5 h-5" />,
    temp: 0.3,
  }
];

export const MOCK_PAPERS = [
  {
    id: "arxiv:2305.1234",
    title: "Deep Reinforcement Learning for Autonomous Vertical Landing of Rocket Boosters",
    authors: ["John Smith", "Elena Vance"],
    summary: "This paper presents a novel approach to the vertical landing problem using DRL to optimize fuel consumption and landing accuracy under varying wind conditions.",
    published: "2023-05-12",
    url: "https://arxiv.org/abs/2305.1234"
  },
  {
    id: "arxiv:2309.5678",
    title: "Advanced Thermal Protection Systems for Interplanetary Re-entry Vehicles",
    authors: ["Marcus Aurelius", "Sarah Connor"],
    summary: "Investigation into ablative material performance at heat fluxes exceeding 15 MW/m2 using plasma wind tunnel testing.",
    published: "2023-09-22",
    url: "https://arxiv.org/abs/2309.5678"
  },
  {
    id: "arxiv:2401.9012",
    title: "Methane-Oxygen Liquid Rocket Engine Performance at High Sea-Level Altitudes",
    authors: ["Rocket Lab Team"],
    summary: "Experimental results from a 50kN Methalox engine showing pressure stability and thrust-to-weight optimization paths.",
    published: "2024-01-05",
    url: "https://arxiv.org/abs/2401.9012"
  }
];
