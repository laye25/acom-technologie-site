import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Search, Edit2, AlertCircle, TrendingUp, Copy, CheckCircle2, CreditCard, Power, Lock, Unlock, Receipt, X, Calendar, MoreVertical, Layout, Settings as SettingsIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { db } from '../../db/db';
import { Merchant } from '../../types';
import { dbService } from '../../services/dbService';
import { payDunyaService } from '../../services/payDunyaService';
import toast from 'react-hot-toast';
import { format, subDays, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AcomSaaSManager = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState<string | null>(null);
  
  // Remplacé useFirestoreData par useLiveQuery pour la réactivité automatique via Dexie
  const merchants = useLiveQuery(() => db.merchants.toArray()) || [];
  const loading = merchants.length === 0; // Utilisation simplifiée du chargement

  const filteredMerchants = merchants.filter(merchant => 
    merchant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    merchant.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdatePlan = async (merchantId: string, newPlan: string) => {
    try {
      await dbService.merchants.save({ id: merchantId, plan: newPlan as any });
      toast.success('Le plan de la solution a été mis à jour.');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la mise à jour du plan.');
    }
  };

  const handleToggleStatus = async (merchant: Merchant) => {
    try {
      const newStatus = merchant.status === 'suspended' ? 'active' : 'suspended';
      await dbService.merchants.save({ id: merchant.id, status: newStatus });
      toast.success(`L'instance a été ${newStatus === 'active' ? 'réactivée' : 'suspendue'} avec succès.`);
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la modification du statut.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copié !', { icon: <Copy className="w-4 h-4 text-emerald-500" />});
  };

  const handleGeneratePaymentLink = async (merchant: Merchant) => {
    setIsGeneratingLink(merchant.id);
    try {
      const amount = merchant.plan === 'BASIC' ? 15000 : merchant.plan === 'STANDARD' ? 25000 : merchant.plan === 'PREMIUM' ? 45000 : 0;
      if (amount === 0) {
        toast.error('Le plan actuel est gratuit (TESTE).');
        return;
      }
      
      const link = await payDunyaService.createPaymentLink({
        amount,
        description: `Abonnement SaaS - Plan ${merchant.plan} pour ${merchant.name}`,
        orderId: merchant.id,
      });

      // Tentative d'ouverture automatique
      const win = window.open(link, '_blank');
      if (!win) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2 p-1">
              <span className="font-bold text-gray-900">Paiement prêt !</span>
              <p className="text-xs text-gray-500">Votre navigateur a bloqué l'ouverture automatique. Cliquez ci-dessous :</p>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => { navigator.clipboard.writeText(link); toast.dismiss(t.id); toast.success('Lien copié'); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Copier
                </button>
                <a href={link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-xl text-xs font-bold transition-colors text-center" onClick={() => toast.dismiss(t.id)}>
                  Ouvrir le paiement
                </a>
              </div>
            </div>
          ),
          { duration: 15000, position: 'top-center' }
        );
      } else {
        toast.success('Le lien de paiement a été ouvert dans un nouvel onglet.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération.');
    } finally {
      setIsGeneratingLink(null);
    }
  };

  // Mock payment history based on creation date and plan
  const getMockPaymentHistory = (merchant: Merchant) => {
    if (!merchant.createdAt) return [];
    
    const creationDate = merchant.createdAt?.seconds 
      ? new Date(merchant.createdAt.seconds * 1000)
      : new Date(merchant.createdAt);
      
    const history = [];
    const now = new Date();
    let currentPaymentDate = new Date(creationDate);

    // Initial setup/first month
    if (merchant.plan && merchant.plan !== 'FREE') {
       history.push({
         id: `PAY-${merchant.id.slice(0, 4)}-INIT`,
         date: new Date(currentPaymentDate),
         amount: merchant.plan === 'BASIC' ? 15000 : merchant.plan === 'STANDARD' ? 25000 : 45000,
         status: 'paid',
         description: `Abonnement ${merchant.plan} (Initial)`,
       });
    }

    // Add subsequent months up to now
    let monthsDiff = (now.getFullYear() - creationDate.getFullYear()) * 12 + now.getMonth() - creationDate.getMonth();
    
    if (monthsDiff > 0 && merchant.plan && merchant.plan !== 'FREE') {
      for (let i = 1; i <= Math.min(monthsDiff, 12); i++) { // Max 12 months history for ui
        currentPaymentDate = addMonths(new Date(creationDate), i);
        if (currentPaymentDate <= now) {
          history.push({
            id: `PAY-${merchant.id.slice(0, 4)}-${i}`,
            date: new Date(currentPaymentDate),
            amount: merchant.plan === 'BASIC' ? 15000 : merchant.plan === 'STANDARD' ? 25000 : 45000,
            status: 'paid',
            description: `Abonnement ${merchant.plan}`,
          });
        }
      }
    }

    return history.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Store className="w-6 h-6 mr-3 text-primary" />
            Souscriptions Acom SaaS
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gérez les souscriptions et les instances SaaS de vos clients.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une instance (nom, type)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Instance</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type / Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plan Actuel</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Création</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMerchants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Store className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p>Aucune instance SaaS trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredMerchants.map((merchant) => (
                  <motion.tr 
                    key={merchant.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-gray-50/50 transition-colors group ${merchant.status === 'suspended' ? 'opacity-60' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${merchant.status === 'suspended' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}`}>
                          {merchant.status === 'suspended' ? <Lock className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className={`font-bold ${merchant.status === 'suspended' ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-900'}`}>{merchant.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-gray-400">ID: {merchant.id.slice(0, 8)}</span>
                            <button onClick={() => copyToClipboard(merchant.id)} className="text-gray-400 hover:text-primary transition-colors">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wider">
                          {merchant.type || 'Standard'}
                        </span>
                        {merchant.status === 'suspended' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 uppercase tracking-wider">
                            Suspendu
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wider">
                            Actif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={merchant.plan || 'FREE'}
                        onChange={(e) => handleUpdatePlan(merchant.id, e.target.value)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 bg-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="FREE">TESTE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="STANDARD">STANDARD</option>
                        <option value="PREMIUM">PREMIUM</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {merchant.createdAt ? format(merchant.createdAt?.seconds ? new Date(merchant.createdAt.seconds * 1000) : new Date(merchant.createdAt), 'dd MMM yyyy', { locale: fr }) : '-'}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">
                          {merchant.createdAt ? format(merchant.createdAt?.seconds ? new Date(merchant.createdAt.seconds * 1000) : new Date(merchant.createdAt), 'HH:mm') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleGeneratePaymentLink(merchant)}
                          disabled={isGeneratingLink === merchant.id || merchant.plan === 'FREE'}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Générer un lien PayDunya"
                        >
                          {isGeneratingLink === merchant.id ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <LinkIcon className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedMerchant(merchant);
                            setShowHistoryModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Historique des paiements"
                        >
                          <Receipt className="w-5 h-5" />
                        </button>
                        
                        <button 
                          onClick={() => handleToggleStatus(merchant)}
                          className={`p-2 rounded-lg transition-colors ${
                            merchant.status === 'suspended' 
                              ? 'text-emerald-500 hover:bg-emerald-50' 
                              : 'text-rose-500 hover:bg-rose-50'
                          }`}
                          title={merchant.status === 'suspended' ? 'Réactiver l\'instance' : 'Suspendre l\'instance'}
                        >
                          {merchant.status === 'suspended' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <AnimatePresence>
        {showHistoryModal && selectedMerchant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100/60 bg-gray-50/50">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <CreditCard className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Historique des paiements</h2>
                    <p className="text-sm text-gray-500 font-medium">{selectedMerchant.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
                {selectedMerchant.plan === 'FREE' ? (
                   <div className="text-center py-12">
                     <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                     <h3 className="text-lg font-bold text-gray-900">Aucun paiement</h3>
                     <p className="text-gray-500 mt-2">Cette instance utilise actuellement le plan gratuit (TESTE).</p>
                   </div>
                ) : (
                  <div className="space-y-4">
                    {getMockPaymentHistory(selectedMerchant).length === 0 ? (
                       <div className="text-center py-12">
                         <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                         <p className="text-gray-500 mt-2">Aucun historique de paiement disponible.</p>
                       </div>
                    ) : (
                      getMockPaymentHistory(selectedMerchant).map((payment, index) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                           <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                               <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                             </div>
                             <div>
                               <p className="font-bold text-gray-900 text-sm">{payment.description}</p>
                               <div className="flex items-center gap-2 mt-1">
                                 <Calendar className="w-3 h-3 text-gray-400" />
                                 <span className="text-xs text-gray-500">
                                   {format(payment.date, 'dd MMMM yyyy', { locale: fr })}
                                 </span>
                                 <span className="text-[10px] uppercase font-mono text-gray-400 ml-2">
                                  REF: {payment.id}
                                 </span>
                               </div>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className="font-black text-gray-900 font-mono">
                               {payment.amount.toLocaleString()} <span className="text-xs opacity-60">FCFA</span>
                             </p>
                             <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded">
                               Payé
                             </span>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default AcomSaaSManager;
