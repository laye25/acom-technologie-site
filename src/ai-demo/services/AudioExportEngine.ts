// src/ai-demo/services/AudioExportEngine.ts
/**
 * AudioExportEngine - Web Audio API Audio Track Generator & Stream Synthesizer
 * Solves the missing audio track issue in exported WebM/MP4 videos by creating a real
 * MediaStreamAudioTrack combined with CanvasCaptureMediaStreamTrack.
 */

export interface AudioExportSession {
  audioCtx: AudioContext;
  audioDestination: MediaStreamAudioDestinationNode;
  audioTrack: MediaStreamTrack;
  combinedStream: MediaStream;
  cleanup: () => void;
}

export class AudioExportEngine {
  private static ttsCache = new Map<string, AudioBuffer>();
  private static activeSource: AudioBufferSourceNode | null = null;

  /**
   * Stops any currently playing speech audio source node to prevent overlapping voices
   */
  public static stopCurrentSpeech(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch (e) {
        // Source already stopped or ended
      }
      this.activeSource = null;
    }
  }

  /**
   * Returns exact duration in seconds of preloaded TTS speech audio buffer for a given text string
   */
  public static getAudioDuration(text: string): number {
    const cleanText = (text || '').trim();
    if (!cleanText) return 0;
    const cached = this.ttsCache.get(cleanText);
    return cached ? cached.duration : 0;
  }

  /**
   * Preloads TTS audio buffers for all steps in advance to ensure synchronous, zero-latency playback
   */
  public static async preloadAllStepsAudio(
    audioCtx: AudioContext,
    steps: { narrationText?: string; description?: string; title?: string }[],
    lang: string = 'fr'
  ): Promise<void> {
    const promises = steps.map(async (step) => {
      const text = (step.narrationText || step.description || step.title || '').trim();
      if (!text || this.ttsCache.has(text)) return;

      try {
        const url = `/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
        const res = await fetch(url);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          this.ttsCache.set(text, audioBuffer);
        }
      } catch (err) {
        console.warn(`[AudioExportEngine] Preload failed for text "${text.substring(0, 30)}...":`, err);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Prepares a combined MediaStream containing both Canvas Video Track and Web Audio Audio Track
   */
  public static async createExportStream(
    canvas: HTMLCanvasElement,
    fps: number = 30
  ): Promise<AudioExportSession> {
    const canvasStream = canvas.captureStream(fps);
    const videoTrack = canvasStream.getVideoTracks()[0];

    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtxClass({ sampleRate: 44100 });

    if (audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn('AudioContext resume pending user action:', err);
      }
    }

    const audioDestination = audioCtx.createMediaStreamDestination();
    const audioTrack = audioDestination.stream.getAudioTracks()[0];

    // Combine Video Track + Audio Track into a single multi-track MediaStream
    const combinedTracks: MediaStreamTrack[] = [];
    if (videoTrack) combinedTracks.push(videoTrack);
    if (audioTrack) combinedTracks.push(audioTrack);

    const combinedStream = new MediaStream(combinedTracks);

    // Add subtle continuous ambient bed to prevent Opus audio track underflow
    this.addAmbientAudioBed(audioCtx, audioDestination);

    const cleanup = () => {
      try {
        if (audioCtx.state !== 'closed') {
          audioCtx.close();
        }
      } catch (e) {
        // ignore
      }
    };

    return {
      audioCtx,
      audioDestination,
      audioTrack,
      combinedStream,
      cleanup
    };
  }

  /**
   * Renders step narration audio & chime cues into the AudioContext destination node
   */
  public static renderStepNarrationAudio(
    audioCtx: AudioContext,
    destination: MediaStreamAudioDestinationNode,
    narrationText: string,
    durationSec: number,
    stepIndex: number,
    lang: string = 'fr'
  ): void {
    if (audioCtx.state === 'closed') return;

    // 1. Stop any currently playing step speech source to prevent overlapping voices
    this.stopCurrentSpeech();

    const startTime = audioCtx.currentTime + 0.05;

    // 2. Play clean step chime tone at start of step
    this.playStepChime(audioCtx, destination, startTime, stepIndex);

    // 3. Play clear TTS speech audio buffer
    const text = (narrationText || '').trim();
    if (text) {
      const cachedBuffer = this.ttsCache.get(text);
      if (cachedBuffer) {
        try {
          const source = audioCtx.createBufferSource();
          source.buffer = cachedBuffer;

          const gainNode = audioCtx.createGain();
          gainNode.gain.setValueAtTime(1.0, startTime);

          source.connect(gainNode);
          gainNode.connect(destination);

          source.start(startTime + 0.15);
          this.activeSource = source;

          source.onended = () => {
            if (this.activeSource === source) {
              this.activeSource = null;
            }
          };
        } catch (err) {
          console.warn('[AudioExportEngine] Failed to play cached audio buffer:', err);
        }
      } else {
        // Asynchronous fallback fetch if not preloaded
        fetch(`/api/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`)
          .then(r => r.ok ? r.arrayBuffer() : Promise.reject('TTS HTTP error'))
          .then(buf => audioCtx.decodeAudioData(buf))
          .then(audioBuffer => {
            if (audioCtx.state === 'closed') return;
            this.ttsCache.set(text, audioBuffer);
            this.stopCurrentSpeech();

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = audioCtx.createGain();
            gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);
            source.connect(gainNode);
            gainNode.connect(destination);
            source.start(audioCtx.currentTime);
            this.activeSource = source;

            source.onended = () => {
              if (this.activeSource === source) {
                this.activeSource = null;
              }
            };
          })
          .catch((err) => {
            console.warn('[AudioExportEngine] TTS audio fetch error:', err);
          });
      }
    }
  }

  /**
   * Generates dual-tone chime cue for step transitions
   */
  private static playStepChime(
    ctx: AudioContext,
    dest: MediaStreamAudioDestinationNode,
    startTime: number,
    stepIndex: number
  ): void {
    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch based on step
      const baseFreq = 523.25 + (stepIndex % 4) * 65.41; // C5 to F5
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, startTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, startTime); // Fifth harmonic

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(dest);

      osc1.start(startTime);
      osc2.start(startTime);
      osc1.stop(startTime + 0.3);
      osc2.stop(startTime + 0.3);
    } catch (e) {
      console.warn('Failed to play step chime:', e);
    }
  }

  /**
   * Synthesizes human speech narration audio into Web Audio destination stream
   * Emulates formant voice synthesis (F1, F2, F3 resonances, pitch cadence, syllable pulses)
   */
  private static synthesizeSpeechNarration(
    ctx: AudioContext,
    dest: MediaStreamAudioDestinationNode,
    text: string,
    durationSec: number,
    startTime: number
  ): void {
    try {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return;

      const availableTime = Math.max(0.8, durationSec - 0.4);
      const timePerWord = availableTime / words.length;

      // Vocal Tract Master Gain & Filter Network
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18, startTime);
      masterGain.connect(dest);

      // Formant Bandpass Filters (Emulates Human Vocal Tract)
      const f1Filter = ctx.createBiquadFilter(); // F1 (Vowels: 500Hz)
      f1Filter.type = 'bandpass';
      f1Filter.frequency.setValueAtTime(600, startTime);
      f1Filter.Q.setValueAtTime(4.0, startTime);

      const f2Filter = ctx.createBiquadFilter(); // F2 (Vowels: 1800Hz)
      f2Filter.type = 'bandpass';
      f2Filter.frequency.setValueAtTime(1700, startTime);
      f2Filter.Q.setValueAtTime(5.0, startTime);

      f1Filter.connect(masterGain);
      f2Filter.connect(masterGain);

      // Glottal Pulse Generator (Voice Pitch)
      const glottalOsc = ctx.createOscillator();
      glottalOsc.type = 'sawtooth';

      // Pitch contour (Sentence cadence curve)
      const basePitch = 145; // Hz (Natural male/female speech median)
      glottalOsc.frequency.setValueAtTime(basePitch, startTime);

      const glottalGain = ctx.createGain();
      glottalGain.gain.setValueAtTime(0.001, startTime);

      glottalOsc.connect(glottalGain);
      glottalGain.connect(f1Filter);
      glottalGain.connect(f2Filter);

      glottalOsc.start(startTime);

      // Syllable / Word Envelope Automation
      let currentTime = startTime;
      words.forEach((word, wIdx) => {
        const wordDur = Math.max(0.12, timePerWord * 0.85);
        const pauseDur = timePerWord * 0.15;

        // Pitch inflection per word
        const pitchMod = Math.sin((wIdx / words.length) * Math.PI) * 20;
        const currentPitch = basePitch + pitchMod + (word.endsWith('?') ? 25 : word.endsWith('.') ? -15 : 0);

        glottalOsc.frequency.exponentialRampToValueAtTime(Math.max(80, currentPitch), currentTime + 0.02);

        // Word Envelope Attack - Decay
        glottalGain.gain.setValueAtTime(0.001, currentTime);
        glottalGain.gain.linearRampToValueAtTime(0.22, currentTime + 0.03);
        glottalGain.gain.exponentialRampToValueAtTime(0.01, currentTime + wordDur);

        // F1/F2 Formant Shifting for Vowel Sounds in Word
        const f1Freq = 400 + (word.length % 3) * 200;
        const f2Freq = 1200 + (word.length % 4) * 350;
        f1Filter.frequency.setValueAtTime(f1Freq, currentTime);
        f2Filter.frequency.setValueAtTime(f2Freq, currentTime);

        currentTime += wordDur + pauseDur;
      });

      // Stop glottal pulse at end of speech
      glottalGain.gain.setValueAtTime(0.0001, currentTime);
      glottalOsc.stop(currentTime + 0.05);

    } catch (err) {
      console.warn('Speech synthesis waveform generation error:', err);
    }
  }

  /**
   * Adds an ultra-quiet ambient background noise bed to maintain active Opus track stream
   */
  private static addAmbientAudioBed(
    ctx: AudioContext,
    dest: MediaStreamAudioDestinationNode
  ): void {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, ctx.currentTime); // A2 soft tone

      gain.gain.setValueAtTime(0.005, ctx.currentTime); // Nearly imperceptible 0.5% volume

      osc.connect(gain);
      gain.connect(dest);

      osc.start();
    } catch (e) {
      // ignore
    }
  }

  /**
   * Best supported MIME types for video + audio recorder
   */
  public static getSupportedAudioVideoMimeType(): string {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  }
}
