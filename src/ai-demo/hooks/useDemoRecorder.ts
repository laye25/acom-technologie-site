import { useState, useEffect, useCallback, useRef } from 'react';
import { DemoEventRecorder } from '../recorders/DemoEventRecorder';
import { ScreenRecorder } from '../recorders/ScreenRecorder';
import { UIAnalyzer } from '../engines/UIAnalyzer';
import { AiEngine } from '../engines/AiEngine';
import { DemoManager } from '../services/DemoManager';
import { VideoStorageService } from '../services/VideoStorageService';
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
  
  const isRecordingRef = useRef(false);
  const isScreenCaptureRef = useRef(false);
  const activeModuleRef = useRef('Acom SaaS');
  const activePageRef = useRef('Accueil');

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
    enableScreenCapture: boolean = true,
    isSilent: boolean = false
  ) => {
    setActiveModule(moduleName);
    activeModuleRef.current = moduleName;
    setActivePage(pageName);
    activePageRef.current = pageName;
    
    eventRecorder.startRecording(moduleName, pageName);
    setIsRecording(true);
    isRecordingRef.current = true;

    if (enableScreenCapture) {
      const screenOk = await screenRecorder.startCapture('1080p', 30);
      setIsScreenCapture(screenOk);
      isScreenCaptureRef.current = screenOk;
      if (!isSilent) {
        if (screenOk) {
          toast.success('Capture vidéo HD de l\'écran activée (ScreenRec) !');
        } else {
          toast('Capture vidéo d\'écran non activée. Seules les étapes texte seront enregistrées.', { icon: 'ℹ️' });
        }
      }
    } else {
      setIsScreenCapture(false);
      isScreenCaptureRef.current = false;
    }

    if (!isSilent) {
      toast.success(`Enregistrement ACOM AI Demo démarré : ${moduleName} - ${pageName}`);
    }
  }, []);

  const stopDemoRecording = useCallback(async (language: DemoLanguage = 'fr', existingProject?: DemoProject): Promise<DemoProject | null> => {
    if (!isRecordingRef.current) return null;

    let videoBlobUrl: string | undefined = undefined;
    let capturedBlob: Blob | null = null;
    if (isScreenCaptureRef.current) {
      capturedBlob = await screenRecorder.stopCapture();
      if (capturedBlob && capturedBlob.size > 0) {
        videoBlobUrl = URL.createObjectURL(capturedBlob);
      }
    }

    const toastId = toast.loading('Analyse de l\'interface et finalisation du tutoriel vidéo...');

    const events = eventRecorder.stopRecording();


    setIsRecording(false);
    isRecordingRef.current = false;
    setIsScreenCapture(false);
    isScreenCaptureRef.current = false;

    let targetProject: DemoProject;

    if (existingProject) {
      // Just update existing project with new video and events
      targetProject = { ...existingProject };
      if (videoBlobUrl && capturedBlob) {
        targetProject.videoBlobUrl = videoBlobUrl;
        await VideoStorageService.saveVideoBlob(targetProject.id, capturedBlob);
      }
    } else {
      // Analyze current UI structure
      const uiAnalysis = UIAnalyzer.analyzeCurrentUI(activeModuleRef.current, activePageRef.current);

      // Call AI Engine for synthesis
      const aiContent = await AiEngine.synthesizeDemoContent(
        activeModuleRef.current,
        activePageRef.current,
        events,
        uiAnalysis,
        language
      );

      // Create new project
      targetProject = DemoManager.createNewProject(
        activeModuleRef.current,
        activePageRef.current,
        aiContent.title,
        aiContent.description
      );

      targetProject.events = events;
      targetProject.uiAnalysis = uiAnalysis;
      targetProject.timelineSteps = aiContent.timelineSteps;
      targetProject.documentation = aiContent.documentation;

      if (videoBlobUrl && capturedBlob) {
        targetProject.videoBlobUrl = videoBlobUrl;
        await VideoStorageService.saveVideoBlob(targetProject.id, capturedBlob);
      }
    }

    DemoManager.saveProject(targetProject);
    toast.dismiss(toastId);
    toast.success('Démonstration vidéo ScreenRec enregistrée avec succès !');

    return targetProject;
  }, []);

  const recordManualAction = useCallback((action: any, label: string) => {
    if (isRecordingRef.current) {
      eventRecorder.recordCustomEvent(action, label);
      toast('Étape enregistrée : ' + label, { icon: '📍' });
    }
  }, []);

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
