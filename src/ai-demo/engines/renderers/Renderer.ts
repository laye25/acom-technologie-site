// src/ai-demo/engines/renderers/Renderer.ts
/**
 * Abstract Renderer Interface
 * Standard contract for scenario rendering outputs (Video MP4, GIF, PDF guide, HTML).
 */

import { ScenarioApplicationIntelligent } from '../../types';

export interface RenderOptions {
  resolution?: '720p' | '1080p' | '4k';
  fps?: number;
  quality?: 'fast' | 'high' | 'ultra';
  includeAudio?: boolean;
  onProgress?: (percent: number, statusMessage: string) => void;
}

export interface RenderResult {
  outputFormat: string;
  blobUrl?: string;
  dataUrl?: string;
  fileSizeBytes?: number;
  durationSec?: number;
  metadata?: Record<string, any>;
}

export interface IRenderer {
  readonly name: string;
  readonly targetFormat: 'mp4' | 'webm' | 'gif' | 'pdf' | 'html';

  render(scenario: ScenarioApplicationIntelligent, options?: RenderOptions): Promise<RenderResult>;
}
