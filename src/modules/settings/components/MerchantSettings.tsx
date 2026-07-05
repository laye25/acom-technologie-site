import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Loader2, Store, Printer, HardDrive, Database, CheckCircle, Upload, MapPin, AlertCircle, Zap, Download, MessageSquare, Settings } from 'lucide-react';
import { dbService } from '../../../services/dbService';
import { syncService } from '../../../services/syncService';
import { Merchant } from '../../../types';
import { triggerAcomAlert } from '../../../components/AcomAlertEventProvider';
import { db } from '../../../db/db';
// removed sqliteService import
import toast from 'react-hot-toast';

const MerchantSettings = ({ 
  merchant, 
  onUpdate, 
  setActiveTab 
}: { 
  merchant: Merchant, 
  onUpdate: (m: Merchant) => void, 
  setActiveTab: (tab: string) => void 
}) => {
  const [formData, setFormData] = useState(() => {
    const data = { ...merchant };
    if (!data.managerNotifications) {
      data.managerNotifications = {};
    }
    return data;
  });
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
      triggerAcomAlert('Succès', 'Données exportées avec succès', 'success', 'SYSTÈME');
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de l\'exportation', 'error', 'ALERTE');
    } finally {
      setIsExporting(false);
    }
  };

  const [isExportingSQLite, setIsExportingSQLite] = useState(false);
  const [isBackupSaving, setIsBackupSaving] = useState(false);

  const handleExportSQLiteDB = async () => {
    setIsExportingSQLite(true);
    try {
      const { exportSQLiteDB } = await import('../../../services/sqliteService');
      const blob = await exportSQLiteDB(merchant.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `acom-studio-${merchant.id}-${new Date().toISOString().split('T')[0]}.sqlite3`;
        link.click();
        triggerAcomAlert('Succès', 'Base SQLite exportée avec succès', 'success', 'SYSTÈME');
      } else {
        triggerAcomAlert('Erreur', 'Impossible de générer le fichier SQLite', 'error', 'ALERTE');
      }
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de l\'exportation de la base SQLite', 'error', 'ALERTE');
    } finally {
      setIsExportingSQLite(false);
    }
  };

  const handleForceBackup = async () => {
    setIsBackupSaving(true);
    try {
      const { populateSQLiteFromDexie, syncPhysicalFile } = await import('../../../services/sqliteService');
      await populateSQLiteFromDexie(merchant.id);
      await syncPhysicalFile();
      triggerAcomAlert('Succès', 'Sauvegarde physique effectuée avec succès', 'success', 'SYSTÈME');
    } catch (error) {
      console.error('Manual backup error:', error);
      triggerAcomAlert('Erreur', 'Impossible d\'effectuer la sauvegarde physique', 'error', 'ALERTE');
    } finally {
      setIsBackupSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Voulez-vous vraiment vider le cache local ? Cela ne supprimera pas vos données sur le Cloud, mais nécessitera une nouvelle synchronisation.')) {
      try {
        await db.sales.clear();
        await db.products.clear();
        await db.expenses.clear();
        localStorage.clear();
        triggerAcomAlert('Succès', 'Cache vidé. L\'application va redémarrer.', 'success', 'SYSTÈME');
        window.location.reload();
      } catch (error) {
        triggerAcomAlert('Erreur', 'Erreur lors du nettoyage', 'error', 'ALERTE');
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.merchants.save({ ...formData, updatedAt: new Date() } as any);
      onUpdate(formData);
      triggerAcomAlert('Succès', 'Réglages mis à jour', 'success', 'SYSTÈME');
    } catch (error) {
      triggerAcomAlert('Erreur', 'Erreur lors de la mise à jour', 'error', 'ALERTE');
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
      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-black/5 shadow-xl mb-12">
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
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-emerald-100 shrink-0">
                <HardDrive className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-ink uppercase tracking-wider">Mode Local-First (Optimisé)</h4>
                <p className="text-xs text-emerald-800/70 mt-2 leading-relaxed break-words">
                  Studio Acom enregistre automatiquement chaque transaction dans la mémoire locale (IndexedDB) de votre ordinateur. 
                  Cela garantit une rapidité maximale et vous permet de travailler <b>sans limites de quota Cloud</b> même avec une connexion lente.
                </p>
                
                {merchant.licenseType === 'local' ? (
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start sm:items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wide min-w-0 flex-1 break-words">
                      Mode "Local Uniquement" activé. La synchronisation Cloud est désactivée.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start sm:items-center gap-3">
                    <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-[10px] text-blue-800 font-bold uppercase tracking-wide min-w-0 flex-1 break-words">
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

      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-black/5 shadow-xl mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-ink">Suivi Gérant (Temps Réel)</h3>
            <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mt-1">Configuration WhatsApp & E-mail (Clôture / POS)</p>
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
            <MessageSquare className="w-7 h-7 text-indigo-600" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-[2rem] p-8 border border-black/5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">WhatsApp Gérant (avec indicatif)</label>
              <input
                type="text"
                value={formData.managerNotifications?.whatsappPhone || ''}
                onChange={e => setFormData({
                  ...formData,
                  managerNotifications: { ...(formData.managerNotifications || {}), whatsappPhone: e.target.value }
                })}
                placeholder="ex: +221771234567"
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-ink focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">E-mail Gérant (Destinataire)</label>
              <input
                type="email"
                value={formData.managerNotifications?.email || ''}
                onChange={e => setFormData({
                  ...formData,
                  managerNotifications: { ...(formData.managerNotifications || {}), email: e.target.value }
                })}
                placeholder="gerant@boutique.com"
                className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-ink focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <label className="flex items-center p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={formData.managerNotifications?.notifyOnCashClosure !== false}
                onChange={e => setFormData({
                  ...formData,
                  managerNotifications: { ...(formData.managerNotifications || {}), notifyOnCashClosure: e.target.checked }
                })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <div className="ml-4">
                <p className="font-bold text-ink text-sm">Clôture de Caisse</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">Notifier automatiquement</p>
              </div>
            </label>

            <label className="flex items-center p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-indigo-300 transition-colors">
              <input
                type="checkbox"
                checked={formData.managerNotifications?.notifyOnPOSSale !== false}
                onChange={e => setFormData({
                  ...formData,
                  managerNotifications: { ...(formData.managerNotifications || {}), notifyOnPOSSale: e.target.checked }
                })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <div className="ml-4">
                <p className="font-bold text-ink text-sm">Vente Caisse POS</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-mono">Notifier automatiquement</p>
              </div>
            </label>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 flex items-center justify-center space-x-2 bg-indigo-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Sauvegarder les alertes</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-black/5 shadow-xl mb-12">
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

      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-black/5 shadow-xl">
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
          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4 w-full min-w-0">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest truncate">Type de SaaS</p>
                <p className="font-black text-ink capitalize text-lg truncate">{merchant.type}</p>
              </div>
            </div>
            <div className="flex items-center text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 uppercase tracking-widest shrink-0 self-start sm:self-auto">
              <AlertCircle className="w-3 h-3 mr-1.5 shrink-0" />
              Fixe
            </div>
          </div>

          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4 w-full min-w-0">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest truncate">Forfait Actuel</p>
                <p className="font-black text-ink text-lg truncate">{merchant.plan || 'FREE'}</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="text-[9px] font-black text-primary hover:bg-primary hover:text-white transition-all bg-primary/10 px-4 py-2 rounded-full uppercase tracking-widest shrink-0 self-start sm:self-auto"
            >
              Améliorer
            </button>
          </div>
          <div className="p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4 w-full min-w-0">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-black/5 group-hover:scale-110 transition-transform">
                {formData.licenseType === 'cloud' ? <Database className="w-6 h-6 text-blue-500" /> : <HardDrive className="w-6 h-6 text-emerald-500" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest truncate">Type de Licence</p>
                <select 
                  value={formData.licenseType || 'cloud'}
                  onChange={(e) => setFormData({ ...formData, licenseType: e.target.value as any })}
                  className="font-black text-ink bg-transparent border-none p-0 focus:ring-0 text-lg cursor-pointer truncate block w-full"
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

            {formData.type === 'scolaire' && (
              <div className="md:col-span-2 pt-6 border-t border-gray-100 mt-2">
                 <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-3">Paramétrage des Périodes Scolaires</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <select 
                        value={formData.academicPeriodType || 'trimestriel'}
                        onChange={e => {
                          const type = e.target.value as any;
                          let periods = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3'];
                          if (type === 'semestriel') periods = ['Semestre 1', 'Semestre 2'];
                          if (type === 'bimestriel') periods = ['Bimestre 1', 'Bimestre 2', 'Bimestre 3', 'Bimestre 4', 'Bimestre 5'];
                          setFormData({...formData, academicPeriodType: type, academicPeriods: periods});
                        }}
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-medium"
                      >
                        <option value="trimestriel">Trimestriel (3 bulletins)</option>
                        <option value="semestriel">Semestriel (2 bulletins)</option>
                        <option value="bimestriel">Bimestriel (5 bulletins)</option>
                      </select>
                      <p className="text-xs text-gray-400 mt-2">Sélectionnez le rythme d'évaluation officiel de l'établissement (par défaut: 3 Trimestres).</p>
                   </div>
                 </div>
              </div>
            )}
          </div>
          
          <div className="pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving} 
              className="w-full py-5 bg-ink text-white rounded-[1.5rem] font-black text-xs md:text-sm uppercase tracking-widest md:tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center shadow-2xl shadow-black/20 active:scale-[0.98]"
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5 mr-3 shrink-0" /> <span>Enregistrer les modifications</span></>}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
export default MerchantSettings;
