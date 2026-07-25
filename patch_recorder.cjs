const fs = require('fs');
const file = 'src/ai-demo/hooks/useDemoRecorder.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
  const isRecordingRef = useRef(false);
  const isScreenCaptureRef = useRef(false);
  const activeModuleRef = useRef('Acom SaaS');
  const activePageRef = useRef('Accueil');

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
`;

const startIndex = code.indexOf('  const startDemoRecording = useCallback');
const endIndex = code.indexOf('    newProject.events = events;');

code = code.substring(0, startIndex) + replacement.trim() + '\n' + code.substring(endIndex + '    newProject.events = events;'.length);

fs.writeFileSync(file, code);
