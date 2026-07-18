import { db } from '../../../db/db';
import { GeometryAutopsyService } from './GeometryAutopsyService';

export type SnapshotReason = 
  | 'MANUAL_SAVE'
  | 'COMPILATION'
  | 'AUTOPSY'
  | 'NIGHT_RESEARCH'
  | 'CERTIFICATION'
  | 'PUBLICATION'
  | 'EXPORT_DST';

export type RevisionStatus = 'Draft' | 'NeedsReview' | 'Certified' | 'Rejected';

export interface ScientificTextileAsset {
  id: string;
  merchantId: string;
  name: string;
  status: string;
  lifecycle: string;
  currentRevisionId: string | null;
  latestCertifiedRevisionId: string | null;
  hash: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeometrySnapshot {
  id: string;
  assetId: string;
  layers: any[];
  layerCount: number;
  pointsCount: number;
  boundingBox: any;
  hash: string;
  reason: SnapshotReason;
  createdAt: string;
  createdBy: string;
  canvasVersion: string;
  compilerVersion: string;
}

export interface ScientificRevision {
  id: string;
  assetId: string;
  snapshotId: string;
  passportId: string | null;
  atirId: string | null;
  dstId: string | null;
  validationId: string | null;
  scientificReviewId: string | null;
  version: number;
  status: RevisionStatus;
  hash: string;
  reason: SnapshotReason;
  createdAt: string;
}

export interface ScientificPassport {
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
  certifiedAt?: string;
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
}

export class ScientificSnapshotService {
  
  static async createSnapshot(assetId: string, layers: any[], reason: SnapshotReason): Promise<GeometrySnapshot> {
    let pointsCount = 0;
    layers.forEach(l => {
      pointsCount += l.points?.length || 0;
      if (l.subpaths) {
        l.subpaths.forEach((sp: any) => pointsCount += sp.length);
      }
    });

    // Deep copy for immutability
    const layersCopy = JSON.parse(JSON.stringify(layers));
    const layerStr = JSON.stringify(layersCopy.map((l: any) => ({ points: l.points, subpaths: l.subpaths })));
    const hash = await GeometryAutopsyService.calculateHash(layerStr);

    const snapshot: GeometrySnapshot = {
      id: `SNP-${hash.substring(0, 8).toUpperCase()}-${Date.now()}`,
      assetId,
      layers: layersCopy,
      layerCount: layersCopy.length,
      pointsCount,
      boundingBox: null, // Calculate if needed
      hash: hash.toUpperCase(),
      reason,
      createdAt: new Date().toISOString(),
      createdBy: 'System',
      canvasVersion: '1.0.0',
      compilerVersion: '1.0.0'
    };

    await db.geometry_snapshots.put(snapshot);
    return snapshot;
  }

  static async createRevision(assetId: string, snapshot: GeometrySnapshot, status: RevisionStatus = 'Draft'): Promise<ScientificRevision> {
    const existingRevisions = await db.scientific_revisions
      .where('assetId').equals(assetId)
      .toArray();
      
    const version = existingRevisions.length + 1;

    const revision: ScientificRevision = {
      id: `REV-${snapshot.hash.substring(0, 8)}-${Date.now()}`,
      assetId,
      snapshotId: snapshot.id,
      passportId: null,
      atirId: null,
      dstId: null,
      validationId: null,
      scientificReviewId: null,
      version,
      status,
      hash: snapshot.hash,
      reason: snapshot.reason,
      createdAt: new Date().toISOString()
    };

    await db.scientific_revisions.put(revision);

    // Update the asset
    const asset = await db.scientific_textile_assets.get(assetId);
    if (asset) {
      asset.currentRevisionId = revision.id;
      if (status === 'Certified') {
        asset.latestCertifiedRevisionId = revision.id;
      }
      asset.updatedAt = new Date().toISOString();
      await db.scientific_textile_assets.put(asset);
    }

    return revision;
  }

  static async createPassport(revision: ScientificRevision, metrics: any): Promise<ScientificPassport> {
    const passport: ScientificPassport = {
      id: `PPT-${revision.hash.substring(0, 8)}-${Date.now()}`,
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
    };

    await db.scientific_passports.put(passport);
    
    revision.passportId = passport.id;
    await db.scientific_revisions.put(revision);

    return passport;
  }

  static async loadSnapshot(snapshotId: string): Promise<GeometrySnapshot | undefined> {
    return await db.geometry_snapshots.get(snapshotId);
  }

  static async loadRevision(revisionId: string): Promise<ScientificRevision | undefined> {
    return await db.scientific_revisions.get(revisionId);
  }

  static async getLatestRevision(assetId: string): Promise<ScientificRevision | undefined> {
    const revisions = await db.scientific_revisions
      .where('assetId').equals(assetId)
      .reverse()
      .sortBy('createdAt');
      
    return revisions[0];
  }

  static async getLatestCertifiedRevision(assetId: string): Promise<ScientificRevision | undefined> {
    const revisions = await db.scientific_revisions
      .where('assetId').equals(assetId)
      .reverse()
      .sortBy('createdAt');
      
    return revisions.find(r => r.status === 'Certified');
  }

  static async certifyRevision(revisionId: string): Promise<ScientificRevision> {
    const revision = await this.loadRevision(revisionId);
    if (!revision) throw new Error("Revision not found");

    revision.status = 'Certified';
    await db.scientific_revisions.put(revision);
    
    const asset = await db.scientific_textile_assets.get(revision.assetId);
    if (asset) {
      asset.latestCertifiedRevisionId = revision.id;
      asset.updatedAt = new Date().toISOString();
      await db.scientific_textile_assets.put(asset);
    }

    return revision;
  }
}
