// src/ai-demo/voice/VoiceEngine.ts
// VoiceEngine: Manages text-to-speech voice models, parameters, and browser speech synthesis

import { VoiceConfig, DemoLanguage } from '../types';

export class VoiceEngine {
  private static defaultVoices: VoiceConfig[] = [
    {
      voiceId: 'fr-FR-Standard-A',
      voiceName: 'Amélie (Français - Pro)',
      gender: 'female',
      language: 'fr',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      provider: 'webspeech'
    },
    {
      voiceId: 'fr-FR-Standard-B',
      voiceName: 'Moustapha (Français - Studio)',
      gender: 'male',
      language: 'fr',
      pitch: 0.95,
      rate: 1.0,
      volume: 1.0,
      provider: 'webspeech'
    },
    {
      voiceId: 'en-US-Standard-A',
      voiceName: 'Sarah (English - US)',
      gender: 'female',
      language: 'en',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      provider: 'webspeech'
    },
    {
      voiceId: 'es-ES-Standard-A',
      voiceName: 'Carlos (Español - ES)',
      gender: 'male',
      language: 'es',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      provider: 'webspeech'
    },
    {
      voiceId: 'ar-SA-Standard-A',
      voiceName: 'Fatima (العربية)',
      gender: 'female',
      language: 'ar',
      pitch: 1.0,
      rate: 0.95,
      volume: 1.0,
      provider: 'webspeech'
    },
    {
      voiceId: 'wo-SN-Standard-A',
      voiceName: 'Awa (Wolof Dakar)',
      gender: 'female',
      language: 'wo',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      provider: 'webspeech'
    },
    {
      voiceId: 'pt-BR-Standard-A',
      voiceName: 'Thiago (Português)',
      gender: 'male',
      language: 'pt',
      pitch: 1.0,
      rate: 1.0,
      volume: 1.0,
      provider: 'webspeech'
    }
  ];

  public static getAvailableVoices(lang?: DemoLanguage): VoiceConfig[] {
    if (!lang) return this.defaultVoices;
    return this.defaultVoices.filter(v => v.language === lang);
  }

  private static activeAudio: HTMLAudioElement | null = null;
  private static activeOnEnd: (() => void) | null = null;

  public static speakText(text: string, config: VoiceConfig, onEnd?: () => void, onPlay?: () => void): void {
    if (typeof window === 'undefined') {
      if (onPlay) onPlay();
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeech();
    this.activeOnEnd = onEnd || null;

    try {
      const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(config.language)}`;
      const audio = new Audio(url);
      
      audio.volume = config.volume;
      audio.playbackRate = config.rate;
      
      if (onPlay) {
        audio.onplaying = () => onPlay();
      }

      audio.onended = () => {
        if (this.activeOnEnd) {
          this.activeOnEnd();
          this.activeOnEnd = null;
        }
      };
      
      audio.onerror = () => {
        console.warn('Network TTS failed, falling back to Web Speech API');
        this.fallbackWebSpeech(text, config, this.activeOnEnd || undefined, onPlay);
      };
      
      audio.play().catch(e => {
        console.warn('Audio play prevented or failed:', e);
        this.fallbackWebSpeech(text, config, this.activeOnEnd || undefined, onPlay);
      });
      
      this.activeAudio = audio;
    } catch (e) {
      this.fallbackWebSpeech(text, config, this.activeOnEnd || undefined, onPlay);
    }
  }

  private static fallbackWebSpeech(text: string, config: VoiceConfig, onEnd?: () => void, onPlay?: () => void): void {
    if (!('speechSynthesis' in window)) {
      if (onPlay) onPlay();
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (onPlay) {
      utterance.onstart = () => onPlay();
    }

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
      if (this.activeOnEnd) {
        this.activeOnEnd();
        this.activeOnEnd = null;
      }
    };
    utterance.onerror = () => {
      if (this.activeOnEnd) {
        this.activeOnEnd();
        this.activeOnEnd = null;
      }
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
    if (this.activeOnEnd) {
      this.activeOnEnd();
      this.activeOnEnd = null;
    }
  }

  private static getLangCode(lang: DemoLanguage): string {
    switch (lang) {
      case 'fr': return 'fr-FR';
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'ar': return 'ar-SA';
      case 'wo': return 'fr-SN'; // fallback to Senegalese French if Wolof native TTS uninstalled
      case 'pt': return 'pt-BR';
      default: return 'fr-FR';
    }
  }
}
