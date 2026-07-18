import React, { useState } from 'react';
import { GitBranch, Share2, Info, Check, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'component' | 'stitch' | 'thread' | 'material' | 'machine' | 'param';
  x: number;
  y: number;
  description: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export const AeosKnowledgeGraph: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('n1');

  const nodes: GraphNode[] = [
    { id: 'n1', label: 'Rose', type: 'concept', x: 200, y: 40, description: 'Le concept de design principal à broder. Regroupe des feuilles, tiges, boutons et pétales.' },
    { id: 'n2', label: 'Pétale Radial', type: 'component', x: 90, y: 120, description: 'Élément géométrique à motif radial. Nécessite une orientation de points radiale de type satin.' },
    { id: 'n3', label: 'Feuille Satin', type: 'component', x: 310, y: 120, description: 'Composant foliaire avec des nervures centrales et des contours satinés.' },
    { id: 'n4', label: 'Satin', type: 'stitch', x: 90, y: 200, description: 'Point de broderie idéal pour les éléments étroits (2 à 8mm). Offre une couverture lisse et brillante.' },
    { id: 'n5', label: 'Tatami', type: 'stitch', x: 200, y: 200, description: 'Point de remplissage tissé pour les grandes surfaces. Évite le relâchement du fil sur de grandes largeurs.' },
    { id: 'n6', label: 'Madeira Poly', type: 'thread', x: 130, y: 280, description: 'Fil Madeira Polyneon 100% polyester. Résistant, supporte les vitesses élevées et le chlore.' },
    { id: 'n7', label: 'Coton Basin', type: 'material', x: 270, y: 280, description: 'Tissu de support de type coton damassé rigide (Basin). Absorbe bien les points denses.' },
    { id: 'n8', label: 'Tajima TMEZ', type: 'machine', x: 200, y: 350, description: 'Machine de broderie industrielle haut de gamme avec régulateur automatique de tension de fil.' },
  ];

  const links: GraphLink[] = [
    { source: 'n1', target: 'n2' },
    { source: 'n1', target: 'n3' },
    { source: 'n2', target: 'n4' },
    { source: 'n3', target: 'n5' },
    { source: 'n4', target: 'n6' },
    { source: 'n5', target: 'n6' },
    { source: 'n6', target: 'n8' },
    { source: 'n7', target: 'n8' },
  ];

  const activeNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'concept': return 'fill-rose-500 stroke-rose-400';
      case 'component': return 'fill-amber-500 stroke-amber-400';
      case 'stitch': return 'fill-violet-500 stroke-violet-400';
      case 'thread': return 'fill-sky-500 stroke-sky-400';
      case 'material': return 'fill-emerald-500 stroke-emerald-400';
      case 'machine': return 'fill-fuchsia-500 stroke-fuchsia-400';
      default: return 'fill-slate-500 stroke-slate-400';
    }
  };

  const getLinkColorClass = (sourceType: string) => {
    switch (sourceType) {
      case 'concept': return 'stroke-rose-500/50';
      case 'component': return 'stroke-amber-500/50';
      case 'stitch': return 'stroke-violet-500/50';
      case 'thread': return 'stroke-sky-500/50';
      default: return 'stroke-slate-700';
    }
  };

  return (
    <div id="aeos-knowledge-graph-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-rose-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Knowledge Graph (Graphe de Connaissance de Broderie)</h4>
            <p className="text-[10px] text-gray-400">Cartographie sémantique des concepts, fibres et machines de broderie</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full font-mono font-bold">
          CONNAISSANCES AEOS
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Interactive SVG Graph */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-850 p-2 relative overflow-hidden">
          <div className="absolute top-2 left-2 z-10 text-[9px] text-gray-500 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
            Écran Interactif SVG
          </div>
          
          <svg className="w-full h-[280px]" viewBox="0 0 400 400">
            {/* Draw Links */}
            {links.map((link, idx) => {
              const sourceNode = nodes.find(n => n.id === link.source)!;
              const targetNode = nodes.find(n => n.id === link.target)!;
              return (
                <line 
                  key={idx}
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  className={`stroke-2 dash-animation ${getLinkColorClass(sourceNode.type)}`}
                  style={{ strokeDasharray: '4 4' }}
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map(node => (
              <g 
                key={node.id} 
                onClick={() => setSelectedNodeId(node.id)}
                className="cursor-pointer group"
              >
                <circle 
                  cx={node.x}
                  cy={node.y}
                  r={selectedNodeId === node.id ? 15 : 11}
                  className={`${getNodeColor(node.type)} stroke-2 transition-all duration-300 group-hover:scale-110 shadow-lg`}
                />
                {selectedNodeId === node.id && (
                  <circle 
                    cx={node.x}
                    cy={node.y}
                    r={22}
                    className="fill-none stroke-violet-500/40 stroke-1 animate-ping"
                  />
                )}
                <text 
                  x={node.x}
                  y={node.y + 24}
                  textAnchor="middle"
                  className="fill-gray-300 font-sans text-[10px] font-bold select-none group-hover:fill-white"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>

          {/* SVG Key/Legend overlay */}
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 text-[8px] bg-slate-900/90 p-2 rounded border border-slate-800">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />Concept</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />Composant</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />Point</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />Fil</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />Tissu</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full" />Machine</span>
          </div>
        </div>

        {/* Right Column: Node details and semantic insights */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${getNodeColor(activeNode.type)}`} />
              <div>
                <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider block">{activeNode.type}</span>
                <h5 className="text-sm font-bold text-white">{activeNode.label}</h5>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              {activeNode.description}
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-3 mt-4 space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Liens sémantiques connectés</span>
            <div className="space-y-1">
              {links.filter(l => l.source === activeNode.id || l.target === activeNode.id).map((link, i) => {
                const otherNode = nodes.find(n => n.id === (link.source === activeNode.id ? link.target : link.source))!;
                return (
                  <div key={i} className="flex items-center justify-between text-[10px] bg-slate-900/40 p-1.5 rounded border border-slate-850">
                    <span className="text-gray-400 font-semibold">{link.source === activeNode.id ? 'Se connecte à :' : 'Est référencé par :'}</span>
                    <span className="text-violet-400 font-bold font-mono">{otherNode.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
