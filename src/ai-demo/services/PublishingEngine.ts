// src/ai-demo/services/PublishingEngine.ts
// PublishingEngine: Manages publishing to Knowledge Base, public links, and embeddable widgets

import { DemoProject } from '../types';

export class PublishingEngine {
  public static publishToKnowledgeBase(project: DemoProject): { success: boolean; kbId: string; url: string } {
    const kbId = `KB-${project.moduleName.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-4)}`;
    const url = `${window.location.origin}/#/blog?kb=${kbId}`;
    return {
      success: true,
      kbId,
      url
    };
  }

  public static generateEmbedHtml(project: DemoProject): string {
    return `<iframe src="${window.location.origin}/#/ai-demo?embed=${project.id}" width="800" height="450" frameborder="0" allowfullscreen></iframe>`;
  }
}
