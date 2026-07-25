const fs = require('fs');
const file = 'src/ai-demo/voice/VoiceEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const replacement = `
  private static activeAudio: HTMLAudioElement | null = null;

  public static speakText(text: string, config: VoiceConfig, onEnd?: () => void): void {
    if (typeof window === 'undefined') {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeech();

    try {
      const url = \`/api/tts?text=\${encodeURIComponent(text)}&lang=\${encodeURIComponent(config.language)}\`;
      const audio = new Audio(url);
      
      audio.volume = config.volume;
      audio.playbackRate = config.rate;
      
      audio.onended = () => {
        if (onEnd) onEnd();
      };
      
      audio.onerror = () => {
        console.warn('Network TTS failed, falling back to Web Speech API');
        this.fallbackWebSpeech(text, config, onEnd);
      };
      
      audio.play().catch(e => {
        console.warn('Audio play prevented or failed:', e);
        this.fallbackWebSpeech(text, config, onEnd);
      });
      
      this.activeAudio = audio;
    } catch (e) {
      this.fallbackWebSpeech(text, config, onEnd);
    }
  }

  private static fallbackWebSpeech(text: string, config: VoiceConfig, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = config.pitch;
    utterance.rate = config.rate;
    utterance.volume = config.volume;

    const systemVoices = window.speechSynthesis.getVoices();
    const langCode = this.getLangCode(config.language);
    const match = systemVoices.find(v => v.lang.startsWith(langCode));

    if (match) {
      utterance.voice = match;
    } else {
      utterance.lang = langCode;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  public static stopSpeech(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
`;

const startIndex = code.indexOf('  public static speakText(');
const endIndex = code.indexOf('  private static getLangCode');

code = code.substring(0, startIndex) + replacement.trim() + '\n\n' + code.substring(endIndex);

fs.writeFileSync(file, code);
