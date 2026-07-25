// src/ai-demo/documentation/DocumentationEngine.ts
// DocumentationEngine: Generates User Guides (Markdown/HTML/PDF format), FAQs, and Knowledge Base articles

import { DemoProject, DocExport } from '../types';

export class DocumentationEngine {
  public static generateDocumentationPackage(project: Partial<DemoProject>): DocExport {
    const title = project.title || 'Démonstration Acom Technologie';
    const moduleName = project.moduleName || 'Acom SaaS';
    const pageName = project.pageName || 'Interface';
    const steps = project.timelineSteps || [];

    // Build Markdown User Guide
    let md = `# Guide Utilisateur & Mode Opératoire\n\n`;
    md += `**Logiciel :** Acom Technologie - ${moduleName}\n`;
    md += `**Procédure :** ${pageName}\n`;
    md += `**Date de création :** ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    md += `---\n\n## 1. Vue d'ensemble\n\n${project.description || 'Présentation guidée de la procédure.'}\n\n`;
    md += `## 2. Étapes à suivre pas-à-pas\n\n`;

    steps.forEach((st, idx) => {
      md += `### Étape ${idx + 1} : ${st.title}\n`;
      md += `${st.description}\n\n`;
      md += `* Consigne : ${st.narrationText}\n`;
      if (st.x && st.y) {
        md += `* Emplacement sur l'écran : X=${st.x}px, Y=${st.y}px\n`;
      }
      md += `\n`;
    });

    md += `---\n\n## 3. Foire Aux Questions (FAQ)\n\n`;
    const faqList = project.documentation?.faqList || [
      {
        question: `Où trouver le bouton de validation dans ${pageName} ?`,
        answer: `Le bouton principal d'enregistrement est situé en bas à droite de l'écran ou au bas du formulaire.`
      },
      {
        question: `Que faire en cas d'erreur de saisie ?`,
        answer: `Vérifiez que les champs obligatoires (marqués d'une astérisque rouge) sont correctement renseignés.`
      }
    ];

    faqList.forEach((item, idx) => {
      md += `**Q${idx + 1} : ${item.question}**\n`;
      md += `R : ${item.answer}\n\n`;
    });

    // Build HTML representation
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="color: #4f46e5; margin: 0;">${title}</h1>
          <p style="color: #64748b; margin-top: 5px;">Module : <strong>${moduleName}</strong> | Page : <strong>${pageName}</strong></p>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #6366f1;">
          <h3 style="margin-top: 0; color: #334155;">Mode Opératoire</h3>
          <p style="margin-bottom: 0; line-height: 1.6;">${project.description || ''}</p>
        </div>

        <h2 style="color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Étapes d'exécution</h2>
        ${steps.map((st, i) => `
          <div style="margin-bottom: 20px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="background: #4f46e5; color: white; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 12px;">${i + 1}</span>
              <h4 style="margin: 0; color: #1e293b;">${st.title}</h4>
            </div>
            <p style="margin: 8px 0 4px 0; font-size: 14px; color: #475569;">${st.description}</p>
            <div style="font-size: 13px; color: #6366f1; font-style: italic; background: #eef2ff; padding: 6px 10px; border-radius: 4px;">
              🗣️ Narration IA : "${st.narrationText}"
            </div>
          </div>
        `).join('')}

        <h2 style="color: #334155; margin-top: 30px;">FAQ</h2>
        ${faqList.map(f => `
          <div style="margin-bottom: 12px;">
            <strong style="color: #1e293b;">Q: ${f.question}</strong>
            <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">${f.answer}</p>
          </div>
        `).join('')}
      </div>
    `;

    return {
      userGuideMarkdown: md,
      userGuideHtml: html,
      faqList,
      trainingScript: `Script Formateur : Présentez ${title}. Suivez les ${steps.length} étapes de l'interface.`,
      knowledgeBaseEntry: `KB-${moduleName.toUpperCase()}-${Date.now().toString().slice(-4)}`
    };
  }
}
