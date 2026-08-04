const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

const search = `          let finalLayersToSet = deduplicatedLayers;

          if (vectorizeMode === 'logo' && deduplicatedLayers.length > 0) {
            const diagReport = LogoAnalyzerKernel.analyzeLogo(deduplicatedLayers);
            setLogoDiagnosticReport(diagReport);
            
            // Advance Reconstruction
            const reconReport = AdvancedGeometricReconstructionEngine.analyzeAndReconstruct(diagReport);
            
            // Bridge the reconstruction into the actual layers
            const applicationResult = ReconstructionApplicationBridge.applyReconstructions(deduplicatedLayers, diagReport, reconReport);
            
            finalLayersToSet = applicationResult.layers;
            console.log(\`Reconstruction Bridge applied: \${applicationResult.statistics.actuallyAppliedToLayers} / \${applicationResult.statistics.totalLayers} layers updated.\`);
            
            setShowLogoDiagnostic(true);
          }`;

const replace = `          let finalLayersToSet = deduplicatedLayers;

          if (vectorizeMode === 'logo' && deduplicatedLayers.length > 0) {
            
            // --- SENTINEL TEST INJECTION ---
            const sentinelOriginalPoints = Array.from({length: 30}).map((_, i) => ({
              x: Math.cos(i * Math.PI * 2 / 30) * 100 + 10 * Math.random(),
              y: Math.sin(i * Math.PI * 2 / 30) * 100 + 10 * Math.random()
            }));
            const sentinelReconstructedPoints = Array.from({length: 30}).map((_, i) => ({
              x: Math.cos(i * Math.PI * 2 / 30) * 100,
              y: Math.sin(i * Math.PI * 2 / 30) * 100
            }));

            const sentinelLayer = {
              id: 'SENTINEL_LAYER_001',
              name: 'Sentinel Circle',
              stitchType: 'running',
              color: '#ff0000',
              colorName: 'Red',
              threadCode: 'RED',
              density: 0.4,
              angle: 0,
              underlay: false,
              pullComp: 0,
              visible: true,
              locked: false,
              points: sentinelOriginalPoints,
            };
            deduplicatedLayers.push(sentinelLayer);
            // ---------------------------------

            const diagReport = LogoAnalyzerKernel.analyzeLogo(deduplicatedLayers);
            setLogoDiagnosticReport(diagReport);
            
            // Advance Reconstruction
            const reconReport = AdvancedGeometricReconstructionEngine.analyzeAndReconstruct(diagReport);
            
            // --- FORCE SENTINEL RECONSTRUCTION ---
            reconReport.results.push({
              objectId: 'LOGO_OBJ_SENTINEL',
              layerId: 'SENTINEL_LAYER_001',
              originalCategory: 'SHAPE',
              originalSpecificType: 'CIRCLE',
              geometryType: 'CIRCLE',
              topologyInfo: { isClosed: true, hasSelfIntersection: false, pointCount: 30, boundingBox: {minX:-110, minY:-110, maxX:110, maxY:110}, area: 30000, perimeter: 600, centroid: {x:0, y:0}, circularity: 0.9, windingOrder: 'CW' },
              originalPoints: sentinelOriginalPoints,
              originalSvgPathD: '',
              fitStatus: 'TESTED_AND_FITTED',
              fitSummary: {},
              proposedPrimitive: 'CIRCLE',
              reconstructedGeometry: {
                primitiveType: 'CIRCLE',
                sampledPoints: sentinelReconstructedPoints,
                reconstructionPrecisionScore: 99,
                svgPathD: '',
                isClosed: true,
                hasSelfIntersection: false,
                pointCount: 30,
                boundingBox: {minX:-100, minY:-100, maxX:100, maxY:100},
                area: 31415,
                perimeter: 628,
                centroid: {x:0,y:0},
                windingOrder: 'CW',
                analyticalDetails: { cx: 0, cy: 0, radius: 100 }
              },
              fitConfidence: 99,
              fitErrorPercent: 1,
              decision3Level: 'RECONSTRUCT_CONFIRMED',
              decision: 'RECONSTRUCTED',
              reason: 'Sentinel Test'
            });
            // -------------------------------------

            // Bridge the reconstruction into the actual layers
            const applicationResult = ReconstructionApplicationBridge.applyReconstructions(deduplicatedLayers, diagReport, reconReport);
            
            // Expose bridge stats globally for the UI
            window.__BRIDGE_STATS = applicationResult.statistics;

            finalLayersToSet = applicationResult.layers;
            console.log(\`Reconstruction Bridge applied: \${applicationResult.statistics.actuallyAppliedToLayers} / \${applicationResult.statistics.totalLayers} layers updated.\`);
            
            // Calculate and expose Hashes
            const hashGeometry = (pts) => {
              if (!pts) return 'null';
              let hash = 0;
              for (let i = 0; i < pts.length; i++) {
                hash = Math.imul(31, hash) + (pts[i].x * 1000) | 0;
                hash = Math.imul(31, hash) + (pts[i].y * 1000) | 0;
              }
              return hash.toString(16);
            };

            const sentinelFinalLayer = finalLayersToSet.find(l => l.id === 'SENTINEL_LAYER_001');
            window.__SENTINEL_HASHES = {
              ORIGINAL_HASH: hashGeometry(sentinelOriginalPoints),
              RECONSTRUCTED_HASH: hashGeometry(sentinelReconstructedPoints),
              ACTIVE_LAYER_HASH: sentinelFinalLayer ? hashGeometry(sentinelFinalLayer.points) : 'null'
            };
            
            setShowLogoDiagnostic(true);
          }`;

let newContent = content.replace(search, replace);

if (newContent === content) {
    console.error("NO CHANGES MADE");
} else {
    fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
    console.log("CHANGES APPLIED");
}
