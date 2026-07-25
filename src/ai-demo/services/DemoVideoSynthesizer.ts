// src/ai-demo/services/DemoVideoSynthesizer.ts
// DemoVideoSynthesizer: Automatic offline/realtime WebM video generation for AI Demos

import { DemoProject } from '../types';

export class DemoVideoSynthesizer {
  public static async synthesizeVideoBlob(project: DemoProject): Promise<Blob | null> {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;

    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
        if (!stream) {
          console.warn('Canvas captureStream is not supported in this environment');
          return resolve(null);
        }

        let mimeType = 'video/webm;codecs=vp9';
        if (typeof MediaRecorder === 'undefined') {
          return resolve(null);
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }

        const chunks: Blob[] = [];
        const mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };

        mediaRecorder.start();

        const steps = project.timelineSteps || [];
        if (steps.length === 0) {
          mediaRecorder.stop();
          return;
        }

        let currentStepIdx = 0;
        let stepProgress = 0;
        const framesPerStep = 45; // ~1.5 sec per step at 30fps
        let currentFrame = 0;
        const totalFrames = steps.length * framesPerStep;

        let startX = 200;
        let startY = 150;

        const drawFrame = () => {
          currentStepIdx = Math.min(Math.floor(currentFrame / framesPerStep), steps.length - 1);
          const step = steps[currentStepIdx];
          const frameInStep = currentFrame % framesPerStep;
          stepProgress = frameInStep / framesPerStep;

          const targetX = step.x || (300 + (currentStepIdx * 120) % 500);
          const targetY = step.y || (220 + (currentStepIdx * 80) % 300);

          if (frameInStep === 0 && currentStepIdx > 0) {
            const prevStep = steps[currentStepIdx - 1];
            startX = prevStep.x || startX;
            startY = prevStep.y || startY;
          }

          // Ease pointer coordinates
          const easeProgress = Math.min(1, stepProgress * 1.5);
          const curX = startX + (targetX - startX) * easeProgress;
          const curY = startY + (targetY - startY) * easeProgress;

          // Clear background (Dark theme canvas)
          ctx.fillStyle = '#0f172a'; // slate-900
          ctx.fillRect(0, 0, 1280, 720);

          // Top Header Bar
          ctx.fillStyle = '#020617'; // slate-950
          ctx.fillRect(0, 0, 1280, 60);

          ctx.fillStyle = '#6366f1'; // indigo-500
          ctx.font = 'bold 18px sans-serif';
          ctx.fillText('ACOM AI DEMO STUDIO', 24, 36);

          ctx.fillStyle = '#94a3b8'; // slate-400
          ctx.font = '14px sans-serif';
          ctx.fillText(`${project.moduleName || 'Acom'} • ${project.pageName || 'Interface'}`, 260, 36);

          // Simulated App Browser Container
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.strokeStyle = '#334155'; // slate-700
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(40, 80, 1200, 520, 16);
          } else {
            ctx.rect(40, 80, 1200, 520);
          }
          ctx.fill();
          ctx.stroke();

          // Browser Top Bar
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(40, 80, 1200, 40);
          
          // Browser Dots
          ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(64, 100, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(80, 100, 5, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(96, 100, 5, 0, Math.PI * 2); ctx.fill();

          // URL bar
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(120, 88, 800, 24, 6);
          } else {
            ctx.rect(120, 88, 800, 24);
          }
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.font = '11px monospace';
          const safeMod = (project.moduleName || 'acom').toLowerCase().replace(/\s+/g, '_');
          const safePag = (project.pageName || 'home').toLowerCase().replace(/\s+/g, '_');
          ctx.fillText(`https://acom.app/${safeMod}/${safePag}`, 130, 104);

          // Main App Canvas Content Box
          ctx.fillStyle = '#090d16';
          ctx.fillRect(41, 121, 1198, 478);

          // Active Step Card
          ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(140, 160, 1000, 320, 16);
          } else {
            ctx.rect(140, 160, 1000, 320);
          }
          ctx.fill();
          ctx.stroke();

          // Step Badge & Title
          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(160, 180, 32, 32, 8);
          } else {
            ctx.rect(160, 180, 32, 32);
          }
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(`${currentStepIdx + 1}`, 171, 202);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.fillText(step.title || `Étape ${currentStepIdx + 1}`, 208, 203);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '14px sans-serif';
          ctx.fillText(step.description || '', 208, 230);

          // Action Detail Box
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(160, 260, 960, 180, 12);
          } else {
            ctx.rect(160, 260, 960, 180);
          }
          ctx.fill();

          ctx.fillStyle = '#818cf8';
          ctx.font = 'bold 12px monospace';
          ctx.fillText(`ACTION: ${step.actionType?.toUpperCase() || 'CLICK'}`, 180, 290);

          ctx.fillStyle = '#34d399'; // emerald-400
          ctx.font = '14px sans-serif';
          ctx.fillText(`Saisie / Action : ${step.targetValue || step.title}`, 180, 320);

          // Virtual Mouse Cursor
          ctx.save();
          ctx.translate(curX, curY);

          // Click ripple
          if (stepProgress > 0.6 && (step.actionType === 'click' || step.actionType === 'submit')) {
            const rippleSize = (stepProgress - 0.6) * 100;
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(1, rippleSize), 0, Math.PI * 2);
            ctx.stroke();
          }

          // Draw Cursor Pointer
          ctx.fillStyle = '#6366f1';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(12, 20);
          ctx.lineTo(18, 14);
          ctx.lineTo(26, 22);
          ctx.lineTo(30, 18);
          ctx.lineTo(22, 10);
          ctx.lineTo(28, 6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cursor Badge
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(16, 20, 90, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('ACOM AI Pointer', 20, 34);

          ctx.restore();

          // Bottom Narration Banner
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 620, 1280, 100);

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('NARRATION IA EN DIRECT', 40, 645);

          ctx.fillStyle = '#a7f3d0';
          ctx.font = 'italic 16px sans-serif';
          ctx.fillText(`« ${step.narrationText || ''} »`, 40, 675);

          currentFrame++;
          if (currentFrame < totalFrames) {
            setTimeout(drawFrame, 1000 / 30);
          } else {
            setTimeout(() => {
              if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
              }
            }, 300);
          }
        };

        drawFrame();
      } catch (err) {
        console.warn('Failed to synthesize video blob:', err);
        resolve(null);
      }
    });
  }
}
