import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { dbService as db } from '../services/firebaseDbService';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { Service } from '../types';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Upload, CheckCircle, ArrowRight, Loader2, Tag, Calendar, FileText } from 'lucide-react';
import { isPromotionActive, getDiscountedPrice } from '../lib/promotions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { generateOrderDraft } from '../lib/gemini';
import { Sparkles, CheckCircle2, Clock, Lightbulb, ListChecks } from 'lucide-react';
import { OrderDraftDisplay } from '../components/OrderDraftDisplay';

const OrderForm = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isManager } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [fetchingService, setFetchingService] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) return;
      try {
        const data = await db.services.getById(serviceId);
        
        if (data) {
          setService(data);
        } else {
          // Fallback
          const staticService = STATIC_SERVICES.find(s => s.id === serviceId);
          if (staticService) setService(staticService);
        }
      } catch (error) {
        console.error("Error fetching service:", error);
        const staticService = STATIC_SERVICES.find(s => s.id === serviceId);
        if (staticService) setService(staticService);
      } finally {
        setFetchingService(false);
      }
    };
    fetchService();
  }, [serviceId]);

  const [description, setDescription] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiDraft, setAiDraft] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  if (fetchingService) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!service) return <div className="text-center py-20">Service non trouvé</div>;

  const promoActive = isPromotionActive(service);
  const unitPrice = promoActive ? getDiscountedPrice(service.price, service.promotion!.discountPercentage) : service.price;
  const originalTotal = service.price * quantity;
  const discountedTotal = unitPrice * quantity;
  const finalTotal = Math.max(0, discountedTotal - couponDiscount);
  const discountAmount = originalTotal - discountedTotal;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vous devez être connecté pour passer une commande.');
      navigate('/login');
      return;
    }

    if (!quantity || quantity < 1 || isNaN(quantity)) {
      toast.error('Veuillez entrer une quantité valide.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        serviceId: service.id,
        // Denormalized data for performance (Point 6: Aggregation/Denormalization)
        serviceName: service.name,
        serviceImage: service.image,
        clientName: fullName || profile?.displayName || user.displayName || 'Client',
        clientEmail: user.email,
        status: 'pending',
        totalPrice: originalTotal,
        originalPrice: originalTotal,
        couponDiscount: couponDiscount,
        discountPercentage: promoActive ? (service.promotion?.discountPercentage || 0) : 0,
        promotionStartDate: promoActive ? (service.promotion?.startDate || null) : null,
        promotionEndDate: promoActive ? (service.promotion?.endDate || null) : null,
        details: {
          description: description || '',
          fullName: fullName || '',
          address: address || '',
          phone: phone || '',
          quantity: Number(quantity || 1),
        },
        files: [],
      };

      console.log('Submitting order:', orderData);
      const orderId = await db.orders.save(orderData);
      console.log('Order saved with ID:', orderId);
      
      setAnalyzing(true);
      try {
        const draft = await generateOrderDraft(orderData, service);
        if (draft) {
          setAiDraft(draft);
          await db.orders.save({ id: orderId, aiDraft: draft });
        }
      } catch (err) {
        console.error('AI Analysis failed:', err);
      } finally {
        setAnalyzing(false);
      }

      toast.success('Commande enregistrée avec succès !');
      setSuccess(true);
      // Remove automatic redirection to let user see the AI analysis
      // setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Order error:', error);
      let errorMessage = 'Une erreur est survenue lors de l\'enregistrement de votre commande.';
      
      try {
        const firestoreError = JSON.parse(error.message);
        if (firestoreError.error.includes('Missing or insufficient permissions')) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour créer cette commande. Veuillez vérifier que vous êtes bien connecté.';
        } else {
          errorMessage = `Erreur technique: ${firestoreError.error}`;
        }
      } catch (e) {
        errorMessage = `Erreur: ${error.message || 'Inconnue'}`;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-paper pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-black/5 shadow-xl p-8 md:p-12"
          >
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Commande Reçue !</h2>
              <p className="text-gray-500">Votre demande a été transmise à notre équipe avec succès.</p>
            </div>

            {analyzing ? (
              <div className="py-12 text-center bg-primary/5 rounded-3xl border border-primary/10">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-primary font-bold">L'IA analyse votre besoin...</p>
                <p className="text-sm text-gray-500 mt-2 italic">Génération d'un premier brouillon de cahier des charges</p>
              </div>
            ) : aiDraft ? (
              <div className="space-y-8">
                <OrderDraftDisplay draft={aiDraft} />
                
                <div className="pt-8 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    Aller au Tableau de Bord
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/portfolio')}
                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center"
                  >
                    Voir nos réalisations
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl border border-black/5 shadow-sm p-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Demande de Devis</h1>
            </div>

            <div className="mb-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <p className="text-sm text-primary/80 font-medium leading-relaxed">
                Vous demandez un devis pour le service <span className="font-bold">"{service.name}"</span>. 
                Une fois votre demande envoyée, notre équipe validera les détails et vous proposera un chiffrage final avec options de paiement flexibles (acompte/reliquat).
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Prénom et Nom"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    Numéro de Téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex: 77 123 45 67"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Adresse de Livraison
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Quartier, Rue, Ville..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Détails du projet
                </label>
                <textarea
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez vos besoins, objectifs, préférences de design..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                    Quantité / Durée
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity || ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setQuantity(val);
                    }}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                  Fichiers (Logo, Cahier des charges...)
                </label>
                <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center hover:border-primary-light transition-colors cursor-pointer bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Cliquez ou glissez vos fichiers ici</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, DOCX (Max 10MB)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-8 py-5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 disabled:opacity-50 text-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Envoyer ma Demande de Devis <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>

              <div className="text-center mt-8">
                <p className="text-sm text-gray-400">
                  Projet complexe ? <Link to="/quote-request" className="text-primary font-bold hover:underline">Demandez un devis 100% personnalisé</Link>
                </p>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-primary rounded-3xl p-8 text-white sticky top-24"
          >
            <h2 className="text-xl font-bold mb-6">Résumé</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Service</span>
                <span className="font-medium text-right ml-4">{service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Prix unitaire</span>
                <span className="font-medium">{service.price.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Quantité</span>
                <span className="font-medium">x{quantity}</span>
              </div>

              {(isAdmin || isManager) && (
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-[10px] font-bold uppercase tracking-wider opacity-70 mb-2">
                    Réduction négociée (Montant manuel)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={couponDiscount || ''}
                      onChange={(e) => setCouponDiscount(Number(e.target.value) || 0)}
                      placeholder="Somme à déduire"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/40 transition-all placeholder:text-white/30"
                    />
                    <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  </div>
                  <p className="text-[9px] mt-1 opacity-50 italic">Réservé à l'administration pour les clients qui marchandent.</p>
                </div>
              )}

              {promoActive && (
                <>
                  <div className="flex justify-between text-sm text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      Offre Spéciale (-{service.promotion?.discountPercentage}%)
                    </span>
                    <span>-{discountAmount.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] bg-white/10 p-2 rounded-xl border border-white/5">
                    <Calendar className="w-3 h-3 text-emerald-300" />
                    <span>Valable du {formatDate(service.promotion?.startDate)} au {formatDate(service.promotion?.endDate)}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="border-t border-white/20 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-sm opacity-70">Total estimé</span>
                <span className="text-2xl font-bold">{finalTotal.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 text-xs leading-relaxed">
              <p>Un devis détaillé vous sera envoyé automatiquement après validation de votre commande.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  </div>
);
};

export default OrderForm;
