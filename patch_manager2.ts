import fs from 'fs';

const file = 'src/modules/tailleur/components/TailleurEmbroideryManager.tsx';
const content = fs.readFileSync(file, 'utf8');

const anchor = '  const [showAtirModal, setShowAtirModal] = useState<boolean>(false);';

const newEffect = `
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    import('../../../application/EventBus').then(({ EventBus }) => {
      unsubs.push(EventBus.subscribe('SIMULATION_LOG', (e: any) => {
        setReflectiveLogs(prev => [...prev, e.payload.message]);
      }));
      unsubs.push(EventBus.subscribe('SIMULATION_STAGE', (e: any) => {
        setReflectiveCompileStage(e.payload.stage);
      }));
      unsubs.push(EventBus.subscribe('SIMULATION_SCORE', (e: any) => {
        setReflectiveScores(prev => ({ ...prev, ...e.payload.scores }));
      }));
      unsubs.push(EventBus.subscribe('SIMULATION_REASONING', (e: any) => {
        setReflectiveReasoning(e.payload.reasoning);
        setReflectiveCriticReport(e.payload.criticReport);
        setActiveExecutiveDirective(e.payload.directive);
      }));
      unsubs.push(EventBus.subscribe('SIMULATION_OBSERVATION', (e: any) => {
        setReflectiveCandidateObservation(e.payload.observation);
      }));
    });

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

`;

const newContent = content.replace(anchor, newEffect + anchor);
fs.writeFileSync(file, newContent);
