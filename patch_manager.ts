import fs from 'fs';

const file = 'src/modules/tailleur/components/TailleurEmbroideryManager.tsx';
const content = fs.readFileSync(file, 'utf8');

// Find the start and end of ATCPCompiler
const startIndex = content.indexOf('  const ATCPCompiler = {');
if (startIndex === -1) {
  console.error('Could not find ATCPCompiler');
  process.exit(1);
}

const afterIndex = content.indexOf('  const handleVectorizeStandard = () => {', startIndex);
if (afterIndex === -1) {
  console.error('Could not find handleVectorizeStandard');
  process.exit(1);
}

const beforeCode = content.substring(0, startIndex);
const afterCode = content.substring(afterIndex);

const newCompilerCode = `  const ATCPCompiler = {
    run: async (options: { mode: 'tatami' | 'svg' | 'ia' | '44layers' }) => {
      const mode = options.mode;
      
      setGlobalState('En cours');
      setReflectiveCompileActive(true);
      setReflectiveCompileStage('vision');
      setReflectiveCandidateObservation(null);
      setReflectiveScores({ vision: 0, ekle: 0, verseau: 0, geometry: 0, topology: 0, ribbon: 0, satin: 0, tatami: 0, physics: 0, travel: 0, certification: 0 });
      setIsGenerating(true);
      setReflectiveLogs([]);

      try {
        const { ApplicationCommandBus } = await import('../../../application/ApplicationCommandBus');
        const buffer = await ApplicationCommandBus.dispatch({
          type: 'COMPILE',
          payload: {
            assetId: scientificAsset?.id || \`AST-TMP-\${Date.now()}\`,
            layers: layers,
            projectName: projectName,
            format: '.dst',
            fabricKey: selectedFabric,
            mode: mode,
            executivePriority: executivePriority,
            executiveMachine: executiveMachine,
            executiveThread: executiveThread
          }
        });

        setIsGenerating(false);
        setGlobalState('Compilé');

        // SVG tracing logic
        if (mode === 'tatami' || mode === 'svg') {
          if (modelImages.length > 0) {
            setAiLog(prev => [...prev, 'Initialisation du traceur HD...']);
            const imgUrl = modelImages[0];
            ImageTracer.imageToSVG(imgUrl, (svgString: string) => {
              setAiLog(prev => [...prev, 'Tracé terminé ! Extraction des chemins vectoriels...']);
              try {
                parseSvgFile(svgString, \`Trace_\${Date.now()}.svg\`, mode === 'tatami' ? 'tatami' : 'running');
              } catch(e: any) {
                setAiLog(prev => [...prev, 'Erreur de conversion SVG: ' + e.message]);
              }
            }, {
              ltres: 1.5, qtres: 1.5, pathomit: 32, colorsampling: 2, numberofcolors: 12, mincolorratio: 0.01,
              colorquantcycles: 4, blurradius: 0, blurdelta: 20, strokewidth: 0, linefilter: false, scale: 1,
              roundcoords: 2, viewbox: false, desc: false
            });
          }
        } else if (mode === 'ia') {
           // We keep the old IA mock for layer generation so UI doesn't break
           const detectedItems = ObjectDetectionService.detectIndependentObjects(aiPrompt || "Fallback", []);
           let mapped = EmbroideryObjectService.buildHighFidelityModel(detectedItems).map(l => ({
              ...l,
              visible: true,
              locked: false
           }));
           setLayers(mapped);
           runEkleMatching(mapped);
        } else if (mode === '44layers') {
           const rawObjects = ObjectDetectionService.detectIndependentObjects("Bouquet HD", []);
           const highFidelityLayers = EmbroideryObjectService.buildHighFidelityModel(rawObjects);
           const optimizedLayers = PathOptimizer.optimizeSewingOrder(highFidelityLayers);
           let mapped = optimizedLayers.map(l => ({ ...l, visible: true, locked: false }));
           setLayers(mapped);
           runEkleMatching(mapped);
        }
        
      } catch (err) {
        console.error(err);
        setReflectiveLogs(prev => [...prev, \`[Erreur] Echec de la compilation: \${err}\`]);
        setIsGenerating(false);
      }
    }
  };

`;

fs.writeFileSync(file, beforeCode + newCompilerCode + afterCode);
