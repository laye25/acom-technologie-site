// src/ai-demo/inspector/PrivacyInspector.tsx
import React, { useState } from 'react';
import { ScenarioApplicationIntelligent, SaiPrivacyLevel } from '../types';
import { SaiRepository } from '../services/SaiRepository';
import { Shield, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface PrivacyInspectorProps {
  scenario: ScenarioApplicationIntelligent;
  onPrivacyLevelChanged: (updated: ScenarioApplicationIntelligent) => void;
}

export const PrivacyInspector: React.FC<PrivacyInspectorProps> = ({
  scenario,
  onPrivacyLevelChanged
}) => {
  const [activeLevel, setActiveLevel] = useState<SaiPrivacyLevel>(scenario.metadata.privacyLevel || 'INTERNAL');

  const handleLevelSelect = (level: SaiPrivacyLevel) => {
    setActiveLevel(level);
    const masked = SaiRepository.applyPrivacyMasking(scenario, level);
    onPrivacyLevelChanged(masked);
  };

  const confidentialEventsCount = scenario.events.filter((e) => e.privacyLevel === 'CONFIDENTIAL').length;

  return (
    <div className="space-y-4 text-xs">
      {/* Intro Header */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <Shield className="h-5 w-5" />
          Moteur d'Anonymisation & Confidentialité Multi-Tenant
        </div>
        <p className="text-slate-400 leading-relaxed">
          Le Scénario Applicatif Intelligent (SAI) protège automatiquement les données sensibles (numéros de téléphone, montants, noms de clients, identifiants) selon le niveau d'exposition désiré.
        </p>
      </div>

      {/* Privacy Level Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => handleLevelSelect('CONFIDENTIAL')}
          className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
            activeLevel === 'CONFIDENTIAL'
              ? 'bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500/50'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> CONFIDENTIAL
            </span>
            {activeLevel === 'CONFIDENTIAL' && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            Accès interne complet non masqué pour audit et support technique.
          </p>
        </button>

        <button
          onClick={() => handleLevelSelect('INTERNAL')}
          className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
            activeLevel === 'INTERNAL'
              ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500/50'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> INTERNAL
            </span>
            {activeLevel === 'INTERNAL' && <CheckCircle2 className="h-4 w-4 text-blue-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            Masquage partiel des valeurs sensibles pour les équipes internes.
          </p>
        </button>

        <button
          onClick={() => handleLevelSelect('PUBLIC')}
          className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
            activeLevel === 'PUBLIC'
              ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <EyeOff className="h-3.5 w-3.5" /> PUBLIC
            </span>
            {activeLevel === 'PUBLIC' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          </div>
          <p className="text-[11px] text-slate-400">
            Anonymisation totale des valeurs et snapshots pour diffusion publique/Tuto.
          </p>
        </button>
      </div>

      {/* Current Privacy Summary */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
        <h5 className="font-semibold text-slate-300">Rapport de Protection du Scénario</h5>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-400">
          <div>
            Événements Sensibles: <span className="font-mono text-amber-400 font-bold">{confidentialEventsCount}</span>
          </div>
          <div>
            Masques Appliqués: <span className="font-mono text-emerald-400 font-bold">{activeLevel === 'PUBLIC' ? '100%' : 'Standard'}</span>
          </div>
          <div>
            Isolation Marchand: <span className="font-mono text-blue-400 font-bold">{scenario.metadata.merchantId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
