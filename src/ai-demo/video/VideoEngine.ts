// src/ai-demo/video/VideoEngine.ts
// VideoEngine: High-grade Video Canvas Compositor with Dynamic Smart Zoom, Interactive Pulsing Cursor FX, Top Step Banners, Pedagogical Cards & Fast-Forward Dead-time Badges

import { TimelineStep, BrandingConfig, VideoConfig } from '../types';

export class VideoEngine {
  /**
   * Renders timeline steps onto an HTML Canvas with smart camera zooms, glowing cursor halos, prominent step banners, and pedagogical overlays
   */
  public static renderStepToCanvas(
    ctx: CanvasRenderingContext2D,
    step: TimelineStep,
    progress: number, // 0.0 to 1.0 within the step
    branding: BrandingConfig,
    videoConfig: VideoConfig,
    canvasWidth: number = 1280,
    canvasHeight: number = 720
  ): void {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Smooth Step Fade-In / Fade-Out Transition
    let alpha = 1.0;
    if (progress < 0.12) {
      alpha = progress / 0.12;
    } else if (progress > 0.88) {
      alpha = (1.0 - progress) / 0.12;
    }
    ctx.globalAlpha = Math.max(0.15, alpha);

    // 1. Dark Modern SaaS Studio Canvas Background
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#090d16');
    gradient.addColorStop(0.5, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Window Container Math - Reduced margins by 40% for maximum software visibility
    const topMargin = 50; // Space for top step banner
    const bottomMargin = 80; // Space for bottom pedagogical callout
    const sideMargin = 16; // Minimal side padding to maximize screen area

    const uiWidth = canvasWidth - sideMargin * 2;
    const uiHeight = canvasHeight - topMargin - bottomMargin;
    const uiX = sideMargin;
    const uiY = topMargin;

    // Apply Dynamic Camera Zoom (140% - 150%) focused on interaction coordinates (x, y)
    ctx.save();
    const effectiveZoom = step.zoomLevel > 1.0 ? step.zoomLevel : 1.35;
    if (step.x !== undefined && step.y !== undefined) {
      // Smooth camera sine ease curve for zoom in & zoom out
      const currentZoom = 1.0 + (effectiveZoom - 1.0) * Math.sin(progress * Math.PI);
      const targetCenterX = uiX + (step.x / window.innerWidth) * uiWidth;
      const targetCenterY = uiY + (step.y / window.innerHeight) * uiHeight;

      ctx.translate(targetCenterX, targetCenterY);
      ctx.scale(currentZoom, currentZoom);
      ctx.translate(-targetCenterX, -targetCenterY);
    }

    // Render Simulated App UI Window
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 15;
    ctx.beginPath();
    ctx.roundRect(uiX, uiY, uiWidth, uiHeight, 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // App Header Bar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(uiX, uiY, uiWidth, 40, [14, 14, 0, 0]);
    ctx.fill();

    // Window Buttons
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(uiX + 22, uiY + 20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(uiX + 38, uiY + 20, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(uiX + 54, uiY + 20, 5, 0, Math.PI * 2); ctx.fill();

    // App Title Pill
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.fillText(`${branding.appName || 'ACOM SaaS'} • ${branding.moduleName || 'Gestion'}`, uiX + 75, uiY + 24);

    // Inner Canvas Content Simulation - Rich SaaS Interface or Screenshot
    this.renderInnerAppUi(ctx, uiX + 16, uiY + 52, uiWidth - 32, uiHeight - 68, step, branding, progress);

    // 3. High-Visibility Interactive Cursor & Shockwave Ripple FX
    if (step.x !== undefined && step.y !== undefined) {
      const clickX = uiX + (step.x / window.innerWidth) * uiWidth;
      const clickY = uiY + (step.y / window.innerHeight) * uiHeight;

      // Concentric Expanding Click Shockwave
      const rippleProgress = (progress * 3) % 1.0;
      const rippleRadius = 15 + rippleProgress * 40;
      const rippleAlpha = 1.0 - rippleProgress;

      ctx.strokeStyle = `rgba(99, 102, 241, ${rippleAlpha * 0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(clickX, clickY, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Glowing Outer Ring Halo
      ctx.fillStyle = 'rgba(79, 70, 229, 0.25)';
      ctx.beginPath();
      ctx.arc(clickX, clickY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing Inner Target Ring
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(clickX, clickY, 18 + Math.sin(progress * Math.PI * 6) * 4, 0, Math.PI * 2);
      ctx.stroke();

      // Target Crosshair / Corner Bracket Callout
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      const bSize = 12;
      // Top-Left corner bracket
      ctx.beginPath(); ctx.moveTo(clickX - 25, clickY - 25 + bSize); ctx.lineTo(clickX - 25, clickY - 25); ctx.lineTo(clickX - 25 + bSize, clickY - 25); ctx.stroke();
      // Bottom-Right corner bracket
      ctx.beginPath(); ctx.moveTo(clickX + 25, clickY + 25 - bSize); ctx.lineTo(clickX + 25, clickY + 25); ctx.lineTo(clickX + 25 - bSize, clickY + 25); ctx.stroke();

      // Large High-Contrast Pointer Cursor Icon
      ctx.fillStyle = '#4f46e5';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clickX, clickY);
      ctx.lineTo(clickX + 16, clickY + 20);
      ctx.lineTo(clickX + 6, clickY + 20);
      ctx.lineTo(clickX + 2, clickY + 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore(); // Restore camera zoom translate & scale

    // 4. Prominent Top Step Header Banner
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(sideMargin, 16, uiWidth, 48, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Step Number Badge (e.g. ÉTAPE 03)
    const badgeGradient = ctx.createLinearGradient(sideMargin + 10, 24, sideMargin + 110, 56);
    badgeGradient.addColorStop(0, '#4f46e5');
    badgeGradient.addColorStop(1, '#7c3aed');
    ctx.fillStyle = badgeGradient;
    ctx.beginPath();
    ctx.roundRect(sideMargin + 10, 24, 100, 32, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ÉTAPE ${step.stepNumber.toString().padStart(2, '0')}`, sideMargin + 60, 44);

    // Step Title in Header
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(step.title, sideMargin + 125, 45);

    // Dead-time Fast Forward Badge if accelerated
    if (step.isAccelerated || step.speedMultiplier) {
      const spd = step.speedMultiplier || 2.5;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(sideMargin + uiWidth - 210, 24, 195, 32, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ACCÉLÉRATION IA ×${spd.toFixed(1)}`, sideMargin + uiWidth - 112, 44);
    }

    // 5. Bottom Pedagogical & Narration Callout Banner
    const bannerHeight = 80;
    const bannerY = canvasHeight - bannerHeight - 12;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(sideMargin, bannerY, uiWidth, bannerHeight, 14);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Left Border Accent Strip
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(sideMargin, bannerY, 6, bannerHeight, [14, 0, 0, 14]);
    ctx.fill();

    // Narration & Pedagogy Content - Progressive Typewriter Animation (Machine à écrire)
    ctx.textAlign = 'left';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';

    const fullNarration = step.narrationText.length > 110 ? step.narrationText.substring(0, 107) + '...' : step.narrationText;
    const typeProgress = Math.min(1.0, progress / 0.85);
    const visibleChars = Math.floor(fullNarration.length * typeProgress);
    const narrationSnippet = fullNarration.substring(0, visibleChars);
    const cursor = (typeProgress < 1.0 && Math.floor(progress * 24) % 2 === 0) ? '▋' : '';

    ctx.fillText(narrationSnippet + cursor, sideMargin + 24, bannerY + 30);

    // Pedagogical Badges (Objectif, Advice, Tip) with progressive typing
    if (step.objective || step.tip || step.advice) {
      const pedagogicText = step.objective
        ? `🎯 OBJECTIF : ${step.objective}`
        : step.tip
        ? `💡 ASTUCE : ${step.tip}`
        : `📌 CONSEIL : ${step.advice}`;

      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.beginPath();
      ctx.roundRect(sideMargin + 24, bannerY + 44, uiWidth - 48, 26, 6);
      ctx.fill();

      ctx.fillStyle = '#818cf8';
      ctx.font = 'bold 12px Inter, sans-serif';
      const shortPedagogy = pedagogicText.length > 105 ? pedagogicText.substring(0, 102) + '...' : pedagogicText;
      const pedaVisibleChars = Math.max(0, Math.floor((shortPedagogy.length + 10) * Math.min(1.0, progress / 0.9) - 5));
      const pedaSnippet = shortPedagogy.substring(0, Math.min(shortPedagogy.length, pedaVisibleChars));
      
      ctx.fillText(pedaSnippet, sideMargin + 34, bannerY + 61);
    } else {
      // Default Subtitle / Action Description
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      const descVisible = step.description.substring(0, Math.floor(step.description.length * Math.min(1.0, progress / 0.85)));
      ctx.fillText(descVisible, sideMargin + 24, bannerY + 54);
    }

    // Reset global alpha
    ctx.globalAlpha = 1.0;
  }

  private static imageCache: Map<string, HTMLImageElement> = new Map();

  /**
   * Asynchronously preloads all step screenshots into memory for instant high-DPI rendering
   */
  public static preloadStepScreenshots(steps: TimelineStep[]): Promise<void> {
    const promises = steps
      .filter((s) => s.screenshotUrl)
      .map((s) => {
        const url = s.screenshotUrl!;
        if (this.imageCache.has(url)) return Promise.resolve();
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.imageCache.set(url, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        });
      });
    return Promise.all(promises).then(() => {});
  }

  /**
   * Renders either the REAL screen capture image (100% pixel faithful) or fallback UI
   */
  private static renderInnerAppUi(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    step: TimelineStep,
    branding: BrandingConfig,
    progress: number = 0.5
  ): void {
    // Priority #1: Render REAL screen capture if available
    if (step.screenshotUrl) {
      let img = this.imageCache.get(step.screenshotUrl);
      if (!img) {
        img = new Image();
        img.src = step.screenshotUrl;
        this.imageCache.set(step.screenshotUrl, img);
      }
      if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        try {
          ctx.drawImage(img, x, y, w, h);
          ctx.restore();
          return;
        } catch {
          ctx.restore();
        }
      }
    }

    ctx.save();

    // 1. App Main Canvas Background (Acom Light Theme)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x, y, w, h);

    // 2. Top App Navigation Header Bar
    const topNavH = 46;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, w, topNavH);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x, y + topNavH - 1, w, 1);

    // Acom Logo (Purple Badge)
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.roundRect(x + 12, y + 8, 30, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 16px Inter, sans-serif';
    ctx.fillText('A', x + 21, y + 29);

    // Header Module Tabs
    const headerTabs = [
      { name: 'FICHE RÉCEPTION', active: true },
      { name: 'LIVRAISONS', active: false },
      { name: 'VENTE & STOCK', active: false },
      { name: 'CATALOGUE EN LIGNE', active: false },
      { name: 'PARAMÈTRES TARIFS', active: false },
    ];

    let tabX = x + 54;
    headerTabs.forEach((tab) => {
      ctx.font = 'bold 10px Inter, sans-serif';
      const textWidth = ctx.measureText(tab.name).width;
      const pillWidth = textWidth + 18;

      if (tab.active) {
        ctx.fillStyle = '#0f172a'; // Black active pill
        ctx.beginPath();
        ctx.roundRect(tabX, y + 10, pillWidth, 26, 13);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#64748b';
      }
      ctx.fillText(tab.name, tabX + 9, y + 26);
      tabX += pillWidth + 8;
    });

    // Top Right Utility Badges
    ctx.fillStyle = '#fee2e2'; // Pink offline
    ctx.beginPath();
    ctx.roundRect(x + w - 320, y + 10, 110, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('QUOTA ÉPUISÉ (OFFLINE)', x + w - 314, y + 25);

    ctx.fillStyle = '#0f172a'; // Black AcomDone
    ctx.beginPath();
    ctx.roundRect(x + w - 204, y + 10, 72, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('ACOMDONE', x + w - 196, y + 25);

    ctx.fillStyle = '#f3e8ff'; // Purple Desktop
    ctx.beginPath();
    ctx.roundRect(x + w - 126, y + 10, 70, 24, 12);
    ctx.fill();
    ctx.fillStyle = '#6b21a8';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('APP DESKTOP', x + w - 120, y + 25);

    // 3. Module Sub-Header Card ("Fiche de Réception Client")
    const cardY = y + topNavH + 8;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 12, cardY, w - 24, 48, 10);
    ctx.fill();
    ctx.stroke();

    // Module Icon & Title
    ctx.fillStyle = '#f3e8ff';
    ctx.beginPath();
    ctx.roundRect(x + 22, cardY + 8, 32, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#7e22ce';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('📋', x + 30, cardY + 29);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('Fiche de Réception Client', x + 62, cardY + 22);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Enregistrement et suivi des dépôts, factures sous-totaux et par kg.', x + 62, cardY + 36);

    // Sub-header Action Pills (Right side)
    const subPills = [
      { label: 'NOUVEAU TICKET', active: true },
      { label: 'EN COURS (28)', active: false },
      { label: 'HISTORIQUE (1)', active: false },
      { label: 'DEVIS (0)', active: false },
      { label: 'CLÔTURÉE (2)', active: false }
    ];

    let pillX = x + w - 420;
    subPills.forEach((p) => {
      ctx.font = 'bold 9px Inter, sans-serif';
      const pw = ctx.measureText(p.label).width + 12;
      if (p.active) {
        ctx.fillStyle = '#f3e8ff';
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(pillX, cardY + 12, pw, 24, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7e22ce';
      } else {
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(pillX, cardY + 12, pw, 24, 6);
        ctx.fill();
        ctx.fillStyle = '#475569';
      }
      ctx.fillText(p.label, pillX + 6, cardY + 27);
      pillX += pw + 6;
    });

    // 4. Metric Stat Cards Row (5 Stat Cards)
    const kpiY = cardY + 54;
    const kpiW = (w - 24 - 32) / 5;
    const kpis = [
      { val: '28', label: 'DÉPÔTS TOTAL', bg: '#f3e8ff', text: '#6b21a8' },
      { val: '30 175 F', label: 'À ENCAISSER', bg: '#fce7f3', text: '#be123c' },
      { val: '1', label: 'PAYÉS', bg: '#dcfce7', text: '#15803d' },
      { val: '7', label: 'ACOMPTES', bg: '#fef3c7', text: '#b45309' },
      { val: '20', label: 'IMPAYÉS', bg: '#fee2e2', text: '#b91c1c' }
    ];

    kpis.forEach((k, idx) => {
      const kx = x + 12 + idx * (kpiW + 8);
      ctx.fillStyle = k.bg;
      ctx.beginPath();
      ctx.roundRect(kx, kpiY, kpiW, 46, 8);
      ctx.fill();

      ctx.fillStyle = k.text;
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(k.val, kx + 10, kpiY + 24);

      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.fillText(k.label, kx + 10, kpiY + 38);
    });

    // 5. Main Workspace (Form Panel 65% + Ticket Panel 35%)
    const workspaceY = kpiY + 52;
    const workspaceH = h - (workspaceY - y) - 8;
    const formPanelW = (w - 32) * 0.65;
    const ticketPanelW = (w - 32) * 0.35;
    const ticketPanelX = x + 12 + formPanelW + 8;

    // --- Left Main Form Panel ---
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 12, workspaceY, formPanelW, workspaceH, 10);
    ctx.fill();
    ctx.stroke();

    // Section Title
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('Informations de la Commande', x + 24, workspaceY + 22);

    // New Client Button
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + formPanelW - 110, workspaceY + 8, 100, 20, 10);
    ctx.stroke();
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('+ NOUVEAU CLIENT', x + formPanelW - 102, workspaceY + 21);

    // Inputs Grid (Nom, Téléphone, Email)
    const inputW = (formPanelW - 36) / 3;
    const inputsY = workspaceY + 32;

    const fields = [
      { label: 'NOM DU CLIENT', val: 'Mamadou Ndiaye' },
      { label: 'TÉLÉPHONE / WHATSAPP', val: '+221771234567' },
      { label: 'ADRESSE EMAIL', val: 'client@email.com' }
    ];

    fields.forEach((f, idx) => {
      const ix = x + 24 + idx * (inputW + 6);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.fillText(f.label, ix, inputsY + 10);

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(ix, inputsY + 14, inputW, 26, 6);
      ctx.fill();
      ctx.stroke();

      // Progressive typewriter animation on field values
      const fieldTypeProgress = Math.min(1.0, progress / 0.75);
      const fieldVisibleChars = Math.floor(f.val.length * fieldTypeProgress);
      const fieldValSnippet = f.val.substring(0, fieldVisibleChars);
      const fieldCursor = (fieldTypeProgress < 1.0 && Math.floor(progress * 20) % 2 === 0) ? '|' : '';

      ctx.fillStyle = '#0f172a';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(fieldValSnippet + fieldCursor, ix + 8, inputsY + 31);
    });

    // Dates Row & Tarification Mode
    const datesY = inputsY + 48;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillText('DATE DE DÉPÔT', x + 24, datesY + 10);

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(x + 24, datesY + 14, inputW, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('24 / 07 / 2026 📅', x + 32, datesY + 31);

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillText('DATE DE RETRAIT PRÉVUE', x + 30 + inputW, datesY + 10);

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(x + 30 + inputW, datesY + 14, inputW, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('27 / 07 / 2026 📅', x + 38 + inputW, datesY + 31);

    // Tarification Mode Pills
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillText('MODE DE TARIFICATION', x + 36 + inputW * 2, datesY + 10);

    ctx.fillStyle = '#7e22ce'; // Active Par Article
    ctx.beginPath();
    ctx.roundRect(x + 36 + inputW * 2, datesY + 14, inputW / 2 - 2, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('Par Article', x + 40 + inputW * 2, datesY + 31);

    ctx.fillStyle = '#f1f5f9'; // Inactive Par Poids
    ctx.beginPath();
    ctx.roundRect(x + 36 + inputW * 2 + inputW / 2 + 2, datesY + 14, inputW / 2 - 2, 26, 6);
    ctx.fill();
    ctx.fillStyle = '#475569';
    ctx.fillText('Par Poids', x + 40 + inputW * 2 + inputW / 2, datesY + 31);

    // Quantity & Articles Row
    const articleY = datesY + 48;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillText("QUANTITÉ D'ARTICLES À LAVER", x + 24, articleY + 10);

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(x + 24, articleY + 14, formPanelW - 48, 32, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('👔 CHEMISE  •  900 FCFA / unité', x + 36, articleY + 34);

    // Qty controls (- 1 +)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(x + formPanelW - 80, articleY + 18, 20, 24, 4);
    ctx.roundRect(x + formPanelW - 40, articleY + 18, 20, 24, 4);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('-', x + formPanelW - 74, articleY + 34);
    ctx.fillText('1', x + formPanelW - 54, articleY + 34);
    ctx.fillText('+', x + formPanelW - 34, articleY + 34);

    // Règlement section & Primary Action Buttons
    const reglementY = articleY + 52;
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillText('RÈGLEMENT DE LA COMMANDE', x + 24, reglementY + 10);

    // Status: Impayé
    ctx.fillStyle = '#fee2e2';
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(x + 24, reglementY + 14, inputW, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('🔴 Impayé / À la livraison', x + 30, reglementY + 31);

    // Acompte field
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(x + 30 + inputW, reglementY + 14, inputW, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('10.000 FCFA', x + 38 + inputW, reglementY + 31);

    // Mode: Espèces
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(x + 36 + inputW * 2, reglementY + 14, inputW, 26, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Espèces 💵', x + 44 + inputW * 2, reglementY + 31);

    // Primary & Secondary Action Buttons
    const actionBtnsY = reglementY + 48;

    // + ENREGISTRER LE TICKET (Deep Purple Solid Button)
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.roundRect(x + 24, actionBtnsY, 180, 32, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('+ ENREGISTRER LE TICKET', x + 38, actionBtnsY + 20);

    // ÉTABLIR UN DEVIS (Purple Outline Button)
    ctx.strokeStyle = '#7e22ce';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + 214, actionBtnsY, 150, 32, 8);
    ctx.stroke();

    ctx.fillStyle = '#7e22ce';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('ÉTABLIR UN DEVIS', x + 236, actionBtnsY + 20);

    // --- Right Thermal Ticket Preview Panel ---
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ticketPanelX, workspaceY, ticketPanelW, workspaceH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 8px Inter, sans-serif';
    ctx.fillText('APERÇU REÇU DU TICKET DE CAISSE', ticketPanelX + 12, workspaceY + 16);

    // Receipt Ticket Simulation Card
    const ticketX = ticketPanelX + 12;
    const ticketY = workspaceY + 24;
    const ticketW = ticketPanelW - 24;
    const ticketH = workspaceH - 32;

    ctx.fillStyle = '#fafafa';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 8);
    ctx.fill();
    ctx.stroke();

    // Thermal Receipt Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'black 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ACOM PRESSING', ticketX + ticketW / 2, ticketY + 24);

    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('N° TE-2026-0089 (Généré à la validation)', ticketX + ticketW / 2, ticketY + 38);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(ticketX + 12, ticketY + 46);
    ctx.lineTo(ticketX + ticketW - 12, ticketY + 46);
    ctx.stroke();

    // Receipt Details
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('Client: Mamadou Ndiaye', ticketX + 12, ticketY + 62);
    ctx.fillText('Contact: +221771234567', ticketX + 12, ticketY + 76);
    ctx.fillText('Dépôt: 2026-07-24', ticketX + 12, ticketY + 90);
    ctx.fillText('Retrait prévu: 2026-07-27', ticketX + 12, ticketY + 104);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(ticketX + 12, ticketY + 114);
    ctx.lineTo(ticketX + ticketW - 12, ticketY + 114);
    ctx.stroke();

    // Receipt Item Line
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('1x CHEMISE', ticketX + 12, ticketY + 130);
    ctx.fillText('900 FCFA', ticketX + ticketW - 60, ticketY + 130);

    ctx.strokeStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(ticketX + 12, ticketY + 144);
    ctx.lineTo(ticketX + ticketW - 12, ticketY + 144);
    ctx.stroke();

    // Totals
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('TOTAL :', ticketX + 12, ticketY + 162);
    ctx.fillText('900 FCFA', ticketX + ticketW - 70, ticketY + 162);

    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#15803d';
    ctx.fillText('Acompte versé: 10.000 FCFA', ticketX + 12, ticketY + 178);

    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Merci de votre confiance !', ticketX + ticketW / 2, ticketY + ticketH - 12);
    ctx.textAlign = 'left';

    ctx.restore();
  }
}

