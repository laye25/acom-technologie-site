const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');
let newContent = content.replace(
    /          setLayers\(prev => \{\n             const deduplicatedLayers: any\[\] = \[\];\n               \n             \/\/ Pre-calculate metadata for extraction layers/g,
    `          const deduplicatedLayers: any[] = [];\n             \n             // Pre-calculate metadata for extraction layers`
);

newContent = newContent.replace(
    /             return deduplicatedLayers;\n          \}\);\n          if \(newValidations\.length > 0\) \{/g,
    `          \n          if (newValidations.length > 0) {`
);

newContent = newContent.replace(
    /          if \(extractedLayers\.length > 0\) \{\n               setSelectedLayerId\(extractedLayers\[0\]\.id\);\n           \}\n            \n          setAiLog\(prev => \[\n            \.\.\.prev,\n            \`✨ Importation SVG réussie !\`,\n            \`Extraits : \$\{extractedLayers\.length\} formes vectorielles\.\`,\n            \`Motif centré et redimensionné pour le cercle de broderie\.\`\n          \]\);\n\n          if \(vectorizeMode === 'logo' && extractedLayers\.length > 0\) \{\n            const diagReport = LogoAnalyzerKernel\.analyzeLogo\(extractedLayers\);\n            setLogoDiagnosticReport\(diagReport\);\n            setShowLogoDiagnostic\(true\);\n          \}/g,
    `          let finalLayersToSet = deduplicatedLayers;\n\n          if (vectorizeMode === 'logo' && deduplicatedLayers.length > 0) {\n            const diagReport = LogoAnalyzerKernel.analyzeLogo(deduplicatedLayers);\n            setLogoDiagnosticReport(diagReport);\n            setShowLogoDiagnostic(true);\n            \n            // Advance Reconstruction\n            const reconReport = GeometricReconstructionEngine.analyzeAndReconstruct(diagReport);\n            \n            // Bridge the reconstruction into the actual layers\n            const applicationResult = ReconstructionApplicationBridge.applyReconstructions(deduplicatedLayers, diagReport, reconReport);\n            \n            finalLayersToSet = applicationResult.layers;\n            console.log(\`Reconstruction Bridge applied: \${applicationResult.statistics.actuallyAppliedToLayers} / \${applicationResult.statistics.totalLayers} layers updated.\`);\n          }\n          \n          setLayers(finalLayersToSet);\n\n          if (finalLayersToSet.length > 0) {\n               setSelectedLayerId(finalLayersToSet[0].id);\n           }\n            \n          setAiLog(prev => [\n            ...prev,\n            \`✨ Importation SVG réussie !\`,\n            \`Extraits : \${extractedLayers.length} formes vectorielles, réduites à \${finalLayersToSet.length}.\`,\n            \`Motif centré et redimensionné pour le cercle de broderie.\`\n          ]);`
);

fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
