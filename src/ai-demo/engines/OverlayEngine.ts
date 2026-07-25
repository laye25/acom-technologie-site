// src/ai-demo/engines/OverlayEngine.ts
/**
 * OverlayEngine - Visual Overlay & Annotation Rendering Engine
 * Renders high-DPI visual halos, spotlight masks, click ripples, zoom transforms,
 * step badges, and pedagogical callout banners onto canvas contexts or UI stages.
 */

import { SaiTimelineStep, SaiVisualSnapshot, BrandingConfig } from '../types';

export interface OverlayFrameConfig {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  step?: SaiTimelineStep;
  snapshot?: SaiVisualSnapshot;
  progressPercent: number; // 0 to 1
  branding?: BrandingConfig;
}

export class OverlayEngine {
  /**
   * Renders a complete visual overlay frame over the screen snapshot
   */
  public static renderOverlayFrame(config: OverlayFrameConfig): void {
    const { ctx, width, height, step, progressPercent, branding } = config;
    if (!step) return;

    ctx.save();

    // 1. Render Effect Overlays (Spotlight, Green/Red Halos, Arrows)
    this.renderEffectOverlay(ctx, width, height, step);

    // 2. Render Step Banner (Top)
    this.renderTopStepBanner(ctx, width, height, step, branding, progressPercent);

    // 3. Render Pedagogical Callout (Bottom)
    this.renderBottomCallout(ctx, width, height, step, progressPercent);

    // 4. Render Progress Bar at top edge
    this.renderProgressBar(ctx, width, height, progressPercent);

    ctx.restore();
  }

  private static renderEffectOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    step: SaiTimelineStep
  ): void {
    const effect = step.effectOverlay || 'green_halo';
    const centerX = w / 2;
    const centerY = h / 2;

    if (effect === 'green_halo' || effect === 'red_halo') {
      const isGreen = effect === 'green_halo';
      const color = isGreen ? 'rgba(34, 197, 94, ' : 'rgba(239, 68, 68, ';

      ctx.save();
      const gradient = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 220);
      gradient.addColorStop(0, `${color}0.4)`);
      gradient.addColorStop(0.5, `${color}0.15)`);
      gradient.addColorStop(1, `${color}0)`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 220, 0, Math.PI * 2);
      ctx.fill();

      // Pulse ring
      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (effect === 'arrow_pointer') {
      ctx.save();
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(centerX - 15, centerY - 40);
      ctx.lineTo(centerX + 15, centerY - 40);
      ctx.lineTo(centerX, centerY - 10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (effect === 'blur_mask') {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  private static renderTopStepBanner(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    step: SaiTimelineStep,
    branding?: BrandingConfig,
    progressPercent: number = 0.5
  ): void {
    ctx.save();

    // Top banner background bar
    const bannerHeight = 44;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fillRect(0, 0, w, bannerHeight);

    // Bottom border
    ctx.fillStyle = 'rgba(37, 99, 235, 0.6)';
    ctx.fillRect(0, bannerHeight - 2, w, 2);

    // Step Number Badge
    const badgeWidth = 28;
    ctx.fillStyle = '#2563eb';
    this.drawRoundedRect(ctx, 16, 8, badgeWidth, 28, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${step.stepNumber}`, 16 + badgeWidth / 2, 8 + 14);

    // Step Title with progressive typewriter typing effect
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    const typeProg = Math.min(1.0, progressPercent / 0.85);
    const titleChars = Math.floor(step.title.length * typeProg);
    const titleSnippet = step.title.substring(0, titleChars);
    const titleCursor = (typeProg < 1.0 && Math.floor(progressPercent * 24) % 2 === 0) ? '▋' : '';

    ctx.fillText(titleSnippet + titleCursor, 54, 22);

    // Branding App Name tag (Right)
    if (branding?.appName) {
      ctx.textAlign = 'right';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(branding.appName, w - 16, 22);
    }

    ctx.restore();
  }

  private static renderBottomCallout(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    step: SaiTimelineStep,
    progressPercent: number = 0.5
  ): void {
    const text = step.narrationText || step.proAdvice || step.timeSavingTip || step.description;
    if (!text) return;

    ctx.save();
    const calloutHeight = 50;
    const y = h - calloutHeight;

    // Dark glass bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.fillRect(0, y, w, calloutHeight);

    // Accent line
    ctx.fillStyle = step.proAdvice ? '#f59e0b' : '#10b981';
    ctx.fillRect(0, y, w, 2);

    // Text label
    ctx.fillStyle = step.proAdvice ? '#fde68a' : '#a7f3d0';
    ctx.font = 'bold 11px Inter, sans-serif';
    const labelStr = step.narrationText ? '🎙️ NARRATION:' : step.proAdvice ? '💡 CONSEIL PRO:' : '⚡ ASTUCE:';
    ctx.fillText(labelStr, 16, y + 20);

    // Progressive typewriter animation on callout text
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px Inter, sans-serif';
    const typeProg = Math.min(1.0, progressPercent / 0.85);
    const visibleChars = Math.floor(text.length * typeProg);
    const textSnippet = text.substring(0, visibleChars);
    const textCursor = (typeProg < 1.0 && Math.floor(progressPercent * 24) % 2 === 0) ? '▋' : '';

    ctx.fillText(textSnippet + textCursor, 130, y + 20);

    ctx.restore();
  }

  private static renderProgressBar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    progressPercent: number
  ): void {
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, 3);

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 0, w * Math.max(0, Math.min(1, progressPercent)), 3);
    ctx.restore();
  }

  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
