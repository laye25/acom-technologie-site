import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { dbService as dbService } from '../services/dbService';
import { db } from '../db/db'; // Dexie
import { syncService } from '../services/syncService';
import { useLiveQuery } from 'dexie-react-hooks';
import { Merchant, MerchantProduct, MerchantSale, MerchantQuote, MerchantQuoteItem, MerchantExpense, MerchantSupplier, MerchantPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Package, ShoppingCart, PieChart, Plus, Trash2, 
  Edit2, Search, Loader2, Save, X, TrendingUp, Download,
  DollarSign, ArrowUpRight, ArrowDownRight, AlertCircle,
  BarChart3, Settings, User, Phone, Mail, MapPin,
  Calculator, Receipt, CreditCard, Smartphone, Banknote,
  Clock, CheckCircle, TrendingDown, ArrowRight, FileText, Truck,
  Wrench, HardHat, Car, Users, GraduationCap, Stethoscope, Calendar,
  Briefcase, ClipboardList, ClipboardCheck, UserPlus, Building2, Check, Zap, Minus,
  Printer, HardDrive, Database, RefreshCw, Upload, Cpu, Terminal,
  Lock as LockIcon, GitBranch, Github, Monitor, MonitorUp, Rocket,
  Filter, SlidersHorizontal, ArrowUpDown, Tag, Scissors, Palette
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell 
} from 'recharts';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  startOfYear, eachMonthOfInterval, isSameDay, isSameMonth,
  startOfMonth, endOfMonth, getDay, addDays, startOfWeek, endOfWeek,
  addMonths
} from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import { billingService } from '../services/billingService';
import { activityService } from '../services/activityService';
import { GlobalActivityFeed } from '../components/GlobalActivityFeed';
import { DailyBriefing } from '../components/DailyBriefing';
import { OptimizedImage } from '../components/OptimizedImage';
import { NetworkStatusIndicator } from '../components/NetworkStatusIndicator';
import { payDunyaService } from '../services/payDunyaService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '../components/PaymentForm';
import { LogOut } from 'lucide-react';

const isDesktop = typeof window !== 'undefined' && (
  ('__TAURI__' in window) || 
  (window.process && (window.process as any).type) || 
  (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
  (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
);

const printPDF = (doc: jsPDF, filename = 'document_imprimer.pdf') => {
  try {
    // 1. Tell jsPDF to add the auto-print script to the PDF
    doc.autoPrint();

    // 2. Generate a standard, universally supported W3C Blob
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // If we are in Acom Gestion Desktop (Tauri/Electron context or local file), 
    // webview printing (IFrames) can be blocked by sandboxing or lack of native Webview2 print hooks.
    // Triggering direct download with a beautifully designed notice is 100% reliable and friendly.
    if (isDesktop) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(
        `Impression Desktop : Le fichier "${filename}" a été généré et téléchargé sur votre PC. Ouvrez-le pour l'imprimer directement.`, 
        { duration: 8000, position: 'top-center' }
      );
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 5000);
      return;
    }

    // 3. Web browser same-origin/cross-origin nested friendly tab popup opening.
    // Because modern browsers silently block nesting .print() on iframes inside sandboxed containers,
    // opening the PDF blob in a new tab is the absolute Gold Standard for web app printing.
    // Since doc.autoPrint() is embedded in the PDF, any PDF-capable browser (Chrome, Edge, Safari...)
    // will automatically summon the print dialog when the new sheet page finishes loading!
    const win = window.open(blobUrl, '_blank');
    if (win) {
      win.focus();
      toast.success('Génération réussie : l\'onglet d\'impression s\'est ouvert !', { position: 'top-center' });
    } else {
      // Safe fallback if popup blocker is aggressive
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast(
        `Le bloqueur de fenêtres a empêché l'ouverture directe. Le document PDF "${filename}" a été téléchargé sur votre disque pour impression.`, 
        { duration: 8000, position: 'top-center' }
      );
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  } catch (err) {
    console.error('Error auto-printing PDF:', err);
    try {
      doc.save(filename);
      toast.success('Le document PDF a été téléchargé.', { position: 'top-center' });
    } catch (e) {
      toast.error('Une erreur est survenue lors de la génération de l\'impression.', { position: 'top-center' });
    }
  }
};


const printDirectHTML = (merchant: Merchant, type: 'receipt' | 'invoice' | 'unpaid' | 'quote', data: any) => {
  const fmt = (num: number) => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const parts = Math.round(num).toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return parts.join('.');
  };

  const getFormattedDate = (createdAt: any) => {
    if (!createdAt) return format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    const dateVal = createdAt.seconds 
      ? new Date(createdAt.seconds * 1000) 
      : (createdAt instanceof Date ? createdAt : new Date(createdAt));
    try {
      return format(dateVal, 'dd/MM/yyyy HH:mm', { locale: fr });
    } catch (e) {
      return format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    }
  };

  const getFormattedExpiryDate = (validUntil: any) => {
    if (!validUntil) return "-";
    const dateVal = validUntil.seconds 
      ? new Date(validUntil.seconds * 1000) 
      : (validUntil instanceof Date ? validUntil : new Date(validUntil));
    try {
      return format(dateVal, 'dd/MM/yyyy', { locale: fr });
    } catch (e) {
      return "-";
    }
  };

  const formattedDate = getFormattedDate(data.createdAt);

  let htmlContent = "";

  if (type === 'receipt') {
    // Elegant POS Ticket Thermal Layout (80mm)
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reçu POS - ${merchant.name.replace(/"/g, '&quot;')}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 4mm;
        width: 72mm;
      }
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #000;
      background-color: #fff;
      margin: 0 auto;
      padding: 6mm;
      width: 72mm;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: bold; }
    .flex { display: flex; }
    .justify-between { justify-content: space-between; }
    .logo-container { text-align: center; margin-bottom: 3mm; }
    .logo { max-width: 32mm; max-height: 16mm; object-fit: contain; }
    .divider { border-top: 1px dashed #000; margin: 3mm 0; }
    .merchant-name { font-size: 14px; font-weight: bold; margin-bottom: 1mm; text-transform: uppercase; }
    .doc-title { font-size: 11px; font-weight: bold; margin: 2mm 0; letter-spacing: 1.5px; }
    .item-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
    .item-table th { border-bottom: 1px solid #000; font-weight: bold; text-align: left; padding-bottom: 1mm; }
    .item-table td { padding: 1.5mm 0; vertical-align: top; }
    .total-section { margin-top: 3mm; font-size: 12px; }
    .footer { margin-top: 6mm; font-size: 9px; font-style: italic; text-align: center; }
  </style>
</head>
<body>
  ${merchant.logo ? `<div class="logo-container"><img class="logo" src="${merchant.logo}" alt="Logo" /></div>` : ''}
  <div class="text-center">
    <div class="merchant-name">${merchant.name.replace(/"/g, '&quot;')}</div>
    ${merchant.address ? `<div>${merchant.address.replace(/"/g, '&quot;')}</div>` : ''}
    ${merchant.phone ? `<div>Tél: ${merchant.phone}</div>` : ''}
    ${merchant.email ? `<div>Email: ${merchant.email}</div>` : ''}
  </div>
  
  <div class="divider"></div>
  
  <div class="flex justify-between" style="font-size: 10px;">
    <span>N° Ticket: RECU-${(data.id || '').slice(0, 8).toUpperCase()}</span>
    <span>Date: ${formattedDate}</span>
  </div>
  <div style="font-size: 10px; margin-top: 1mm;">Client: <span class="text-bold">${(data.customerName || 'Client POS').replace(/"/g, '&quot;')}</span></div>
  
  <div class="divider"></div>
  
  <div class="text-center text-bold doc-title">TICKET REÇU DE CAISSE</div>
  
  <table class="item-table">
    <thead>
      <tr>
        <th style="width: 50%;">Article</th>
        <th class="text-center" style="width: 15%;">Qté</th>
        <th class="text-right" style="width: 35%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${(data.items || []).map((it: any) => `
        <tr>
          <td>
            <div class="text-bold">${it.name.replace(/"/g, '&quot;')}</div>
            ${(it.sizes || it.colors) ? `
              <div style="font-size: 8.5px; color: #475569; background: #eef2f6; padding: 1px 4px; display: inline-block; border-radius: 3px; font-weight: bold; margin-top: 2px;">
                ${it.sizes ? `T: ${it.sizes}` : ''} ${it.sizes && it.colors ? '|' : ''} ${it.colors ? `C: ${it.colors}` : ''}
              </div>
            ` : ''}
            <div style="font-size: 9px; color: #444; margin-top: 2px;">${fmt(it.price)} ${merchant.currency} / u</div>
          </td>
          <td class="text-center">${it.quantity}</td>
          <td class="text-right">${fmt(it.price * it.quantity)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="divider"></div>
  
  <div class="total-section">
    <div class="flex justify-between text-bold" style="font-size: 13px; margin-bottom: 1.5mm;">
      <span>TOTAL TTC</span>
      <span>${fmt(data.totalAmount)} ${merchant.currency}</span>
    </div>
    ${data.paymentMethod ? `
      <div class="flex justify-between" style="font-size: 10px; color: #333;">
        <span>Mode de Paiement:</span>
        <span class="text-bold" style="text-transform: uppercase;">${data.paymentMethod}</span>
      </div>
    ` : ''}
    ${data.receivedAmount !== undefined && data.receivedAmount > 0 ? `
      <div class="flex justify-between font-mono" style="font-size: 10px; color: #333; margin-top: 0.5mm;">
        <span>Espèces Reçues:</span>
        <span>${fmt(data.receivedAmount)} ${merchant.currency}</span>
      </div>
    ` : ''}
    ${data.changeReturned !== undefined && data.changeReturned > 0 ? `
      <div class="flex justify-between font-mono" style="font-size: 10px; color: #333; margin-top: 0.5mm;">
        <span>Rendu de monnaie:</span>
        <span>${fmt(data.changeReturned)} ${merchant.currency}</span>
      </div>
    ` : ''}
  </div>
  
  <div class="divider"></div>
  
  <div class="footer">
    <p>Merci de votre confiance !</p>
    <p style="font-size: 8px; font-family: monospace; color: #777;">Généré par Acom Technologie Desktop</p>
  </div>
</body>
</html>
    `;
  } else {
    // Beautiful, Responsive A4 Layout (Invoice, Unpaid Reminder, or Quote)
    htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${type === 'quote' ? 'Devis' : 'Facture'} - ${merchant.name.replace(/"/g, '&quot;')}</title>
  <style>
    @media print {
      @page {
        size: A4;
        margin: 15mm;
      }
      body {
        margin: 0;
        background-color: #fff;
      }
      .no-print {
        display: none !important;
      }
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #1e293b;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
    }
    .print-container {
      background-color: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 35px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      position: relative;
    }
    @media print {
      .print-container {
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
    
    .accent-bg {
      background-color: ${type === 'quote' ? '#0e7490' : type === 'unpaid' ? '#e11d48' : '#10b981'};
    }
    .accent-text {
      color: ${type === 'quote' ? '#0e7490' : type === 'unpaid' ? '#e11d48' : '#10b981'};
    }
    
    .header-layout {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 25px;
    }
    .company-logo {
      max-width: 140px;
      max-height: 65px;
      object-fit: contain;
      margin-bottom: 12px;
    }
    .company-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .doc-banner {
      font-size: 24px;
      font-weight: 900;
      text-align: right;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }
    .doc-ref {
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      margin-top: 5px;
      line-height: 1.4;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 25px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .client-card {
      background-color: #f8fafc;
      padding: 15px;
      border-radius: 12px;
      border: 1px solid #f1f5f9;
    }
    .client-name {
      font-size: 13px;
      font-weight: 750;
      color: #0f172a;
      margin-bottom: 4px;
    }
    
    .unpaid-alert {
      background-color: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .modern-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .modern-table th {
      background-color: #f8fafc;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      text-align: left;
      padding: 10px 14px;
      border-bottom: 2px solid #e2e8f0;
    }
    .modern-table td {
      padding: 11px 14px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 11px;
    }
    .modern-table tr:nth-child(even) {
      background-color: #fcfdfe;
    }
    
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-box {
      width: 280px;
      background-color: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      padding: 14px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 11px;
      color: #475569;
    }
    .totals-row.grand-total {
      border-top: 1px solid #e2e8f0;
      margin-top: 8px;
      padding-top: 10px;
      font-size: 14px;
      font-weight: 850;
      color: #0f172a;
    }
    
    .stamp-diagonal {
      position: absolute;
      top: 35%;
      left: 30%;
      transform: rotate(-25deg);
      opacity: 0.07;
      font-size: 55px;
      font-weight: 900;
      color: ${type === 'unpaid' ? '#e11d48' : type === 'quote' ? '#0e7490' : '#10b981'};
      pointer-events: none;
      border: 8px double ${type === 'unpaid' ? '#e11d48' : type === 'quote' ? '#0e7490' : '#10b981'};
      padding: 10px 20px;
      text-transform: uppercase;
      letter-spacing: 4px;
    }
    
    .signature-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      margin-top: 40px;
      padding-top: 25px;
      border-top: 1px dashed #e2e8f0;
    }
    .signature-area {
      height: 60px;
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 8px;
    }
    
    .footer-center {
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      margin-top: 60px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${type === 'unpaid' ? `<div class="stamp-diagonal">IMPAYÉ</div>` : type === 'quote' ? `<div class="stamp-diagonal">DEVIS</div>` : `<div class="stamp-diagonal">FACTURE</div>`}
    
    <div style="height: 4px; border-radius: 4px; margin-bottom: 25px;" class="accent-bg"></div>

    <div class="header-layout">
      <div>
        ${merchant.logo ? `<img class="company-logo" src="${merchant.logo}" alt="Logo" />` : ''}
        <div class="company-name">${merchant.name.replace(/"/g, '&quot;')}</div>
        <div style="color: #64748b; font-size: 10px; font-weight: 500; line-height: 1.4;">
          ${merchant.address ? `<div>${merchant.address.replace(/"/g, '&quot;')}</div>` : ''}
          ${merchant.phone ? `<div>Tél: ${merchant.phone}</div>` : ''}
          ${merchant.email ? `<div>Email: ${merchant.email}</div>` : ''}
        </div>
      </div>
      
      <div style="text-align: right;">
        <div class="doc-banner accent-text">
          ${type === 'quote' ? 'DEVIS PROFORMA' : type === 'unpaid' ? "AVIS D'IMPAYÉ" : 'FACTURE'}
        </div>
        <div class="doc-ref">
          N° ${type === 'quote' ? 'QT' : 'INV'}-${(data.id || '').slice(0, 8).toUpperCase()}<br>
          Date émission : ${formattedDate.split(' ')[0]}<br>
          ${type === 'quote' ? `Valide jusqu'au : ${getFormattedExpiryDate(data.validUntil)}` : `Statut : ${data.balance === 0 ? 'PAYÉE' : 'CRÉDIT'}`}
        </div>
      </div>
    </div>

    ${type === 'unpaid' && data.balance > 0 ? `
      <div class="unpaid-alert">
        <span style="color: #991b1b; font-weight: 700; font-size: 11px;">
          RAPPEL DE SOLDE DÉBITEUR : Cette facture présente un reste à payer de ${fmt(data.balance)} ${merchant.currency}. Merci de bien vouloir régulariser ce solde.
        </span>
      </div>
    ` : ''}

    <div class="meta-grid">
      <div>
        <div class="section-title">Facturé à :</div>
        <div class="client-card">
          <div class="client-name">${(data.customerName || 'Client de passage').replace(/"/g, '&quot;')}</div>
          ${data.customerPhone ? `<div style="color: #64748b; margin-top: 2px;">Tél: ${data.customerPhone}</div>` : ''}
          ${data.customerAddress ? `<div style="color: #64748b; margin-top: 2px;">Adresse: ${data.customerAddress.replace(/"/g, '&quot;')}</div>` : ''}
        </div>
      </div>
      
      <div>
        <div class="section-title">Détails Règlement :</div>
        <div style="font-size: 11px; color: #475569; padding: 4px 0; line-height: 1.6;">
          ${type === 'quote' ? `
            <div><strong>Durée de validité :</strong> 30 jours calendaires</div>
            <div><strong>Objet :</strong> Proposition de prix de marchandises</div>
          ` : `
            <div><strong>Mode d'encaissement :</strong> ${data.paymentMethod || 'Espèces'}</div>
            <div><strong>Statut de paiement :</strong> ${data.balance === 0 ? '<span style="color: #16a34a; font-weight: bold;">ENTIÈREMENT RÉGLÉ</span>' : `<span style="color: #e11d48; font-weight: bold;">CRÉDIT EN ATTENTE RELANCE</span>`}</div>
          `}
        </div>
      </div>
    </div>

    <table class="modern-table">
      <thead>
        <tr>
          <th>Désignation Article</th>
          <th class="text-right" style="width: 20%;">Prix Unitaire</th>
          <th class="text-center" style="width: 15%;">Quantité</th>
          <th class="text-right" style="width: 25%;">Montant Total</th>
        </tr>
      </thead>
      <tbody>
        ${(data.items || []).map((it: any) => `
          <tr>
            <td style="font-weight: 600; color: #0f172a;">
              <div>${it.name.replace(/"/g, '&quot;')}</div>
              ${(it.sizes || it.colors) ? `
                <div style="font-size: 9px; color: #4b5563; font-weight: normal; margin-top: 4px; display: flex; gap: 6px;">
                  ${it.sizes ? `<span style="background: #eff6ff; color: #1d4ed8; font-weight: bold; padding: 1px 5px; border-radius: 4px; font-family: monospace;">T: ${it.sizes}</span>` : ''}
                  ${it.colors ? `<span style="background: #ecfdf5; color: #047857; font-weight: bold; padding: 1px 5px; border-radius: 4px; font-family: monospace;">C: ${it.colors}</span>` : ''}
                </div>
              ` : ''}
            </td>
            <td class="text-right">${fmt(it.price)} ${merchant.currency}</td>
            <td class="text-center">${it.quantity}</td>
            <td class="text-right" style="font-weight: 700;">${fmt(it.price * it.quantity)} ${merchant.currency}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="totals-row">
          <span>Sous-total HT</span>
          <span style="font-weight: 600;">${fmt(data.totalAmount)} ${merchant.currency}</span>
        </div>
        <div class="totals-row">
          <span>Taxes / TVA (0%)</span>
          <span>0 ${merchant.currency}</span>
        </div>
        <div class="totals-row grand-total">
          <span>TOTAL TTC</span>
          <span class="accent-text">${fmt(data.totalAmount)} ${merchant.currency}</span>
        </div>
        
        ${type !== 'quote' && data.receivedAmount !== undefined ? `
          <div class="totals-row" style="margin-top: 5px; border-top: 1px dashed #e2e8f0; padding-top: 5px;">
            <span>Acompte Versé :</span>
            <span>${fmt(data.receivedAmount)} ${merchant.currency}</span>
          </div>
        ` : ''}
        ${type !== 'quote' && data.balance !== undefined ? `
          <div class="totals-row">
            <span>Reste à percevoir :</span>
            <span style="font-weight: bold; color: ${data.balance > 0 ? '#e11d48' : '#16a34a'}">${fmt(data.balance)} ${merchant.currency}</span>
          </div>
        ` : ''}
      </div>
    </div>

    <div style="font-size: 8.5px; color: #64748b; line-height: 1.5; margin-top: 15px;">
      <strong>Mentions Légales :</strong> Sauf avis contraire, le règlement des factures s'effectue au comptant lors de l'achat. Ce document constitue une pièce justificative officielle de la transaction financière.
    </div>

    <div class="signature-container">
      <div>
        <div class="section-title">Bon pour accord (Client)</div>
        <div style="font-size: 8px; color: #94a3b8; font-style: italic; margin-bottom: 5px;">Mention manuscrite "Lu et approuvé" + Date obligatoire</div>
        <div class="signature-area"></div>
      </div>
      <div style="text-align: right;">
        <div class="section-title">Cachet et Signature de l'Établissement</div>
        <div style="font-size: 8px; color: #94a3b8; font-style: italic; margin-bottom: 5px;">Acom Technologie Authorized Stamp</div>
        <div class="signature-area"></div>
      </div>
    </div>

    <div class="footer-center">
      Solution de Facturation Acom Gestion v1.0 - Émise numériquement
    </div>
  </div>
</body>
</html>
    `;
  }

  let printFrame = document.getElementById('print-iframe') as HTMLIFrameElement;
  if (!printFrame) {
    printFrame = document.createElement('iframe');
    printFrame.id = 'print-iframe';
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    printFrame.style.width = '850px';
    printFrame.style.height = '900px';
    printFrame.style.visibility = 'hidden';
    document.body.appendChild(printFrame);
  }

  const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();
    
    // Give the browser window resources/images a brief moment to mount, then execute print
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    }, 400);
  }
};

const pdfFormatNum = (num: number) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  const parts = Math.round(num).toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.join('.');
};


const generateReceiptPDF = (merchant: Merchant, sale: any, action: 'print' | 'download' = 'download') => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Receipt printer format
  });

  const margin = 5;
  let y = 10;

  // Header
  if (merchant.logo) {
    try {
      const imgData = merchant.logo;
      const format = imgData.startsWith('data:image/png') ? 'PNG' : (imgData.startsWith('data:image/webp') ? 'WEBP' : 'JPEG');
      doc.addImage(imgData, format, 30, y, 20, 20, undefined, 'FAST');
      y += 25;
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(merchant.name, 40, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  if (merchant.address) {
    doc.text(merchant.address, 40, y, { align: 'center' });
    y += 4;
  }
  if (merchant.phone) {
    doc.text(`Tel: ${merchant.phone}`, 40, y, { align: 'center' });
    y += 4;
  }
  
  doc.line(margin, y, 80 - margin, y);
  y += 5;

  // Sale Info
  const saleDate = sale.createdAt?.seconds 
    ? new Date(sale.createdAt.seconds * 1000) 
    : sale.createdAt instanceof Date 
      ? sale.createdAt 
      : new Date();
      
  doc.text(`Date: ${format(saleDate, 'dd/MM/yyyy HH:mm')}`, margin, y);
  y += 4;
  doc.text(`Client: ${sale.customerName || 'Client POS'}`, margin, y);
  y += 6;

  // Items Header
  doc.setFont('helvetica', 'bold');
  doc.text('Article', margin, y);
  doc.text('Qté', 45, y);
  doc.text('Total', 75, y, { align: 'right' });
  y += 3;
  doc.line(margin, y, 80 - margin, y);
  y += 5;

  // Items
  sale.items.forEach((item: any) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(item.name.substring(0, 20), margin, y);
    doc.text(item.quantity.toString(), 45, y);
    doc.text(`${pdfFormatNum(item.price * item.quantity)}`, 75, y, { align: 'right' });
    y += 4;

    const hasDetails = !!(item.sizes || item.colors);
    if (hasDetails) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      const detailParts: string[] = [];
      if (item.sizes) detailParts.push(`Taille: ${item.sizes}`);
      if (item.colors) detailParts.push(`Couleur: ${item.colors}`);
      doc.text(detailParts.join(' | '), margin, y - 1);
      y += 3.5;
    }
  });

  y += 2;
  doc.line(margin, y, 80 - margin, y);
  y += 6;

  // Total
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin, y);
  doc.text(`${pdfFormatNum(sale.totalAmount)} ${merchant.currency}`, 75, y, { align: 'right' });
  y += 8;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Merci de votre visite !', 40, y, { align: 'center' });

  if (action === 'print') {
    printPDF(doc, `recu_ticket_${sale.id || Date.now()}.pdf`);
  } else {
    doc.save(`recu_${sale.id || Date.now()}.pdf`);
  }
};

const generateA4InvoicePDF = (merchant: Merchant, sale: any, action: 'print' | 'download' = 'download', customType?: 'invoice' | 'unpaid') => {
  const doc = new jsPDF();
  const margin = 20;
  
  // Track vertical coordinates independently to prevent any overlap
  let leftY = 20;

  // Diagonal stamp for unpaid notice
  if (customType === 'unpaid') {
    doc.setFontSize(40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(254, 226, 226); // Soft light pink/red
    doc.text('IMPAYÉ / RELANCE', 105, 140, { align: 'center', angle: -30 });
    doc.setTextColor(0); // Reset grayscale color
  }
  
  // Left Side Header - Company Information and Logo
  if (merchant.logo) {
    try {
      const imgData = merchant.logo;
      const format = imgData.startsWith('data:image/png') ? 'PNG' : (imgData.startsWith('data:image/webp') ? 'WEBP' : 'JPEG');
      doc.addImage(imgData, format, margin, leftY, 26, 26, undefined, 'FAST');
      leftY += 32;
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(merchant.name, margin, leftY);
  leftY += 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500
  if (merchant.address) { doc.text(merchant.address, margin, leftY); leftY += 4.5; }
  if (merchant.phone) { doc.text(`Tél: ${merchant.phone}`, margin, leftY); leftY += 4.5; }
  if (merchant.email) { doc.text(`Email: ${merchant.email}`, margin, leftY); leftY += 4.5; }

  // Right Side Header - Invoice title and unique references
  let rightY = 20;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  if (customType === 'unpaid') {
    doc.setTextColor(185, 28, 28); // Crimson Red for Unpaid
    doc.text("AVIS D'IMPAYÉ", 190, rightY, { align: 'right' });
  } else {
    doc.setTextColor(220, 38, 38); // Professional warm Red
    doc.text('FACTURE', 190, rightY, { align: 'right' });
  }
  rightY += 10;
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(`N° Facture : INV-${sale.id.slice(0, 8).toUpperCase()}`, 190, rightY, { align: 'right' });
  rightY += 5.5;
  
  const dateStr = sale.createdAt?.seconds 
    ? format(new Date(sale.createdAt.seconds * 1000), 'dd/MM/yyyy') 
    : format(new Date(sale.createdAt || Date.now()), 'dd/MM/yyyy');
  doc.text(`Date : ${dateStr}`, 190, rightY, { align: 'right' });
  rightY += 5.5;

  // Use the exact maximum height of left/right sections to start client block. Overlap impossible!
  let y = Math.max(leftY, rightY) + 12;

  // Client Information Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('FACTURÉ À :', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate-900 (Bold Name)
  doc.text(sale.customerName || 'Client de passage', margin, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  if (sale.customerPhone) { 
    doc.text(`Tél : ${sale.customerPhone}`, margin, y); 
    y += 5; 
  }

  // Warning banner for unpaid status/reminders
  if (customType === 'unpaid') {
    y += 3;
    doc.setFillColor(254, 242, 242); // Soft light red background card
    doc.rect(margin, y, 170, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(153, 27, 27); // Deep red text
    doc.text("RAPPEL DE SOLDE DEBITEUR : Cette facture présente un reste à payer. Merci de bien vouloir régulariser le solde.", margin + 4, y + 6);
    y += 12;
  }

  // Elegant Document Table Header
  y += 8;
  doc.setFillColor(241, 245, 249); // Slate-100 fill
  doc.rect(margin, y, 170, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text('Description', margin + 3, y + 6.5);
  doc.text('Qté', 135, y + 6.5, { align: 'center' });
  doc.text('PU', 160, y + 6.5, { align: 'right' });
  doc.text('Total', 186, y + 6.5, { align: 'right' });

  // Document Table Rows
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // Slate-700
  
  sale.items.forEach((item: any, index: number) => {
    const hasDetails = !!(item.sizes || item.colors);
    const rowHeight = hasDetails ? 13 : 9;

    // Alternating rows style
    if (index % 2 === 0) doc.setFillColor(248, 250, 252); // Slate-50
    else doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, 170, rowHeight, 'F');
    
    // Light bottom divider lines
    doc.setDrawColor(241, 245, 249); // Slate-100
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, margin + 170, y + rowHeight);
    
    // Grid values mapping
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(item.name, margin + 3, y + 5.5);

    if (hasDetails) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      const detailParts: string[] = [];
      if (item.sizes) detailParts.push(`Taille: ${item.sizes}`);
      if (item.colors) detailParts.push(`Couleur: ${item.colors}`);
      doc.text(detailParts.join(' | '), margin + 3, y + 9.5);
      
      // Reset font for standard columns
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // Slate-700
    }

    doc.text(item.quantity.toString(), 135, y + 5.5, { align: 'center' });
    doc.text(pdfFormatNum(item.price), 160, y + 5.5, { align: 'right' });
    doc.text(pdfFormatNum(item.price * item.quantity), 186, y + 5.5, { align: 'right' });
    y += rowHeight;
  });

  // Table Bottom Summary Separator
  y += 6;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(110, y, 190, y);
  y += 7;
  
  // Total Volume Header
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('TOTAL DE LA COMMANDE', 145, y, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(`${pdfFormatNum(sale.totalAmount)} ${merchant.currency}`, 186, y, { align: 'right' });

  // Payments List
  if (sale.payments && sale.payments.length > 0) {
    y += 7;
    doc.setDrawColor(241, 245, 249); // Slate-100
    doc.setLineWidth(0.3);
    doc.line(110, y, 190, y);
    y += 5;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('HISTORIQUE DES PAIEMENTS', 145, y, { align: 'right' });
    y += 4.5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    sale.payments.forEach((p: any) => {
      const pDate = p.date?.seconds 
        ? format(new Date(p.date.seconds * 1000), 'dd/MM/yy')
        : format(new Date(p.date), 'dd/MM/yy');
      doc.text(`${pDate} - ${p.method.toUpperCase()}`, 145, y, { align: 'right' });
      doc.text(`${pdfFormatNum(p.amount)} ${merchant.currency}`, 186, y, { align: 'right' });
      y += 4;
    });
    
    y += 2;
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(110, y, 190, y);
    y += 7;
  } else {
    y += 7;
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.5);
    doc.line(110, y, 190, y);
    y += 7;
  }

  // Outstanding/Remaining Debt Highlight Info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate-800
  
  const isPending = sale.balance !== undefined && sale.balance > 0;
  doc.text(isPending ? 'RESTE À PAYER' : 'TOTAL PAYÉ (SOLDE)', 145, y, { align: 'right' });
  
  if (isPending) {
    doc.setTextColor(220, 38, 38); // Red-600 (Outstanding)
  } else {
    doc.setTextColor(22, 163, 74); // Green-600 (Fully cleared)
  }
  
  const displayAmount = sale.balance !== undefined ? (sale.balance > 0 ? sale.balance : sale.paidAmount) : sale.totalAmount;
  doc.text(`${pdfFormatNum(displayAmount || 0)} ${merchant.currency}`, 186, y, { align: 'right' });

  // Signature Block
  y = Math.max(y + 15, 222);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("Signature Client", margin + 15, y);
  doc.text("Cachet & Signature Vendeur", 190 - 15, y, { align: 'right' });

  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("(Précédée de la mention \"Lu et approuvé\")", margin + 15, y);

  y += 18;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(margin + 10, y, margin + 65, y);
  doc.line(190 - 65, y, 190 - 10, y);

  // Centered Universal Page Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Généré via Acom Technologie - Studio Acom POS', 105, 280, { align: 'center' });

  if (action === 'print') {
    printPDF(doc, `facture_A4_${sale.id.slice(0, 8)}.pdf`);
  } else {
    doc.save(`facture_${sale.id.slice(0, 8)}.pdf`);
  }
};

const generateA4QuotePDF = (merchant: Merchant, quote: any, action: 'print' | 'download' = 'download') => {
  const doc = new jsPDF();
  const margin = 20;
  
  // Track vertical coordinates independently to prevent any overlap
  let leftY = 20;
  
  // Left Side Header - Company Information and Logo
  if (merchant.logo) {
    try {
      const imgData = merchant.logo;
      const format = imgData.startsWith('data:image/png') ? 'PNG' : (imgData.startsWith('data:image/webp') ? 'WEBP' : 'JPEG');
      doc.addImage(imgData, format, margin, leftY, 26, 26, undefined, 'FAST');
      leftY += 32;
    } catch (e) {
      console.error('Error adding logo to PDF', e);
    }
  }

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(merchant.name, margin, leftY);
  leftY += 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate-500
  if (merchant.address) { doc.text(merchant.address, margin, leftY); leftY += 4.5; }
  if (merchant.phone) { doc.text(`Tél: ${merchant.phone}`, margin, leftY); leftY += 4.5; }
  if (merchant.email) { doc.text(`Email: ${merchant.email}`, margin, leftY); leftY += 4.5; }

  // Right Side Header - Quote Title and validity dates
  let rightY = 20;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 116, 144); // Cyan/Teal-700 theme
  doc.text('DEVIS', 190, rightY, { align: 'right' });
  rightY += 10;
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(`N° Devis : QT-${quote.id.slice(0, 8).toUpperCase()}`, 190, rightY, { align: 'right' });
  rightY += 5.5;
  
  const dateStr = quote.createdAt?.seconds 
    ? format(new Date(quote.createdAt.seconds * 1000), 'dd/MM/yyyy') 
    : format(new Date(quote.createdAt || Date.now()), 'dd/MM/yyyy');
  doc.text(`Date émission : ${dateStr}`, 190, rightY, { align: 'right' });
  rightY += 5.5;
  
  const expiryStr = quote.validUntil?.seconds
    ? format(new Date(quote.validUntil.seconds * 1000), 'dd/MM/yyyy')
    : quote.validUntil ? format(new Date(quote.validUntil), 'dd/MM/yyyy') : '-';
  doc.text(`Valide jusqu'au : ${expiryStr}`, 190, rightY, { align: 'right' });
  rightY += 5.5;

  // Set the start position of Client Quote info with maximum safety margin
  let y = Math.max(leftY, rightY) + 12;

  // Quote Recipient Client Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('DEVIS POUR :', margin, y);
  y += 6;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // Slate-900 (Client Name)
  doc.text(quote.customerName || 'Client prospect', margin, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  if (quote.customerPhone) { doc.text(`Tél : ${quote.customerPhone}`, margin, y); y += 4.5; }
  if (quote.customerAddress) { doc.text(`Adresse : ${quote.customerAddress}`, margin, y); y += 4.5; }

  // Quote Table Header
  y += 8;
  doc.setFillColor(241, 245, 249); // Slate-100 fill
  doc.rect(margin, y, 170, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text('Description', margin + 3, y + 6.5);
  doc.text('Qté', 135, y + 6.5, { align: 'center' });
  doc.text('PU', 160, y + 6.5, { align: 'right' });
  doc.text('Total', 186, y + 6.5, { align: 'right' });

  // Quote Table Body Content
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85); // Slate-700
  
  quote.items.forEach((item: any, index: number) => {
    const hasDetails = !!(item.sizes || item.colors);
    const rowHeight = hasDetails ? 13 : 9;

    if (index % 2 === 0) doc.setFillColor(248, 250, 252); // Slate-50
    else doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, 170, rowHeight, 'F');
    
    // Grid boundary fine lines
    doc.setDrawColor(241, 245, 249); // Slate-100
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowHeight, margin + 170, y + rowHeight);
    
    // Write aligned item details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.text(item.name, margin + 3, y + 5.5);

    if (hasDetails) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Slate-500
      const detailParts: string[] = [];
      if (item.sizes) detailParts.push(`Taille: ${item.sizes}`);
      if (item.colors) detailParts.push(`Couleur: ${item.colors}`);
      doc.text(detailParts.join(' | '), margin + 3, y + 9.5);
      
      // Reset font for standard columns
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85); // Slate-700
    }

    doc.text(item.quantity.toString(), 135, y + 5.5, { align: 'center' });
    doc.text(pdfFormatNum(item.price), 160, y + 5.5, { align: 'right' });
    doc.text(pdfFormatNum(item.price * item.quantity), 186, y + 5.5, { align: 'right' });
    y += rowHeight;
  });

  // Bottom Quote Summary
  y += 6;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(110, y, 190, y);
  y += 7;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text('MONTANT TOTAL ESTIMÉ', 150, y, { align: 'right' });
  
  doc.setTextColor(14, 116, 144); // Cyan/Teal-700
  doc.text(`${pdfFormatNum(quote.totalAmount)} ${merchant.currency}`, 186, y, { align: 'right' });

  // Expiry or Observation notes
  y += 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('Note : Esthétique d\'évaluation tarifaire, ceci n\'est pas une facture finale.', margin, y);
  
  if (quote.notes) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Observations : ${quote.notes}`, margin, y);
  }

  // Signature Block
  y = Math.max(y + 15, 222);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text("Signature Client", margin + 15, y);
  doc.text("Cachet & Signature Vendeur", 190 - 15, y, { align: 'right' });

  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("(Précédée de la mention \"Bon pour accord\")", margin + 15, y);

  y += 18;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(margin + 10, y, margin + 65, y);
  doc.line(190 - 65, y, 190 - 10, y);

  // Footer Center label
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Généré via Acom Technologie - Studio Acom POS', 105, 280, { align: 'center' });

  if (action === 'print') {
    printPDF(doc, `devis_A4_${quote.id.slice(0, 8)}.pdf`);
  } else {
    doc.save(`devis_${quote.id.slice(0, 8)}.pdf`);
  }
};

const MerchantSaaS = () => {
  const { user, signOut } = useAuth();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loadingMerchant, setLoadingMerchant] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Handle payment success from PayDunya
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const isSuccess = searchParams.get('payment_success') === 'true';
      const newPlan = searchParams.get('new_plan') as MerchantPlan;
      const merchantId = searchParams.get('merchant_id');

      if (isSuccess && newPlan && merchantId && merchant && merchant.id === merchantId) {
        if (merchant.plan !== newPlan) {
          try {
            const updatedMerchant = { 
              ...merchant, 
              plan: newPlan,
              licenseType: newPlan === 'LOCAL' ? 'local' : merchant.licenseType,
              updatedAt: new Date() 
            };
            await dbService.merchants.save(updatedMerchant);
            setMerchant(updatedMerchant);
            toast.success(`Votre plan a été mis à jour avec succès : ${newPlan} !`, {
              duration: 5000,
              icon: '🎉'
            });
            
            // Clear URL parameters
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('payment_success');
            newParams.delete('new_plan');
            newParams.delete('merchant_id');
            newParams.delete('token');
            setSearchParams(newParams, { replace: true });
          } catch (error) {
            console.error('Error updating plan after payment:', error);
            toast.error('Erreur lors de la mise à jour de votre forfait.');
          }
        }
      }
    };
    
    if (merchant) {
      handlePaymentSuccess();
    }
  }, [searchParams, merchant, setSearchParams]);

  // Handle auto-show upgrade modal from URL
  useEffect(() => {
    if (searchParams.get('show_upgrade') === 'true') {
      setShowUpgradeModal(true);
      
      // Optionally clear the param so it doesn't pop up again on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('show_upgrade');
      // We keep target_plan for the modal to use if we want
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch merchant profile
  useEffect(() => {
    const fetchMerchant = async () => {
      if (!user) return;
      try {
        setLoadingMerchant(true);
        setError(null);
        
        let localMerchant = await db.merchants.where('owner_id').equals(user.uid).first();
        if (!localMerchant) {
          const allMerchants = await db.merchants.toArray();
          localMerchant = allMerchants.find(m => m.ownerId === user.uid || m.owner_id === user.uid);
        }

        // Fetch from Supabase via dbService
        const m = await dbService.merchants.getByOwner(user.uid);
        
        const finalMerchant = m || localMerchant;
        
        if (m && m.id) {
            // Update local cache
            await db.merchants.put({ ...m, id: m.id });
        } else if (localMerchant && localMerchant.id) {
            // Rescue: it's local but not in cloud, push it to cloud now!
            await dbService.merchants.save(localMerchant);
        }
        
        // Check for quota
        const quotaExceeded = localStorage.getItem('firebase_quota_exceeded');
        if (quotaExceeded && !finalMerchant) {
          setError(`Quota Firestore épuisé. Impossible de charger le profil marchand pour ${user.email}.`);
        } else {
          setMerchant(finalMerchant || null);
        }
      } catch (error: any) {
        console.error('Error fetching merchant:', error);
        // If it's a new user and there's an error fetching, we don't block them.
        // We set merchant to null which will trigger the Onboarding screen.
        setMerchant(null);
      } finally {
        setLoadingMerchant(false);
      }
    };
    fetchMerchant();
  }, [user]);

  const isCloudSyncEnabled = merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM';
  
  const [siteSettings, setSiteSettings] = useState<any>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const globalSettings = await dbService.settings.get('global');
        setSiteSettings(globalSettings);
      } catch (error) {
        console.error('Error fetching global settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Data Synchronization: BackgroundSyncManager handles it

  const getTabs = (type: string, plan: string) => {
    let tabs: any[] = [];

    switch (type) {
      case 'entreprise':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'interventions', label: 'Interventions', icon: Wrench },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'chantier':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'projects', label: 'Projets', icon: HardHat },
          { id: 'inventory', label: 'Matériel', icon: Package },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'transport':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'vehicles', label: 'Véhicules', icon: Car },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'rh':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'employees', label: 'Employés', icon: Users },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'scolaire':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'students', label: 'Élèves', icon: GraduationCap },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      case 'medical':
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'patients', label: 'Patients', icon: Stethoscope },
          { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
      default: // boutique
        tabs = [
          { id: 'dashboard', label: 'Aperçu', icon: PieChart },
          { id: 'inventory', label: 'Stock', icon: Package },
          { id: 'suppliers', label: 'Fournisseurs', icon: Truck },
          { id: 'pos', label: 'Caisse POS', icon: ShoppingCart },
          { id: 'billing', label: 'Facture/Devis', icon: Receipt },
          { id: 'audit', label: 'Audit', icon: Clock },
          { id: 'accounting', label: 'Compta', icon: BarChart3 },
          { id: 'reports', label: 'Rapports', icon: FileText },
          { id: 'settings', label: 'Réglages', icon: Settings },
        ];
        break;
    }
    
    return tabs;
  };

  useEffect(() => {
    console.log('MerchantSaaS: Render - merchant:', merchant, 'activeTab:', activeTab);
  }, [merchant, activeTab]);

  if (loadingMerchant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-ink mb-4 tracking-tight">Erreur de chargement</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-ink text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg shadow-ink/20"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return <MerchantOnboarding onComplete={(m) => setMerchant(m)} />;
  }

  if (merchant.plan !== 'FREE' && merchant.subscriptionStatus !== 'active') {
    return <PaymentPendingView merchant={merchant} onPaymentSuccess={() => window.location.reload()} />;
  }

  const tabs = getTabs(merchant.type || 'boutique', merchant.plan || '');

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col mb-12 gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/10 shadow-inner overflow-hidden shrink-0">
                {merchant.logo ? (
                  <img src={merchant.logo} alt="Logo" className="w-full h-full object-contain bg-white p-1" />
                ) : (
                  <Store className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-black text-ink tracking-tight">{merchant.name}</h1>
                <div className="flex flex-wrap items-center mt-1.5 gap-y-2">
                  <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">
                    {merchant.type === 'entreprise' ? 'Management Entreprise' :
                     merchant.type === 'chantier' ? 'Management BTP / Chantier' :
                     merchant.type === 'transport' ? 'Management Flotte' :
                     merchant.type === 'rh' ? 'Management RH' :
                     merchant.type === 'scolaire' ? 'Management Scolaire' :
                     merchant.type === 'medical' ? 'Management Médical' :
                     'Management Commerce'}
                  </span>
                  <span className="mx-3 w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="text-[10px] font-mono font-black text-primary uppercase tracking-[0.2em]">
                    Plan {merchant.plan}
                  </span>
                  {merchant.licenseType && (
                    <>
                      <span className="mx-3 w-1 h-1 bg-gray-300 rounded-full"></span>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        merchant.licenseType === 'cloud' 
                          ? 'bg-blue-50 border-blue-100 text-blue-600' 
                          : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                      }`}>
                        {merchant.licenseType === 'cloud' ? <Database className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                          {merchant.licenseType === 'cloud' ? 'Licence Cloud' : 'Licence Locale'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <NetworkStatusIndicator position="inline" plan={merchant.plan} />
              <button
                onClick={() => setActiveTab('build')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm ${
                  activeTab === 'build' ? 'bg-primary text-white shadow-primary/20' : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="hidden md:inline">App Desktop</span>
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Déconnexion</span>
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap bg-white p-1.5 rounded-2xl border border-black/5 shadow-sm items-center gap-2">
              {tabs.map(tab => (
                <TabButton 
                  key={tab.id}
                  active={activeTab === tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  icon={tab.icon} 
                  label={tab.label} 
                />
              ))}
            </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <MerchantDashboard key="dashboard" merchant={merchant} onUpdate={setMerchant} showUpgradeModal={showUpgradeModal} setShowUpgradeModal={setShowUpgradeModal} setActiveTab={setActiveTab} />}
          {activeTab === 'inventory' && <InventoryManager key="inventory" merchant={merchant} setShowUpgradeModal={setShowUpgradeModal} />}
          {activeTab === 'suppliers' && <SupplierManager key="suppliers" merchant={merchant} />}
          {activeTab === 'pos' && <MerchantPOS key="pos" merchant={merchant} setShowUpgradeModal={setShowUpgradeModal} />}
          {activeTab === 'audit' && <MerchantAuditLog key="audit" merchant={merchant} />}
          {activeTab === 'billing' && <MerchantBilling key="billing" merchant={merchant} />}
          {activeTab === 'accounting' && <MerchantAccounting key="accounting" merchant={merchant} />}
          {activeTab === 'reports' && <MerchantReports key="reports" merchant={merchant} />}
          {activeTab === 'settings' && <MerchantSettings key="settings" merchant={merchant} onUpdate={(m) => setMerchant(m)} setActiveTab={setActiveTab} />}
          {activeTab === 'build' && <MerchantBuild key="build" merchant={merchant as any} />}
          
          {/* Specialized SaaS Tabs */}
          {activeTab === 'interventions' && <ServiceManager key="interventions" merchant={merchant} />}
          {activeTab === 'projects' && <ProjectManager key="projects" merchant={merchant} />}
          {activeTab === 'vehicles' && <FleetManager key="vehicles" merchant={merchant} />}
          {activeTab === 'employees' && <HRManager key="employees" merchant={merchant} />}
          {activeTab === 'students' && <SchoolManager key="students" merchant={merchant} />}
          {activeTab === 'patients' && <MedicalManager key="patients" merchant={merchant} />}
          {activeTab === 'appointments' && <AppointmentManager key="appointments" merchant={merchant} />}
        </AnimatePresence>

        {/* SaaS Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} Acom Technologie. Tous droits réservés.</p>
          <a 
            href="mailto:contact.abdoulayendiaye@gmail.com" 
            className="hover:text-primary transition-colors mt-2 md:mt-0 flex items-center gap-1.5"
          >
            Support technique
          </a>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
      active 
        ? 'bg-ink text-white shadow-xl shadow-ink/20 scale-105' 
        : 'text-gray-400 hover:text-ink hover:bg-gray-50'
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? 'text-primary' : ''}`} />
    <span>{label}</span>
  </button>
);



const PAYMENT_PLANS = [
  { id: 'FREE', name: 'TESTE', price: '0 FCFA', desc: 'Basique' },
  { id: 'BASIC', name: 'BASIC', price: '10.000 FCFA', desc: 'Essentiel' },
  { id: 'STANDARD', name: 'STANDARD', price: '25.000 FCFA', desc: 'Populaire' },
  { id: 'PREMIUM', name: 'PREMIUM', price: '45.000 FCFA', desc: 'Complet' },
  { id: 'LOCAL', name: 'LICENCE LOCALE', price: '350.000 FCFA', desc: 'A vie (Logiciel Local)' },
];

// --- Payment Pending View ---
const PaymentPendingView = ({ merchant, onPaymentSuccess }: { merchant: Merchant, onPaymentSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [showMockPayment, setShowMockPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRetryPayment = async () => {
    setLoading(true);
    // Simulate delay
    setTimeout(() => {
       setShowMockPayment(true);
       setLoading(false);
    }, 500);
  };

  const selectedPlan = PAYMENT_PLANS.find(p => p.id === merchant.plan);
  const amountStr = selectedPlan?.price.replace(/\D/g, '') || '0';
  const amountNum = parseInt(amountStr, 10);

  if (showMockPayment) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">CARTE BANCAIRE</h2>
                <p className="text-xs text-gray-500">Paiement Sécurisé (Mode Démo)</p>
              </div>
            </div>
            <button onClick={() => setShowMockPayment(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-6">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">Montant à régler</span>
                  <span className="text-2xl font-black text-indigo-600">{amountNum.toLocaleString('fr-FR')} FCFA</span>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Numéro de carte</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Expiration</label>
                    <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CVC</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom sur la carte</label>
                  <input type="text" placeholder="Nom du titulaire" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                </div>
             </div>

             <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowMockPayment(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    if (isProcessing) return;
                    setIsProcessing(true);
                    try {
                      toast.loading("Validation en cours...", { id: 'payment' });
                      const updatedMerchant = { 
                        ...merchant, 
                        subscriptionStatus: 'active' as const,
                        updatedAt: new Date() 
                      };
                      await dbService.merchants.save(updatedMerchant);
                      toast.success("Paiement simulé avec succès !", { id: 'payment' });
                      setShowMockPayment(false);
                      onPaymentSuccess();
                    } catch (err) {
                      toast.error("Erreur de sauvegarde", { id: 'payment' });
                      setIsProcessing(false);
                    }
                  }}
                  className={`flex-1 ${isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'} text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center`}
                >
                  {isProcessing ? 'Traitement...' : `Payer ${amountNum.toLocaleString('fr-FR')} FCFA`}
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <CreditCard className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-4">Paiement en attente</h2>
        <p className="mb-6 text-gray-600">Votre compte est en attente de paiement pour le plan {merchant.plan}. Veuillez compléter le paiement pour activer votre espace.</p>
        <button 
          onClick={handleRetryPayment}
          disabled={loading}
          className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold hover:bg-primary/90 transition-all"
        >
          {loading ? 'Redirection...' : 'Payer maintenant'}
        </button>
      </div>
    </div>
  );
}

// --- Onboarding ---
const MerchantOnboarding = ({ onComplete }: { onComplete: (m: Merchant) => void }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const urlType = searchParams.get('type') || 'boutique';
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('FCFA');
  const [type, setType] = useState(urlType);
  const [plan, setPlan] = useState<MerchantPlan>('FREE');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showStripe, setShowStripe] = useState(false);
  const [createdMerchant, setCreatedMerchant] = useState<Merchant | null>(null);

  const managementTypes = [
    { id: 'boutique', label: 'Commerce / Stock', icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-50' },
    { id: 'entreprise', label: 'Services / Interventions', icon: Wrench, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { id: 'chantier', label: 'BTP / Chantier', icon: HardHat, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { id: 'transport', label: 'Transport / Flotte', icon: Truck, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
    { id: 'rh', label: 'Ressources Humaines', icon: Users, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    { id: 'scolaire', label: 'Établissement Scolaire', icon: GraduationCap, color: 'text-indigo-500', bgColor: 'bg-indigo-50' },
    { id: 'medical', label: 'Établissement Médical', icon: Stethoscope, color: 'text-red-500', bgColor: 'bg-red-50' },
  ];

  const plans = PAYMENT_PLANS;

  const getSaaSConfig = (t: string) => {
    switch (t) {
      case 'entreprise':
        return { label: "l'entreprise", placeholder: "ex: Mon Entreprise de Services" };
      case 'chantier':
        return { label: "le chantier / BTP", placeholder: "ex: Chantier Résidence Horizon" };
      case 'transport':
        return { label: "la flotte / transport", placeholder: "ex: Transports Express" };
      case 'rh':
        return { label: "l'organisation RH", placeholder: "ex: Ma Structure RH" };
      case 'scolaire':
        return { label: "l'établissement scolaire", placeholder: "ex: École Excellence" };
      case 'medical':
        return { label: "l'établissement médical", placeholder: "ex: Clinique du Parc" };
      default:
        return { label: "votre organisation", placeholder: "ex: Mon Entreprise / Établissement" };
    }
  };

  const { label, placeholder } = getSaaSConfig(type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('MerchantOnboarding: handleSubmit called');
    if (!user) return;
    if (!name.trim()) {
      toast.error('Veuillez entrer le nom de votre organisation');
      return;
    }
    setLoading(true);
    try {
      // Final check to see if a merchant was created while the user was on this page
      const existing = await dbService.merchants.getByOwner(user.uid);
      if (existing && !createdMerchant) {
        console.log('MerchantOnboarding: Found existing merchant');
        onComplete(existing);
        return;
      }

      const isPaidPlan = plan !== 'FREE';

      const merchantData = {
        ownerId: user.uid,
        owner_id: user.uid, // Support both snake_case and camelCase for rules/queries
        name,
        currency,
        type, // Store the type in the merchant profile
        plan: plan, // Store the selected plan
        subscriptionStatus: isPaidPlan ? 'pending' : 'active', // Pending if paid
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        licenseType: plan === 'LOCAL' ? 'local' : 'cloud'
      };
      console.log('MerchantOnboarding: Saving merchant', merchantData);
      const id = await dbService.merchants.save(merchantData as any);
      const newMerchant = { ...merchantData, id } as Merchant;
      setCreatedMerchant(newMerchant);
      console.log('MerchantOnboarding: Merchant saved with ID', id);

      if (isPaidPlan) {
        const selectedPlan = plans.find(p => p.id === plan);
        if (selectedPlan) {
          try {
            // Mode Démo: On affiche directement la modale de paiement sans faire d'appel API
            setShowStripe(true);
            setLoading(false);
            console.log('MerchantOnboarding: Stripe modal shown');
            return;
          } catch (payError: any) {
            console.error('Payment initialization error:', payError);
            toast.error(payError.message || "Erreur lors de l'initialisation du paiement.");
            setLoading(false);
            return; // STOP HERE, DO NOT CONTINUE
          }
        }
      }

      console.log('MerchantOnboarding: Creating successful, calling onComplete', newMerchant);
      onComplete(newMerchant);
      toast.success(`Votre ${label} a été créée !`);
    } catch (error: any) {
      console.error('Erreur lors de la création du marchand:', error);
      
      // Check for missing table error from Supabase
      if (error.message?.includes("Could not find the table 'public.merchants'")) {
        toast.error("Base de données non configurée. Veuillez exécuter le script SQL dans votre console Supabase.");
      } else {
        toast.error(`Erreur lors de la création: ${error.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStripeSuccess = async () => {
    console.log('MerchantOnboarding: handleStripeSuccess called');
    if (!createdMerchant) {
      console.error('MerchantOnboarding: No createdMerchant');
      return;
    }
    try {
      const updatedMerchant = { 
        ...createdMerchant, 
        subscriptionStatus: 'active' as const,
        updatedAt: new Date() 
      };
      console.log('MerchantOnboarding: Saving updated merchant', updatedMerchant);
      await dbService.merchants.save(updatedMerchant);
      console.log('MerchantOnboarding: Updated merchant saved, calling onComplete', updatedMerchant);
      onComplete(updatedMerchant);
      toast.success(`Inscription et paiement validés avec succès !`);
      setShowStripe(false);
    } catch (error) {
      console.error('MerchantOnboarding: Error saving updated merchant', error);
      toast.error('Erreur lors de la validation finale de votre accès.');
    }
  };

  if (showStripe && createdMerchant) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">CARTE BANCAIRE</h2>
                <p className="text-xs text-gray-500">Paiement Sécurisé (Mode Démo)</p>
              </div>
            </div>
            <button onClick={() => {
                setShowStripe(false);
                toast.error("Paiement annulé. Vous devez payer pour accéder à votre espace.");
                window.location.reload();
            }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-6">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">Montant à régler</span>
                  <span className="text-2xl font-black text-indigo-600">{parseInt(plans.find(p => p.id === plan)?.price.replace(/\D/g, '') || '0', 10).toLocaleString('fr-FR')} FCFA</span>
                </div>
             </div>

             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Numéro de carte</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Expiration</label>
                    <input type="text" placeholder="MM/AA" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">CVC</label>
                    <input type="text" placeholder="123" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono placeholder:text-gray-300" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Nom sur la carte</label>
                  <input type="text" placeholder="Nom du titulaire" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                </div>
             </div>

             <div className="flex gap-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                     setShowStripe(false);
                     toast.error("Paiement annulé. Vous pouvez réessayer depuis l'accueil.");
                     window.location.reload();
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  disabled={isProcessing}
                  onClick={async () => {
                    if (isProcessing) return;
                    setIsProcessing(true);
                    try {
                      toast.loading("Validation en cours...", { id: 'payment' });
                      await handleStripeSuccess();
                      toast.success("Paiement simulé avec succès !", { id: 'payment' });
                    } catch (e) {
                      setIsProcessing(false);
                    }
                  }}
                  className={`flex-1 ${isProcessing ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'} text-white px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center`}
                >
                  {isProcessing ? 'Traitement...' : `Payer ${parseInt(plans.find(p => p.id === plan)?.price.replace(/\D/g, '') || '0', 10).toLocaleString('fr-FR')} FCFA`}
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 pt-24 pb-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-4xl w-full border border-black/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-ink to-primary opacity-20"></div>
        
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column: Info */}
          <div className="md:w-1/3">
            <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-8 border border-primary/10 shadow-inner">
              <Store className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-4xl font-black text-ink mb-4 tracking-tighter leading-tight">Acom SaaS</h2>
            <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
              Configurez votre espace de gestion professionnelle en quelques secondes. Choisissez le type d'activité qui vous correspond.
            </p>

            <div className="space-y-4 hidden md:block">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-[11px] text-gray-400">
                "Une plateforme unique pour piloter vos stocks, vos interventions, vos chantiers ou votre établissement médical."
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <form onSubmit={handleSubmit} className="md:w-2/3 space-y-8">
            {/* Step 1: Identity */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="w-6 h-6 bg-ink text-white text-[10px] font-black rounded-full flex items-center justify-center">1</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-ink">Identité de l'organisation</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Nom de l'organisation</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-ink placeholder:text-gray-300 bg-gray-50/50"
                    placeholder={placeholder}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Devise locale</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-bold text-ink appearance-none bg-gray-50/50"
                  >
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">€ (Euro)</option>
                    <option value="USD">$ (Dollar)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Management Type */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="w-6 h-6 bg-ink text-white text-[10px] font-black rounded-full flex items-center justify-center">2</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-ink">Type de Gestion</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {managementTypes.map((mType) => {
                  const Icon = mType.icon;
                  const isSelected = type === mType.id;
                  return (
                    <button
                      key={mType.id}
                      type="button"
                      onClick={() => setType(mType.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                          : 'border-gray-50 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                        isSelected ? mType.bgColor + ' ' + mType.color : 'bg-gray-50 text-gray-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-tighter text-center ${
                        isSelected ? 'text-ink' : 'text-gray-400'
                      }`}>
                        {mType.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Plan */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="w-6 h-6 bg-ink text-white text-[10px] font-black rounded-full flex items-center justify-center">3</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-ink">Choisissez votre Formule</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlan(p.id as any)}
                    className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left ${
                      plan === p.id 
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                        : 'border-gray-50 bg-white hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                      plan === p.id ? 'text-primary' : 'text-gray-400'
                    }`}>
                      {p.name}
                    </span>
                    <span className="text-xs font-black text-ink mb-0.5">{p.price}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-ink text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-ink/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {plan === 'FREE' 
                        ? 'Lancer mon activité' 
                        : `Payer et Lancer (${plans.find(p => p.id === plan)?.price})`}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <p className="text-center text-[10px] text-gray-400 mt-4 font-medium italic">
                En cliquant sur "{plan === 'FREE' ? 'Lancer mon activité' : 'Payer et Lancer'}", vous acceptez nos conditions d'utilisation.
              </p>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// --- Dashboard ---
const PlanUpgradeModal = ({ 
  merchant, 
  onClose, 
  onUpdate 
}: { 
  merchant: Merchant, 
  onClose: () => void, 
  onUpdate: (m: Merchant) => void 
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [mockPaymentPlanId, setMockPaymentPlanId] = useState<string | null>(null);
  const [mockPhone, setMockPhone] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => stripeKey ? loadStripe(stripeKey) : null, [stripeKey]);

  const plans = [
    {
      id: 'FREE',
      name: 'TESTE',
      price: '0',
      description: 'Pour débuter votre essai',
      features: ['Gestion de stock basique', '2 ventes par jour', '2 Produits', '1 utilisateur'],
      color: 'bg-gray-100 text-gray-600'
    },
    {
      id: 'BASIC',
      name: 'BASIC',
      price: '10 000',
      description: 'Pour les petites structures',
      features: ['Ventes illimitées', '3 utilisateurs', 'Facturation PDF'],
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'STANDARD',
      name: 'STANDARD',
      price: '25 000',
      recommended: true,
      description: 'Pour les structures en croissance',
      features: ['Multi-établissements', 'Analytique avancée', 'Support prioritaire'],
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'PREMIUM',
      name: 'PREMIUM',
      price: '45 000',
      description: 'La solution complète',
      features: ['Établissements illimités', 'API personnalisée', 'Account Manager'],
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'LOCAL',
      name: 'LICENCE LOCALE',
      price: '350 000',
      description: 'Logiciel de Gestion Local (SQLite)',
      features: ['Paiement unique', 'Données en local', 'Acom Gestion Desktop'],
      color: 'bg-emerald-50 text-emerald-600'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === merchant.plan) return;
    
    setLoading(planId);
    try {
      if (planId === 'FREE') {
        const updatedMerchant = { 
          ...merchant, 
          plan: 'FREE' as any, 
          licenseType: 'cloud' as 'cloud' | 'local',
          updatedAt: new Date() 
        };
        await dbService.merchants.save(updatedMerchant);
        onUpdate(updatedMerchant);
        toast.success(`Plan mis à jour vers FREE`);
        onClose();
        return;
      }

      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) return;

      const amount = parseInt(selectedPlan.price.replace(/\D/g, ''), 10);
      const desc = `Abonnement Acom SaaS - Plan ${planId} (${merchant.name})`;
      
      const link = await payDunyaService.createPaymentLink({
        amount,
        description: desc,
        orderId: `SUBSCRIPTION_${merchant.id}_${planId}_${Date.now()}`,
        returnUrl: window.location.origin + `/merchant?payment_success=true&new_plan=${planId}&merchant_id=${merchant.id}`,
        cancelUrl: window.location.href
      });

      // Show notification and redirect
      toast.loading('Redirection vers PayDunya...');
      
      // Attempt to open in new tab (some browsers block this, so we also provide a manual way if needed)
      const win = window.open(link, '_blank');
      if (!win) {
        window.location.href = link; // Fallback to current tab if popup blocked
      } else {
        toast.dismiss();
        toast.success('Le lien de paiement a été ouvert dans un nouvel onglet.');
        onClose();
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || "Erreur lors de l'initialisation du paiement");
    } finally {
      setLoading(null);
    }
  };

  const handleUpgradeWithStripe = async (planId: string) => {
    if (planId === merchant.plan) return;
    setLoading(`${planId}_stripe`);
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) return;

      const amount = parseInt(selectedPlan.price.replace(/\D/g, ''), 10);
      
      if (!stripeKey) {
        throw new Error("La clé publique Stripe (VITE_STRIPE_PUBLISHABLE_KEY) n'est pas configurée.");
      }

      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId: `SUBSCRIPTION_${merchant.id}_${planId}_${Date.now()}`,
          currency: 'xof'
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      setSelectedPlanId(planId);
      setShowStripe(true);
    } catch (error: any) {
      console.error('Stripe upgrade error:', error);
      toast.error(error.message || "Erreur lors de l'initialisation de Stripe");
    } finally {
      setLoading(null);
    }
  };

  const handleStripeSuccess = async () => {
    if (!selectedPlanId) return;
    try {
      const updatedMerchant = { 
        ...merchant, 
        plan: selectedPlanId as any, 
        licenseType: selectedPlanId === 'LOCAL' ? 'local' : merchant.licenseType,
        updatedAt: new Date() 
      };
      await dbService.merchants.save(updatedMerchant);
      onUpdate(updatedMerchant);
      toast.success(`Plan mis à jour vers ${selectedPlanId} via Stripe !`);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour finale du plan');
    }
  };


  if (showStripe && clientSecret && stripePromise) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">CARTE PREPAYE</h2>
                <p className="text-xs text-gray-500">Paiement sécurisé via Stripe</p>
              </div>
            </div>
            <button onClick={() => setShowStripe(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              onSuccess={() => handleStripeSuccess()} 
              onCancel={() => setShowStripe(false)}
              amount={parseInt(plans.find(p => p.id === selectedPlanId)?.price.replace(/\D/g, '') || '0', 10)} 
              totalAmount={parseInt(plans.find(p => p.id === selectedPlanId)?.price.replace(/\D/g, '') || '0', 10)}
              orderId={`SUBSCRIPTION_${merchant.id}_${selectedPlanId}`}
              paymentType="full"
              returnUrl={`${window.location.origin}/merchant/settings?subscription_success=true`}
            />
          </Elements>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto pt-20 pb-20 sm:pt-4 sm:pb-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-7xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden my-auto"
      >
        <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Passer au forfait supérieur</h2>
            <p className="text-xs sm:text-sm text-gray-500">Choisissez le plan qui correspond à vos besoins actuels.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-6 rounded-3xl border-2 transition-all ${
                merchant.plan === plan.id 
                  ? 'border-primary bg-primary/5' 
                  : plan.recommended 
                    ? 'border-primary/20 bg-white' 
                    : 'border-gray-100 bg-white'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full">
                  RECOMMANDÉ
                </div>
              )}
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.color}`}>
                <Zap className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                <span className="text-xs font-bold text-gray-400">FCFA{plan.id === 'LOCAL' ? ' (Unique)' : '/mois'}</span>
              </div>

              <p className="text-xs text-gray-500 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                    <Check className="w-3 h-3 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3">
                <button
                  disabled={merchant.plan === plan.id || !!loading}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center ${
                    merchant.plan === plan.id
                      ? 'bg-emerald-50 text-emerald-600 cursor-default'
                      : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                  }`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : merchant.plan === plan.id ? (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Forfait Actuel</>
                  ) : (
                    <>
                      <div className="flex items-center mb-1">
                        {plan.price !== '0' && <Smartphone className="w-4 h-4 mr-2" />}
                        <span>{plan.price === '0' ? 'Choisir ce plan' : `MOBIL MONEY`}</span>
                      </div>
                      {plan.price !== '0' && (
                        <span className="text-[10px] opacity-70 font-medium">Orange Money, Wave, etc.</span>
                      )}
                    </>
                  )}
                </button>

                {plan.price !== '0' && merchant.plan !== plan.id && (
                  <button
                    disabled={!!loading}
                    onClick={() => handleUpgradeWithStripe(plan.id)}
                    className="w-full py-4 rounded-xl border border-gray-200 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex flex-col items-center justify-center group"
                  >
                    {loading === `${plan.id}_stripe` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <div className="flex items-center mb-1">
                          <LockIcon className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary" />
                          <span>CARTE PREPAYE</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Carte Bancaire via Stripe</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const MerchantDashboard = ({ 
  merchant, 
  onUpdate,
  showUpgradeModal,
  setShowUpgradeModal,
  setActiveTab
}: { 
  merchant: Merchant, 
  onUpdate: (m: Merchant) => void,
  showUpgradeModal: boolean,
  setShowUpgradeModal: (val: boolean) => void,
  setActiveTab?: (tab: string) => void
}) => {
  const [desktopOS, setDesktopOS] = useState<'windows' | 'mac' | 'linux'>('windows');
  const [fileToRestore, setFileToRestore] = useState<File | null>(null);

  // Read from Dexie (Offline-first)
  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];
  
  const [siteSettings, setSiteSettings] = useState<any>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const globalSettings = await dbService.settings.get('global');
        setSiteSettings(globalSettings);
      } catch (error) {
        console.error('Error fetching global settings:', error);
      }
    };
    fetchSettings();
  }, []);
  
  // Point 6: Aggregation - Global merchant stats (On-demand/Offline)
  const [merchantStats, setMerchantStats] = useState<any>(null);
  useEffect(() => {
    const fetchStats = async () => {
      // Pour les stats, on peut soit les calculer localement, soit les synchroniser
      // Ici on les cherche dans Dexie (nécessite une table merchant_stats si on veut faire comme avant)
      // Mais on peut aussi les calculer à la volée pour plus de précision
    };
    fetchStats();
  }, [merchant.id]);

  // Specialized data for stats
  const isAuto = merchant.type === 'auto';
  const isBeauty = merchant.type === 'beauty';
  const isConstruction = merchant.type === 'construction';
  const isHR = merchant.type === 'hr';
  const isLogistics = merchant.type === 'logistics';
  const isSchool = merchant.type === 'school';
  const isMedical = merchant.type === 'medical';

  // Sync SaaS data
  useEffect(() => {
    if (merchant?.id) {
      syncService.syncAllMerchantData(merchant.id);
    }
  }, [merchant?.id]);

  const interventions = useLiveQuery(() => 
    (isAuto || isBeauty) ? db.interventions.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isAuto, isBeauty]) || [];
  
  const projects = useLiveQuery(() => 
    (isConstruction) ? db.projects.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isConstruction]) || [];

  const vehicles = useLiveQuery(() => 
    (isLogistics) ? db.vehicles.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isLogistics]) || [];

  const employees = useLiveQuery(() => 
    (isHR) ? db.employees.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isHR]) || [];

  const students = useLiveQuery(() => 
    (isSchool) ? db.students.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isSchool]) || [];

  const patients = useLiveQuery(() => 
    (isMedical) ? db.patients.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isMedical]) || [];

  const appointments = useLiveQuery(() => 
    (isMedical) ? db.appointments.where('merchantId').equals(merchant.id || '').toArray() : []
  , [merchant.id, isMedical]) || [];

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.toISOString().slice(0, 7);
    const thisYear = now.getFullYear().toString();

    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date.toDate) return date.toDate().toISOString();
      if (date.seconds) return new Date(date.seconds * 1000).toISOString();
      if (date instanceof Date) return date.toISOString();
      return '';
    };

    const salesToday = sales.filter(s => getIsoDate(s.createdAt || s.created_at).startsWith(today));
    const salesMonth = sales.filter(s => getIsoDate(s.createdAt || s.created_at).startsWith(thisMonth));
    const salesYear = sales.filter(s => getIsoDate(s.createdAt || s.created_at).startsWith(thisYear));

    const expensesToday = expenses.filter(e => getIsoDate(e.createdAt || e.created_at).startsWith(today));
    const expensesMonth = expenses.filter(e => getIsoDate(e.createdAt || e.created_at).startsWith(thisMonth));
    const expensesYear = expenses.filter(e => getIsoDate(e.createdAt || e.created_at).startsWith(thisYear));

    const sumSales = (list: MerchantSale[]) => list.reduce((acc, s) => acc + s.totalAmount, 0);
    const sumExpenses = (list: MerchantExpense[]) => list.reduce((acc, e) => acc + e.amount, 0);
    const sumCOGS = (list: MerchantSale[]) => list.reduce((acc, sale) => {
      return acc + (sale.items || []).reduce((itemAcc, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = (item as any).costPrice || (product?.costPrice || 0);
        return itemAcc + ((item.quantity || 0) * cost);
      }, 0);
    }, 0);

    // Point 6: Aggregation - Use aggregated stats if available, otherwise fallback to in-memory calculation
    const revenue = merchantStats?.revenue ? {
      today: merchantStats.lastUpdate === today ? merchantStats.revenue.today : 0,
      month: merchantStats.lastMonth === thisMonth ? merchantStats.revenue.month : 0,
      year: merchantStats.lastYear === thisYear ? merchantStats.revenue.year : 0,
      total: merchantStats.revenue.total
    } : {
      today: sumSales(salesToday),
      month: sumSales(salesMonth),
      year: sumSales(salesYear),
      total: sumSales(sales)
    };

    const expensesStats = merchantStats?.expenses ? {
      today: merchantStats.lastUpdate === today ? merchantStats.expenses.today : 0,
      month: merchantStats.lastMonth === thisMonth ? merchantStats.expenses.month : 0,
      year: merchantStats.lastYear === thisYear ? merchantStats.expenses.year : 0,
      total: merchantStats.expenses.total
    } : {
      today: sumExpenses(expensesToday),
      month: sumExpenses(expensesMonth),
      year: sumExpenses(expensesYear),
      total: sumExpenses(expenses)
    };

    const cogsTotal = merchantStats?.cogs?.total ? merchantStats.cogs.total : sumCOGS(sales);
    const cogsMonth = merchantStats?.cogs?.month && merchantStats.lastMonth === thisMonth ? merchantStats.cogs.month : sumCOGS(salesMonth);

    const netProfit = revenue.total - cogsTotal - expensesStats.total;
    const netProfitMonth = revenue.month - cogsMonth - expensesStats.month;

    // Specialized counts
    const activeInterventions = interventions.filter((i: any) => i.status !== 'completed').length;
    const activeProjects = projects.filter((p: any) => p.status === 'active').length;
    const activeVehicles = vehicles.filter((v: any) => v.status === 'active').length;
    const totalEmployees = employees.length;
    const totalStudents = students.length;
    const totalPatients = patients.length;
    const appointmentsToday = appointments.filter((a: any) => getIsoDate(a.createdAt).startsWith(today)).length;

    const totalStockValue = products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stockQuantity || 0)), 0);
    const totalStockProfit = products.reduce((acc, p) => acc + ((Number(p.price || 0) - Number(p.costPrice || 0)) * Number(p.stockQuantity || 0)), 0);

    return {
      revenue,
      expenses: expensesStats,
      netProfit,
      netProfitMonth,
      grossProfitMonth: revenue.month - cogsMonth,
      totalStockValue,
      totalStockProfit,
      lowStockCount: products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length,
      totalProducts: products.length,
      specialized: {
        interventions: activeInterventions,
        projects: activeProjects,
        vehicles: activeVehicles,
        employees: totalEmployees,
        students: totalStudents,
        patients: totalPatients,
        appointmentsToday
      }
    };
  }, [sales, expenses, products, interventions, projects, vehicles, employees, students, patients, appointments, merchantStats]);

  const chartData = useMemo(() => {
    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    const getIsoDate = (date: any) => {
      if (!date) return null;
      if (typeof date === 'string') return new Date(date);
      if (date.toDate) return date.toDate();
      if (date.seconds) return new Date(date.seconds * 1000);
      if (date instanceof Date) return date;
      return null;
    };

    return last7Days.map(day => {
      const daySales = sales.filter(s => {
        const d = getIsoDate(s.createdAt || s.created_at);
        return d && isSameDay(d, day);
      });
      const dayExpenses = expenses.filter(e => {
        const d = getIsoDate(e.createdAt || e.created_at);
        return d && isSameDay(d, day);
      });

      return {
        name: format(day, 'dd MMM', { locale: fr }),
        ventes: daySales.reduce((acc, s) => acc + s.totalAmount, 0),
        depenses: dayExpenses.reduce((acc, e) => acc + e.amount, 0),
      };
    });
  }, [sales, expenses]);

  const recentTransactions = useMemo(() => {
    const getIsoDate = (date: any) => {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date.toDate) return date.toDate().toISOString();
      if (date.seconds) return new Date(date.seconds * 1000).toISOString();
      if (date instanceof Date) return date.toISOString();
      return '';
    };

    const combined = [
      ...sales.map(s => ({ ...s, type: 'sale' as const, date: getIsoDate(s.createdAt || s.created_at) })),
      ...expenses.map(e => ({ ...e, type: 'expense' as const, date: getIsoDate(e.createdAt || e.created_at) }))
    ];

    return combined.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [sales, expenses]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {fileToRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 text-rose-600 mb-6">
              <div className="p-3 bg-rose-50 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">Restauration de Base de Données</h3>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mt-1">Étape de validation requise</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-800 leading-relaxed font-semibold">
                ⚠️ ATTENTION : Restaurer cette base de données SQLite écrasera définitivement toutes vos données locales actuelles (ventes, dépenses, stocks, produits) par celles du fichier téléversé. Cette action est irréversible !
              </div>
              
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2 text-xs text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Fichier importé :</span>
                  <span className="font-bold text-gray-950 font-mono text-right truncate max-w-[200px]">{fileToRestore.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Taille :</span>
                  <span className="font-extrabold text-gray-950">{(fileToRestore.size / 1024 / 1024).toFixed(2)} Mo</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setFileToRestore(null)}
                className="flex-1 px-6 py-4 border border-gray-100 hover:border-gray-200 rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-all cursor-pointer text-center"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const file = fileToRestore;
                  setFileToRestore(null);
                  const toastId = toast.loading('Restauration et importation en cours...');
                  try {
                    const { restoreSQLiteDB } = await import('../services/sqliteService');
                    const success = await restoreSQLiteDB(file);
                    if (success) {
                      toast.success('Restauration réussie ! Chargement des nouvelles données...', { id: toastId });
                    } else {
                      toast.error('Échec de la restauration (format .sqlite3 invalide)', { id: toastId });
                    }
                  } catch (err) {
                    console.error(err);
                    toast.error('Restauration impossible', { id: toastId });
                  }
                }}
                className="flex-1 px-6 py-4 bg-rose-600 hover:bg-rose-700 rounded-2xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 active:scale-[0.98] cursor-pointer text-center"
              >
                Confirmer l'import
              </button>
            </div>
          </div>
        </div>
      )}

      <DailyBriefing 
        merchantId={merchant.id} 
        data={{ sales, products, expenses }} 
      />

      {/* Sync Control Bar - Phase 2 */}
      {merchant.id && (
        <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${navigator.onLine && (merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') ? 'bg-blue-50 text-blue-500' : 'bg-rose-50 text-rose-500'}`}>
              {navigator.onLine && (merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') ? <Database className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">État du Moteur de Synchronisation</p>
              <h4 className="text-sm font-black text-ink uppercase tracking-tight">
                {(merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') 
                  ? (navigator.onLine ? 'Mode Hybride (Local + Cloud)' : 'Mode Local Uniquement (Hors ligne)') 
                  : `Mode Local Uniquement (Plan: ${merchant.plan || 'TESTE'})`}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                const toastId = toast.loading('Génération du fichier de base de données SQLite...');
                try {
                  const { exportSQLiteDB } = await import('../services/sqliteService');
                  const file = await exportSQLiteDB(merchant.id);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `acom_studio_${new Date().toISOString().split('T')[0]}.sqlite3`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success('Base de données SQLite exportée !', { id: toastId });
                  } else {
                    toast.error('Échec de l\'exportation SQLite (base de données introuvable)', { id: toastId });
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Échec de l\'exportation SQLite', { id: toastId });
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-100 transition-all group cursor-pointer"
              title="Exporter la base de données SQLite pour une utilisation Desktop"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter (.sqlite3)
            </button>
            
            <label className="flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-ink hover:border-primary/30 transition-all cursor-pointer group">
              <Upload className="w-3.5 h-3.5" />
              Restaurer
              <input 
                type="file" 
                accept=".sqlite3" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFileToRestore(file);
                  // Clear value so the same file can be selected again
                  e.target.value = '';
                }}
              />
            </label>

            {!(merchant?.plan === 'BASIC' || merchant?.plan === 'STANDARD' || merchant?.plan === 'PREMIUM') ? (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
              >
                <Zap className="w-3.5 h-3.5" />
                Activer Sync Cloud
              </button>
            ) : (
              <button 
                onClick={async () => {
                  const toastId = toast.loading('Synchronisation des données...');
                  try {
                    await syncService.pushPendingData(merchant.id!);
                    await syncService.syncProducts(merchant.id!);
                    await syncService.syncSales(merchant.id!);
                    await syncService.syncExpenses(merchant.id!);
                    toast.success('Données synchronisées !', { id: toastId });
                  } catch (e) {
                    toast.error('Échec de la synchronisation', { id: toastId });
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/30 transition-all group"
              >
                <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                Forcer la Synchronisation
              </button>
            )}
          </div>
        </div>
      )}

      {/* Download Center & Build Dashboard for LOCAL Plan */}
      {merchant.plan === 'LOCAL' && !isDesktop && (
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-[2rem] border border-gray-800 shadow-2xl overflow-hidden relative mt-8">
          <div className="p-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Architecture / OS Features Col */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl flex items-center justify-center p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-gray-900 rounded-[14px] flex items-center justify-center">
                    <Monitor className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Acom Desktop</h3>
                  <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                    <Github className="w-3 h-3" /> Tauri Native Build
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <MonitorUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Intégration OS Native</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Création de raccourcis sur le bureau, ajout au Menu Démarrer avec le logo personnalisé Acom, et support du mode hors-ligne natif.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <Rocket className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Démarrage Automatique</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">L'application démarre en arrière-plan avec Windows (System Tray) pour une ouverture instantanée au clic sur le logo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Moteur SQLite Intégré</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">La base de données SQLite est embarquée. Performances d'écriture instantanées et conservation garanties sur votre disque dur local.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-800/50 rounded-lg shrink-0 border border-gray-700/50">
                    <LockIcon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-1">Sécurité & Isolation</h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Le frontend React communique avec le système via des IPC sécurisés en Rust. Aucune dépendance matérielle sur le cloud requise.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub Actions Pipeline Col */}
            <div className="lg:col-span-1 bg-black/60 rounded-2xl border border-gray-800 p-6 font-mono text-sm relative shadow-inner">
              <div className="absolute top-0 right-8 w-px h-full bg-gray-800/50"></div>
              <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-gray-300 bg-gray-800/50 px-3 py-1.5 rounded-md border border-gray-700">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="text-xs">main</span>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                  <span className="relative flex h-2 w-2 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">Build Successful</span>
                </div>
              </div>
              
              {/* Build Steps */}
              <div className="space-y-4 text-[11px] relative z-10">
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Checkout repository</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 0.5s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Install & build React frontend (Vite)</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 12s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Compile Rust Backend (`cargo build --release`)</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 3m 42s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300">Bundle embedded SQLite binaries</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 1.2s</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 text-center text-gray-600 mt-0.5"><Check className="w-3 h-3 text-emerald-500" /></div>
                  <div>
                    <p className="text-gray-300 text-emerald-400">Generate Windows Artifact (`.msi` / `.exe`)</p>
                    <p className="text-emerald-500/70 text-[9px] mt-0.5">Done in 45s</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Col & Desktop Preview */}
            <div className="lg:col-span-1 flex flex-col justify-between bg-gray-800/30 rounded-[1.5rem] border border-gray-700/50 overflow-hidden relative group">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none"></div>
              
              <div className="relative p-8 flex flex-col items-center justify-center border-b border-gray-700/50 bg-black/20">
                <div className="w-[72px] h-[72px] flex items-center justify-center rounded-none shadow-lg overflow-hidden bg-white mb-4">
                  <img src={siteSettings?.desktopLogo || siteSettings?.logoUrl || "/logo.svg"} className="w-full h-full object-contain p-1" alt="Acom Desktop Logo" />
                </div>
                <h4 className="text-white font-black tracking-tight text-center text-sm">
                  Acom Gestion<br/>Desktop
                </h4>
              </div>

              <div className="relative z-10 flex-1 flex flex-col bg-transparent">
                {/* OS Toggle */}
                <div className="flex border-b border-gray-700/50 bg-black/40">
                  <button 
                    onClick={() => setDesktopOS('windows')}
                    className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${desktopOS === 'windows' ? 'border-cyan-400 text-cyan-400 bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
                  >
                    <svg viewBox="0 0 88 88" fill="currentColor" className="w-4 h-4"><path d="M0,12.4L37.6,7.1v33H0V12.4z M42.4,6.4L88,0v39.3H42.4V6.4z M0,44.9h37.6v33.4L0,73.1V44.9z M42.4,44.9H88V88L42.4,81.4V44.9z"/></svg>
                  </button>
                  <button 
                    onClick={() => setDesktopOS('mac')}
                    className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${desktopOS === 'mac' ? 'border-white text-white bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
                  >
                    <svg viewBox="0 0 384 512" fill="currentColor" className="w-4 h-4"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  </button>
                  <button 
                    onClick={() => setDesktopOS('linux')}
                    className={`flex-1 py-3 flex items-center justify-center border-b-2 transition-colors ${desktopOS === 'linux' ? 'border-amber-400 text-amber-400 bg-gray-800/50' : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/20'}`}
                  >
                   <Terminal className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 pt-6 text-center flex-1 flex flex-col justify-end">
                  <h4 className="text-[17px] font-black text-white mb-2 tracking-tight">Télécharger l'Installateur</h4>
                  <p className="text-[11px] text-gray-400 mb-6 px-1 leading-relaxed">
                    {desktopOS === 'windows' ? "L'icône personnalisée sera automatiquement ajoutée à votre bureau Windows après l'installation." :
                     desktopOS === 'mac' ? "Déplacez l'application dans le dossier Applications après l'ouverture de l'image disque." :
                     "Le build Linux sera bientôt disponible pour les distributions basées sur Debian/Ubuntu."}
                  </p>
                  
                  <button 
                    onClick={() => {
                      if (desktopOS === 'windows') {
                        window.open("https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop.Setup.1.0.0.exe", '_blank');
                        toast.success('Démarrage du téléchargement Windows...');
                      } else if (desktopOS === 'mac') {
                        window.open("https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop-1.0.0-arm64.dmg", '_blank');
                        toast.success('Démarrage du téléchargement MacOS...');
                      } else {
                        toast.error('Version Linux non disponible pour le moment.');
                      }
                    }}
                    className={`w-full relative group/btn overflow-hidden px-5 py-3.5 ${desktopOS === 'linux' ? 'bg-gray-600 text-gray-300 cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]'} rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2.5`}
                    disabled={desktopOS === 'linux'}
                  >
                    {desktopOS !== 'linux' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>}
                    <Download className="w-4 h-4 relative z-10" />
                    <span className="relative z-10 pt-0.5">
                      {desktopOS === 'windows' ? 'ACOM_GESTION_SETUP.EXE' :
                       desktopOS === 'mac' ? 'ACOM_GESTION_MAC.DMG' :
                       'ACOM_GESTION_LINUX'}
                    </span>
                  </button>
                  <div className="mt-4 flex justify-center items-center gap-2 text-[9px] uppercase font-mono text-gray-500 font-bold">
                    <span className="bg-gray-800/80 px-2 py-1 rounded">V1.0.0</span>
                    <span>•</span>
                    <span className="bg-gray-800/80 px-2 py-1 rounded">
                      {desktopOS === 'windows' ? 'SETUP NSIS (12 MB)' :
                       desktopOS === 'mac' ? 'IMAGE DISQUE (15 MB)' :
                       'NON DISPONIBLE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Plan Upgrade Banner */}
      {merchant.plan !== 'PREMIUM' && merchant.plan !== 'LOCAL' && (
        <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary-hover rounded-3xl sm:rounded-[2rem] p-6 lg:p-10 text-white shadow-xl shadow-primary/20">
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 text-center lg:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight mb-2">Passez au forfait supérieur</h2>
                <p className="text-white/80 text-xs sm:text-sm max-w-md lg:max-w-lg font-medium">
                  Débloquez toutes les fonctionnalités premium et propulsez votre activité vers de nouveaux sommets.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowUpgradeModal(true)}
              className="w-full lg:w-auto px-10 py-4 lg:py-5 bg-white text-primary font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl hover:bg-gray-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              Voir les forfaits
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-black/10 rounded-full blur-2xl opacity-30" />
        </div>
      )}

      {showUpgradeModal && (
        <PlanUpgradeModal 
          merchant={merchant} 
          onClose={() => setShowUpgradeModal(false)} 
          onUpdate={onUpdate}
        />
      )}
      <>
        {(merchant.type === 'boutique' || !merchant.type) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <StatCard title="La Somme Totale du Stock" value={stats.totalStockValue} currency={merchant.currency} icon={Package} color="text-indigo-600" bgColor="bg-indigo-50" description="Valeur estimée à la vente" isLarge={true} />
            <StatCard title="Bénéfice Total du Stock" value={stats.totalStockProfit} currency={merchant.currency} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" description="Bénéfice estimé sur le stock actuel" isLarge={true} />
          </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${(merchant.type === 'boutique' || !merchant.type) ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'}`}>

        {merchant.type === 'boutique' || !merchant.type ? (
          <>
            <StatCard title="Chiffre d'Affaires" value={stats.revenue.month} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description="Ce mois-ci" />
            <StatCard title="Bénéfice de Vente" value={stats.grossProfitMonth} currency={merchant.currency} icon={DollarSign} color="text-indigo-600" bgColor="bg-indigo-50" description="Ce mois-ci - Hors dépenses" />
            <StatCard title="Dépenses" value={stats.expenses.month} currency={merchant.currency} icon={TrendingDown} color="text-red-600" bgColor="bg-red-50" description="Ce mois-ci" />
            <StatCard title="Bénéfice Net" value={stats.netProfitMonth} currency={merchant.currency} icon={DollarSign} color="text-purple-600" bgColor="bg-purple-50" description="Ce mois-ci" />
            <StatCard title="Stock Faible" value={stats.lowStockCount} icon={AlertCircle} color={stats.lowStockCount > 0 ? "text-amber-600" : "text-emerald-600"} bgColor={stats.lowStockCount > 0 ? "bg-amber-50" : "bg-emerald-50"} description={`${stats.totalProducts} produits au total`} />
          </>
        ) : (
          <>
            {merchant.type === 'chantier' && (
              <>
                <StatCard title="Chantiers Actifs" value={stats.specialized.projects} icon={HardHat} color="text-amber-600" bgColor="bg-amber-50" description="En cours" />
                <StatCard title="Budget Total" value={projects.reduce((acc: number, p: any) => acc + p.budget, 0)} currency={merchant.currency} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" description="Tous projets" />
              </>
            )}
            {merchant.type === 'transport' && (
              <>
                <StatCard title="Véhicules Actifs" value={stats.specialized.vehicles} icon={Car} color="text-blue-600" bgColor="bg-blue-50" description="En service" />
                <StatCard title="Revenu Total" value={stats.revenue.total} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description="Cumulé" />
              </>
            )}
            {merchant.type === 'rh' && (
              <>
                <StatCard title="Total Employés" value={stats.specialized.employees} icon={Users} color="text-indigo-600" bgColor="bg-indigo-50" description="Effectif total" />
                <StatCard title="Masse Salariale" value={employees.reduce((acc: number, e: any) => acc + e.salary, 0)} currency={merchant.currency} icon={BarChart3} color="text-red-600" bgColor="bg-red-50" description="Mensuel estimé" />
              </>
            )}
            {merchant.type === 'scolaire' && (
              <>
                <StatCard title="Total Élèves" value={stats.specialized.students} icon={GraduationCap} color="text-emerald-600" bgColor="bg-emerald-50" description="Inscrits" />
                <StatCard title="Frais Scolarité" value={stats.revenue.total} currency={merchant.currency} icon={TrendingUp} color="text-blue-600" bgColor="bg-blue-50" description="Revenu total" />
              </>
            )}
            {merchant.type === 'medical' && (
              <>
                <StatCard title="Total Patients" value={stats.specialized.patients} icon={Stethoscope} color="text-rose-600" bgColor="bg-rose-50" description="Dossiers" />
                <StatCard title="RDV Aujourd'hui" value={stats.specialized.appointmentsToday} icon={Calendar} color="text-blue-600" bgColor="bg-blue-50" description="Prévus" />
              </>
            )}
            {merchant.type === 'entreprise' && (
              <>
                <StatCard title="Interventions" value={stats.specialized.interventions} icon={Wrench} color="text-blue-600" bgColor="bg-blue-50" description="En cours" />
                <StatCard title="Revenu Total" value={stats.revenue.total} currency={merchant.currency} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" description="Cumulé" />
              </>
            )}
            <StatCard title="Dépenses" value={stats.expenses.total} currency={merchant.currency} icon={BarChart3} color="text-red-600" bgColor="bg-red-50" description="Total cumulé" />
            <StatCard title="Bénéfice Net" value={stats.netProfit} currency={merchant.currency} icon={DollarSign} color="text-purple-600" bgColor="bg-purple-50" description="Total cumulé" />
          </>
        )}
      </div>

      {/* Stock Health Summary (for Inventory based businesses) */}
      {(merchant.type === 'boutique' || merchant.type === 'chantier' || !merchant.type) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-ink">Alertes de Stock</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Articles nécessitant une attention</p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-500 text-[10px] font-black rounded-lg border border-rose-100">{stats.lowStockCount} ALERTES</span>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length === 0 ? (
                <div className="py-12 text-center opacity-30 flex flex-col items-center">
                  <CheckCircle className="w-10 h-10 mb-3 text-emerald-500" />
                  <p className="text-xs font-black uppercase tracking-widest">Tout est en ordre</p>
                </div>
              ) : (
                products
                  .filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5))
                  .sort((a, b) => Number(a.stockQuantity || 0) - Number(b.stockQuantity || 0))
                  .slice(0, 5)
                  .map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-black/5 shrink-0 overflow-hidden">
                          {product.image ? (
                            <OptimizedImage src={product.image} alt={product.name} width={100} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
                          <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest">MIN: {product.minStockLevel || 5}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-black font-mono ${Number(product.stockQuantity || 0) <= 0 ? 'text-rose-600' : 'text-orange-500'}`}>
                          {product.stockQuantity || 0} UNITÉS
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{Number(product.stockQuantity || 0) <= 0 ? 'RUPTURE' : 'STOCK BAS'}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
            {products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length > 5 && (
              <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">
                + {products.filter(p => Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length - 5} autres alertes
              </p>
            )}
          </div>

          <div className="bg-ink p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <PieChart className="w-48 h-48 text-white" />
            </div>
            <div className="relative h-full flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2">Valorisation Globale</h3>
              <p className="text-white/50 text-[11px] leading-relaxed mb-8 uppercase tracking-widest font-black">
                Répartition financière de vos actifs
              </p>
              
              <div className="mt-auto space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Valeur Marchande</span>
                    <span className="text-2xl font-black text-white">
                      {products.reduce((acc, p) => acc + (p.price * Number(p.stockQuantity || 0)), 0).toLocaleString()} <span className="text-xs font-mono opacity-50">{merchant.currency}</span>
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-primary" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/30 uppercase font-black mb-1 tracking-widest">Rentabilité Est.</p>
                    <p className="text-lg font-black text-emerald-400">+24.5%</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-white/30 uppercase font-black mb-1 tracking-widest">Rotation Moy.</p>
                    <p className="text-lg font-black text-blue-400">12 Jours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Detailed Accounting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Performance Financière</h3>
              <p className="text-sm text-gray-500">7 derniers jours</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-xs font-medium text-gray-500">
                  {merchant.type === 'scolaire' ? 'Frais' : 
                   merchant.type === 'medical' ? 'Consultations' :
                   merchant.type === 'chantier' ? 'Facturation' :
                   merchant.type === 'transport' ? 'Recettes' :
                   merchant.type === 'rh' ? 'Budget' :
                   merchant.type === 'entreprise' ? 'Interventions' : 'Ventes'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <span className="text-xs font-medium text-gray-500">Dépenses</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(value) => `${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="depenses" 
                  stroke="#f87171" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accounting & Activity */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-8">Résumé Comptable</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Revenu (Mois)</span>
                <span className="text-lg font-black text-emerald-600">
                  {stats.revenue.month.toLocaleString()} {merchant.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500">Dépenses (Mois)</span>
                <span className="text-lg font-black text-rose-600">
                  {stats.expenses.month.toLocaleString()} {merchant.currency}
                </span>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">Marge Nette (Total)</span>
                <span className={`text-xl font-black ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stats.netProfit.toLocaleString()} {merchant.currency}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-black/5 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Activité Récente</h3>
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
            </div>
            <GlobalActivityFeed merchantId={merchant.id} limit={5} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-ink">Flux Financiers</h3>
              <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Dernières opérations</p>
            </div>
            <button className="p-3 hover:bg-gray-50 rounded-2xl transition-all border border-black/5 group">
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </button>
          </div>
          <div className="space-y-5">
            {recentTransactions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ArrowUpRight className="w-8 h-8 text-gray-200" />
                </div>
                <p className="text-gray-400 text-sm font-medium">Aucune transaction enregistrée</p>
              </div>
            ) : (
              recentTransactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50/50 rounded-[1.5rem] transition-all border border-transparent hover:border-gray-100 group">
                  <div className="flex items-center space-x-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
                      tx.type === 'sale' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {tx.type === 'sale' ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-black text-ink text-base leading-tight">
                        {tx.type === 'sale' ? (tx.customerName || (
                          merchant.type === 'scolaire' ? 'Paiement Frais' :
                          merchant.type === 'medical' ? 'Consultation' :
                          merchant.type === 'chantier' ? 'Facture Travaux' :
                          merchant.type === 'transport' ? 'Course/Trajet' :
                          merchant.type === 'rh' ? 'Opération RH' :
                          merchant.type === 'entreprise' ? 'Intervention' :
                          'Vente POS'
                        )) : tx.title}
                      </p>
                      <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1">
                        {format(new Date(tx.date), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-black text-base ${tx.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'sale' ? '+' : '-'}{tx.type === 'sale' ? tx.totalAmount.toLocaleString() : tx.amount.toLocaleString()} 
                      <span className="text-[10px] ml-1 opacity-60">{merchant.currency}</span>
                    </p>
                    <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">
                      {tx.paymentMethod || tx.category || 'Général'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Alerts / Quick View */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm">
          {merchant.type === 'scolaire' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">Dernières Inscriptions</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Suivi des effectifs scolaires</p>
                </div>
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">
                  {students.length.toString().padStart(3, '0')} ÉLÈVES
                </span>
              </div>
              <div className="space-y-5">
                {students.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <GraduationCap className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun élève inscrit</p>
                  </div>
                ) : (
                  students.slice(0, 5).map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <GraduationCap className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{student.name}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Classe: {student.class}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{student.enrollmentDate}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'medical' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">Prochains Rendez-vous</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Planification des consultations</p>
                </div>
                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 uppercase tracking-widest">
                  {appointments.length.toString().padStart(3, '0')} RDV
                </span>
              </div>
              <div className="space-y-5">
                {appointments.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun rendez-vous prévu</p>
                  </div>
                ) : (
                  appointments.slice(0, 5).map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <Calendar className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{apt.patientName}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{apt.time} - {apt.reason}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{apt.date}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'chantier' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">État des Projets</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Suivi de l'avancement BTP</p>
                </div>
                <span className="px-4 py-1.5 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100 uppercase tracking-widest">
                  {projects.length.toString().padStart(2, '0')} PROJETS
                </span>
              </div>
              <div className="space-y-6">
                {projects.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <HardHat className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun projet en cours</p>
                  </div>
                ) : (
                  projects.slice(0, 5).map((project: any) => (
                    <div key={project.id} className="flex flex-col p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center space-x-5">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5">
                            <HardHat className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-black text-ink text-base leading-tight">{project.name}</p>
                            <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Budget: {project.budget.toLocaleString()} {merchant.currency}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-black text-amber-600">{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          className="h-full bg-amber-500" 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'transport' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">État de la Flotte</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Disponibilité des véhicules</p>
                </div>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">
                  {vehicles.length.toString().padStart(2, '0')} VÉHICULES
                </span>
              </div>
              <div className="space-y-5">
                {vehicles.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Car className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun véhicule enregistré</p>
                  </div>
                ) : (
                  vehicles.slice(0, 5).map((vehicle: any) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <Car className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{vehicle.model}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{vehicle.plateNumber}</p>
                        </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        vehicle.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {vehicle.status === 'active' ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'rh' ? (
            <>
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl font-black text-ink">Derniers Recrutements</h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Gestion du capital humain</p>
                </div>
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                  {employees.length.toString().padStart(2, '0')} EMPLOYÉS
                </span>
              </div>
              <div className="space-y-5">
                {employees.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">Aucun employé enregistré</p>
                  </div>
                ) : (
                  employees.slice(0, 5).map((emp: any) => (
                    <div key={emp.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                          <User className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-ink text-base leading-tight">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">{emp.position}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-black text-gray-400 uppercase">{emp.hireDate}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : merchant.type === 'entreprise' ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-ink">Interventions Récentes</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Suivi des prestations de service</p>
                </div>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 shadow-sm">
                  {interventions.length.toString().padStart(3, '0')} ACTES
                </span>
              </div>
              <div className="space-y-4">
                {interventions.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-black/5">
                      <Wrench className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Aucune intervention</p>
                  </div>
                ) : (
                  interventions.slice(0, 5).map((inter: any) => (
                    <div key={inter.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-black/5 hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                          <Wrench className="w-7 h-7 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-black text-base text-ink leading-tight">{inter.customerName}</p>
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-0.5">{inter.serviceType}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        inter.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {inter.status === 'completed' ? 'TERMINÉ' : 'EN COURS'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-ink">Articles en Rupture</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Stock actuellement épuisé</p>
                </div>
                <span className="px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-full border border-rose-100 shadow-sm">
                  {products.filter(p => Number(p.stockQuantity || 0) <= 0).length.toString().padStart(2, '0')} RUPTURES
                </span>
              </div>
              <div className="space-y-4">
                {products.filter(p => Number(p.stockQuantity || 0) <= 0).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-emerald-50/30 rounded-[2rem] border border-dashed border-emerald-200">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-emerald-600 font-black uppercase tracking-widest">Aucune Rupture !</p>
                    <p className="text-xs text-emerald-500/60 mt-2 font-mono font-bold">Stocks disponibles</p>
                  </div>
                ) : (
                  products.filter(p => Number(p.stockQuantity || 0) <= 0).slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-rose-100 hover:shadow-xl transition-all group relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 w-1 bg-rose-500"></div>
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                          <Package className="w-7 h-7 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-black text-base text-ink leading-tight">{product.name}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[10px] font-mono text-rose-600 font-black uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded-md">
                              STOCK: {product.stockQuantity || 0}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                              MIN: {product.minStockLevel || 5}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-sm mb-3 uppercase tracking-[0.2em]">
                          ÉPUISÉ
                        </span>
                        {setActiveTab && (
                          <button 
                            onClick={() => setActiveTab('inventory')} 
                            className="text-[10px] font-black text-primary hover:text-primary-hover uppercase tracking-[0.2em] transition-colors whitespace-nowrap"
                          >
                            Réapprovisionner
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </>
    </motion.div>
  );
};

const AccountingRow = ({ label, value, currency, icon: Icon, color }: any) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center space-x-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
    <span className={`text-sm font-bold text-gray-900`}>
      {value.toLocaleString()} {currency}
    </span>
  </div>
);

const StatCard = ({ title, value, currency, icon: Icon, color, bgColor, description, isLarge }: any) => {
  const formattedValue = typeof value === 'number' ? value.toLocaleString() : String(value || '0');
  const textLength = formattedValue.length + (currency ? currency.length : 0);
  
  // Decide responsive style based on content density and card layout size
  let fontSizeClass = 'text-3xl sm:text-4xl';
  if (isLarge) {
    if (textLength > 18) {
      fontSizeClass = 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl';
    } else if (textLength > 14) {
      fontSizeClass = 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl';
    } else {
      fontSizeClass = 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl';
    }
  } else {
    if (textLength > 16) {
      fontSizeClass = 'text-sm sm:text-base md:text-lg lg:text-base min-[1400px]:text-lg';
    } else if (textLength > 12) {
      fontSizeClass = 'text-lg sm:text-xl md:text-2xl lg:text-xl min-[1400px]:text-2xl';
    } else if (textLength > 9) {
      fontSizeClass = 'text-xl sm:text-2xl md:text-3xl lg:text-2xl min-[1400px]:text-3xl';
    }
  }

  return (
    <div className={`bg-white p-6 sm:p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full ${isLarge ? 'min-h-[200px] sm:min-h-[260px]' : 'min-h-[220px]'}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform"></div>
      
      <div>
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgColor} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform relative z-10 border border-black/5`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${color}`} />
        </div>
        <p className="text-[10px] sm:text-xs font-black text-gray-400 mb-2 uppercase tracking-[0.2em] relative z-10 line-clamp-1">{title}</p>
      </div>

      <div className="mt-auto relative z-10">
        <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 items-end">
          <span className={`${fontSizeClass} font-black text-ink tracking-tighter block break-all leading-none`}>
            {formattedValue}
          </span>
          {currency && (
            <span className={`${isLarge ? 'text-xs sm:text-sm md:text-base' : 'text-[10px] sm:text-xs'} font-black text-gray-400 uppercase tracking-widest break-keep`}>
              {currency}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[9px] sm:text-[10px] text-gray-400 mt-3 font-mono font-bold uppercase tracking-widest relative z-10 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Inventory Manager ---
// --- Inventory Sub-components ---
const StockStatCard = ({ label, value, suffix, icon: Icon, color, warning, danger }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className={`p-6 rounded-[2rem] border transition-all hover:shadow-lg bg-white ${warning ? 'ring-2 ring-orange-200' : danger ? 'ring-2 ring-rose-200 animate-pulse' : 'border-black/5'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color] || 'bg-gray-50'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {(warning || danger) && (
          <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${warning ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
            {warning ? 'Alerte' : 'Critique'}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">{label}</h4>
        <div className="flex items-baseline mt-1">
          <span className="text-2xl font-black text-ink">{value}</span>
          <span className="text-[9px] font-mono font-bold text-gray-400 ml-1.5 uppercase">{suffix}</span>
        </div>
      </div>
    </div>
  );
};

const HealthIndicator = ({ label, value, color }: { label: string, value: string, color: string }) => {
  const colors: any = {
    primary: 'bg-primary',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/60 uppercase font-black tracking-widest">{label}</span>
        <span className="text-[10px] text-white font-mono font-black">{value}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          className={`h-full ${colors[color] || 'bg-white'}`}
        />
      </div>
    </div>
  );
};

const InventoryManager = ({ merchant, setShowUpgradeModal }: { merchant: Merchant, setShowUpgradeModal?: (s: boolean) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<MerchantProduct> | null>(null);
  const [restockData, setRestockData] = useState({ 
    quantity: 0, 
    cost: 0, 
    unitCostPrice: 0,
    unitSellingPrice: 0,
    reason: 'Réapprovisionnement standard' 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [showNewSubCatInput, setShowNewSubCatInput] = useState(false);
  
  const [productLimit, setProductLimit] = useState(10);
  const [movementLimit, setMovementLimit] = useState(10);

  // Products loaded from Dexie via useLiveQuery
  useEffect(() => {
    syncService.syncProducts(merchant.id);
    syncService.syncCategories(merchant.id);
    syncService.syncSales(merchant.id);
  }, [merchant.id]);

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const categories = useLiveQuery(() => 
    db.categories.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const movements = useLiveQuery(() => 
    db.movements.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , [merchant.id]) || [];

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const loading = false;

  const filteredProducts = useMemo(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return result;
  }, [products, searchTerm]);

  // Enhanced Stats
  const stats = useMemo(() => {
    const totalItems = products.length;
    const totalQuantity = products.reduce((acc, p) => acc + Number(p.stockQuantity || 0), 0);
    const lowStock = products.filter(p => Number(p.stockQuantity || 0) > 0 && Number(p.stockQuantity || 0) <= (Number(p.minStockLevel) || 5)).length;
    const outOfStock = products.filter(p => Number(p.stockQuantity || 0) <= 0).length;
    const totalValue = products.reduce((acc, p) => acc + (p.price * Number(p.stockQuantity || 0)), 0);
    
    return { totalItems, totalQuantity, lowStock, outOfStock, totalValue };
  }, [products]);

  // Dynamic Stock Health Indicators
  const theoreticalProfit = useMemo(() => {
    if (products.length === 0) return 0;
    const totalPurchaseValue = products.reduce((acc, p) => acc + ((p.costPrice || 0) * Number(p.stockQuantity || 0)), 0);
    const totalRetailValue = products.reduce((acc, p) => acc + (p.price * Number(p.stockQuantity || 0)), 0);
    if (totalRetailValue > 0) {
      return Math.max(0, Math.min(100, Math.round(((totalRetailValue - totalPurchaseValue) / totalRetailValue) * 100)));
    }
    const simpleMargins = products.map(p => p.price > 0 ? Math.max(0, ((p.price - (p.costPrice || 0)) / p.price) * 100) : 0);
    const sumSimple = simpleMargins.reduce((acc, val) => acc + val, 0);
    return Math.max(0, Math.min(100, Math.round(sumSimple / products.length)));
  }, [products]);

  const rotationStock = useMemo(() => {
    const totalUnitsSold = sales.reduce((sum, s) => sum + (s.items ? s.items.reduce((acc: number, item: any) => acc + Number(item.quantity || 0), 0) : 0), 0);
    const totalStock = products.reduce((acc, p) => acc + Number(p.stockQuantity || 0), 0);
    if (totalStock === 0 && totalUnitsSold === 0) return 0;
    if (totalStock === 0) return 100;
    const ratio = (totalUnitsSold / (totalUnitsSold + totalStock)) * 100;
    // Map to a realistic performance range or direct proportion, with a minimum representation helper
    return Math.max(12, Math.min(100, Math.round(ratio)));
  }, [sales, products]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.name || currentProduct.price === undefined) return;
    
    if (!currentProduct.id && merchant.plan === 'FREE' && products.length >= 2) {
      toast.error('Vous avez atteint la limite de 2 produits pour le plan TESTE. Veuillez passer au forfait supérieur.');
      if (setShowUpgradeModal) setShowUpgradeModal(true);
      return;
    }

    setSaving(true);
    try {
      await dbService.merchantProducts.save({
        ...currentProduct,
        merchantId: merchant.id,
        updatedAt: new Date()
      });

      // Memorize Category and Sub-category for future products
      if (currentProduct.category) {
        const existingCat = categories.find(c => c.name.toLowerCase() === currentProduct.category?.toLowerCase());
        if (!existingCat) {
          await dbService.merchantCategories.save({
            merchantId: merchant.id,
            name: currentProduct.category,
            subCategories: currentProduct.subCategory ? [currentProduct.subCategory] : []
          });
        } else if (currentProduct.subCategory) {
          const subCats = existingCat.subCategories || [];
          if (!subCats.some(s => s.toLowerCase() === currentProduct.subCategory?.toLowerCase())) {
            await dbService.merchantCategories.save({
              ...existingCat,
              subCategories: [...subCats, currentProduct.subCategory]
            });
          }
        }
      }

      toast.success(currentProduct.id ? 'Produit mis à jour' : 'Produit ajouté');
      setIsEditing(false);
      setCurrentProduct(null);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct?.id || restockData.quantity <= 0) return;
    setSaving(true);
    try {
      // Met à jour la fiche produit avec le nouveau prix d'achat et prix de vente
      const updatedProduct = {
        ...currentProduct,
        costPrice: Number(restockData.unitCostPrice || 0),
        price: Number(restockData.unitSellingPrice || 0),
        updatedAt: new Date()
      };
      await dbService.merchantProducts.save(updatedProduct as any);

      // Le coût total est égal à la quantité multipliée par le coût unitaire
      const calculatedCost = Number(restockData.quantity) * Number(restockData.unitCostPrice || 0);

      await dbService.stockMovements.addStock(
        merchant.id,
        currentProduct.id,
        restockData.quantity,
        restockData.reason,
        merchant.ownerId,
        calculatedCost
      );
      toast.success('Stock mis à jour');
      setIsRestocking(false);
      setRestockData({ 
        quantity: 0, 
        cost: 0, 
        unitCostPrice: 0,
        unitSellingPrice: 0,
        reason: 'Réapprovisionnement standard' 
      });
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du stock');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await dbService.merchantProducts.delete(id);
      toast.success('Produit supprimé');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Stock Quick Stats Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StockStatCard 
          label="Total Articles" 
          value={stats.totalItems.toString()} 
          suffix="RÉVÉRENCES"
          icon={Package} 
          color="blue"
        />
        <StockStatCard 
          label="Valeur du Stock" 
          value={stats.totalValue.toLocaleString()} 
          suffix={merchant.currency}
          icon={Calculator} 
          color="emerald"
        />
        <StockStatCard 
          label="Points de rupture" 
          value={stats.lowStock.toString()} 
          suffix="ALERTES"
          icon={AlertCircle} 
          color="orange"
          warning={stats.lowStock > 0}
        />
        <StockStatCard 
          label="Articles épuisés" 
          value={stats.outOfStock.toString()} 
          suffix="RUPTURES"
          icon={Trash2} 
          color="rose"
          danger={stats.outOfStock > 0}
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Main Product Table / List */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit ou SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-primary/10 shadow-sm outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setCurrentProduct({ name: '', price: 0, stockQuantity: 0, category: 'Général', minStockLevel: 5 });
                  setIsEditing(true);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-8 py-4 bg-ink text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-xl shadow-ink/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau produit</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                      <th className="px-8 py-5">Article</th>
                      <th className="px-8 py-5">Prix & Valeur</th>
                      <th className="px-8 py-5">État Stock</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center opacity-30">
                            <Package className="w-12 h-12 mb-4" />
                            <p className="font-black uppercase tracking-widest text-xs">Aucun produit trouvé</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.slice(0, productLimit).map((product) => {
                        const isLow = Number(product.stockQuantity || 0) > 0 && Number(product.stockQuantity || 0) <= (Number(product.minStockLevel) || 5);
                        const isOut = Number(product.stockQuantity || 0) <= 0;
                        
                        return (
                          <tr key={product.id} className="hover:bg-gray-50/20 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-5">
                                <div className="w-16 h-16 bg-gray-50 rounded-[1.25rem] flex items-center justify-center overflow-hidden border border-black/5 group-hover:scale-105 transition-transform shadow-inner shrink-0">
                                  {product.image ? (
                                    <OptimizedImage src={product.image} alt={product.name} width={150} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-8 h-8 text-gray-200" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black text-ink text-sm leading-tight tracking-tight truncate">{product.name}</span>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.15em]">
                                      {product.sku || 'SANS SKU'}
                                    </span>
                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                    <span className="text-[9px] font-mono font-black text-primary uppercase tracking-[0.15em]">
                                      {product.category}
                                    </span>
                                    {product.sizes && (
                                      <>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          T: {product.sizes}
                                        </span>
                                      </>
                                    )}
                                    {product.colors && (
                                      <>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <span className="text-[9px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                          C: {product.colors}
                                        </span>
                                      </>
                                    )}
                                    {(product as any).syncStatus && (
                                      <>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                                          (product as any).syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                          (product as any).syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                          'bg-gray-50 text-gray-400 border-gray-100'
                                        }`}>
                                          {(product as any).syncStatus === 'synced' ? <Check className="w-2.5 h-2.5" /> : <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                                          <span className="text-[8px] font-black uppercase tracking-wider">{(product as any).syncStatus}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="font-mono font-black text-ink text-sm">
                                  {product.price.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                                </span>
                                <span className="text-[9px] font-mono font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                  VAL: {(product.price * Number(product.stockQuantity || 0)).toLocaleString()}
                                </span>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-4">
                                <div className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black border tracking-widest ${
                                  isOut ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' :
                                  isLow ? 'bg-orange-50 text-orange-600 border-orange-100 shadow-sm' : 
                                  'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 transition-colors cursor-help'
                                }`}>
                                  {(product.stockQuantity || 0).toString().padStart(2, '0')} UNITÉS
                                </div>
                                <button 
                                  onClick={() => { 
                                    setCurrentProduct(product); 
                                    setRestockData({
                                      quantity: 1,
                                      cost: Number(product.costPrice || 0),
                                      unitCostPrice: Number(product.costPrice || 0),
                                      unitSellingPrice: Number(product.price || 0),
                                      reason: 'Réapprovisionnement standard'
                                    });
                                    setIsRestocking(true); 
                                  }}
                                  className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-black/5 text-gray-500 rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                  title="Réapprovisionner"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => { setCurrentProduct(product); setIsEditing(true); }} className="p-3 bg-gray-50 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-black/5 hover:border-primary/20 shadow-sm"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => setDeleteConfirm(product.id || null)} className="p-3 bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-black/5 hover:border-rose-200 shadow-sm"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {filteredProducts.length > productLimit && (
                  <div className="p-4 flex justify-center border-t border-gray-100">
                    <button 
                      onClick={() => setProductLimit(prev => prev + 10)}
                      className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                    >
                      Voir plus
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Movement Summary or Chart */}
        <div className="w-full xl:w-[400px] space-y-6">
          <div className="bg-ink p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-32 h-32 text-white" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-bold text-white mb-2">Santé du Stock</h3>
              <p className="text-white/50 text-[11px] leading-relaxed mb-6 font-medium uppercase tracking-widest">
                Analyse de votre inventaire actuel
              </p>
              
              <div className="space-y-5">
                <HealthIndicator label="Disponibilité" value={products.length > 0 ? (products.filter(p => Number(p.stockQuantity || 0) > 0).length / products.length * 100).toFixed(0) : '0'} color="primary" />
                <HealthIndicator label="Rentabilité théorique" value={theoreticalProfit.toString()} color="blue" />
                <HealthIndicator label="Rotation de stock" value={rotationStock.toString()} color="purple" />
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-1">Articles Bas</p>
                  <p className="text-2xl font-black text-white">{stats.lowStock}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-1">Ruptures</p>
                  <p className="text-2xl font-black text-rose-400">{stats.outOfStock}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
            <h4 className="text-sm font-black text-ink uppercase tracking-widest mb-6">Flux Récents</h4>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {movements.slice(0, 8).map((m: any) => {
                const product = products.find(p => p.id === m.productId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 group hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}>
                        {m.type === 'in' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{product?.name || 'Produit...'}</p>
                        <p className="text-[9px] font-mono text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd MMM, HH:mm') : '-'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black font-mono ${m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.type === 'in' ? '+' : '-'}{m.quantity}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">UNITÉS</p>
                    </div>
                  </div>
                );
              })}
              {movements.length === 0 && (
                <div className="py-12 text-center text-gray-300 font-bold uppercase text-[9px] tracking-[0.2em]">
                  Aucun mouvement enregistré
                </div>
              )}
            </div>
            <button 
              onClick={() => {
                // Focus the movements history if it was a separate tab, but here it's below
                const el = document.getElementById('movements-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full mt-6 py-4 border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Voir tout l'historique
            </button>
          </div>
        </div>
      </div>

      {/* Full History Section */}
      <div id="movements-section" className="pt-12 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-ink tracking-tight">Journal des Mouvements</h3>
              <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.15em] mt-1">Traçabilité complète des flux</p>
            </div>
          </div>
          <button className="px-6 py-3 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-md transition-all">Exporter PDF</button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Horodatage</th>
                  <th className="px-8 py-5">Article Impacté</th>
                  <th className="px-8 py-5">Flux & Quantité</th>
                  <th className="px-8 py-5">Commentaire / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.slice(0, movementLimit).map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : '-'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                          <span className="text-sm font-black text-ink">{product?.name || 'Article supprimé'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                            m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type.toUpperCase()}
                          </span>
                          <span className={`font-mono font-black text-sm ${m.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {m.type === 'in' ? '+' : '-'}{m.quantity}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-bold text-gray-400 italic">"{m.reason || 'Aucune note'}"</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {movements.length > movementLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setMovementLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restock Modal */}
      <AnimatePresence>
        {isRestocking && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Réapprovisionner</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Mise à jour des stocks</p>
                </div>
                <button onClick={() => setIsRestocking(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/5">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Produit sélectionné</p>
                    <p className="font-bold text-ink">{currentProduct?.name}</p>
                  </div>
                </div>

                <form onSubmit={handleRestock} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Quantité à ajouter</label>
                      <input 
                        type="number" 
                        required 
                        min="1" 
                        value={restockData.quantity || ''} 
                        onChange={e => {
                          const quantity = Number(e.target.value);
                          setRestockData(prev => ({ ...prev, quantity }));
                        }} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold text-base" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix d'achat unitaire ({merchant.currency})</label>
                        <input 
                          type="number" 
                          min="0" 
                          required
                          value={restockData.unitCostPrice || ''} 
                          onChange={e => {
                            const unitCostPrice = Number(e.target.value);
                            setRestockData(prev => ({ ...prev, unitCostPrice }));
                          }} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix de vente unitaire ({merchant.currency})</label>
                        <input 
                          type="number" 
                          min="0" 
                          required
                          value={restockData.unitSellingPrice || ''} 
                          onChange={e => {
                            const unitSellingPrice = Number(e.target.value);
                            setRestockData(prev => ({ ...prev, unitSellingPrice }));
                          }} 
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Résumé de l'approvisionnement */}
                  <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500 uppercase tracking-wide">Coût Total Estimé :</span>
                      <span className="font-mono font-black text-ink text-sm">
                        {((restockData.quantity || 0) * (restockData.unitCostPrice || 0)).toLocaleString()} {merchant.currency}
                      </span>
                    </div>
                    {restockData.unitSellingPrice > restockData.unitCostPrice && (
                      <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-dashed border-gray-200">
                        <span className="text-emerald-600 font-bold uppercase tracking-wider">Marge unitaire estimée :</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {+(restockData.unitSellingPrice - restockData.unitCostPrice).toLocaleString()} {merchant.currency} ({Math.round(((restockData.unitSellingPrice - restockData.unitCostPrice) / restockData.unitSellingPrice) * 100)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Motif / Note</label>
                    <input type="text" value={restockData.reason} onChange={e => setRestockData({...restockData, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-medium text-sm" placeholder="ex: Arrivage fournisseur..." />
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={() => setIsRestocking(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                    <button type="submit" disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20">
                      {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmer l\'ajout'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Détails du Produit</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Configuration technique de l'article</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du produit</label>
                      <input 
                        type="text" 
                        required 
                        value={currentProduct?.name || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, name: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" 
                        placeholder="ex: Laptop Pro 15"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">SKU / Code interne</label>
                      <input 
                        type="text" 
                        value={currentProduct?.sku || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, sku: e.target.value})} 
                        className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono text-sm" 
                        placeholder="ex: LP-15-2024"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Image (URL ou Fichier)</label>
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            value={currentProduct?.image || ''} 
                            onChange={e => setCurrentProduct({...currentProduct!, image: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-xs" 
                            placeholder="https://..."
                          />
                          <label className="block w-full text-center px-4 py-2 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <span className="text-xs font-bold text-gray-500">Ou uploader une image</span>
                            <input 
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setCurrentProduct({...currentProduct!, image: reader.result as string});
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                        {currentProduct?.image && (
                          <div className="w-16 h-16 rounded-xl border border-black/5 overflow-hidden bg-gray-100 flex-shrink-0">
                            <OptimizedImage src={currentProduct.image} alt={currentProduct.name} width={100} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">
                          <span>Catégorie</span>
                          {showNewCatInput && (
                            <button type="button" onClick={() => { setShowNewCatInput(false); setCurrentProduct({...currentProduct!, category: ''}); }} className="text-primary hover:text-primary-hover capitalize tracking-normal text-[10px]">Annuler</button>
                          )}
                        </label>
                        {showNewCatInput ? (
                          <input 
                            type="text"
                            value={currentProduct?.category || ''} 
                            onChange={e => setCurrentProduct({...currentProduct!, category: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                            placeholder="Saisir la nouvelle catégorie..."
                            autoFocus
                          />
                        ) : (
                          <select
                            value={currentProduct?.category || ''}
                            onChange={e => {
                              if (e.target.value === '_new') {
                                setShowNewCatInput(true);
                                setCurrentProduct({...currentProduct!, category: ''});
                              } else {
                                setCurrentProduct({...currentProduct!, category: e.target.value});
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold bg-white"
                          >
                            <option value="" disabled>Sélectionner une catégorie</option>
                            {Array.from(new Set([
                              'Général', 'Électronique', 'Mobilier', 'Fournitures', 'Services', 
                              ...(categories || []).map(c => c.name),
                              ...(products || []).map(p => p.category)
                            ].filter(Boolean))).map(cat => (
                              <option key={cat as string} value={cat as string}>{cat}</option>
                            ))}
                            <option value="_new" className="font-bold text-primary">+ Ajouter une nouvelle</option>
                          </select>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">
                          <span>Sous Catégorie</span>
                          {showNewSubCatInput && (
                            <button type="button" onClick={() => { setShowNewSubCatInput(false); setCurrentProduct({...currentProduct!, subCategory: ''}); }} className="text-primary hover:text-primary-hover capitalize tracking-normal text-[10px]">Annuler</button>
                          )}
                        </label>
                        {showNewSubCatInput ? (
                          <input 
                            type="text" 
                            value={currentProduct?.subCategory || ''} 
                            onChange={e => setCurrentProduct({...currentProduct!, subCategory: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                            placeholder="Saisir la nouvelle sous catégorie..."
                            autoFocus
                          />
                        ) : (
                          <select
                            value={currentProduct?.subCategory || ''}
                            onChange={e => {
                              if (e.target.value === '_new') {
                                setShowNewSubCatInput(true);
                                setCurrentProduct({...currentProduct!, subCategory: ''});
                              } else {
                                setCurrentProduct({...currentProduct!, subCategory: e.target.value});
                              }
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold bg-white"
                          >
                            <option value="">(Aucune)</option>
                            {Array.from(new Set([
                              ...(categories.find(c => c.name.toLowerCase() === currentProduct?.category?.toLowerCase())?.subCategories || []),
                              ...(products.filter(p => p.category && p.category.toLowerCase() === currentProduct?.category?.toLowerCase()).map(p => p.subCategory))
                            ].filter(Boolean))).map(sub => (
                              <option key={sub as string} value={sub as string}>{sub}</option>
                            ))}
                            <option value="_new" className="font-bold text-primary">+ Ajouter une nouvelle</option>
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix d'achat</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        value={currentProduct?.costPrice === 0 ? '' : currentProduct?.costPrice || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, costPrice: Number(e.target.value.replace(/\D/g, ''))})} 
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prix de vente</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        value={currentProduct?.price === 0 ? '' : currentProduct?.price || ''} 
                        onChange={e => setCurrentProduct({...currentProduct!, price: Number(e.target.value.replace(/\D/g, ''))})} 
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Stock actuel</label>
                    <input 
                      type="number" 
                      required 
                      value={currentProduct?.stockQuantity || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, stockQuantity: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Seuil d'alerte</label>
                    <input 
                      type="number" 
                      required 
                      value={currentProduct?.minStockLevel || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, minStockLevel: Number(e.target.value)})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Tailles (Optionnel)</label>
                    <input 
                      type="text" 
                      value={currentProduct?.sizes || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, sizes: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm" 
                      placeholder="ex: S, M, L, XL ou 38, 39, 40"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Couleur (Optionnel)</label>
                    <input 
                      type="text" 
                      value={currentProduct?.colors || ''} 
                      onChange={e => setCurrentProduct({...currentProduct!, colors: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm" 
                      placeholder="ex: Noir, Blanc, Bleu, Rouge"
                    />
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le produit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le produit ?</h3>
              <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={saving}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Merchant POS ---
const MerchantPOS = ({ merchant, setShowUpgradeModal }: { merchant: Merchant, setShowUpgradeModal?: (s: boolean) => void }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<{ productId: string, name: string, quantity: number, price: number, costPrice: number, sizes?: string, colors?: string }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money' | 'split'>('cash');
  const [isPartial, setIsPartial] = useState(false);
  const [initialPaidAmount, setInitialPaidAmount] = useState<number | string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState<{ show: boolean, saleData: any } | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const cartErrorTimeoutRef = useRef<any>(null);

  const triggerCartError = (message: string) => {
    setCartError(message);
    if (cartErrorTimeoutRef.current) {
      clearTimeout(cartErrorTimeoutRef.current);
    }
    cartErrorTimeoutRef.current = setTimeout(() => {
      setCartError(null);
    }, 5000);
  };

  // Smart filters states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('instock');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock_desc' | 'newest'>('name');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');

  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const availableSizes = useMemo(() => {
    const list = new Set<string>();
    const categoryFiltered = products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSubCat = selectedSubCategory === 'all' || p.subCategory === selectedSubCategory;
      return matchCat && matchSubCat;
    });
    categoryFiltered.forEach(p => {
      if (p.sizes) {
        p.sizes.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed) list.add(trimmed.toUpperCase());
        });
      }
    });
    return Array.from(list).sort();
  }, [products, selectedCategory, selectedSubCategory]);

  const availableColors = useMemo(() => {
    const list = new Set<string>();
    const categoryFiltered = products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSubCat = selectedSubCategory === 'all' || p.subCategory === selectedSubCategory;
      return matchCat && matchSubCat;
    });
    categoryFiltered.forEach(p => {
      if (p.colors) {
        p.colors.split(',').forEach(c => {
          const trimmed = c.trim();
          if (trimmed) list.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
        });
      }
    });
    return Array.from(list).sort();
  }, [products, selectedCategory, selectedSubCategory]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const subCategories = useMemo(() => {
    if (selectedCategory === 'all') return [];
    const subs = new Set<string>();
    products.forEach(p => {
      if (p.category === selectedCategory && p.subCategory) {
        subs.add(p.subCategory);
      }
    });
    return Array.from(subs).sort((a, b) => a.localeCompare(b));
  }, [products, selectedCategory]);

  // Reset subcategory, sizes and colors when category changes
  useEffect(() => {
    setSelectedSubCategory('all');
    setSelectedSize('all');
    setSelectedColor('all');
  }, [selectedCategory]);

  // Reset sizes and colors when subcategory changes
  useEffect(() => {
    setSelectedSize('all');
    setSelectedColor('all');
  }, [selectedSubCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter (name, SKU, category, description, sizes or colors match)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.category && p.category.toLowerCase().includes(term)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.sizes && p.sizes.toLowerCase().includes(term)) ||
        (p.colors && p.colors.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
      // Subcategory filter
      if (selectedSubCategory !== 'all') {
        result = result.filter(p => p.subCategory === selectedSubCategory);
      }
    }

    // Stock Filter
    if (stockFilter === 'instock') {
      result = result.filter(p => Number(p.stockQuantity || 0) > 0);
    } else if (stockFilter === 'lowstock') {
      result = result.filter(p => {
        const stock = Number(p.stockQuantity || 0);
        const minLevel = Number(p.minStockLevel || 5);
        return stock > 0 && stock <= minLevel;
      });
    } else if (stockFilter === 'outofstock') {
      result = result.filter(p => Number(p.stockQuantity || 0) <= 0);
    }

    // Size Filter
    if (selectedSize !== 'all') {
      result = result.filter(p => p.sizes && p.sizes.split(',').map(s => s.trim().toUpperCase()).includes(selectedSize));
    }

    // Color Filter
    if (selectedColor !== 'all') {
      result = result.filter(p => p.colors && p.colors.split(',').map(c => c.trim().toUpperCase()).includes(selectedColor.toUpperCase()));
    }

    // Sort order
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'stock_desc') {
      result.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => {
        const dateA = a.id; // fallback comparison
        const dateB = b.id;
        return dateB.localeCompare(dateA);
      });
    }

    return result;
  }, [products, searchTerm, selectedCategory, selectedSubCategory, stockFilter, sortBy, selectedSize, selectedColor]);

  const addToCart = (product: MerchantProduct) => {
    if (Number(product.stockQuantity || 0) <= 0) {
      triggerCartError("ARTICLE EN RUPTURE, LA VENTE EST ANNULÉE.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= (product.stockQuantity || 0)) {
          toast.error('Stock insuffisant');
          return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.price, 
        costPrice: product.costPrice || 0,
        sizes: product.sizes || '',
        colors: product.colors || ''
      }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.productId !== productId));

  const total = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    setIsSubmitting(true);
    
    // Check limit for TESTE plan
    if (merchant.plan === 'FREE') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const salesTodayCount = await db.sales
        .where('merchantId')
        .equals(merchant.id)
        .filter(sale => new Date(sale.createdAt || sale.created_at || new Date()) >= startOfDay)
        .count();

      if (salesTodayCount >= 2) {
        toast.error('Vous avez atteint la limite de 2 ventes par jour pour le plan TESTE. Veuillez passer au forfait supérieur.');
        if (setShowUpgradeModal) setShowUpgradeModal(true);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const actualPaid = isPartial ? (Number(initialPaidAmount) || 0) : total;
      
      const saleData: Partial<MerchantSale> = {
        merchantId: merchant.id,
        items: cart.map(item => ({ ...item, total: item.price * item.quantity })),
        totalAmount: total,
        paidAmount: actualPaid,
        balance: total - actualPaid,
        payments: actualPaid > 0 ? [{
          id: uuidv4(),
          amount: actualPaid,
          method: paymentMethod as any,
          date: new Date()
        }] : [],
        paymentMethod: isPartial ? 'split' : paymentMethod as any,
        customerName,
        customerPhone,
        processedBy: user.uid,
        createdAt: new Date()
      };
      
      // Save the sale (service handles stock update)
      const saleId = await dbService.merchantSales.save(saleData);

      setShowReceiptModal({ show: true, saleData: { ...saleData, id: saleId } });

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      toast.success('Vente enregistrée !');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erreur lors de la vente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col lg:flex-row gap-8"
    >
      <div className="flex-1 space-y-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un produit par nom, SKU ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-black/5 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-primary/10 shadow-sm outline-none transition-all"
          />
        </div>

        {/* Filtres Intelligents */}
        <div className="space-y-4 bg-gray-50/50 p-4 rounded-3xl border border-black/5">
          {/* Ligne 1: Catégories (Filtre rapide) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Catégories de l'établissement
              </span>
              {selectedCategory !== 'all' && (
                <button 
                  onClick={() => setSelectedCategory('all')} 
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200 shadow-sm'
                }`}
              >
                <span>Tous</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = products.filter(p => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                      selectedCategory === cat
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200 shadow-sm'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ligne 1.5: Sous-catégories (Filtre rapide) */}
          {selectedCategory !== 'all' && subCategories.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-black/5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-3 h-3" />
                  Sous-catégories associées
                </span>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">
                <button
                  onClick={() => setSelectedSubCategory('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    selectedSubCategory === 'all'
                      ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                      : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                  }`}
                >
                  <span>Toutes</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    selectedSubCategory === 'all' ? 'bg-primary/20 text-primary' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {products.filter(p => p.category === selectedCategory).length}
                  </span>
                </button>

                {subCategories.map((subCat) => {
                  const count = products.filter(p => p.category === selectedCategory && p.subCategory === subCat).length;
                  return (
                    <button
                      key={subCat}
                      onClick={() => setSelectedSubCategory(subCat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                        selectedSubCategory === subCat
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                      }`}
                    >
                      <span>{subCat}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                        selectedSubCategory === subCat ? 'bg-primary/20 text-primary' : 'bg-gray-50 text-gray-400'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ligne 1.8: Tailles et Couleurs */}
          {(availableSizes.length > 0 || availableColors.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-black/5">
              {availableSizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-gray-400" />
                      Filtrer par Taille
                    </span>
                    {selectedSize !== 'all' && (
                      <button 
                        onClick={() => setSelectedSize('all')} 
                        className="text-[9px] font-bold text-primary hover:underline-offset-4 hover:underline"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">
                    <button
                      onClick={() => setSelectedSize('all')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                        selectedSize === 'all'
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                      }`}
                    >
                      Toutes
                    </button>
                    {availableSizes.map(size => {
                      const count = products.filter(p => p.sizes && p.sizes.split(',').map(s => s.trim().toUpperCase()).includes(size)).length;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                            selectedSize === size
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200'
                          }`}
                        >
                          <span>{size}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            selectedSize === size ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-gray-400" />
                      Filtrer par Couleur
                    </span>
                    {selectedColor !== 'all' && (
                      <button 
                        onClick={() => setSelectedColor('all')} 
                        className="text-[9px] font-bold text-primary hover:underline-offset-4 hover:underline"
                      >
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">
                    <button
                      onClick={() => setSelectedColor('all')}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                        selectedColor === 'all'
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
                          : 'bg-white text-gray-500 hover:text-gray-800 border-black/5 hover:border-gray-200'
                      }`}
                    >
                      Toutes
                    </button>
                    {availableColors.map(color => {
                      const count = products.filter(p => p.colors && p.colors.split(',').map(c => c.trim().toUpperCase()).includes(color.toUpperCase())).length;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${
                            selectedColor === color
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-gray-600 hover:text-gray-900 border-black/5 hover:border-gray-200'
                          }`}
                        >
                          <span>{color}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            selectedColor === color ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ligne 2: Disponibilité & Tri */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border-t border-black/5 pt-3">
            {/* Disponibilité Segmented Control */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Filtrer Stock :</span>
              <div className="bg-white border border-black/5 rounded-2xl p-1 flex gap-1 shadow-sm">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    stockFilter === 'all'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Tout
                </button>
                <button
                  onClick={() => setStockFilter('instock')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    stockFilter === 'instock'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  En Stock
                </button>
                <button
                  onClick={() => setStockFilter('lowstock')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    stockFilter === 'lowstock'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Alerte Stock</span>
                  {products.filter(p => {
                    const st = Number(p.stockQuantity || 0);
                    const ml = Number(p.minStockLevel || 5);
                    return st > 0 && st <= ml;
                  }).length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${stockFilter === 'lowstock' ? 'bg-white' : 'bg-amber-500 animate-pulse'}`} />
                  )}
                </button>
                <button
                  onClick={() => setStockFilter('outofstock')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                    stockFilter === 'outofstock'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>Rupture</span>
                  {products.filter(p => Number(p.stockQuantity || 0) <= 0).length > 0 && (
                    <span className={`w-1.5 h-1.5 rounded-full ${stockFilter === 'outofstock' ? 'bg-white' : 'bg-rose-500 animate-pulse'}`} />
                  )}
                </button>
              </div>
            </div>

            {/* Tri Selector & Stats Info */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* Tri Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Trier par :</span>
                <div className="relative flex-1 md:flex-none">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white border border-black/5 rounded-2xl pl-3 pr-8 py-1.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-primary/10 shadow-sm cursor-pointer w-full"
                  >
                    <option value="name">Nom (A-Z)</option>
                    <option value="price_asc">Prix : Croissant</option>
                    <option value="price_desc">Prix : Décroissant</option>
                    <option value="stock_desc">Niveau de Stock</option>
                    <option value="name">Défaut</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Résumé badge */}
              <div className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1.5 rounded-2xl border border-primary/10 tracking-wider whitespace-nowrap">
                {filteredProducts.length} PRODUITS
              </div>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-black/5 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-bold text-sm">Aucun produit ne correspond à vos filtres</p>
            <p className="text-gray-400 text-xs mt-1">Essayez de réinitialiser les critères ou de modifier votre recherche.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setStockFilter('all');
                setSortBy('name');
                setSelectedSize('all');
                setSelectedColor('all');
              }} 
              className="mt-4 px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-all"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white p-4 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all text-left group relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-square bg-gray-50 rounded-2xl mb-3 flex items-center justify-center overflow-hidden border border-black/5 group-hover:scale-105 transition-transform">
                    {product.image ? (
                      <OptimizedImage src={product.image} alt={product.name} width={300} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-8 h-8 text-gray-200" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 truncate leading-tight">{product.name}</h4>
                  {product.sku && (
                    <p className="text-[9px] font-mono font-bold text-gray-400 mt-0.5 uppercase">SKU: {product.sku}</p>
                  )}
                  {product.category && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md font-bold uppercase">{product.category}</span>
                      {product.sizes && (
                        <span className="text-[9px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-bold">T: {product.sizes}</span>
                      )}
                      {product.colors && (
                        <span className="text-[9px] font-mono bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold">C: {product.colors}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <p className="text-sm text-primary font-black">{product.price.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span></p>
                  <div className={`px-2 py-0.5 rounded-lg border ${
                    (product.stockQuantity || 0) <= (product.minStockLevel || 5)
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}>
                    <p className="text-[9px] font-mono font-bold">STOCK: {product.stockQuantity || 0}</p>
                  </div>
                </div>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-[400px]">
        <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-xl sticky top-32">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-ink flex items-center">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mr-3">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              Panier
            </h3>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
              merchant.licenseType === 'local' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {merchant.licenseType === 'local' ? <HardDrive className="w-2.5 h-2.5" /> : <Database className="w-2.5 h-2.5" />}
              {merchant.licenseType === 'local' ? 'Mode Local' : 'Sync Cloud'}
            </div>
          </div>

          <AnimatePresence>
            {cartError && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 bg-rose-50 border border-rose-100/80 rounded-2xl flex items-start gap-3 shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <p className="text-[11px] font-black text-rose-900 uppercase tracking-wide leading-snug">
                    {cartError}
                  </p>
                  <p className="text-[8px] text-rose-500 font-black uppercase tracking-widest mt-1">
                    Sélection annulée par précaution
                  </p>
                </div>
                <button
                  onClick={() => setCartError(null)}
                  className="absolute top-2 right-2 p-1 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Panier vide</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-2xl border border-gray-100 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-widest">
                        {item.quantity} x {item.price.toLocaleString()} {merchant.currency}
                      </p>
                      {item.sizes && (
                        <span className="text-[9px] font-mono font-semibold bg-blue-50 text-blue-600 px-1 py-0.5 rounded">T: {item.sizes}</span>
                      )}
                      {item.colors && (
                        <span className="text-[9px] font-mono font-semibold bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded">C: {item.colors}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-black text-ink">{(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-6 border-t border-gray-100 pt-8">
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="text" placeholder="Nom du client (optionnel)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input type="tel" placeholder="Téléphone client" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              <PaymentMethodBtn active={paymentMethod === 'cash'} onClick={() => setPaymentMethod('cash')} label="ESPÈCES" />
              <PaymentMethodBtn active={paymentMethod === 'card'} onClick={() => setPaymentMethod('card')} label="CARTE" />
              <PaymentMethodBtn active={paymentMethod === 'mobile_money'} onClick={() => setPaymentMethod('mobile_money')} label="MOBILE" />
            </div>

            <div className="pt-4 border-t border-black/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setIsPartial(!isPartial)}
                  className={`w-10 h-6 rounded-full transition-all relative ${isPartial ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPartial ? 'left-5' : 'left-1'}`} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Paiement partiel (Acompte)</span>
              </label>

              {isPartial && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2 overflow-hidden"
                >
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Montant de l'acompte</label>
                  <input 
                    type="number" 
                    value={initialPaidAmount}
                    onChange={e => setInitialPaidAmount(e.target.value)}
                    placeholder="Entrez le montant reçu..."
                    className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl text-sm font-black outline-none focus:border-primary/30"
                  />
                  {initialPaidAmount && Number(initialPaidAmount) < total && (
                    <p className="text-[9px] font-bold text-amber-500 italic">Reste à payer: {(total - Number(initialPaidAmount)).toLocaleString()} {merchant.currency}</p>
                  )}
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
              <span className="text-gray-400 text-[10px] font-mono font-black uppercase tracking-widest">Total à payer</span>
              <div className="text-right">
                <span className="text-3xl font-black text-ink">{total.toLocaleString()}</span>
                <span className="text-xs font-mono font-bold text-gray-400 ml-1 uppercase">{merchant.currency}</span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || isSubmitting} 
              className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-primary-hover transition-all disabled:opacity-50 shadow-xl shadow-primary/20 active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Valider la vente'}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal?.show && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Vente Réussie !</h3>
              <p className="text-gray-500 mb-8">La transaction a été enregistrée avec succès.</p>
              
              <div className="space-y-4 text-left">
                {/* Section Ticket */}
                <div>
                  <div className="text-[9px] font-mono font-black uppercase text-amber-500 tracking-[0.2em] mb-2">Format Ticket POS</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        printDirectHTML(merchant, 'receipt', showReceiptModal.saleData);
                      }}
                      className="py-3 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-amber-600 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer</span>
                    </button>
                    <button 
                      onClick={() => {
                        generateReceiptPDF(merchant, showReceiptModal.saleData, 'download');
                      }}
                      className="py-3 bg-amber-50 text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-amber-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>

                {/* Section Facture A4 */}
                <div>
                  <div className="text-[9px] font-mono font-black uppercase text-emerald-500 tracking-[0.2em] mb-2">Format Facture A4</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => {
                        printDirectHTML(merchant, 'invoice', showReceiptModal.saleData);
                      }}
                      className="py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimer</span>
                    </button>
                    <button 
                      onClick={() => {
                        generateA4InvoicePDF(merchant, showReceiptModal.saleData, 'download');
                      }}
                      className="py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setShowReceiptModal(null)}
                    className="w-full py-3 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-black/5 text-center"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const PaymentMethodBtn = ({ active, onClick, label }: any) => (
  <button 
    onClick={onClick} 
    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
      active 
        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
    }`}
  >
    {label}
  </button>
);

// --- Merchant Audit Log ---
const MerchantAuditLog = ({ merchant }: { merchant: Merchant }) => {
  const [auditLimit, setAuditLimit] = useState(10);
  const products = useLiveQuery(() => 
    db.products.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const movements = useLiveQuery(() => 
    db.movements.where('merchantId').equals(merchant.id).reverse().toArray()
  , [merchant.id]) || [];

  const loading = false;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Journal d'Audit</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Traçabilité complète des flux de stock</p>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-white border border-black/5 rounded-xl shadow-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">Temps Réel</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Horodatage</th>
                  <th className="px-8 py-5">Produit</th>
                  <th className="px-8 py-5">Type de Flux</th>
                  <th className="px-8 py-5">Quantité</th>
                  <th className="px-8 py-5">Delta Stock</th>
                  <th className="px-8 py-5">Motif / Raison</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.slice(0, auditLimit).map((m: any) => {
                  const product = products.find(p => p.id === m.productId);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-[11px] font-mono font-bold text-gray-400">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'dd.MM.yyyy') : '--'}
                        </p>
                        <p className="text-[10px] font-mono text-gray-300">
                          {m.createdAt?.seconds ? format(new Date(m.createdAt.seconds * 1000), 'HH:mm:ss') : '--'}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-gray-900 text-sm leading-tight">{product?.name || 'Produit supprimé'}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter mt-0.5">ID: {m.productId.slice(0, 8)}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          m.type === 'in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          m.type === 'sale' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                          {m.type === 'in' ? 'ENTRÉE' : m.type === 'sale' ? 'VENTE' : m.type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`flex items-center font-mono font-black text-sm ${m.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {m.type === 'in' ? <Plus className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                          {m.quantity}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-mono text-gray-400">{m.previousQuantity}</span>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <span className="text-[11px] font-mono font-black text-ink">{m.newQuantity}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-xs text-gray-500 italic leading-relaxed max-w-xs">{m.reason || 'Aucune raison spécifiée'}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {movements.length > auditLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setAuditLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Merchant Accounting ---
const MerchantBuild = ({ merchant }: { merchant: Merchant & { id: string } }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      toast.success('Application installée avec succès !');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast.error("Votre navigateur/appareil ne remonte pas l'invite d'installation (ou vous l'avez déjà installée). Consultez la section de droite pour l'installation manuelle.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
      toast.success("Installation PWA acceptée !");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 border-b border-black/5">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-2">Technologie PWA</p>
          <h2 className="text-3xl font-black text-ink tracking-tight">Installation Bureau & Mobile</h2>
          <p className="text-gray-400 font-medium max-w-xl">
            Générez un exécutable autonome (.exe ou .dmg) pour votre PC ou Mac. Cette version fonctionnera 100% hors-ligne avec SQLite.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] border border-black/5 p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Cpu className="w-40 h-40" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="p-4 bg-emerald-50 rounded-2xl w-fit">
              <Download className="w-8 h-8 text-emerald-500" />
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-black text-ink tracking-tight">Application Native</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Utilisez la technologie PWA (Progressive Web App) pour une installation instantanée sans fichier exécutable (.exe/.dmg), garantie sans virus et toujours à jour.
              </p>
            </div>

            <ul className="space-y-3">
              {[
                "Expérience plein écran instantanée",
                "Moteur de base de données SQLite embarqué (OPFS)",
                "Support complet du mode Hors-ligne",
                "Mise à jour automatique en arrière-plan",
                "Icône sur le bureau et le menu Démarrer"
              ].map((step, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs font-black text-gray-400 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {step}
                </li>
              ))}
            </ul>

            <div className="space-y-4 relative pt-4">
              {isInstalled ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm font-semibold flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </span>
                  Application déjà installée sur cet appareil. Cherchez Acom Studio dans vos applications !
                </div>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 fill-current" />
                  {isInstallable ? 'Installer Acom Studio' : "Vérifier la compatibilité"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-950 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden border border-white/5 flex flex-col justify-center items-center text-center">
            
            <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-inner border border-white/10">
                <Monitor className="w-12 h-12 text-white opacity-80" />
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Acom Gestion Desktop</h3>
            
            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
              Téléchargez la version officielle de l'application bureau pour Windows et MacOS. Profitez d'une expérience optimisée avec un support matériel complet (imprimantes de tickets, lecteurs de codes-barres).
            </p>

            <div className="w-full max-w-sm space-y-4">
              <a
                href="https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop.Setup.1.0.0.exe"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
              >
                <Download className="w-5 h-5" />
                Télécharger pour Windows (.exe)
              </a>

              <a
                href="https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop-1.0.0-arm64.dmg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
              >
                <Download className="w-5 h-5" />
                Télécharger pour MacOS (.dmg)
              </a>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                <p className="text-[10px] text-gray-500 font-mono break-all leading-tight mb-2">
                  <span className="font-bold text-gray-400 mr-2 uppercase tracking-wider">WIN SHA-256:</span>
                  8c68a169f2f1c7def734ad91d4ebf0cbb3d45bb32ced315d11e722cac17c4fcd
                </p>
                <p className="text-[10px] text-gray-500 font-mono break-all leading-tight">
                  <span className="font-bold text-gray-400 mr-2 uppercase tracking-wider">MAC SHA-256:</span>
                  1656ba775088e613882e8b794b03d528b7e8f9a0b1c2d3e4f5a6b7c8d9e0
                </p>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
};

const MerchantAccounting = ({ merchant }: { merchant: Merchant }) => {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({ title: '', amount: 0, category: 'Général', description: '' });
  const [saving, setSaving] = useState(false);
  const [expenseLimit, setExpenseLimit] = useState(10);

  // const expenseOptions = useMemo(() => ({
  //   where: [['merchantId', '==', merchant.id]],
  //   order: { column: 'createdAt' as const, direction: 'desc' as const },
  //   limit: 100,
  //   realtime: false
  // }), [merchant.id]);

  // const { data: expenses, loading } = useFirestoreData<MerchantExpense>(expenseOptions);

  useEffect(() => {
    syncService.syncExpenses(merchant.id);
  }, [merchant.id]);

  const expenses = useLiveQuery(() => 
    db.expenses.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];
  const loading = false; // Simplified

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) return;
    setSaving(true);
    try {
      await dbService.merchantExpenses.save({
        ...newExpense,
        merchantId: merchant.id,
        date: new Date().toISOString()
      });
      syncService.syncExpenses(merchant.id);
      // toast.success('Dépense enregistrée');
      setIsAddingExpense(false);
      setNewExpense({ title: '', amount: 0, category: 'Général', description: '' });
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Comptabilité</h2>
          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des flux financiers & dépenses</p>
        </div>
        <button 
          onClick={() => setIsAddingExpense(true)} 
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle dépense</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Désignation</th>
                <th className="px-8 py-5">Catégorie</th>
                <th className="px-8 py-5">Date d'émission</th>
                <th className="px-8 py-5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <Receipt className="w-6 h-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 text-sm font-medium">Aucune dépense enregistrée</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.slice(0, expenseLimit).map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-black text-ink text-sm leading-tight">{expense.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em]">REF: {expense.id.slice(0, 8)}</p>
                        {(expense as any).syncStatus && (
                          <>
                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                              (expense as any).syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              (expense as any).syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-gray-50 text-gray-400 border-gray-100'
                            }`}>
                              {(expense as any).syncStatus === 'synced' ? <Check className="w-2 h-2" /> : <RefreshCw className="w-2 h-2 animate-spin" />}
                              <span className="text-[7px] font-black uppercase">{(expense as any).syncStatus}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500 border border-gray-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-ink uppercase">
                        {expense.createdAt?.seconds ? format(new Date(expense.createdAt.seconds * 1000), 'dd/MM/yyyy') : '-'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-sm font-black text-rose-600 font-mono">
                        -{expense.amount.toLocaleString()} <span className="text-[10px] opacity-60">{merchant.currency}</span>
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {expenses.length > expenseLimit && (
            <div className="p-4 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setExpenseLimit(prev => prev + 10)}
                className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Voir plus
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Nouvelle dépense</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Enregistrement comptable</p>
                </div>
                <button onClick={() => setIsAddingExpense(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveExpense} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Désignation / Titre</label>
                  <input type="text" required value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Montant ({merchant.currency})</label>
                    <input type="number" required value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                    <input type="text" value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-rose-500/20 bg-gray-50/30 font-bold" />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsAddingExpense(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Enregistrer la dépense'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Merchant Sales History ---
// --- Merchant Billing (Invoices & Quotes) ---
const MerchantBilling = ({ merchant }: { merchant: Merchant }) => {
  const [subTab, setSubTab] = useState<'invoices' | 'quotes' | 'pending'>('invoices');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<MerchantQuote | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<MerchantSale | null>(null);
  const [activePrintDoc, setActivePrintDoc] = useState<{ type: 'sale' | 'quote'; item: any } | null>(null);

  const [invoiceLimit, setInvoiceLimit] = useState(10);
  const [pendingLimit, setPendingLimit] = useState(10);
  const [quoteLimit, setQuoteLimit] = useState(10);

  const sales = useLiveQuery(() => 
    db.sales.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];

  const quotes = useLiveQuery(() => 
    db.quotes.where('merchantId').equals(merchant.id).reverse().sortBy('createdAt')
  , []) || [];

  const handleConvertQuote = async (quote: MerchantQuote) => {
    try {
      await billingService.convertQuoteToInvoice(quote, merchant);
      toast.success('Devis converti en facture avec succès');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Facturation & Devis</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Gestion des documents commerciaux</p>
        </div>
        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setSubTab('invoices')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'invoices' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
          >
            Factures
          </button>
          <button 
            onClick={() => setSubTab('pending')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'pending' ? 'bg-white text-rose-500 shadow-sm' : 'text-gray-400 hover:text-rose-500'}`}
          >
            Impayés
          </button>
          <button 
            onClick={() => setSubTab('quotes')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'quotes' ? 'bg-white text-ink shadow-sm' : 'text-gray-400 hover:text-ink'}`}
          >
            Devis
          </button>
        </div>
      </div>

      {subTab === 'invoices' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Receipt className="w-5 h-5 text-primary" />
              Historique des Factures
            </h3>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{sales.length} Documents</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Référence & Date</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Mode</th>
                    <th className="px-8 py-5 text-right">Montant TTC</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 text-sm">Aucune facture enregistrée</td></tr>
                  ) : (
                    sales.slice(0, invoiceLimit).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-mono font-black text-ink">#INV-{sale.id.slice(0, 8).toUpperCase()}</p>
                            {(sale as any).syncStatus && (
                              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${
                                (sale as any).syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                (sale as any).syncStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-gray-50 text-gray-400 border-gray-100'
                              }`}>
                                {(sale as any).syncStatus === 'synced' ? <Check className="w-2 h-2" /> : <RefreshCw className="w-2 h-2 animate-spin" />}
                                <span className="text-[7px] font-black uppercase">{(sale as any).syncStatus}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                            {sale.createdAt?.seconds ? format(new Date(sale.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-ink text-sm">{sale.customerName || 'Client POS'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit ${
                              sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {sale.paymentMethod}
                            </span>
                            {sale.balance !== undefined && sale.balance > 0 && (
                              <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full text-[9px] font-black uppercase tracking-widest w-fit">
                                Reste: {sale.balance.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-ink">
                          {sale.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-3">
                             {sale.balance !== undefined && sale.balance > 0 && (
                               <button 
                                 onClick={() => { setSelectedSale(sale as any); setIsPaymentModalOpen(true); }} 
                                 className="px-3 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all border border-primary/20 text-[10px] font-black uppercase tracking-wider"
                                 title="Encaisser"
                               >
                                 Encaisser
                               </button>
                             )}
                             
                             {/* Centralized Print Action Button */}
                             <button 
                               onClick={() => setActivePrintDoc({ type: 'sale', item: sale })} 
                               className="px-4 py-2 bg-gray-50 border border-black/5 hover:border-primary/20 hover:bg-primary/5 text-gray-700 hover:text-primary rounded-xl transition-all text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                               title="Imprimer / Exporter le document (Reçus, Facture, Impayés)"
                             >
                               <Printer className="w-3.5 h-3.5 text-primary" />
                               <span>Imprimer / Exp.</span>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {sales.length > invoiceLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setInvoiceLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'pending' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              Factures avec Impayés
            </h3>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{sales.filter(s => s.balance && s.balance > 0).length} En attente</span>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Référence</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5 text-right">Total</th>
                    <th className="px-8 py-5 text-right text-rose-500">Reste à payer</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sales.filter(s => s.balance !== undefined && s.balance > 0).length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 text-sm italic uppercase tracking-widest font-black opacity-40">Toutes les créances sont recouvrées !</td></tr>
                  ) : (
                    sales.filter(s => s.balance !== undefined && s.balance > 0).slice(0, pendingLimit).map((sale) => (
                      <tr key={sale.id} className="hover:bg-rose-50/20 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-mono font-black text-ink">#INV-{sale.id.slice(0, 8).toUpperCase()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-ink text-sm">{sale.customerName || 'Client POS'}</p>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-gray-400">
                          {sale.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-rose-500">
                          {sale.balance?.toLocaleString()} <span className="text-[9px] font-bold">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-3">
                             <button 
                               onClick={() => { setSelectedSale(sale as any); setIsPaymentModalOpen(true); }} 
                               className="px-3 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 transition-all"
                             >
                               Encaisser
                             </button>
                             
                             {/* Centralized Print Action Button */}
                             <button 
                               onClick={() => setActivePrintDoc({ type: 'sale', item: sale })} 
                               className="px-4 py-2 bg-gray-50 border border-black/5 hover:border-rose-100 hover:bg-rose-50/50 text-gray-700 hover:text-rose-600 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                               title="Imprimer / Exporter le document (Reçus, Facture, Impayés)"
                             >
                               <Printer className="w-3.5 h-3.5 text-rose-500" />
                               <span>Imprimer / Exp.</span>
                             </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {sales.filter(s => s.balance !== undefined && s.balance > 0).length > pendingLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setPendingLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {subTab === 'quotes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
              Gestion des Devis
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{quotes.length} Devis</span>
              <button 
                onClick={() => { setSelectedQuote(null); setIsQuoteModalOpen(true); }}
                className="px-6 py-3 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all"
              >
                + Nouveau Devis
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                    <th className="px-8 py-5">Référence & Date</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Statut</th>
                    <th className="px-8 py-5 text-right">Montant Estimé</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quotes.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-gray-400 text-sm">Aucun devis enregistré</td></tr>
                  ) : (
                    quotes.slice(0, quoteLimit).map((quote) => (
                      <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-6">
                          <p className="text-[11px] font-mono font-black text-ink">#QT-{quote.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-[9px] font-mono text-gray-400 mt-1 uppercase">
                            {quote.createdAt?.seconds ? format(new Date(quote.createdAt.seconds * 1000), 'dd/MM/yyyy') : format(new Date(quote.createdAt), 'dd/MM/yyyy')}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-black text-ink text-sm">{quote.customerName || 'Prospect'}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            quote.status === 'invoiced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            quote.status === 'draft' ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                          }`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-ink">
                          {quote.totalAmount.toLocaleString()} <span className="text-[9px] opacity-40">{merchant.currency}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-3">
                             {/* Centralized Print Action Button */}
                             <button 
                               onClick={() => setActivePrintDoc({ type: 'quote', item: quote })} 
                               className="px-4 py-2 bg-gray-50 border border-black/5 hover:border-blue-100 hover:bg-blue-50/50 text-gray-700 hover:text-blue-600 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm"
                               title="Imprimer / Exporter le devis"
                             >
                               <Printer className="w-3.5 h-3.5 text-blue-500" />
                               <span>Imprimer / Exp.</span>
                             </button>

                             {quote.status === 'draft' && (
                               <button 
                                 onClick={() => { setSelectedQuote(quote); setIsQuoteModalOpen(true); }} 
                                 className="p-2.5 bg-gray-50 hover:bg-amber-50 text-gray-400 hover:text-amber-500 rounded-xl transition-all border border-black/5"
                                 title="Modifier Devis"
                               >
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                             )}
                             {quote.status !== 'invoiced' && (
                               <button 
                                 onClick={() => handleConvertQuote(quote)} 
                                 className="p-2.5 bg-gray-50 hover:bg-emerald-50 text-emerald-400 hover:text-emerald-600 rounded-xl transition-all border border-black/5"
                                 title="Convertir en Facture"
                               >
                                 <Plus className="w-3.5 h-3.5" />
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {quotes.length > quoteLimit && (
                <div className="p-4 flex justify-center border-t border-gray-100">
                  <button 
                    onClick={() => setQuoteLimit(prev => prev + 10)}
                    className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Voir plus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      <QuoteModal 
        isOpen={isQuoteModalOpen} 
        onClose={() => setIsQuoteModalOpen(false)} 
        merchant={merchant} 
        quote={selectedQuote}
      />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        merchant={merchant}
        sale={selectedSale}
      />

      {/* Centralized Beautiful Document Printing Modal */}
      <AnimatePresence>
        {activePrintDoc && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setActivePrintDoc(null)} 
              className="absolute inset-0 bg-ink/65 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5"
            >
              {/* Header */}
              <div className="bg-gray-50/80 px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-ink flex items-center gap-2">
                    <Printer className="w-5 h-5 text-primary" />
                    Centre d'Impression & d'Export
                  </h3>
                  <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.15em] mt-0.5">
                    {activePrintDoc.type === 'sale' 
                      ? `Facture #INV-${activePrintDoc.item.id.slice(0, 8).toUpperCase()}` 
                      : `Devis #QT-${activePrintDoc.item.id.slice(0, 8).toUpperCase()}`
                    }
                  </p>
                </div>
                <button 
                  onClick={() => setActivePrintDoc(null)} 
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 hover:text-ink"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Overview */}
              <div className="px-8 py-5 bg-primary/2 flex justify-between items-center text-xs font-mono font-black border-b border-gray-100/50">
                <div className="text-gray-500">
                  CLIENT: <span className="text-ink font-bold font-sans">{activePrintDoc.item.customerName || 'Client POS'}</span>
                </div>
                <div className="text-primary font-mono font-bold">
                  TOTAL: <span>{Number(activePrintDoc.item.totalAmount || 0).toLocaleString()} {merchant.currency}</span>
                </div>
              </div>

              {/* Options Section */}
              <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
                {activePrintDoc.type === 'sale' ? (
                  <>
                    {/* OPTION 1: Receipt standard (THERMIQUE) */}
                    <div className="p-4 bg-white hover:bg-amber-50/10 border border-gray-100 hover:border-amber-200 rounded-2xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-105 transition-transform">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm">Reçu de Caisse (Ticket Thermique)</h4>
                          <p className="text-xs text-gray-500 max-w-sm mt-0.5">Format de poche (80mm), optimal pour les imprimantes thermiques de caisse et justificatifs légers.</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <button 
                          onClick={() => printDirectHTML(merchant, 'receipt', activePrintDoc.item)}
                          className="flex-1 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                        <button 
                          onClick={() => generateReceiptPDF(merchant, activePrintDoc.item, 'download')}
                          className="flex-1 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* OPTION 2: Facture A4 (OFFICIELLE) */}
                    <div className="p-4 bg-white hover:bg-emerald-50/10 border border-gray-100 hover:border-emerald-200 rounded-2xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl group-hover:scale-105 transition-transform">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm">Facture Standard (Format A4)</h4>
                          <p className="text-xs text-gray-500 max-w-sm mt-0.5">Facture réglementaire complète avec en-tête d'entreprise, totaux détaillés et cadres de signatures.</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <button 
                          onClick={() => printDirectHTML(merchant, 'invoice', activePrintDoc.item)}
                          className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                        <button 
                          onClick={() => generateA4InvoicePDF(merchant, activePrintDoc.item, 'download', 'invoice')}
                          className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* OPTION 4: Devis Proforma (Quotes) */}
                    <div className="p-4 bg-white hover:bg-blue-50/10 border border-gray-100 hover:border-blue-200 rounded-2xl transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4 group">
                      <div className="flex items-start gap-3">
                        <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-105 transition-transform">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-ink text-sm">Devis Proforma (Format A4)</h4>
                          <p className="text-xs text-gray-500 max-w-sm mt-0.5">Proposition budgétaire officielle A4 avec validité d'offre et grilles de prix prévisionnels.</p>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2 min-w-[120px]">
                        <button 
                          onClick={() => printDirectHTML(merchant, 'quote', activePrintDoc.item)}
                          className="flex-1 py-1.5 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Imprimer
                        </button>
                        <button 
                          onClick={() => generateA4QuotePDF(merchant, activePrintDoc.item, 'download')}
                          className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          PDF
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setActivePrintDoc(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold text-xs text-gray-600 uppercase tracking-widest transition-colors shadow-sm"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Merchant Payment Modal ---
const PaymentModal = ({ isOpen, onClose, merchant, sale }: { isOpen: boolean, onClose: () => void, merchant: Merchant, sale: MerchantSale | null }) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'cash' | 'card' | 'mobile_money' | 'transfer'>('cash');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (sale) {
      setAmount(sale.balance || 0);
    }
  }, [sale, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale || amount <= 0) return;

    if (amount > (sale.balance || sale.totalAmount)) {
      toast.error('Le montant dépasse le solde restant');
      return;
    }

    setIsSaving(true);
    try {
      await billingService.recordPayment(sale.id, amount, method);
      toast.success('Paiement enregistré');
      onClose();
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} className="absolute inset-0 bg-ink/60 backdrop-blur-md" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 overflow-hidden">
        <div className="mb-6">
          <h3 className="text-xl font-black text-ink">Enregistrer un Paiement</h3>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest mt-1">Facture #INV-{sale.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex justify-between items-center border border-black/5">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</p>
            <p className="font-bold text-ink">{sale.customerName || 'Client POS'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Solde</p>
            <p className="text-xl font-black text-primary">{(sale.balance !== undefined ? sale.balance : sale.totalAmount).toLocaleString()} <span className="text-[10px] opacity-40 font-mono">{merchant.currency}</span></p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Montant à encaisser</label>
            <input 
              type="number" 
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              required
              className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-black text-lg outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Mode de règlement</label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'card', 'mobile_money', 'transfer'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m as any)}
                  className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${method === m ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-gray-400 border-black/5 hover:border-primary/20'}`}
                >
                  {m === 'mobile_money' ? 'MOBILE' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-ink transition-all">Annuler</button>
            <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-ink text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirmer l\'encaissement'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Supplier Manager ---
const SupplierManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState<Partial<MerchantSupplier> | null>(null);
  const [saving, setSaving] = useState(false);

  const suppliers = useLiveQuery(() => 
    db.suppliers.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier?.name) return;
    setSaving(true);
    try {
      await dbService.merchantSuppliers.save({
        ...currentSupplier,
        merchantId: merchant.id
      });
      toast.success(currentSupplier.id ? 'Fournisseur mis à jour' : 'Fournisseur ajouté');
      setIsEditing(false);
      setCurrentSupplier(null);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce fournisseur ?')) return;
    try {
      await dbService.merchantSuppliers.delete(id);
      toast.success('Fournisseur supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Partenaires Logistiques</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5">Fournisseurs actifs: {suppliers.length.toString().padStart(2, '0')}</p>
        </div>
        <button
          onClick={() => {
            setCurrentSupplier({ name: '', contactName: '', email: '', phone: '', category: 'Général' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-3 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                  <Truck className="w-7 h-7 text-primary" />
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => { setCurrentSupplier(supplier); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl border border-transparent hover:border-rose-200 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black text-ink mb-1 leading-tight">{supplier.name}</h3>
              <p className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mb-6">{supplier.category}</p>
              
              <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <User className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="font-black text-ink">{supplier.contactName || '---'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <Phone className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="font-mono font-bold">{supplier.phone || '---'}</span>
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center mr-4 border border-black/5">
                    <Mail className="w-3.5 h-3.5 opacity-40 text-primary" />
                  </div>
                  <span className="truncate font-medium text-gray-500">{supplier.email || '---'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">{currentSupplier?.id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des partenaires logistiques</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom de l'entreprise</label>
                    <input type="text" required value={currentSupplier?.name || ''} onChange={e => setCurrentSupplier({...currentSupplier, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Personne de contact</label>
                    <input type="text" value={currentSupplier?.contactName || ''} onChange={e => setCurrentSupplier({...currentSupplier, contactName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                    <input type="tel" value={currentSupplier?.phone || ''} onChange={e => setCurrentSupplier({...currentSupplier, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                    <input type="email" value={currentSupplier?.email || ''} onChange={e => setCurrentSupplier({...currentSupplier, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                    <input type="text" value={currentSupplier?.category || ''} onChange={e => setCurrentSupplier({...currentSupplier, category: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  </div>
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le fournisseur'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Merchant Reports ---
const MerchantReports = ({ merchant }: { merchant: Merchant }) => {
  const sales = useLiveQuery(() => db.sales.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];
  const expenses = useLiveQuery(() => db.expenses.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];
  const products = useLiveQuery(() => db.products.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];

  const financialSummary = useMemo(() => {
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCollected = sales.reduce((acc, s) => acc + (s.paidAmount !== undefined ? s.paidAmount : s.totalAmount), 0);
    const totalPending = sales.reduce((acc, s) => acc + (s.balance || 0), 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    
    const totalCOGS = sales.reduce((acc, sale) => {
      return acc + (sale.items || []).reduce((itemAcc, item) => {
        const product = products.find(p => p.id === item.productId);
        const cost = (item as any).costPrice || (product?.costPrice || 0);
        return itemAcc + ((item.quantity || 0) * cost);
      }, 0);
    }, 0);

    const netProfit = totalCollected - totalCOGS - totalExpenses;
    const margin = totalCollected > 0 ? (netProfit / totalCollected) * 100 : 0;

    return { totalRevenue, totalCollected, totalPending, totalExpenses, netProfit, margin, totalCOGS };
  }, [sales, expenses, products]);

  const monthlyData = useMemo(() => {
    // Group sales and expenses by month for the last 6 months
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subDays(now, 180),
      end: now
    });

    return months.map(month => {
      const label = format(month, 'MMM yy', { locale: fr });
      const monthSales = sales.filter(s => {
        const d = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : new Date(s.createdAt);
        return isSameMonth(d, month);
      });
      const monthExpenses = expenses.filter(e => {
        const d = e.createdAt?.seconds ? new Date(e.createdAt.seconds * 1000) : new Date(e.createdAt);
        return isSameMonth(d, month);
      });
      
      const rev = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);
      const exp = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
      
      const cogs = monthSales.reduce((acc, sale) => {
        return acc + (sale.items || []).reduce((itemAcc, item) => {
          const product = products.find(p => p.id === item.productId);
          const cost = (item as any).costPrice || (product?.costPrice || 0);
          return itemAcc + ((item.quantity || 0) * cost);
        }, 0);
      }, 0);
      
      return {
        name: label,
        Revenus: rev,
        Dépenses: exp,
        Profit: rev - cogs - exp
      };
    });
  }, [sales, expenses, products]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    
    // Sort and take top 4
    return Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, value]) => {
        const percentage = financialSummary.totalExpenses > 0 ? (value / financialSummary.totalExpenses * 100) : 0;
        return { name, value, percentage: percentage.toFixed(0) };
      });
  }, [expenses, financialSummary.totalExpenses]);

  // Export financial transactions to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Date', 'Type de flux', 'Catégorie', 'Description', 'Montant', 'Devise', 'Moyen de paiement / Statut'];
      
      const transactions: any[] = [];
      
      sales.forEach(s => {
        const t = s.createdAt?.seconds ? s.createdAt.seconds * 1000 : new Date(s.createdAt).getTime();
        transactions.push({
          timestamp: t,
          date: s.createdAt,
          type: 'Entrée (Vente)',
          category: 'Vente de produits',
          description: s.items?.map((it: any) => `${it.name} (x${it.quantity})`).join(', ') + (s.customerName ? ` - Client: ${s.customerName}` : ''),
          amount: s.totalAmount,
          status: s.balance > 0 ? `Reste à recouvrir: ${s.balance}` : 'Encaissé entièrement'
        });
      });

      expenses.forEach(e => {
        const t = e.createdAt?.seconds ? e.createdAt.seconds * 1000 : new Date(e.createdAt).getTime();
        transactions.push({
          timestamp: t,
          date: e.createdAt,
          type: 'Sortie (Dépense)',
          category: e.category || 'Général',
          description: e.description || '',
          amount: e.amount,
          status: (e as any).paymentMethod || 'Espèces'
        });
      });

      // Sort chronological descending (newest first)
      transactions.sort((a, b) => b.timestamp - a.timestamp);

      // Map to rows with semi-colons for perfect French Excel support
      const csvRows = [
        headers.join(';'),
        ...transactions.map(t => {
          const dateStr = t.date?.seconds 
            ? format(new Date(t.date.seconds * 1000), 'dd/MM/yyyy HH:mm')
            : format(new Date(t.date), 'dd/MM/yyyy HH:mm');
          
          const typeClean = (t.type || '').replace(/;/g, ',').replace(/"/g, '""');
          const categoryClean = (t.category || '').replace(/;/g, ',').replace(/"/g, '""');
          const descClean = (t.description || '').replace(/;/g, ',').replace(/"/g, '""');
          const statusClean = (t.status || '').replace(/;/g, ',').replace(/"/g, '""');
          
          return `"${dateStr}";"${typeClean}";"${categoryClean}";"${descClean}";"${t.amount}";"${merchant.currency}";"${statusClean}"`;
        })
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n"); // UTF-8 BOM byte
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `rapport_financier_${merchant.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Rapport exporté sous format CSV !');
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'exportation CSV.");
    }
  };

  // Export financial report to beautiful PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const margin = 20;
      let y = 20;

      // Header Brand Accent
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(margin, y, 170, 1.5, 'F');
      y += 8;

      // Header Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // Slate-800
      doc.text('RAPPORT FINANCIER', margin, y);
      
      // Right metadata
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 190, y, { align: 'right' });
      y += 5.5;
      doc.text(`Établissement : ${merchant.name}`, 190, y, { align: 'right' });
      y += 12;

      // Divider line
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, y, 190, y);
      y += 10;

      // Section: Synthèse Financière (Financial Summary)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('SYNTHÈSE DE LA PÉRIODE', margin, y);
      y += 6;

      // KPI boxes renderer helper
      const drawKpi = (label: string, value: number, x: number, yPos: number, width: number, height: number, colorArr: [number, number, number]) => {
        // Background card
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.roundedRect(x, yPos, width, height, 2.5, 2.5, 'FD');

        // Color ribbon side
        doc.setFillColor(...colorArr);
        doc.rect(x, yPos, 2, height, 'F');

        // Text
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(label.toUpperCase(), x + 5, yPos + 6);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text(`${pdfFormatNum(value)} ${merchant.currency}`, x + 5, yPos + 13);
      };

      const boxWidth = 53;
      const boxHeight = 18;
      const bGap = 55;

      // Draw first row of KPIs
      drawKpi('Chiffre d\'Affaires', financialSummary.totalRevenue, margin, y, boxWidth, boxHeight, [99, 102, 241]); // Indigo
      drawKpi('Total Encaissé', financialSummary.totalCollected, margin + bGap, y, boxWidth, boxHeight, [16, 185, 129]); // Emerald
      drawKpi('Reste à Recouvrer', financialSummary.totalPending, margin + bGap * 2, y, boxWidth, boxHeight, [245, 158, 11]); // Amber

      y += boxHeight + 4;

      // Draw second row of KPIs
      drawKpi('Coût Achat (Marchandises)', financialSummary.totalCOGS || 0, margin, y, boxWidth, boxHeight, [245, 158, 11]); // Amber
      drawKpi('Charges & Dépenses', financialSummary.totalExpenses, margin + bGap, y, boxWidth, boxHeight, [244, 63, 94]); // Rose
      drawKpi('Résultat Fiscal (Profit)', financialSummary.netProfit, margin + bGap * 2, y, boxWidth, boxHeight, [59, 130, 246]); // Blue
      
      y += boxHeight + 14;

      // Write Category Breakdown summary if there's any expense
      if (categoryData.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('RÉPARTITION MAJEURE DES DÉPENSES', margin, y);
        y += 5;

        // Display category items side-by-side
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const catStrList = categoryData.map(c => `${c.name}: ${pdfFormatNum(c.value)} ${merchant.currency} (${c.percentage}%)`);
        doc.text(catStrList.slice(0, 3).join('   |   '), margin, y);
        y += 11;
      }

      // Section: Detailed Tables
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('DERNIÈRES OPÉRATIONS DE REVENUS (VENTES)', margin, y);
      y += 5;

      // Sales Table Header
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin, y, 170, 6, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('Date', margin + 3, y + 4.5);
      doc.text('Client', margin + 25, y + 4.5);
      doc.text('Statut de Paiement', margin + 95, y + 4.5);
      doc.text('Montant', 190 - 3, y + 4.5, { align: 'right' });
      
      y += 6;

      // Render top 5 sales
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85); // Slate-700
      
      const topSales = [...sales].sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
        return tB - tA;
      }).slice(0, 5);

      if (topSales.length === 0) {
        doc.text('Aucune vente enregistrée', margin + 3, y + 4.5);
        y += 8;
      } else {
        topSales.forEach(s => {
          const dateStr = s.createdAt?.seconds 
            ? format(new Date(s.createdAt.seconds * 1000), 'dd/MM/yyyy')
            : format(new Date(s.createdAt), 'dd/MM/yyyy');
          
          doc.text(dateStr, margin + 3, y + 4.5);
          doc.text(s.customerName || 'Client de passage', margin + 25, y + 4.5);
          doc.text(s.balance > 0 ? `Incomplet (Reste ${pdfFormatNum(s.balance)})` : 'Payé complétement', margin + 95, y + 4.5);
          doc.text(`${pdfFormatNum(s.totalAmount)} ${merchant.currency}`, 190 - 3, y + 4.5, { align: 'right' });
          
          y += 6;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y, 190, y);
        });
        y += 8;
      }

      // Expenses Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text('DERNIÈRES OPÉRATIONS DE CHARGES (DÉPENSES)', margin, y);
      y += 5;

      // Expenses Table Header
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(margin, y, 170, 6, 'F');
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text('Date', margin + 3, y + 4.5);
      doc.text('Catégorie', margin + 25, y + 4.5);
      doc.text('Description / Motif', margin + 65, y + 4.5);
      doc.text('Montant', 190 - 3, y + 4.5, { align: 'right' });
      
      y += 6;

      // Render top 5 expenses
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85); // Slate-700

      const topExpenses = [...expenses].sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000;
        const tB = b.createdAt?.seconds ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000;
        return tB - tA;
      }).slice(0, 5);

      if (topExpenses.length === 0) {
        doc.text('Aucune dépense enregistrée', margin + 3, y + 4.5);
        y += 8;
      } else {
        topExpenses.forEach(e => {
          const dateStr = e.createdAt?.seconds 
            ? format(new Date(e.createdAt.seconds * 1000), 'dd/MM/yyyy')
            : format(new Date(e.createdAt), 'dd/MM/yyyy');
          
          const expDesc = e.description && e.description.length > 42 ? e.description.substring(0, 40) + '...' : (e.description || '-');
          
          doc.text(dateStr, margin + 3, y + 4.5);
          doc.text(e.category, margin + 25, y + 4.5);
          doc.text(expDesc, margin + 65, y + 4.5);
          doc.text(`${pdfFormatNum(e.amount)} ${merchant.currency}`, 190 - 3, y + 4.5, { align: 'right' });
          
          y += 6;
          doc.setDrawColor(241, 245, 249);
          doc.setLineWidth(0.2);
          doc.line(margin, y, 190, y);
        });
        y += 8;
      }

      // Final signature row of financial balance
      y = Math.min(265, Math.max(y + 10, 255));
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(`Rapport financier généré électroniquement par ACOM Technologie. Établissement : ${merchant.name}`, 105, y, { align: 'center' });

      doc.save(`rapport_financier_${merchant.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`);
      toast.success('Rapport exporté sous format PDF !');
    } catch (error) {
      console.error(error);
      toast.error('Échec de la génération du PDF.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-ink tracking-tight">Rapports Financiers</h2>
          <p className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Analyse de performance et rentabilité</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="px-5 py-2.5 bg-white border border-black/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <BarChart3 className="w-3 h-3" />
            Exporter CSV
          </button>
          <button 
            onClick={exportToPDF}
            className="px-5 py-2.5 bg-ink text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-primary" />
            Rapport PDF
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <ReportKPI cardColor="primary" label="Ventes Totales" value={financialSummary.totalRevenue} currency={merchant.currency} icon={DollarSign} />
        <ReportKPI cardColor="emerald" label="Total Encaissé" value={financialSummary.totalCollected} currency={merchant.currency} icon={CheckCircle} />
        <ReportKPI cardColor="amber" label="Reste à Recouvrer" value={financialSummary.totalPending} currency={merchant.currency} icon={Clock} />
        <ReportKPI cardColor="orange" label="Coût d'Achat" value={financialSummary.totalCOGS || 0} currency={merchant.currency} icon={ShoppingCart} />
        <ReportKPI cardColor="rose" label="Total Dépenses" value={financialSummary.totalExpenses} currency={merchant.currency} icon={TrendingDown} />
        <ReportKPI cardColor="blue" label="Bénéfice Net" value={financialSummary.netProfit} currency={merchant.currency} icon={TrendingUp} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-ink uppercase tracking-widest text-xs">Évolution Mensuelle</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Revenus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Dépenses</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
               <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ff0000" stopOpacity={0.1}/>
                     <stop offset="95%" stopColor="#ff0000" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#9ca3af'}} dy={10} />
                 <YAxis hide />
                 <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                 <Area type="monotone" dataKey="Revenus" stroke="#ff0000" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                 <Area type="monotone" dataKey="Dépenses" stroke="#fb7185" strokeWidth={4} fill="transparent" />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-ink p-8 rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
             <BarChart3 className="w-32 h-32 text-white" />
          </div>
          <div className="relative">
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8">Part des Dépenses</h3>
            <div className="space-y-6">
              {categoryData.length === 0 ? (
                <p className="text-white/40 text-[10px] uppercase font-bold italic text-center py-12">Aucune catégorie de dépense</p>
              ) : (
                categoryData.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-[10px] uppercase font-black">
                      <span className="text-white/60">{cat.name}</span>
                      <span className="text-white">{cat.percentage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        className={`h-full ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-purple-400' : 'bg-rose-400'}`} 
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/5">
              <p className="text-[9px] text-white/40 uppercase font-black mb-1 tracking-widest text-center">Optimisation suggérée</p>
              <p className="text-white text-[11px] font-medium text-center leading-relaxed antialiased">
                {categoryData[0] ? (
                  <>Vos dépenses en <span className="text-primary font-bold">{categoryData[0].name}</span> représentent le poste le plus important. Un audit est conseillé.</>
                ) : (
                  "Capturez davantage de dépenses pour obtenir des conseils personnalisés."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ReportKPI = ({ label, value, currency, suffix, icon: Icon, trend, cardColor }: any) => {
  const colors: any = {
    primary: 'bg-primary/10 text-primary border-primary/10',
    rose: 'bg-rose-50 text-rose-500 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    amber: 'bg-amber-50 text-amber-500 border-amber-100',
    orange: 'bg-orange-50 text-orange-500 border-orange-100',
  };

  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[cardColor] || 'bg-gray-50'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">
           {trend}
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest">{label}</h4>
        <div className="flex items-baseline mt-1.5">
          <span className="text-2xl font-black text-ink">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          <span className="text-[10px] font-mono font-bold text-gray-400 ml-1.5 uppercase">{suffix || currency}</span>
        </div>
      </div>
    </div>
  );
};

// --- Merchant Quote Modal ---
const QuoteModal = ({ isOpen, onClose, merchant, quote }: { isOpen: boolean, onClose: () => void, merchant: Merchant, quote?: MerchantQuote | null }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<MerchantQuoteItem[]>([]);
  const [notes, setNotes] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quote) {
      setCustomerName(quote.customerName || '');
      setCustomerPhone(quote.customerPhone || '');
      setCustomerEmail(quote.customerEmail || '');
      setCustomerAddress(quote.customerAddress || '');
      setItems(quote.items || []);
      setNotes(quote.notes || '');
      // Calculate expiry days from validUntil
      const expiry = quote.validUntil?.seconds ? new Date(quote.validUntil.seconds * 1000) : new Date(quote.validUntil);
      const diff = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      setExpiryDays(diff > 0 ? diff : 30);
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setItems([]);
      setNotes('');
      setExpiryDays(30);
    }
  }, [quote, isOpen]);

  const products = useLiveQuery(() => db.products.where('merchantId').equals(merchant.id).toArray(), [merchant.id]) || [];

  const addItem = (product?: MerchantProduct) => {
    if (product) {
      setItems([...items, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.price, 
        total: product.price,
        sizes: product.sizes || '',
        colors: product.colors || ''
      }]);
    } else {
      setItems([...items, { name: '', quantity: 1, price: 0, total: 0, sizes: '', colors: '' }]);
    }
  };

  const updateItem = (index: number, updates: Partial<MerchantQuoteItem>) => {
    const newItems = [...items];
    const item = { ...newItems[index], ...updates };
    item.total = (item.quantity || 0) * (item.price || 0);
    newItems[index] = item;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((acc, item) => acc + item.total, 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !customerName) {
      toast.error('Veuillez remplir les informations obligatoires');
      return;
    }

    setIsSaving(true);
    try {
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + expiryDays);

      if (quote) {
        await db.quotes.update(quote.id, {
          items,
          totalAmount: total,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          validUntil,
          notes,
          updatedAt: new Date()
        });
        toast.success('Devis mis à jour');
      } else {
        await billingService.createQuote({
          merchantId: merchant.id,
          items,
          totalAmount: total,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          validUntil,
          notes,
          status: 'draft',
          processedBy: merchant.ownerId
        });
        toast.success('Devis enregistré');
      }

      onClose();
      setCustomerName('');
      setCustomerPhone('');
      setItems([]);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black text-ink">Nouveau Devis</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Créez une proposition commerciale</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Informations Client</h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nom / Entreprise *</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Téléphone</label>
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Validité (Jours)</label>
                     <input 
                       type="number" 
                       value={expiryDays}
                       onChange={e => setExpiryDays(parseInt(e.target.value))}
                       className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none"
                     />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Détails Expédition (Optionnel)</h4>
               <textarea 
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full h-[120px] px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/30 transition-all font-bold text-sm outline-none resize-none"
                  placeholder="Adresse complète du client..."
               />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Articles du Devis</h4>
              <div className="flex gap-2">
                <select 
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value);
                    if (p) addItem(p);
                    e.target.value = "";
                  }}
                  className="px-4 py-2 bg-gray-100 rounded-xl text-[10px] font-bold outline-none border-none cursor-pointer"
                >
                  <option value="">+ Ajouter un produit</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.price} {merchant.currency}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => addItem()}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                >
                  + Manuel
                </button>
              </div>
            </div>

            <div className="space-y-3">
               {items.map((item, idx) => (
                 <div key={idx} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:border-primary/20">
                    <div className="flex flex-wrap md:flex-nowrap gap-3 items-end">
                      <div className="flex-1 min-w-[200px] space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Désignation</label>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={e => updateItem(idx, { name: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl text-xs font-bold font-mono outline-none focus:border-primary/50"
                          placeholder="Nom de l'article"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Qté</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl text-xs font-black font-mono outline-none text-center"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Prix Unitaire</label>
                        <input 
                          type="text" 
                          value={item.price === 0 ? '' : item.price}
                          onChange={e => updateItem(idx, { price: parseFloat(e.target.value.replace(/\D/g, '')) || 0 })}
                          className="w-full px-4 py-3 bg-white border border-black/5 rounded-xl text-xs font-black font-mono outline-none text-right"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <label className="text-[8px] font-black uppercase tracking-widest text-primary ml-1">Total</label>
                        <div className="w-full px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl text-xs font-black font-mono text-right text-primary">
                          {item.total.toLocaleString()}
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeItem(idx)}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100/50">
                       <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Taille (Optionnel)</label>
                         <input 
                           type="text" 
                           value={item.sizes || ''} 
                           onChange={e => updateItem(idx, { sizes: e.target.value })} 
                           className="w-full px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-semibold font-mono outline-none placeholder:text-gray-300" 
                           placeholder="ex: M, XL, 42"
                         />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 ml-1">Couleur (Optionnel)</label>
                         <input 
                           type="text" 
                           value={item.colors || ''} 
                           onChange={e => updateItem(idx, { colors: e.target.value })} 
                           className="w-full px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-semibold font-mono outline-none placeholder:text-gray-300" 
                           placeholder="ex: Noir, Rouge"
                         />
                       </div>
                    </div>
                 </div>
               ))}
               {items.length === 0 && (
                 <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center text-gray-400">
                    <Package className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Aucun article ajouté</p>
                 </div>
               )}
            </div>
          </div>

          <div className="p-8 bg-ink rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div className="flex-1 w-full">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-3 block">Conditions de règlement & Notes</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 font-medium text-xs outline-none focus:border-primary/50 text-white placeholder-white/20 h-24 resize-none"
                placeholder="Ex: Acompte de 50% à la commande, solde à la livraison..."
              />
            </div>
            <div className="text-right shrink-0 min-w-[200px]">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Total Devis Estimé</p>
              <p className="text-5xl font-black">{total.toLocaleString()} <span className="text-lg opacity-40 font-mono">{merchant.currency}</span></p>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-8 py-4 bg-white border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            Annuler
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer le Devis
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Merchant Settings ---
const MerchantSettings = ({ 
  merchant, 
  onUpdate, 
  setActiveTab 
}: { 
  merchant: Merchant, 
  onUpdate: (m: Merchant) => void, 
  setActiveTab: (tab: string) => void 
}) => {
  const [formData, setFormData] = useState(merchant);
  const [saving, setSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportLocalData = async () => {
    setIsExporting(true);
    try {
      const allSales = await db.sales.toArray();
      const allProducts = await db.products.toArray();
      const exportData = {
        sales: allSales,
        products: allProducts,
        exportedAt: new Date().toISOString(),
        merchantId: merchant.id
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studio-acom-backup-${merchant.id}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Données exportées avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'exportation');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Voulez-vous vraiment vider le cache local ? Cela ne supprimera pas vos données sur le Cloud, mais nécessitera une nouvelle synchronisation.')) {
      try {
        await db.sales.clear();
        await db.products.clear();
        await db.expenses.clear();
        localStorage.clear();
        toast.success('Cache vidé. L\'application va redémarrer.');
        window.location.reload();
      } catch (error) {
        toast.error('Erreur lors du nettoyage');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.merchants.save({ ...formData, updatedAt: new Date() } as any);
      onUpdate(formData);
      toast.success('Réglages mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-ink">Gestion des Données Locales</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Données stockées sur cet appareil</p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Database className="w-7 h-7 text-emerald-600" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-emerald-50/30 rounded-[2rem] p-8 border border-emerald-100/50">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-emerald-100">
                <HardDrive className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-ink uppercase tracking-wider">Mode Local-First (Optimisé)</h4>
                <p className="text-xs text-emerald-800/70 mt-2 leading-relaxed">
                  Studio Acom enregistre automatiquement chaque transaction dans la mémoire locale (IndexedDB) de votre ordinateur. 
                  Cela garantit une rapidité maximale et vous permet de travailler <b>sans limites de quota Cloud</b> même avec une connexion lente.
                </p>
                
                {merchant.licenseType === 'local' ? (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wide">
                      Mode "Local Uniquement" activé. La synchronisation Cloud est désactivée.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3">
                    <Database className="w-4 h-4 text-blue-600" />
                    <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wide">
                      Synchronisation Cloud activée. Vos données sont sauvegardées en temps réel.
                    </p>
                  </div>
                )}
                
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="bg-white/80 backdrop-blur px-5 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Statut</p>
                      <p className="text-[11px] font-bold text-ink">Données sécurisées localement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-gray-50 rounded-[2rem] border border-black/5">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Exportation Critique</h5>
              <p className="text-xs text-gray-500 mb-4">Exportez vos données locales en format JSON pour une sauvegarde manuelle.</p>
              <button 
                onClick={handleExportLocalData}
                disabled={isExporting}
                className="w-full py-4 bg-white border border-black/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-primary/30 transition-all disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Exporter la Base Locale'}
              </button>
            </div>
            <div className="p-6 bg-rose-50/30 rounded-[2rem] border border-rose-100">
              <h5 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Sécurité Système</h5>
              <p className="text-xs text-rose-800/60 mb-4">Effacer le cache local peut résoudre certains problèmes de synchronisation.</p>
              <button 
                onClick={handleClearCache}
                className="w-full py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
              >
                Vider le Cache (Attention)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-ink">Version Bureau & Desktop</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Installer l'application sur votre ordinateur</p>
          </div>
          <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
            <Printer className="w-7 h-7 text-primary" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-[2rem] p-8 border border-black/5">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center border border-black/5">
              <Download className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <h4 className="text-lg font-black text-ink">Installation Instantanée</h4>
              <p className="text-sm text-gray-500 leading-relaxed">
                Vous pouvez installer Studio Acom directement sur votre PC ou Mac. Cela permet un accès plus rapide via une icône sur votre bureau et une meilleure expérience de gestion.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  onClick={() => setActiveTab('build')}
                  className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  <span>Obtenir l'App Desktop</span>
                </button>
                <div className="flex items-center text-[9px] font-black text-gray-400 uppercase tracking-widest bg-white px-4 py-2.5 rounded-xl border border-black/5">
                  <CheckCircle className="w-3 h-3 mr-2 text-emerald-500" />
                  Compatible Windows / MacOS / Linux
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-black/5 shadow-xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-black text-ink">Réglages Business</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Configuration de l'identité commerciale</p>
          </div>
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center border border-black/5">
            <Settings className="w-7 h-7 text-gray-300" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Type de SaaS</p>
                <p className="font-black text-ink capitalize text-lg">{merchant.type}</p>
              </div>
            </div>
            <div className="flex items-center text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest">
              <AlertCircle className="w-3 h-3 mr-1.5" />
              Fixe
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Forfait Actuel</p>
                <p className="font-black text-ink text-lg">{merchant.plan || 'FREE'}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="text-[9px] font-black text-primary hover:bg-primary hover:text-white transition-all bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest"
            >
              Améliorer
            </button>
          </div>
          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                {formData.licenseType === 'cloud' ? <Database className="w-6 h-6 text-blue-500" /> : <HardDrive className="w-6 h-6 text-emerald-500" />}
              </div>
              <div>
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Type de Licence</p>
                <select 
                  value={formData.licenseType || 'cloud'}
                  onChange={(e) => setFormData({ ...formData, licenseType: e.target.value as any })}
                  className="font-black text-ink bg-transparent border-none p-0 focus:ring-0 text-lg cursor-pointer"
                >
                  <option value="cloud">FORFAIT CLOUD (SYNC)</option>
                  <option value="local">FORFAIT LOCAL (DESKTOP)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Nom de l'organisation</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-bold text-lg" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Logo de l'entreprise</label>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden bg-white shrink-0 shadow-sm relative group">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <Store className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          alert("Le fichier est trop volumineux (max 2MB)");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({...formData, logo: reader.result as string});
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold shadow-sm uppercase tracking-widest hover:border-primary/50 transition-all text-gray-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Changer le logo
                  </label>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Format JPG, PNG ou WEBP. Le logo apparaîtra sur vos devis et factures.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Téléphone Professionnel</label>
              <input type="tel" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-mono font-bold" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Email de Contact</label>
              <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-bold" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Adresse Physique</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 font-medium" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Description / Slogan</label>
              <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-4 focus:ring-primary/10 bg-gray-50/30 resize-none font-medium leading-relaxed" placeholder="Décrivez votre activité en quelques mots..." />
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full py-5 bg-ink text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center shadow-2xl shadow-black/20 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-3" /> Enregistrer les modifications</>}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

// --- Specialized SaaS Managers ---

// 1. Service Manager (Gestion des services)
const ServiceManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentIntervention, setCurrentIntervention] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interventionLimit, setInterventionLimit] = useState(10);

  const interventions = useLiveQuery(() => 
    db.interventions.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('interventionId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('interventionId');
    if (!id) return;
    
    try {
      const item = interventions.find((i:any) => i.id === id);
      if (item && item.status !== status) {
        await dbService.interventions.save({
          ...item,
          status
        });
        toast.success(`Statut mis à jour`);
      }
    } catch(err) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleGenerateInvoice = async (intervention: any) => {
    try {
      setSaving(true);
      const saleData = {
        merchantId: merchant.id,
        items: [{
          productId: `intervention_${intervention.id}`, // Placeholder or a generic service product
          name: intervention.title || intervention.serviceType,
          quantity: 1,
          price: intervention.price
        }],
        totalAmount: intervention.price,
        customerInfo: {
          name: intervention.customerName,
          phone: intervention.customerPhone,
          email: intervention.customerEmail
        },
        paymentMethod: 'invoice', // Marked as awaiting payment
        status: 'pending',
        date: new Date().toISOString()
      };
      await dbService.merchantSales.save(saleData);
      
      // Update the intervention to mark it as billed
      await dbService.interventions.save({
        ...intervention,
        billed: true
      });
      
      toast.success('Facture générée avec succès');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de la génération de la facture');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { id: 'pending', title: 'En Attente', color: 'bg-amber-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200' },
    { id: 'in-progress', title: 'En Cours', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
    { id: 'completed', title: 'Terminé', color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200' },
    { id: 'cancelled', title: 'Annulé', color: 'bg-rose-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600', borderColor: 'border-rose-200' },
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.interventions.save({
        ...currentIntervention,
        merchantId: merchant.id
      });
      toast.success('Intervention enregistrée');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Interventions</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-xs text-gray-400 font-mono uppercase tracking-widest pl-1">Total: {interventions.length.toString().padStart(3, '0')}</p>
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button 
                onClick={() => setViewMode('list')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
              >
                Liste
              </button>
              <button 
                onClick={() => setViewMode('kanban')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
              >
                Kanban
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'calendar' ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}
              >
                Calendrier
              </button>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            setCurrentIntervention({ 
              title: '',
              customerName: '', 
              customerPhone: '',
              customerEmail: '',
              serviceType: '', 
              description: '',
              status: 'pending', 
              priority: 'normal',
              date: new Date().toISOString().split('T')[0], 
              time: '09:00',
              address: '',
              assignedTo: '',
              price: 0 
            });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Intervention</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'En attente', value: interventions.filter((i:any) => i.status === 'pending').length, color: 'text-amber-600', bgColor: 'bg-amber-50' },
              { label: 'En cours', value: interventions.filter((i:any) => i.status === 'in-progress').length, color: 'text-blue-600', bgColor: 'bg-blue-50' },
              { label: 'CA Potentiel', value: interventions.filter((i:any) => i.status !== 'cancelled').reduce((acc: number, i:any) => acc + (Number(i.price) || 0), 0).toLocaleString() + ' ' + merchant.currency, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
              { label: 'Terminés', value: interventions.filter((i:any) => i.status === 'completed').length, color: 'text-purple-600', bgColor: 'bg-purple-50' }
            ].map((kpi, idx) => (
              <div key={idx} className={`${kpi.bgColor} p-4 rounded-2xl flex flex-col justify-center`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{kpi.label}</p>
                <p className={`text-xl font-black ${kpi.color} mt-1`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {viewMode === 'list' ? (
            <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Intervention / Client</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Planification</th>
                  <th className="px-8 py-5">Statut & Priorité</th>
                  <th className="px-8 py-5 text-right">Montant TTC</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {interventions.slice(0, interventionLimit).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                          <Wrench className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-black text-ink text-sm leading-tight truncate" title={item.title || item.serviceType}>{item.title || item.serviceType || 'Intervention'}</span>
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5 truncate" title={item.customerName}>{item.customerName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        {item.customerPhone ? <span className="font-bold text-ink text-xs">{item.customerPhone}</span> : <span className="text-gray-300 text-xs">-</span>}
                        {item.customerEmail && <span className="text-[10px] text-gray-400 truncate">{item.customerEmail}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">{item.date}</span>
                        {item.time && <span className="text-[10px] text-gray-400 font-mono mt-0.5">{item.time}</span>}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          item.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          item.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          item.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {item.status === 'pending' ? 'EN ATTENTE' : item.status === 'in-progress' ? 'EN COURS' : item.status === 'cancelled' ? 'ANNULÉ' : 'TERMINÉ'}
                        </span>
                        {item.priority && item.priority !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                            item.priority === 'urgent' ? 'bg-rose-500 text-white' : 
                            item.priority === 'high' ? 'bg-orange-100 text-orange-600' : 
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {item.priority === 'urgent' ? 'URGENT' : item.priority === 'high' ? 'HAUTE PRIORITÉ' : 'BASSE'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-mono font-black text-ink text-sm">
                        {Number(item.price || 0).toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentIntervention(item); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {interventions.length > interventionLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setInterventionLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar">
          {columns.map((col) => {
            const columnItems = interventions.filter((item:any) => item.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`flex-shrink-0 w-80 flex flex-col rounded-3xl ${col.bgColor} border ${col.borderColor} snap-start`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="p-5 border-b border-black/5 flex justify-between items-center bg-white/50 rounded-t-3xl backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.color}`} />
                    <h3 className={`font-black text-sm uppercase tracking-widest ${col.textColor}`}>{col.title}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded-lg border border-black/5 text-gray-500 shadow-sm">{columnItems.length}</span>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto space-y-4 min-h-[500px]">
                  {columnItems.map((item: any) => (
                    <div 
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0 pr-2">
                          <h4 className="font-bold text-ink text-sm leading-tight truncate" title={item.title || item.serviceType}>{item.title || item.serviceType || 'Intervention'}</h4>
                          <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1 truncate" title={item.customerName}>{item.customerName}</p>
                        </div>
                        <button 
                          onClick={() => { setCurrentIntervention(item); setIsEditing(true); }}
                          className="p-1.5 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
                          <span className="font-mono">{item.date} {item.time && `- ${item.time}`}</span>
                        </div>
                        {item.address && (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                            <MapPin className="w-3.5 h-3.5 mr-2 text-primary flex-shrink-0" />
                            <span className="truncate">{item.address}</span>
                          </div>
                        )}
                        {item.assignedTo && (
                          <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
                            <User className="w-3.5 h-3.5 mr-2 text-primary" />
                            <span className="truncate">{item.assignedTo}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex flex-col gap-1">
                          {item.priority && item.priority !== 'normal' ? (
                            <span className={`px-2 py-0.5 w-fit rounded text-[9px] font-bold uppercase tracking-widest ${
                              item.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                              item.priority === 'high' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {item.priority === 'urgent' ? 'URGENT' : item.priority === 'high' ? 'HAUTE PRIORITÉ' : 'BASSE'}
                            </span>
                          ) : (
                            <div />
                          )}
                          {item.billed && (
                             <span className="px-2 py-0.5 w-fit rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center">
                               <FileText className="w-2.5 h-2.5 mr-1" />
                               Facturé
                             </span>
                          )}
                        </div>
                        <span className="font-mono font-black text-ink text-sm">
                          {Number(item.price || 0).toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  {columnItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-black/5 rounded-2xl">
                      <p className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Glisser ici</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg text-ink capitalize">{format(currentDate, 'MMMM yyyy', { locale: fr })}</h3>
            <div className="flex space-x-2">
              <button onClick={() => setCurrentDate(subDays(currentDate, 30))} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100">&lt;</button>
              <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold hover:bg-gray-100">Aujourd'hui</button>
              <button onClick={() => setCurrentDate(addDays(currentDate, 30))} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100">&gt;</button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="bg-gray-50 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                {day}
              </div>
            ))}
            
            {eachDayOfInterval({ start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 }) }).map((day, idx) => {
              const dayInterventions = interventions.filter((i:any) => i.date === format(day, 'yyyy-MM-dd'));
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={idx} className={`bg-white min-h-[120px] p-2 ${!isCurrentMonth ? 'opacity-50 bg-gray-50/50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayInterventions.map((item:any) => (
                      <div 
                        key={item.id} 
                        onClick={() => { setCurrentIntervention(item); setIsEditing(true); }}
                        className={`text-[9px] p-1.5 rounded-md cursor-pointer truncate font-bold ${
                          item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                          item.status === 'in-progress' ? 'bg-blue-50 text-blue-600' : 
                          item.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}
                        title={item.title || item.serviceType}
                      >
                        {item.time && <span className="mr-1 opacity-60">{item.time}</span>}
                        {item.title || item.serviceType}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails de l'Intervention</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Configuration technique du service</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Titre de l'intervention</label>
                  <input type="text" required value={currentIntervention.title || ''} onChange={e => setCurrentIntervention({...currentIntervention, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="Ex: Maintenance annuelle climatisation" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de Service</label>
                  <input type="text" list="service-types" required value={currentIntervention.serviceType} onChange={e => setCurrentIntervention({...currentIntervention, serviceType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                  <datalist id="service-types">
                    {Array.from(new Set(interventions.map((i:any) => i.serviceType).filter(Boolean))).map(type => (
                      <option key={type as string} value={type as string} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Assigné à (Intervenant)</label>
                  <input type="text" value={currentIntervention.assignedTo || ''} onChange={e => setCurrentIntervention({...currentIntervention, assignedTo: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="Nom du technicien/employé" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Description / Notes techniques</label>
                  <textarea rows={3} value={currentIntervention.description || ''} onChange={e => setCurrentIntervention({...currentIntervention, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm resize-none" placeholder="Détails de l'intervention, pièces requises, etc." />
                </div>
              </div>

              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-ink mb-4">Informations Client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Client</label>
                    <input type="text" required value={currentIntervention.customerName} onChange={e => setCurrentIntervention({...currentIntervention, customerName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone Client</label>
                    <input type="tel" value={currentIntervention.customerPhone || ''} onChange={e => setCurrentIntervention({...currentIntervention, customerPhone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email Client</label>
                    <input type="email" value={currentIntervention.customerEmail || ''} onChange={e => setCurrentIntervention({...currentIntervention, customerEmail: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Lieu d'intervention</label>
                    <input type="text" value={currentIntervention.address || ''} onChange={e => setCurrentIntervention({...currentIntervention, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-white outline-none focus:ring-2 focus:ring-primary/20 bg-white" placeholder="Adresse complète" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'intervention</label>
                  <input type="date" required value={currentIntervention.date} onChange={e => setCurrentIntervention({...currentIntervention, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Heure prévue</label>
                  <input type="time" value={currentIntervention.time || ''} onChange={e => setCurrentIntervention({...currentIntervention, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Montant de la prestation</label>
                  <div className="relative">
                    <input type="text" required value={currentIntervention.price === 0 ? '' : currentIntervention.price} onChange={e => setCurrentIntervention({...currentIntervention, price: Number(e.target.value.replace(/\D/g, ''))})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut de l'intervention</label>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'in-progress', 'completed', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setCurrentIntervention({...currentIntervention, status})}
                        className={`flex-1 min-w-[100px] py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          currentIntervention.status === status 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {status === 'pending' ? 'En attente' : status === 'in-progress' ? 'En cours' : status === 'completed' ? 'Terminé' : 'Annulé'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Priorité</label>
                  <div className="flex gap-2">
                    {['low', 'normal', 'high', 'urgent'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setCurrentIntervention({...currentIntervention, priority})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          currentIntervention.priority === priority 
                            ? (priority === 'urgent' ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' : priority === 'high' ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-ink text-white border-ink shadow-lg shadow-black/20')
                            : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        {priority === 'low' ? 'Basse' : priority === 'normal' ? 'Normale' : priority === 'high' ? 'Haute' : 'Urgente'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              
              {currentIntervention.id && currentIntervention.status === 'completed' && !currentIntervention.billed && (
                <button type="button" onClick={() => handleGenerateInvoice(currentIntervention)} disabled={saving} className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Facturer
                </button>
              )}

              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 2. Project Manager (Gestion de chantier)
const ProjectManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [projectLimit, setProjectLimit] = useState(10);

  const projects = useLiveQuery(() => 
    db.projects.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.projects.save({
        ...currentProject,
        merchantId: merchant.id
      });
      toast.success('Projet enregistré');
      setIsEditing(false);
      if (selectedProject?.id === currentProject.id) {
        setSelectedProject({ ...currentProject, merchantId: merchant.id });
      }
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await db.projects.delete(id);
      toast.success('Projet supprimé');
      setDeleteConfirm(null);
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddTask = async (columnId: string) => {
    const title = prompt('Titre de la tâche:');
    if (!title) return;
    const newTask = { id: uuidv4(), title, status: columnId, createdAt: Date.now() };
    const tasks = selectedProject.tasks || [];
    const updatedProject = { ...selectedProject, tasks: [...tasks, newTask] };
    setCurrentProject(updatedProject);
    setSaving(true);
    try {
      await dbService.projects.save(updatedProject);
      setSelectedProject(updatedProject);
    } catch (e) {
      toast.error('Erreur');
    } finally {
      setSaving(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!selectedProject?.tasks) return;
    const updatedTasks = selectedProject.tasks.map((t:any) => t.id === taskId ? { ...t, status: newStatus } : t);
    const updatedProject = { ...selectedProject, tasks: updatedTasks };
    setSelectedProject(updatedProject);
    await dbService.projects.save(updatedProject);
  };

  if (selectedProject) {
    const project = projects.find(p => p.id === selectedProject.id) || selectedProject;
    const tasks = project.tasks || [];
    const columns = [
      { id: 'todo', title: 'À Faire', color: 'bg-amber-50', textColor: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-200' },
      { id: 'doing', title: 'En Cours', color: 'bg-blue-50', textColor: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' },
      { id: 'done', title: 'Terminé', color: 'bg-emerald-50', textColor: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-200' }
    ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
          <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ArrowRight className="w-5 h-5 text-gray-500 rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-ink">{project.name}</h2>
            <div className="flex gap-4 text-xs font-mono text-gray-400 mt-1">
              <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {project.location}</span>
              <span className="flex items-center"><Banknote className="w-3 h-3 mr-1" /> {Number(project.budget || 0).toLocaleString()} {merchant.currency}</span>
            </div>
          </div>
          <button onClick={() => { setCurrentProject(project); setIsEditing(true); }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors">
            Modifier
          </button>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar min-h-[500px]">
          {columns.map(col => {
            const columnTasks = tasks.filter((t:any) => t.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`flex-shrink-0 w-80 flex flex-col rounded-3xl ${col.color} border ${col.border} snap-start`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const taskId = e.dataTransfer.getData('taskId');
                  if (taskId) updateTaskStatus(taskId, col.id);
                }}
              >
                <div className="p-5 border-b border-black/5 flex justify-between items-center bg-white/50 rounded-t-3xl backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                    <h3 className={`font-black text-sm uppercase tracking-widest ${col.textColor}`}>{col.title}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-white rounded-lg opacity-70">{columnTasks.length}</span>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                  {columnTasks.map((task:any) => (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                      className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
                    >
                      <p className="font-bold text-sm text-ink">{task.title}</p>
                      <button onClick={async () => {
                        const updatedTasks = tasks.filter((t:any) => t.id !== task.id);
                        const updatedProject = { ...project, tasks: updatedTasks };
                        await dbService.projects.save(updatedProject);
                      }} className="mt-2 text-xs text-rose-500 hover:underline">Supprimer</button>
                    </div>
                  ))}
                  <button onClick={() => handleAddTask(col.id)} className={`w-full py-3 rounded-xl border-2 border-dashed ${col.border} text-xs font-bold text-gray-500 hover:bg-white/50 transition-colors flex items-center justify-center gap-2`}>
                    <Plus className="w-3.5 h-3.5" /> Nouvelle Tâche
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Chantiers</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Projets actifs: {projects.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentProject({ name: '', location: '', status: 'planned', budget: 0, startDate: '', endDate: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.slice(0, projectLimit).map((project: any) => (
              <div 
                key={project.id} 
                onClick={() => setSelectedProject(project)}
                className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-2xl transition-all group/card relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover/card:scale-110 transition-transform"></div>
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover/card:scale-110 transition-transform">
                    <HardHat className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover/card:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); setCurrentProject(project); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }} className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl border border-transparent hover:border-rose-200 transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-ink mb-2 leading-tight relative z-10 tracking-tight">{project.name}</h3>
                <div className="flex items-center text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mb-8 relative z-10">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-primary" /> 
                  {project.location}
                </div>
                
                <div className="flex justify-between items-center pt-8 border-t border-dashed border-gray-100 relative z-10">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                    project.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    project.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                    {project.status === 'planned' ? 'PLANIFIÉ' : project.status === 'active' ? 'EN COURS' : project.status === 'on-hold' ? 'EN PAUSE' : 'TERMINÉ'}
                  </span>
                  <div className="text-right">
                    <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Budget</p>
                    <p className="font-black text-xl text-ink tracking-tighter">
                      {project.budget.toLocaleString()} 
                      <span className="text-[10px] text-gray-400 font-mono ml-1 uppercase">{merchant.currency}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {projects.length > projectLimit && (
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => setProjectLimit(prev => prev + 10)}
                className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Voir plus
              </button>
            </div>
          )}
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails du Projet</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion de chantier BTP</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Projet</label>
                  <input type="text" required value={currentProject.name} onChange={e => setCurrentProject({...currentProject, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Localisation</label>
                  <input type="text" required value={currentProject.location} onChange={e => setCurrentProject({...currentProject, location: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Budget Prévisionnel</label>
                  <div className="relative">
                    <input type="number" required value={currentProject.budget} onChange={e => setCurrentProject({...currentProject, budget: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut du Projet</label>
                  <select value={currentProject.status} onChange={e => setCurrentProject({...currentProject, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="planned">Planifié</option>
                    <option value="active">En cours</option>
                    <option value="on-hold">En pause</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le projet'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le projet ?</h3>
              <p className="text-sm text-gray-500 mb-6">Cette action est irréversible.</p>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} disabled={saving} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 3. Fleet Manager (Gestion de transport et de flotte)
const FleetManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [vehicleLimit, setVehicleLimit] = useState(10);

  const vehicles = useLiveQuery(() => 
    db.vehicles.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.vehicles.save({
        ...currentVehicle,
        merchantId: merchant.id
      });
      toast.success('Véhicule enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion de la Flotte</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Véhicules: {vehicles.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentVehicle({ plateNumber: '', model: '', type: 'car', status: 'active', lastMaintenance: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Véhicule</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Véhicule / Plaque</th>
                  <th className="px-8 py-5">Modèle / Type</th>
                  <th className="px-8 py-5">Dernier Entretien</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.slice(0, vehicleLimit).map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-ink bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 inline-block w-fit text-sm shadow-sm tracking-widest">
                          {v.plateNumber}
                        </span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-2">ID: {v.id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink leading-tight">{v.model}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{v.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-gray-400 uppercase">{v.lastMaintenance || '---'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                        v.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        v.status === 'maintenance' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {v.status === 'active' ? 'DISPONIBLE' : v.status === 'maintenance' ? 'MAINTENANCE' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentVehicle(v); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vehicles.length > vehicleLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setVehicleLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Fiche Véhicule</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion de la flotte logistique</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Immatriculation</label>
                  <input type="text" required value={currentVehicle.plateNumber} onChange={e => setCurrentVehicle({...currentVehicle, plateNumber: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" placeholder="AA-000-AA" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Modèle / Marque</label>
                  <input type="text" required value={currentVehicle.model} onChange={e => setCurrentVehicle({...currentVehicle, model: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de véhicule</label>
                  <select value={currentVehicle.type} onChange={e => setCurrentVehicle({...currentVehicle, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="car">Voiture</option>
                    <option value="truck">Camion</option>
                    <option value="van">Van</option>
                    <option value="motorcycle">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du dernier entretien</label>
                  <input type="date" required value={currentVehicle.lastMaintenance} onChange={e => setCurrentVehicle({...currentVehicle, lastMaintenance: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut opérationnel</label>
                <div className="flex gap-4">
                  {['active', 'maintenance', 'inactive'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentVehicle({...currentVehicle, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentVehicle.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Actif' : status === 'maintenance' ? 'Maintenance' : 'Inactif'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le véhicule'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 4. HR Manager (Gestion des ressources humaines)
const HRManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [employeeLimit, setEmployeeLimit] = useState(10);

  const employees = useLiveQuery(() => 
    db.employees.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.employees.save({
        ...currentEmployee,
        merchantId: merchant.id
      });
      toast.success('Employé enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion du Personnel</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Effectif total: {employees.length.toString().padStart(2, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentEmployee({ firstName: '', lastName: '', position: '', department: '', salary: 0, hireDate: new Date().toISOString().split('T')[0], status: 'active', email: '', phone: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Employé</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Collaborateur</th>
                  <th className="px-8 py-5">Poste / Dept</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Embauche</th>
                  <th className="px-8 py-5 text-right">Salaire Mensuel</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.slice(0, employeeLimit).map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-5">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-sm border border-primary/10 group-hover:scale-110 transition-transform">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-ink text-base leading-tight">{emp.firstName} {emp.lastName}</span>
                          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${emp.status === 'active' ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {emp.status === 'active' ? 'EN POSTE' : emp.status === 'on_leave' ? 'EN CONGÉ' : 'SORTI'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ink leading-tight">{emp.position}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mt-1">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1.5">
                        <span className="flex items-center text-[10px] font-black text-ink tracking-tight"><Mail className="w-3 h-3 mr-2 opacity-40 text-primary" /> {emp.email || '---'}</span>
                        <span className="flex items-center text-[10px] font-black text-ink tracking-tight"><Phone className="w-3 h-3 mr-2 opacity-40 text-primary" /> {emp.phone || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-black text-gray-400 uppercase">{emp.hireDate}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="font-mono font-black text-ink text-sm">
                        {emp.salary.toLocaleString()} <span className="text-[10px] opacity-60 font-mono">{merchant.currency}</span>
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentEmployee(emp); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length > employeeLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setEmployeeLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Fiche Collaborateur</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Gestion des ressources humaines</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentEmployee.firstName} onChange={e => setCurrentEmployee({...currentEmployee, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentEmployee.lastName} onChange={e => setCurrentEmployee({...currentEmployee, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email Professionnel</label>
                  <input type="email" value={currentEmployee.email} onChange={e => setCurrentEmployee({...currentEmployee, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="email@entreprise.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input type="text" value={currentEmployee.phone} onChange={e => setCurrentEmployee({...currentEmployee, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" placeholder="+221 ..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Poste / Fonction</label>
                  <input type="text" required value={currentEmployee.position} onChange={e => setCurrentEmployee({...currentEmployee, position: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Département</label>
                  <select value={currentEmployee.department} onChange={e => setCurrentEmployee({...currentEmployee, department: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Sélectionner...</option>
                    <option value="Direction">Direction</option>
                    <option value="Ventes">Ventes</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Technique">Technique</option>
                    <option value="RH">RH</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Salaire Mensuel</label>
                  <div className="relative">
                    <input type="number" required value={currentEmployee.salary} onChange={e => setCurrentEmployee({...currentEmployee, salary: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'embauche</label>
                  <input type="date" required value={currentEmployee.hireDate} onChange={e => setCurrentEmployee({...currentEmployee, hireDate: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                <div className="flex gap-4">
                  {['active', 'on_leave', 'terminated'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentEmployee({...currentEmployee, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentEmployee.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Actif' : status === 'on_leave' ? 'Congé' : 'Sorti'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le collaborateur'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 5. School Manager (Gestion scolaire)
const SchoolManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [studentLimit, setStudentLimit] = useState(10);

  const students = useLiveQuery(() => 
    db.students.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.students.save({
        ...currentStudent,
        merchantId: merchant.id
      });
      toast.success('Étudiant enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Étudiants</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Effectif: {students.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentStudent({ firstName: '', lastName: '', grade: '', parentContact: '', status: 'active', email: '', phone: '', address: '', birthDate: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvel Étudiant</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Étudiant</th>
                  <th className="px-8 py-5">Classe / Niveau</th>
                  <th className="px-8 py-5">Contact Parent</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.slice(0, studentLimit).map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-black text-sm border border-blue-100 group-hover:scale-110 transition-transform">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm leading-tight">{s.firstName} {s.lastName}</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">MAT: {s.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-200">
                        {s.grade}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center text-[10px] font-black text-ink">
                        <Phone className="w-3 h-3 mr-2 opacity-40 text-primary" /> 
                        {s.parentContact || '---'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        s.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                      }`}>
                        {s.status === 'active' ? 'INSCRIT' : 'INACTIF'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentStudent(s); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length > studentLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setStudentLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails de l'Étudiant</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Dossier académique</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentStudent.firstName} onChange={e => setCurrentStudent({...currentStudent, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentStudent.lastName} onChange={e => setCurrentStudent({...currentStudent, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Classe / Niveau</label>
                  <input type="text" required value={currentStudent.grade} onChange={e => setCurrentStudent({...currentStudent, grade: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="ex: Terminale S" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Contact Parent</label>
                  <input type="text" required value={currentStudent.parentContact} onChange={e => setCurrentStudent({...currentStudent, parentContact: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="+221 ..." />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut d'inscription</label>
                <div className="flex gap-4">
                  {['active', 'inactive'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCurrentStudent({...currentStudent, status})}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        currentStudent.status === status 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                          : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {status === 'active' ? 'Inscrit' : 'Inactif'}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer l\'étudiant'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 6. Medical Manager (Gestion médicale)
const MedicalManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [patientLimit, setPatientLimit] = useState(10);

  const patients = useLiveQuery(() => 
    db.patients.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.patients.save({
        ...currentPatient,
        merchantId: merchant.id
      });
      toast.success('Patient enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Patients</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Dossiers actifs: {patients.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentPatient({ firstName: '', lastName: '', dateOfBirth: '', gender: 'M', bloodType: '', phone: '', email: '', address: '', allergies: '', medicalHistory: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Patient</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Patient</th>
                  <th className="px-8 py-5">Infos Vitales</th>
                  <th className="px-8 py-5">Contact</th>
                  <th className="px-8 py-5">Dernière Visite</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.slice(0, patientLimit).map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 font-black text-sm border border-rose-100 group-hover:scale-110 transition-transform">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm leading-tight">{p.firstName} {p.lastName}</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">REF: {p.id?.substring(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black text-ink uppercase tracking-tighter">{p.gender === 'M' ? 'MASCULIN' : 'FÉMININ'}</span>
                          <span className="text-[10px] font-mono text-gray-400 font-bold">{p.dateOfBirth || '---'}</span>
                        </div>
                        {p.bloodType && (
                          <span className="px-2.5 py-1 bg-rose-600 text-white text-[10px] font-black rounded-lg shadow-sm shadow-rose-200">
                            {p.bloodType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col space-y-1">
                        <span className="flex items-center text-[10px] font-black text-ink"><Phone className="w-3 h-3 mr-1.5 opacity-40 text-primary" /> {p.phone || '---'}</span>
                        <span className="flex items-center text-[10px] font-medium text-gray-500"><Mail className="w-3 h-3 mr-1.5 opacity-40" /> {p.email || '---'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-[11px] font-mono font-bold text-gray-400">
                        {p.updatedAt ? format(new Date(p.updatedAt), 'dd/MM/yyyy') : '---'}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentPatient(p); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {patients.length > patientLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setPatientLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Dossier Médical Patient</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Confidentialité & Suivi médical</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Prénom</label>
                  <input type="text" required value={currentPatient.firstName} onChange={e => setCurrentPatient({...currentPatient, firstName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom</label>
                  <input type="text" required value={currentPatient.lastName} onChange={e => setCurrentPatient({...currentPatient, lastName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date de Naissance</label>
                  <input type="date" required value={currentPatient.dateOfBirth} onChange={e => setCurrentPatient({...currentPatient, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Sexe</label>
                  <select value={currentPatient.gender} onChange={e => setCurrentPatient({...currentPatient, gender: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                    <option value="O">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Groupe Sanguin</label>
                  <select value={currentPatient.bloodType} onChange={e => setCurrentPatient({...currentPatient, bloodType: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="">Inconnu</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Téléphone</label>
                  <input type="text" required value={currentPatient.phone} onChange={e => setCurrentPatient({...currentPatient, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={currentPatient.email} onChange={e => setCurrentPatient({...currentPatient, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Allergies connues</label>
                <textarea value={currentPatient.allergies} onChange={e => setCurrentPatient({...currentPatient, allergies: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-rose-50/30 text-rose-700 text-sm min-h-[60px]" placeholder="Liste des allergies..." />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Antécédents Médicaux</label>
                <textarea value={currentPatient.medicalHistory} onChange={e => setCurrentPatient({...currentPatient, medicalHistory: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm min-h-[100px]" placeholder="Historique des pathologies, chirurgies..." />
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le dossier'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

// 7. Appointment Manager (Gestion des rendez-vous)
const AppointmentManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [appointmentLimit, setAppointmentLimit] = useState(10);

  const appointments = useLiveQuery(() => 
    db.appointments.where('merchantId').equals(merchant.id).reverse().sortBy('updatedAt')
  , [merchant.id]) || [];

  const loading = false;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.appointments.save({
        ...currentAppointment,
        merchantId: merchant.id
      });
      toast.success('Rendez-vous enregistré');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Rendez-vous</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Total: {appointments.length.toString().padStart(3, '0')}</p>
        </div>
        <button 
          onClick={() => {
            setCurrentAppointment({ patientName: '', doctorName: '', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'scheduled', type: 'consultation' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Rendez-vous</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Patient / Client</th>
                  <th className="px-8 py-5">Praticien / Ressource</th>
                  <th className="px-8 py-5">Date & Heure</th>
                  <th className="px-8 py-5">Type</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.slice(0, appointmentLimit).map((app: any) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-ink text-sm leading-tight">{app.patientName}</span>
                        <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">ID: {app.id?.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-[10px] font-black text-primary border border-primary/10">
                          {app.doctorName?.[0]}
                        </div>
                        <span className="text-sm font-black text-ink">{app.doctorName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-mono font-black text-ink uppercase">{app.date}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">à {app.time}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[9px] font-black rounded-full uppercase tracking-widest border border-gray-200">
                        {app.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        app.status === 'scheduled' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {app.status === 'scheduled' ? 'PROGRAMMÉ' : app.status === 'completed' ? 'TERMINÉ' : 'ANNULÉ'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => { setCurrentAppointment(app); setIsEditing(true); }} className="p-2.5 hover:bg-primary/10 text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20"><Edit2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length > appointmentLimit && (
              <div className="p-4 flex justify-center border-t border-gray-100">
                <button 
                  onClick={() => setAppointmentLimit(prev => prev + 10)}
                  className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                >
                  Voir plus
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Détails du Rendez-vous</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Planification & Ressources</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Patient / Client</label>
                  <input type="text" required value={currentAppointment.patientName} onChange={e => setCurrentAppointment({...currentAppointment, patientName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Praticien / Ressource</label>
                  <input type="text" required value={currentAppointment.doctorName} onChange={e => setCurrentAppointment({...currentAppointment, doctorName: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date du rendez-vous</label>
                  <input type="date" required value={currentAppointment.date} onChange={e => setCurrentAppointment({...currentAppointment, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Heure</label>
                  <input type="time" required value={currentAppointment.time} onChange={e => setCurrentAppointment({...currentAppointment, time: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Type de prestation</label>
                  <input type="text" required value={currentAppointment.type} onChange={e => setCurrentAppointment({...currentAppointment, type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" placeholder="ex: Consultation" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut</label>
                  <select value={currentAppointment.status} onChange={e => setCurrentAppointment({...currentAppointment, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="scheduled">Programmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Annulé</option>
                    <option value="no-show">Absent</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le rendez-vous'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default MerchantSaaS;
