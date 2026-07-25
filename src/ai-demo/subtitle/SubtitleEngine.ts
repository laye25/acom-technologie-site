// src/ai-demo/subtitle/SubtitleEngine.ts
// SubtitleEngine: Generates perfectly synchronized SRT, VTT, and TXT subtitle files from timeline steps

import { TimelineStep, SubtitleConfig, SubtitleItem } from '../types';

export class SubtitleEngine {
  public static generateSubtitles(timelineSteps: TimelineStep[]): SubtitleConfig {
    if (!timelineSteps || timelineSteps.length === 0) {
      return { srtContent: '', vttContent: '', txtContent: '', items: [] };
    }

    const items: SubtitleItem[] = [];
    let currentTimeSec = 0;

    timelineSteps.forEach((step, index) => {
      const duration = step.durationSec || 3.5;
      const startSec = step.startTimeSec !== undefined ? step.startTimeSec : currentTimeSec;
      const endSec = startSec + duration;

      items.push({
        id: `sub-${index + 1}`,
        index: index + 1,
        startFormatted: this.formatTimeSrt(startSec),
        endFormatted: this.formatTimeSrt(endSec),
        text: step.narrationText || step.title
      });

      currentTimeSec = endSec;
    });

    // Generate SRT string
    const srtLines = items.map(item => 
      `${item.index}\n${item.startFormatted} --> ${item.endFormatted}\n${item.text}\n`
    );
    const srtContent = srtLines.join('\n');

    // Generate VTT string
    const vttLines = items.map(item => 
      `${item.index}\n${this.srtToVttTime(item.startFormatted)} --> ${this.srtToVttTime(item.endFormatted)}\n${item.text}\n`
    );
    const vttContent = `WEBVTT\n\n` + vttLines.join('\n');

    // Generate TXT string
    const txtContent = items.map(item => `[${item.startFormatted.substring(0, 8)}] ${item.text}`).join('\n');

    return {
      srtContent,
      vttContent,
      txtContent,
      items
    };
  }

  private static formatTimeSrt(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  private static srtToVttTime(srtTime: string): string {
    return srtTime.replace(',', '.');
  }
}
