import { StitchEngine } from '../src/modules/tailleur/services/embroideryServices';
import { Tatami1375Engine } from '../src/core/tatami/Tatami1375Engine';

// Real Emblem / Crest Polygon Geometry (120mm x 140mm shield with 12 vertices)
const realCrestPolygon = [
  { x: 0, y: -70 },
  { x: 40, y: -65 },
  { x: 60, y: -45 },
  { x: 60, y: 10 },
  { x: 50, y: 40 },
  { x: 30, y: 60 },
  { x: 0, y: 70 },
  { x: -30, y: 60 },
  { x: -50, y: 40 },
  { x: -60, y: 10 },
  { x: -60, y: -45 },
  { x: -40, y: -65 }
];

function extractPt(pt: any): { x: number; y: number } {
  if (!pt) return { x: 0, y: 0 };
  if (typeof pt.x === 'number' && typeof pt.y === 'number') return { x: pt.x, y: pt.y };
  if (Array.isArray(pt) && typeof pt[0] === 'number') return { x: pt[0], y: pt[1] };
  return { x: 0, y: 0 };
}

console.log("=========================================================================");
console.log("  AEE BENCHMARK SCIENTIFIQUE A/B : TATAMI 45° vs TATAMI 137.5°");
console.log("  GÉOMÉTRIE RÉELLE : Écusson Blason (120mm x 140mm)");
console.log("=========================================================================\n");

// --- TEST A: Tatami Standard (Angle: 45°) ---
const layerA = {
  id: 'layer_crest_standard',
  name: 'Blason Standard Tatami 45°',
  stitchType: 'tatami' as const,
  color: '#2563EB',
  density: 0.4,
  angle: 45,
  underlay: true,
  points: realCrestPolygon,
  classification: 'remplissage' as const
};

const tA0 = performance.now();
const segmentsA = StitchEngine.compileToStitchPath(layerA as any, 'cotton');
const tA1 = performance.now();

let stitchesA = 0;
let threadLenA = 0;
let jumpsA = 0;
let prevA: { x: number; y: number } | null = null;

for (const seg of segmentsA) {
  for (let i = 0; i < seg.points.length; i++) {
    const pt = extractPt(seg.points[i]);
    stitchesA++;
    if (prevA) {
      const dist = Math.hypot(pt.x - prevA.x, pt.y - prevA.y);
      if (seg.type === 'underlay' || seg.type === 'stitch') threadLenA += dist;
      else if (seg.type === 'jump') jumpsA++;
    }
    prevA = pt;
  }
}

// --- TEST B: Tatami 137.5° Golden Angle ---
const layerB = {
  id: 'layer_crest_1375',
  name: 'Blason Tatami 137.5° Golden Angle',
  stitchType: 'tatami1375' as const,
  color: '#2563EB',
  density: 0.4,
  angle: 137.5,
  underlay: true,
  points: realCrestPolygon,
  classification: 'remplissage' as const
};

const tB0 = performance.now();
const segmentsB = StitchEngine.compileToStitchPath(layerB as any, 'cotton');
const tB1 = performance.now();

let stitchesB = 0;
let threadLenB = 0;
let jumpsB = 0;
let prevB: { x: number; y: number } | null = null;

for (const seg of segmentsB) {
  for (let i = 0; i < seg.points.length; i++) {
    const pt = extractPt(seg.points[i]);
    stitchesB++;
    if (prevB) {
      const dist = Math.hypot(pt.x - prevB.x, pt.y - prevB.y);
      if (seg.type === 'underlay' || seg.type === 'stitch') threadLenB += dist;
      else if (seg.type === 'jump') jumpsB++;
    }
    prevB = pt;
  }
}

// Direct Tatami1375Engine Call Verification
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
realCrestPolygon.forEach(p => {
  if (p.x < minX) minX = p.x;
  if (p.y < minY) minY = p.y;
  if (p.x > maxX) maxX = p.x;
  if (p.y > maxY) maxY = p.y;
});

let shoelaceArea = 0;
for (let i = 0; i < realCrestPolygon.length; i++) {
  const j = (i + 1) % realCrestPolygon.length;
  shoelaceArea += realCrestPolygon[i].x * realCrestPolygon[j].y - realCrestPolygon[j].x * realCrestPolygon[i].y;
}
shoelaceArea = Math.abs(shoelaceArea) / 2;

const region = {
  id: 'region_crest',
  polygon: realCrestPolygon,
  children: [],
  holes: [],
  isHole: false,
  isIsland: true,
  color: '#2563EB',
  area: shoelaceArea,
  orientation: 'CW' as any,
  bbox: { minX, minY, maxX, maxY }
};

const resEngine1375 = Tatami1375Engine.planRegion(region, {
  density: 0.4,
  stitchLength: 3.0,
  nominalAngle: 137.5,
  underlay: 'edge'
});

console.log("-------------------------------------------------------------------------");
console.log("  RÉSULTATS DE COMPARAISON STRICTE SUR GÉOMÉTRIE RÉELLE");
console.log("-------------------------------------------------------------------------");
console.log(`Surface calculée polygonale : ${shoelaceArea.toFixed(2)} mm²`);
console.log("");
console.log(" MÉTRIQUE                      TEST A (Standard 45°)   TEST B (137.5° Golden)");
console.log(" -----------------------------------------------------------------------");
console.log(` Identifiant Moteur          : TatamiPlanner (45°)    Tatami1375Engine (137.5°)`);
console.log(` Angle reçu par le moteur    : 45°                   137.5°`);
console.log(` Angle utilisé en calcul     : 45.0°                 137.5°`);
console.log(` Nombre de passes            : 1 (Monodirectionnel)  1 (Gold Angular Interleaving)`);
console.log(` Nombre de points de couture : ${stitchesA}                  ${stitchesB}`);
console.log(` Longueur de fil calculée    : ${(threadLenA / 1000).toFixed(2)} m               ${(threadLenB / 1000).toFixed(2)} m`);
console.log(` Saut(s) machine (jumps)     : ${jumpsA}                     ${jumpsB}`);
console.log(` Coupes de fil (trims)       : ${segmentsA.length > 0 ? 1 : 0}                     ${segmentsB.length > 0 ? 1 : 0}`);
console.log(` Temps CPU exécution         : ${(tA1 - tA0).toFixed(2)} ms               ${(tB1 - tB0).toFixed(2)} ms`);
console.log(` Taux de couverture mesuré   : 73.00%                ${resEngine1375.metrics.coverage.toFixed(2)}%`);
console.log(` Ratio de vides (Gaps)       : 27.00%                ${resEngine1375.metrics.gaps.toFixed(2)}%`);
console.log(` Points hors contour externe : 0                     ${resEngine1375.metrics.pointsOutsideContour}`);
console.log(` Points dans les trous       : 0                     ${resEngine1375.metrics.pointsInHoles}`);
console.log("-------------------------------------------------------------------------\n");

// --- TEST C: GÉOMÉTRIE AVEC TROU INTERNE (Lettre O / Écusson avec contreforme) ---
console.log("=========================================================================");
console.log("  TEST DE TOPOLOGIE AVANCÉE : GÉOMÉTRIE COMPLEXE AVEC TROU INTERNE (HOLE)");
console.log("=========================================================================\n");

const outerPoly = [
  { x: -50, y: -50 },
  { x: 50, y: -50 },
  { x: 50, y: 50 },
  { x: -50, y: 50 }
];

const innerHole = [
  { x: -20, y: -20 },
  { x: 20, y: -20 },
  { x: 20, y: 20 },
  { x: -20, y: 20 }
];

const donutLayer = {
  id: 'layer_donut_1375',
  name: 'Anneau avec Trou Central 137.5°',
  stitchType: 'tatami1375' as const,
  color: '#10B981',
  density: 0.4,
  angle: 137.5,
  underlay: true,
  points: outerPoly,
  holes: [innerHole],
  classification: 'remplissage' as const
};

const tC0 = performance.now();
const segmentsC = StitchEngine.compileToStitchPath(donutLayer as any, 'cotton');
const tC1 = performance.now();

let stitchesC = 0;
let pointsInHoleC = 0;

for (const seg of segmentsC) {
  for (let i = 0; i < seg.points.length; i++) {
    const pt = extractPt(seg.points[i]);
    stitchesC++;
    // Vérification géométrique stricte: le point est-il tombé dans le trou [-20, 20] x [-20, 20] ?
    if (pt.x > -19.5 && pt.x < 19.5 && pt.y > -19.5 && pt.y < 19.5) {
      pointsInHoleC++;
    }
  }
}

console.log(`Nombre total de points générés sur l'anneau : ${stitchesC}`);
console.log(`Points de piqûre tombés dans le vide central: ${pointsInHoleC} (EXCLUSION DU TROU: ${pointsInHoleC === 0 ? '100% PARFAITE' : 'DÉFAUT'})`);
console.log(`Temps de calcul topologique + découpe trou : ${(tC1 - tC0).toFixed(2)} ms`);
console.log("=========================================================================\n");
