// src/ai-demo/services/DemoVideoSynthesizer.ts
// DemoVideoSynthesizer: High-DPI Video Canvas Renderer & Fallback Synthesizer

import { DemoProject, TimelineStep, BrandingConfig, VideoConfig } from '../types';
import { VideoEngine } from '../video/VideoEngine';

export class DemoVideoSynthesizer {
  /**
   * Synthesizes a WebM video Blob from project timeline steps using VideoEngine canvas compositor
   */
  public static async synthesizeVideoBlob(project: DemoProject): Promise<Blob | null> {
    try {
      const steps: TimelineStep[] = project.timelineSteps && project.timelineSteps.length > 0
        ? project.timelineSteps
        : [
            {
              id: 'fallback-1',
              stepNumber: 1,
              startTimeSec: 0,
              durationSec: 4,
              title: project.title || 'Démonstration ACOM AI Demo',
              description: project.description || 'Aperçu synthétique de la fonctionnalité.',
              narrationText: project.description || 'Bienvenue dans cette démonstration guidée ACOM AI Demo.',
              actionType: 'click',
              zoomLevel: 1.35,
              effectOverlay: 'green_halo',
              x: 600,
              y: 350
            }
          ];

      // Preload step screenshots if any exist
      await VideoEngine.preloadStepScreenshots(steps);

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      const fps = 30;
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
      if (!stream) return null;

      const mimeType = this.getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
          resolve(videoBlob);
        };
      });

      mediaRecorder.start(200);

      const branding: BrandingConfig = project.brandingConfig || {
        showLogo: true,
        appName: 'ACOM SaaS',
        moduleName: project.moduleName || 'Démonstration',
        version: '1.0.0',
        primaryColor: '#7e22ce',
        accentColor: '#10b981'
      };

      const videoConfig: VideoConfig = project.videoConfig || {
        aspectRatio: '16:9',
        resolution: '1080p',
        fps: 30,
        format: 'webm',
        includeNarration: true,
        includeSubtitles: true,
        backgroundMusicVolume: 0.1
      };

      // Render each step on canvas sequentially
      for (let sIdx = 0; sIdx < steps.length; sIdx++) {
        const step = steps[sIdx];
        const prevStep = sIdx > 0 ? steps[sIdx - 1] : undefined;
        const durationSec = Math.max(step.durationSec || 3.0, 2.5);
        const totalFrames = Math.floor(durationSec * fps);

        for (let frame = 0; frame < totalFrames; frame++) {
          const progress = frame / totalFrames;
          VideoEngine.renderStepToCanvas(
            ctx,
            step,
            progress,
            branding,
            videoConfig,
            1280,
            720,
            prevStep
          );
          // Yield execution to browser event loop
          await new Promise((r) => setTimeout(r, 1000 / fps));
        }
      }

      // Stop recorder and produce final blob
      mediaRecorder.stop();
      return await recordPromise;
    } catch (err) {
      console.warn('Failed to synthesize video canvas blob:', err);
      return null;
    }
  }

  private static getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return 'video/webm';
  }
}

