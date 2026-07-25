// src/ai-demo/engines/renderers/CanvasVideoRenderer.ts
/**
 * CanvasVideoRenderer - Pure Canvas Stream Renderer
 * Takes a ScenarioApplicationIntelligent, executes frame-by-frame TimelineRuntime + OverlayEngine
 * drawing to render high-definition MP4/WebM video streams.
 */

import { IRenderer, RenderOptions, RenderResult } from './Renderer';
import { ScenarioApplicationIntelligent } from '../../types';
import { TimelineRuntime } from '../TimelineRuntime';
import { OverlayEngine } from '../OverlayEngine';
import { AssetManager } from '../../services/AssetManager';
import { AudioExportEngine } from '../../services/AudioExportEngine';

export class CanvasVideoRenderer implements IRenderer {
  public readonly name = 'CanvasVideoRenderer';
  public readonly targetFormat = 'mp4';

  public async render(
    scenario: ScenarioApplicationIntelligent,
    options: RenderOptions = {}
  ): Promise<RenderResult> {
    const fps = options.fps || 30;
    const resolutionWidth = options.resolution === '4k' ? 3840 : options.resolution === '1080p' ? 1920 : 1280;
    const resolutionHeight = options.resolution === '4k' ? 2160 : options.resolution === '1080p' ? 1080 : 720;

    // 1. Preload all visual snapshot assets
    const snapshotUrls = (scenario.snapshots || []).map((s) => s.dataUrl).filter(Boolean) as string[];
    if (options.onProgress) options.onProgress(5, 'Préchargement des captures visuelles...');
    await AssetManager.preloadBatchImages(snapshotUrls);

    // 2. Setup offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = resolutionWidth;
    canvas.height = resolutionHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Impossible d\'obtenir le contexte 2D du Canvas.');
    }

    // Setup MediaRecorder stream with AudioExportEngine multi-track support
    const audioSession = await AudioExportEngine.createExportStream(canvas, fps);
    const mimeType = AudioExportEngine.getSupportedAudioVideoMimeType();

    const lang = scenario.narration?.[0]?.language || 'fr';
    const steps = scenario.timeline || [];

    // Preload TTS audio buffers for all steps in advance
    await AudioExportEngine.preloadAllStepsAudio(audioSession.audioCtx, steps, lang);

    // Adjust step durations to match actual spoken audio length to prevent overlapping voices
    for (const step of steps) {
      const stepText = step.narrationText || step.description || step.title || '';
      const audioDuration = AudioExportEngine.getAudioDuration(stepText);
      if (audioDuration > 0) {
        step.durationSec = Math.max(step.durationSec || 2.5, audioDuration + 0.3);
      }
    }

    const runtime = new TimelineRuntime(scenario);
    const totalDurationSec = runtime.getTotalDuration();
    const totalFrames = Math.ceil(totalDurationSec * fps);

    if (options.onProgress) options.onProgress(15, `Génération des ${totalFrames} frames...`);

    const mediaRecorder = new MediaRecorder(audioSession.combinedStream, {
      mimeType,
      videoBitsPerSecond: 8000000,
      audioBitsPerSecond: 128000
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recordingPromise = new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        audioSession.cleanup();
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });

    mediaRecorder.start();

    let lastStepIndex = -1;

    // 3. Render frame by frame deterministically
    for (let frameIdx = 0; frameIdx < totalFrames; frameIdx++) {
      const currentSec = frameIdx / fps;
      runtime.seek(currentSec);
      const frameState = runtime.getCurrentFrame();

      // Trigger narration audio synthesis on step transition
      if (frameState.activeStep && frameState.activeStep.stepNumber !== lastStepIndex) {
        lastStepIndex = frameState.activeStep.stepNumber;
        const stepDuration = frameState.activeStep.durationSec || 2.0;
        const stepText = frameState.activeStep.narrationText || frameState.activeStep.description || frameState.activeStep.title;
        AudioExportEngine.renderStepNarrationAudio(
          audioSession.audioCtx,
          audioSession.audioDestination,
          stepText,
          stepDuration,
          lastStepIndex,
          lang
        );
      }

      // Clear canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, resolutionWidth, resolutionHeight);

      // Draw snapshot background image
      if (frameState.activeSnapshot?.dataUrl) {
        const cachedImg = AssetManager.getCachedImage(frameState.activeSnapshot.dataUrl);
        if (cachedImg) {
          ctx.drawImage(cachedImg, 0, 0, resolutionWidth, resolutionHeight);
        }
      }

      // Draw visual overlay
      OverlayEngine.renderOverlayFrame({
        ctx,
        width: resolutionWidth,
        height: resolutionHeight,
        step: frameState.activeStep,
        snapshot: frameState.activeSnapshot,
        progressPercent: frameState.totalProgress,
        branding: {
          appName: scenario.application.appName,
          moduleName: scenario.application.moduleName,
          showLogo: true,
          version: scenario.application.version,
          primaryColor: '#0f172a',
          accentColor: '#2563eb'
        }
      });

      if (options.onProgress && frameIdx % 10 === 0) {
        const pct = Math.floor(15 + (frameIdx / totalFrames) * 80);
        options.onProgress(pct, `Rendu frame ${frameIdx + 1}/${totalFrames}...`);
      }

      // Yield event loop
      await new Promise((r) => setTimeout(r, 1000 / fps));
    }

    mediaRecorder.stop();
    const finalBlob = await recordingPromise;
    const blobUrl = URL.createObjectURL(finalBlob);

    if (options.onProgress) options.onProgress(100, 'Vidéo MP4/WebM générée avec succès !');

    return {
      outputFormat: mimeType.includes('mp4') ? 'mp4' : 'webm',
      blobUrl,
      fileSizeBytes: finalBlob.size,
      durationSec: totalDurationSec
    };
  }
}
