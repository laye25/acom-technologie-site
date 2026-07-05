import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Loader2, ArrowRight, CreditCard, X, Package, Wrench, HardHat, Truck, Users, GraduationCap, Stethoscope, WashingMachine, Scissors } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { dbService } from '../../../services/dbService';
import { useAuth } from '../../../context/AuthContext';
import { Merchant, MerchantPlan } from '../../../types';
import toast from 'react-hot-toast';

const PAYMENT_PLANS = [
  { id: 'FREE', name: 'TESTE', price: '0 FCFA', desc: 'Basique' },
  { id: 'BASIC', name: 'BASIC', price: '10.000 FCFA', desc: 'Essentiel' },
  { id: 'STANDARD', name: 'STANDARD', price: '25.000 FCFA', desc: 'Populaire' },
  { id: 'PREMIUM', name: 'PREMIUM', price: '45.000 FCFA', desc: 'Complet' },
  { id: 'LOCAL', name: 'LICENCE LOCALE', price: '350.000 FCFA', desc: 'A vie (Logiciel Local)' },
];

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
    { id: 'pressing', label: 'Gestion de Pressing', icon: WashingMachine, color: 'text-cyan-500', bgColor: 'bg-cyan-50' },
    { id: 'tailleur', label: 'Ateliers de Couture', icon: Scissors, color: 'text-violet-500', bgColor: 'bg-violet-50' },
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
      case 'pressing':
        return { label: "le pressing / laverie", placeholder: "ex: Pressing Prestige" };
      case 'tailleur':
        return { label: "l'atelier de couture", placeholder: "ex: Atelier de Couture Élégance" };
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
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
export default MerchantOnboarding;
