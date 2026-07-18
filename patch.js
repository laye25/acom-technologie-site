const fs = require('fs');
let code = fs.readFileSync('src/modules/tailleur/services/embroideryServices.ts', 'utf8');

code = code.replace(/let cover: EmbroideryPoint\[\] = \[\];/, 'let cover: EmbroideryPoint[] = [];\n    let diagCenterline: EmbroideryPoint[] = [];\n    let diagFillLines: EmbroideryPoint[][] = [];');

code = code.replace(/const topo = TopologicalEngine\.getMedialAxis\(physicalPoints\);/, 'const topo = TopologicalEngine.getMedialAxis(physicalPoints);\n      diagCenterline = topo.centerline;');

code = code.replace(/const segments = getSatinSlicingStitches\(physicalSegments \|\| physicalPoints, stepDist, calcAngle\);/, 'const segments = getSatinSlicingStitches(physicalSegments || physicalPoints, stepDist, calcAngle);\n        diagFillLines = segments;');

code = code.replace(/const segments = getTatamiStitches\(physicalSegments \|\| physicalPoints, stepDist, calcAngle\);/, 'const segments = getTatamiStitches(physicalSegments || physicalPoints, stepDist, calcAngle);\n      diagFillLines = segments;');

code = code.replace(/return list;\n  }\n\}/, 'EmbroideryDiagnosticAuditor.capture(obj, obj.points, physicalPoints, diagCenterline, diagFillLines, list.flatMap(l => l.points));\n    return list;\n  }\n}');

fs.writeFileSync('src/modules/tailleur/services/embroideryServices.ts', code);
