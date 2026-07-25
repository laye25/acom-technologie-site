// src/ai-demo/recorders/ScreenRecorder.ts
// ScreenRecorder: Screen/Window capture engine supporting 720p, 1080p, 1440p, 4K and 30/60 FPS

import { DemoResolution, DemoFPS } from '../types';

export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private isRecording: boolean = false;
  private isPaused: boolean = false;

  public async startCapture(
    resolution: DemoResolution = '1080p',
    fps: DemoFPS = 30
  ): Promise<boolean> {
    try {
      const dim = this.getResolutionDimensions(resolution);

      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: {
          width: { ideal: dim.width, max: dim.width },
          height: { ideal: dim.height, max: dim.height },
          frameRate: { ideal: fps, max: fps }
        },
        audio: true
      };

      this.mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      this.recordedChunks = [];

      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.mediaStream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // chunk every second
      this.isRecording = true;
      this.isPaused = false;

      // Handle user stopping screen share via browser bar
      this.mediaStream.getVideoTracks()[0].onended = () => {
        this.stopCapture();
      };

      return true;
    } catch (err) {
      console.warn('Screen recording cancelled or not supported:', err);
      return false;
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
