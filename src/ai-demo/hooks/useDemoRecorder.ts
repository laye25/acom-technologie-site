// src/ai-demo/hooks/useDemoRecorder.ts
// React hook providing global recorder state, event capture, screen capture, and auto project generation

import { useState, useEffect, useCallback, useRef } from 'react';
import { DemoEventRecorder } from '../recorders/DemoEventRecorder';
import { ScreenRecorder } from '../recorders/ScreenRecorder';
import { UIAnalyzer } from '../engines/UIAnalyzer';
import { AiEngine } from '../engines/AiEngine';
import { DemoManager } from '../services/DemoManager';
import { SaiEventBus } from '../services/SaiEventBus';
import { RecordedEvent, DemoProject, DemoLanguage } from '../types';
import toast from 'react-hot-toast';

const eventRecorder = new DemoEventRecorder();
const screenRecorder = new ScreenRecorder();

export function useDemoRecorder() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isScreenCapture, setIsScreenCapture] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('Acom SaaS');
  const [activePage, setActivePage] = useState<string>('Accueil');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      setEventsCount(eventRecorder.getEvents().length);
      const unsub = SaiEventBus.subscribe('sai:event_captured', () => {
        setEventsCount(eventRecorder.getEvents().length);
      });

      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        setEventsCount(eventRecorder.getEvents().length);
      }, 1000);

      return () => {
        unsub();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
      setEventsCount(0);
    }
  }, [isRecording]);

  const startDemoRecording = useCallback(async (
    moduleName: string,
    pageName: string,
    enableScreenCapture: boolean = false
  ) => {
    setActiveModule(moduleName);
    setActivePage(pageName);
    eventRecorder.startRecording(moduleName, pageName);
    setIsRecording(true);

    if (enableScreenCapture) {
      const screenOk = await screenRecorder.startCapture('1080p', 30);
      setIsScreenCapture(screenOk);
      if (screenOk) {
        toast.success('Capture vidéo de l\'écran activée !');
      }
    } else {
      setIsScreenCapture(false);
    }

    toast.success(`Enregistrement ACOM AI Demo démarré : ${moduleName} - ${pageName}`);
  }, []);

  const stopDemoRecording = useCallback(async (language: DemoLanguage = 'fr'): Promise<DemoProject | null> => {
    if (!isRecording) return null;

    const toastId = toast.loading('Analyse de l\'interface et génération de la démonstration IA...');

    const events = eventRecorder.stopRecording();
    let videoBlobUrl: string | undefined = undefined;

    if (isScreenCapture) {
      const blob = await screenRecorder.stopCapture();
      if (blob) {
        videoBlobUrl = URL.createObjectURL(blob);
      }
    }

    setIsRecording(false);
    setIsScreenCapture(false);

    // Analyze current UI structure
    const uiAnalysis = UIAnalyzer.analyzeCurrentUI(activeModule, activePage);

    // Call AI Engine for synthesis
    const aiContent = await AiEngine.synthesizeDemoContent(
      activeModule,
      activePage,
      events,
      uiAnalysis,
      language
    );

    // Create & Save project
    const newProject = DemoManager.createNewProject(
      activeModule,
      activePage,
      aiContent.title,
      aiContent.description
    );

    newProject.events = events;
    newProject.uiAnalysis = uiAnalysis;
    newProject.timelineSteps = aiContent.timelineSteps;
    newProject.documentation = aiContent.documentation;
    if (videoBlobUrl) {
      newProject.videoBlobUrl = videoBlobUrl;
    }

    DemoManager.saveProject(newProject);

    toast.dismiss(toastId);
    toast.success('Démonstration IA générée avec succès !');

    return newProject;
  }, [isRecording, isScreenCapture, activeModule, activePage]);

  const recordManualAction = useCallback((action: any, label: string) => {
    if (isRecording) {
      eventRecorder.recordCustomEvent(action, label);
      toast('Étape enregistrée : ' + label, { icon: '📍' });
    }
  }, [isRecording]);

  return {
    isRecording,
    isScreenCapture,
    activeModule,
    activePage,
    elapsedSeconds,
    eventsCount,
    startDemoRecording,
    stopDemoRecording,
    recordManualAction
  };
}
