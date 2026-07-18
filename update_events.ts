import fs from 'fs';
const file = 'src/application/ScientificEventBus.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('export type Event = ', 
`export type Event = 
  | { type: 'COMPILATION_STARTED', payload: { assetId: string, mode: string } }
  | { type: 'SCIENTIFIC_REVIEW_STARTED', payload: { revisionId: string } }
  | { type: 'SCIENTIFIC_REVIEW_FINISHED', payload: { revisionId: string, reviewId: string } }
  | { type: 'NIGHT_RESEARCH_STARTED', payload: { mode: string } }
  | { type: 'NIGHT_RESEARCH_FINISHED', payload: { campaignId: string, stats: any } }
  | { type: 'GEOMETRY_AUTOPSY_STARTED', payload: { snapshotId: string } }
  | { type: 'GEOMETRY_AUTOPSY_FINISHED', payload: { auditId: string } }
  | { type: 'CERTIFICATION_GRANTED', payload: { revisionId: string } }
  | { type: 'CERTIFICATION_REJECTED', payload: { revisionId: string, reason: string } }
  | { type: 'ASSET_PUBLISHED', payload: { assetId: string } }
`);

fs.writeFileSync(file, content);
