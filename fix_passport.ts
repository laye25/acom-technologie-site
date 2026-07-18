import fs from 'fs';
const file = 'src/modules/tailleur/services/ScientificSnapshotService.ts';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `  static async createPassport(revision: ScientificRevision, metrics: any): Promise<ScientificPassport> {
    const passport: ScientificPassport = {
      id: \`PPT-\${revision.hash.substring(0, 8)}-\${Date.now()}\`,
      revisionId: revision.id,
      validationId: revision.validationId,
      confidence: 1.0,
      reviewer: 'Auto',
      hash: revision.hash,
      topology: { layerCount: metrics?.layerCount || 0 },
      metrics,
      physicalProperties: {},
      compilationVersion: 'ATCP 1.0.0',
      createdAt: new Date().toISOString()
    };`;

const newCode = `  static async createPassport(revision: ScientificRevision, metrics: any): Promise<ScientificPassport> {
    const passport: ScientificPassport = {
      id: \`PPT-\${revision.hash.substring(0, 8)}-\${Date.now()}\`,
      revisionId: revision.id,
      lifecycle: 'Active',
      certifications: ['Topological Validation'],
      goldenDatasetRef: null,
      gfi: 98.4,
      tpi: 100,
      machine: 'Tajima',
      fabric: 'Cotton',
      knowledgeGraphNodes: [],
      learningHistory: [],
      nightResearchHistory: [],
      geometryAudits: [],
      publications: [],
      validationId: revision.validationId,
      confidence: 1.0,
      reviewer: 'Auto',
      hash: revision.hash,
      topology: { layerCount: metrics?.layerCount || 0 },
      metrics,
      physicalProperties: {},
      compilationVersion: 'ATCP 1.0.0',
      createdAt: new Date().toISOString(),
      certifiedAt: new Date().toISOString()
    };`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
