// src/ai-demo/Assistant/LanguageEngine.ts
// Voice & Language Engine providing Speech Recognition and Spoken Narration (FR/Wolof)

export class LanguageEngine {
  private static speechSynth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentAudio: HTMLAudioElement | null = null;
  private static currentResolve: (() => void) | null = null;

  /**
   * Stop any current speech or audio playback immediately and resolve pending promises.
   */
  public static stopSpeech(): void {
    if (this.currentResolve) {
      const resolve = this.currentResolve;
      this.currentResolve = null;
      resolve();
    }

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {}
      this.currentAudio = null;
    }

    if (this.speechSynth) {
      try {
        this.speechSynth.cancel();
      } catch {}
    }
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

    return new Promise<void>((resolve) => {
      this.currentResolve = resolve;

      let resolved = false;
      let timeoutId: any = null;

      const safeResolve = () => {
        if (!resolved) {
          resolved = true;
          if (timeoutId) clearTimeout(timeoutId);
          if (this.currentResolve === safeResolveRef) {
            this.currentResolve = null;
          }
          resolve();
        }
      };
      const safeResolveRef = safeResolve;

      // Max safety timeout (3s to 8s max based on text length)
      const maxMs = Math.min(8000, Math.max(3000, text.length * 80));
      timeoutId = setTimeout(() => {
        console.warn('[LanguageEngine] Speak safety timeout reached, forcing resolve');
        safeResolve();
      }, maxMs);

      // Try high-quality server TTS route
      try {
        const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang === 'wo' ? 'fr' : lang}`;
        const audio = new Audio(url);
        this.currentAudio = audio;

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
          // Fallback to Web Speech API
          this.speakWebSpeech(text, lang).then(safeResolve).catch(safeResolve);
        };

        audio.addEventListener('ended', onEnded, { once: true });
        audio.addEventListener('error', onError, { once: true });

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            onError();
          });
        }
      } catch {
        this.speakWebSpeech(text, lang).then(safeResolve).catch(safeResolve);
      }
    });
  }

  private static speakWebSpeech(text: string, lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!this.speechSynth) {
        resolve();
        return;
      }

      try {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'wo' ? 'fr-FR' : 'fr-FR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        let resolved = false;
        const done = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        utterance.onend = done;
        utterance.onerror = done;

        this.speechSynth.speak(utterance);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Check if speech recognition is available in current browser
   */
  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
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
