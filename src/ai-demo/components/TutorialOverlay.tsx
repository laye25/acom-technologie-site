// src/ai-demo/components/TutorialOverlay.tsx
// Floating Screen Recording & Tutorial Control Hub

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialEngine } from '../Tutorial/TutorialEngine';
import { ScreenRecorder } from '../Tutorial/ScreenRecorder';
import { TargetHighlighter } from '../Tutorial/TargetHighlighter';
import { ScreenRecordingStatus, TutorialStep } from '../types';
import { Video, StopCircle, Play, ChevronRight, ChevronLeft, Volume2, X, Download, HelpCircle, CheckCircle, Info, Sparkles } from 'lucide-react';

export const TutorialOverlay: React.FC = () => {
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [waitingForTab, setWaitingForTab] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<ScreenRecordingStatus>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubTutorial = TutorialEngine.subscribe(() => {
      setTutorialActive(TutorialEngine.isTutorialActive());
      setCurrentStep(TutorialEngine.getCurrentStep());
      setWaitingForTab(TutorialEngine.isWaitingForTabSelection());
      setWaitingMessage(TutorialEngine.getWaitingMessage());
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
                {currentStep.stepCategory === 'info' ? (
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
                ) : currentStep.isOptional ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Info className="w-3 h-3" /> FACULTATIF
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

            {/* Speech Text */}
            <div className="bg-indigo-900/40 border border-indigo-800/50 rounded-xl p-2.5 text-xs text-indigo-200 flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span className="italic">"{currentStep.speechFr}"</span>
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

                {currentStep.isOptional && (
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
    </>
  );
};
