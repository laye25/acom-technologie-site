import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Zap, AlertCircle, ShieldAlert, PauseCircle, PlayCircle, 
  Trash2, Plus, Sparkles, Layers, ArrowRight, ShieldCheck, Lock,
  Shirt, Store, Scissors, Stethoscope, GraduationCap, Car, Users, HardHat, RefreshCw
} from 'lucide-react';
import { Merchant, MerchantPlan, SaasAccessStatus } from '../types';
import { saasSubscriptionService, SAAS_CATALOG } from '../services/saasSubscriptionService';
import { PlanUpgradeModal } from './PlanUpgradeModal';
import toast from 'react-hot-toast';

import { getSaasRouteConfig, isSaasType } from '../utils/saasRoutes';

interface SaaSManagerModalProps {
  merchant: Merchant;
  onClose: () => void;
  onUpdateMerchant: (updated: Merchant) => void;
  onSwitchSaaS?: (saasType: string) => void;
}

const ICON_MAP: Record<string, any> = {
  stock: Store,
  pressing: Shirt,
  couture: Scissors,
  medical: Stethoscope,
  school: GraduationCap,
  transport: Car,
  rh: Users,
  btp: HardHat
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  stock: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  pressing: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800' },
  couture: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800' },
  medical: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  school: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' },
  transport: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
  rh: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  btp: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' }
};

export const SaaSManagerModal: React.FC<SaaSManagerModalProps> = ({
  merchant,
  onClose,
  onUpdateMerchant,
  onSwitchSaaS
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'catalog'>('all');

  const subscriptions = saasSubscriptionService.getMerchantSaasSubscriptions(merchant);
  const activeSaasCount = Object.values(subscriptions).filter(s => s.status === 'active').length;
  const maxSaasAllowed = saasSubscriptionService.getMaxAllowedSaasForPlan(merchant.plan);

  const handleSwitch = async (saasType: string) => {
    try {
      setLoading(saasType);
      const updated = await saasSubscriptionService.switchActiveSaas(merchant, saasType);
      onUpdateMerchant(updated);
      toast.success(`SaaS actif basculé vers "${SAAS_CATALOG[saasType]?.label || saasType}" !`);
      if (onSwitchSaaS) {
        onSwitchSaaS(saasType);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du changement de SaaS.');
    } finally {
      setLoading(null);
    }
  };

  const handleAddSaas = async (saasType: string) => {
    try {
      setLoading(saasType);
      const res = await saasSubscriptionService.addSaasToMerchant(merchant, saasType);
      if (res.requiresUpgrade) {
        toast.error(res.message);
        setShowUpgradeModal(true);
        return;
      }
      if (res.success && res.updatedMerchant) {
        onUpdateMerchant(res.updatedMerchant);
        toast.success(res.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Impossible d\'ajouter ce SaaS.');
    } finally {
      setLoading(null);
    }
  };

  const handleSuspend = async (saasType: string) => {
    try {
      setLoading(saasType);
      const updated = await saasSubscriptionService.suspendSaasAccess(merchant, saasType);
      onUpdateMerchant(updated);
      toast.success(`L'accès au SaaS a été suspendu. Vos données restent conservées.`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suspension.');
    } finally {
      setLoading(null);
    }
  };

  const handleReactivate = async (saasType: string) => {
    try {
      setLoading(saasType);
      const updated = await saasSubscriptionService.reactivateSaasAccess(merchant, saasType);
      onUpdateMerchant(updated);
      toast.success(`Accès au SaaS réactivé avec succès !`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la réactivation.');
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (saasType: string) => {
    if (!confirm(`Voulez-vous retirer l'accès à ce SaaS ? Vos données historiques ne seront PAS supprimées.`)) {
      return;
    }
    try {
      setLoading(saasType);
      const updated = await saasSubscriptionService.removeSaasAccess(merchant, saasType);
      onUpdateMerchant(updated);
      toast.success(`Accès au SaaS retiré. Données conservées en sécurité.`);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du retrait du SaaS.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden my-auto border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-300">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  Mes Solutions SaaS & Abonnements
                  <span className="text-xs px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 font-mono font-bold text-violet-200">
                    Plan {merchant.plan || 'FREE'}
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Gérez vos accès SaaS multi-secteurs, changez d'espace de travail ou étendez vos capacités.
                </p>
              </div>
            </div>

            <button 
              onClick={onClose} 
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quotas & Capacity Bar */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-700">
                Capacité d'utilisation : <span className="text-violet-700 font-extrabold">{activeSaasCount} / {maxSaasAllowed}</span> SaaS actif(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'all' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                Tous les SaaS ({Object.keys(SAAS_CATALOG).length})
              </button>
              <button
                onClick={() => setActiveFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeFilter === 'active' 
                    ? 'bg-emerald-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-200/60 border border-slate-200'
                }`}
              >
                Actifs ({activeSaasCount})
              </button>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                Changer de forfait
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {Object.keys(SAAS_CATALOG).map((saasKey) => {
                const catalogItem = SAAS_CATALOG[saasKey];
                const sub = subscriptions[saasKey] || { status: 'subscription_required' };
                const IconComponent = ICON_MAP[saasKey] || Store;
                const colors = COLOR_MAP[saasKey] || COLOR_MAP.stock;
                const isCurrentActive = isSaasType(merchant.type, saasKey);

                if (activeFilter === 'active' && sub.status !== 'active') return null;

                return (
                  <motion.div 
                    key={saasKey}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col justify-between ${
                      isCurrentActive 
                        ? 'border-violet-500 bg-violet-50/20 shadow-lg shadow-violet-500/5' 
                        : sub.status === 'active'
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : sub.status === 'suspended'
                            ? 'border-amber-200 bg-amber-50/20'
                            : 'border-slate-100 bg-slate-50/50 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top Bar inside Card */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${colors.bg} ${colors.text} ${colors.border}`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-base leading-snug flex items-center gap-2">
                              {catalogItem.label}
                              {isCurrentActive && (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-600 text-white">
                                  En Cours
                                </span>
                              )}
                            </h3>
                            <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                              Requiert Plan {catalogItem.minPlan}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {sub.status === 'active' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            ACTIF
                          </span>
                        )}
                        {sub.status === 'suspended' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <PauseCircle className="w-3.5 h-3.5" />
                            SUSPENDU
                          </span>
                        )}
                        {sub.status === 'subscription_required' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            NON ACTIVÉ
                          </span>
                        )}
                        {sub.status === 'removed' && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            RETIRÉ
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mb-4">
                        {catalogItem.description}
                      </p>
                    </div>

                    {/* Card Action Controls */}
                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      {sub.status === 'active' ? (
                        <>
                          {!isCurrentActive ? (
                            <button
                              disabled={loading === saasKey}
                              onClick={() => handleSwitch(saasKey)}
                              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                            >
                              Changer vers ce SaaS
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-violet-600" />
                              Module actuellement ouvert
                            </span>
                          )}

                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={loading === saasKey}
                              onClick={() => handleSuspend(saasKey)}
                              title="Suspendre l'accès (les données restent préservées)"
                              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-all border border-amber-200"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                            <button
                              disabled={loading === saasKey}
                              onClick={() => handleRemove(saasKey)}
                              title="Retirer le SaaS (sans supprimer vos données)"
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : sub.status === 'suspended' ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-amber-800 font-medium italic">Accès suspendu. Données préservées.</span>
                          <button
                            disabled={loading === saasKey}
                            onClick={() => handleReactivate(saasKey)}
                            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Réactiver l'accès
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs text-slate-500">Solution disponible au catalogue</span>
                          <button
                            disabled={loading === saasKey}
                            onClick={() => handleAddSaas(saasKey)}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Activer ce SaaS
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {showUpgradeModal && (
        <PlanUpgradeModal
          merchant={merchant}
          onClose={() => setShowUpgradeModal(false)}
          onUpdate={(m) => {
            onUpdateMerchant(m);
            setShowUpgradeModal(false);
          }}
        />
      )}
    </>
  );
};
