import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Fingerprint, Database, GitBranch, Terminal, X, Activity } from 'lucide-react';
import { ScientificSnapshotService, ScientificPassport } from '../services/ScientificSnapshotService';

interface Props {
  passportId: string;
  onClose: () => void;
}

export const ScientificPassportViewer: React.FC<Props> = ({ passportId, onClose }) => {
  const [passport, setPassport] = useState<ScientificPassport | null>(null);

  useEffect(() => {
    // Fallback Mock
    setPassport({
      id: passportId,
      revisionId: "REV-12345",
      lifecycle: 'Active',
      certifications: ['Topological Validation', 'Physics Validation'],
      goldenDatasetRef: 'GOLDEN-V1',
      gfi: 98.4,
      tpi: 100,
      machine: 'Tajima TMBR',
      fabric: 'Cotton Heavy',
      knowledgeGraphNodes: ['LAW-084', 'OBS-00544'],
      learningHistory: [],
      nightResearchHistory: [],
      geometryAudits: ['AUD-999'],
      publications: ['PUB-102'],
      validationId: 'VAL-001',
      confidence: 0.99,
      reviewer: 'Auto',
      hash: 'a8b9c0d1',
      topology: { layerCount: 4 },
      metrics: {},
      physicalProperties: {},
      compilationVersion: 'ATCP 1.0.0',
      createdAt: new Date().toISOString(),
      certifiedAt: new Date().toISOString()
    });
  }, [passportId]);

  if (!passport) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-8 h-8 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Passeport Scientifique</h2>
              <p className="text-sm text-slate-400">ID: {passport.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          
          {/* Identity & Lifecycle */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4" /> Identité & Cycle de Vie
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Revision ID</span>
                <span className="text-white text-sm font-mono">{passport.revisionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Cycle de Vie</span>
                <span className="text-emerald-400 text-sm font-medium">{passport.lifecycle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Empreinte (Hash)</span>
                <span className="text-white text-sm font-mono">{passport.hash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Généré le</span>
                <span className="text-white text-sm">{new Date(passport.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Metrics & Physics */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> Métriques Textiles
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Geometric Fidelity (GFI)</span>
                <span className="text-emerald-400 font-bold">{passport.gfi}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Topological Preservation (TPI)</span>
                <span className="text-emerald-400 font-bold">{passport.tpi}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Cible Machine</span>
                <span className="text-white text-sm">{passport.machine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Support Textile (Fabric)</span>
                <span className="text-white text-sm">{passport.fabric}</span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Certifications & Audits
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Golden Dataset Ref</span>
                <span className="text-white text-sm font-mono">{passport.goldenDatasetRef || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                {passport.certifications.map(cert => (
                  <div key={cert} className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 p-2 rounded">
                    <CheckCircle2 className="w-4 h-4" /> {cert}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scientific Lineage */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> Lignage Scientifique
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Noeuds Sémantiques (Knowledge)</span>
                <span className="text-white text-sm font-mono">{passport.knowledgeGraphNodes.join(', ') || 'Aucun'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Audits Géométriques</span>
                <span className="text-white text-sm font-mono">{passport.geometryAudits.join(', ') || 'Aucun'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Publications (ASR)</span>
                <span className="text-white text-sm font-mono">{passport.publications.join(', ') || 'Aucun'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
