import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { syncService } from '../../../services/syncService';
import { 
    Save, X, Loader2, Trash2, Search, 
    User, Phone, MapPin, Calendar,
    AlertCircle, Clock, MessageSquare, Printer, FileText, Edit2, RefreshCw, Plus, Scissors, Banknote, Check
} from 'lucide-react';

export const TailleurOrdersManager = ({ merchant }: { merchant: Merchant }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [tissus, setTissus] = useState<any[]>([]);
  const [mercerieItems, setMercerieItems] = useState<any[]>([]);
  const [costSheets, setCostSheets] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [focusedMeasurement, setFocusedMeasurement] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'campaigns'>('list');
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappClientPhone, setWhatsappClientPhone] = useState('');
  const [whatsappOrder, setWhatsappOrder] = useState<any>(null);
  const [whatsappTemplateType, setWhatsappTemplateType] = useState<'status' | 'balance' | 'promo'>('status');
  const [isEncaisserModalOpen, setIsEncaisserModalOpen] = useState(false);
  const [encaisserOrder, setEncaisserOrder] = useState<any>(null);
  const [encaisserAmount, setEncaisserAmount] = useState('');

  // Campagnes de Fidélisation & Fêtes
  const [selectedCampaignHoliday, setSelectedCampaignHoliday] = useState<string>('tabaski');
  const [campaignCustomText, setCampaignCustomText] = useState<string>('');
  const [selectedCampaignClients, setSelectedCampaignClients] = useState<string[]>([]);

  // Update dynamic template in the WhatsApp modal
  const updateWhatsappMessageTemplate = (orderObj: any, type: 'status' | 'balance' | 'promo') => {
    if (!orderObj) return;
    const price = Number(orderObj.price || 0);
    const advance = Number(orderObj.advance || 0);
    const rest = Math.max(0, price - advance);
    const trackingUrl = `${window.location.origin}/suivi-commande/${orderObj.id}`;
    
    let statusText = 'Enregistrée';
    if (orderObj.status === 'mesures') statusText = 'Prise de mesures validée 📏';
    else if (orderObj.status === 'coupe') statusText = 'En cours de découpe et couture ✂️';
    else if (orderObj.status === 'retouche') statusText = 'Ajustements & finitions de broderie 🧵';
    else if (orderObj.status === 'pret') statusText = 'Prête pour essayage / retrait ! 👗';
    else if (orderObj.status === 'livre') statusText = 'Livrée au client 🤝';

    let msg = '';
    if (type === 'status') {
      msg = `Bonjour ${orderObj.clientName}, des nouvelles de votre création chez ${merchant.name} ! Votre modèle "${orderObj.model}" est actuellement au statut : *${statusText}*. Vous pouvez suivre la progression en temps réel sur votre lien de suivi sécurisé en 1 clic : ${trackingUrl}. Merci pour votre confiance ! 🧵`;
    } else if (type === 'balance') {
      msg = `Bonjour ${orderObj.clientName}, votre modèle "${orderObj.model}" est prêt chez ${merchant.name} ! 🎉 Pour rappel de l'acompte :\n- Prix total convenu : ${price.toLocaleString()} ${merchant.currency}\n- Acompte versé : ${advance.toLocaleString()} ${merchant.currency}\n- *Reste à régler à la livraison : ${rest.toLocaleString()} ${merchant.currency}*\nConsultez le statut de votre commande et votre fiche de mesures en direct ici : ${trackingUrl}. À très vite ! 👋`;
    } else {
      msg = `Bonjour ${orderObj.clientName}, votre atelier ${merchant.name} vous remercie pour votre fidélité ! ✨ Nous espérons que votre modèle "${orderObj.model}" vous plaît toujours autant. Découvrez nos créations de fête et de saison en nous rendant visite ! Suivez votre fiche ici : ${trackingUrl} 👗`;
    }
    setWhatsappMessage(msg);
    setWhatsappTemplateType(type);
  };

  const handleOpenWhatsapp = (order: any) => {
    setWhatsappOrder(order);
    setWhatsappClientPhone(order.clientPhone || '');
    updateWhatsappMessageTemplate(order, 'status');
    setIsWhatsappModalOpen(true);
  };

  const [isSyncing, setIsSyncing] = useState(false);

  // Trigger sync and reload
  const triggerSync = async (force: boolean = false) => {
    setIsSyncing(true);
    try {
      await syncService.syncTailoringCollection(merchant.id, 'orders', force);
      const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load clients, orders and fabrics
  useEffect(() => {
    try {
      const savedClients = localStorage.getItem(`tailleur_clients_${merchant.id}`);
      if (savedClients) setClients(JSON.parse(savedClients));

      const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedTissus = localStorage.getItem(`tailleur_tissus_${merchant.id}`);
      if (savedTissus) setTissus(JSON.parse(savedTissus));

      const savedMercerie = localStorage.getItem(`tailleur_mercerie_${merchant.id}`);
      if (savedMercerie) setMercerieItems(JSON.parse(savedMercerie));

      const savedCosts = localStorage.getItem(`tailleur_costs_${merchant.id}`);
      if (savedCosts) setCostSheets(JSON.parse(savedCosts));
    } catch (e) {
      console.error(e);
    }
    triggerSync();
  }, [merchant.id]);

  const saveOrders = (newOrders: any[]) => {
    setOrders(newOrders);
    localStorage.setItem(`tailleur_orders_${merchant.id}`, JSON.stringify(newOrders));
  };

  const handleCreateOrder = () => {
    if (clients.filter(c => !c.isDeleted).length === 0) {
      toast.error("Veuillez d'abord ajouter des clients dans l'onglet 'Clients Couture'");
      return;
    }
    const initialOrder = {
      clientId: '',
      clientName: '',
      model: '',
      tissuUsed: '',
      price: '',
      advance: '',
      status: 'mesures',
      deliveryDate: '',
      notes: ''
    };
    setCurrentOrder(initialOrder);
    setIsFormOpen(true);
  };

  const handleSelectClient = (clientId: string) => {
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setCurrentOrder({
        ...currentOrder,
        clientId,
        clientName: `${selected.firstName} ${selected.lastName}`,
        clientPhone: selected.phone || '',
        clientMeasurements: selected.measurements || {}
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder.clientId) {
      toast.error('Veuillez sélectionner un client associé');
      return;
    }
    if (!currentOrder.model) {
      toast.error('Veuillez spécifier le modèle ou description');
      return;
    }

    let finalOrder = { ...currentOrder };

    // Déduction automatique du tissu du stock si sélectionné
    if (currentOrder.selectedTissuId && currentOrder.tissuLengthUsed) {
      const lengthUsed = Number(currentOrder.tissuLengthUsed);
      if (lengthUsed > 0) {
        const targetTissu = tissus.find(t => t.id === currentOrder.selectedTissuId);
        if (targetTissu) {
          const currentQty = Number(targetTissu.quantity || 0);
          if (currentQty < lengthUsed) {
            toast.error(`Stock insuffisant pour ${targetTissu.name}. Disponible : ${currentQty}m, Requis : ${lengthUsed}m`);
          }
          const newQty = Math.max(0, currentQty - lengthUsed);
          const updatedTissus = tissus.map(t => t.id === targetTissu.id ? { ...t, quantity: newQty, syncStatus: 'pending', updatedAt: new Date().toISOString() } : t);
          setTissus(updatedTissus);
          localStorage.setItem(`tailleur_tissus_${merchant.id}`, JSON.stringify(updatedTissus));
          
          // Mettre à jour le tissu utilisé
          finalOrder.tissuUsed = `${targetTissu.name} (${lengthUsed}m)`;
          
          // Optionnel: Déclencher aussi la synchronisation des tissus
          syncService.syncTailoringCollection(merchant.id, 'tissus');
        }
      }
    }

    // Déduction automatique des articles de mercerie du stock
    if (currentOrder.selectedMercerieItems && currentOrder.selectedMercerieItems.length > 0) {
      let updatedMercerie = [...mercerieItems];
      let hasMercerieUpdate = false;
      let mercerieNames: string[] = [];

      currentOrder.selectedMercerieItems.forEach((usedItem: any) => {
        const qtyUsed = Number(usedItem.quantityUsed);
        if (qtyUsed > 0) {
          const targetIndex = updatedMercerie.findIndex(m => m.id === usedItem.mercerieId);
          if (targetIndex >= 0) {
            const targetItem = { ...updatedMercerie[targetIndex] };
            const currentQty = Number(targetItem.quantity || 0);
            if (currentQty < qtyUsed) {
              toast.error(`Stock insuffisant pour ${targetItem.name}. Disponible : ${currentQty}, Requis : ${qtyUsed}`);
            }
            const newQty = Math.max(0, currentQty - qtyUsed);
            targetItem.quantity = newQty;
            targetItem.syncStatus = 'pending';
            targetItem.updatedAt = new Date().toISOString();
            updatedMercerie[targetIndex] = targetItem;
            hasMercerieUpdate = true;
            mercerieNames.push(`${targetItem.name} (x${qtyUsed})`);
          }
        }
      });

      if (hasMercerieUpdate) {
        setMercerieItems(updatedMercerie);
        localStorage.setItem(`tailleur_mercerie_${merchant.id}`, JSON.stringify(updatedMercerie));
        
        // Ajouter aux notes ou champ mercerie
        const mercerieText = `Mercerie: ${mercerieNames.join(', ')}`;
        finalOrder.notes = finalOrder.notes ? `${finalOrder.notes}\n${mercerieText}` : mercerieText;
        
        syncService.syncTailoringCollection(merchant.id, 'mercerie' as any);
      }
    }

    let updated;
    if (finalOrder.id) {
      updated = orders.map(o => o.id === finalOrder.id ? { ...finalOrder, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
      toast.success('Commande modifiée avec succès');
    } else {
      const newOrd = {
        ...finalOrder,
        id: crypto.randomUUID(),
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [newOrd, ...orders];
      toast.success('Nouvelle commande enregistrée');
    }
    saveOrders(updated);
    setIsFormOpen(false);
    setCurrentOrder(null);
    triggerSync();
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (nextStatus === 'livre') {
      const price = Number(order.price || 0);
      const advance = Number(order.advance || 0);
      const rest = Math.max(0, price - advance);
      if (rest > 0) {
        toast.error(`Impossible de livrer : Le client doit encore payer ${rest.toLocaleString()} ${merchant.currency}`);
        return;
      }
    }

    const updated = orders.map(o => o.id === id ? { ...o, status: nextStatus, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
    saveOrders(updated);
    toast.success('Statut de la commande modifié');
    triggerSync();
  };

  const handleEncaisser = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const price = Number(order.price || 0);
    const advance = Number(order.advance || 0);
    const rest = Math.max(0, price - advance);
    
    if (rest <= 0) {
      toast.success('Cette commande est déjà totalement soldée.');
      return;
    }
    
    setEncaisserOrder(order);
    setEncaisserAmount(rest.toString());
    setIsEncaisserModalOpen(true);
  };

  const confirmEncaisser = () => {
    if (!encaisserOrder) return;
    
    const amount = Number(encaisserAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    
    const price = Number(encaisserOrder.price || 0);
    const advance = Number(encaisserOrder.advance || 0);
    const newAdvance = Math.min(price, advance + amount);
    
    const updated = orders.map(o => 
      o.id === encaisserOrder.id 
        ? { ...o, advance: newAdvance, syncStatus: 'pending', updatedAt: new Date().toISOString() } 
        : o
    );
    saveOrders(updated);
    toast.success(`Paiement de ${amount.toLocaleString()} ${merchant.currency} enregistré avec succès`);
    triggerSync();
    setIsEncaisserModalOpen(false);
    setEncaisserOrder(null);
    setEncaisserAmount('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous supprimer cette commande ?')) {
      const target = orders.find(o => o.id === id);
      let updated;
      if (target) {
        if (target.syncStatus === 'synced') {
          updated = orders.map(o => o.id === id ? { ...o, isDeleted: true, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
        } else {
          updated = orders.filter(o => o.id !== id);
        }
        saveOrders(updated);
        toast.success('Commande supprimée');
        triggerSync();
      }
    }
  };

  const exportOrdersToCSV = () => {
    try {
      const activeOrders = orders.filter(o => !o.isDeleted);
      if (activeOrders.length === 0) {
        toast.error("Aucune commande à exporter");
        return;
      }

      let csvContent = "\uFEFF";
      csvContent += "Client,Téléphone,Modèle,Tissu Utilisé,Prix,Acompte,Reste à Payer,Statut,Livraison Prévue,Date de Commande\n";

      activeOrders.forEach(o => {
        const price = Number(o.price || 0);
        const advance = Number(o.advance || 0);
        const rest = Math.max(0, price - advance);
        const row = [
          o.clientName || '',
          o.clientPhone || '',
          o.model || '',
          o.tissuUsed || '',
          price,
          advance,
          rest,
          o.status || '',
          o.deliveryDate || '',
          o.createdAt || ''
        ].map(val => `"${String(val).replace(/\n/g, ' ')}"`).join(",");
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Registre_Commandes_Couture_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Registre des commandes exporté avec succès (Excel CSV)");
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'export Excel CSV");
    }
  };

  const exportOrdersToPDF = () => {
    const activeOrders = orders.filter(o => !o.isDeleted);
    if (activeOrders.length === 0) {
      toast.error("Aucune commande à exporter");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Veuillez autoriser les fenêtres pop-up pour générer le PDF");
      return;
    }

    const totalRevenue = activeOrders.reduce((acc, o) => acc + (Number(o.price) || 0), 0);
    const totalAdvances = activeOrders.reduce((acc, o) => acc + (Number(o.advance) || 0), 0);
    const totalRemaining = Math.max(0, totalRevenue - totalAdvances);

    const html = `
      <html>
        <head>
          <title>Registre des Commandes Couture - ${merchant.name}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; }
            h1 { font-size: 24px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -0.5px; }
            .header-info { font-size: 11px; font-family: monospace; color: #64748b; text-transform: uppercase; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            
            .stats-grid { display: grid; grid-template-cols: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .stat-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; background: #f8fafc; }
            .stat-label { font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .stat-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 5px; font-family: monospace; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; padding: 12px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; border-bottom: 2px solid #cbd5e1; background: #f1f5f9; }
            td { padding: 12px 10px; font-size: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            tr:hover { background: #fafafa; }
            .status-badge { display: inline-block; padding: 3px 8px; font-size: 10px; font-weight: bold; border-radius: 6px; text-transform: uppercase; }
            .status-mesures { background: #fee2e2; color: #ef4444; }
            .status-coupe { background: #fef3c7; color: #d97706; }
            .status-retouche { background: #e0e7ff; color: #4f46e5; }
            .status-pret { background: #dcfce7; color: #16a34a; }
            .status-livre { background: #f1f5f9; color: #475569; }
          </style>
        </head>
        <body>
          <h1>Registre Mensuel des Commandes Couture</h1>
          <div class="header-info">Atelier : ${merchant.name} | Date d'Édition : ${new Date().toLocaleDateString('fr-FR')} | Total Commandes : ${activeOrders.length}</div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Chiffre d'Affaires</span>
              <div class="stat-value">${totalRevenue.toLocaleString()} ${merchant.currency}</div>
            </div>
            <div class="stat-card">
              <span class="stat-label">Acomptes Perçus</span>
              <div class="stat-value">${totalAdvances.toLocaleString()} ${merchant.currency}</div>
            </div>
            <div class="stat-card">
              <span class="stat-label">Restant dû global</span>
              <div class="stat-value" style="color: #ef4444;">${totalRemaining.toLocaleString()} ${merchant.currency}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Client / Contact</th>
                <th>Modèle / Description</th>
                <th>Prix</th>
                <th>Acompte</th>
                <th>Reste</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              ${activeOrders.map(o => {
                const price = Number(o.price || 0);
                const advance = Number(o.advance || 0);
                const rest = Math.max(0, price - advance);
                let statusClass = 'status-mesures';
                let statusLabel = 'Mesures';
                if (o.status === 'coupe') { statusClass = 'status-coupe'; statusLabel = 'Coupe'; }
                else if (o.status === 'retouche') { statusClass = 'status-retouche'; statusLabel = 'Retouches'; }
                else if (o.status === 'pret') { statusClass = 'status-pret'; statusLabel = 'Prêt'; }
                else if (o.status === 'livre') { statusClass = 'status-livre'; statusLabel = 'Livré'; }

                return `
                  <tr>
                    <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>
                      <strong>${o.clientName}</strong><br/>
                      <span style="font-size: 10px; color: #64748b; font-family: monospace;">${o.clientPhone || '—'}</span>
                    </td>
                    <td>
                      <strong>${o.model}</strong><br/>
                      <span style="font-size: 10px; color: #64748b;">${o.tissuUsed || 'Aucun tissu stock'}</span>
                    </td>
                    <td style="font-family: monospace; font-weight: bold;">${price.toLocaleString()} ${merchant.currency}</td>
                    <td style="font-family: monospace; color: #16a34a;">${advance.toLocaleString()} ${merchant.currency}</td>
                    <td style="font-family: monospace; color: #ef4444; font-weight: bold;">${rest.toLocaleString()} ${merchant.currency}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const printThermalReceipt = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedPrice = Number(order.price || 0).toLocaleString();
    const formattedAdvance = Number(order.advance || 0).toLocaleString();
    const formattedRest = Math.max(0, (Number(order.price) || 0) - (Number(order.advance) || 0)).toLocaleString();

    printWindow.document.write(`
      <html>
        <head>
          <title>Reçu Thermique - ${order.clientName}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 74mm; 
              margin: 0 auto; 
              padding: 10px 2px; 
              font-size: 11px; 
              color: #000;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 13px; }
            .separator { border-top: 1px dashed #000; margin: 10px 0; }
            .flex-row { display: flex; justify-content: space-between; }
            .footer { font-size: 8px; margin-top: 15px; text-align: center; }
            .qr-placeholder { 
              padding: 5px; 
              width: 90px; 
              height: 90px; 
              margin: 10px auto; 
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
          </style>
        </head>
        <body>
          <div class="center bold large">${merchant.name.toUpperCase()}</div>
          <div class="center" style="font-size: 8px;">ATELIER DE COUTURE & CRÉATIONS</div>
          ${merchant.phone ? `<div class="center" style="font-size: 8px;">Tél: ${merchant.phone}</div>` : ''}
          
          <div class="separator"></div>
          
          <div class="flex-row"><span>TICKET NO:</span><span class="bold">CMD-${order.id?.slice(0, 8).toUpperCase()}</span></div>
          <div class="flex-row"><span>DATE:</span><span>${format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</span></div>
          <div class="flex-row"><span>CLIENT:</span><span class="bold">${order.clientName.toUpperCase()}</span></div>
          
          <div class="separator"></div>
          
          <div class="bold" style="text-transform: uppercase;">MODÈLE COMMANDÉ :</div>
          <div style="padding-left: 5px; margin: 4px 0;">- ${order.model}</div>
          ${order.tissuUsed ? `<div style="font-size: 9px; padding-left: 5px;">Tissu: ${order.tissuUsed}</div>` : ''}
          
          <div class="separator"></div>
          
          <div class="flex-row bold"><span>PRIX CONVENU:</span><span>${formattedPrice} ${merchant.currency || 'FCFA'}</span></div>
          <div class="flex-row"><span>ACOMPTE PAYÉ:</span><span>${formattedAdvance} ${merchant.currency || 'FCFA'}</span></div>
          <div class="separator"></div>
          <div class="flex-row bold large"><span>SOLDE REQUIS:</span><span>${formattedRest} ${merchant.currency || 'FCFA'}</span></div>
          
          <div class="separator"></div>
          
          <div class="center bold" style="font-size: 8px;">SUIVRE MA COMMANDE</div>
          <div class="qr-placeholder">
            <svg width="70" height="70" viewBox="0 0 100 100" fill="none" stroke="black" stroke-width="2">
              <rect x="5" y="5" width="25" height="25" stroke-width="4"/>
              <rect x="12" y="12" width="11" height="11" fill="black"/>
              <rect x="70" y="5" width="25" height="25" stroke-width="4"/>
              <rect x="77" y="12" width="11" height="11" fill="black"/>
              <rect x="5" y="70" width="25" height="25" stroke-width="4"/>
              <rect x="12" y="77" width="11" height="11" fill="black"/>
              <rect x="40" y="40" width="20" height="20" stroke-width="2"/>
              <rect x="45" y="45" width="10" height="10" fill="black"/>
              <rect x="40" y="10" width="10" height="5" fill="black"/>
              <rect x="55" y="20" width="5" height="15" fill="black"/>
              <rect x="75" y="40" width="15" height="10" fill="black"/>
              <rect x="10" y="45" width="10" height="10" fill="black"/>
              <rect x="75" y="75" width="15" height="15" fill="black"/>
            </svg>
            <span style="font-size: 6px; margin-top: 4px; font-family: monospace;">SCAN POUR SUIVI</span>
          </div>
          
          <div class="footer">
            Merci pour votre confiance !<br>
            Les créations sur-mesure ne sont<br>
            ni reprises ni échangées.
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printOrderForm = (order: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedPrice = Number(order.price || 0).toLocaleString();
    const formattedAdvance = Number(order.advance || 0).toLocaleString();
    const formattedRest = Math.max(0, (Number(order.price) || 0) - (Number(order.advance) || 0)).toLocaleString();

    const MEASUREMENT_NAMES: Record<string, string> = {
      cou: 'Cou (Col)',
      poitrine: 'Tour de Poitrine',
      epaule: 'Dos (Épaule à Épaule)',
      manche: 'Longueur Manche',
      tourBras: 'Tour de Bras',
      taille: 'Tour de Taille',
      hanches: 'Tour de Hanches',
      pantalon: 'Longueur Pantalon / Jupe',
      cuisse: 'Tour de Cuisse',
      boubou: 'Longueur Grand Boubou'
    };

    let measurementsHtml = '';
    if (order.clientMeasurements) {
      Object.entries(order.clientMeasurements).forEach(([key, val]) => {
        if (val) {
          measurementsHtml += `
            <div style="padding: 8px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
              <span style="font-weight: 600; color: #475569;">${MEASUREMENT_NAMES[key] || key}</span>
              <span style="font-family: monospace; font-weight: 800; color: #1e293b;">${val} cm</span>
            </div>
          `;
        }
      });
    }

    if (!measurementsHtml) {
      measurementsHtml = '<p style="color: #64748b; font-style: italic; text-align: center;">Aucune mesure spécifiée.</p>';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Fiche de Commande - ${order.clientName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
            h1 { font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; }
            .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid #ddd; }
            .invoice-box { border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .field { margin-bottom: 15px; }
            .label { font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748b; tracking: 1px; }
            .value { font-size: 15px; font-weight: 700; margin-top: 3px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px;">
              <div>
                <h1>${merchant.name}</h1>
                <p style="color: #64748b; font-size: 12px; margin: 0;">Atelier de Couture & Création sur Mesure</p>
              </div>
              <div style="text-align: right;">
                <h3 style="margin: 0; font-size: 14px; text-transform: uppercase;">Fiche de Mesures</h3>
                <p style="font-family: monospace; font-size: 11px; color: #64748b; margin: 5px 0 0 0;">ID: ${order.id?.slice(0,8)}</p>
              </div>
            </div>

            <div class="grid" style="margin-bottom: 30px;">
              <div>
                <div class="field">
                  <div class="label">Client Couture</div>
                  <div class="value">${order.clientName}</div>
                </div>
                ${order.clientPhone ? `
                <div class="field">
                  <div class="label">Téléphone</div>
                  <div class="value">${order.clientPhone}</div>
                </div>
                ` : ''}
                <div class="field">
                  <div class="label">Style / Modèle commandé</div>
                  <div class="value" style="color: #7c3aed;">${order.model}</div>
                </div>
              </div>
              <div>
                <div class="field">
                  <div class="label">Date Commande</div>
                  <div class="value">${format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: fr })}</div>
                </div>
                <div class="field">
                  <div class="label">Livraison prévue</div>
                  <div class="value">${order.deliveryDate ? format(new Date(order.deliveryDate), 'dd MMMM yyyy', { locale: fr }) : 'Non spécifiée'}</div>
                </div>
                <div class="field">
                  <div class="label">Utilisation Tissu</div>
                  <div class="value">${order.tissuUsed || 'Fourni par le client'}</div>
                </div>
              </div>
            </div>

            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; color: #7c3aed;">
              Mesures d'Atelier Associées
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
              ${measurementsHtml}
            </div>

            <h3 style="font-size: 13px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; color: #7c3aed;">
              Règlement financier
            </h3>
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Total Convenu</span>
                <div style="font-size: 20px; font-weight: 900; color: #1e293b;">${formattedPrice} ${merchant.currency}</div>
              </div>
              <div>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Acompte Versé</span>
                <div style="font-size: 20px; font-weight: 900; color: #10b981;">${formattedAdvance} ${merchant.currency}</div>
              </div>
              <div>
                <span style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b;">Reste à payer</span>
                <div style="font-size: 20px; font-weight: 900; color: #ef4444;">${formattedRest} ${merchant.currency}</div>
              </div>
            </div>

            <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b;">
              <div>Signature Client</div>
              <div>Signature Gérant</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    return o.clientName.toLowerCase().includes(search.toLowerCase()) || o.model.toLowerCase().includes(search.toLowerCase());
  });

  // Calculs du Planning de Livraison (Timeline / Kanban de Couture)
  const now = new Date();
  const urgentOrders = filteredOrders.filter(o => {
    if (o.status === 'livre') return false;
    if (o.isLater) return false;
    if (o.isUrgent) return true;
    if (!o.deliveryDate) return false;
    const dDate = new Date(o.deliveryDate);
    return dDate < now;
  });

  const thisWeekOrders = filteredOrders.filter(o => {
    if (o.status === 'livre') return false;
    if (o.isLater) return false;
    if (o.isUrgent) return false;
    if (!o.deliveryDate) return false;
    const dDate = new Date(o.deliveryDate);
    const diffTime = dDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return dDate >= now && diffDays <= 7;
  });

  const laterOrders = filteredOrders.filter(o => {
    if (o.status === 'livre') return false;
    if (o.isUrgent) return false;
    if (o.isLater) return true;
    if (!o.deliveryDate) return true;
    const dDate = new Date(o.deliveryDate);
    const diffTime = dDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 7;
  });

  const deliveredOrders = filteredOrders.filter(o => o.status === 'livre');

  const renderTimelineCard = (order: any, themeColor: string) => {
    const price = Number(order.price || 0);
    const advance = Number(order.advance || 0);
    const rest = Math.max(0, price - advance);
    const linkedCostSheet = costSheets.find(cs => cs.orderId === order.id);
    
    const themeClasses = 
      themeColor === 'rose' ? 'hover:border-rose-300 shadow-rose-50/25' :
      themeColor === 'amber' ? 'hover:border-amber-300 shadow-amber-50/25' :
      themeColor === 'emerald' ? 'hover:border-emerald-300 shadow-emerald-50/25' :
      'hover:border-violet-300 shadow-violet-50/25';

    return (
      <div 
        key={order.id} 
        className={`bg-white p-4 rounded-2xl border ${
          order.isUrgent ? 'border-red-200 bg-red-50/5' : 'border-slate-100'
        } shadow-sm ${themeClasses} hover:shadow-md transition-all flex flex-col justify-between text-left`}
      >
        <div>
          <div className="flex justify-between items-center gap-1">
            <span className="text-[8px] font-mono font-black text-gray-400 uppercase flex items-center gap-1">
              {order.isUrgent && <span className="animate-pulse">🚨</span>}
              CMD-{order.id?.slice(0, 5).toUpperCase()}
            </span>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(order.id, e.target.value)}
              className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider cursor-pointer border outline-none ${
                order.status === 'livre' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                order.status === 'pret' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                'bg-amber-50 text-amber-600 border-amber-100'
              }`}
            >
              <option value="mesures">🧵 Mesures</option>
              <option value="coupe">✂️ Couture</option>
              <option value="retouche">✏️ Retouche</option>
              <option value="pret">👗 Prêt / Essai</option>
              <option value="livre">🤝 Livré</option>
            </select>
          </div>

          <div className="flex items-start gap-3 mt-1.5">
            {order.inspirationImage && (
              <img 
                src={order.inspirationImage} 
                alt="Style Inspiration" 
                className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <h4 className="font-extrabold text-ink text-xs leading-tight truncate">{order.clientName}</h4>
                {order.isUrgent && (
                  <span className="bg-red-500 text-white text-[7px] font-black px-1 rounded-sm shrink-0">
                    URGENT
                  </span>
                )}
                {order.isLater && (
                  <span className="bg-amber-500 text-white text-[7px] font-black px-1 rounded-sm shrink-0">
                    À REPORTER
                  </span>
                )}
              </div>
              <p className="text-[9px] text-violet-600 font-bold leading-normal truncate">{order.model}</p>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-slate-50 space-y-1">
            <div className="flex justify-between text-[9px] font-bold text-gray-500">
              <span>Reste :</span>
              <span className="font-mono text-rose-500">{rest.toLocaleString()} {merchant.currency}</span>
            </div>
            {order.deliveryDate && (
              <div className="flex justify-between text-[8px] font-semibold text-slate-400">
                <span>Échéance :</span>
                <span className={order.isUrgent || (new Date(order.deliveryDate) < now && order.status !== 'livre') ? 'text-red-500 font-bold animate-pulse' : ''}>
                  {format(new Date(order.deliveryDate), 'dd/MM/yyyy')}
                </span>
              </div>
            )}
          </div>

          {linkedCostSheet && (
            <div className="mt-2 p-1.5 bg-violet-50/50 border border-violet-100 rounded-lg flex items-center justify-between text-[8px] font-black text-violet-700">
              <span>Rentabilité :</span>
              <span className="font-mono font-extrabold">+{linkedCostSheet.profit.toLocaleString()} {merchant.currency}</span>
            </div>
          )}
        </div>

        {/* Dynamic Contextual Action Buttons depending on column color */}
        {themeColor === 'rose' && (
          <button
            onClick={() => {
              const newDate = new Date();
              newDate.setDate(newDate.getDate() + 7);
              const updated = orders.map(o => o.id === order.id ? { ...o, deliveryDate: newDate.toISOString().split('T')[0], isUrgent: false, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
              saveOrders(updated);
              toast.success("Livraison repoussée de 7 jours (Planifié plus tard)");
              triggerSync();
            }}
            className="w-full text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold py-1 px-2 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-center gap-1 mt-2 transition"
          >
            🕒 Repousser de 7 jours
          </button>
        )}

        {themeColor === 'violet' && (
          <button
            onClick={() => {
              const newDate = new Date();
              newDate.setDate(newDate.getDate() + 2);
              const updated = orders.map(o => o.id === order.id ? { ...o, deliveryDate: newDate.toISOString().split('T')[0], isLater: false, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
              saveOrders(updated);
              toast.success("Livraison avancée à cette semaine !");
              triggerSync();
            }}
            className="w-full text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold py-1 px-2 rounded-xl border border-indigo-100 cursor-pointer flex items-center justify-center gap-1 mt-2 transition"
          >
            ⚡ Mettre cette semaine
          </button>
        )}

        <div className="mt-3 pt-2 border-t border-slate-50 flex gap-1 justify-end">
          <button
            onClick={() => {
              const updated = orders.map(o => o.id === order.id ? { ...o, isUrgent: !o.isUrgent, isLater: !o.isUrgent ? false : o.isLater, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
              saveOrders(updated);
              toast.success(order.isUrgent ? "Urgence retirée." : "Commande marquée comme URGENTE ! 🚨");
              triggerSync();
            }}
            className={`p-1.5 border rounded-lg hover:scale-105 transition-all cursor-pointer ${
              order.isUrgent ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}
            title={order.isUrgent ? "Retirer l'urgence" : "Marquer comme urgent"}
          >
            <AlertCircle className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              const updated = orders.map(o => o.id === order.id ? { ...o, isLater: !o.isLater, isUrgent: !o.isLater ? false : o.isUrgent, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
              saveOrders(updated);
              toast.success(order.isLater ? "Ne plus planifier plus tard." : "Commande planifiée pour plus tard. 🕒");
              triggerSync();
            }}
            className={`p-1.5 border rounded-lg hover:scale-105 transition-all cursor-pointer ${
              order.isLater ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}
            title={order.isLater ? "Retirer planifié plus tard" : "Planifier plus tard"}
          >
            <Clock className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleOpenWhatsapp(order)}
            className="p-1.5 border border-emerald-100 bg-emerald-50/55 text-emerald-600 rounded-lg hover:scale-105 transition-transform cursor-pointer"
            title="Aviser WhatsApp"
          >
            <MessageSquare className="w-3 h-3" />
          </button>
          <button
            onClick={() => printOrderForm(order)}
            className="p-1.5 border border-violet-100 bg-violet-50/55 text-violet-600 rounded-lg hover:scale-105 transition-transform cursor-pointer"
            title="Fiche A4"
          >
            <Printer className="w-3 h-3" />
          </button>
          <button
            onClick={() => printThermalReceipt(order)}
            className="p-1.5 border border-amber-100 bg-amber-50/55 text-amber-600 rounded-lg hover:scale-105 transition-transform cursor-pointer"
            title="Ticket Thermique 80mm"
          >
            <FileText className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              setCurrentOrder(order);
              setIsFormOpen(true);
            }}
            className="p-1.5 border border-slate-100 text-gray-500 rounded-lg hover:scale-105 transition-transform cursor-pointer"
            title="Éditer"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-ink">Gestion des Commandes Couture</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Conceptions en cours : {orders.filter(o => !o.isDeleted && o.status !== 'livre').length.toString().padStart(3, '0')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'list' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}
            >
              Fiches Liste
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'timeline' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}
            >
              Planning
            </button>
            <button
              onClick={() => setViewMode('campaigns')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${viewMode === 'campaigns' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}
            >
              Fidélisation 🌟
            </button>
          </div>

          <button
            onClick={() => triggerSync(true)}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinc...' : 'Sync 🔄'}</span>
          </button>

          <button
            onClick={exportOrdersToCSV}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Excel 📊</span>
          </button>

          <button
            onClick={exportOrdersToPDF}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF 🖨️</span>
          </button>

          <button 
            onClick={handleCreateOrder}
            className="flex-1 xl:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 hover:scale-[1.02] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer une Commande</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm justify-between text-left">
        <div className="flex items-center gap-3 flex-1 w-full">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Rechercher par client ou modèle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm text-slate-700 bg-transparent outline-none font-medium placeholder-gray-400"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto w-full md:w-auto py-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: 'Tous' },
            { id: 'mesures', label: 'Mesures' },
            { id: 'coupe', label: 'Couture' },
            { id: 'retouche', label: 'Retouche' },
            { id: 'pret', label: 'Prêts' },
            { id: 'livre', label: 'Livrés' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${filterStatus === tab.id ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-100 text-gray-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Dialog */}
      {isFormOpen && currentOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 bg-violet-50/50 flex justify-between items-center shrink-0">
              <div className="text-left">
                <h3 className="text-xl font-black text-ink">{currentOrder.id ? 'Modifier la Commande' : 'Créer une Fiche Commande'}</h3>
                <p className="text-[10px] font-mono text-violet-600 uppercase tracking-widest mt-0.5">Enregistrement d'une création sur mesure</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6 flex-1 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Sélectionner le Client *</label>
                  <select
                    value={currentOrder.clientId}
                    onChange={(e) => handleSelectClient(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm bg-white cursor-pointer"
                  >
                    <option value="">-- Choisissez un client couture --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone || 'Pas de numéro'})</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Description du Modèle Commandé *</label>
                  <input
                    type="text"
                    required
                    value={currentOrder.model}
                    placeholder="Ex: Grand Boubou Broderie fine blanche, Robe trapèze wax"
                    onChange={e => setCurrentOrder({ ...currentOrder, model: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Prix de la Confection ({merchant.currency}) *</label>
                  <input
                    type="number"
                    required
                    value={currentOrder.price || ''}
                    placeholder="Ex: 50000"
                    onChange={e => setCurrentOrder({ ...currentOrder, price: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Acompte Versé ({merchant.currency})</label>
                  <input
                    type="number"
                    value={currentOrder.advance || ''}
                    placeholder="Ex: 25000"
                    onChange={e => setCurrentOrder({ ...currentOrder, advance: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Date Prévue de Livraison *</label>
                  <input
                    type="date"
                    required
                    value={currentOrder.deliveryDate ? currentOrder.deliveryDate.split('T')[0] : ''}
                    onChange={e => setCurrentOrder({ ...currentOrder, deliveryDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Statut Initial *</label>
                  <select
                    value={currentOrder.status || 'mesures'}
                    onChange={e => setCurrentOrder({ ...currentOrder, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-bold text-sm bg-white cursor-pointer"
                  >
                    <option value="mesures">🧵 Prise de Mesures</option>
                    <option value="coupe">✂️ Coupe & Couture</option>
                    <option value="retouche">✏️ Retouches</option>
                    <option value="pret">👗 Prêt pour Essai</option>
                    <option value="livre">🤝 Livré</option>
                  </select>
                </div>

                <div className="flex items-center gap-6 py-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isUrgent"
                      checked={!!currentOrder.isUrgent}
                      onChange={e => setCurrentOrder({ ...currentOrder, isUrgent: e.target.checked, isLater: e.target.checked ? false : currentOrder.isLater })}
                      className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <label htmlFor="isUrgent" className="text-xs font-black text-rose-600 cursor-pointer flex items-center gap-1 uppercase select-none">
                      🚨 Marquer Urgent
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isLater"
                      checked={!!currentOrder.isLater}
                      onChange={e => setCurrentOrder({ ...currentOrder, isLater: e.target.checked, isUrgent: e.target.checked ? false : currentOrder.isUrgent })}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                    <label htmlFor="isLater" className="text-xs font-black text-amber-600 cursor-pointer flex items-center gap-1 uppercase select-none">
                      <Clock className="w-3 h-3" />
                      Planifier plus tard
                    </label>
                  </div>
                </div>

                <div className="col-span-2 border-t border-dashed border-gray-150 pt-4 space-y-4">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Achat / Consommation de Tissu (Optionnel)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Tissu de l'atelier utilisé</label>
                      <select
                        value={currentOrder.selectedTissuId || ''}
                        onChange={e => setCurrentOrder({ ...currentOrder, selectedTissuId: e.target.value })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm bg-white cursor-pointer"
                      >
                        <option value="">-- Ne pas prélever de tissu --</option>
                        {tissus.map(t => (
                          <option key={t.id} value={t.id}>{t.name} (Reste {t.quantity}m)</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Longueur nécessaire (mètres)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentOrder.tissuLengthUsed || ''}
                        placeholder="Ex: 3.5"
                        onChange={e => setCurrentOrder({ ...currentOrder, tissuLengthUsed: Number(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-2 border-t border-dashed border-gray-150 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Articles de Mercerie (Optionnel)</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const current = currentOrder.selectedMercerieItems || [];
                        setCurrentOrder({ ...currentOrder, selectedMercerieItems: [...current, { mercerieId: '', quantityUsed: 1 }] });
                      }}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Ajouter un article
                    </button>
                  </div>
                  
                  {currentOrder.selectedMercerieItems && currentOrder.selectedMercerieItems.map((item: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Article</label>
                        <select
                          value={item.mercerieId}
                          onChange={e => {
                            const newItems = [...currentOrder.selectedMercerieItems];
                            newItems[index].mercerieId = e.target.value;
                            setCurrentOrder({ ...currentOrder, selectedMercerieItems: newItems });
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm bg-white cursor-pointer"
                        >
                          <option value="">-- Choisir --</option>
                          {mercerieItems.map(m => (
                            <option key={m.id} value={m.id}>{m.name} (Stock: {m.quantity})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Quantité</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantityUsed || ''}
                          onChange={e => {
                            const newItems = [...currentOrder.selectedMercerieItems];
                            newItems[index].quantityUsed = Number(e.target.value);
                            setCurrentOrder({ ...currentOrder, selectedMercerieItems: newItems });
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newItems = currentOrder.selectedMercerieItems.filter((_: any, i: number) => i !== index);
                          setCurrentOrder({ ...currentOrder, selectedMercerieItems: newItems });
                        }}
                        className="p-2.5 bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(!currentOrder.selectedMercerieItems || currentOrder.selectedMercerieItems.length === 0) && (
                    <p className="text-xs text-gray-400 italic">Aucun article de mercerie ajouté à cette commande.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-150 pt-6 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-violet-600/20 transition cursor-pointer"
                >
                  Confirmer la Commande 🚀
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

       {/* Orders List / Planning / Campaigns view */}
      {viewMode === 'campaigns' ? (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-black/5 shadow-sm text-left space-y-6">
          <div className="border-b border-gray-150 pb-5">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🎉</span> Campagnes de Fidélisation & Fêtes
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Préparez et envoyez des messages personnalisés à vos clients couture pour les grandes occasions et relancez votre activité.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column: Campaign Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Sélectionner l'Occasion / Fête</label>
                  <select
                    value={selectedCampaignHoliday}
                    onChange={(e) => {
                      setSelectedCampaignHoliday(e.target.value);
                      // Pre-fill a template message
                      const h = e.target.value;
                      let txt = "";
                      if (h === 'tabaski') txt = "A l'approche de la Tabaski 🐑, nous serions honorés de confectionner vos plus beaux modèles (Boubous, Bazin, Wax) !";
                      else if (h === 'korite') txt = "Pour célébrer la Korité 🌟 avec élégance, venez faire vos prises de mesures à l'atelier et découvrez nos nouveaux tissus.";
                      else if (h === 'ramadan') txt = "Pendant le mois sacré du Ramadan 🌙, préparez sereinement vos tenues de fête avec notre équipe d'artisans.";
                      else txt = "Pour les fêtes de fin d'année ✨, brillez de mille feux avec une création sur-mesure unique de notre atelier !";
                      setCampaignCustomText(txt);
                    }}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm font-bold bg-white cursor-pointer"
                  >
                    <option value="tabaski">🐑 Fête de la Tabaski</option>
                    <option value="korite">🌟 Fête de la Korité</option>
                    <option value="ramadan">🌙 Mois du Ramadan</option>
                    <option value="fin_annee">✨ Fêtes de Fin d'Année</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1.5">Note Personnalisée (Ajout au message)</label>
                  <input
                    type="text"
                    placeholder="Ex : Remise de 10% sur les commandes groupées"
                    value={campaignCustomText || "A l'approche de la Tabaski 🐑, nous serions honorés de confectionner vos plus beaux modèles (Boubous, Bazin, Wax) !"}
                    onChange={(e) => setCampaignCustomText(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium"
                  />
                </div>
              </div>

              {/* Client Selection Table */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Destinataires ({clients.length})</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCampaignClients(clients.map(c => c.id))}
                      className="text-[10px] font-bold text-violet-600 hover:underline cursor-pointer"
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCampaignClients([])}
                      className="text-[10px] font-bold text-gray-400 hover:underline cursor-pointer"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                </div>

                <div className="border border-gray-150 rounded-2xl overflow-hidden divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
                  {clients.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center font-medium">Aucun client enregistré pour le moment.</p>
                  ) : (
                    clients.map((client) => {
                      const isSelected = selectedCampaignClients.includes(client.id);
                      return (
                        <div key={client.id} className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedCampaignClients(selectedCampaignClients.filter(id => id !== client.id));
                                } else {
                                  setSelectedCampaignClients([...selectedCampaignClients, client.id]);
                                }
                              }}
                              className="w-4.5 h-4.5 text-violet-600 border-gray-300 rounded focus:ring-violet-500 cursor-pointer"
                            />
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">{client.firstName} {client.lastName}</p>
                              <p className="text-[10px] text-gray-400 font-mono">{client.phone || 'Pas de numéro'}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-violet-50 text-violet-600 px-2.5 py-0.5 rounded-full uppercase">
                            Couture
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Campaign Preview & Batch Launch */}
            <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-black text-violet-700 bg-violet-100/60 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  Aperçu du message WhatsApp
                </span>

                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative space-y-2">
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-bold text-gray-400 font-mono">Prêt</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed italic whitespace-pre-line font-medium">
                    {`Bonjour [Nom du Client],\n\nVotre atelier *${merchant.name}* vous souhaite le meilleur !\n\n${campaignCustomText || "A l'approche de la Tabaski 🐑, nous serions honorés de confectionner vos plus beaux modèles (Boubous, Bazin, Wax) !"}\n\nRéservez votre créneau au plus vite au *${merchant.phone || "notre numéro"}*. À très bientôt ! ✨`}
                  </p>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl text-[10px] font-semibold text-amber-800 space-y-1.5 leading-relaxed">
                  <p className="font-bold flex items-center gap-1">
                    💡 Astuce d'envoi groupé
                  </p>
                  <p>
                    WhatsApp n'autorisant pas le spam automatisé, notre outil prépare vos messages personnalisés. Cliquez sur un client ci-dessous pour déclencher l'ouverture de sa conversation avec le bon message pré-rempli !
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-150">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Destinataires sélectionnés :</span>
                  <span className="text-violet-600 font-mono">{selectedCampaignClients.length}</span>
                </div>

                <div className="space-y-2">
                  {selectedCampaignClients.length === 0 ? (
                    <button
                      disabled
                      type="button"
                      className="w-full py-3 bg-gray-100 text-gray-400 rounded-2xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Sélectionnez des clients pour envoyer
                    </button>
                  ) : (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto">
                      {selectedCampaignClients.map((clientId) => {
                        const client = clients.find(c => c.id === clientId);
                        if (!client) return null;
                        const clientMsg = `Bonjour ${client.firstName},\n\nVotre atelier *${merchant.name}* vous souhaite le meilleur !\n\n${campaignCustomText || "A l'approche de la Tabaski 🐑, nous serions honorés de confectionner vos plus beaux modèles (Boubous, Bazin, Wax) !"}\n\nRéservez votre créneau au plus vite au *${merchant.phone || ""}*. À très bientôt ! ✨`;
                        
                        const handleSend = () => {
                          const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
                          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(clientMsg)}`, '_blank');
                        };

                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={handleSend}
                            className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 rounded-xl font-bold text-[11px] flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="truncate">Envoyer à {client.firstName} {client.lastName}</span>
                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider shrink-0 flex items-center gap-1 ml-2">
                              WhatsApp
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-left">
          {/* URGENT COLUMN */}
          <div className="bg-rose-50/25 border border-rose-100 p-5 rounded-3xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <span className="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                🔴 En Retard / Urgents
              </span>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {urgentOrders.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1" style={{ scrollbarWidth: 'none' }}>
              {urgentOrders.length === 0 ? (
                <p className="text-[10px] text-gray-400 font-medium py-6 text-center">Aucune commande urgente en attente.</p>
              ) : (
                urgentOrders.map(order => renderTimelineCard(order, "rose"))
              )}
            </div>
          </div>

          {/* THIS WEEK COLUMN */}
          <div className="bg-amber-50/25 border border-amber-100 p-5 rounded-3xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2">
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                🟡 Cette Semaine
              </span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {thisWeekOrders.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1" style={{ scrollbarWidth: 'none' }}>
              {thisWeekOrders.length === 0 ? (
                <p className="text-[10px] text-gray-400 font-medium py-6 text-center">Rien de planifié cette semaine.</p>
              ) : (
                thisWeekOrders.map(order => renderTimelineCard(order, "amber"))
              )}
            </div>
          </div>

          {/* LATER COLUMN */}
          <div className="bg-violet-50/25 border border-violet-100 p-5 rounded-3xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-violet-100 pb-2">
              <span className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                🟣 Planifiés Plus Tard
              </span>
              <span className="bg-violet-100 text-violet-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {laterOrders.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1" style={{ scrollbarWidth: 'none' }}>
              {laterOrders.length === 0 ? (
                <p className="text-[10px] text-gray-400 font-medium py-6 text-center">Aucune commande lointaine.</p>
              ) : (
                laterOrders.map(order => renderTimelineCard(order, "violet"))
              )}
            </div>
          </div>

          {/* DELIVERED COLUMN */}
          <div className="bg-emerald-50/25 border border-emerald-100 p-5 rounded-3xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                🟢 Livrés (Historique)
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {deliveredOrders.length}
              </span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[65vh] pr-1" style={{ scrollbarWidth: 'none' }}>
              {deliveredOrders.length === 0 ? (
                <p className="text-[10px] text-gray-400 font-medium py-6 text-center">Aucun modèle livré récemment.</p>
              ) : (
                deliveredOrders.map(order => renderTimelineCard(order, "emerald"))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Original Orders List */
        filteredOrders.length === 0 ? (
          <div className="bg-white py-16 text-center rounded-[2rem] border border-gray-150 shadow-sm flex flex-col items-center justify-center text-left">
            <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4 border border-violet-100">
              <Scissors className="w-8 h-8 text-violet-400" />
            </div>
            <p className="text-gray-500 font-bold mb-1">Aucune commande trouvée</p>
            <p className="text-xs text-gray-400">Lancez une nouvelle création sur mesure en cliquant sur Créer une Commande.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredOrders.map((order) => {
            const price = Number(order.price || 0);
            const advance = Number(order.advance || 0);
            const rest = Math.max(0, price - advance);
            const linkedCostSheet = costSheets.find(cs => cs.orderId === order.id);
            return (
              <div key={order.id} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <div className="flex gap-3 items-start min-w-0 flex-1">
                      {order.inspirationImage && (
                        <img 
                          src={order.inspirationImage} 
                          alt="Style Inspiration" 
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-mono font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          CMD-{order.id?.slice(0, 5).toUpperCase()}
                        </span>
                        <h3 className="font-extrabold text-ink text-lg mt-1 leading-snug truncate">{order.clientName}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-xs text-violet-600 font-bold font-sans truncate">{order.model}</p>
                          <div className="flex items-center gap-1.5 ml-auto md:ml-2">
                            <button
                              onClick={() => {
                                const updated = orders.map(o => o.id === order.id ? { ...o, isUrgent: !o.isUrgent, isLater: !o.isUrgent ? false : o.isLater, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
                                saveOrders(updated);
                                toast.success(order.isUrgent ? "Urgence retirée." : "Commande marquée comme URGENTE ! 🚨");
                                triggerSync();
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0 border ${
                                order.isUrgent ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                              title={order.isUrgent ? "Retirer l'urgence" : "Marquer comme urgent"}
                            >
                              <AlertCircle className="w-2.5 h-2.5" />
                              Urgent
                            </button>
                            <button
                              onClick={() => {
                                const updated = orders.map(o => o.id === order.id ? { ...o, isLater: !o.isLater, isUrgent: !o.isLater ? false : o.isUrgent, syncStatus: 'pending', updatedAt: new Date().toISOString() } : o);
                                saveOrders(updated);
                                toast.success(order.isLater ? "Retiré des planifiés plus tard." : "Commande planifiée pour plus tard. 🕒");
                                triggerSync();
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shrink-0 border ${
                                order.isLater ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                              }`}
                              title={order.isLater ? "Retirer planifié plus tard" : "Planifier plus tard"}
                            >
                              <Clock className="w-2.5 h-2.5" />
                              Plus tard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-wider bg-white cursor-pointer ${
                          order.status === 'livre' ? 'text-emerald-600 border-emerald-100 bg-emerald-50/50' :
                          order.status === 'pret' ? 'text-blue-600 border-blue-100 bg-blue-50/50' :
                          'text-amber-600 border-amber-100 bg-amber-50/50'
                        }`}
                      >
                        <option value="mesures">🧵 Mesures</option>
                        <option value="coupe">✂️ Couture</option>
                        <option value="retouche">✏️ Retouche</option>
                        <option value="pret">👗 Prêt / Essai</option>
                        <option value="livre">🤝 Livré</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-150 pt-3">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>Prix convenu :</span>
                      <span className="font-mono text-ink">{price.toLocaleString()} {merchant.currency}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-emerald-600">
                      <span>Acompte versé :</span>
                      <span className="font-mono">{advance.toLocaleString()} {merchant.currency}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-rose-500 pb-1 border-b border-gray-100">
                      <span>Reste à payer :</span>
                      <span className="font-mono">{rest.toLocaleString()} {merchant.currency}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Livraison : {order.deliveryDate ? format(new Date(order.deliveryDate), 'dd/MM/yyyy') : 'Indéterminée'}
                      </span>
                      {order.tissuUsed && (
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg truncate max-w-[150px] font-medium border border-slate-100 text-slate-500">
                          {order.tissuUsed}
                        </span>
                      )}
                    </div>

                    {linkedCostSheet && (
                      <div className="mt-3 p-2.5 bg-violet-50/55 border border-violet-100 rounded-xl flex items-center justify-between text-xs font-black text-violet-700">
                        <span className="flex items-center gap-1">📊 Bénéfice Estimé :</span>
                        <span className="font-mono text-violet-700 font-extrabold">+{linkedCostSheet.profit.toLocaleString()} {merchant.currency} ({linkedCostSheet.marginPercent.toFixed(0)}%)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 flex flex-col gap-2">
                  {rest > 0 && (
                    <button
                      onClick={() => handleEncaisser(order.id)}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform cursor-pointer border border-emerald-200"
                    >
                      <Banknote className="w-4 h-4" /> Encaisser le reste ({rest.toLocaleString()} {merchant.currency})
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => printOrderForm(order)}
                      className="flex-1 py-2 border border-violet-100 hover:bg-violet-50 text-violet-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform cursor-pointer"
                      title="Imprimer Fiche de Mesures"
                    >
                      <Printer className="w-3.5 h-3.5" /> Fiche A4
                    </button>
                    <button
                      onClick={() => printThermalReceipt(order)}
                      className="px-3 py-2 border border-amber-100 bg-amber-50/30 hover:bg-amber-50 text-amber-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-transform cursor-pointer"
                      title="Reçu Thermique 80mm"
                    >
                      <FileText className="w-3.5 h-3.5" /> Ticket 80mm
                    </button>
                    <button
                      onClick={() => handleOpenWhatsapp(order)}
                      className="p-2 border border-emerald-150 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 rounded-xl hover:scale-105 transition-transform cursor-pointer flex items-center justify-center"
                      title="Aviser le client via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setCurrentOrder(order);
                        setIsFormOpen(true);
                      }}
                      className="p-2 border border-slate-100 hover:bg-slate-50 text-gray-500 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                      title="Détails"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-2 border border-slate-100 hover:bg-rose-50 text-gray-400 hover:text-red-600 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )
      )}

      {/* Modal Encaisser le reste */}
      {isEncaisserModalOpen && encaisserOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in flex flex-col">
            <div className="px-6 py-5 border-b border-gray-150 bg-emerald-50/50 flex justify-between items-center text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  Encaisser le reste
                </h3>
              </div>
              <button onClick={() => { setIsEncaisserModalOpen(false); setEncaisserOrder(null); setEncaisserAmount(''); }} className="w-8 h-8 bg-white hover:bg-gray-100 rounded-full flex items-center justify-center transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Montant à encaisser ({merchant.currency})</label>
                <input
                  type="number"
                  value={encaisserAmount}
                  onChange={(e) => setEncaisserAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold font-mono"
                  placeholder="Montant"
                />
              </div>
              <div className="text-xs text-gray-500">
                Reste à payer initial: <span className="font-bold text-slate-700">{Math.max(0, Number(encaisserOrder.price || 0) - Number(encaisserOrder.advance || 0)).toLocaleString()} {merchant.currency}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => { setIsEncaisserModalOpen(false); setEncaisserOrder(null); setEncaisserAmount(''); }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-gray-50 text-slate-600 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Annuler
              </button>
              <button 
                onClick={confirmEncaisser}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirmer l'encaissement
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* WhatsApp Custom Notification Modal with dynamic template switcher */}
      {isWhatsappModalOpen && whatsappOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col">
            <div className="px-6 py-5 border-b border-gray-150 bg-emerald-50/50 flex justify-between items-center text-left">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                  <span className="text-emerald-600">💬</span> Notification Client WhatsApp
                </h3>
                <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest mt-0.5">Personnalisez votre message client</p>
              </div>
              <button type="button" onClick={() => setIsWhatsappModalOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-left overflow-y-auto max-h-[75vh]">
              {/* Template selection tabs */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500">Choisir un modèle de message :</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateWhatsappMessageTemplate(whatsappOrder, 'status')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      whatsappTemplateType === 'status' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-black' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600 font-bold'
                    }`}
                  >
                    📈 Statut Actuel
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWhatsappMessageTemplate(whatsappOrder, 'balance')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      whatsappTemplateType === 'balance' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-black' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600 font-bold'
                    }`}
                  >
                    💰 Solde & Facture
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWhatsappMessageTemplate(whatsappOrder, 'promo')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      whatsappTemplateType === 'promo' 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-black' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600 font-bold'
                    }`}
                  >
                    🎁 Fidélisation
                  </button>
                </div>
              </div>

              {/* Recipient Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Téléphone Client *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : +221 77 000 00 00"
                  value={whatsappClientPhone}
                  onChange={e => setWhatsappClientPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold font-mono"
                />
              </div>

              {/* Message Content Area */}
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Corps du message (Modifiable) *</label>
                <textarea
                  rows={6}
                  required
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-medium leading-relaxed font-sans"
                />
              </div>

              {/* Helper disclaimer */}
              <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl text-[10px] text-emerald-800 leading-relaxed font-semibold">
                🔗 Ce message contient un lien de suivi dynamique permettant à votre client d'accéder à son espace de suivi autonome sécurisé.
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-end gap-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsWhatsappModalOpen(false)} 
                  className="px-4 py-2 bg-gray-150 hover:bg-gray-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const cleanPhone = whatsappClientPhone.replace(/[^0-9]/g, '');
                    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                    setIsWhatsappModalOpen(false);
                    toast.success('Conversation de suivi ouverte !');
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  Ouvrir sur WhatsApp 🚀
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};