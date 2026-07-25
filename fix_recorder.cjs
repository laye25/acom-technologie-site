const fs = require('fs');
const file = 'src/ai-demo/hooks/useDemoRecorder.ts';
let code = fs.readFileSync(file, 'utf8');

// The patch inserted it multiple times.
// Let's just fix it manually.
const fixed = `import { useState, useEffect, useCallback, useRef } from 'react';
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
    enableScreenCapture: boolean = false
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
      if (screenOk) {
        toast.success('Capture vidéo de l\\'écran activée !');
      }
    } else {
      setIsScreenCapture(false);
      isScreenCaptureRef.current = false;
    }

    toast.success(\`Enregistrement ACOM AI Demo démarré : \${moduleName} - \${pageName}\`);
  }, []);

  const stopDemoRecording = useCallback(async (language: DemoLanguage = 'fr'): Promise<DemoProject | null> => {
    if (!isRecordingRef.current) return null;

    const toastId = toast.loading('Analyse de l\\'interface et génération de la démonstration IA...');

    const events = eventRecorder.stopRecording();
    
    let videoBlobUrl: string | undefined = undefined;
    if (isScreenCaptureRef.current) {
      const blob = await screenRecorder.stopCapture();
      if (blob) {
        videoBlobUrl = URL.createObjectURL(blob);
      }
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    setIsScreenCapture(false);
    isScreenCaptureRef.current = false;

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

    // Create & Save project
    const newProject = DemoManager.createNewProject(
      activeModuleRef.current,
      activePageRef.current,
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
`;

fs.writeFileSync(file, fixed);
