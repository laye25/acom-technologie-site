// src/ai-demo/Assistant/VoiceSessionManager.ts
// Intelligent Continuous Voice Session Manager orchestrating STT, NLU, ActionRouter & Voice Loop

import { LanguageEngine } from './LanguageEngine';
import { IntentEngine } from '../Intelligence/IntentEngine';
import { ActionRouter } from '../SaaSGateway/ActionRouter';
import { ContextEngine } from '../Intelligence/ContextEngine';
import { ConversationContext } from './ConversationContext';
import { ConfirmationGuard, PendingConfirmationRequest } from '../SaaSGateway/ConfirmationGuard';

export type VoiceSessionState =
  | 'idle'
  | 'listening'
  | 'speech_detected'
  | 'transcribing'
  | 'understanding'
  | 'processing'
  | 'speaking'
  | 'awaiting_confirmation'
  | 'awaiting_clarification'
  | 'error';

export interface VoiceSessionInfo {
  state: VoiceSessionState;
  active: boolean;
  transcript: string;
  statusText: string;
  errorMessage?: string;
  pendingConfirmation?: PendingConfirmationRequest | null;
}

class VoiceSessionManagerService {
  private active = false;
  private state: VoiceSessionState = 'idle';
  private currentTranscript = '';
  private statusText = '';
  private errorMessage = '';

  private recognitionInstance: any = null;
  private listeners: Set<(info: VoiceSessionInfo) => void> = new Set();

  // Short-term conversational memory
  private sessionMemory: {
    lastCustomer?: string;
    lastAmount?: number;
    lastAction?: string;
  } = {};

  private pendingConfirmation: PendingConfirmationRequest | null = null;
  private unsubscribeGuard: (() => void) | null = null;

  constructor() {
    // Subscribe to ConfirmationGuard
    this.unsubscribeGuard = ConfirmationGuard.subscribe((req) => {
      this.pendingConfirmation = req;
      if (req && this.active) {
        this.handleNewPendingConfirmation(req);
      } else if (!req && this.state === 'awaiting_confirmation') {
        // If pending confirmation was cleared externally (e.g. user clicked modal button)
        this.resumeListeningAfterConfirmation();
      }
      this.notify();
    });
  }

  public subscribe(listener: (info: VoiceSessionInfo) => void): () => void {
    this.listeners.add(listener);
    listener(this.getInfo());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const info = this.getInfo();
    this.listeners.forEach((l) => l(info));
  }

  public getInfo(): VoiceSessionInfo {
    return {
      state: this.state,
      active: this.active,
      transcript: this.currentTranscript,
      statusText: this.statusText,
      errorMessage: this.errorMessage,
      pendingConfirmation: this.pendingConfirmation
    };
  }

  /**
   * Start the continuous conversational voice mode
   */
  public async startSession(lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    if (this.active && this.state !== 'error') return;

    this.active = true;
    this.errorMessage = '';

    if (!LanguageEngine.isSpeechRecognitionSupported()) {
      this.state = 'error';
      this.errorMessage = 'Reconnaissance vocale non supportée sur votre navigateur (Web Speech API absente).';
      this.statusText = 'Microphone indisponible';
      this.notify();
      return;
    }

    this.state = 'speaking';
    this.statusText = 'Acom IA s\'initialise...';
    this.notify();

    // Greeting narration
    const greetingFr = 'Je vous écoute. Que souhaitez-vous faire ?';
    const greetingWo = 'Mangi lay deggo. Lu nga beug def?';
    const textToSpeak = lang === 'wo' ? greetingWo : greetingFr;

    this.statusText = textToSpeak;
    this.notify();

    // Race greeting with a max 2-second timeout so startListeningLoop starts promptly
    await Promise.race([
      LanguageEngine.speak(textToSpeak, lang),
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]);

    if (!this.active) return;

    this.startListeningLoop(lang);
  }

  /**
   * Retry voice session after error or permission grant
   */
  public retrySession(lang: 'fr' | 'wo' = 'fr'): void {
    this.stopSession();
    setTimeout(() => {
      this.startSession(lang);
    }, 200);
  }

  /**
   * Stop continuous voice mode completely
   */
  public stopSession(): void {
    this.active = false;
    this.state = 'idle';
    this.currentTranscript = '';
    this.statusText = 'Mode vocal arrêté';
    this.errorMessage = '';

    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }

    LanguageEngine.stopSpeech();
    this.notify();
  }

  /**
   * Internal SpeechRecognition loop controller
   */
  private startListeningLoop(lang: 'fr' | 'wo' = 'fr'): void {
    if (!this.active) return;

    // Check if we are waiting for confirmation
    if (this.pendingConfirmation) {
      this.state = 'awaiting_confirmation';
      this.statusText = 'En attente de confirmation (Dites "Oui" ou "Non")';
    } else {
      this.state = 'listening';
      this.statusText = 'À votre écoute... (Parlez librement)';
    }
    this.notify();

    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechClass) return;

    try {
      if (this.recognitionInstance) {
        try { this.recognitionInstance.stop(); } catch {}
      }

      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'wo' ? 'fr-FR' : 'fr-FR';

      this.recognitionInstance = recognition;

      recognition.onstart = () => {
        if (!this.active) return;
        if (this.state !== 'awaiting_confirmation') {
          this.state = 'listening';
        }
        this.notify();
      };

      recognition.onspeechstart = () => {
        if (!this.active) return;
        this.state = 'speech_detected';
        this.statusText = 'Détection vocale...';
        this.notify();
      };

      recognition.onresult = (event: any) => {
        if (!this.active) return;
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = (finalTranscript || interimTranscript).trim();
        this.currentTranscript = text;

        if (finalTranscript) {
          this.state = 'transcribing';
          this.statusText = `Récitation : "${text}"`;
          this.notify();

          // Stop recognition immediately before processing & speaking so mic doesn't catch own voice
          try { recognition.stop(); } catch {}
          this.recognitionInstance = null;

          // Process transcript
          this.handleUserTranscript(text, lang);
        } else {
          this.notify();
        }
      };

      recognition.onerror = (event: any) => {
        if (!this.active) return;
        const errType = event?.error;
        console.warn('[VoiceSessionManager] Recognition error:', errType);

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          this.state = 'error';
          this.errorMessage = 'Accès au microphone bloqué ou refusé par le navigateur. Cliquez sur l\'icône de cadenas ou de micro dans la barre d\'adresse pour autoriser.';
          this.statusText = 'Microphone bloqué';
          // Keep active = true so the orb stays visible with error info and retry button
          this.notify();
          return;
        }

        if (errType === 'no-speech' || errType === 'aborted') {
          // Silent restart after short delay if active
          setTimeout(() => {
            if (this.active && (this.state === 'listening' || this.state === 'speech_detected' || this.state === 'awaiting_confirmation')) {
              this.startListeningLoop(lang);
            }
          }, 300);
        }
      };

      recognition.onend = () => {
        if (!this.active) return;
        // If recognition ended naturally without result and we are still in listening/confirmation mode, restart loop
        if (this.state === 'listening' || this.state === 'speech_detected' || this.state === 'awaiting_confirmation') {
          setTimeout(() => {
            if (this.active && (this.state === 'listening' || this.state === 'awaiting_confirmation')) {
              this.startListeningLoop(lang);
            }
          }, 200);
        }
      };

      recognition.start();
    } catch (err) {
      console.error('[VoiceSessionManager] Failed to start recognition', err);
      setTimeout(() => {
        if (this.active) this.startListeningLoop(lang);
      }, 500);
    }
  }

  /**
   * Handle incoming user voice text
   */
  private async handleUserTranscript(text: string, lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    if (!text || !this.active) return;

    // Check if user asks to stop voice conversation
    const lower = text.toLowerCase();
    if (lower.includes('arrête la conversation') || lower.includes('stop conversation') || lower.includes('ferme la conversation') || lower.includes('arrête l\'assistant')) {
      const stopText = 'Conversation vocale terminée. À très bientôt !';
      this.state = 'speaking';
      this.statusText = stopText;
      this.notify();
      await LanguageEngine.speak(stopText, lang);
      this.stopSession();
      return;
    }

    // 1. If currently AWAITING CONFIRMATION for a sensitive action
    if (this.pendingConfirmation) {
      await this.handleVoiceConfirmation(text, lang);
      return;
    }

    // 2. Standard Voice Command Processing
    this.state = 'understanding';
    this.statusText = `Analyse : "${text}"`;
    this.notify();

    // Log user message to conversation history
    ConversationContext.addUserMessage(text);

    // Contextual enrichment for pronouns ("il", "ses factures", etc.)
    let processedPrompt = text;
    if ((lower.includes('doit-il') || lower.includes('doit il') || lower.includes('ses factures') || lower.includes('son solde')) && this.sessionMemory.lastCustomer) {
      processedPrompt = `${text} pour le client ${this.sessionMemory.lastCustomer}`;
    }

    // NLU Parse
    const saasContext = ContextEngine.getContext();
    const intent = await IntentEngine.parseIntent(processedPrompt, saasContext);

    // Save entity in memory if found
    if (intent.parameters?.query) {
      this.sessionMemory.lastCustomer = intent.parameters.query;
    } else if (intent.parameters?.clientName) {
      this.sessionMemory.lastCustomer = intent.parameters.clientName;
    }

    this.state = 'processing';
    this.statusText = 'Exécution en cours...';
    this.notify();

    // Execute via ActionRouter
    const result = await ActionRouter.dispatchIntent(intent, saasContext);

    // Check message to speak
    const responseText = lang === 'wo' ? (result.messageWolof || result.messageFr) : result.messageFr;

    // Log assistant response in ConversationContext
    ConversationContext.addAssistantMessage(
      result.messageFr,
      result.messageWolof,
      result.actionId,
      result.success ? 'success' : 'failed',
      result.data
    );

    // Speak response
    this.state = 'speaking';
    this.statusText = responseText;
    this.notify();

    await LanguageEngine.speak(responseText, lang);

    if (!this.active) return;

    // Return to continuous listening loop
    this.startListeningLoop(lang);
  }

  /**
   * Handle Voice response when awaiting confirmation
   */
  private async handleVoiceConfirmation(text: string, lang: 'fr' | 'wo'): Promise<void> {
    const lower = text.toLowerCase();

    const isConfirmed =
      lower.includes('oui') ||
      lower.includes('confirme') ||
      lower.includes('valide') ||
      lower.includes('d\'accord') ||
      lower.includes('c\'est bon') ||
      lower.includes('ok') ||
      lower.includes('yes') ||
      lower.includes('waaw');

    const isRejected =
      lower.includes('non') ||
      lower.includes('annule') ||
      lower.includes('refuse') ||
      lower.includes('pas question') ||
      lower.includes('stop') ||
      lower.includes('cancel') ||
      lower.includes('déet');

    if (isConfirmed) {
      this.state = 'processing';
      this.statusText = 'Confirmation reçue. Exécution...';
      this.notify();

      ConfirmationGuard.resolvePendingRequest(true);
      // Wait a moment for execution result to be logged/spoken
    } else if (isRejected) {
      this.state = 'speaking';
      const cancelMsg = 'Opération sensible annulée.';
      this.statusText = cancelMsg;
      this.notify();

      ConfirmationGuard.resolvePendingRequest(false);

      ConversationContext.addAssistantMessage(cancelMsg, 'Annulet nañu ko.', undefined, 'failed');
      await LanguageEngine.speak(cancelMsg, lang);

      if (this.active) {
        this.startListeningLoop(lang);
      }
    } else {
      // Unclear answer
      this.state = 'speaking';
      const repeatMsg = 'Je n\'ai pas bien compris. Veuillez répondre par "Oui" pour confirmer ou par "Non" pour annuler.';
      this.statusText = repeatMsg;
      this.notify();

      await LanguageEngine.speak(repeatMsg, lang);

      if (this.active) {
        this.startListeningLoop(lang);
      }
    }
  }

  /**
   * Called when a new pending confirmation request is generated
   */
  private async handleNewPendingConfirmation(req: PendingConfirmationRequest): Promise<void> {
    this.state = 'speaking';
    const actionDesc = req.action.name || req.action.id;
    let promptMsg = `Vous souhaitez ${actionDesc.toLowerCase()}. Confirmez-vous cette opération ?`;

    if (req.action.id === 'pressing.closeCashRegister' && req.params?.actualCashCounted) {
      promptMsg = `Vous souhaitez clôturer la caisse avec ${req.params.actualCashCounted} FCFA comptés. Confirmez-vous cette opération ?`;
    }

    this.statusText = promptMsg;
    this.notify();

    await LanguageEngine.speak(promptMsg, ConversationContext.getLanguage());

    if (this.active && this.pendingConfirmation) {
      this.state = 'awaiting_confirmation';
      this.statusText = 'En attente de confirmation vocal (Dites "Oui" ou "Non")';
      this.notify();
      this.startListeningLoop(ConversationContext.getLanguage());
    }
  }

  private async resumeListeningAfterConfirmation(): Promise<void> {
    if (this.active && this.state === 'awaiting_confirmation') {
      this.startListeningLoop(ConversationContext.getLanguage());
    }
  }
}

export const VoiceSessionManager = new VoiceSessionManagerService();
