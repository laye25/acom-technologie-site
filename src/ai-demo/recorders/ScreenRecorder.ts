// src/ai-demo/recorders/ScreenRecorder.ts
// ScreenRecorder: Screen/Window capture engine supporting 720p, 1080p, 1440p, 4K and 30/60 FPS
// ScreenRec Native Architecture: Real display media + mic audio capture

import { DemoResolution, DemoFPS } from '../types';

export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;

  public async startCapture(
    resolution: DemoResolution = '1080p',
    fps: DemoFPS = 30,
    enableMic: boolean = true
  ): Promise<boolean> {
    try {
      const dim = this.getResolutionDimensions(resolution);

      const displayMediaOptions: any = {
        video: {
          width: { ideal: dim.width, max: dim.width },
          height: { ideal: dim.height, max: dim.height },
          frameRate: { ideal: fps, max: fps }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "exclude",
        systemAudio: "include"
      };

      // 1. Capture screen & system audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      this.recordedChunks = [];

      let finalStream = displayStream;

      // 2. Optionally capture microphone & mix audio if available
      if (enableMic && navigator.mediaDevices.getUserMedia) {
        try {
          this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          finalStream = this.mixAudioStreams(displayStream, this.micStream);
        } catch (micErr) {
          console.info('Microphone audio capture optional/unavailable:', micErr);
        }
      }

      this.mediaStream = finalStream;
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(500); // chunk every 500ms for responsiveness
      this.isRecording = true;
      this.isPaused = false;

      // Handle user stopping screen share via browser bar
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          this.stopCapture();
        };
      }

      return true;
    } catch (err) {
      console.warn('Screen recording cancelled or not supported:', err);
      return false;
    }
  }

  private mixAudioStreams(displayStream: MediaStream, micStream: MediaStream): MediaStream {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return displayStream;

      this.audioContext = new AudioCtx();
      const dest = this.audioContext.createMediaStreamDestination();

      const displayAudioTrack = displayStream.getAudioTracks()[0];
      if (displayAudioTrack) {
        const displaySource = this.audioContext.createMediaStreamSource(new MediaStream([displayAudioTrack]));
        displaySource.connect(dest);
      }

      const micAudioTrack = micStream.getAudioTracks()[0];
      if (micAudioTrack) {
        const micSource = this.audioContext.createMediaStreamSource(new MediaStream([micAudioTrack]));
        micSource.connect(dest);
      }

      const mixedAudioTrack = dest.stream.getAudioTracks()[0];
      const videoTrack = displayStream.getVideoTracks()[0];

      const tracks = [videoTrack];
      if (mixedAudioTrack) tracks.push(mixedAudioTrack);

      return new MediaStream(tracks);
    } catch (e) {
      console.warn('Failed to mix audio tracks, falling back to display stream:', e);
      return displayStream;
    }
  }

  public pauseCapture(): void {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      this.mediaRecorder.pause();
      this.isPaused = true;
    }
  }

  public resumeCapture(): void {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
    }
  }

  public async stopCapture(): Promise<Blob | null> {
    if (!this.isRecording) return null;

    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          this.cleanupStream();
          this.isRecording = false;
          this.isPaused = false;
          resolve(blob);
        };
        this.mediaRecorder.stop();
      } else {
        this.cleanupStream();
        this.isRecording = false;
        resolve(null);
      }
    });
  }

  public getStatus(): { isRecording: boolean; isPaused: boolean } {
    return { isRecording: this.isRecording, isPaused: this.isPaused };
  }

  private cleanupStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }

  private getResolutionDimensions(res: DemoResolution): { width: number; height: number } {
    switch (res) {
      case '4K': return { width: 3840, height: 2160 };
      case '1440p': return { width: 2560, height: 1440 };
      case '1080p': return { width: 1920, height: 1080 };
      case '720p':
      default: return { width: 1280, height: 720 };
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }
}

