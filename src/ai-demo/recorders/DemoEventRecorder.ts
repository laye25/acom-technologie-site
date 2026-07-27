// src/ai-demo/recorders/DemoEventRecorder.ts
// DemoEventRecorder: Captures real-time user interactions, clicks, mouse moves, inputs, and page changes.

import { RecordedEvent, EventActionType, SaiInteractionEvent, SaiVisualSnapshot } from '../types';
import { SensitiveDataMasker } from '../utils/sensitiveDataMasker';
import { SaiEventBus } from '../services/SaiEventBus';

export class DemoEventRecorder {
  private isRecording: boolean = false;
  private startTimeMs: number = 0;
  private events: RecordedEvent[] = [];
  private currentModuleName: string = 'Acom SaaS';
  private currentPageName: string = 'Accueil';
  private clickListener?: (e: MouseEvent) => void;
  private inputListener?: (e: Event) => void;
  private changeListener?: (e: Event) => void;
  private submitListener?: (e: Event) => void;
  private lastInputTargetRef: HTMLElement | null = null;

  public startRecording(moduleName: string, pageName: string): void {
    if (this.isRecording) return;

    this.isRecording = true;
    this.startTimeMs = Date.now();
    this.events = [];
    this.currentModuleName = moduleName;
    this.currentPageName = pageName;
    this.lastInputTargetRef = null;

    // Record Initial Page Event
    this.addEvent({
      action: 'page_change',
      buttonOrLabel: `Ouverture de ${pageName}`,
      timeFormatted: '00:00.000'
    });

    // Attach Event Listeners
    this.clickListener = (e: MouseEvent) => this.handleGlobalClick(e);
    this.inputListener = (e: Event) => this.handleGlobalInput(e);
    this.changeListener = (e: Event) => this.handleGlobalChange(e);
    this.submitListener = (e: Event) => this.handleGlobalSubmit(e);

    document.addEventListener('click', this.clickListener, true);
    document.addEventListener('input', this.inputListener, true);
    document.addEventListener('change', this.changeListener, true);
    document.addEventListener('submit', this.submitListener, true);
  }

  public stopRecording(): RecordedEvent[] {
    if (!this.isRecording) return this.events;

    this.isRecording = false;

    if (this.clickListener) document.removeEventListener('click', this.clickListener, true);
    if (this.inputListener) document.removeEventListener('input', this.inputListener, true);
    if (this.changeListener) document.removeEventListener('change', this.changeListener, true);
    if (this.submitListener) document.removeEventListener('submit', this.submitListener, true);

    this.lastInputTargetRef = null;

    return this.events;
  }

  public updateContext(moduleName: string, pageName: string): void {
    if (!this.isRecording) return;
    if (pageName !== this.currentPageName) {
      this.currentModuleName = moduleName;
      this.currentPageName = pageName;
      this.addEvent({
        action: 'page_change',
        buttonOrLabel: `Navigation vers ${pageName}`
      });
    }
  }

  public recordCustomEvent(action: EventActionType, label: string, metadata?: Record<string, any>): void {
    if (!this.isRecording) return;
    this.addEvent({
      action,
      buttonOrLabel: label,
      metadata
    });
  }

  public getEvents(): RecordedEvent[] {
    return [...this.events];
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  private handleGlobalClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Ignore clicks on recorder floating control widget
    if (target.closest('#acom-demo-floating-widget')) return;

    // Ignore direct clicks inside text inputs to avoid duplicating click + input
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // Ignore global header / navigation clicks (like "ACOMZONE" branding) unless explicitly tagged with data-sai-id
    const saiId = target.getAttribute('data-sai-id');
    const isHeaderOrNav = target.closest('header, nav') && !saiId;
    const labelText = target.innerText?.trim() || '';
    if (isHeaderOrNav || labelText.includes('ACOMZONE')) {
      return;
    }

    const label = labelText.substring(0, 40) || 
                  target.getAttribute('aria-label') || 
                  target.getAttribute('title') || 
                  target.getAttribute('placeholder') ||
                  target.tagName;

    const isSensitive = SensitiveDataMasker.isElementSensitive(target);

    let clickX = e.clientX;
    let clickY = e.clientY;

    if ((clickX === 0 && clickY === 0) || clickX === undefined) {
      const rect = target.getBoundingClientRect();
      clickX = Math.round(rect.left + rect.width / 2);
      clickY = Math.round(rect.top + rect.height / 2);
    }

    this.addEvent({
      action: saiId === 'pressing.receipt.ticket.submit' ? 'submit' : 'click',
      buttonOrLabel: label || 'Action',
      targetTag: target.tagName,
      targetId: saiId || target.id || undefined,
      x: clickX,
      y: clickY,
      hasSensitiveData: isSensitive
    });
  }

  private handleGlobalInput(e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target) return;

    const saiId = target.getAttribute('data-sai-id');
    const isSensitive = SensitiveDataMasker.isElementSensitive(target);
    const maskedVal = SensitiveDataMasker.maskValue(target.value, isSensitive);

    const rect = target.getBoundingClientRect();
    const inputX = Math.round(rect.left + rect.width / 2);
    const inputY = Math.round(rect.top + rect.height / 2);

    // Find if an event for this exact input field already exists in events array (Deduplication)
    const existingIndex = this.events.findIndex(ev => 
      ev.action === 'input' && (saiId && ev.targetId === saiId || ev.targetId === target.id)
    );

    if (existingIndex !== -1) {
      // Update existing event value instead of duplicating
      this.events[existingIndex].valueMasked = maskedVal;
      const latestSnapshot = this.capturePageSnapshot();
      if (latestSnapshot) {
        this.events[existingIndex].screenshotUrl = latestSnapshot;
      }
      return;
    }

    // Also fallback to lastEvent throttle if ref matches
    const lastEvent = this.events[this.events.length - 1];
    if (lastEvent && lastEvent.action === 'input' && (this.lastInputTargetRef === target)) {
      lastEvent.valueMasked = maskedVal;
      return;
    }

    this.lastInputTargetRef = target;

    // Find human label
    let label = target.labels?.[0]?.innerText?.trim();
    if (!label) {
      const parentLabel = target.closest('label')?.innerText?.trim();
      label = parentLabel || target.getAttribute('placeholder') || target.name || 'Saisie';
    }

    this.addEvent({
      action: 'input',
      buttonOrLabel: label.substring(0, 40),
      targetTag: target.tagName,
      targetId: saiId || target.id || undefined,
      x: inputX,
      y: inputY,
      valueMasked: maskedVal,
      hasSensitiveData: isSensitive
    });
  }

  private handleGlobalChange(e: Event): void {
    const target = e.target as HTMLSelectElement | HTMLInputElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const targetX = Math.round(rect.left + rect.width / 2);
    const targetY = Math.round(rect.top + rect.height / 2);

    if (target.tagName === 'SELECT') {
      const selectEl = target as HTMLSelectElement;
      const selectedOptionText = selectEl.options[selectEl.selectedIndex]?.text || selectEl.value;
      
      this.addEvent({
        action: 'select',
        buttonOrLabel: `Choix : ${selectedOptionText}`.substring(0, 45),
        targetTag: 'SELECT',
        targetId: target.id || undefined,
        x: targetX,
        y: targetY,
        valueMasked: selectEl.value
      });
    } else if (target.tagName === 'INPUT' && (target.type === 'checkbox' || target.type === 'radio')) {
      const label = target.closest('label')?.innerText?.trim() || target.name || 'Option';
      this.addEvent({
        action: 'click',
        buttonOrLabel: `${target.checked ? 'Coché' : 'Décoché'} : ${label}`.substring(0, 45),
        targetTag: 'INPUT',
        targetId: target.id || undefined,
        x: targetX,
        y: targetY
      });
    }
  }

  private handleGlobalSubmit(e: Event): void {
    const target = e.target as HTMLElement;
    let subX = 640;
    let subY = 400;
    if (target && target.getBoundingClientRect) {
      const rect = target.getBoundingClientRect();
      subX = Math.round(rect.left + rect.width / 2);
      subY = Math.round(rect.top + rect.height / 2);
    }
    this.addEvent({
      action: 'submit',
      buttonOrLabel: 'Validation Formulaire',
      targetTag: target?.tagName,
      x: subX,
      y: subY
    });
  }

  private addEvent(partial: Partial<RecordedEvent>): void {
    const nowMs = Date.now();
    const elapsedMs = Math.max(0, nowMs - this.startTimeMs);

    const minutes = Math.floor(elapsedMs / 60000);
    const seconds = Math.floor((elapsedMs % 60000) / 1000);
    const ms = Math.floor(elapsedMs % 1000);

    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;

    const snapshotDataUrl = this.capturePageSnapshot();
    const snapshotId = snapshotDataUrl ? `snap-${Date.now()}-${Math.floor(Math.random() * 1000)}` : undefined;

    const newEvent: RecordedEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestampMs: elapsedMs,
      timeFormatted,
      module: this.currentModuleName,
      page: this.currentPageName,
      action: partial.action || 'click',
      buttonOrLabel: partial.buttonOrLabel || 'Action',
      targetTag: partial.targetTag,
      targetId: partial.targetId,
      x: partial.x,
      y: partial.y,
      valueMasked: partial.valueMasked,
      hasSensitiveData: partial.hasSensitiveData || false,
      metadata: partial.metadata,
      screenshotUrl: snapshotDataUrl
    };

    this.events.push(newEvent);

    // Publish to central SAI Event Bus
    const saiEvent: SaiInteractionEvent = {
      id: newEvent.id,
      timestamp: elapsedMs,
      type: (partial.action?.toUpperCase() as any) || 'CLICK',
      module: this.currentModuleName,
      page: this.currentPageName,
      component: partial.targetTag || 'UIElement',
      action: partial.buttonOrLabel || 'Action',
      intent: `Intervention sur ${this.currentPageName}`,
      privacyLevel: partial.hasSensitiveData ? 'CONFIDENTIAL' : 'INTERNAL',
      merchantId: 'merchant-default',
      targetId: partial.targetId,
      coordinates: partial.x !== undefined && partial.y !== undefined ? { x: partial.x, y: partial.y } : undefined,
      valueMasked: partial.valueMasked,
      snapshotId
    };

    SaiEventBus.publish('sai:event_captured', saiEvent);

    if (snapshotDataUrl && snapshotId) {
      const saiSnapshot: SaiVisualSnapshot = {
        id: snapshotId,
        timestamp: elapsedMs,
        width: window.innerWidth || 1280,
        height: window.innerHeight || 800,
        dataUrl: snapshotDataUrl,
        privacyMasksApplied: partial.hasSensitiveData || false
      };
      SaiEventBus.publish('sai:snapshot_captured', saiSnapshot);
    }
  }

  /**
   * Captures a real DOM screenshot or SVG foreignObject snapshot of the active viewport with full CSS styles and live form field values
   */
  private capturePageSnapshot(): string | undefined {
    try {
      const mainContainer = document.querySelector('#root') || document.body;
      if (!mainContainer) return undefined;

      const w = window.innerWidth || 1280;
      const h = window.innerHeight || 800;

      // Sync DOM property values to attributes on input/textarea/select so innerHTML retains typed values!
      const inputs = mainContainer.querySelectorAll('input, textarea, select');
      inputs.forEach((input: any) => {
        if (input.tagName === 'INPUT') {
          if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) input.setAttribute('checked', 'checked');
            else input.removeAttribute('checked');
          } else {
            input.setAttribute('value', input.value || '');
          }
        } else if (input.tagName === 'TEXTAREA') {
          input.textContent = input.value || '';
          input.setAttribute('value', input.value || '');
        } else if (input.tagName === 'SELECT') {
          Array.from(input.options).forEach((opt: any) => {
            if (opt.selected) opt.setAttribute('selected', 'selected');
            else opt.removeAttribute('selected');
          });
        }
      });

      // Collect page inline stylesheets
      let styleRules = '';
      const styleElements = Array.from(document.querySelectorAll('style'));
      styleElements.forEach((el) => {
        if (el.innerHTML) {
          styleRules += el.innerHTML + '\n';
        }
      });

      // Strip @import rules which trigger CORS / security blocking in SVG canvas rendering context
      styleRules = styleRules
        .replace(/@import\s+url\([^)]+\);?/gi, '')
        .replace(/@import\s+["'][^"']+["'];?/gi, '');

      // Extract cleaned HTML content
      const cleanHtml = mainContainer.innerHTML
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/<img\b[^>]*src=["']\/(?!\/)[^"']*["'][^>]*>/gi, '');

      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <style>
          ${styleRules}
        </style>
        <foreignObject width="${w}" height="${h}">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; width: 100%; height: 100%; overflow: hidden; box-sizing: border-box;">
            ${cleanHtml}
          </div>
        </foreignObject>
      </svg>`;

      const base64Svg = btoa(unescape(encodeURIComponent(svgData)));
      return 'data:image/svg+xml;base64,' + base64Svg;
    } catch (err) {
      console.warn('capturePageSnapshot failed:', err);
      return undefined;
    }
  }
}
