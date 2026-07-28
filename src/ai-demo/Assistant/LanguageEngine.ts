// src/ai-demo/Assistant/LanguageEngine.ts
// Voice & Language Engine providing Speech Recognition and Spoken Narration (FR/Wolof)

export class LanguageEngine {
  private static speechSynth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;

  /**
   * Speak a text string in French or Wolof using server proxy /api/tts or Web Speech API.
   */
  public static async speak(text: string, lang: 'fr' | 'wo' = 'fr'): Promise<void> {
    if (!text || !text.trim()) return;

    try {
      // Try high-quality server TTS route
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${lang === 'wo' ? 'fr' : lang}`;
      const audio = new Audio(url);
      await audio.play();
    } catch {
      // Fallback to Web Speech API
      if (this.speechSynth) {
        this.speechSynth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'wo' ? 'fr-FR' : 'fr-FR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        this.speechSynth.speak(utterance);
      }
    }
  }

  /**
   * Stop any current speech
   */
  public static stopSpeech(): void {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
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
