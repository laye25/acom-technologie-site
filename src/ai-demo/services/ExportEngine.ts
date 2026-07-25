// src/ai-demo/services/ExportEngine.ts
// ExportEngine: Handles file exports for videos, subtitles (SRT/VTT/TXT), Markdown/HTML docs, and PDFs

import { DemoProject } from '../types';
import { VideoStorageService } from './VideoStorageService';
import toast from 'react-hot-toast';

export class ExportEngine {
  public static async exportVideo(
    project: DemoProject,
    format: 'mp4' | 'mov' | 'webm' | 'gif' = 'mp4'
  ): Promise<void> {
    const filename = `${project.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${format}`;

    // 1. Try active project videoBlobUrl
    let downloadUrl = project.videoBlobUrl;

    // 2. Fallback to stored blob from IndexedDB if project object lacks the in-memory URL
    if (!downloadUrl) {
      downloadUrl = (await VideoStorageService.getVideoBlobUrl(project.id)) || undefined;
    }

    // 3. Download if a valid native capture exists
    if (downloadUrl) {
      try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Téléchargement de la vidéo native (${format.toUpperCase()}) initié !`);
        return;
      } catch (err) {
        console.error('Download failed for native video stream:', err);
      }
    }

    // 4. Fail explicitly if no native capture is available (NO synthetic reconstruction)
    toast.error("Capture vidéo indisponible : Aucun enregistrement écran natif (ScreenRec) n'a été capturé lors de cette démonstration.", {
      duration: 5000
    });
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
