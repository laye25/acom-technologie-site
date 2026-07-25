// src/ai-demo/services/PluginSdk.ts
/**
 * PluginSdk - Platform Extension & Integration Architecture
 * Allows registering custom modules, visual overlays, export generators,
 * and knowledge providers into ACOM AI Demo without modifying core runtime code.
 */

import { ScenarioApplicationIntelligent, SaiTimelineStep } from '../types/sai';

export interface OverlayPlugin {
  id: string;
  name: string;
  description: string;
  renderOverlay: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    step?: SaiTimelineStep
  ) => void;
}

export interface ExporterPlugin {
  id: string;
  name: string;
  fileExtension: string;
  generateExport: (scenario: ScenarioApplicationIntelligent) => Promise<Blob | string>;
}

export interface KnowledgeProviderPlugin {
  id: string;
  name: string;
  enrichScenarioKnowledge: (scenario: ScenarioApplicationIntelligent) => Promise<ScenarioApplicationIntelligent>;
}

export class PluginSdk {
  private static overlays: Map<string, OverlayPlugin> = new Map();
  private static exporters: Map<string, ExporterPlugin> = new Map();
  private static knowledgeProviders: Map<string, KnowledgeProviderPlugin> = new Map();

  public static registerOverlay(plugin: OverlayPlugin): void {
    this.overlays.set(plugin.id, plugin);
    console.log(`[PluginSdk] Registered Visual Overlay: ${plugin.name}`);
  }

  public static registerExporter(plugin: ExporterPlugin): void {
    this.exporters.set(plugin.id, plugin);
    console.log(`[PluginSdk] Registered Exporter: ${plugin.name}`);
  }

  public static registerKnowledgeProvider(plugin: KnowledgeProviderPlugin): void {
    this.knowledgeProviders.set(plugin.id, plugin);
    console.log(`[PluginSdk] Registered Knowledge Provider: ${plugin.name}`);
  }

  public static getOverlays(): OverlayPlugin[] {
    return Array.from(this.overlays.values());
  }

  public static getExporters(): ExporterPlugin[] {
    return Array.from(this.exporters.values());
  }

  public static getKnowledgeProviders(): KnowledgeProviderPlugin[] {
    return Array.from(this.knowledgeProviders.values());
  }
}
