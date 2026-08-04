const fs = require('fs');
const content = fs.readFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', 'utf8');

let newContent = content.replace(
  "import { ReconstructionApplicationBridge } from '../services/ReconstructionApplicationBridge';",
  "import { ReconstructionApplicationBridge } from '../services/ReconstructionApplicationBridge';\nimport { GeometricReconstructionEngine as AdvancedGeometricReconstructionEngine } from '../services/GeometricReconstructionEngine';"
);

newContent = newContent.replace(
  "GeometricReconstructionEngine.analyzeAndReconstruct(diagReport);",
  "AdvancedGeometricReconstructionEngine.analyzeAndReconstruct(diagReport);"
);

fs.writeFileSync('src/modules/tailleur/components/TailleurEmbroideryManager.tsx', newContent);
