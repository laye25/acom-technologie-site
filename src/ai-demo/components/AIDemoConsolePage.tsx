// src/ai-demo/components/AIDemoConsolePage.tsx
// Main Acom IA Démo Console Hub

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AcomAIAssistantWidget } from './AcomAIAssistantWidget';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import { TutorialOverlay } from './TutorialOverlay';
import { ActionLogger } from '../AuditLog/ActionLogger';
import { EventBus } from '../BusinessEvents/EventBus';
import { TutorialEngine, PRESSING_GOLDEN_TUTORIAL, PRESSING_TARIFS_TUTORIAL, PRESSING_STOCK_SALES_TUTORIAL, PRESSING_CLOSURE_TUTORIAL, PRESSING_ACCOUNTING_TUTORIAL, PRESSING_FINANCIAL_REPORTS_TUTORIAL, PRESSING_SETTINGS_TUTORIAL, COMMERCE_POS_TUTORIAL } from '../Tutorial/TutorialEngine';
import { ScreenRecorder } from '../Tutorial/ScreenRecorder';
import { ContextEngine } from '../Intelligence/ContextEngine';
import { AcomActionLog, BusinessEvent } from '../types';
import { Sparkles, Video, Play, Shield, Terminal, RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowRight, BookOpen, Clock, Lock, Receipt, BarChart3, Settings, ShoppingBag } from 'lucide-react';

export const AIDemoConsolePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'tutorials' | 'logs' | 'capabilities'>('copilot');
  const [logs, setLogs] = useState<AcomActionLog[]>([]);
  const [events, setEvents] = useState<BusinessEvent[]>([]);
  const [selectedSaas, setSelectedSaas] = useState<'pressing' | 'stock'>('pressing');
  const [selectedTutorialId, setSelectedTutorialId] = useState<'reception' | 'tarifs' | 'stock' | 'closure' | 'accounting' | 'reports' | 'settings' | 'commerce_pos'>('reception');

  useEffect(() => {
    setLogs(ActionLogger.getLogs());
    setEvents(EventBus.getHistory());

    const unsubEvents = EventBus.subscribe('*', (evt) => {
      setEvents(EventBus.getHistory());
      setLogs(ActionLogger.getLogs());
    });

    return () => {
      unsubEvents();
    };
  }, []);

  const currentScenario = 
    selectedTutorialId === 'tarifs' 
      ? PRESSING_TARIFS_TUTORIAL 
      : selectedTutorialId === 'stock'
      ? PRESSING_STOCK_SALES_TUTORIAL
      : selectedTutorialId === 'closure'
      ? PRESSING_CLOSURE_TUTORIAL
      : selectedTutorialId === 'accounting'
      ? PRESSING_ACCOUNTING_TUTORIAL
      : selectedTutorialId === 'reports'
      ? PRESSING_FINANCIAL_REPORTS_TUTORIAL
      : selectedTutorialId === 'settings'
      ? PRESSING_SETTINGS_TUTORIAL
      : selectedTutorialId === 'commerce_pos'
      ? COMMERCE_POS_TUTORIAL
      : PRESSING_GOLDEN_TUTORIAL;

  const handleStartTutorial = () => {
    TutorialEngine.startTutorial(currentScenario);
  };

  const handleStartGoldenTutorial = () => {
    TutorialEngine.startTutorialSelection('pressing');
  };

  const handleStartScreenRecord = async () => {
    await ScreenRecorder.startRecording();
  };

  const capabilities = ContextEngine.getAvailableCapabilities();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Global Security Modal & Tutorial Overlay */}
      <ActionConfirmationModal />
      <TutorialOverlay />

      {/* Top Navigation / Brand Header */}
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Acom IA Démo</h1>
                <span className="text-xs font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/30">
                  Nouvelle Architecture
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Couche d'intelligence commune aux SaaS Acom — Gestion IA et Tutoriels Interactifs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartGoldenTutorial}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Lancer Tutoriel Pressing
            </button>
            <button
              onClick={handleStartScreenRecord}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2"
            >
              <Video className="w-4 h-4 text-rose-400" />
              Filmer l'Écran
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-800 gap-2">
          {[
            { id: 'copilot', label: '1. Assistant & Gestion IA', icon: Sparkles },
            { id: 'tutorials', label: '2. Tutoriels Interactifs', icon: BookOpen },
            { id: 'logs', label: '3. Logs d\'Audit & Événements', icon: Terminal },
            { id: 'capabilities', label: '4. Capabilités SaaS (Golden Ref)', icon: Layers }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs rounded-t-xl transition border-b-2 -mb-px ${
                  active
                    ? 'border-indigo-500 text-indigo-400 bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: COPILOT & SAAS MANAGEMENT */}
        {activeTab === 'copilot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <AcomAIAssistantWidget embedded={true} />
            </div>

            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">Principe d'Exécution Métier</h3>
                </div>
                <span className="text-xs text-slate-400">Déterminisme Strict</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-semibold text-indigo-400 block">⚡ Pas de Simulation Clic / DOM</span>
                  <p className="text-slate-400">
                    L'IA ne simule aucun déplacement de curseur ni aucun clic sauvage sur le DOM. Les commandes en langage naturel sont transformées en intentions NLU et exécutées via les fonctions métier réelles.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-semibold text-amber-400 block">🔒 Sécurité Niveaux de Risque</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-400">
                    <li><strong className="text-slate-200">READ</strong> : Consultation/Recherche immédiate sans confirmation.</li>
                    <li><strong className="text-slate-200">NORMAL</strong> : Création/Enregistrement standard avec confirmation du résultat.</li>
                    <li><strong className="text-slate-200">SENSIBLE</strong> : Clôture de caisse & actions critiques soumises à modal de confirmation préalable.</li>
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-semibold text-emerald-400 block">🗣️ Bilingue Français / Wolof</span>
                  <p className="text-slate-400">
                    Prise en charge de la voix et du texte en Français et Wolof avec narration TTS synthétisée.
                  </p>
                </div>
              </div>

              {/* Sample Executed Event Stream */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Derniers Événements Métier Émis (EventBus) :
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {events.length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-950 rounded-lg">
                      Aucun événement émis pour le moment.
                    </div>
                  ) : (
                    events.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between font-mono">
                        <span className="text-indigo-400 font-bold">{evt.type}</span>
                        <span className="text-slate-400">{evt.saas}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE TUTORIALS */}
        {activeTab === 'tutorials' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Tutoriels Interactifs Guidés</h3>
                <p className="text-xs text-slate-400">
                  Tutoriels d'apprentissage basés sur l'observation des événements métier réels
                </p>
              </div>
              <button
                onClick={handleStartTutorial}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-md"
              >
                <Play className="w-4 h-4" />
                Lancer ce Tutoriel
              </button>
            </div>

            {/* Scenario Picker Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedTutorialId('reception')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'reception'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1. Fiche de Réception ({PRESSING_GOLDEN_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('tarifs')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'tarifs'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>2. Paramétrage des Tarifs ({PRESSING_TARIFS_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('stock')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'stock'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Vente & Stock ({PRESSING_STOCK_SALES_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('closure')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'closure'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>4. Clôture de Caisse ({PRESSING_CLOSURE_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('accounting')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'accounting'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>5. Comptabilité & Dépense ({PRESSING_ACCOUNTING_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('reports')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'reports'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>6. Rapports Financiers ({PRESSING_FINANCIAL_REPORTS_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('settings')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'settings'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>7. Réglages & Système ({PRESSING_SETTINGS_TUTORIAL.steps.length} étapes)</span>
              </button>
              <button
                onClick={() => setSelectedTutorialId('commerce_pos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  selectedTutorialId === 'commerce_pos'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>8. Caisse POS Commerce ({COMMERCE_POS_TUTORIAL.steps.length} étapes)</span>
              </button>
            </div>

            {/* Selected Scenario Header Details */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{currentScenario.title}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full font-bold">
                    {currentScenario.saasModule}
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{currentScenario.description}</p>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Durée estimée : ~{Math.round(currentScenario.estimatedDurationSec / 60)} min</span>
              </div>
            </div>

            {/* Scenario Step Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentScenario.steps.map((step) => (
                <div key={step.stepNumber} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
                    <span>Étape {step.stepNumber}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{step.targetAcomId}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{step.title}</h4>
                  <p className="text-xs text-slate-400">{step.description}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                    <span className="font-mono text-indigo-300">Action : {step.actionToPerform}</span>
                    {step.expectedEvent ? (
                      <span className="font-mono text-emerald-400">Événement : {step.expectedEvent}</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 uppercase">{step.stepCategory || 'standard'}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Traces & Audit des Actions Acom IA</h3>
              <button
                onClick={() => {
                  ActionLogger.clearLogs();
                  setLogs([]);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium"
              >
                Effacer les logs
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-500 text-xs italic text-center py-8">
                  Aucun log enregistré pour le moment.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-400">{log.intentId}</span>
                      <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold ${
                        log.status === 'executed' ? 'bg-emerald-500/20 text-emerald-400' :
                        log.status === 'rejected' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-rose-500/20 text-rose-400'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-300 font-sans">{log.messageFr}</div>
                    <div className="text-slate-500 text-[10px] flex justify-between pt-1 border-t border-slate-900">
                      <span>Risk: {log.riskLevel} | User: {log.userRole}</span>
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CAPABILITIES */}
        {activeTab === 'capabilities' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Capabilités Métier Enregistrées (Golden Reference Pressing)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((cap) => (
                <div key={cap.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-indigo-400 font-bold">{cap.id}</span>
                    <span className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold uppercase ${
                      cap.riskLevel === 'read' ? 'bg-blue-500/20 text-blue-400' :
                      cap.riskLevel === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {cap.riskLevel}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{cap.name}</h4>
                  <p className="text-xs text-slate-400">{cap.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
