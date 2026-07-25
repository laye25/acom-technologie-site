import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Scissors, Calendar, CheckCircle2, AlertCircle, 
  Phone, MessageSquare, MapPin, ClipboardList, Info, Sparkles, ArrowLeft, Bug, RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface OrderTrackingDebugInfo {
  rawOrderId: string;
  cleanOrderId: string;
  searchedLocalStorage: boolean;
  searchedFirestore: boolean;
  foundSource: 'localStorage' | 'firestore_doc' | 'firestore_query' | 'none';
  foundOrder: boolean;
  trackingId: string | null;
  trackingStatus: string | null;
  isPublished: boolean | null;
  isSynced: boolean | null;
  firestoreError: string | null;
  apiResult: string;
}

interface OrderTrackingState {
  order: any;
  merchant: any;
  loading: boolean;
  errorType: 'invalid_id' | 'not_found' | 'unpublished' | 'archived' | 'network_error' | null;
  errorMessage: string | null;
  debugInfo: OrderTrackingDebugInfo;
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
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [state, setState] = useState<OrderTrackingState>({
    order: null,
    merchant: null,
    loading: true,
    errorType: null,
    errorMessage: null,
    debugInfo: {
      rawOrderId: orderId || '',
      cleanOrderId: (orderId || '').replace(/^(ord-|trk-|cmd-)/i, ''),
      searchedLocalStorage: false,
      searchedFirestore: false,
      foundSource: 'none',
      foundOrder: false,
      trackingId: null,
      trackingStatus: null,
      isPublished: null,
      isSynced: null,
      firestoreError: null,
      apiResult: 'En cours de chargement...'
    }
  });

  const loadData = async () => {
    if (!orderId) {
      setState(s => ({
        ...s,
        loading: false,
        errorType: 'invalid_id',
        errorMessage: "Identifiant de suivi invalide ou absent du lien.",
        debugInfo: { ...s.debugInfo, apiResult: "Paramètre URL orderId absent." }
      }));
      return;
    }

    setState(s => ({ ...s, loading: true }));

    const rawId = orderId.trim();
    const cleanId = rawId.replace(/^(ord-|trk-|cmd-)/i, '');
    const prefId = rawId.startsWith('ord-') ? rawId : `ord-${cleanId}`;

    console.log("🔍 [Suivi Client Audit] Tracking lookup started for:", { rawId, cleanId, prefId });

    let foundOrder: any = null;
    let foundMerchantId: string | null = null;
    let source: 'localStorage' | 'firestore_doc' | 'firestore_query' | 'none' = 'none';

    // 1. Search LocalStorage across all merchant stores
    const orderKeys = Object.keys(localStorage).filter(key => key.startsWith('tailleur_orders_'));
    for (const key of orderKeys) {
      try {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const match = list.find((o: any) => {
          if (!o) return false;
          const oId = String(o.id || '');
          const oOrderId = String(o.order_id || '');
          const oTrackId = String(o.tracking_id || o.public_tracking_id || o.trackingToken || '');
          const oCleanId = oId.replace(/^(ord-|trk-|cmd-)/i, '');
          const oCleanTrackId = oTrackId.replace(/^(ord-|trk-|cmd-)/i, '');

          return (
            oId === rawId ||
            oId === prefId ||
            oCleanId === cleanId ||
            oOrderId === rawId ||
            oTrackId === rawId ||
            oTrackId === cleanId ||
            oCleanTrackId === cleanId ||
            oId.toLowerCase() === rawId.toLowerCase()
          );
        });

        if (match) {
          foundOrder = match;
          foundMerchantId = key.replace('tailleur_orders_', '');
          source = 'localStorage';
          console.log("✅ [Suivi Client Audit] Match found in LocalStorage:", foundOrder);
          break;
        }
      } catch (e) {
        console.error("LocalStorage parse error:", e);
      }
    }

    let firestoreErrCode: string | null = null;

    // 2. Search Firestore if not found in LocalStorage
    if (!foundOrder) {
      try {
        console.log("🌐 [Suivi Client Audit] Fetching order from Firestore cloud server...");
        
        // Direct document ID lookups
        const possibleDocIds = Array.from(new Set([rawId, prefId, cleanId]));
        for (const docId of possibleDocIds) {
          if (foundOrder) break;
          try {
            const docRef = doc(db, 'tailleur_orders', docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              foundOrder = { ...docSnap.data(), id: docSnap.id };
              foundMerchantId = foundOrder.merchantId || null;
              source = 'firestore_doc';
              console.log("✅ [Suivi Client Audit] Firestore doc match:", docId, foundOrder);
            }
          } catch (docErr: any) {
            firestoreErrCode = docErr?.code || docErr?.message || String(docErr);
            console.warn("Firestore doc lookup error:", docErr);
          }
        }

        // Query lookups if doc ID search didn't return
        if (!foundOrder) {
          const colRef = collection(db, 'tailleur_orders');
          const queries = [
            query(colRef, where('tracking_id', '==', cleanId)),
            query(colRef, where('tracking_id', '==', rawId)),
            query(colRef, where('public_tracking_id', '==', cleanId)),
            query(colRef, where('public_tracking_id', '==', rawId)),
            query(colRef, where('id', '==', prefId)),
            query(colRef, where('id', '==', rawId)),
            query(colRef, where('order_id', '==', prefId)),
            query(colRef, where('order_id', '==', rawId))
          ];

          for (const q of queries) {
            if (foundOrder) break;
            try {
              const snap = await getDocs(q);
              if (!snap.empty) {
                const docSnap = snap.docs[0];
                foundOrder = { ...docSnap.data(), id: docSnap.id };
                foundMerchantId = foundOrder.merchantId || null;
                source = 'firestore_query';
                console.log("✅ [Suivi Client Audit] Firestore query match:", foundOrder);
              }
            } catch (qErr: any) {
              firestoreErrCode = qErr?.code || qErr?.message || String(qErr);
              console.warn("Firestore query error:", qErr);
            }
          }
        }
      } catch (fsErr: any) {
        firestoreErrCode = fsErr?.code || fsErr?.message || String(fsErr);
        console.error("❌ [Suivi Client Audit] Firestore connection error:", fsErr);
      }
    }

    // Populate debug info
    const debugInfo: OrderTrackingDebugInfo = {
      rawOrderId: rawId,
      cleanOrderId: cleanId,
      searchedLocalStorage: true,
      searchedFirestore: true,
      foundSource: source,
      foundOrder: !!foundOrder,
      trackingId: foundOrder ? (foundOrder.tracking_id || foundOrder.public_tracking_id || cleanId) : null,
      trackingStatus: foundOrder ? (foundOrder.tracking_status || 'published') : null,
      isPublished: foundOrder ? (
        foundOrder.published === true ||
        foundOrder.is_published === true ||
        foundOrder.tracking_status === 'published' ||
        foundOrder.is_published !== false
      ) : false,
      isSynced: foundOrder ? (
        source.startsWith('firestore') || 
        foundOrder.syncStatus === 'synced' || 
        Boolean(foundOrder.updatedAt) ||
        Boolean(foundOrder.created_at || foundOrder.createdAt)
      ) : false,
      firestoreError: firestoreErrCode,
      apiResult: foundOrder 
        ? `Commande "${foundOrder.model || 'Modèle'}" localisée via ${source} (Statut: ${foundOrder.status})`
        : (firestoreErrCode ? `Erreur Cloud Firestore : ${firestoreErrCode}` : "Aucune commande trouvée pour cet identifiant dans la base locale ni sur le serveur.")
    };

    // Handle not found
    if (!foundOrder) {
      setState({
        order: null,
        merchant: null,
        loading: false,
        errorType: 'not_found',
        errorMessage: "Commande introuvable. L'atelier n'a pas encore synchronisé cette commande sur le serveur ou le lien est expiré.",
        debugInfo
      });
      return;
    }

    // Access checks
    if (foundOrder.is_tracking_enabled === false) {
      setState({
        order: foundOrder,
        merchant: null,
        loading: false,
        errorType: 'unpublished',
        errorMessage: "Le suivi en ligne pour cette commande a été désactivé par l'atelier.",
        debugInfo
      });
      return;
    }

    if (foundOrder.tracking_status === 'archived') {
      setState({
        order: foundOrder,
        merchant: null,
        loading: false,
        errorType: 'archived',
        errorMessage: "Cette commande est archivée et ne peut plus être consultée en ligne.",
        debugInfo
      });
      return;
    }

    // Load Merchant details
    let foundMerchant: any = null;
    if (foundMerchantId) {
      const mKey = `merchant_${foundMerchantId}`;
      const mSaved = localStorage.getItem(mKey) || localStorage.getItem('merchant');
      if (mSaved) {
        try { foundMerchant = JSON.parse(mSaved); } catch (e) { console.error(e); }
      }

      if (!foundMerchant) {
        try {
          const merchDocRef = doc(db, 'merchants', foundMerchantId);
          const merchDocSnap = await getDoc(merchDocRef);
          if (merchDocSnap.exists()) {
            foundMerchant = { ...merchDocSnap.data(), id: merchDocSnap.id };
          }
        } catch (merchErr) {
          console.error("Merchant Firestore load error:", merchErr);
        }
      }
    }

    if (!foundMerchant) {
      foundMerchant = {
        id: foundMerchantId || 'default',
        name: foundOrder.merchantName || "Atelier Haute Couture",
        phone: foundOrder.merchantPhone || "+221 77 000 00 00",
        address: foundOrder.merchantAddress || "Dakar, Sénégal",
        currency: foundOrder.currency || "FCFA"
      };
    }

    setState({
      order: foundOrder,
      merchant: foundMerchant,
      loading: false,
      errorType: null,
      errorMessage: null,
      debugInfo
    });
  };

  useEffect(() => {
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

  if (state.errorType || !state.order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6 text-left">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-lg font-black text-slate-950">
              {state.errorType === 'invalid_id' ? 'Identifiant de suivi invalide' :
               state.errorType === 'unpublished' ? 'Suivi désactivé' :
               state.errorType === 'archived' ? 'Commande archivée' :
               'Suivi introuvable'}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {state.errorMessage || "Désolé, nous n'avons pas pu charger votre suivi de commande. L'atelier n'a pas encore synchronisé cette commande ou le lien est expiré."}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={loadData}
              className="w-full py-2.5 bg-violet-600 text-white rounded-xl font-bold text-xs hover:bg-violet-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Réessayer la synchronisation
            </button>
            <Link 
              to="/" 
              className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
            </Link>
          </div>

          {/* Diagnostic Debug Mode Toggle on Error Screen */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsDebugOpen(!isDebugOpen)}
              className="text-[11px] font-mono font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 mx-auto cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5" />
              {isDebugOpen ? "Masquer le Journal de Diagnostic" : "Afficher le Journal de Diagnostic (Mode Debug)"}
            </button>

            {isDebugOpen && (
              <div className="mt-3 bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[10px] space-y-1.5 overflow-x-auto border border-slate-800">
                <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">🛠️ JOURNAL DE DIAGNOSTIC SUIVI</p>
                <p><span className="text-slate-400">Commande ID brut :</span> {state.debugInfo.rawOrderId}</p>
                <p><span className="text-slate-400">Tracking ID nettoyé :</span> {state.debugInfo.cleanOrderId}</p>
                <p><span className="text-slate-400">Tracking ID résolu :</span> {state.debugInfo.trackingId || 'Aucun'}</p>
                <p><span className="text-slate-400">Statut Suivi :</span> {state.debugInfo.trackingStatus || 'Inconnu'}</p>
                <p><span className="text-slate-400">Publié :</span> {state.debugInfo.isPublished ? 'Oui (Published)' : 'Non'}</p>
                <p><span className="text-slate-400">Synchronisé Cloud :</span> {state.debugInfo.isSynced ? 'Oui' : 'Non'}</p>
                <p><span className="text-slate-400">Source découverte :</span> {state.debugInfo.foundSource}</p>
                <p><span className="text-slate-400">Commande trouvée :</span> {state.debugInfo.foundOrder ? 'Oui' : 'Non'}</p>
                <p className="text-emerald-300 pt-1 border-t border-slate-800"><span className="text-slate-400">Résultat API :</span> {state.debugInfo.apiResult}</p>
              </div>
            )}
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

          {/* Diagnostic Debug Mode Bar at the bottom */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => setIsDebugOpen(!isDebugOpen)}
              className="text-[10px] font-mono font-bold text-violet-600 hover:text-violet-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <Bug className="w-3.5 h-3.5" />
              {isDebugOpen ? "Masquer le Journal de Diagnostic" : "Journal de Diagnostic (Mode Debug)"}
            </button>

            {isDebugOpen && (
              <div className="mt-3 text-left max-w-xl mx-auto bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-[10px] space-y-1.5 overflow-x-auto border border-slate-800">
                <p className="font-bold text-amber-400 border-b border-slate-800 pb-1">🛠️ JOURNAL DE DIAGNOSTIC SUIVI</p>
                <p><span className="text-slate-400">Commande ID brut :</span> {state.debugInfo.rawOrderId}</p>
                <p><span className="text-slate-400">Tracking ID nettoyé :</span> {state.debugInfo.cleanOrderId}</p>
                <p><span className="text-slate-400">Tracking ID résolu :</span> {state.debugInfo.trackingId || 'Aucun'}</p>
                <p><span className="text-slate-400">Statut Suivi :</span> {state.debugInfo.trackingStatus || 'Inconnu'}</p>
                <p><span className="text-slate-400">Publié :</span> {state.debugInfo.isPublished ? 'Oui (Published)' : 'Non'}</p>
                <p><span className="text-slate-400">Synchronisé Cloud :</span> {state.debugInfo.isSynced ? 'Oui' : 'Non'}</p>
                <p><span className="text-slate-400">Erreur Cloud/Firestore :</span> <span className={state.debugInfo.firestoreError ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{state.debugInfo.firestoreError || 'Aucune (200 OK)'}</span></p>
                <p><span className="text-slate-400">Source découverte :</span> {state.debugInfo.foundSource}</p>
                <p><span className="text-slate-400">Commande trouvée :</span> {state.debugInfo.foundOrder ? 'Oui' : 'Non'}</p>
                <p className="text-emerald-300 pt-1 border-t border-slate-800"><span className="text-slate-400">Résultat API :</span> {state.debugInfo.apiResult}</p>
              </div>
            )}
          </div>

          {/* Secure disclaimer */}
          <p className="text-center text-[10px] text-gray-400 font-medium">
            🔒 Espace sécurisé par clé unique d'identification. Ce lien est confidentiel et réservé au client.
          </p>

        </div>
      </div>
    </div>
  );
}
