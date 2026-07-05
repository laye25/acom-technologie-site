import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Merchant } from '../../../types';
import toast from 'react-hot-toast';

export const pdfFormatNum = (num: number) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return Math.round(num).toLocaleString('fr-FR').replace(/\s/g, ' ');
};

export const saveOrSharePDF = (doc: jsPDF, filename: string, action: 'print' | 'download' = 'download') => {
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
  
  if (action === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
    return;
  }

  if (isMobile) {
    try {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: filename,
          text: 'Document PDF - Acom Technologie'
        })
        .then(() => {
          toast.success('Document sauvegardé / partagé !', { position: 'top-center' });
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.error('Error sharing PDF:', err);
            doc.save(filename);
            toast.success(`Le document PDF "${filename}" a été téléchargé.`, { position: 'top-center' });
          }
        });
        return;
      }
    } catch (e) {
      console.error('Failed mobile sharing, falling back to direct save:', e);
    }
  }

  // Desktop or Mobile fallback
  try {
    doc.save(filename);
    toast.success('Le document PDF a été téléchargé.', { position: 'top-center' });
  } catch (err) {
    console.error('doc.save error:', err);
    toast.error('Une erreur est survenue lors du téléchargement.', { position: 'top-center' });
  }
};

export const printPDF = (doc: jsPDF, filename = 'document.pdf', action: 'print' | 'download' = 'download') => {
  saveOrSharePDF(doc, filename, action);
};

export const printDirectHTML = (merchant: Merchant, type: 'receipt' | 'invoice' | 'unpaid' | 'quote', data: any) => {
  const popup = window.open('', '_blank', 'width=800,height=800');
  if (!popup) {
    toast.error("Veuillez autoriser les fenêtres pop-up pour imprimer directement.");
    return;
  }

  const dateStr = data.createdAt 
    ? format(new Date(data.createdAt.seconds ? data.createdAt.seconds * 1000 : data.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) 
    : format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });

  let html = `
    <html>
      <head>
        <title>Impression ${type.toUpperCase()}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            padding: 10px;
            margin: 0;
            color: #000;
            font-size: 12px;
          }
          .title {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .subtitle {
            text-align: center;
            font-size: 10px;
            margin-bottom: 15px;
            color: #555;
          }
          .info-block {
            margin-bottom: 15px;
            font-size: 11px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          td {
            padding: 4px 0;
          }
          .text-right {
            text-align: right;
          }
          .total-section {
            margin-top: 15px;
            font-weight: bold;
            font-size: 12px;
          }
          .footer {
            text-align: center;
            font-size: 9px;
            margin-top: 25px;
            color: #555;
          }
          
          /* A4 invoice specific styles */
          .a4-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          }
          .a4-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .a4-company-info {
            font-size: 13px;
          }
          .a4-title {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
          }
          .a4-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .a4-panel {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #f3f4f6;
          }
          .a4-table {
            width: 100%;
            margin-bottom: 30px;
          }
          .a4-table th {
            background-color: #4f46e5;
            color: white;
            padding: 10px;
            font-size: 12px;
            text-transform: uppercase;
            border: none;
          }
          .a4-table td {
            padding: 12px 10px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
          }
          .a4-totals {
            margin-left: auto;
            width: 300px;
            font-size: 14px;
          }
          .a4-total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
          }
          .a4-grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #4f46e5;
            border-top: 2px solid #4f46e5;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
  `;

  if (type === 'receipt') {
    html += `
      <div>
        <div class="title">${merchant.name?.toUpperCase() || 'ACOM PARTNER'}</div>
        <div class="subtitle">
          Tél : ${merchant.phone || 'Non spécifié'}<br>
          Adresse : ${merchant.address || 'Non spécifiée'}
        </div>
        <div class="info-block">
          <b>TICKET DE CAISSE</b><br>
          N° : ${data.id?.substring(0, 8).toUpperCase() || 'N/A'}<br>
          Date : ${dateStr}<br>
          Client : ${data.customerName || 'Client Comptant'}<br>
          ${data.customerPhone ? `Tél Client : ${data.customerPhone}<br>` : ''}
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Désignation</th>
              <th class="text-right">P.U.</th>
              <th class="text-right">Qté</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || []).map((item: any) => `
              <tr>
                <td>${item.name || 'Produit'}</td>
                <td class="text-right">${pdfFormatNum(item.price)}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${pdfFormatNum(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="divider"></div>
        <div class="total-section">
          <div style="display: flex; justify-content: space-between;">
            <span>TOTAL :</span>
            <span>${pdfFormatNum(data.totalAmount)} ${merchant.currency || 'FCFA'}</span>
          </div>
          ${data.discount ? `
            <div style="display: flex; justify-content: space-between; color: red;">
              <span>REMISE :</span>
              <span>-${pdfFormatNum(data.discount)} ${merchant.currency || 'FCFA'}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <span>PAYÉ :</span>
            <span>${pdfFormatNum(data.paidAmount || 0)} ${merchant.currency || 'FCFA'}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>RENDU :</span>
            <span>${pdfFormatNum(Math.max(0, (data.paidAmount || 0) - (data.totalAmount - (data.discount || 0))))} ${merchant.currency || 'FCFA'}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="footer">
          Merci pour votre visite !<br>
          Acom Technologie - www.acomtechnologie.com
        </div>
      </div>
    `;
  } else {
    const isQuote = type === 'quote';
    const mainTitle = isQuote ? 'DEVIS PROFORMA' : (type === 'unpaid' ? 'FACTURE IMPAYÉE' : 'FACTURE');
    const accentColor = isQuote ? '#3b82f6' : '#4f46e5';
    const numberLabel = isQuote ? 'N° Devis' : 'N° Facture';
    const clientHeader = isQuote ? 'DESTINATAIRE :' : 'FACTURÉ À :';

    html += `
      <div class="a4-container">
        <div class="a4-header">
          <div class="a4-company-info">
            <h2 style="margin: 0 0 5px 0; color: ${accentColor}; font-size: 20px;">${merchant.name || 'ACOM PARTNER'}</h2>
            <p style="margin: 2px 0;">Adresse : ${merchant.address || 'Non spécifiée'}</p>
            <p style="margin: 2px 0;">Tél : ${merchant.phone || 'Non spécifié'}</p>
            <p style="margin: 2px 0;">Email : ${merchant.email || 'Non spécifié'}</p>
          </div>
          <div style="text-align: right;">
            <div class="a4-title" style="color: ${accentColor};">${mainTitle}</div>
            <p style="margin: 5px 0 2px 0; font-size: 13px;"><b>${numberLabel} :</b> ${data.id?.substring(0, 8).toUpperCase() || 'N/A'}</p>
            <p style="margin: 2px 0; font-size: 13px;"><b>Date :</b> ${dateStr}</p>
            ${isQuote && data.validUntil ? `<p style="margin: 2px 0; font-size: 13px; color: #ef4444;"><b>Valide jusqu'au :</b> ${format(new Date(data.validUntil.seconds ? data.validUntil.seconds * 1000 : data.validUntil), 'dd/MM/yyyy')}</p>` : ''}
            ${!isQuote ? `<p style="margin: 2px 0; font-size: 13px;"><b>Règlement :</b> ${data.paymentMethod === 'cash' ? 'Espèces' : data.paymentMethod === 'mobile_money' ? 'Mobile Money' : 'Multiple'}</p>` : ''}
          </div>
        </div>

        <div class="a4-grid">
          <div class="a4-panel">
            <b style="font-size: 11px; color: #6b7280; text-transform: uppercase;">${clientHeader}</b>
            <h3 style="margin: 5px 0 5px 0; font-size: 16px;">${data.customerName || data.clientName || 'Client Comptant'}</h3>
            <p style="margin: 2px 0; font-size: 13px;">Tél : ${data.customerPhone || data.clientPhone || 'Non spécifié'}</p>
            ${data.customerEmail || data.clientEmail ? `<p style="margin: 2px 0; font-size: 13px;">Email : ${data.customerEmail || data.clientEmail}</p>` : ''}
          </div>
          <div class="a4-panel" style="display: flex; flex-direction: column; justify-content: center;">
            <b style="font-size: 11px; color: #6b7280; text-transform: uppercase;">ÉDITEUR :</b>
            <h3 style="margin: 5px 0 5px 0; font-size: 14px;">${merchant.name}</h3>
            <p style="margin: 2px 0; font-size: 13px;">Portail SaaS Multi-Tenant</p>
          </div>
        </div>

        <table class="a4-table">
          <thead>
            <tr>
              <th style="background-color: ${accentColor};">Désignation</th>
              <th class="text-right" style="background-color: ${accentColor}; width: 120px;">Prix Unit.</th>
              <th class="text-right" style="background-color: ${accentColor}; width: 80px;">Qté</th>
              <th class="text-right" style="background-color: ${accentColor}; width: 120px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(data.items || []).map((item: any) => `
              <tr>
                <td><b>${item.name || 'Produit'}</b></td>
                <td class="text-right">${pdfFormatNum(item.price)} ${merchant.currency || 'FCFA'}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right"><b>${pdfFormatNum(item.total)} ${merchant.currency || 'FCFA'}</b></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="a4-totals">
          <div class="a4-total-row">
            <span>Sous-Total :</span>
            <span>${pdfFormatNum(data.totalAmount)} ${merchant.currency || 'FCFA'}</span>
          </div>
          ${data.discount ? `
            <div class="a4-total-row" style="color: #ef4444;">
              <span>Remise :</span>
              <span>-${pdfFormatNum(data.discount)} ${merchant.currency || 'FCFA'}</span>
            </div>
          ` : ''}
          <div class="a4-total-row a4-grand-total" style="color: ${accentColor}; border-top-color: ${accentColor};">
            <span>TOTAL :</span>
            <span>${pdfFormatNum(data.totalAmount - (data.discount || 0))} ${merchant.currency || 'FCFA'}</span>
          </div>
          ${!isQuote ? `
            <div class="a4-total-row" style="margin-top: 10px; font-size: 13px; color: #10b981;">
              <span>Montant Versé :</span>
              <span>${pdfFormatNum(data.paidAmount || 0)} ${merchant.currency || 'FCFA'}</span>
            </div>
            <div class="a4-total-row" style="font-size: 13px; color: #f59e0b;">
              <span>Solde restant :</span>
              <span>${pdfFormatNum(data.balance || 0)} ${merchant.currency || 'FCFA'}</span>
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af;">
          <div style="border-top: 1px solid #e5e7eb; width: 200px; text-align: center; padding-top: 8px;">
            Signature du destinataire
          </div>
          <div style="border-top: 1px solid #e5e7eb; width: 200px; text-align: center; padding-top: 8px;">
            Signature de l'émetteur
          </div>
        </div>

        <div class="footer" style="margin-top: 100px;">
          Merci de votre confiance !<br>
          Document officiel généré électroniquement par le réseau <b>Acom Technologie</b>.
        </div>
      </div>
    `;
  }

  html += `
      </body>
    </html>
  `;

  popup.document.write(html);
  popup.document.close();
  
  setTimeout(() => {
    popup.print();
  }, 300);
};

export const printDetergentSaleDirect = (merchant: Merchant, sale: any, format?: string, downloadFn?: any) => {
  printDirectHTML(merchant, 'invoice', sale);
};

export const printDetergentQuoteDirect = (merchant: Merchant, quote: any, format?: string) => {
  printDirectHTML(merchant, 'quote', quote);
};

export const printPressingTicketDirect = (merchant: Merchant, ticket: any, printFormat: '58mm' | '80mm' | 'A4', tarifs: any, callback?: any) => {
  const popup = window.open('', '_blank', 'width=800,height=800');
  if (!popup) {
    toast.error("Veuillez autoriser les fenêtres pop-up pour imprimer directement.");
    return;
  }

  const depositDateStr = ticket.depositDate 
    ? format(new Date(ticket.depositDate), 'dd/MM/yyyy HH:mm', { locale: fr }) 
    : format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr });
    
  const deliveryDateStr = ticket.expectedDeliveryDate 
    ? format(new Date(ticket.expectedDeliveryDate), 'dd/MM/yyyy', { locale: fr }) 
    : 'Non spécifiée';

  let html = `
    <html>
      <head>
        <title>Ticket Pressing #${ticket.ticketNumber || ticket.id?.substring(0,6)}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            padding: ${printFormat === 'A4' ? '40px' : '10px'};
            margin: 0;
            color: #000;
            font-size: ${printFormat === 'A4' ? '13px' : '11px'};
            max-width: ${printFormat === 'A4' ? '800px' : printFormat === '80mm' ? '280px' : '200px'};
          }
          .title {
            text-align: center;
            font-weight: bold;
            font-size: ${printFormat === 'A4' ? '22px' : '15px'};
            margin-bottom: 5px;
          }
          .subtitle {
            text-align: center;
            font-size: ${printFormat === 'A4' ? '12px' : '9px'};
            margin-bottom: 15px;
            color: #444;
          }
          .ticket-header {
            text-align: center;
            font-weight: bold;
            font-size: ${printFormat === 'A4' ? '16px' : '12px'};
            margin: 10px 0;
            border: 1px solid #000;
            padding: 5px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            font-size: ${printFormat === 'A4' ? '12px' : '9px'};
          }
          td {
            padding: 3px 0;
            font-size: ${printFormat === 'A4' ? '12px' : '9px'};
          }
          .text-right {
            text-align: right;
          }
          .totals {
            margin-top: 10px;
            font-weight: bold;
          }
          .footer-text {
            text-align: center;
            font-size: 8px;
            margin-top: 20px;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="title">${merchant.name?.toUpperCase() || 'ACOM PRESSING'}</div>
        <div class="subtitle">
          Tél : ${merchant.phone || 'Non spécifié'}<br>
          Adresse : ${merchant.address || 'Non spécifiée'}
        </div>
        
        <div class="ticket-header">
          TICKET DE RÉCEPTION #${ticket.ticketNumber || ticket.id?.substring(0, 6).toUpperCase()}
        </div>

        <div>
          <b>Client :</b> ${ticket.clientName}<br>
          <b>Tél :</b> ${ticket.clientPhone}<br>
          <b>Déposé le :</b> ${depositDateStr}<br>
          <b>Retrait prévu :</b> <span style="font-size: 1.1em; font-weight: bold; text-decoration: underline;">${deliveryDateStr}</span><br>
          <b>Statut Paiement :</b> ${ticket.paymentStatus === 'paid' ? 'PAYÉ' : ticket.paymentStatus === 'partial' ? 'AVANCE PAYÉE' : 'NON PAYÉ'}
        </div>

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th class="text-right">Qté</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
  `;

  if (ticket.billingType === 'poids') {
    html += `
      <tr>
        <td>Service au Poids (${ticket.weightService || 'Standard'})</td>
        <td class="text-right">${ticket.weightKg || 0} Kg</td>
        <td class="text-right">${pdfFormatNum(ticket.subtotal)} ${merchant.currency || 'FCFA'}</td>
      </tr>
    `;
  } else {
    Object.entries(ticket.articles || {}).forEach(([articleKey, qty]) => {
      if (qty && (qty as number) > 0) {
        const itemPrice = tarifs?.articles?.[articleKey] || 0;
        const totalItem = (qty as number) * itemPrice;
        html += `
          <tr>
            <td>${articleKey.charAt(0).toUpperCase() + articleKey.slice(1)}</td>
            <td class="text-right">${qty}</td>
            <td class="text-right">${pdfFormatNum(totalItem)}</td>
          </tr>
        `;
      }
    });
  }

  // Supplements
  const activeSupplements = Object.entries(ticket.supplements || {})
    .filter(([_, active]) => active);
    
  if (activeSupplements.length > 0) {
    html += `
      <tr>
        <td colspan="3" style="font-weight: bold; padding-top: 6px; font-size: 0.95em;">Suppléments :</td>
      </tr>
    `;
    activeSupplements.forEach(([suppKey, _]) => {
      const price = ticket.supplementTarifs?.[suppKey] || tarifs?.supplements?.[suppKey] || 0;
      const label = tarifs?.supplements_labels?.[suppKey] || suppKey;
      html += `
        <tr>
          <td style="padding-left: 10px;">+ ${label}</td>
          <td class="text-right">1</td>
          <td class="text-right">${pdfFormatNum(price)}</td>
        </tr>
      `;
    });
  }

  html += `
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div style="display: flex; justify-content: space-between;">
            <span>Sous-Total :</span>
            <span>${pdfFormatNum(ticket.subtotal + (ticket.supplementTotal || 0))} ${merchant.currency || 'FCFA'}</span>
          </div>
          ${ticket.discount ? `
            <div style="display: flex; justify-content: space-between; color: red;">
              <span>Remise :</span>
              <span>-${pdfFormatNum(ticket.discount)} ${merchant.currency || 'FCFA'}</span>
            </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 1.1em; margin-top: 4px; border-top: 1px solid #000; padding-top: 4px;">
            <span>TOTAL À PAYER :</span>
            <span>${pdfFormatNum(ticket.total)} ${merchant.currency || 'FCFA'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Montant Versé :</span>
            <span>${pdfFormatNum(ticket.amountPaid || ticket.amountPaidAtDeposit || 0)} ${merchant.currency || 'FCFA'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.05em;">
            <span>Reste à payer :</span>
            <span>${pdfFormatNum(Math.max(0, ticket.total - (ticket.amountPaid || ticket.amountPaidAtDeposit || 0)))} ${merchant.currency || 'FCFA'}</span>
          </div>
        </div>

        ${ticket.notes ? `
          <div class="divider"></div>
          <div style="font-size: 9px; font-style: italic;">
            <b>Notes :</b> ${ticket.notes}
          </div>
        ` : ''}

        <div class="divider"></div>
        <div class="footer-text">
          <b>CONDITIONS GÉNÉRALES</b><br>
          SVP vérifiez vos vêtements lors du dépôt et du retrait. Nous ne sommes pas responsables du rétrécissement, de la décoloration des tissus défectueux ou des objets laissés dans les poches. Tout article non réclamé après 90 jours sera liquidé.<br><br>
          Merci pour votre confiance !<br>
          Powered by Acom Technologie (www.acomtechnologie.com)
        </div>
      </body>
    </html>
  `;

  popup.document.write(html);
  popup.document.close();

  setTimeout(() => {
    popup.print();
    if (callback) callback();
  }, 300);
};

export const generateReceiptPDF = (merchant: Merchant, sale: any, action: 'print' | 'download' = 'download') => {
  const width = 80;
  const itemHeight = 6;
  const itemsCount = sale.items?.length || 0;
  const height = 95 + itemsCount * itemHeight;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [width, height]
  });

  const centerText = (text: string, y: number) => {
    const textWidth = doc.getTextWidth(text);
    const x = (width - textWidth) / 2;
    doc.text(text, x, y);
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  centerText(merchant.name?.toUpperCase() || 'ACOM PARTNER', 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  centerText(`Tél : ${merchant.phone || 'Non spécifié'}`, 14);
  centerText(`Adresse : ${merchant.address || 'Non spécifiée'}`, 18);

  doc.setDrawColor(200, 200, 200);
  doc.line(5, 22, 75, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 24, 39);
  centerText('TICKET DE CAISSE', 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(107, 114, 128);
  doc.text(`N° : ${sale.id?.substring(0, 8).toUpperCase() || 'N/A'}`, 5, 32);
  doc.text(`Date : ${sale.createdAt ? format(new Date(sale.createdAt.seconds ? sale.createdAt.seconds * 1000 : sale.createdAt), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm')}`, 5, 36);
  doc.text(`Client : ${sale.customerName || 'Client Comptant'}`, 5, 40);

  doc.line(5, 43, 75, 43);

  // Headers
  doc.setFont('helvetica', 'bold');
  doc.text('Désignation', 5, 47);
  doc.text('Prix', 40, 47);
  doc.text('Qté', 55, 47);
  doc.text('Total', 67, 47);

  doc.line(5, 49, 75, 49);

  // Rows
  let y = 53;
  doc.setFont('helvetica', 'normal');
  (sale.items || []).forEach((item: any) => {
    const name = (item.name || 'Produit').substring(0, 22);
    doc.text(name, 5, y);
    doc.text(pdfFormatNum(item.price), 40, y);
    doc.text(item.quantity?.toString() || '0', 55, y);
    doc.text(pdfFormatNum(item.total), 67, y);
    y += itemHeight;
  });

  doc.line(5, y - 2, 75, y - 2);

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL :', 35, y + 2);
  doc.text(`${pdfFormatNum(sale.totalAmount)} ${merchant.currency || 'FCFA'}`, 55, y + 2);

  if (sale.discount) {
    y += 4;
    doc.text('REMISE :', 35, y + 2);
    doc.text(`- ${pdfFormatNum(sale.discount)}`, 55, y + 2);
  }

  y += 4;
  doc.text('PAYÉ :', 35, y + 2);
  doc.text(`${pdfFormatNum(sale.paidAmount || 0)} ${merchant.currency || 'FCFA'}`, 55, y + 2);

  y += 4;
  doc.text('RENDU :', 35, y + 2);
  doc.text(`${pdfFormatNum(Math.max(0, (sale.paidAmount || 0) - (sale.totalAmount - (sale.discount || 0))))} ${merchant.currency || 'FCFA'}`, 55, y + 2);

  doc.line(5, y + 6, 75, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  centerText('Merci pour votre visite !', y + 10);
  centerText('Acom Technologie - www.acomtechnologie.com', y + 13);

  saveOrSharePDF(doc, `ticket_${sale.id?.substring(0, 8) || Date.now()}.pdf`, action);
};

export const generateA4InvoicePDF = (merchant: Merchant, sale: any, action: 'print' | 'download' = 'download', customType?: 'invoice' | 'unpaid') => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header Decoration
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 8, 'F');

  // Company Initials Icon
  doc.setFillColor(79, 70, 229);
  doc.rect(20, 20, 15, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(merchant.name ? merchant.name.substring(0, 2).toUpperCase() : 'AC', 24, 29);

  // Company Info
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.text(merchant.name || 'Acom Partner', 40, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Adresse : ${merchant.address || 'Non spécifiée'}`, 40, 30);
  doc.text(`Téléphone : ${merchant.phone || 'Non spécifié'}`, 40, 34);
  doc.text(`Email : ${merchant.email || 'Non spécifié'}`, 40, 38);

  // Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(79, 70, 229);
  const title = customType === 'unpaid' ? 'FACTURE IMPAYÉE' : 'FACTURE';
  doc.text(title, 140, 25);

  // Invoice Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`N° Facture : ${sale.id?.substring(0, 8).toUpperCase() || 'N/A'}`, 140, 30);
  
  const createdDate = sale.createdAt 
    ? new Date(sale.createdAt.seconds ? sale.createdAt.seconds * 1000 : sale.createdAt) 
    : new Date();
  doc.text(`Date : ${format(createdDate, 'dd MMMM yyyy', { locale: fr })}`, 140, 34);
  doc.text(`Mode Règlement : ${sale.paymentMethod === 'cash' ? 'Espèces' : sale.paymentMethod === 'mobile_money' ? 'Mobile Money' : sale.paymentMethod === 'card' ? 'Carte Bancaire' : 'Multiple'}`, 140, 38);

  // Divider
  doc.setDrawColor(243, 244, 246);
  doc.line(20, 45, 190, 45);

  // Client Info Panel
  doc.setFillColor(249, 250, 251);
  doc.rect(20, 50, 170, 25, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('FACTURÉ À :', 25, 56);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(sale.customerName || 'Client Comptant', 25, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Téléphone : ${sale.customerPhone || 'Non spécifié'}`, 25, 67);

  // Items Table Header
  doc.setFillColor(79, 70, 229);
  doc.rect(20, 85, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Désignation', 25, 90);
  doc.text('Prix Unit.', 110, 90);
  doc.text('Qté', 140, 90);
  doc.text('Total', 170, 90);

  // Items Rows
  let y = 98;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  (sale.items || []).forEach((item: any) => {
    doc.text(item.name || 'Produit', 25, y);
    doc.text(pdfFormatNum(item.price) + ' ' + (merchant.currency || 'FCFA'), 110, y);
    doc.text(item.quantity?.toString() || '0', 140, y);
    doc.text(pdfFormatNum(item.total) + ' ' + (merchant.currency || 'FCFA'), 170, y);
    
    doc.setDrawColor(243, 244, 246);
    doc.line(20, y + 3, 190, y + 3);
    y += 8;
  });

  // Totals Panel
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Sous-Total :', 120, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(pdfFormatNum(sale.totalAmount) + ' ' + (merchant.currency || 'FCFA'), 160, y);

  if (sale.discount) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Remise :', 120, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`- ${pdfFormatNum(sale.discount)} ${merchant.currency || 'FCFA'}`, 160, y);
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text('Total Général :', 120, y);
  doc.text(pdfFormatNum(sale.totalAmount - (sale.discount || 0)) + ' ' + (merchant.currency || 'FCFA'), 160, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Montant versé :', 120, y);
  doc.text(pdfFormatNum(sale.paidAmount || 0) + ' ' + (merchant.currency || 'FCFA'), 160, y);

  y += 6;
  doc.text('Reste à payer :', 120, y);
  doc.text(pdfFormatNum(sale.balance || 0) + ' ' + (merchant.currency || 'FCFA'), 160, y);

  // Signatures
  y += 25;
  doc.setDrawColor(229, 231, 235);
  doc.line(25, y, 75, y);
  doc.line(135, y, 185, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text('SIGNATURE DU CLIENT', 37, y + 4);
  doc.text('SIGNATURE DU VENDEUR', 147, y + 4);

  // Footer
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Merci pour votre confiance. Document généré électroniquement par Acom Technologie.', 20, 280);

  saveOrSharePDF(doc, `facture_${sale.id?.substring(0, 8) || Date.now()}.pdf`, action);
};

export const generateA4QuotePDF = (merchant: Merchant, quote: any, action: 'print' | 'download' = 'download') => {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  // Header Decoration
  doc.setFillColor(59, 130, 246); // Blue for quotes
  doc.rect(0, 0, 210, 8, 'F');

  // Company Initials Icon
  doc.setFillColor(59, 130, 246);
  doc.rect(20, 20, 15, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(merchant.name ? merchant.name.substring(0, 2).toUpperCase() : 'AC', 24, 29);

  // Company Info
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(12);
  doc.text(merchant.name || 'Acom Partner', 40, 25);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Adresse : ${merchant.address || 'Non spécifiée'}`, 40, 30);
  doc.text(`Téléphone : ${merchant.phone || 'Non spécifié'}`, 40, 34);
  doc.text(`Email : ${merchant.email || 'Non spécifié'}`, 40, 38);

  // Quote Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(59, 130, 246);
  doc.text('DEVIS PROFORMA', 130, 25);

  // Quote Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`N° Devis : ${quote.id?.substring(0, 8).toUpperCase() || 'N/A'}`, 130, 30);
  
  const createdDate = quote.createdAt 
    ? new Date(quote.createdAt.seconds ? quote.createdAt.seconds * 1000 : quote.createdAt) 
    : new Date();
  doc.text(`Date : ${format(createdDate, 'dd MMMM yyyy', { locale: fr })}`, 130, 34);
  
  const validUntilDate = quote.validUntil
    ? new Date(quote.validUntil.seconds ? quote.validUntil.seconds * 1000 : quote.validUntil)
    : addDays(createdDate, 15);
  doc.text(`Valide jusqu'au : ${format(validUntilDate, 'dd MMMM yyyy', { locale: fr })}`, 130, 38);

  // Divider
  doc.setDrawColor(243, 244, 246);
  doc.line(20, 45, 190, 45);

  // Client Info Panel
  doc.setFillColor(249, 250, 251);
  doc.rect(20, 50, 170, 25, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('PROPOSITION DESTINÉE À :', 25, 56);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(quote.customerName || quote.clientName || 'Client Comptant', 25, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Téléphone : ${quote.customerPhone || quote.clientPhone || 'Non spécifié'}`, 25, 67);

  // Items Table Header
  doc.setFillColor(59, 130, 246);
  doc.rect(20, 85, 170, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Désignation', 25, 90);
  doc.text('Prix Unit.', 110, 90);
  doc.text('Qté', 140, 90);
  doc.text('Total', 170, 90);

  // Items Rows
  let y = 98;
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  (quote.items || []).forEach((item: any) => {
    doc.text(item.name || 'Produit', 25, y);
    doc.text(pdfFormatNum(item.price) + ' ' + (merchant.currency || 'FCFA'), 110, y);
    doc.text(item.quantity?.toString() || '0', 140, y);
    doc.text(pdfFormatNum(item.total) + ' ' + (merchant.currency || 'FCFA'), 170, y);
    
    doc.setDrawColor(243, 244, 246);
    doc.line(20, y + 3, 190, y + 3);
    y += 8;
  });

  // Totals Panel
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Sous-Total :', 120, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(pdfFormatNum(quote.totalAmount) + ' ' + (merchant.currency || 'FCFA'), 160, y);

  if (quote.discount) {
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Remise :', 120, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`- ${pdfFormatNum(quote.discount)} ${merchant.currency || 'FCFA'}`, 160, y);
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(59, 130, 246);
  doc.text('TOTAL PROFORMA :', 120, y);
  doc.text(pdfFormatNum(quote.totalAmount - (quote.discount || 0)) + ' ' + (merchant.currency || 'FCFA'), 160, y);

  // Signatures
  y += 25;
  doc.setDrawColor(229, 231, 235);
  doc.line(25, y, 75, y);
  doc.line(135, y, 185, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text("BON POUR ACCORD (CLIENT)", 32, y + 4);
  doc.text("CACHE ET SIGNATURE ENSEIGNE", 137, y + 4);

  // Footer
  doc.setTextColor(156, 163, 175);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Merci pour votre confiance. Proposition commerciale de validité temporaire générée par Acom Technologie.', 20, 280);

  saveOrSharePDF(doc, `devis_${quote.id?.substring(0, 8) || Date.now()}.pdf`, action);
};

// Helper to add Days
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
