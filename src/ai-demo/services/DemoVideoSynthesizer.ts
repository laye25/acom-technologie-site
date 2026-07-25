// src/ai-demo/services/DemoVideoSynthesizer.ts
// DemoVideoSynthesizer: PERMANENTLY DISABLED in favor of real native ScreenRec capture.

import { DemoProject } from '../types';

export class DemoVideoSynthesizer {
  public static async synthesizeVideoBlob(project: DemoProject): Promise<Blob | null> {
    console.warn('[ACOM AI Demo] Synthetic video reconstruction is permanently disabled. Video must be captured natively via ScreenRec.');
    return null;
  }
}
