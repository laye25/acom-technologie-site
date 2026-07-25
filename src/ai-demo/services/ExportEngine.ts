// src/ai-demo/services/ExportEngine.ts
// ExportEngine: Handles file exports for videos, subtitles (SRT/VTT/TXT), Markdown/HTML docs, and PDFs

import { DemoProject } from '../types';
import { VideoEngine } from '../video/VideoEngine';
import { DemoManager } from './DemoManager';
import { AudioExportEngine } from './AudioExportEngine';
import toast from 'react-hot-toast';

export class ExportEngine {
  public static async exportVideo(
    project: DemoProject,
    format: 'mp4' | 'mov' | 'webm' | 'gif' = 'mp4'
  ): Promise<void> {
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${format}`;

    // 1. If project already has a stored videoBlobUrl, download it directly
    if (project.videoBlobUrl) {
      try {
        const link = document.createElement('a');
        link.href = project.videoBlobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Téléchargement de la vidéo ${format.toUpperCase()} initié !`);
        return;
      } catch (err) {
        console.warn('Blob URL download failed, re-rendering canvas:', err);
      }
    }

    // 2. Otherwise, render timeline steps to canvas and record to WebM/MP4
    const toastId = toast.loading(`Génération du fichier vidéo ${format.toUpperCase()} en cours...`);

    try {
      const steps = project.timelineSteps || [];
      if (steps.length === 0) {
        toast.dismiss(toastId);
        toast.error("Aucune étape dans la démonstration pour générer la vidéo.");
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast.dismiss(toastId);
        toast.error("Impossible d'initialiser le moteur de rendu vidéo Canvas.");
        return;
      }

      // Initialize AudioExportEngine to generate audio track combined with canvas video track
      const audioSession = await AudioExportEngine.createExportStream(canvas, 30);
      const mimeType = AudioExportEngine.getSupportedAudioVideoMimeType();

      const recorder = new MediaRecorder(audioSession.combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000,
        audioBitsPerSecond: 128000
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordPromise = new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: mimeType });
          audioSession.cleanup();
          resolve(videoBlob);
        };
        recorder.onerror = (e) => {
          audioSession.cleanup();
          reject(e);
        };
      });

      // Preload step screenshots and TTS audio buffers into memory before starting recording
      const lang = project.voiceConfig?.language || 'fr';
      await VideoEngine.preloadStepScreenshots(steps);
      await AudioExportEngine.preloadAllStepsAudio(audioSession.audioCtx, steps, lang);

      recorder.start();

      // Render frames through canvas - Ultra Fast Optimized Loop
      const fps = 15; // 15 fps gives ultra-smooth UI step previews at high rendering speed
      const defaultBranding = {
        showLogo: true,
        logoUrl: '',
        appName: 'ACOM AI Demo',
        moduleName: project.moduleName || 'SaaS',
        version: '1.0.0',
        authorName: 'Acom Technologie',
        showQRCode: false,
        qrCodeUrl: '',
        websiteUrl: 'https://acomtechnologie.com',
        primaryColor: '#4f46e5',
        accentColor: '#10b981',
        showOutroScreen: true
      };
      const defaultVideoConfig = {
        resolution: '1080p' as const,
        fps: 30 as const,
        aspectRatio: '16:9' as const,
        format: format,
        includeNarration: true,
        includeSubtitles: true,
        backgroundMusicVolume: 0.1
      };

      const totalSteps = steps.length;
      for (let i = 0; i < totalSteps; i++) {
        const step = steps[i];
        const stepText = step.narrationText || step.description || step.title || '';
        const audioDuration = AudioExportEngine.getAudioDuration(stepText);
        // Ensure video frame duration matches full spoken audio duration + 0.3s breathing space
        const stepDurationSec = Math.max(step.durationSec || 2.5, audioDuration > 0 ? audioDuration + 0.3 : 2.5);
        const totalFrames = Math.max(15, Math.floor(stepDurationSec * fps));

        // Update progress toast
        const percent = Math.round(((i + 1) / totalSteps) * 100);
        toast.loading(`Génération vidéo ${format.toUpperCase()} (${percent}%)... Étape ${i + 1}/${totalSteps}`, { id: toastId });

        // Synthesize step audio narration & transition chime into Web Audio destination stream
        AudioExportEngine.renderStepNarrationAudio(
          audioSession.audioCtx,
          audioSession.audioDestination,
          step.narrationText || step.description || step.title,
          stepDurationSec,
          i,
          lang
        );

        for (let frame = 0; frame < totalFrames; frame++) {
          const progress = frame / totalFrames;
          VideoEngine.renderStepToCanvas(
            ctx,
            step,
            progress,
            project.brandingConfig || defaultBranding,
            project.videoConfig || defaultVideoConfig
          );
          // 8ms interval per frame for 5x fast rendering engine
          await new Promise((r) => setTimeout(r, 8));
        }
      }

      recorder.stop();
      const finalBlob = await recordPromise;
      const blobUrl = URL.createObjectURL(finalBlob);

      // Save generated blob to project memory
      project.videoBlobUrl = blobUrl;
      DemoManager.saveProject(project);

      // Trigger file download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(toastId);
      toast.success(`Vidéo ${format.toUpperCase()} téléchargée avec succès !`);
    } catch (err) {
      console.error('Failed to export video:', err);
      toast.dismiss(toastId);
      toast.error("Erreur lors de la génération du fichier vidéo.");
    }
  }

  public static downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public static exportSubtitles(project: DemoProject, format: 'srt' | 'vtt' | 'txt'): void {
    const filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_subtitles.${format}`;
    let content = '';

    if (format === 'srt') content = project.subtitles?.srtContent || '';
    else if (format === 'vtt') content = project.subtitles?.vttContent || '';
    else content = project.subtitles?.txtContent || '';

    this.downloadTextFile(content, filename, 'text/plain');
  }

  public static exportDocumentation(project: DemoProject, format: 'md' | 'html'): void {
    const filename = `${project.title.toLowerCase().replace(/\s+/g, '_')}_guide.${format}`;
    let content = '';

    if (format === 'md') content = project.documentation?.userGuideMarkdown || '';
    else content = project.documentation?.userGuideHtml || '';

    const mime = format === 'md' ? 'text/markdown' : 'text/html';
    this.downloadTextFile(content, filename, mime);
  }

  public static triggerPrintPdf(project: DemoProject): void {
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${project.title} - Guide Utilisateur PDF</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .step { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .badge { background: #4f46e5; color: #fff; padding: 3px 8px; border-radius: 10px; font-size: 12px; }
          </style>
        </head>
        <body>
          ${project.documentation?.userGuideHtml || ''}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
  }
}
