// src/ai-demo/Tutorial/TutorialEngine.ts
// Observational Event-Driven Tutorial Engine

import { TutorialScenario, TutorialStep } from '../types';
import { EventBus } from '../BusinessEvents/EventBus';
import { LanguageEngine } from '../Assistant/LanguageEngine';

export const PRESSING_GOLDEN_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_golden',
  title: 'Démonstration Interactive Pressing Acom',
  description: 'Tutoriel guidé pas-à-pas pour maîtriser l\'enregistrement d\'un dépôt, l\'encaissement et la clôture de caisse.',
  saasModule: 'pressing',
  estimatedDurationSec: 120,
  steps: [
    {
      stepNumber: 1,
      title: '1. Recherche ou Création du Client',
      description: 'L\'opérateur saisit le nom du client (ex: "Ibou") ou recherche un client enregistré.',
      targetAcomId: 'pressing.receipt.client_name',
      actionToPerform: 'type',
      inputValue: 'Ibou',
      speechFr: 'Première étape : Saisissez le nom du client dans la fiche de dépôt ou recherchez un client existant.',
      speechWolof: 'Bennel paas : Bindal touru client bi ci fiche bu dépôt bi.',
      expectedEvent: 'CUSTOMER_CREATED'
    },
    {
      stepNumber: 2,
      title: '2. Sélection des Articles & Prestations',
      description: 'Choisissez les vêtements déposés (Chemises, Costumes, Robes) et ajustez les quantités.',
      targetAcomId: 'pressing.receipt.articles_grid',
      actionToPerform: 'click',
      speechFr: 'Deuxième étape : Sélectionnez les articles déposés et ajustez les quantités à traiter.',
      speechWolof: 'Ñarel paas : Tannal yere yi client bi indi te sèt lim bi.',
      expectedEvent: 'ARTICLE_ADDED'
    },
    {
      stepNumber: 3,
      title: '3. Règlement & Acompte',
      description: 'Renseignez l\'acompte versé en espèces ou Wave / Orange Money par le client.',
      targetAcomId: 'pressing.receipt.advance_amount',
      actionToPerform: 'type',
      speechFr: 'Troisième étape : Saisissez le montant perçu ou l\'acompte versé lors du dépôt.',
      speechWolof: 'Ñattel paas : Bindal acompte bi nga jëj ci client bi.',
      expectedEvent: 'PAYMENT_RECORDED'
    },
    {
      stepNumber: 4,
      title: '4. Enregistrer le Ticket de Dépôt',
      description: 'Validez la création de la commande pour générer le ticket de caisse thermique.',
      targetAcomId: 'pressing.receipt.submit_btn',
      actionToPerform: 'click',
      speechFr: 'Quatrième étape : Cliquez sur Enregistrer le Ticket pour valider le dépôt et générer le reçu.',
      speechWolof: 'Ñentel paas : Bëssal Enregistrer le Ticket ngir am ticket bi.',
      expectedEvent: 'RECEIPT_CREATED'
    }
  ]
};

class TutorialEngineService {
  private currentScenario: TutorialScenario | null = null;
  private currentStepIndex = -1;
  private isActive = false;
  private unsubscribeEventBus: (() => void) | null = null;
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public startTutorial(scenario: TutorialScenario = PRESSING_GOLDEN_TUTORIAL): void {
    this.currentScenario = scenario;
    this.currentStepIndex = 0;
    this.isActive = true;

    // Listen to business events
    if (this.unsubscribeEventBus) this.unsubscribeEventBus();
    this.unsubscribeEventBus = EventBus.subscribe('*', (event) => {
      this.handleBusinessEvent(event.type);
    });

    this.speakCurrentStep();
    this.notify();
  }

  public stopTutorial(): void {
    this.isActive = false;
    this.currentStepIndex = -1;
    this.currentScenario = null;
    if (this.unsubscribeEventBus) {
      this.unsubscribeEventBus();
      this.unsubscribeEventBus = null;
    }
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public getCurrentStep(): TutorialStep | null {
    if (!this.isActive || !this.currentScenario || this.currentStepIndex < 0) return null;
    return this.currentScenario.steps[this.currentStepIndex] || null;
  }

  public getStepCount(): number {
    return this.currentScenario ? this.currentScenario.steps.length : 0;
  }

  public isTutorialActive(): boolean {
    return this.isActive;
  }

  public nextStep(): void {
    if (!this.currentScenario || !this.isActive) return;
    if (this.currentStepIndex < this.currentScenario.steps.length - 1) {
      this.currentStepIndex++;
      this.speakCurrentStep();
      this.notify();
    } else {
      // Completed!
      LanguageEngine.speak("Félicitations ! Vous avez terminé le tutoriel guidé Acom IA.", "fr");
      this.stopTutorial();
    }
  }

  private handleBusinessEvent(eventType: string): void {
    const currentStep = this.getCurrentStep();
    if (currentStep && currentStep.expectedEvent === eventType) {
      // Event matched expected step! Automatically progress to next step
      setTimeout(() => {
        this.nextStep();
      }, 1000);
    }
  }

  private speakCurrentStep(): void {
    const step = this.getCurrentStep();
    if (step) {
      LanguageEngine.speak(step.speechFr, 'fr');
    }
  }
}

export const TutorialEngine = new TutorialEngineService();
