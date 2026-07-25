// src/ai-demo/inspector/MetadataPanel.tsx
import React from 'react';
import { ScenarioApplicationIntelligent } from '../types';
import { SaiValidator } from '../services/SaiValidator';
import { SaiRepository } from '../services/SaiRepository';
import { Download, FileCode, CheckCircle2, AlertTriangle, ShieldCheck, Tag, User, Building } from 'lucide-react';

interface MetadataPanelProps {
  scenario: ScenarioApplicationIntelligent;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({ scenario }) => {
  const validation = SaiValidator.validate(scenario);

  const handleDownloadSchemaJson = () => {
    const jsonStr = SaiRepository.exportSaiJsonSchema(scenario);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sai-scenario-${scenario.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Validation Status Card */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
          validation.isValid
            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          {validation.isValid ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-amber-400 shrink-0" />
          )}
          <div>
            <h4 className="font-bold text-sm">
              {validation.isValid ? 'Scénario Valide & Conforme SAI v1.0.0' : 'Avertissements de Conformité SAI'}
            </h4>
            <p className="text-xs opacity-90">
              {validation.metrics.totalEvents} Événements • {validation.metrics.totalSnapshots} Snapshots • {validation.metrics.totalSteps} Étapes
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadSchemaJson}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow transition-colors shrink-0"
        >
          <Download className="h-3.5 w-3.5" /> Télécharger JSON Schema
        </button>
      </div>

      {/* Metadata Fields Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4 text-xs">
        <h4 className="font-semibold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
          <FileCode className="h-4 w-4 text-blue-400" />
          Contrat Général de Métadonnées (SAI v1.0.0)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Titre du Scénario
            </span>
            <div className="font-semibold text-slate-200 bg-slate-950 p-2 rounded border border-slate-800">
              {scenario.metadata.title}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1">
              <Building className="h-3 w-3" /> Identifiant Marchand (Multi-Tenant)
            </span>
            <div className="font-mono text-emerald-400 font-semibold bg-slate-950 p-2 rounded border border-slate-800">
              {scenario.metadata.merchantId}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1">
              <User className="h-3 w-3" /> Auteur & Statut
            </span>
            <div className="font-semibold text-slate-200 bg-slate-950 p-2 rounded border border-slate-800 flex justify-between items-center">
              <span>{scenario.metadata.author}</span>
              <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                {scenario.metadata.status}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Niveau de Confidentialité
            </span>
            <div className="font-mono font-bold text-amber-400 bg-slate-950 p-2 rounded border border-slate-800">
              {scenario.metadata.privacyLevel}
            </div>
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <span className="text-slate-500">Description Métier :</span>
          <div className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed">
            {scenario.metadata.description}
          </div>
        </div>

        {/* Version History Table */}
        <div className="pt-2">
          <h5 className="font-semibold text-slate-300 mb-2">Historique des Versions ({scenario.history?.length || 1})</h5>
          <div className="bg-slate-950 rounded-lg border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
            {(scenario.history || []).map((h, i) => (
              <div key={i} className="p-2 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-400">v{h.version}</span>
                  <span className="text-slate-200">{h.changesDescription}</span>
                </div>
                <div className="text-slate-500 font-mono text-[10px]">
                  {new Date(h.timestamp).toLocaleDateString('fr-FR')} • {h.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
