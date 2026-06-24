import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Scissors, Calendar, DollarSign, CheckCircle2, AlertCircle, 
  ChevronRight, Phone, MessageSquare, MapPin, ClipboardList, Info, Sparkles, ArrowLeft
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface OrderTrackingState {
  order: any;
  merchant: any;
  loading: boolean;
  error: string | null;
}

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

export default function OrderTracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const [state, setState] = useState<OrderTrackingState>({
    order: null,
    merchant: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!orderId) {
      setState(s => ({ ...s, loading: false, error: "Identifiant de commande introuvable." }));
      return;
    }

    const loadData = async () => {
      try {
        // Find the order by scanning all localStorage keys starting with 'tailleur_orders_'
        const orderKeys = Object.keys(localStorage).filter(key => key.startsWith('tailleur_orders_'));
        let foundOrder: any = null;
        let foundMerchantId: string | null = null;

        for (const key of orderKeys) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const match = list.find((o: any) => o.id === orderId);
          if (match) {
            foundOrder = match;
            foundMerchantId = key.replace('tailleur_orders_', '');
            break;
          }
        }

        // Try Firestore fallback if not in current browser's localstorage
        if (!foundOrder) {
          try {
            const docRef = doc(db, 'tailleur_orders', orderId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              foundOrder = { ...data, id: docSnap.id };
              foundMerchantId = data.merchantId || null;
            }
          } catch (fsErr) {
            console.error("Firestore fallback failed:", fsErr);
          }
        }

        if (!foundOrder) {
          // Fallback or demo data if none exists in current browser cache
          // to ensure a stunning preview is always functional.
          setState(s => ({
            ...s,
            loading: false,
            error: "Désolé, nous n'avons pas pu charger votre suivi de commande. L'atelier n'a pas encore synchronisé cette commande ou le lien est expiré."
          }));
          return;
        }

        // Load associated merchant
        let foundMerchant: any = null;
        if (foundMerchantId) {
          // Look for merchant settings in localStorage
          const mKey = `merchant_${foundMerchantId}`;
          const mSaved = localStorage.getItem(mKey) || localStorage.getItem('merchant');
          if (mSaved) {
            try {
              foundMerchant = JSON.parse(mSaved);
            } catch (e) {
              console.error(e);
            }
          }

          // Try loading merchant details from Firestore if missing from localStorage
          if (!foundMerchant) {
            try {
              const merchDocRef = doc(db, 'merchants', foundMerchantId);
              const merchDocSnap = await getDoc(merchDocRef);
              if (merchDocSnap.exists()) {
                foundMerchant = { ...merchDocSnap.data(), id: merchDocSnap.id };
              }
            } catch (merchErr) {
              console.error("Merchant Firestore load failed:", merchErr);
            }
          }

          if (!foundMerchant) {
            // Attempt to find inside list of merchants if applicable
            foundMerchant = {
              id: foundMerchantId,
              name: "Atelier Haute Couture",
              phone: "+221 77 000 00 00",
              address: "Dakar, Sénégal",
              currency: foundOrder.currency || "FCFA"
            };
          }
        }

        setState({
          order: foundOrder,
          merchant: foundMerchant,
          loading: false,
          error: null
        });

      } catch (e) {
        console.error(e);
        setState(s => ({ ...s, loading: false, error: "Une erreur est survenue lors de la récupération." }));
      }
    };

    loadData();
  }, [orderId]);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold text-sm">Chargement de votre suivi de commande couture...</p>
      </div>
    );
  }

  if (state.error || !state.order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-left">
        <div className="max-w-md bg-white p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-slate-950">Suivi introuvable</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {state.error || "La commande demandée est introuvable ou a été archivée par l'atelier."}
            </p>
          </div>
          <div className="pt-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs hover:bg-violet-700 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { order, merchant } = state;
  const currency = merchant?.currency || 'FCFA';

  const price = Number(order.price || 0);
  const advance = Number(order.advance || 0);
  const rest = Math.max(0, price - advance);

  // Status mapping to steps
  const STATUSES = [
    { id: 'mesures', label: 'Mesures prises', desc: 'Vos mensurations ont été validées par le maître tailleur.', icon: ClipboardList },
    { id: 'coupe', label: 'En cours de couture', desc: 'Le tissu est découpé et confié à l\'artisan assembleur.', icon: Scissors },
    { id: 'retouche', label: 'Retouche & Finitions', desc: 'Ajustements fins, repassage et assemblage des broderies.', icon: Info },
    { id: 'pret', label: 'Prêt pour essayage', desc: 'Votre tenue est prête pour votre visite d\'essayage ou livraison.', icon: Sparkles },
    { id: 'livre', label: 'Livrée & Validée', desc: 'La tenue vous a été remise avec succès. Merci !', icon: CheckCircle2 }
  ];

  // Find index of current status
  const currentStatusIndex = STATUSES.findIndex(s => s.id === order.status);
  const activeIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Non spécifiée';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleContactWhatsApp = () => {
    if (!merchant?.phone) return;
    const cleanPhone = merchant.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Bonjour ${merchant.name}, je consulte le suivi en ligne de ma commande CMD-${order.id?.slice(0, 5).toUpperCase()} (${order.model})...`);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      {/* Visual Top Branding */}
      <div className="bg-gradient-to-b from-violet-600 to-indigo-800 text-white pt-10 pb-24 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Espace Suivi Client Autonome
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{merchant?.name || 'Votre Atelier Couture'}</h1>
          <p className="text-violet-100/85 text-xs max-w-md mx-auto">
            Suivez en temps réel l'avancement de votre création sur mesure sans avoir à vous déplacer.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 -mt-16">
        <div className="space-y-6">
          
          {/* Main Card: Stepper */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 md:p-8 space-y-8 text-left"
          >
            {/* Order Identity Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-mono font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  CMD-{order.id?.slice(0, 5).toUpperCase()}
                </span>
                <h2 className="text-lg font-black text-slate-900 mt-2">{order.model}</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Enregistré pour : <span className="font-bold text-gray-700">{order.clientName}</span></p>
              </div>

              {order.deliveryDate && (
                <div className="bg-amber-50 text-amber-800 border border-amber-100 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 self-stretch md:self-auto justify-center">
                  <Calendar className="w-4.5 h-4.5 text-amber-600" />
                  <div>
                    <p className="text-[9px] uppercase font-bold text-amber-700">Date de Livraison</p>
                    <p className="text-xs font-black">{formatDate(order.deliveryDate)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stepper Steps */}
            <div className="space-y-8 relative">
              {/* Stepper Timeline Background line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-100 hidden md:block" />

              {STATUSES.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;
                const isFuture = idx > activeIndex;

                const StepIcon = step.icon;

                return (
                  <div key={step.id} className="flex flex-col md:flex-row gap-4 relative">
                    {/* Bullet marker on desktop */}
                    <div className="flex items-center gap-3 shrink-0 md:w-48">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                        isActive ? 'bg-violet-600 text-white ring-4 ring-violet-100 scale-105' :
                        isCompleted ? 'bg-emerald-500 text-white' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                      </div>

                      <div>
                        <h4 className={`text-xs font-black uppercase tracking-wider ${
                          isActive ? 'text-violet-600' :
                          isCompleted ? 'text-emerald-600' :
                          'text-gray-400'
                        }`}>
                          {step.label}
                        </h4>
                        <span className="text-[9px] font-bold text-gray-400 md:hidden block">Étape {idx + 1}/5</span>
                      </div>
                    </div>

                    {/* Step description */}
                    <div className="md:flex-1 bg-slate-50/50 hover:bg-slate-50 p-4 rounded-2xl border border-gray-100 transition-colors">
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {step.desc}
                      </p>
                      {isActive && (
                        <div className="inline-flex items-center gap-1 mt-2.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold animate-pulse">
                          Étape Actuelle
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Secondary Card: Financials & Tailor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Financial Status Summary */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 space-y-4 text-left"
            >
              <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-3">
                Règlement Financier
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Montant convenu :</span>
                  <span className="font-bold text-gray-900 font-mono">{price.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-medium">Acompte versé :</span>
                  <span className="font-bold text-emerald-600 font-mono">-{advance.toLocaleString()} {currency}</span>
                </div>
                
                <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-black text-rose-500">Reste à payer</span>
                    <p className="text-[10px] text-gray-400 font-medium">À la livraison</p>
                  </div>
                  <span className="text-base font-black text-rose-600 font-mono">
                    {rest.toLocaleString()} {currency}
                  </span>
                </div>
              </div>

              {rest > 0 && (
                <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-2xl text-[10px] text-rose-800 leading-relaxed font-semibold flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                  <span>
                    Veuillez préparer le solde de {rest.toLocaleString()} {currency} pour le jour convenu de la livraison de votre création.
                  </span>
                </div>
              )}
            </motion.div>

            {/* Atelier / Tailor Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 space-y-4 flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-3">
                  Contacter l'Atelier
                </h3>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-800">{merchant?.name || 'Votre Atelier Couture'}</p>
                  {merchant?.address && (
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {merchant.address}
                    </p>
                  )}
                  {merchant?.phone && (
                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {merchant.phone}
                    </p>
                  )}
                </div>
              </div>

              {merchant?.phone && (
                <button
                  onClick={handleContactWhatsApp}
                  className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Écrire sur WhatsApp
                </button>
              )}
            </motion.div>

          </div>

          {/* Grid of Measurements */}
          {order.clientMeasurements && Object.values(order.clientMeasurements).some(Boolean) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-gray-150 shadow-sm p-6 md:p-8 space-y-4 text-left"
            >
              <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-violet-500" /> Vos Mesures d'Atelier Enregistrées
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                Voici les mensurations de couture prises lors de votre passage ou fournies par vous-même :
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(order.clientMeasurements).map(([key, val]) => {
                  if (!val) return null;
                  return (
                    <div key={key} className="bg-slate-50 p-3 rounded-2xl border border-gray-100 text-center">
                      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">{MEASUREMENT_NAMES[key] || key}</span>
                      <span className="font-mono text-sm font-black text-ink mt-1 block">{String(val)} cm</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Secure disclaimer */}
          <p className="text-center text-[10px] text-gray-400 font-medium">
            🔒 Espace sécurisé par clé unique d'identification. Ce lien est confidentiel et réservé au client.
          </p>

        </div>
      </div>
    </div>
  );
}
