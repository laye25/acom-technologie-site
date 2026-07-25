// src/ai-demo/integration-tests/pressing-demo/PressingScenario.ts
/**
 * Official Reference Golden Test Scenario - Pressing Demo
 * Scenario: Pressing -> Création d'un ticket -> Encaissement d'un acompte -> Impression
 * Serves as the Golden Dataset contract for platform regression & end-to-end integration tests.
 */

import { ScenarioApplicationIntelligent } from '../../types/sai';

export const GOLDEN_PRESSING_SCENARIO: ScenarioApplicationIntelligent = {
  $schema: 'https://acom.tech/schemas/sai.v1.json',
  id: 'sai-pressing-reference-001',
  version: '1.0.0',
  schemaVersion: '1.0.0',
  metadata: {
    title: 'Acom Pressing - Fiche Réception, Acompte & Ticket',
    description: 'Procédure complète de création de commande pressing, encaissement acompte client et impression du ticket de dépôt.',
    author: 'Chef d\'Atelier Pressing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    merchantId: 'merchant-pressing-001',
    privacyLevel: 'PUBLIC',
    tags: ['pressing', 'ticket', 'acompte', 'impression', 'reference-test'],
    status: 'validated',
    reviewStatus: 'APPROVED',
    qualityScore: 98
  },
  application: {
    appName: 'Acom Pressing',
    moduleName: 'Réception & Dépôt Client',
    pageName: 'Nouvel Enregistrement',
    route: '/pressing/tickets/new',
    version: '2.4.0',
    environment: 'web'
  },
  events: [
    {
      id: 'evt-1',
      timestamp: 0,
      type: 'PAGE_CHANGE',
      module: 'Réception',
      page: 'Nouvel Enregistrement',
      component: 'PageHeader',
      action: 'Navigation vers le formulaire de réception pressing',
      intent: 'Ouverture de l\'écran de dépôt pour un nouveau client',
      privacyLevel: 'PUBLIC',
      merchantId: 'merchant-pressing-001'
    },
    {
      id: 'evt-2',
      timestamp: 1500,
      type: 'INPUT',
      module: 'Réception',
      page: 'Nouvel Enregistrement',
      component: 'ClientSearchInput',
      action: 'Saisie du numéro client / nom',
      intent: 'Identification rapide du client régulier',
      privacyLevel: 'PUBLIC',
      merchantId: 'merchant-pressing-001',
      targetSelector: '#client-search',
      valueMasked: 'M*** Diop'
    },
    {
      id: 'evt-3',
      timestamp: 3200,
      type: 'CLICK',
      module: 'Réception',
      page: 'Nouvel Enregistrement',
      component: 'ArticleSelector',
      action: 'Sélection d\'un costume 2 pièces (nettoyage à sec)',
      intent: 'Ajout de l\'article au panier de traitement',
      privacyLevel: 'PUBLIC',
      merchantId: 'merchant-pressing-001',
      targetSelector: '#btn-item-costume-2p'
    },
    {
      id: 'evt-4',
      timestamp: 5000,
      type: 'INPUT',
      module: 'Réception',
      page: 'Nouvel Enregistrement',
      component: 'AcompteField',
      action: 'Encaissement d\'un acompte de 5 000 FCFA (Espèces)',
      intent: 'Garantie de paiement à la commande',
      privacyLevel: 'PUBLIC',
      merchantId: 'merchant-pressing-001',
      targetSelector: '#acompte-input',
      valueMasked: '5 000 FCFA'
    },
    {
      id: 'evt-5',
      timestamp: 7200,
      type: 'PRINT',
      module: 'Réception',
      page: 'Nouvel Enregistrement',
      component: 'PrintTicketButton',
      action: 'Validation finale et émission du ticket thermique',
      intent: 'Impression du ticket client et de l\'étiquette vêtement',
      privacyLevel: 'PUBLIC',
      merchantId: 'merchant-pressing-001',
      targetSelector: '#btn-validate-print'
    }
  ],
  snapshots: [
    {
      id: 'snap-1',
      timestamp: 0,
      width: 1280,
      height: 720,
      privacyMasksApplied: true,
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="%230f172a"/><text x="100" y="200" fill="%2338bdf8" font-size="42" font-family="sans-serif" font-weight="bold">Acom Pressing - Module Réception</text><text x="100" y="280" fill="%2394a3b8" font-size="24" font-family="sans-serif">Recherche Client &amp; Sélection des articles...</text><rect x="100" y="320" width="1080" height="300" rx="16" fill="%231e293b" stroke="%23334155" stroke-width="2"/><text x="140" y="380" fill="%23f8fafc" font-size="28" font-family="sans-serif">🔍 Client: Mamadou Diop (VIP Pressing)</text><text x="140" y="440" fill="%2338bdf8" font-size="24" font-family="sans-serif">🧺 Article: Costume 2 Pièces (Laine) - 10 000 FCFA</text></svg>'
    },
    {
      id: 'snap-2',
      timestamp: 4000,
      width: 1280,
      height: 720,
      privacyMasksApplied: true,
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="%230f172a"/><text x="100" y="150" fill="%2338bdf8" font-size="42" font-family="sans-serif" font-weight="bold">Acom Pressing - Encaissement Acompte</text><rect x="100" y="220" width="1080" height="420" rx="16" fill="%231e293b" stroke="%2310b981" stroke-width="3"/><text x="140" y="300" fill="%2310b981" font-size="32" font-family="sans-serif" font-weight="bold">💵 Acompte perçu: 5 000 FCFA</text><text x="140" y="360" fill="%23f8fafc" font-size="24" font-family="sans-serif">Solde restant au retrait: 5 000 FCFA</text><rect x="140" y="420" width="400" height="60" rx="12" fill="%232563eb"/><text x="220" y="460" fill="%23ffffff" font-size="22" font-family="sans-serif" font-weight="bold">🖨️ Valider &amp; Imprimer Ticket</text></svg>'
    }
  ],
  timeline: [
    {
      id: 'step-1',
      stepNumber: 1,
      startTimeSec: 0,
      durationSec: 2.5,
      title: 'Ouverture du Formulaire de Dépôt',
      description: 'L\'opérateur accède à l\'interface de création de ticket pressing.',
      actionType: 'PAGE_CHANGE',
      intent: 'Ouverture de l\'écran de dépôt client',
      zoomLevel: 1.0,
      effectOverlay: 'none',
      snapshotId: 'snap-1',
      narrationText: 'Bienvenue dans le module Acom Pressing. Nous commençons par ouvrir le formulaire de réception vêtement.',
      proAdvice: 'Utilisez le raccourci F2 pour ouvrir instantanément un nouveau ticket sans quitter la caisse.'
    },
    {
      id: 'step-2',
      stepNumber: 2,
      startTimeSec: 2.5,
      durationSec: 3.0,
      title: 'Sélection Client & Article Costume',
      description: 'Identification du client et enregistrement d\'un costume 2 pièces.',
      actionType: 'CLICK',
      intent: 'Enregistrement de l\'article dans la commande',
      zoomLevel: 1.25,
      effectOverlay: 'green_halo',
      snapshotId: 'snap-1',
      narrationText: 'Le client est identifié. Nous sélectionnons le costume deux pièces à nettoyer.',
      timeSavingTip: 'La douchette code-barres permet d\'identifier les clients réguliers en moins d\'une seconde.'
    },
    {
      id: 'step-3',
      stepNumber: 3,
      startTimeSec: 5.5,
      durationSec: 3.5,
      title: 'Encaissement de l\'Acompte & Impression',
      description: 'Saisie de l\'acompte de 5 000 FCFA et impression du ticket de caisse thermique.',
      actionType: 'PRINT',
      intent: 'Validation finale et sortie du reçu',
      zoomLevel: 1.35,
      effectOverlay: 'green_halo',
      snapshotId: 'snap-2',
      narrationText: 'Un acompte de cinquante pour cent est saisi. Cliquez sur Valider et Imprimer pour sortir le ticket thermique.',
      proAdvice: 'L\'acompte réduit le risque d\'impayés et garantit la trésorerie de l\'atelier.'
    }
  ],
  knowledge: [
    {
      id: 'k-1',
      stepId: 'step-3',
      conceptName: 'Acompte Obligatoire Pressing',
      summary: 'Système d\'encaissement d\'acompte partiel ou total à la réception.',
      businessObjective: 'Garantir les frais de produits solvants et éliminer les vêtements abandonnés.',
      proAdvice: 'Fixer la règle d\'acompte par défaut à 50% dans les paramètres d\'Acom Pressing.',
      timeSavingTip: 'L\'imprimante thermique édite simultanément le ticket client et le bon de lavage aggrafable.',
      faqEntries: [
        {
          question: 'Que faire si le client souhaite payer la totalité au retrait ?',
          answer: 'Il suffit de laisser le champ acompte à 0. Le ticket mentionnera "Reste à payer: 100%".'
        }
      ]
    }
  ],
  narration: [
    {
      id: 'narr-1',
      language: 'fr',
      voiceId: 'fr-FR-Wavenet-C',
      subtitlesSrt: `1\n00:00:00,000 --> 00:00:02,500\nBienvenue dans Acom Pressing. Ouverture du module de dépôt.\n\n2\n00:00:02,500 --> 00:00:05,500\nSélection du client et ajout du costume deux pièces.\n\n3\n00:00:05,500 --> 00:00:09,000\nEncaissement de l'acompte et impression immédiate du ticket thermique.`,
      subtitlesVtt: `WEBVTT\n\n00:00.000 --> 00:02.500\nBienvenue dans Acom Pressing. Ouverture du module de dépôt.\n\n00:02.500 --> 00:05.500\nSélection du client et ajout du costume deux pièces.\n\n00:05.500 --> 00:09.000\nEncaissement de l'acompte et impression immédiate du ticket thermique.`
    }
  ],
  diagnostics: {
    overallScore: 98,
    readabilityScore: 99,
    rhythmScore: 97,
    pedagogyScore: 98,
    deadTimeTrimmedSec: 1.2,
    suggestions: []
  },
  exports: {
    pdfGuideMarkdown: '# Guide Pratique - Acom Pressing\n## Procédure d\'Enregistrement & Acompte\n1. Saisir le client\n2. Ajouter les articles\n3. Encaisser l\'acompte',
    htmlDoc: '<div class="guide"><h1>Guide Acom Pressing</h1></div>'
  },
  history: [
    {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      author: 'Chef d\'Atelier',
      changesDescription: 'Création initiale du scénario de référence Pressing'
    }
  ],
  extensions: {
    pressingConfig: {
      defaultPrinter: 'Thermal-80mm',
      autoPrintEtiquette: true
    }
  }
};
