// src/ai-demo/components/TutorialOverlay.tsx
// Floating Screen Recording & Tutorial Control Hub

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialEngine } from '../Tutorial/TutorialEngine';
import { ScreenRecorder } from '../Tutorial/ScreenRecorder';
import { TargetHighlighter } from '../Tutorial/TargetHighlighter';
import { ScreenRecordingStatus, TutorialStep } from '../types';
import { Video, StopCircle, Play, Pause, ChevronRight, ChevronLeft, Volume2, VolumeX, X, Download, HelpCircle, CheckCircle, Info, Sparkles, AlertTriangle, ListFilter, MousePointer, Search, RotateCcw } from 'lucide-react';

export const TutorialOverlay: React.FC = () => {
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [waitingForTab, setWaitingForTab] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<ScreenRecordingStatus>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectMode, setInspectMode] = useState(false);

  useEffect(() => {
    const unsubTutorial = TutorialEngine.subscribe(() => {
      setTutorialActive(TutorialEngine.isTutorialActive());
      setCurrentStep(TutorialEngine.getCurrentStep());
      setWaitingForTab(TutorialEngine.isWaitingForTabSelection());
      setWaitingMessage(TutorialEngine.getWaitingMessage());
      setIsChooserOpen(TutorialEngine.isFunctionChooserOpen());
    });

    const unsubRecorder = ScreenRecorder.subscribeStatus((status) => {
      setRecordingStatus(status);
      setRecordedUrl(ScreenRecorder.getRecordedBlobUrl());
    });

    return () => {
      unsubTutorial();
      unsubRecorder();
    };
  }, []);

  // Handle direct click inspection on DOM elements with data-acom-id
  useEffect(() => {
    if (!inspectMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const acomElement = target.closest('[data-acom-id]');
      if (acomElement) {
        const acomId = acomElement.getAttribute('data-acom-id');
        if (acomId) {
          e.preventDefault();
          e.stopPropagation();
          TutorialEngine.jumpToAcomId(acomId);
          setInspectMode(false);
        }
      }
    };

    window.addEventListener('click', handleClick, true);
    return () => window.removeEventListener('click', handleClick, true);
  }, [inspectMode]);

  const scenario = TutorialEngine.getCurrentScenario();
  const allSteps = scenario ? scenario.steps : [];

  const filteredSteps = allSteps.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.targetAcomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartRecording = async () => {
    await ScreenRecorder.startRecording();
  };

  const handleStopRecording = () => {
    const url = ScreenRecorder.stopRecording();
    if (url) {
      setRecordedUrl(url);
    }
  };

  const handleNextStep = () => {
    TutorialEngine.nextStep();
  };

  const handlePrevStep = () => {
    TutorialEngine.prevStep();
  };

  const handleSkipStep = () => {
    TutorialEngine.skipStep();
  };

  const handleStopTutorial = () => {
    TutorialEngine.stopTutorial();
  };

  return (
    <>
      {/* Target Spotlight Highlighter */}
      {tutorialActive && currentStep && (
        <TargetHighlighter
          targetAcomId={currentStep.targetAcomId}
        />
      )}

      {/* Floating Toolbar in top-right corner */}
      <div className="fixed top-20 right-6 z-[9990] flex flex-col gap-2 items-end">
        {/* Screen Recorder Badge */}
        {recordingStatus === 'recording' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse"
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            ENREGISTREMENT ÉCRAN EN COURS
            <button
              onClick={handleStopRecording}
              className="ml-2 hover:bg-red-700 p-1 rounded-full text-white"
              title="Arrêter"
            >
              <StopCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Download Link if recording is ready */}
        {recordedUrl && (
          <motion.a
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            href={recordedUrl}
            download={`Acom_Tutoriel_IA_${Date.now()}.webm`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger la Vidéo Réelle
          </motion.a>
        )}

        {/* Permission Denied Notice */}
        {recordingStatus === 'permission_denied' && (
          <div className="bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs p-2.5 rounded-xl max-w-xs shadow-xl backdrop-blur-md">
            ⚠️ Autorisation d'enregistrement d'écran refusée par le navigateur.
          </div>
        )}

        {/* Waiting For Tab Selection Card */}
        {waitingForTab && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-indigo-950/95 border-2 border-indigo-500/80 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-84 space-y-3 font-sans"
          >
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Sélection d'Onglet
                </span>
              </div>
              <button
                onClick={() => TutorialEngine.cancelTabSelection()}
                className="text-indigo-400 hover:text-white p-1 rounded-lg hover:bg-indigo-900/50 transition"
                title="Annuler"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-2.5 bg-indigo-900/40 p-3 rounded-xl border border-indigo-700/50">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
              <p className="text-xs text-indigo-100 font-medium leading-relaxed">
                {waitingMessage || "Sélectionnez l'onglet de la page sur laquelle vous souhaitez lancer le tutoriel."}
              </p>
            </div>

            <div className="text-[10px] text-indigo-300/80 italic text-center">
              Cliquez sur un onglet du SaaS pour lancer son tutoriel
            </div>
          </motion.div>
        )}

        {/* Active Tutorial Card */}
        {tutorialActive && currentStep && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-indigo-950/95 border border-indigo-500/40 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-84 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Tutoriel IA Interactif
                </span>
              </div>
              <button
                onClick={handleStopTutorial}
                className="text-indigo-400 hover:text-white p-1 rounded-lg hover:bg-indigo-900/50"
                title="Fermer le tutoriel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-semibold text-indigo-300">
                  Étape {currentStep.stepNumber} sur {TutorialEngine.getStepCount()}
                </span>
                
                {/* Step Category Badges */}
                {currentStep.stepCategory === 'warning' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> ATTENTION
                  </span>
                ) : currentStep.stepCategory === 'info' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Info className="w-3 h-3" /> INFORMATION
                  </span>
                ) : currentStep.stepCategory === 'option' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> CHOIX DE FORMAT
                  </span>
                ) : currentStep.stepCategory === 'fallback' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                    <Info className="w-3 h-3" /> SECOURS
                  </span>
                ) : currentStep.stepCategory === 'next_cycle' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> NOUVEAU CYCLE
                  </span>
                ) : currentStep.stepCategory === 'conditional' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Info className="w-3 h-3" /> CONDITIONNEL
                  </span>
                ) : currentStep.stepCategory === 'control' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> CONTRÔLE
                  </span>
                ) : currentStep.stepCategory === 'final' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> ENREGISTREMENT
                  </span>
                ) : currentStep.isOptional || currentStep.stepCategory === 'optional' ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Info className="w-3 h-3" /> OPTIONNEL
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> REQUIS
                  </span>
                )}
              </div>

              <h4 className="font-bold text-sm text-white mb-1 leading-snug">{currentStep.title}</h4>
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Speech Text & Vocal Controls */}
            <div className="bg-indigo-900/40 border border-indigo-800/50 rounded-xl p-2.5 text-xs text-indigo-200 space-y-2">
              <div className="flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                <span className="italic">"{currentStep.speechFr}"</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-indigo-800/40 text-[11px] font-bold">
                <button
                  onClick={() => TutorialEngine.pauseNarration()}
                  className="px-2.5 py-1 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 rounded-lg flex items-center gap-1 transition"
                  title="Mettre la voix en pause"
                >
                  <Pause className="w-3 h-3 text-amber-300" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => TutorialEngine.resumeNarration()}
                  className="px-2.5 py-1 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 rounded-lg flex items-center gap-1 transition"
                  title="Reprendre la lecture vocale"
                >
                  <Play className="w-3 h-3 text-emerald-300" />
                  <span>Reprendre</span>
                </button>
                <button
                  onClick={() => TutorialEngine.stopNarration()}
                  className="px-2.5 py-1 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 rounded-lg flex items-center gap-1 transition"
                  title="Arrêter la voix"
                >
                  <VolumeX className="w-3 h-3 text-rose-300" />
                  <span>Stop</span>
                </button>
                <button
                  onClick={() => TutorialEngine.repeatCurrentStep()}
                  className="px-2.5 py-1 bg-indigo-800/80 hover:bg-indigo-700 text-indigo-100 rounded-lg flex items-center gap-1 transition"
                  title="Répéter l'explication vocale"
                >
                  <RotateCcw className="w-3 h-3 text-cyan-300" />
                  <span>Répéter</span>
                </button>
              </div>
            </div>

            {/* Quick Actions: Choisir une fonction & Pointeur */}
            <div className="flex items-center gap-2 pt-2 border-t border-indigo-800/60">
              <button
                onClick={() => TutorialEngine.openFunctionChooser()}
                className="flex-1 py-1.5 px-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ListFilter className="w-3.5 h-3.5 text-indigo-400" />
                Choisir une fonction
              </button>
              <button
                onClick={() => setInspectMode(true)}
                className="py-1.5 px-2.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-700/60 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                title="Cliquer directement sur un bouton de la page pour le comprendre"
              >
                <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
                Pointeur
              </button>
              <button
                onClick={() => {
                  if (scenario?.id === 'commerce_billing_quote_modal_tutorial') {
                    TutorialEngine.startBillingQuoteModalTutorial(0);
                  } else if (scenario?.id === 'commerce_billing_print_modal_tutorial') {
                    TutorialEngine.startBillingPrintModalTutorial(0);
                  } else if (scenario?.id === 'commerce_billing_invoices_tutorial') {
                    TutorialEngine.startBillingTutorial('invoices', 0);
                  } else if (scenario?.id === 'commerce_billing_pending_tutorial') {
                    TutorialEngine.startBillingTutorial('pending', 0);
                  } else if (scenario?.id === 'commerce_billing_quotes_tutorial') {
                    TutorialEngine.startBillingTutorial('quotes', 0);
                  } else if (scenario?.id === 'commerce_reorder_po_tutorial') {
                    TutorialEngine.startReorderTutorial(0);
                  } else if (scenario?.id === 'commerce_inventory_sheet_tutorial') {
                    TutorialEngine.startInventorySheetTutorial(0);
                  } else if (scenario?.id === 'commerce_stock_adjustment_tutorial') {
                    TutorialEngine.startStockAdjustmentTutorial(0);
                  } else if (scenario?.id === 'commerce_suppliers_tutorial') {
                    TutorialEngine.startSuppliersTutorial(0);
                  } else if (scenario?.id === 'commerce_new_supplier_modal_tutorial') {
                    TutorialEngine.startNewSupplierModalTutorial(0);
                  } else {
                    TutorialEngine.startStockTutorial(0);
                  }
                }}
                className="p-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 rounded-xl transition"
                title="Redémarrer la présentation complète"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex gap-2">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep.stepNumber === 1}
                  className="py-1.5 px-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Précédent
                </button>

                {(currentStep.isOptional || currentStep.stepCategory === 'optional') && (
                  <button
                    onClick={handleSkipStep}
                    className="py-1.5 px-2 bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 border border-amber-700/50 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    Passer
                  </button>
                )}

                <button
                  onClick={handleNextStep}
                  className="flex-1 py-1.5 px-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
                >
                  Étape Suivante
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recordingStatus === 'idle' && (
                <button
                  onClick={handleStartRecording}
                  className="w-full py-1.5 px-2 bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/30 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  Filmer l'Écran (Optionnel)
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Inspect Mode Pointer Banner */}
      {inspectMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-pulse">
          <MousePointer className="w-5 h-5 text-cyan-300 animate-spin" />
          <span className="text-xs font-bold">Cliquez sur n'importe quel bouton ou zone de la page pour obtenir son explication</span>
          <button onClick={() => setInspectMode(false)} className="ml-4 p-1 hover:bg-indigo-700 rounded-lg text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Function Chooser Modal */}
      {isChooserOpen && (
        <div className="fixed inset-0 z-[9995] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ListFilter className="w-5 h-5 text-indigo-400" />
                  <span>Choisir une fonction — {scenario?.title || 'Gestion de Stock'}</span>
                </h3>
                <p className="text-xs text-slate-400">Cliquez sur n'importe quelle fonction pour être guidé directement dessus</p>
              </div>
              <button onClick={() => TutorialEngine.closeFunctionChooser()} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Rechercher une fonction (ex: Nouveau, Ajustement, Marge, CUMP, Journal)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Step List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredSteps.map((s) => (
                <button
                  key={s.stepNumber}
                  onClick={() => {
                    TutorialEngine.jumpToStepIndex(s.stepNumber - 1);
                  }}
                  className={`w-full text-left p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    currentStep?.stepNumber === s.stepNumber
                      ? 'bg-indigo-900/50 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Étape {s.stepNumber}
                      </span>
                      <span className="text-xs font-bold text-white">{s.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{s.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-2" />
                </button>
              ))}
              {filteredSteps.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs font-medium">
                  Aucune fonction ne correspond à votre recherche.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
