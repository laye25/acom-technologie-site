// src/ai-demo/templates/TemplateEngine.ts
// TemplateEngine: Manages template selection and applies preset configurations

import { DemoTemplate, DemoProject } from '../types';
import { DEFAULT_DEMO_TEMPLATES } from './templatesData';

export class TemplateEngine {
  public static getTemplates(): DemoTemplate[] {
    return DEFAULT_DEMO_TEMPLATES;
  }

  public static applyTemplateToProject(project: DemoProject, templateId: string): DemoProject {
    const tpl = DEFAULT_DEMO_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return project;

    return {
      ...project,
      brandingConfig: {
        ...project.brandingConfig,
        ...tpl.defaultBranding
      },
      videoConfig: {
        ...project.videoConfig,
        ...tpl.defaultVideo
      }
    };
  }
}
