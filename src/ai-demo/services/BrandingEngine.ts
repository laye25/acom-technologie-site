// src/ai-demo/services/BrandingEngine.ts
// BrandingEngine: Controls watermark, app logo, QR code overlays, and outro screen branding

import { BrandingConfig } from '../types';

export class BrandingEngine {
  public static getDefaultBranding(): BrandingConfig {
    return {
      showLogo: true,
      logoUrl: '/favicon.ico',
      appName: 'Acom Technologie',
      moduleName: 'Plateforme SaaS Multi-Services',
      version: 'v2.5.0',
      authorName: 'Équipe Acom Technologie',
      showQRCode: true,
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://acom-technologie.com',
      websiteUrl: 'https://acom-technologie.com',
      primaryColor: '#4f46e5',
      accentColor: '#10b981',
      showOutroScreen: true
    };
  }
}
