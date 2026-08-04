const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');
const searchString = `          setLayers(prev => {
             const deduplicatedLayers: any[] = [];
               
             // Pre-calculate metadata for extraction layers`;

const replaceString = `          const deduplicatedLayers: any[] = [];
               
             // Pre-calculate metadata for extraction layers`;

let newContent = content.replace(searchString, replaceString);

const searchString2 = `             return deduplicatedLayers;
          });
          if (newValidations.length > 0) {`;

const replaceString2 = `
          if (newValidations.length > 0) {`;

newContent = newContent.replace(searchString2, replaceString2);

const searchString3 = `          if (extractedLayers.length > 0) {
               setSelectedLayerId(extractedLayers[0].id);
           }
            
          setAiLog(prev => [
            ...prev,
            \`✨ Importation SVG réussie !\`,
            \`Extraits : \${extractedLayers.length} formes vectorielles.\`,
            \`Motif centré et redimensionné pour le cercle de broderie.\`
          ]);

          if (vectorizeMode === 'logo' && extractedLayers.length > 0) {
            const diagReport = LogoAnalyzerKernel.analyzeLogo(extractedLayers);
            setLogoDiagnosticReport(diagReport);
            setShowLogoDiagnostic(true);
          }`;

const replaceString3 = `          let finalLayersToSet = deduplicatedLayers;

          if (vectorizeMode === 'logo' && deduplicatedLayers.length > 0) {
            const diagReport = LogoAnalyzerKernel.analyzeLogo(deduplicatedLayers);
            setLogoDiagnosticReport(diagReport);
            
            // Advance Reconstruction
            const reconReport = GeometricReconstructionEngine.analyzeAndReconstruct(diagReport);
            
            // Bridge the reconstruction into the actual layers
            const applicationResult = ReconstructionApplicationBridge.applyReconstructions(deduplicatedLayers, diagReport, reconReport);
            
            finalLayersToSet = applicationResult.layers;
            console.log(\`Reconstruction Bridge applied: \${applicationResult.statistics.actuallyAppliedToLayers} / \${applicationResult.statistics.totalLayers} layers updated.\`);
            
            setShowLogoDiagnostic(true);
          }

          setLayers(finalLayersToSet);

          if (finalLayersToSet.length > 0) {
               setSelectedLayerId(finalLayersToSet[0].id);
           }
            
          setAiLog(prev => [
            ...prev,
            \`✨ Importation SVG réussie !\`,
            \`Extraits : \${extractedLayers.length} formes vectorielles, réduites à \${finalLayersToSet.length}.\`,
            \`Motif centré et redimensionné pour le cercle de broderie.\`
          ]);`;

newContent = newContent.replace(searchString3, replaceString3);

if (content === newContent) {
    console.log("NO CHANGES MADE");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("CHANGES APPLIED");
}
