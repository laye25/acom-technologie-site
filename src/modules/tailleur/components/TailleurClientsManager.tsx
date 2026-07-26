import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../../db/db';
import { Merchant } from '../../../types';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { syncService } from '../../../services/syncService';
import { 
    Save, X, Loader2, Trash2, Search, 
    User, Phone, MapPin, Calendar,
    RefreshCw, FileText, Printer, Plus, Scissors, Users, Edit2,
    Ruler, Sparkles
} from 'lucide-react';
import { SmartMeasurementAssistant } from './SmartMeasurementAssistant';
import { GarmentProfileCard } from './GarmentProfileCard';
import { GarmentLibraryService } from '../services/GarmentLibraryService';
import { GarmentResolverService } from '../services/GarmentResolverService';
import { TailorCard, TailorDeleteConfirmModal } from './design-system/TailorDesignSystem';
import { sendEmailDirectlyOrViaBackend } from '../../../lib/api';
import { showMailSuccessToast } from '../../../components/MailSuccessToast';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';

export const TailleurClientsManager = ({ merchant }: { merchant: Merchant }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSmartAssistantOpen, setIsSmartAssistantOpen] = useState(false);

  // Modal de confirmation de suppression
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [clientOrdersCount, setClientOrdersCount] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger sync and reload
  const triggerSync = async (force: boolean = false) => {
    setIsSyncing(true);
    try {
      await syncService.syncTailoringCollection(merchant.id, 'clients', force);
      const saved = localStorage.getItem(`tailleur_clients_${merchant.id}`);
      if (saved) setClients(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load clients
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tailleur_clients_${merchant.id}`);
      if (saved) setClients(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
    triggerSync();
  }, [merchant.id]);

  const saveClients = (newClients: any[]) => {
    setClients(newClients);
    localStorage.setItem(`tailleur_clients_${merchant.id}`, JSON.stringify(newClients));
  };

  const notifyManagerClientSaved = async (clientData: any) => {
    const managerPhone = merchant.managerNotifications?.whatsappPhone || '';
    const managerEmail = merchant.managerNotifications?.email || '';

    // 1. WhatsApp Channel
    if (managerPhone && managerPhone.trim()) {
      const waMessage = `🌟 [SUIVI GÉRANT] NOUVELLE FICHE CLIENT & MESURES 🌟\n\n` +
        `Atelier : ${merchant.name || 'Atelier de Couture'}\n` +
        `Client : ${clientData.firstName || ''} ${clientData.lastName || ''}\n` +
        `Contact : ${clientData.phone || 'Non renseigné'}\n` +
        `Modèle / Vêtement : ${clientData.preferredGarment || clientData.garmentName || 'Sur-mesure'}\n` +
        (clientData.measurements && Object.keys(clientData.measurements).length > 0 
          ? `Mesures (${Object.keys(clientData.measurements).length}) : ${Object.entries(clientData.measurements).map(([k, v]) => `${k}: ${v}cm`).join(', ')}\n` 
          : '') +
        `Date : ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n` +
        `La fiche client et ses mesures ont été enregistrées avec succès dans votre atelier. 🧵✂️`;

      let cleaned = managerPhone.replace(/[^0-9]/g, '');
      if (cleaned.length === 9 && cleaned.startsWith('7')) {
        cleaned = '221' + cleaned;
      }
      const waUrl = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');
    }

    // 2. E-mail Channel
    if (managerEmail && managerEmail.trim()) {
      try {
        const mailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b; background-color: #ffffff;">
            <div style="background-color: #0f172a; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <h2 style="margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 1px;">${merchant.name || 'Atelier de Couture'}</h2>
              <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.9;">Suivi d'Activité Gérant en Temps Réel</p>
            </div>

            <div style="margin-top: 20px;">
              <h3 style="color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 5px; margin-bottom: 15px;">👤 Fiche Client & Mesures Enregistrées</h3>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 150px;"><strong>Client :</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #0f172a;">${clientData.firstName || ''} ${clientData.lastName || ''}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Téléphone Client :</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${clientData.phone || 'Non renseigné'}</td>
                </tr>
                ${clientData.email ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Email Client :</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">${clientData.email}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Vêtement / Modèle :</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold;">${clientData.preferredGarment || clientData.garmentName || 'Sur-mesure'}</td>
                </tr>
                ${clientData.measurements && Object.keys(clientData.measurements).length > 0 ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;" valign="top"><strong>Mesures (cm) :</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <ul style="margin: 0; padding-left: 20px;">
                      ${Object.entries(clientData.measurements).map(([k, v]) => `<li style="margin: 2px 0;"><strong>${k} :</strong> ${v} cm</li>`).join('')}
                    </ul>
                  </td>
                </tr>
                ` : ''}
                ${clientData.notes ? `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Notes :</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-style: italic;">"${clientData.notes}"</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0; color: #64748b;"><strong>Date d'enregistrement :</strong></td>
                  <td style="padding: 8px 0;">${format(new Date(), 'dd/MM/yyyy HH:mm')}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8;">
              Ce rapport automatique a été envoyé en arrière-plan sans action requise de l'opérateur.<br/>
              <strong>Système de Suivi SaaS ${merchant.name || 'ACOM'}</strong>.
            </div>
          </div>
        `;

        const response = await sendEmailDirectlyOrViaBackend({
          to: managerEmail,
          from: merchant.managerNotifications?.emailFrom || undefined,
          subject: `👤 [NOUVEAU CLIENT] Fiche & Mesures de ${clientData.firstName || ''} ${clientData.lastName || ''} - ${merchant.name || 'Atelier'}`,
          html: mailHtml
        }, {
          resendApiKey: merchant.managerNotifications?.resendApiKey,
          defaultFrom: merchant.managerNotifications?.emailFrom
        });

        const resData = await response.json().catch(() => null);
        if (response.ok && resData?.success !== false) {
          // Background email sent successfully
        }
      } catch (err) {
        console.error("Erreur d'envoi de l'email gérant :", err);
      }
    }
  };

  const handleRequestDelete = (client: any) => {
    if (!client || !client.id) return;
    try {
      const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      const ordersList = savedOrders ? JSON.parse(savedOrders) : [];
      const count = ordersList.filter((o: any) => o.clientId === client.id && !o.isDeleted).length;
      setClientOrdersCount(count);
    } catch (e) {
      setClientOrdersCount(0);
    }
    setClientToDelete(client);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      const id = clientToDelete.id;
      const target = clients.find(c => c.id === id);
      if (target) {
        let updatedClients;
        if (target.syncStatus === 'synced') {
          updatedClients = clients.map(c => c.id === id ? { ...c, isDeleted: true, syncStatus: 'pending', updatedAt: new Date().toISOString() } : c);
        } else {
          updatedClients = clients.filter(c => c.id !== id);
        }
        saveClients(updatedClients);

        // Nettoyage des commandes associées si nécessaire
        if (clientOrdersCount > 0) {
          try {
            const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
            if (savedOrders) {
              const ordersList = JSON.parse(savedOrders);
              const updatedOrders = ordersList.map((o: any) => {
                if (o.clientId === id) {
                  return { ...o, isDeleted: true, syncStatus: 'pending', updatedAt: new Date().toISOString() };
                }
                return o;
              });
              localStorage.setItem(`tailleur_orders_${merchant.id}`, JSON.stringify(updatedOrders));
            }
          } catch (err) {
            console.error("Erreur lors de la suppression des commandes associées au client :", err);
          }
        }

        triggerAcomAlert('Client Supprimé', `Client "${target.firstName || ''} ${target.lastName || ''}" supprimé avec succès !`, 'success', 'CLIENTS');
        await triggerSync();
      }
    } catch (e) {
      console.error("Erreur suppression client :", e);
      toast.error("Échec de la suppression du client.");
    } finally {
      setIsDeleting(false);
      setClientToDelete(null);
      setClientOrdersCount(0);
    }
  };

  const exportClientsToCSV = () => {
    try {
      const activeClients = clients.filter(c => !c.isDeleted);
      if (activeClients.length === 0) {
        toast.error("Aucun client à exporter");
        return;
      }

      let csvContent = "\uFEFF";
      csvContent += "Prénom,Nom,Téléphone,Email,Genre,Adresse,Tour de Cou (cm),Tour de Poitrine (cm),Épaule à Épaule (cm),Longueur Manche (cm),Tour de Bras (cm),Tour de Taille (cm),Tour de Hanches (cm),Longueur Pantalon (cm),Tour de Cuisse (cm),Longueur Grand Boubou (cm),Notes,Date de Création\n";

      activeClients.forEach(c => {
        const m = c.measurements || {};
        const row = [
          c.firstName || '',
          c.lastName || '',
          c.phone || '',
          c.email || '',
          c.gender || '',
          (c.address || '').replace(/"/g, '""'),
          m.cou || '',
          m.poitrine || '',
          m.epaule || '',
          m.manche || '',
          m.tourBras || '',
          m.taille || '',
          m.hanches || '',
          m.pantalon || '',
          m.cuisse || '',
          m.boubou || '',
          (c.notes || '').replace(/"/g, '""'),
          c.createdAt || ''
        ].map(val => `"${String(val).replace(/\n/g, ' ')}"`).join(",");
        csvContent += row + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Mesures_Clients_Couture_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerAcomAlert('Export Réussi', 'Listing des mesures exporté avec succès (Excel CSV)', 'success', 'EXPORT');
    } catch (error) {
      console.error(error);
      toast.error("Échec de l'export Excel CSV");
    }
  };

  const exportClientsToPDF = () => {
    const activeClients = clients.filter(c => !c.isDeleted);
    if (activeClients.length === 0) {
      toast.error("Aucun client à exporter");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Veuillez autoriser les fenêtres pop-up pour générer le PDF");
      return;
    }

    const html = `
      <html>
        <head>
          <title>Fiches de Mesures Clients - ${merchant.name}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; padding: 40px; }
            h1 { font-size: 24px; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; letter-spacing: -0.5px; }
            .header-info { font-size: 11px; font-family: monospace; color: #64748b; text-transform: uppercase; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
            .client-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
            .client-header { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 10px; }
            .client-name { font-size: 16px; font-weight: bold; color: #7c3aed; }
            .client-contact { font-size: 12px; color: #64748b; font-family: monospace; }
            .measures-grid { display: grid; grid-template-cols: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
            .measure-item { background: #f8fafc; border: 1px solid #f1f5f9; padding: 8px; border-radius: 8px; text-align: center; }
            .measure-label { font-size: 8px; font-weight: bold; color: #94a3b8; text-transform: uppercase; display: block; }
            .measure-value { font-size: 12px; font-weight: 900; font-family: monospace; color: #0f172a; margin-top: 2px; display: block; }
            .notes { font-size: 11px; color: #475569; background: #fafafa; padding: 10px; border-radius: 8px; border-left: 3px solid #7c3aed; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Listing des Mesures Clients</h1>
          <div class="header-info">Atelier : ${merchant.name} | Date : ${new Date().toLocaleDateString('fr-FR')} | Clients Couture : ${activeClients.length}</div>
          
          ${activeClients.map(c => {
            const m = c.measurements || {};
            return `
              <div class="client-card">
                <div class="client-header">
                  <div class="client-name">${c.firstName} ${c.lastName} (${c.gender === 'F' ? 'Femme' : 'Homme'})</div>
                  <div class="client-contact">${c.phone || 'Pas de numéro'} ${c.email ? `| ${c.email}` : ''}</div>
                </div>
                <div class="measures-grid">
                  <div class="measure-item"><span class="measure-label">Cou</span><span class="measure-value">${m.cou ? `${m.cou} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Poitrine</span><span class="measure-value">${m.poitrine ? `${m.poitrine} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Épaule</span><span class="measure-value">${m.epaule ? `${m.epaule} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Manche</span><span class="measure-value">${m.manche ? `${m.manche} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Tour de Bras</span><span class="measure-value">${m.tourBras ? `${m.tourBras} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Taille</span><span class="measure-value">${m.taille ? `${m.taille} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Hanches</span><span class="measure-value">${m.hanches ? `${m.hanches} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Longueur Pantalon</span><span class="measure-value">${m.pantalon ? `${m.pantalon} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Cuisse</span><span class="measure-value">${m.cuisse ? `${m.cuisse} cm` : '—'}</span></div>
                  <div class="measure-item"><span class="measure-label">Grand Boubou</span><span class="measure-value">${m.boubou ? `${m.boubou} cm` : '—'}</span></div>
                </div>
                ${c.notes ? `<div class="notes"><strong>Notes de l'atelier :</strong> ${c.notes}</div>` : ''}
              </div>
            `;
          }).join('')}
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

  const filteredClients = clients
    .filter(c => !c.isDeleted)
    .filter(c => 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
      (c.phone && c.phone.includes(search))
    );

  const MEASUREMENT_LABELS: Record<string, string> = {
    cou: 'Tour de Cou (cm)',
    poitrine: 'Tour de Poitrine (cm)',
    epaule: 'Épaule à Épaule (cm)',
    manche: 'Longueur Manche (cm)',
    tourBras: 'Tour de Bras (cm)',
    taille: 'Tour de Taille (cm)',
    hanches: 'Tour de Hanches (cm)',
    pantalon: 'Longueur Pantalon / Jupe (cm)',
    cuisse: 'Tour de Cuisse (cm)',
    boubou: 'Longueur Grand Boubou (cm)'
  };

  const initialClientState = {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    gender: 'M',
    preferredGarment: 'Ensemble Africain 2 Pièces (Chemise & Pantalon)',
    garmentId: 'garment-ensemble-africain',
    garmentName: 'Ensemble Africain 2 Pièces (Chemise & Pantalon)',
    category: 'Couture Africaine',
    measurements: {
      cou: '',
      poitrine: '',
      epaule: '',
      manche: '',
      tourBras: '',
      taille: '',
      hanches: '',
      pantalon: '',
      cuisse: '',
      boubou: ''
    },
    notes: ''
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-ink">Fichier Clients Couture</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Clients actifs : {filteredClients.length.toString().padStart(3, '0')}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => triggerSync(true)}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sinc...' : 'Sync 🔄'}</span>
          </button>

          <button
            onClick={exportClientsToCSV}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Excel / CSV 📊</span>
          </button>

          <button
            onClick={exportClientsToPDF}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF / Imprimer 🖨️</span>
          </button>

          <button 
            onClick={() => {
              setCurrentClient(null);
              setIsSmartAssistantOpen(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 hover:scale-[1.02] transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Client</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-left">
        <Search className="w-5 h-5 text-gray-400 shrink-0 ml-1" />
        <input 
          type="text" 
          placeholder="Rechercher par nom, prénom ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full text-sm text-slate-700 bg-transparent outline-none font-medium placeholder-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>



      {/* Liste des Clients */}
      {filteredClients.length === 0 ? (
        <div className="bg-white py-16 text-center rounded-[2rem] border border-gray-150 shadow-sm flex flex-col items-center justify-center text-left">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4 border border-violet-100">
            <Users className="w-8 h-8 text-violet-400" />
          </div>
          <p className="text-gray-500 font-bold mb-1">Aucun client trouvé</p>
          <p className="text-xs text-gray-400">Ajoutez des clients pour stocker leurs mesures de couture métriques.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredClients.map((client) => (
            <TailorCard key={client.id}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${client.gender === 'F' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                      {client.gender === 'F' ? '🚺' : '🚹'}
                    </div>
                    <div>
                      <h3 className="font-black text-ink text-lg leading-tight">{client.firstName} {client.lastName}</h3>
                      <p className="text-xs text-gray-400 font-medium">Modifié le {format(new Date(client.updatedAt), 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                  </div>

                  <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl">
                    <button 
                      onClick={() => {
                        const resolved = GarmentResolverService.resolveClientGarment(client, merchant.id);
                        setCurrentClient({
                          ...client,
                          preferredGarment: resolved.garmentName,
                          garmentId: resolved.definition.id,
                          garmentName: resolved.garmentName,
                          category: resolved.definition.category
                        });
                        setIsSmartAssistantOpen(true);
                      }}
                      className="p-1.5 hover:bg-white hover:text-violet-600 hover:shadow-sm text-gray-500 rounded-lg transition-transform cursor-pointer"
                      title="Modifier la Fiche Client"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleRequestDelete(client);
                      }}
                      className="p-1.5 hover:bg-rose-50 hover:text-red-600 hover:shadow-sm text-gray-500 rounded-lg transition-transform cursor-pointer relative z-10"
                      title="Supprimer la fiche client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  {client.phone && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-1.5 font-medium col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <GarmentProfileCard
                    clientData={client}
                    merchantId={merchant.id}
                    onOpenSmartAssistant={() => {
                      setCurrentClient(client);
                      setIsSmartAssistantOpen(true);
                    }}
                  />
                </div>
              </div>
            </TailorCard>
          ))}
        </div>
      )}

      {/* Modal Assistant de Mesures Intelligent - Processus unifié 5 Étapes */}
      {isSmartAssistantOpen && (
        <SmartMeasurementAssistant
          merchantId={merchant.id}
          initialClientData={currentClient}
          isOpen={isSmartAssistantOpen}
          onClose={() => {
            setIsSmartAssistantOpen(false);
            setCurrentClient(null);
          }}
          onSaveClient={(savedClient) => {
            let updatedList = [...clients];
            const existingIndex = updatedList.findIndex((c) => c.id === savedClient.id);
            if (existingIndex >= 0) {
              updatedList[existingIndex] = savedClient;
            } else {
              updatedList = [savedClient, ...updatedList];
            }
            setClients(updatedList);
            saveClients(updatedList);
            setIsSmartAssistantOpen(false);
            setCurrentClient(null);
            triggerAcomAlert(
              'Fiche Client Validée — E-mail & WhatsApp',
              'La fiche client et les mesures ont été enregistrées avec succès et le rapport transmis par e-mail au Gérant. Une fenêtre WhatsApp est ouverte pour permettre son envoi également via WhatsApp.',
              'success',
              'RÉCEPTION'
            );
            notifyManagerClientSaved(savedClient);
          }}
        />
      )}

      {/* Modal de confirmation de suppression moderne */}
      <TailorDeleteConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => {
          setClientToDelete(null);
          setClientOrdersCount(0);
        }}
        onConfirm={confirmDeleteClient}
        title="Supprimer la fiche client ?"
        entityName={clientToDelete ? `${clientToDelete.firstName || ''} ${clientToDelete.lastName || ''}`.trim() : ''}
        activeOrdersCount={clientOrdersCount}
        warningText="Cette action est irréversible. Toutes les mesures enregistrées seront supprimées."
        isDeleting={isDeleting}
      />
    </motion.div>
  );
};