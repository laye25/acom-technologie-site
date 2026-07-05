import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { 
  X, Lock as LockIcon, Zap, Check, CheckCircle, Loader2, Smartphone 
} from 'lucide-react';
import { Merchant, MerchantPlan } from '../types';
import { PaymentForm } from './PaymentForm';
import { payDunyaService } from '../services/payDunyaService';
import { dbService } from '../services/dbService';
import { getApiUrl } from '../lib/api';

export const PlanUpgradeModal = ({ 
  merchant, 
  onClose, 
  onUpdate 
}: { 
  merchant: Merchant; 
  onClose: () => void; 
  onUpdate: (m: Merchant) => void; 
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [showStripe, setShowStripe] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(() => stripeKey ? loadStripe(stripeKey) : null, [stripeKey]);

  const plans = [
    {
      id: 'FREE',
      name: 'TESTE',
      price: '0',
      description: 'Pour débuter votre essai',
      features: ['Gestion de stock basique', '2 ventes par jour', '2 Produits', '1 utilisateur'],
      color: 'bg-gray-100 text-gray-600'
    },
    {
      id: 'BASIC',
      name: 'BASIC',
      price: '10 000',
      description: 'Pour les petites structures',
      features: ['Ventes illimitées', '3 utilisateurs', 'Facturation PDF'],
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'STANDARD',
      name: 'STANDARD',
      price: '25 000',
      recommended: true,
      description: 'Pour les structures en croissance',
      features: ['Multi-établissements', 'Analytique avancée', 'Support prioritaire'],
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'PREMIUM',
      name: 'PREMIUM',
      price: '45 000',
      description: 'La solution complète',
      features: ['Établissements illimités', 'API personnalisée', 'Account Manager'],
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'LOCAL',
      name: 'LICENCE LOCALE',
      price: '350 000',
      description: 'Logiciel de Gestion Local (SQLite)',
      features: ['Paiement unique', 'Données en local', 'Acom Gestion Desktop'],
      color: 'bg-emerald-50 text-emerald-600'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === merchant.plan) return;
    
    setLoading(planId);
    try {
      if (planId === 'FREE') {
        const updatedMerchant = { 
          ...merchant, 
          plan: 'FREE' as any, 
          licenseType: 'cloud' as 'cloud' | 'local',
          updatedAt: new Date() 
        };
        await dbService.merchants.save(updatedMerchant);
        onUpdate(updatedMerchant);
        toast.success(`Plan mis à jour vers FREE`);
        onClose();
        return;
      }

      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) return;

      const amount = parseInt(selectedPlan.price.replace(/\D/g, ''), 10);
      const desc = `Abonnement Acom SaaS - Plan ${planId} (${merchant.name})`;
      
      const link = await payDunyaService.createPaymentLink({
        amount,
        description: desc,
        orderId: `SUBSCRIPTION_${merchant.id}_${planId}_${Date.now()}`,
        returnUrl: window.location.origin + `/merchant?payment_success=true&new_plan=${planId}&merchant_id=${merchant.id}`,
        cancelUrl: window.location.href
      });

      // Show notification and redirect
      toast.loading('Redirection vers PayDunya...');
      
      // Attempt to open in new tab (some browsers block this, so we also provide a manual way if needed)
      const win = window.open(link, '_blank');
      if (!win) {
        window.location.href = link; // Fallback to current tab if popup blocked
      } else {
        toast.dismiss();
        toast.success('Le lien de paiement a été ouvert dans un nouvel onglet.');
        onClose();
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || "Erreur lors de l'initialisation du paiement");
    } finally {
      setLoading(null);
    }
  };

  const handleUpgradeWithStripe = async (planId: string) => {
    if (planId === merchant.plan) return;
    setLoading(`${planId}_stripe`);
    try {
      const selectedPlan = plans.find(p => p.id === planId);
      if (!selectedPlan) return;

      const amount = parseInt(selectedPlan.price.replace(/\D/g, ''), 10);
      
      if (!stripeKey) {
        throw new Error("La clé publique Stripe (VITE_STRIPE_PUBLISHABLE_KEY) n'est pas configurée.");
      }

      const response = await fetch(getApiUrl('/api/create-payment-intent'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          orderId: `SUBSCRIPTION_${merchant.id}_${planId}_${Date.now()}`,
          currency: 'xof'
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      setSelectedPlanId(planId);
      setShowStripe(true);
    } catch (error: any) {
      console.error('Stripe upgrade error:', error);
      toast.error(error.message || "Erreur lors de l'initialisation de Stripe");
    } finally {
      setLoading(null);
    }
  };

  const handleStripeSuccess = async () => {
    if (!selectedPlanId) return;
    try {
      const updatedMerchant = { 
        ...merchant, 
        plan: selectedPlanId as any, 
        licenseType: selectedPlanId === 'LOCAL' ? 'local' : merchant.licenseType,
        updatedAt: new Date() 
      };
      await dbService.merchants.save(updatedMerchant);
      onUpdate(updatedMerchant);
      toast.success(`Plan mis à jour vers ${selectedPlanId} via Stripe !`);
      onClose();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour finale du plan');
    }
  };


  if (showStripe && clientSecret && stripePromise) {
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
                <LockIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">CARTE PREPAYE</h2>
                <p className="text-xs text-gray-500">Paiement sécurisé via Stripe</p>
              </div>
            </div>
            <button onClick={() => setShowStripe(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              onSuccess={() => handleStripeSuccess()} 
              onCancel={() => setShowStripe(false)}
              amount={parseInt(plans.find(p => p.id === selectedPlanId)?.price.replace(/\D/g, '') || '0', 10)} 
              totalAmount={parseInt(plans.find(p => p.id === selectedPlanId)?.price.replace(/\D/g, '') || '0', 10)}
              orderId={`SUBSCRIPTION_${merchant.id}_${selectedPlanId}`}
              paymentType="full"
              returnUrl={`${window.location.origin}/merchant/settings?subscription_success=true`}
            />
          </Elements>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto pt-20 pb-20 sm:pt-4 sm:pb-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-7xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden my-auto"
      >
        <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Passer au forfait supérieur</h2>
            <p className="text-xs sm:text-sm text-gray-500">Choisissez le plan qui correspond à vos besoins actuels.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 max-h-[70vh] overflow-y-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative p-6 rounded-3xl border-2 transition-all ${
                merchant.plan === plan.id 
                  ? 'border-primary bg-primary/5' 
                  : plan.recommended 
                    ? 'border-primary/20 bg-white' 
                    : 'border-gray-100 bg-white'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full">
                  RECOMMANDÉ
                </div>
              )}
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.color}`}>
                <Zap className="w-5 h-5" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
              <div className="flex items-baseline space-x-1 mb-4">
                <span className="text-2xl font-black text-gray-900">{plan.price}</span>
                <span className="text-xs font-bold text-gray-400">FCFA{plan.id === 'LOCAL' ? ' (Unique)' : '/mois'}</span>
              </div>

              <p className="text-xs text-gray-500 mb-6">{plan.description}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-xs text-gray-600">
                    <Check className="w-3 h-3 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3">
                <button
                  disabled={merchant.plan === plan.id || !!loading}
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center justify-center ${
                    merchant.plan === plan.id
                      ? 'bg-emerald-50 text-emerald-600 cursor-default'
                      : 'bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20'
                  }`}
                >
                  {loading === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : merchant.plan === plan.id ? (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Forfait Actuel</>
                  ) : (
                    <>
                      <div className="flex items-center mb-1">
                        {plan.price !== '0' && <Smartphone className="w-4 h-4 mr-2" />}
                        <span>{plan.price === '0' ? 'Choisir ce plan' : `MOBIL MONEY`}</span>
                      </div>
                      {plan.price !== '0' && (
                        <span className="text-[10px] opacity-70 font-medium">Orange Money, Wave, etc.</span>
                      )}
                    </>
                  )}
                </button>

                {plan.price !== '0' && merchant.plan !== plan.id && (
                  <button
                    disabled={!!loading}
                    onClick={() => handleUpgradeWithStripe(plan.id)}
                    className="w-full py-4 rounded-xl border border-gray-200 text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex flex-col items-center justify-center group"
                  >
                    {loading === `${plan.id}_stripe` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <div className="flex items-center mb-1">
                          <LockIcon className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary" />
                          <span>CARTE PREPAYE</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">Carte Bancaire via Stripe</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
