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

  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private autoStopTimer: ReturnType<typeof setTimeout> | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;

  private startProcessingWatchdog(lang: 'fr' | 'wo' = 'fr', maxMs = 12000): void {
    this.clearWatchdog();
    this.watchdogTimer = setTimeout(() => {
      if (!this.active) return;
      if (this.state === 'transcribing' || this.state === 'understanding' || this.state === 'processing') {
        console.warn('[VoiceSessionManager] Watchdog timeout triggered, resetting to listening state');
        this.state = 'listening';
        this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
        this.notify();
        this.startListeningLoop(lang);
      }
    }, maxMs);
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

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

    if (this.autoStopTimer) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch {}
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.mediaStream = null;
    }

    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch {}
      this.recognitionInstance = null;
    }

    LanguageEngine.stopSpeech();
    this.notify();
  }

  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private autoStopTimer: any = null;

  /**
   * Internal Listening loop controller with dual engine support:
   * Engine 1: Native Web Speech API SpeechRecognition
   * Engine 2: Universal MediaRecorder + Gemini 2.0 Flash STT (/api/stt)
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

    // If native Web Speech API class exists, attempt native speech recognition first
    if (SpeechClass) {
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

            try { recognition.stop(); } catch {}
            this.recognitionInstance = null;

            this.handleUserTranscript(text, lang);
          } else {
            this.notify();
          }
        };

        recognition.onerror = (event: any) => {
          if (!this.active) return;
          const errType = event?.error;
          console.warn('[VoiceSessionManager] Native recognition error:', errType);

          // If native speech recognition fails due to browser policy or missing service, fallback to MediaRecorder
          if (errType === 'not-allowed' || errType === 'service-not-allowed' || errType === 'audio-capture' || errType === 'network') {
            if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
              console.log('[VoiceSessionManager] Falling back to MediaRecorder + Gemini STT...');
              this.startMediaRecorderLoop(lang);
              return;
            }
            this.state = 'error';
            this.errorMessage = 'Accès au microphone bloqué ou refusé par le navigateur. Cliquez sur l\'icône de cadenas ou de micro dans la barre d\'adresse pour autoriser.';
            this.statusText = 'Microphone bloqué';
            this.notify();
            return;
          }

          if (errType === 'no-speech' || errType === 'aborted') {
            setTimeout(() => {
              if (this.active && (this.state === 'listening' || this.state === 'speech_detected' || this.state === 'awaiting_confirmation')) {
                this.startListeningLoop(lang);
              }
            }, 300);
          }
        };

        recognition.onend = () => {
          if (!this.active) return;
          if (this.state === 'listening' || this.state === 'speech_detected' || this.state === 'awaiting_confirmation') {
            setTimeout(() => {
              if (this.active && (this.state === 'listening' || this.state === 'awaiting_confirmation')) {
                this.startListeningLoop(lang);
              }
            }, 200);
          }
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('[VoiceSessionManager] Failed native recognition start, falling back to MediaRecorder', e);
      }
    }

    // Fallback: Use MediaRecorder + Gemini 2.0 Flash STT endpoint
    if (navigator.mediaDevices && typeof MediaRecorder !== 'undefined') {
      this.startMediaRecorderLoop(lang);
      return;
    }

    this.state = 'error';
    this.errorMessage = 'Votre navigateur ne supporte pas la capture audio en direct.';
    this.statusText = 'Microphone indisponible';
    this.notify();
  }

  /**
   * MediaRecorder + Gemini 2.0 Flash Audio STT Loop
   */
  private async startMediaRecorderLoop(lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    if (!this.active) return;

    if (this.pendingConfirmation) {
      this.state = 'awaiting_confirmation';
      this.statusText = 'En attente de confirmation (Dites "Oui" ou "Non")';
    } else {
      this.state = 'listening';
      this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
    }
    this.notify();

    try {
      if (!this.mediaStream || !this.mediaStream.active) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const recorder = new MediaRecorder(this.mediaStream, { mimeType });
      this.mediaRecorder = recorder;
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      recorder.onstart = () => {
        if (!this.active) return;
        console.log('[VOICE][01] RECORDING_STARTED');
        this.state = 'speech_detected';
        this.statusText = 'Enregistrement vocal en cours...';
        this.notify();
      };

      recorder.onstop = async () => {
        if (this.autoStopTimer) {
          clearTimeout(this.autoStopTimer);
          this.autoStopTimer = null;
        }

        console.log('[VOICE][04] RECORDER_STOPPED');
        console.log(`[VOICE][05] AUDIO_CHUNKS = ${audioChunks.length}`);

        if (!this.active || audioChunks.length === 0) {
          console.warn('[VOICE] No audio chunks available, restarting listening loop');
          if (this.active) {
            this.state = 'listening';
            this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
            this.notify();
            setTimeout(() => this.startListeningLoop(lang), 300);
          }
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log(`[VOICE][06] BLOB_CREATED size=${audioBlob.size} type=${mimeType}`);

        if (audioBlob.size === 0) {
          console.warn('[VOICE] Audio blob is empty, skipping STT');
          if (this.active) {
            this.state = 'listening';
            this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
            this.notify();
            setTimeout(() => this.startListeningLoop(lang), 300);
          }
          return;
        }

        this.state = 'transcribing';
        this.statusText = 'Transcription Acom IA en cours...';
        this.notify();

        const cleanMime = mimeType.split(';')[0].trim();

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            console.log('[STT][07] REQUEST_STARTED');
            this.startProcessingWatchdog(lang, 15000);
            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio, mimeType: cleanMime, lang })
            });
            const data = await res.json();
            console.log(`[STT][08] REQUEST_COMPLETED status=${res.status}`);

            if (data.transcript && data.transcript.trim()) {
              console.log(`[STT][09] TRANSCRIPT_READY text="${data.transcript}"`);
              this.currentTranscript = data.transcript;
              this.notify();
              await this.handleUserTranscript(data.transcript, lang);
            } else {
              console.warn('[STT] Empty or missing transcript in response');
              this.clearWatchdog();
              if (this.active) {
                this.state = 'listening';
                this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
                this.notify();
                setTimeout(() => this.startListeningLoop(lang), 300);
              }
            }
          } catch (err) {
            console.error('[STT][ERROR] API call failed:', err);
            this.clearWatchdog();
            if (this.active) {
              this.state = 'listening';
              this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
              this.notify();
              setTimeout(() => this.startListeningLoop(lang), 500);
            }
          }
        };
      };

      // Pass timeslice 200ms to continuously gather audio chunks
      recorder.start(200);

      // Auto stop after 5.5s of recording to process speech turn
      this.autoStopTimer = setTimeout(() => {
        if (recorder.state === 'recording') {
          try {
            if (typeof recorder.requestData === 'function') recorder.requestData();
            recorder.stop();
          } catch {}
        }
      }, 5500);

    } catch (err: any) {
      console.error('[VoiceSessionManager] MediaRecorder getUserMedia failed:', err);
      this.state = 'error';
      this.errorMessage = 'Accès au microphone bloqué ou refusé par le navigateur. Veuillez autoriser le micro dans la barre d\'adresse.';
      this.statusText = 'Microphone bloqué';
      this.notify();
    }
  }

  /**
   * Stop recording manually and process speech immediately
   */
  public triggerSendVoiceChunk(): void {
    console.log('[VOICE][02] SEND_NOW_CLICKED');
    if (this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
      try {
        console.log('[VOICE][03] STOP_REQUESTED');
        if (typeof this.mediaRecorder.requestData === 'function') {
          this.mediaRecorder.requestData();
        }
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('[VOICE] Error stopping MediaRecorder:', e);
      }
    } else {
      console.warn('[VOICE] triggerSendVoiceChunk called but MediaRecorder state is:', this.mediaRecorder?.state);
    }
  }

  /**
   * Handle incoming user voice text
   */
  private async handleUserTranscript(text: string, lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    if (!text || !this.active) return;
    console.log(`[AI][10] MESSAGE_SUBMITTED text="${text}"`);

    // Check if user asks to stop voice conversation
    const lower = text.toLowerCase();
    if (lower.includes('arrête la conversation') || lower.includes('stop conversation') || lower.includes('ferme la conversation') || lower.includes('arrête l\'assistant')) {
      const stopText = 'Conversation vocale terminée. À très bientôt !';
      this.state = 'speaking';
      this.statusText = stopText;
      this.notify();
      console.log('[TTS][14] SPEAKING_STARTED');
      await LanguageEngine.speak(stopText, lang);
      console.log('[TTS][15] SPEAKING_COMPLETED');
      this.stopSession();
      return;
    }

    // 1. If currently AWAITING CONFIRMATION for a sensitive action
    if (this.pendingConfirmation) {
      await this.handleVoiceConfirmation(text, lang);
      return;
    }

    // 2. Standard Voice Command Processing
    this.startProcessingWatchdog(lang, 20000);
    try {
      console.log('[AI][11] INTENT_PROCESSING');
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
      console.log(`[AI][12] INTENT_RESOLVED intentId="${intent.intentId}" confidence=${intent.confidence}`);

      // Check for missing parameters requirement
      if (intent.missingParameters && intent.missingParameters.length > 0) {
        const missingList = intent.missingParameters.join(', ');
        const messageFr = `Pour enregistrer la réception, il me manque l'information suivante : ${missingList}. Pouvez-vous me la préciser ?`;
        this.state = 'speaking';
        this.statusText = messageFr;
        this.notify();
        console.log('[TTS][14] SPEAKING_STARTED');
        await LanguageEngine.speak(messageFr, lang);
        console.log('[TTS][15] SPEAKING_COMPLETED');
        return;
      }

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
      console.log(`[AI][13] RESPONSE_READY text="${responseText}"`);

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

      console.log('[TTS][14] SPEAKING_STARTED');
      await LanguageEngine.speak(responseText, lang);
      console.log('[TTS][15] SPEAKING_COMPLETED');
    } catch (err: any) {
      console.error('[AI][ERROR] Voice transcript handling failed:', err);
      const errResponse = "Une erreur s'est produite lors du traitement. Reprenons.";
      this.state = 'speaking';
      this.statusText = errResponse;
      this.notify();
      console.log('[TTS][14] SPEAKING_STARTED');
      await LanguageEngine.speak(errResponse, lang);
      console.log('[TTS][15] SPEAKING_COMPLETED');
    } finally {
      this.clearWatchdog();
      if (this.active) {
        console.log('[VOICE][16] LISTENING_RESUMED');
        this.state = 'listening';
        this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
        this.notify();
        this.startListeningLoop(lang);
      }
    }
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
