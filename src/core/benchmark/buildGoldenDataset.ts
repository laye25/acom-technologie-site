import * as fs from 'fs';
import * as path from 'path';
import { GoldenDataset } from '../../modules/tailleur/services/GoldenDataset';
import { ATCPCompiler } from '../compiler/Compiler';
import { ATIR } from '../compiler/ATIR';
import { DSTBackend } from '../compiler/backends/DSTBackend';
import { PESBackend } from '../compiler/backends/PESBackend';
import { MetricsCalculator } from '../geometry/algorithms/MetricsCalculator';
import { RibbonValidator } from '../ribbon/RibbonValidator';
import { PhysicsValidator } from '../physics/PhysicsValidator';
import { FabricModel } from '../physics/FabricModel';
import { ThreadModel } from '../physics/ThreadModel';
import { NeedleModel } from '../physics/NeedleModel';

console.log("Building Versioned Golden Dataset v1.0.0...");

const outputDir = path.join(process.cwd(), 'golden-dataset', 'v1.0.0');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const compiler = new ATCPCompiler();

GoldenDataset.forEach((motif) => {
  const motifNameSafe = motif.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const motifDir = path.join(outputDir, motifNameSafe);

  if (!fs.existsSync(motifDir)) {
    fs.mkdirSync(motifDir, { recursive: true });
  }

  // Define params
  const params = {
    baseEpsilon: 0.5,
    minEpsilon: 0.05,
    resampleStep: 2.0,
    minStep: 0.5,
    arcTolerance: 0.15
  };

  // Compile
  const initialIR: ATIR = {
    version: '1.0',
    contours: motif.contours,
    regions: [],
    metadata: { profile: 'all' }
  };

  const compiledIR = compiler.getPipeline().execute(initialIR, params);

  // Generate reference.svg representing the original input contours
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  motif.contours.forEach(c => {
    c.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    });
  });

  // Add padding
  const width = Math.max(50, (maxX - minX) + 20);
  const height = Math.max(50, (maxY - minY) + 20);
  const vbX = minX - 10;
  const vbY = minY - 10;

  let svgPaths = '';
  motif.contours.forEach((c, index) => {
    if (c.length === 0) return;
    const d = c.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    svgPaths += `  <path d="${d}" fill="none" stroke="#fff" stroke-width="2" opacity="${index === 0 ? '1' : '0.6'}" />\n`;
  });

  const referenceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${width} ${height}" width="${width * 4}" height="${height * 4}" style="background: #0f172a;">
  <g stroke-linecap="round" stroke-linejoin="round">
  <!-- Reference Contours -->
${svgPaths}  </g>
</svg>`;

  fs.writeFileSync(path.join(motifDir, 'reference.svg'), referenceSvg, 'utf8');

  // Generate expected.atir
  // Exclude raw buffers/arrays to avoid huge text sizes or JSON cycles if any
  const atirToSave = {
    version: compiledIR.version,
    contours: compiledIR.contours,
    regions: compiledIR.regions,
    skeleton: compiledIR.skeleton,
    widths: compiledIR.widths,
    leftRail: compiledIR.leftRail,
    rightRail: compiledIR.rightRail,
    stitchesCount: compiledIR.stitches?.length || 0,
    metadata: {
      profile: compiledIR.metadata.profile,
      topology: compiledIR.metadata.topology,
      geometry: compiledIR.metadata.geometry,
      ribbonMetrics: compiledIR.metadata.ribbonMetrics,
      physicsMetrics: compiledIR.metadata.physicsMetrics
    }
  };
  fs.writeFileSync(path.join(motifDir, 'expected.atir'), JSON.stringify(atirToSave, null, 2), 'utf8');

  // Generate expected.dst and expected.pes
  const dstBuffer = DSTBackend.generate(compiledIR);
  fs.writeFileSync(path.join(motifDir, 'expected.dst'), Buffer.from(dstBuffer));

  const pesBuffer = PESBackend.generate(compiledIR);
  fs.writeFileSync(path.join(motifDir, 'expected.pes'), Buffer.from(pesBuffer));

  // Generate metrics.json
  const metrics = {
    id: motif.name,
    difficulty: motif.difficulty,
    type: motif.type,
    topology: compiledIR.metadata.topology,
    geometry: compiledIR.metadata.geometry,
    ribbon: compiledIR.metadata.ribbonMetrics,
    physics: compiledIR.metadata.physicsMetrics,
    performance: compiledIR.metadata.performance
  };
  fs.writeFileSync(path.join(motifDir, 'metrics.json'), JSON.stringify(metrics, null, 2), 'utf8');

  console.log(`- Created reference files for: ${motif.name}`);
});

console.log(`\nAll reference files written to ./golden-dataset/v1.0.0/ successfully!`);
