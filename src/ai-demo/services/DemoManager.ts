// src/ai-demo/services/DemoManager.ts
// DemoManager: Central manager for project persistence, CRUD operations, and metrics

import { DemoProject } from '../types';
import { BrandingEngine } from './BrandingEngine';
import { VoiceEngine } from '../voice/VoiceEngine';

const STORAGE_KEY = 'acom_ai_demo_projects_v1';

export class DemoManager {
  private static projects: DemoProject[] = [];

  public static loadProjects(): DemoProject[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.projects = JSON.parse(raw);
      } else {
        this.projects = this.getInitialSampleProjects();
        this.saveProjects();
      }
    } catch (e) {
      this.projects = this.getInitialSampleProjects();
    }
    return this.projects;
  }

  public static saveProjects(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
    } catch (e) {
      console.warn('Could not save demo projects to localStorage', e);
    }
  }

  public static getAllProjects(): DemoProject[] {
    if (this.projects.length === 0) {
      this.loadProjects();
    }
    return [...this.projects];
  }

  public static getProjectById(id: string): DemoProject | undefined {
    return this.getAllProjects().find(p => p.id === id);
  }

  public static saveProject(project: DemoProject): void {
    const existingIndex = this.projects.findIndex(p => p.id === project.id);
    project.updatedAt = new Date().toISOString();

    if (existingIndex >= 0) {
      this.projects[existingIndex] = project;
    } else {
      this.projects.unshift(project);
    }
    this.saveProjects();
  }

  public static deleteProject(id: string): void {
    this.projects = this.projects.filter(p => p.id !== id);
    this.saveProjects();
  }

  public static createNewProject(
    moduleName: string,
    pageName: string,
    title?: string,
    description?: string
  ): DemoProject {
    const defaultVoice = VoiceEngine.getAvailableVoices('fr')[0];
    const defaultBranding = BrandingEngine.getDefaultBranding();

    const newProject: DemoProject = {
      id: `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: title || `Tutoriel : ${moduleName} - ${pageName}`,
      description: description || `Vidéo de démonstration et documentation guidée pour le module ${moduleName}.`,
      moduleName,
      pageName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      durationSec: 12,
      events: [],
      timelineSteps: [
        {
          id: 'step-init-1',
          stepNumber: 1,
          startTimeSec: 0,
          durationSec: 4.0,
          title: `Accès au module ${moduleName}`,
          description: `Présentation initiale de l'interface ${pageName}.`,
          narrationText: `Bienvenue dans la présentation de la page ${pageName} du module ${moduleName}.`,
          actionType: 'page_change',
          zoomLevel: 1.0,
          effectOverlay: 'none'
        },
        {
          id: 'step-init-2',
          stepNumber: 2,
          startTimeSec: 4.0,
          durationSec: 4.0,
          title: `Création & Saisie`,
          description: `Cliquez sur le bouton principal pour démarrer la saisie.`,
          narrationText: `Cliquez sur le bouton principal pour saisir les nouvelles informations dans le système.`,
          actionType: 'click',
          zoomLevel: 1.3,
          effectOverlay: 'green_halo',
          x: 450,
          y: 280
        },
        {
          id: 'step-init-3',
          stepNumber: 3,
          startTimeSec: 8.0,
          durationSec: 4.0,
          title: `Enregistrement des données`,
          description: `Validez le formulaire pour confirmer l'opération.`,
          narrationText: `Validez le formulaire. Les données sont instantanément enregistrées et synchronisées.`,
          actionType: 'submit',
          zoomLevel: 1.1,
          effectOverlay: 'green_halo'
        }
      ],
      voiceConfig: defaultVoice,
      videoConfig: {
        resolution: '1080p',
        fps: 30,
        aspectRatio: '16:9',
        format: 'mp4',
        includeNarration: true,
        includeSubtitles: true,
        backgroundMusicVolume: 0.2
      },
      brandingConfig: {
        ...defaultBranding,
        moduleName
      },
      subtitles: {
        srtContent: '1\n00:00:00,000 --> 00:00:04,000\nBienvenue dans la présentation.\n',
        vttContent: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:04.000\nBienvenue dans la présentation.\n',
        txtContent: '[00:00:00] Bienvenue dans la présentation.',
        items: []
      },
      documentation: {
        userGuideMarkdown: `# Guide Utilisateur - ${moduleName}\n\n## Page : ${pageName}\n\nSuivez les instructions pas-à-pas.`,
        userGuideHtml: `<h2>Guide - ${moduleName}</h2><p>Page : ${pageName}</p>`,
        faqList: [
          { question: `Comment accéder à cette page ?`, answer: `Accédez via le menu principal -> ${moduleName}.` }
        ],
        trainingScript: `Formateur : Présentez la page ${pageName}.`,
        knowledgeBaseEntry: `KB-${moduleName}`
      },
      status: 'ready',
      isTrainingMode: false,
      tags: [moduleName, pageName, 'ACOM AI Demo']
    };

    this.saveProject(newProject);
    return newProject;
  }

  private static getInitialSampleProjects(): DemoProject[] {
    return [
      {
        id: 'demo-sample-couture-1',
        title: 'Tutoriel : Prise de Mesures Client (Gestion Couture)',
        description: 'Guide complet expliquant la création d\'un client, la saisie des mesures anatomiques et le suivi des commandes de couture.',
        moduleName: 'Gestion Couture',
        pageName: 'Clients & Mesures',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        durationSec: 24,
        events: [],
        timelineSteps: [
          {
            id: 'st-c-1',
            stepNumber: 1,
            startTimeSec: 0,
            durationSec: 6.0,
            title: 'Ouverture du Carnet de Clients',
            description: 'Accédez au module Couture puis cliquez sur l\'onglet Clients.',
            narrationText: 'Bienvenue dans le module Gestion Couture. Cliquez sur l\'onglet Clients pour afficher la liste.',
            actionType: 'click',
            zoomLevel: 1.2,
            effectOverlay: 'green_halo',
            x: 220,
            y: 180
          },
          {
            id: 'st-c-2',
            stepNumber: 2,
            startTimeSec: 6.0,
            durationSec: 8.0,
            title: 'Saisie des Mesures Anatomiques',
            description: 'Sélectionnez un client et renseignez le tour de poitrine, tour de taille et longueur de manche.',
            narrationText: 'Saisissez les mesures du client dans le formulaire dédié puis contrôlez la précision.',
            actionType: 'input',
            zoomLevel: 1.4,
            effectOverlay: 'green_halo',
            x: 520,
            y: 340
          },
          {
            id: 'st-c-3',
            stepNumber: 3,
            startTimeSec: 14.0,
            durationSec: 10.0,
            title: 'Génération de la Fiche de Commande',
            description: 'Validez pour imprimer le reçu client avec QR code de suivi.',
            narrationText: 'Validez la commande. Le reçu avec QR code est généré automatiquement.',
            actionType: 'submit',
            zoomLevel: 1.1,
            effectOverlay: 'green_halo',
            x: 820,
            y: 560
          }
        ],
        voiceConfig: VoiceEngine.getAvailableVoices('fr')[0],
        videoConfig: {
          resolution: '1080p',
          fps: 60,
          aspectRatio: '16:9',
          format: 'mp4',
          includeNarration: true,
          includeSubtitles: true,
          backgroundMusicVolume: 0.15
        },
        brandingConfig: BrandingEngine.getDefaultBranding(),
        subtitles: {
          srtContent: '1\n00:00:00,000 --> 00:00:06,000\nBienvenue dans le module Gestion Couture.\n',
          vttContent: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:06.000\nBienvenue dans le module Gestion Couture.\n',
          txtContent: '[00:00:00] Bienvenue dans le module Gestion Couture.',
          items: []
        },
        documentation: {
          userGuideMarkdown: '# Guide Couture - Prise de Mesures\n\n1. Ouvrez l\'onglet Clients.\n2. Saisissez les mesures anatomiques.\n3. Enregistrez.',
          userGuideHtml: '<h2>Guide Couture</h2><p>Prise de mesures pas à pas.</p>',
          faqList: [
            { question: 'Peut-on imprimer le ticket de mesure ?', answer: 'Oui, via le bouton Imprimer Fiche.' }
          ],
          trainingScript: 'Formateur Couture : Montrer la saisie du tour de poitrine.',
          knowledgeBaseEntry: 'KB-COU-01'
        },
        status: 'published',
        isTrainingMode: true,
        tags: ['Couture', 'Clients', 'Mesures', 'Tutoriel']
      },
      {
        id: 'demo-sample-scolaire-2',
        title: 'Démo : Saisie des Notes & Bulletins (Gestion Scolaire)',
        description: 'Tutoriel vidéo pour les enseignants et directeurs concernant la saisie des évaluations et le calcul des moyennes de classe.',
        moduleName: 'Gestion Scolaire',
        pageName: 'Portail Enseignant - Notes',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        durationSec: 18,
        events: [],
        timelineSteps: [
          {
            id: 'st-s-1',
            stepNumber: 1,
            startTimeSec: 0,
            durationSec: 6.0,
            title: 'Sélection de la Classe & Matière',
            description: 'Choisissez la classe concernée et le trimestre d\'évaluation.',
            narrationText: 'Choisissez votre classe et la matière à évaluer pour le trimestre actif.',
            actionType: 'click',
            zoomLevel: 1.2,
            effectOverlay: 'green_halo',
            x: 310,
            y: 210
          },
          {
            id: 'st-s-2',
            stepNumber: 2,
            startTimeSec: 6.0,
            durationSec: 6.0,
            title: 'Saisie Rapide de la Grille de Notes',
            description: 'Saisissez les notes des élèves avec validation automatique.',
            narrationText: 'Entrez les notes des élèves. Les moyennes de classe se calculent instantanément.',
            actionType: 'input',
            zoomLevel: 1.3,
            effectOverlay: 'green_halo',
            x: 600,
            y: 400
          },
          {
            id: 'st-s-3',
            stepNumber: 3,
            startTimeSec: 12.0,
            durationSec: 6.0,
            title: 'Publication sur le Portail Parent',
            description: 'Cliquez sur Transmettre pour notifier les parents sur leur application.',
            narrationText: 'Cliquez sur Transmettre. Les parents reçoivent la notification sur leur smartphone.',
            actionType: 'submit',
            zoomLevel: 1.1,
            effectOverlay: 'green_halo',
            x: 750,
            y: 520
          }
        ],
        voiceConfig: VoiceEngine.getAvailableVoices('fr')[0],
        videoConfig: {
          resolution: '1080p',
          fps: 30,
          aspectRatio: '16:9',
          format: 'mp4',
          includeNarration: true,
          includeSubtitles: true,
          backgroundMusicVolume: 0.1
        },
        brandingConfig: BrandingEngine.getDefaultBranding(),
        subtitles: {
          srtContent: '1\n00:00:00,000 --> 00:00:06,000\nChoisissez votre classe et la matière.\n',
          vttContent: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:06.000\nChoisissez votre classe et la matière.\n',
          txtContent: '[00:00:00] Choisissez votre classe et la matière.',
          items: []
        },
        documentation: {
          userGuideMarkdown: '# Guide Scolaire - Saisie des Notes\n\nSélectionnez la classe et enregistrez.',
          userGuideHtml: '<h2>Guide Scolaire</h2><p>Gestion des évaluations.</p>',
          faqList: [
            { question: 'Les parents reçoivent-ils un SMS ?', answer: 'Oui, si l\'alerte SMS est activée.' }
          ],
          trainingScript: 'Formateur Scolaire : Explication du calcul de coefficient.',
          knowledgeBaseEntry: 'KB-SCO-02'
        },
        status: 'published',
        isTrainingMode: false,
        tags: ['Scolaire', 'Notes', 'Bulletins']
      }
    ];
  }
}
