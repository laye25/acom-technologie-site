// src/ai-demo/Tutorial/ScreenRecorder.ts
// Native Web Screen Recorder leveraging navigator.mediaDevices.getDisplayMedia
// Strictly event-driven and status-honest (no fake recording states)

import { ScreenRecordingStatus } from '../types';

class ScreenRecorderService {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private status: ScreenRecordingStatus = 'idle';
  private recordedBlobUrl: string | null = null;
  private listeners: Set<(status: ScreenRecordingStatus) => void> = new Set();

  public subscribeStatus(listener: (status: ScreenRecordingStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(newStatus: ScreenRecordingStatus): void {
    this.status = newStatus;
    this.listeners.forEach(l => l(newStatus));
  }

  public getStatus(): ScreenRecordingStatus {
    return this.status;
  }

  public getRecordedBlobUrl(): string | null {
    return this.recordedBlobUrl;
  }

  /**
   * Request display media from browser and start recording
   */
  public async startRecording(): Promise<boolean> {
    if (this.status === 'recording') return true;

    this.setStatus('requesting_permission');
    this.recordedChunks = [];
    if (this.recordedBlobUrl) {
      URL.revokeObjectURL(this.recordedBlobUrl);
      this.recordedBlobUrl = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen recording getDisplayMedia is not supported in this environment');
      }

      // Request display stream from browser
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      this.mediaStream = stream;

      // Handle user stopping share from browser bar
      stream.getVideoTracks()[0].onended = () => {
        this.stopRecording();
      };

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm'
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recordedBlobUrl = URL.createObjectURL(blob);
        this.setStatus('stopped');

        // Cleanup tracks
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        }
      };

      recorder.start(1000); // chunk every 1 second
      this.mediaRecorder = recorder;
      this.setStatus('recording');
      return true;
    } catch (err: any) {
      console.warn('[ScreenRecorder] Failed to start screen recording:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        this.setStatus('permission_denied');
      } else {
        this.setStatus('error');
      }
      return false;
    }
  }

  /**
   * Stop current screen recording and generate downloadable blob URL
   */
  public stopRecording(): string | null {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
      this.setStatus('stopped');
    }
    return this.recordedBlobUrl;
  }
}

export const ScreenRecorder = new ScreenRecorderService();
