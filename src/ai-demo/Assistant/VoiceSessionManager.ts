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
  private isProcessingAudio = false;

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

  /**
   * Internal Listening loop controller with MediaRecorder + Gemini STT
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

    // Universal MediaRecorder + Gemini 2.0 Flash STT endpoint
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
        if (e.data.size > 0) {
          console.log(`[VOICE] DATA_AVAILABLE size=${e.data.size}`);
          audioChunks.push(e.data);
        }
      };

      recorder.onstart = () => {
        if (!this.active) return;
        console.log('[VOICE] RECORDING_STARTED');
        console.log('[VOICE] SPEECH_DETECTED');
        this.state = 'speech_detected';
        this.statusText = 'Je vous entends... (Parlez librement)';
        this.notify();
      };

      recorder.onstop = async () => {
        if (this.autoStopTimer) {
          clearTimeout(this.autoStopTimer);
          this.autoStopTimer = null;
        }

        console.log('[VOICE] UTTERANCE_COMPLETE');
        console.log('[VOICE] RECORDER_STOPPED');
        console.log(`[VOICE] AUDIO_CHUNKS = ${audioChunks.length}`);

        if (this.isProcessingAudio) {
          console.log('[VOICE] Audio processing already in progress, skipping duplicate onstop');
          return;
        }

        if (!this.active || audioChunks.length === 0) {
          console.warn('[VOICE] NO_SPEECH - No audio chunks recorded');
          if (this.active) {
            this.state = 'speaking';
            this.statusText = 'Je ne vous ai pas entendu. Pouvez-vous répéter ?';
            this.notify();
            await LanguageEngine.speak('Je ne vous ai pas entendu. Pouvez-vous répéter ?', lang);
            if (this.active) {
              console.log('[VOICE] LISTENING_RESUMED');
              this.state = 'listening';
              this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
              this.notify();
              setTimeout(() => this.startListeningLoop(lang), 300);
            }
          }
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log(`[VOICE] BLOB_READY size=${audioBlob.size} type=${mimeType}`);

        if (audioBlob.size === 0) {
          console.warn('[VOICE] NO_SPEECH - Empty audio blob');
          if (this.active) {
            this.state = 'speaking';
            this.statusText = 'Je ne vous ai pas entendu. Pouvez-vous répéter ?';
            this.notify();
            await LanguageEngine.speak('Je ne vous ai pas entendu. Pouvez-vous répéter ?', lang);
            if (this.active) {
              console.log('[VOICE] LISTENING_RESUMED');
              this.state = 'listening';
              this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
              this.notify();
              setTimeout(() => this.startListeningLoop(lang), 300);
            }
          }
          return;
        }

        this.isProcessingAudio = true;
        this.state = 'transcribing';
        this.statusText = 'Demande reçue. Transcription Acom IA en cours...';
        this.notify();

        const cleanMime = mimeType.split(';')[0].trim();

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            console.log('[STT] REQUEST_STARTED');
            this.startProcessingWatchdog(lang, 15000);
            const res = await fetch('/api/stt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Audio, mimeType: cleanMime, lang })
            });
            const data = await res.json();
            console.log(`[STT] RESPONSE_RECEIVED status=${res.status}`);

            if (data.transcript && data.transcript.trim()) {
              console.log(`[STT] TRANSCRIPT_READY text="${data.transcript}"`);
              this.currentTranscript = data.transcript;
              this.notify();
              await this.handleUserTranscript(data.transcript, lang);
            } else {
              console.warn('[STT] UNRECOGNIZED - Empty or unreadable transcript');
              this.clearWatchdog();
              if (this.active) {
                const unrecMsg = 'Je vous ai entendu, mais je n\'ai pas réussi à comprendre votre demande. Pouvez-vous la répéter ?';
                this.state = 'speaking';
                this.statusText = unrecMsg;
                this.notify();
                console.log('[TTS] STARTED');
                await LanguageEngine.speak(unrecMsg, lang);
                console.log('[TTS] COMPLETED');

                if (this.active) {
                  console.log('[VOICE] LISTENING_RESUMED');
                  this.state = 'listening';
                  this.statusText = 'À votre écoute... (Parlez librement)';
                  this.notify();
                  setTimeout(() => this.startListeningLoop(lang), 300);
                }
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
          } finally {
            this.isProcessingAudio = false;
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
    console.log('[VOICE] SEND_NOW_CLICKED');

    if (this.isProcessingAudio) {
      console.warn('[VOICE] Audio processing already in progress, ignoring duplicate send');
      return;
    }

    if (this.state === 'speech_detected' || this.state === 'listening') {
      this.state = 'transcribing';
      this.statusText = 'Préparation de votre message...';
      this.notify();
    }

    if (this.recognitionInstance) {
      console.log('[VOICE] STOP_REQUESTED (SpeechRecognition)');
      try {
        this.recognitionInstance.stop();
      } catch {}
      const text = this.currentTranscript;
      this.recognitionInstance = null;
      if (text && text.trim()) {
        this.handleUserTranscript(text);
      } else {
        if (this.active) {
          this.state = 'listening';
          this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
          this.notify();
          setTimeout(() => this.startListeningLoop(), 300);
        }
      }
      return;
    }

    if (this.mediaRecorder && (this.mediaRecorder.state === 'recording' || this.mediaRecorder.state === 'paused')) {
      try {
        console.log('[VOICE] STOP_REQUESTED');
        if (typeof (this.mediaRecorder as any).requestData === 'function') {
          (this.mediaRecorder as any).requestData();
        }
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('[VOICE] Error stopping MediaRecorder:', e);
      }
    } else {
      console.warn('[VOICE] triggerSendVoiceChunk called but MediaRecorder state is:', this.mediaRecorder?.state);
      if (this.active && this.state !== 'understanding' && this.state !== 'processing' && this.state !== 'speaking') {
        this.state = 'listening';
        this.statusText = 'Enregistrement vocal actif... (Parlez librement)';
        this.notify();
      }
    }
  }

  /**
   * Handle incoming user voice text
   */
  private async handleUserTranscript(text: string, lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    if (!text || !this.active) return;
    console.log(`[AI] MESSAGE_RECEIVED text="${text}"`);

    // Check if user asks to stop voice conversation
    const lower = text.toLowerCase();
    if (lower.includes('arrête la conversation') || lower.includes('stop conversation') || lower.includes('ferme la conversation') || lower.includes('arrête l\'assistant')) {
      const stopText = 'Conversation vocale terminée. À très bientôt !';
      this.state = 'speaking';
      this.statusText = stopText;
      this.notify();
      console.log('[TTS] STARTED');
      await LanguageEngine.speak(stopText, lang);
      console.log('[TTS] COMPLETED');
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
      console.log('[AI] PROCESSING');
      this.state = 'understanding';
      this.statusText = `J'analyse votre demande : "${text}"`;
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
      console.log(`[AI] INTENT_UNDERSTOOD intentId="${intent.intentId}" confidence=${intent.confidence}`);

      // Check for missing parameters requirement
      if (intent.missingParameters && intent.missingParameters.length > 0) {
        const missingList = intent.missingParameters.join(', ');
        const messageFr = `Pour enregistrer la réception, il me manque l'information suivante : ${missingList}. Pouvez-vous me la préciser ?`;
        this.state = 'speaking';
        this.statusText = messageFr;
        this.notify();
        console.log('[TTS] STARTED');
        await LanguageEngine.speak(messageFr, lang);
        console.log('[TTS] COMPLETED');
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
      console.log('[AI] ACTION_EXECUTED');

      // Check message to speak
      const responseText = lang === 'wo' ? (result.messageWolof || result.messageFr) : result.messageFr;
      console.log(`[AI] RESPONSE_READY text="${responseText}"`);

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

      console.log('[TTS] STARTED');
      await LanguageEngine.speak(responseText, lang);
      console.log('[TTS] COMPLETED');
    } catch (err: any) {
      console.error('[AI][ERROR] Voice transcript handling failed:', err);
      const errResponse = "Une erreur s'est produite lors du traitement. Reprenons.";
      this.state = 'speaking';
      this.statusText = errResponse;
      this.notify();
      console.log('[TTS] STARTED');
      await LanguageEngine.speak(errResponse, lang);
      console.log('[TTS] COMPLETED');
    } finally {
      this.clearWatchdog();
      if (this.active) {
        console.log('[VOICE] LISTENING_RESUMED');
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
