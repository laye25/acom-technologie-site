import fs from 'fs';
const file = 'src/modules/tailleur/services/ScientificSnapshotService.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  'export interface ScientificPassport {',
  `export interface ScientificPassport {
  lifecycle?: string;
  certifications?: string[];
  goldenDatasetRef?: string;
  gfi?: number;
  tpi?: number;
  machine?: string;
  fabric?: string;
  knowledgeGraphNodes?: string[];
  learningHistory?: any[];
  nightResearchHistory?: any[];
  geometryAudits?: string[];
  publications?: string[];
  certifiedAt?: string;`
);
fs.writeFileSync(file, content);
