import fs from 'fs';
const file = 'src/modules/tailleur/services/ScientificSnapshotService.ts';
let content = fs.readFileSync(file, 'utf8');

const oldPassport = `export interface ScientificPassport {
  id: string;
  revisionId: string;
  validationId: string | null;
  confidence: number;
  reviewer: string;
  hash: string;
  topology: any;
  metrics: any;
  physicalProperties: any;
  compilationVersion: string;
  createdAt: string;
  certifiedAt: string | null;
}`;

const newPassport = `export interface ScientificPassport {
  id: string;                // identité
  revisionId: string;        // versions
  lifecycle: string;         // cycle de vie
  certifications: string[];  // certifications
  goldenDatasetRef: string | null; // Golden Dataset
  gfi: number;               // GFI (Geometric Fidelity Index)
  tpi: number;               // TPI (Topological Preservation Index)
  hash: string;              // Hash
  machine: string;           // Machine
  fabric: string;            // Fabric
  knowledgeGraphNodes: string[]; // Knowledge Graph
  learningHistory: any[];    // Learning History
  nightResearchHistory: any[]; // Night Research History
  geometryAudits: string[];  // Geometry Audits
  publications: string[];    // Publications
  
  // Legacy fields
  validationId: string | null;
  confidence: number;
  reviewer: string;
  topology: any;
  metrics: any;
  physicalProperties: any;
  compilationVersion: string;
  createdAt: string;
  certifiedAt: string | null;
}`;

content = content.replace(oldPassport, newPassport);
fs.writeFileSync(file, content);
