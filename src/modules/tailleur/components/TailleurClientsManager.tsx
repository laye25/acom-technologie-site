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
    RefreshCw, FileText, Printer, Plus, Scissors, Users, Edit2
} from 'lucide-react';

export const TailleurClientsManager = ({ merchant }: { merchant: Merchant }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<any>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient.firstName || !currentClient.lastName) {
      toast.error('Veuillez saisir le prénom et le nom');
      return;
    }

    let updated;
    if (currentClient.id) {
      updated = clients.map(c => c.id === currentClient.id ? { ...currentClient, syncStatus: 'pending', updatedAt: new Date().toISOString() } : c);
      toast.success('Fiche client mise à jour');
    } else {
      const newCl = {
        ...currentClient,
        id: crypto.randomUUID(),
        syncStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      updated = [newCl, ...clients];
      toast.success('Nouveau client enregistré');
    }
    saveClients(updated);
    setIsFormOpen(false);
    setCurrentClient(null);
    triggerSync();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce client ? Toutes ses mesures seront perdues.')) {
      const target = clients.find(c => c.id === id);
      let updated;
      if (target) {
        if (target.syncStatus === 'synced') {
          updated = clients.map(c => c.id === id ? { ...c, isDeleted: true, syncStatus: 'pending', updatedAt: new Date().toISOString() } : c);
        } else {
          updated = clients.filter(c => c.id !== id);
        }
        saveClients(updated);
        toast.success('Fiche client supprimée');
        triggerSync();
      }
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
      toast.success("Listing des mesures exporté avec succès (Excel CSV)");
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
              setCurrentClient(initialClientState);
              setIsFormOpen(true);
            }}
            className="flex-1 lg:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 hover:scale-[1.02] transition"
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

      {isFormOpen && currentClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-violet-50/55 shrink-0">
              <div className="text-left">
                <h3 className="text-xl font-black text-ink">{currentClient.id ? 'Modifier la Fiche Client' : 'Nouvelle Fiche Client'}</h3>
                <p className="text-[10px] font-mono text-violet-600 uppercase tracking-widest mt-0.5">Enregistrement des détails et mesures</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-gray-200/50 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Column des inputs */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Informations Générales */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-violet-600 uppercase tracking-wider border-b border-violet-100 pb-1">1. Informations Générales</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Prénom *</label>
                    <input 
                      type="text" 
                      required
                      value={currentClient.firstName}
                      onChange={e => setCurrentClient({ ...currentClient, firstName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Nom de Famille *</label>
                    <input 
                      type="text" 
                      required
                      value={currentClient.lastName}
                      onChange={e => setCurrentClient({ ...currentClient, lastName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Genre</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setCurrentClient({ ...currentClient, gender: 'M' })}
                        className={`py-2 px-3 border rounded-xl text-center text-xs font-bold transition-all ${currentClient.gender === 'M' ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 text-gray-600'}`}
                      >
                        Homme
                      </button>
                      <button 
                        type="button"
                        onClick={() => setCurrentClient({ ...currentClient, gender: 'F' })}
                        className={`py-2 px-3 border rounded-xl text-center text-xs font-bold transition-all ${currentClient.gender === 'F' ? 'bg-violet-600 border-violet-600 text-white' : 'border-gray-200 text-gray-600'}`}
                      >
                        Femme
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Téléphone</label>
                    <input 
                      type="tel" 
                      value={currentClient.phone || ''}
                      onChange={e => setCurrentClient({ ...currentClient, phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Adresse E-mail</label>
                    <input 
                      type="email" 
                      value={currentClient.email || ''}
                      onChange={e => setCurrentClient({ ...currentClient, email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Adresse Physique</label>
                    <input 
                      type="text" 
                      value={currentClient.address || ''}
                      onChange={e => setCurrentClient({ ...currentClient, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Mesures Couture */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-violet-600 uppercase tracking-wider border-b border-violet-100 pb-1">2. Mesures d'Atelier (en cm)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {Object.keys(MEASUREMENT_LABELS).map((key) => {
                    const isFocused = focusedField === key;
                    return (
                      <div key={key} className="transition-all">
                        <label className={`block text-[11px] font-bold mb-1 truncate text-ellipsis transition-colors ${isFocused ? 'text-violet-600 font-black scale-105' : 'text-gray-500'}`}>{MEASUREMENT_LABELS[key]}</label>
                        <input 
                          type="number" 
                          step="0.5"
                          placeholder="Néant"
                          value={currentClient.measurements?.[key] || ''}
                          onFocus={() => setFocusedField(key)}
                          onBlur={() => setFocusedField(null)}
                          onChange={e => setCurrentClient({
                            ...currentClient,
                            measurements: {
                              ...currentClient.measurements,
                              [key]: e.target.value
                            }
                          })}
                          className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-mono font-bold text-center text-sm transition-all ${isFocused ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/50 scale-105' : 'border-slate-200 bg-white'}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes complémentaires */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-600">Notes & Exigences Particulières (Styles préférés, allergies de tissu, etc.)</label>
                <textarea 
                  rows={3}
                  value={currentClient.notes || ''}
                  onChange={e => setCurrentClient({ ...currentClient, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none font-medium text-sm"
                  placeholder="Ex : Préfère des ourlets invisibles, aime les coupes cintrées, etc."
                />
              </div>
            </div>

            {/* Mannequin Interactif et Visualisation de Mesure */}
            <div className="lg:col-span-4 bg-slate-50/70 border border-slate-100 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="border-b border-violet-100 pb-2">
                  <h4 className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5" /> Guide des Mesures
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Silhouette d'atelier dynamique ({currentClient.gender === 'F' ? 'Femme' : 'Homme'})</p>
                </div>

                <div className="relative w-full h-[280px] bg-white rounded-2xl border border-slate-100 flex items-center justify-center p-4 overflow-hidden shadow-sm">
                  {/* SVG Silhouette */}
                  <svg viewBox="0 0 200 300" className="w-full h-full max-w-[160px] text-slate-300 transition-all duration-300">
                    {/* Head & Neck */}
                    <circle cx="100" cy="30" r="14" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M96 44 L96 52 M104 44 L104 52" stroke="currentColor" strokeWidth="2" />
                    
                    {/* Body Silhouette */}
                    {currentClient.gender === 'F' ? (
                      <path d="M80 55 C80 55, 65 65, 65 80 C65 95, 75 110, 75 125 C75 135, 70 145, 70 160 L78 260 L92 260 L96 170 L104 170 L108 260 L122 260 L130 160 C130 145, 125 135, 125 125 C125 110, 135 95, 135 80 C135 65, 120 55, 120 55 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    ) : (
                      <path d="M72 55 C72 55, 60 62, 60 80 C60 100, 70 120, 70 135 C70 145, 68 155, 68 175 L76 260 L92 260 L96 170 L104 170 L108 260 L124 260 L132 175 C132 155, 130 145, 130 135 C130 120, 140 100, 140 80 C140 62, 128 55, 128 55 Z" fill="none" stroke="currentColor" strokeWidth="2" />
                    )}

                    {/* Arms */}
                    <path d="M65 80 L52 140" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M135 80 L148 140" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

                    {/* Highlighted lines or hotspots */}
                    {/* Tour de Cou */}
                    <ellipse cx="100" cy="49" rx="8" ry="3" fill="none" stroke={focusedField === 'cou' ? '#7c3aed' : 'transparent'} strokeWidth="2.5" className="transition-all" />
                    {focusedField === 'cou' && <circle cx="100" cy="49" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Épaule à Épaule */}
                    <path d="M72 56 L128 56" stroke={focusedField === 'epaule' ? '#7c3aed' : 'transparent'} strokeWidth="3" className="transition-all" strokeLinecap="round" />
                    {focusedField === 'epaule' && <circle cx="100" cy="56" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Tour de Poitrine */}
                    <ellipse cx="100" cy="80" rx="28" ry="6" fill="none" stroke={focusedField === 'poitrine' ? '#7c3aed' : 'transparent'} strokeWidth="2.5" className="transition-all" />
                    {focusedField === 'poitrine' && <circle cx="100" cy="80" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Longueur Manche */}
                    <path d="M135 80 L148 140" stroke={focusedField === 'manche' ? '#7c3aed' : 'transparent'} strokeWidth="3.5" className="transition-all" strokeLinecap="round" />
                    {focusedField === 'manche' && <circle cx="141" cy="110" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Tour de Bras */}
                    <ellipse cx="140" cy="98" rx="8" ry="4" fill="none" stroke={focusedField === 'tourBras' ? '#7c3aed' : 'transparent'} strokeWidth="2.5" className="transition-all" transform="rotate(-15 140 98)" />
                    {focusedField === 'tourBras' && <circle cx="140" cy="98" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Tour de Taille */}
                    <ellipse cx="100" cy="120" rx="24" ry="5" fill="none" stroke={focusedField === 'taille' ? '#7c3aed' : 'transparent'} strokeWidth="2.5" className="transition-all" />
                    {focusedField === 'taille' && <circle cx="100" cy="120" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Tour de Hanches */}
                    <ellipse cx="100" cy="142" rx="27" ry="5.5" fill="none" stroke={focusedField === 'hanches' ? '#7c3aed' : 'transparent'} strokeWidth="2.5" className="transition-all" />
                    {focusedField === 'hanches' && <circle cx="100" cy="142" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Longueur Pantalon */}
                    <path d="M115 145 L115 250" stroke={focusedField === 'pantalon' ? '#7c3aed' : 'transparent'} strokeWidth="3" className="transition-all" strokeLinecap="round" />
                    {focusedField === 'pantalon' && <circle cx="115" cy="195" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Tour de Cuisse */}
                    <ellipse cx="85" cy="170" rx="11" ry="4" fill="none" stroke={focusedField === 'cuisse' ? '#7c3aed' : 'transparent'} strokeWidth="2.5" className="transition-all" />
                    {focusedField === 'cuisse' && <circle cx="85" cy="170" r="4" className="fill-violet-600 animate-ping" />}

                    {/* Longueur Grand Boubou */}
                    <path d="M100 55 L100 255" stroke={focusedField === 'boubou' ? '#7c3aed' : 'transparent'} strokeWidth="3" className="transition-all" strokeLinecap="round" strokeDasharray="3 3" />
                    {focusedField === 'boubou' && <circle cx="100" cy="155" r="4" className="fill-violet-600 animate-ping" />}
                  </svg>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-100 min-h-[90px] flex flex-col justify-center text-left">
                  <span className="text-[10px] font-mono font-bold text-violet-600 uppercase tracking-widest mb-1">
                    {focusedField ? MEASUREMENT_LABELS[focusedField] : "Sélectionnez une mesure"}
                  </span>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {focusedField === 'cou' && "Mesurez la circonférence de la base du cou sans trop serrer."}
                    {focusedField === 'poitrine' && "Mesurez horizontalement au niveau le plus large du torse ou de la poitrine."}
                    {focusedField === 'epaule' && "Mesurez dans le dos, d'un os saillant de l'épaule à l'autre."}
                    {focusedField === 'manche' && "Longueur du haut de l'épaule jusqu'à la limite souhaitée de la manche."}
                    {focusedField === 'tourBras' && "Circonférence du biceps au point le plus volumineux."}
                    {focusedField === 'taille' && "Mesurez la circonférence de la taille naturelle (environ 2 cm au-dessus du nombril)."}
                    {focusedField === 'hanches' && "Mesurez la circonférence au niveau le plus large du fessier."}
                    {focusedField === 'pantalon' && "Longueur de la taille jusqu'à l'ourlet du bas de la cheville."}
                    {focusedField === 'cuisse' && "Tour de la cuisse à l'endroit le plus fort, sous l'entrejambe."}
                    {focusedField === 'boubou' && "Longueur totale pour un grand boubou, mesurée du haut de l'épaule jusqu'au sol."}
                    {!focusedField && "Cliquez sur l'un des champs de mesure pour voir l'aide d'atelier s'afficher ici."}
                  </p>
                </div>
              </div>

              <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100/50 text-left">
                <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest block mb-1">Rappel de Coupe</span>
                <p className="text-[10px] text-violet-700/80 leading-normal font-medium">Pour les tissus non extensibles (Bazin, Wax), prévoyez une marge d'aisance standard de 4 à 6 cm pour les vêtements amples.</p>
              </div>
            </div>
          </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-gray-150 hover:bg-gray-200 text-ink rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Enregistrer le Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
            <div key={client.id} className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
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
                        setCurrentClient(client);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 hover:bg-white hover:text-violet-600 hover:shadow-sm text-gray-500 rounded-lg transition-transform"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 hover:bg-white hover:text-red-600 hover:shadow-sm text-gray-500 rounded-lg transition-transform"
                      title="Supprimer"
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

                <div className="mt-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Scissors className="w-3 h-3 text-violet-500" /> Principales Mesures
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(MEASUREMENT_LABELS).slice(0, 6).map((key) => (
                      <div key={key} className="bg-white p-2 rounded-xl text-center border border-black/[0.02]">
                        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-widest">{key}</span>
                        <span className="font-mono text-xs font-black text-ink">{client.measurements?.[key] ? `${client.measurements[key]} cm` : '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};