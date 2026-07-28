// src/ai-demo/Tutorial/TutorialEngine.ts
// Observational Event-Driven Tutorial Engine

import { TutorialScenario, TutorialStep } from '../types';
import { EventBus } from '../BusinessEvents/EventBus';
import { LanguageEngine } from '../Assistant/LanguageEngine';
import { SaaSPageRegistry } from '../Intelligence/SaaSPageRegistry';
import { ContextEngine } from '../Intelligence/ContextEngine';

export const PRESSING_GOLDEN_TUTORIAL: TutorialScenario = {
  id: 'pressing_tutorial_golden',
  title: 'Démonstration Interactive Pressing Acom',
  description: 'Tutoriel guidé pas-à-pas pour maîtriser la création complète d\'un ticket de dépôt pressing.',
  saasModule: 'pressing',
  estimatedDurationSec: 240,
  steps: [
    {
      stepNumber: 1,
      title: '1. Client — Nom complet',
      description: 'L\'opérateur saisit le nom du client (ex: "Ibou") ou recherche un client enregistré.',
      targetAcomId: 'pressing.receipt.client_name',
      actionToPerform: 'type',
      inputValue: 'Ibou',
      speechFr: 'Première étape : Saisissez le nom complet du client dans la fiche de dépôt.',
      speechWolof: 'Bennel paas : Bindal touru client bi ci fiche bu dépôt bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 2,
      title: '2. Client — Téléphone / WhatsApp',
      description: 'Renseignez le numéro de contact du client pour l\'envoi automatique des notifications SMS et WhatsApp.',
      targetAcomId: 'pressing.receipt.client_phone',
      actionToPerform: 'type',
      inputValue: '+221770000000',
      speechFr: 'Deuxième étape : Indiquez le numéro de téléphone pour le suivi WhatsApp et SMS.',
      speechWolof: 'Ñarel paas : Bindal numéro téléphone client bi ngir SMS bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 3,
      title: '3. Client — Email (Facultatif)',
      description: 'Facultatif : Indiquez l\'adresse e-mail si le client désire recevoir son reçu par courrier électronique.',
      targetAcomId: 'pressing.receipt.client_email',
      actionToPerform: 'type',
      speechFr: 'Troisième étape (facultative) : Saisissez l\'adresse e-mail pour la facture numérique, ou passez cette étape.',
      speechWolof: 'Ñattel paas : Bindal e-mail client bi so ko bëggé.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 4,
      title: '4. Commande — Date de Retrait Prévue',
      description: 'Définissez la date estimée de livraison ou de retrait du linge par le client.',
      targetAcomId: 'pressing.receipt.pickup_date',
      actionToPerform: 'type',
      speechFr: 'Quatrième étape : Contrôlez ou modifiez la date de retrait fixée pour le client.',
      speechWolof: 'Ñentel paas : Setal date bi client bi wara ñëw jëli yêre yi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 5,
      title: '5. Commande — Observations & État du Linge (Facultatif)',
      description: 'Facultatif : Notez les éventuelles taches, trous, boutons manquants ou consignes spécifiques de lavage.',
      targetAcomId: 'pressing.receipt.notes',
      actionToPerform: 'type',
      inputValue: 'Col sale, tâche sur la manche droite',
      speechFr: 'Cinquième étape (facultative) : Notez les remarques particulières sur l\'état des habits.',
      speechWolof: 'Juróomél paas : Mën nga bind remarque yi ci yêre yi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 6,
      title: '6. Tarification — Mode de Facturation',
      description: 'Sélectionnez la tarification à l\'article unitaire ou la tarification globale au poids (Kg).',
      targetAcomId: 'pressing.receipt.billing_type_article',
      actionToPerform: 'click',
      speechFr: 'Sixième étape : Choisissez le mode de calcul : par article unitaire ou au poids.',
      speechWolof: 'Juróom-bennél paas : Tannal par article wala par kilo.',
      stepCategory: 'required'
    },
    {
      stepNumber: 7,
      title: '7. Articles — Sélection & Quantités',
      description: 'Définissez les vêtements apportés (Chemises, Costumes, Robes) et ajustez le nombre d\'articles.',
      targetAcomId: 'pressing.receipt.articles_grid',
      actionToPerform: 'click',
      speechFr: 'Septième étape : Sélectionnez les vêtements déposés et ajustez leurs quantités.',
      speechWolof: 'Juróom-ñaarél paas : Tannal yêre yi te sêt lim bi.',
      stepCategory: 'required'
    },
    {
      stepNumber: 8,
      title: '8. Options — Prestations Optionnelles (Facultatif)',
      description: 'Facultatif : Activez les options supplémentaires comme le parfumage, l\'emballage premium ou le détachage spécial.',
      targetAcomId: 'pressing.receipt.supplements',
      actionToPerform: 'click',
      speechFr: 'Huitième étape (facultative) : Proposez des services supplémentaires comme le parfumage ou le détachage.',
      speechWolof: 'Juróom-ñattél paas : Mën nga yokk prestation optionnelle.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 9,
      title: '9. Remise — Type de Remise (Facultatif)',
      description: 'Facultatif : Choisissez entre une remise forfaitaire en FCFA ou un pourcentage de réduction.',
      targetAcomId: 'pressing.receipt.discount_type',
      actionToPerform: 'click',
      speechFr: 'Neuvième étape (facultative) : Choisissez le type de remise si le client bénéficie d\'une réduction.',
      speechWolof: 'Juróom-ñentél paas : Tannal type de remise bu fekké am na réduction.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 10,
      title: '10. Remise — Valeur de Remise (Facultatif)',
      description: 'Facultatif : Saisissez la valeur de la réduction accordée au client.',
      targetAcomId: 'pressing.receipt.discount_value',
      actionToPerform: 'type',
      speechFr: 'Dixième étape (facultative) : Saisissez le montant ou le pourcentage de remise.',
      speechWolof: 'Fukkel paas : Bindal valeur bu remise bi.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 11,
      title: '11. Règlement — Statut de Paiement',
      description: 'Indiquez si la commande est payée d\'avance, partielle (avec acompte) ou impayée (à la livraison).',
      targetAcomId: 'pressing.receipt.payment_status',
      actionToPerform: 'click',
      speechFr: 'Onzième étape : Choisissez le statut de paiement : Payé d\'avance, Acompte versé ou Impayé.',
      speechWolof: 'Fukk ak bennél paas : Tannal statut bu paiement bi.',
      stepCategory: 'conditional'
    },
    {
      stepNumber: 12,
      title: '12. Règlement — Montant Perçu / Acompte',
      description: 'Saisissez la somme réellement perçue par la caisse lors du dépôt.',
      targetAcomId: 'pressing.receipt.advance_amount',
      actionToPerform: 'type',
      speechFr: 'Douzième étape : Saisissez le montant de l\'acompte ou du paiement reçu en caisse.',
      speechWolof: 'Fukk ak ñaarél paas : Bindal montant bi nga jël ci caisse bi.',
      stepCategory: 'conditional'
    },
    {
      stepNumber: 13,
      title: '13. Règlement — Moyen de Règlement',
      description: 'Sélectionnez le canal de paiement utilisé : Espèces, Wave / Orange Money ou Carte bancaire.',
      targetAcomId: 'pressing.receipt.payment_method',
      actionToPerform: 'click',
      speechFr: 'Treizième étape : Indiquez le mode de règlement : Espèces, Wave ou Orange Money.',
      speechWolof: 'Fukk ak ñattél paas : Tannal mode de règlement bi.',
      stepCategory: 'conditional'
    },
    {
      stepNumber: 14,
      title: '14. Contrôle — Reste à Encaisser',
      description: 'Contrôlez le solde restant dû par le client pour la livraison finale.',
      targetAcomId: 'pressing.receipt.remaining_amount',
      actionToPerform: 'observe',
      speechFr: 'Quatorzième étape : Vérifiez le reste à encaisser calculé automatiquement par le système.',
      speechWolof: 'Fukk ak ñentél paas : Setal reste à encaisser bi.',
      stepCategory: 'control'
    },
    {
      stepNumber: 15,
      title: '15. Contrôle — Aperçu Réel du Ticket',
      description: 'Vérifiez la mise en page et les détails sur l\'aperçu thermique du ticket de caisse.',
      targetAcomId: 'pressing.receipt.ticket_preview_box',
      actionToPerform: 'observe',
      speechFr: 'Quinzième étape : Contrôlez l\'aperçu direct du ticket avant enregistrement.',
      speechWolof: 'Fukk ak juróomél paas : Setal ticket bu caisse bi bala nga koy valider.',
      stepCategory: 'control'
    },
    {
      stepNumber: 16,
      title: '16. Finalisation — Enregistrer le Ticket',
      description: 'Validez la création pour générer le numéro de ticket unique, émettre l\'événement métier et afficher le panneau post-création.',
      targetAcomId: 'pressing.receipt.submit_btn',
      actionToPerform: 'click',
      speechFr: 'Seizième étape : Cliquez sur Enregistrer le Ticket pour valider la commande.',
      speechWolof: 'Mujjél paas : Bëssal Enregistrer le Ticket ngir tëj commande bi.',
      expectedEvent: 'RECEIPT_CREATED',
      stepCategory: 'final'
    },
    {
      stepNumber: 17,
      title: '17. Post-Création — Confirmation & Possibilités',
      description: 'Votre ticket a été enregistré avec succès. Plusieurs options sont maintenant disponibles pour l\'imprimer, le télécharger ou le transmettre au client. Je vais vous présenter ces possibilités facultatives.',
      targetAcomId: 'pressing.receipt.post_creation_panel',
      actionToPerform: 'observe',
      speechFr: 'Votre ticket a été enregistré avec succès. Plusieurs options sont maintenant disponibles pour l\'imprimer, le télécharger ou le transmettre au client.',
      speechWolof: 'Am nga ticket bu mucc ayib. Légui mën nga ko imprimer, télécharger wala yónnee client bi.',
      isOptional: true,
      stepCategory: 'info'
    },
    {
      stepNumber: 18,
      title: '18. Impression — Roll (80)',
      description: 'Roll 80 permet d\'utiliser le format de ticket prévu pour une imprimante thermique 80 mm. Choisissez cette option lorsque votre matériel utilise ce format.',
      targetAcomId: 'pressing.receipt.print_roll_80',
      actionToPerform: 'observe',
      speechFr: 'Roll 80 permet d\'utiliser le format de ticket prévu pour une imprimante thermique 80 mm. Choisissez cette option lorsque votre matériel utilise ce format.',
      speechWolof: 'Roll 80 dafay maye nga imprimé ci format thermique 80 mm.',
      isOptional: true,
      stepCategory: 'option'
    },
    {
      stepNumber: 19,
      title: '19. Impression — Roll (58)',
      description: 'Roll 58 permet d\'utiliser un format de ticket adapté aux imprimantes thermiques 58 mm. Utilisez-le si votre imprimante fonctionne avec ce format.',
      targetAcomId: 'pressing.receipt.print_roll_58',
      actionToPerform: 'observe',
      speechFr: 'Roll 58 permet d\'utiliser un format de ticket adapté aux imprimantes thermiques 58 mm. Utilisez-le si votre imprimante fonctionne avec ce format.',
      speechWolof: 'Roll 58 dafay maye nga imprimé ci format 58 mm.',
      isOptional: true,
      stepCategory: 'option'
    },
    {
      stepNumber: 20,
      title: '20. Impression — Format A4',
      description: 'Format A4 permet d\'utiliser une présentation adaptée à une feuille standard A4, notamment lorsque vous souhaitez disposer d\'un document grand format.',
      targetAcomId: 'pressing.receipt.print_a4',
      actionToPerform: 'observe',
      speechFr: 'Format A4 permet d\'utiliser une présentation adaptée à une feuille standard A4, notamment lorsque vous souhaitez disposer d\'un document grand format.',
      speechWolof: 'Format A4 dafay maye nga jël version A4 bu am lépp.',
      isOptional: true,
      stepCategory: 'option'
    },
    {
      stepNumber: 21,
      title: '21. Document — Télécharger PDF',
      description: 'Télécharger PDF permet d\'enregistrer une copie numérique du document sur votre appareil. Vous pourrez ensuite la conserver, l\'imprimer ou la transmettre selon vos besoins.',
      targetAcomId: 'pressing.receipt.download_pdf',
      actionToPerform: 'observe',
      speechFr: 'Télécharger PDF permet d\'enregistrer une copie numérique du document sur votre appareil.',
      speechWolof: 'Télécharger PDF dafay denc fichier PDF bi ci sa appareil.',
      isOptional: true,
      stepCategory: 'optional'
    },
    {
      stepNumber: 22,
      title: '22. Transmission — WhatsApp Client',
      description: 'WhatsApp Client permet de transmettre le ticket directement au client via WhatsApp lorsque son numéro est disponible. Cette action est facultative.',
      targetAcomId: 'pressing.receipt.whatsapp_client',
      actionToPerform: 'observe',
      speechFr: 'WhatsApp Client permet de transmettre le ticket directement au client via WhatsApp lorsque son numéro est disponible.',
      speechWolof: 'WhatsApp Client dafay yónnee ticket bi ci WhatsApp bu client bi.',
      isOptional: true,
      stepCategory: 'conditional'
    },
    {
      stepNumber: 23,
      title: '23. Suivi — Suivi Temps Réel du Gérant',
      description: 'Le logiciel assure automatiquement le suivi du gérant lors de la création du dépôt. L\'e-mail est envoyé en arrière-plan sans intervention de l\'opérateur. Les actions manuelles disponibles dans cette zone servent principalement de solutions de secours.',
      targetAcomId: 'pressing.receipt.manager_tracking',
      actionToPerform: 'observe',
      speechFr: 'Le logiciel assure automatiquement le suivi du gérant en arrière-plan. Les boutons E-mail Gérant et WhatsApp Gérant restent disponibles comme solutions de secours.',
      speechWolof: 'Suivi gérant bi dafay dém en arrière-plan automatiquement. Bouton yi ay secours lañu.',
      isOptional: true,
      stepCategory: 'info'
    },
    {
      stepNumber: 24,
      title: '24. Secours Gérant — E-mail Gérant',
      description: 'L\'e-mail au gérant est normalement envoyé automatiquement. Cette action manuelle reste disponible lorsqu\'une retransmission est nécessaire ou lorsque l\'envoi automatique n\'a pas abouti.',
      targetAcomId: 'pressing.receipt.email_manager',
      actionToPerform: 'observe',
      speechFr: 'L\'e-mail au gérant est envoyé automatiquement. Cette action manuelle reste disponible en cas de secours.',
      speechWolof: 'E-mail gérant ay secours la bu besoin amé.',
      isOptional: true,
      stepCategory: 'fallback'
    },
    {
      stepNumber: 25,
      title: '25. Secours Gérant — WhatsApp Gérant',
      description: 'Si nécessaire, WhatsApp Gérant permet d\'ouvrir WhatsApp afin de transmettre manuellement la facture au gérant lorsqu\'une notification automatique n\'a pas abouti.',
      targetAcomId: 'pressing.receipt.whatsapp_manager',
      actionToPerform: 'observe',
      speechFr: 'WhatsApp Gérant permet d\'ouvrir WhatsApp afin de transmettre manuellement la facture au gérant si besoin.',
      speechWolof: 'WhatsApp Gérant ay option de secours la ngir yónnee facture bi ci gérant bi.',
      isOptional: true,
      stepCategory: 'fallback'
    },
    {
      stepNumber: 26,
      title: '26. Nouveau Cycle — Commencer un Nouveau Client',
      description: 'La réception actuelle est terminée. Lorsque vous êtes prêt à traiter le prochain dépôt, utilisez Commencer un nouveau client pour réinitialiser la réception et démarrer une nouvelle opération.',
      targetAcomId: 'pressing.receipt.new_client',
      actionToPerform: 'observe',
      speechFr: 'Lorsque vous avez terminé avec ce ticket, utilisez Commencer un nouveau client pour réinitialiser la réception et démarrer une nouvelle opération.',
      speechWolof: 'So paré ak ticket bi, bëssal Commencer un Nouveau Client ngir tambali yeneen client.',
      isOptional: true,
      stepCategory: 'next_cycle'
    }
  ]
};

class TutorialEngineService {
  private currentScenario: TutorialScenario | null = null;
  private currentStepIndex = -1;
  private isActive = false;
  private isWaitingForTab = false;
  private waitingMessage: string | null = null;
  private waitingSaas = 'pressing';
  private unsubscribeEventBus: (() => void) | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    ContextEngine.subscribe((context) => {
      if (this.isWaitingForTab && context.currentPage) {
        this.onPageSelected(context.currentPage);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public startTutorialSelection(saasModule: string = 'pressing'): void {
    if (this.isActive) {
      this.stopTutorial();
    }
    this.isWaitingForTab = true;
    this.waitingSaas = saasModule;
    this.waitingMessage = "Sélectionnez l'onglet de la page sur laquelle vous souhaitez lancer le tutoriel.";

    LanguageEngine.speak(this.waitingMessage, 'fr');
    this.notify();
  }

  public cancelTabSelection(): void {
    this.isWaitingForTab = false;
    this.waitingMessage = null;
    LanguageEngine.stopSpeech();
    this.notify();
  }

  public isWaitingForTabSelection(): boolean {
    return this.isWaitingForTab;
  }

  public getWaitingMessage(): string | null {
    return this.waitingMessage;
  }

  public getScenarioForPage(pageId: string): TutorialScenario | undefined {
    if (pageId === 'pressing_receipt') {
      return PRESSING_GOLDEN_TUTORIAL;
    }
    return undefined;
  }

  public async onPageSelected(pageId: string): Promise<void> {
    if (!this.isWaitingForTab) return;

    const pageDef = SaaSPageRegistry.getPage(pageId);
    if (pageDef) {
      const scenario = this.getScenarioForPage(pageId);
      if (scenario) {
        this.isWaitingForTab = false;
        this.waitingMessage = null;
        this.notify();

        const annonce = `${pageDef.name} détectée. Le tutoriel va commencer.`;
        try {
          await LanguageEngine.speak(annonce, 'fr');
        } catch {}

        this.startTutorial(scenario);
      } else {
        const msg = "Cette page est bien reconnue, mais son tutoriel n'est pas encore disponible. Sélectionnez un autre onglet.";
        this.waitingMessage = msg;
        LanguageEngine.speak(msg, 'fr');
        this.notify();
      }
    } else {
      const msg = "Cette page n'est pas encore reconnue pour le tutoriel. Sélectionnez un autre onglet.";
      this.waitingMessage = msg;
      LanguageEngine.speak(msg, 'fr');
      this.notify();
    }
  }

  public startTutorial(scenario: TutorialScenario = PRESSING_GOLDEN_TUTORIAL): void {
    this.isWaitingForTab = false;
    this.waitingMessage = null;
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
    this.isWaitingForTab = false;
    this.waitingMessage = null;
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

  public prevStep(): void {
    if (!this.currentScenario || !this.isActive) return;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.speakCurrentStep();
      this.notify();
    }
  }

  public skipStep(): void {
    this.nextStep();
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
