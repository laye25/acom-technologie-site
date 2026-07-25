// src/ai-demo/templates/templatesData.ts
// Pre-configured templates for ACOM AI Demo

import { DemoTemplate } from '../types';

export const DEFAULT_DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: 'tpl-marketing',
    name: 'Vidéo Marketing SaaS',
    description: 'Format captivant avec zooms dynamiques, musique rythmée et appel à l\'action pour présenter un module.',
    category: 'marketing',
    icon: '🚀',
    defaultBranding: {
      showLogo: true,
      appName: 'Acom Technologie',
      primaryColor: '#4f46e5',
      showOutroScreen: true
    },
    defaultVideo: {
      aspectRatio: '16:9',
      resolution: '1080p',
      fps: 60,
      format: 'mp4'
    },
    presetStepsPrompt: 'Mets l\'accent sur la rapidité, la simplicité et la valeur ajoutée pour l\'entreprise.'
  },
  {
    id: 'tpl-training',
    name: 'Tutoriel & Formation Utilisateur',
    description: 'Guide pas-à-pas détaillé avec voix claire, pauses explicatives et badges d\'étapes numérotés.',
    category: 'training',
    icon: '🎓',
    defaultBranding: {
      showLogo: true,
      appName: 'Acom Formation',
      primaryColor: '#0284c7',
      showOutroScreen: false
    },
    defaultVideo: {
      aspectRatio: '16:9',
      resolution: '1080p',
      fps: 30,
      format: 'mp4'
    },
    presetStepsPrompt: 'Explique minutieusement chaque champ et bouton en insistant sur les bonnes pratiques.'
  },
  {
    id: 'tpl-social-reels',
    name: 'Format Court TikTok / Shorts (9:16)',
    description: 'Format vertical réactif optimisé pour les réseaux sociaux avec sous-titres dynamiques au centre.',
    category: 'marketing',
    icon: '📱',
    defaultBranding: {
      showLogo: true,
      primaryColor: '#ec4899'
    },
    defaultVideo: {
      aspectRatio: '9:16',
      resolution: '1080p',
      fps: 60,
      format: 'mp4'
    },
    presetStepsPrompt: 'Accélère le rythme et formule des phrases courtes percutantes.'
  },
  {
    id: 'tpl-release',
    name: 'Nouveauté & Release Note',
    description: 'Mise en valeur d\'une nouvelle fonctionnalité livrée sur un SaaS spécifique.',
    category: 'release',
    icon: '✨',
    defaultBranding: {
      showLogo: true,
      primaryColor: '#10b981'
    },
    defaultVideo: {
      aspectRatio: '16:9',
      resolution: '1080p',
      fps: 30,
      format: 'webm'
    },
    presetStepsPrompt: 'Annonce clairement ce qui a changé et le gain de temps obtenu.'
  }
];
