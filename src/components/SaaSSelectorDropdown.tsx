import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, Layers, Plus, Check, ShieldCheck,
  Shirt, Store, Scissors, Stethoscope, GraduationCap, Car, Users, HardHat
} from 'lucide-react';
import { Merchant } from '../types';
import { saasSubscriptionService, SAAS_CATALOG } from '../services/saasSubscriptionService';
import { SaaSManagerModal } from './SaaSManagerModal';
import toast from 'react-hot-toast';

interface SaaSSelectorDropdownProps {
  merchant: Merchant;
  onUpdateMerchant: (updated: Merchant) => void;
  onNavigateSaas?: (saasType: string) => void;
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

export const SaaSSelectorDropdown: React.FC<SaaSSelectorDropdownProps> = ({
  merchant,
  onUpdateMerchant,
  onNavigateSaas
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeSaasTypes = saasSubscriptionService.getActiveSaasTypes(merchant);
  const currentType = merchant.type || 'stock';
  const currentCatalog = SAAS_CATALOG[currentType] || SAAS_CATALOG.stock;
  const CurrentIcon = ICON_MAP[currentType] || Store;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSaas = async (targetType: string) => {
    if (targetType === currentType) {
      setIsOpen(false);
      return;
    }

    try {
      setLoadingType(targetType);
      const updated = await saasSubscriptionService.switchActiveSaas(merchant, targetType);
      onUpdateMerchant(updated);
      toast.success(`Module basculé vers "${SAAS_CATALOG[targetType]?.label || targetType}"`);
      setIsOpen(false);
      if (onNavigateSaas) {
        onNavigateSaas(targetType);
      }
    } catch (err: any) {
      toast.error(err.message || 'Impossible de basculer de SaaS.');
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all cursor-pointer group"
          title="Changer de SaaS actif"
        >
          <div className="w-7 h-7 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100 group-hover:bg-violet-600 group-hover:text-white transition-all">
            <CurrentIcon className="w-4 h-4" />
          </div>

          <div className="text-left hidden sm:block">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold leading-none">
              SaaS Actif
            </div>
            <div className="text-xs font-black text-slate-800 tracking-tight leading-tight flex items-center gap-1.5 mt-0.5">
              {currentCatalog.label.split('(')[0].trim()}
            </div>
          </div>

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[90] overflow-hidden"
            >
              <div className="px-3 py-2 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                <span>Vos SaaS Autorisés ({activeSaasTypes.length})</span>
                <span className="text-violet-600 font-extrabold">Plan {merchant.plan || 'FREE'}</span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {activeSaasTypes.map((typeKey) => {
                  const cat = SAAS_CATALOG[typeKey] || { label: typeKey };
                  const IconComp = ICON_MAP[typeKey] || Store;
                  const isSelected = typeKey === currentType;

                  return (
                    <button
                      key={typeKey}
                      disabled={loadingType === typeKey}
                      onClick={() => handleSelectSaas(typeKey)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all ${
                        isSelected 
                          ? 'bg-violet-50 text-violet-900 font-extrabold' 
                          : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs truncate">{cat.label.split('(')[0].trim()}</span>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-violet-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowManagerModal(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Gérer mes SaaS & Abonnements
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showManagerModal && (
        <SaaSManagerModal
          merchant={merchant}
          onClose={() => setShowManagerModal(false)}
          onUpdateMerchant={onUpdateMerchant}
          onSwitchSaaS={onNavigateSaas}
        />
      )}
    </>
  );
};
