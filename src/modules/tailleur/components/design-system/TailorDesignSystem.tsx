import React from 'react';
import { motion } from 'motion/react';
import { 
  Scissors, AlertCircle, Clock, CheckCircle2, CheckCircle, Calendar, 
  Phone, MapPin, Edit2, Trash2, MessageSquare, Printer, 
  FileText, Banknote, Sparkles, User, Ruler, ChevronRight,
  ShieldCheck, Tag, Loader2, X
} from 'lucide-react';
import { GarmentVectorIcon } from '../GarmentVectorIcon';

// ---------------------------------------------------------------------------
// 1. Base Card Container
// ---------------------------------------------------------------------------
export interface TailorCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'data-acom-id'?: string;
}

export const TailorCard: React.FC<TailorCardProps> = ({ children, className = '', onClick, 'data-acom-id': dataAcomId }) => {
  return (
    <motion.div
      data-acom-id={dataAcomId}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-black/5 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left space-y-4 ${className}`}
    >
      {children}
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// 2. Status Badge
// ---------------------------------------------------------------------------
export type TailorStatusType = 
  | 'urgent' 
  | 'later' 
  | 'livre' 
  | 'pret' 
  | 'coupe' 
  | 'mesures' 
  | 'retouche' 
  | 'paid' 
  | 'unpaid' 
  | 'synced';

export interface TailorStatusBadgeProps {
  status: TailorStatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const TailorStatusBadge: React.FC<TailorStatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3.5 py-1.5 text-xs';

  let config = {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: '🧵',
    defaultLabel: status
  };

  switch (status) {
    case 'urgent':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        icon: '🚨',
        defaultLabel: 'Urgent'
      };
      break;
    case 'later':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        icon: '🕒',
        defaultLabel: 'Plus tard'
      };
      break;
    case 'livre':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: '🤝',
        defaultLabel: 'Livré'
      };
      break;
    case 'pret':
      config = {
        bg: 'bg-teal-50',
        text: 'text-teal-700',
        border: 'border-teal-200',
        icon: '👗',
        defaultLabel: 'Prêt / Essai'
      };
      break;
    case 'coupe':
      config = {
        bg: 'bg-violet-50',
        text: 'text-violet-700',
        border: 'border-violet-200',
        icon: '✂️',
        defaultLabel: 'En Confection'
      };
      break;
    case 'mesures':
      config = {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: '📏',
        defaultLabel: 'Prise de Mesures'
      };
      break;
    case 'retouche':
      config = {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: '✏️',
        defaultLabel: 'Retouche'
      };
      break;
    case 'paid':
      config = {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: '✓',
        defaultLabel: 'Réglé'
      };
      break;
    case 'unpaid':
      config = {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        icon: '⚠️',
        defaultLabel: 'Paiement incomplet'
      };
      break;
    case 'synced':
      config = {
        bg: 'bg-emerald-50/70',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: '🔄',
        defaultLabel: 'Synchronisé'
      };
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold border rounded-xl uppercase tracking-wider ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}>
      <span>{config.icon}</span>
      <span>{label || config.defaultLabel}</span>
    </span>
  );
};

// ---------------------------------------------------------------------------
// 3. Hero Garment & Profile Dark Block
// ---------------------------------------------------------------------------
export interface TailorHeroGarmentBlockProps {
  title?: string;
  garmentName: string;
  garmentId?: string;
  category?: string;
  gender?: 'M' | 'F' | string;
  filledMeasurementsCount?: number;
  isProfileSynced?: boolean;
  inspirationImage?: string;
  className?: string;
  'data-acom-id'?: string;
}

export const TailorHeroGarmentBlock: React.FC<TailorHeroGarmentBlockProps> = ({
  title = 'Modèle à Confectionner',
  garmentName,
  garmentId = 'default',
  category = 'Couture Africaine',
  gender = 'M',
  filledMeasurementsCount = 0,
  isProfileSynced = true,
  inspirationImage,
  className = '',
  'data-acom-id': dataAcomId
}) => {
  const genderLabel = gender === 'F' || gender === 'Femme' ? '🚺 Femme' : '👤 Homme';

  return (
    <div data-acom-id={dataAcomId} className={`p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-inner flex flex-col gap-3 ${className}`}>
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Scissors className="w-4 h-4" />
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
            🧵 {title.toUpperCase()}
          </span>
        </div>

        {/* Sync Status Badge */}
        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 border ${
          isProfileSynced 
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        }`}>
          {isProfileSynced ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-amber-400" />}
          <span>{isProfileSynced ? 'Profil synchronisé' : 'Modifications locales'}</span>
        </span>
      </div>

      {/* Main Garment Info Row */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          {inspirationImage ? (
            <img 
              src={inspirationImage} 
              alt={garmentName} 
              className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 text-emerald-400 shrink-0 shadow-inner">
              <GarmentVectorIcon
                id={garmentId}
                name={garmentName}
                category={category}
                className="w-6 h-6"
              />
            </div>
          )}

          <div className="min-w-0 text-left">
            <h3 className="text-sm font-black text-white truncate tracking-tight">
              {garmentName}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {/* Category Badge */}
              <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-lg text-[9px] font-bold border border-violet-500/30">
                🏷️ {category}
              </span>

              {/* Target Gender Badge */}
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold border border-slate-700">
                {genderLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Measurements Count Badge */}
        <div className="bg-slate-800/90 border border-slate-700 px-3 py-2 rounded-xl text-center shrink-0">
          <span className="block text-[8px] font-mono uppercase font-bold text-slate-400">
            Profil de mesures
          </span>
          <span className="font-mono text-xs font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
            <Ruler className="w-3 h-3" />
            {filledMeasurementsCount} mesure{filledMeasurementsCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Financial Summary Card
// ---------------------------------------------------------------------------
export interface TailorFinancialCardProps {
  price: number;
  advance: number;
  currency?: string;
  linkedProfit?: number;
  marginPercent?: number;
  className?: string;
  'data-acom-id'?: string;
}

export const TailorFinancialCard: React.FC<TailorFinancialCardProps> = ({
  price,
  advance,
  currency = 'FCFA',
  linkedProfit,
  marginPercent,
  className = '',
  'data-acom-id': dataAcomId
}) => {
  const rest = Math.max(0, price - advance);
  const isFullyPaid = rest === 0;

  return (
    <div data-acom-id={dataAcomId} className={`bg-slate-50/70 dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm text-left space-y-3 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800 pb-2">
        <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Bilan Financier Commande</span>
        </span>
        <TailorStatusBadge status={isFullyPaid ? 'paid' : 'unpaid'} size="sm" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 text-center">
          <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider">Prix Convenu</span>
          <span className="font-mono text-xs font-black text-slate-900 dark:text-white mt-0.5 block truncate">
            {price.toLocaleString()} {currency}
          </span>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-800/60 text-center">
          <span className="block text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Acompte Versé</span>
          <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block truncate">
            {advance.toLocaleString()} {currency}
          </span>
        </div>

        <div className={`p-2.5 rounded-xl border text-center ${rest > 0 ? 'bg-rose-50/50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-800/60' : 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-800/60'}`}>
          <span className={`block text-[8px] font-black uppercase tracking-wider ${rest > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Reste à Payer</span>
          <span className={`font-mono text-xs font-black mt-0.5 block truncate ${rest > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
            {rest.toLocaleString()} {currency}
          </span>
        </div>
      </div>

      {linkedProfit !== undefined && marginPercent !== undefined && (
        <div className="p-2.5 bg-violet-50/60 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/60 rounded-xl flex items-center justify-between text-xs font-black text-violet-700 dark:text-violet-300">
          <span className="flex items-center gap-1 text-[10px] uppercase font-mono">📊 Bénéfice Estimé :</span>
          <span className="font-mono text-violet-800 dark:text-violet-200 font-extrabold text-xs">
            +{linkedProfit.toLocaleString()} {currency} ({marginPercent.toFixed(0)}%)
          </span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Action Button Component
// ---------------------------------------------------------------------------
export interface TailorActionButtonProps {
  variant?: 'primary' | 'whatsapp' | 'encaisser' | 'pdf' | 'ticket' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  title?: string;
  'data-acom-id'?: string;
}

export const TailorActionButton: React.FC<TailorActionButtonProps> = ({
  variant = 'secondary',
  icon,
  children,
  onClick,
  disabled = false,
  className = '',
  title,
  'data-acom-id': dataAcomId
}) => {
  let baseStyle = "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]";

  switch (variant) {
    case 'primary':
      baseStyle += " bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/20";
      break;
    case 'whatsapp':
      baseStyle += " bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20";
      break;
    case 'encaisser':
      baseStyle += " bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60";
      break;
    case 'pdf':
      baseStyle += " bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60";
      break;
    case 'ticket':
      baseStyle += " bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60";
      break;
    case 'danger':
      baseStyle += " bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60";
      break;
    case 'secondary':
    default:
      baseStyle += " bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700";
      break;
  }

  return (
    <button
      data-acom-id={dataAcomId}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseStyle} ${disabled ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''} ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};

// ---------------------------------------------------------------------------
// 6. Modern Delete Confirmation Modal
// ---------------------------------------------------------------------------
export interface TailorDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  entityName: string;
  warningText?: string;
  activeOrdersCount?: number;
  isDeleting?: boolean;
}

export const TailorDeleteConfirmModal: React.FC<TailorDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  entityName,
  warningText = "Cette action est irréversible et supprimera l'élément de la base de données.",
  activeOrdersCount = 0,
  isDeleting = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full text-left space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            <Trash2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
              Confirmation de suppression
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1 leading-snug">
              {title}
            </h3>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Cible :</span>
            <span className="font-extrabold text-slate-900 font-mono text-sm">{entityName}</span>
          </div>

          {activeOrdersCount > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-black text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Commandes associées détectées</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Ce client possède <strong className="font-mono font-black text-amber-950">{activeOrdersCount} commande(s)</strong> en base.
                Toutes les données liées à ce client seront supprimées de manière cohérente.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500 font-medium pt-1">
            ⚠️ {warningText}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            <span>Supprimer</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. Universal Sticky Modal Footer
// ---------------------------------------------------------------------------
export interface ModalStickyFooterProps {
  onCancel?: () => void;
  onSubmit?: (e?: React.FormEvent) => void;
  cancelLabel?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  disabledReason?: string;
  submitVariant?: 'primary' | 'danger' | 'success' | 'violet';
  submitIcon?: React.ReactNode;
  cancelIcon?: React.ReactNode;
  className?: string;
  extraActions?: React.ReactNode;
  cancelButtonId?: string;
  submitButtonId?: string;
  warningId?: string;
}

export const ModalStickyFooter: React.FC<ModalStickyFooterProps> = ({
  onCancel,
  onSubmit,
  cancelLabel = 'Annuler',
  submitLabel = 'Enregistrer le Tissu',
  isSubmitting = false,
  isSuccess = false,
  isError = false,
  errorMessage = '',
  disabled = false,
  disabledReason,
  submitVariant = 'primary',
  submitIcon,
  cancelIcon,
  className = '',
  extraActions,
  cancelButtonId,
  submitButtonId,
  warningId
}) => {
  return (
    <div className={`p-4 sm:p-5 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shrink-0 sticky bottom-0 z-20 space-y-2 rounded-b-[2rem] ${className}`}>
      {/* Disabled reason or error guidance tooltip */}
      {disabledReason && disabled && !isSubmitting && (
        <div 
          data-acom-id={warningId}
          className="text-[11px] font-bold text-amber-700 bg-amber-50/90 border border-amber-200/80 px-3.5 py-1.5 rounded-xl flex items-center justify-center gap-2 animate-in fade-in duration-200 shadow-2xs"
        >
          <span>💡 {disabledReason}</span>
        </div>
      )}

      {isError && errorMessage && (
        <div className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-xl flex items-center justify-center gap-2 animate-in fade-in duration-200 shadow-2xs">
          <span>❌ {errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
        {/* Left Side: Cancel button & Optional Extra Actions */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          {extraActions}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              data-acom-id={cancelButtonId}
              className="w-full sm:w-auto h-11 px-5 border border-slate-200 hover:bg-slate-100/80 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {cancelIcon || <X className="w-4 h-4" />}
              <span>{cancelLabel}</span>
            </button>
          )}
        </div>

        {/* Right Side: Main Submit Button */}
        <button
          type={onSubmit ? "button" : "submit"}
          onClick={onSubmit}
          disabled={disabled || isSubmitting}
          data-acom-id={submitButtonId}
          className={`w-full sm:w-auto h-11 px-6 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/50 active:scale-98 ${
            isSuccess
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
              : submitVariant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20'
              : 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20'
          } ${(disabled || isSubmitting) ? 'opacity-50 cursor-not-allowed shadow-none active:scale-100 hover:bg-violet-600' : 'hover:-translate-y-0.5'}`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>⏳ Enregistrement...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>✓ Tissu enregistré !</span>
            </>
          ) : (
            <>
              {submitIcon || <CheckCircle className="w-4 h-4" />}
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

