// src/ai-demo/components/TutorialOverlay.tsx
// Floating Screen Recording & Tutorial Control Hub

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TutorialEngine } from '../Tutorial/TutorialEngine';
import { ScreenRecorder } from '../Tutorial/ScreenRecorder';
import { TargetHighlighter } from '../Tutorial/TargetHighlighter';
import { ScreenRecordingStatus, TutorialStep } from '../types';
import { Video, StopCircle, Play, ChevronRight, Volume2, X, Download } from 'lucide-react';

export const TutorialOverlay: React.FC = () => {
  const [tutorialActive, setTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<ScreenRecordingStatus>('idle');
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsubTutorial = TutorialEngine.subscribe(() => {
      setTutorialActive(TutorialEngine.isTutorialActive());
      setCurrentStep(TutorialEngine.getCurrentStep());
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

  const handleStartTutorial = () => {
    TutorialEngine.startTutorial();
  };

  const handleNextStep = () => {
    TutorialEngine.nextStep();
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

        {/* Active Tutorial Card */}
        {tutorialActive && currentStep && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-indigo-950/90 border border-indigo-500/40 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-xl w-80 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-indigo-800/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Tutoriel IA Interactif
                </span>
              </div>
              <button
                onClick={handleStopTutorial}
                className="text-indigo-400 hover:text-white p-1 rounded-lg hover:bg-indigo-900/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="text-xs font-semibold text-indigo-300 mb-0.5">
                Étape {currentStep.stepNumber} sur {TutorialEngine.getStepCount()}
              </div>
              <h4 className="font-bold text-sm text-white mb-1">{currentStep.title}</h4>
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Speech Text */}
            <div className="bg-indigo-900/40 border border-indigo-800/50 rounded-xl p-2.5 text-xs text-indigo-200 flex items-start gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span className="italic">"{currentStep.speechFr}"</span>
            </div>

            <div className="flex gap-2 pt-1">
              {recordingStatus === 'idle' && (
                <button
                  onClick={handleStartRecording}
                  className="flex-1 py-1.5 px-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
                >
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  Filmer Écran
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
          </motion.div>
        )}
      </div>
    </>
  );
};
