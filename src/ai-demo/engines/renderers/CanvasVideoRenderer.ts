// src/ai-demo/engines/renderers/CanvasVideoRenderer.ts
/**
 * CanvasVideoRenderer - PERMANENTLY DISABLED
 * Replaced by native page ScreenRec capture.
 */

import { IRenderer, RenderOptions, RenderResult } from './Renderer';
import { ScenarioApplicationIntelligent } from '../../types';

export class CanvasVideoRenderer implements IRenderer {
  public readonly name = 'CanvasVideoRenderer';
  public readonly targetFormat = 'mp4';

  public async render(
    scenario: ScenarioApplicationIntelligent,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    throw new Error('Le rendu vidéo par synthèse Canvas est définitivement désactivé. ACOM AI Demo exige la capture native réelle de l\'écran (ScreenRec).');
  }
}
