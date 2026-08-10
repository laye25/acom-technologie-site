// src/ai-demo/Assistant/LanguageEngine.ts
// Voice & Language Engine providing Speech Recognition and Spoken Narration (FR/Wolof)

export class LanguageEngine {
  private static speechSynth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static currentResolve: (() => void) | null = null;

  private static isPausedState = false;
  private static speechRate = 1.0;
  private static speechSequenceId = 0;
  private static activeSpeechId = 0;

  /**
   * Set speech speed rate (0.5 to 2.0)
   */
  public static setSpeechRate(rate: number): void {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public static getSpeechRate(): number {
    return this.speechRate;
  }

  /**
   * Check if speech or audio playback is currently active
   */
  public static isSpeaking(): boolean {
    return this.activeSpeechId !== 0 && !this.isPausedState;
  }

  /**
   * Pause current speech audio or synthesis
   */
  public static pauseSpeech(): void {
    this.isPausedState = true;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
      } catch {}
    }
    if (this.speechSynth) {
      try {
        this.speechSynth.pause();
      } catch {}
    }
  }

  /**
   * Resume paused speech audio or synthesis
   */
  public static resumeSpeech(): void {
    this.isPausedState = false;
    if (this.currentAudio) {
      try {
        this.currentAudio.play();
      } catch {}
    }
    if (this.speechSynth) {
      try {
        this.speechSynth.resume();
      } catch {}
    }
  }

  public static isSpeechPaused(): boolean {
    return this.isPausedState;
  }

  /**
   * Stop any current speech or audio playback immediately and resolve pending promises.
   */
  public static stopSpeech(): void {
    this.isPausedState = false;
    this.activeSpeechId = 0;

    if (this.currentResolve) {
      const resolve = this.currentResolve;
      this.currentResolve = null;
      resolve();
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.src = '';
      } catch {}
      this.currentAudio = null;
    }

    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch {}
    }
    this.currentUtterance = null;
  }

  /**
   * Speak a text string in French or Wolof using server proxy /api/tts or Web Speech API.
   * Returns a Promise that resolves ONLY when audio/speech narration finishes completely or fails.
   */
  public static speak(text: string, lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    this.stopSpeech();

    if (!text || !text.trim()) {
      return Promise.resolve();
    }

    const currentToken = ++this.speechSequenceId;
    this.activeSpeechId = currentToken;

    return new Promise<void>((resolve) => {
      this.currentResolve = resolve;

      let resolved = false;
      let timeoutId: any = null;

      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          if (this.activeSpeechId === currentToken) {
            this.activeSpeechId = 0;
          }
          if (this.currentResolve === safeResolveRef) {
            this.currentResolve = null;
          }
          resolve();
        }
      };
      const safeResolveRef = safeResolve;

      // Safety timeout scaled based on text length (12s to 60s) to never prematurely cut off narrations
      const maxMs = Math.min(60000, Math.max(12000, text.length * 160));
      timeoutId = setTimeout(() => {
        if (this.activeSpeechId === currentToken) {
          console.warn('[LanguageEngine] Speak safety timeout reached, forcing resolve');
        }
        safeResolve();
      }, maxMs);

      // Try high-quality server TTS route
      try {
        const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang === 'wo' ? 'fr' : lang}`;
        const audio = new Audio(url);
        this.currentAudio = audio;
        audio.playbackRate = this.speechRate;

        const onEnded = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          safeResolve();
        };

        const onError = () => {
          if (this.currentAudio === audio) {
            this.currentAudio = null;
          }
          if (this.activeSpeechId === currentToken) {
            // Fallback to Web Speech API
            this.speakWebSpeech(text, lang, currentToken).then(safeResolve).catch(safeResolve);
          } else {
            safeResolve();
          }
        };

        audio.addEventListener('ended', onEnded, { once: true });
        audio.addEventListener('error', onError, { once: true });

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            if (this.activeSpeechId === currentToken) {
              onError();
            } else {
              safeResolve();
            }
          });
        }
      } catch {
        if (this.activeSpeechId === currentToken) {
          this.speakWebSpeech(text, lang, currentToken).then(safeResolve).catch(safeResolve);
        } else {
          safeResolve();
        }
      }
    });
  }

  private static speakWebSpeech(text: string, lang: 'fr' | 'wo' = 'fr', token: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.activeSpeechId !== token || !this.speechSynth) {
        resolve();
        return;
      }

      try {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = this.speechRate;
        utterance.pitch = 1.0;
        this.currentUtterance = utterance;

        let resolved = false;
        const done = () => {
          if (!resolved) {
            resolved = true;
            this.currentUtterance = null;
            resolve();
          }
        };

        utterance.onend = done;
        utterance.onerror = done;

        this.speechSynth.speak(utterance);
      } catch {
        this.currentUtterance = null;
        resolve();
      }
    });
  }

  /**
   * Check if speech recognition (native Web Speech API or MediaRecorder + Gemini STT fallback) is supported in current browser
   */
  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const hasNative = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const hasMediaRecorder = !!(navigator.mediaDevices && typeof MediaRecorder !== 'undefined');
    return hasNative || hasMediaRecorder;
  }

  /**
   * Listen for user voice input
   */
  public static listenOnce(
    onResult: (transcript: string) => void,
    onError?: (err: any) => void,
    lang: 'fr-FR' | 'fr' = 'fr-FR'
  ): () => void {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError(new Error('Speech recognition not supported in this browser'));
      return () => {};
    }

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      if (onError) onError(event);
    };

    recognition.start();

    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }
}
