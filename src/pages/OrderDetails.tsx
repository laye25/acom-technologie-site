import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { syncService } from '../services/syncService';
import { Order, Service, UserProfile, OrderStatus, PaymentRecord, PartnerRating } from '../types';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { PaymentForm } from '../components/PaymentForm';
import { notificationService } from '../services/notificationService';
import { 
  ChevronLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  MessageCircle,
  FileText, 
  Receipt,
  Calendar, 
  CreditCard,
  Info,
  ArrowRight,
  User,
  Loader2,
  ShoppingBag,
  ShieldCheck,
  AlertCircle,
  Eye,
  X,
  Plus,
  Check,
  ExternalLink,
  FileUp,
  Banknote,
  Sparkles,
  Settings,
  Search,
  Printer,
  Star,
  Smartphone,
  Lock as LockIcon
} from 'lucide-react';
import { payDunyaService } from '../services/payDunyaService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { dbService } from '../services/dbService';
import { toast } from 'react-hot-toast';
import { getOrderDiscountedTotal, isPromotionActive } from '../lib/promotions';
import { OrderAIAnalysis } from '../components/admin/OrderAIAnalysis';
import { OrderDraftDisplay } from '../components/OrderDraftDisplay';
import { OptimizedImage } from '../components/OptimizedImage';
import { PartnerRatingComponent } from '../components/PartnerRatingComponent';

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
console.log('DEBUG STRIPE KEY:', stripeKey ? 'DEFINED' : 'UNDEFINED');
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const OrderDetails = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, isManager, loading: authLoading } = useAuth();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'deposit' | 'balance' | 'full'>('full');
  const [amountToPay, setAmountToPay] = useState<number>(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const [isEditingFinance, setIsEditingFinance] = useState(false);
  const [isEditingPartnerPayout, setIsEditingPartnerPayout] = useState(false);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [tempCoupon, setTempCoupon] = useState<number>(0);
  const [tempPartnerEarnings, setTempPartnerEarnings] = useState<number>(0);
  const [tempProductionDeadline, setTempProductionDeadline] = useState<string>('');
  const [newDeliverable, setNewDeliverable] = useState({ title: '', description: '', fileUrl: '' });
  const [isSubmittingDeliverable, setIsSubmittingDeliverable] = useState(false);
  const [isAssigningPartner, setIsAssigningPartner] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');

  // Utilisez Dexie directement
  const allPartners = useLiveQuery(() => db.users.where('role').anyOf('printer', 'designer').toArray(), []) || [];
  const allRatings = useLiveQuery(() => db.partner_ratings.toArray(), []) || [];

  useEffect(() => {
    // Syncs handled by BackgroundSyncManager or user action
  }, [orderId, user?.uid]);

  const partnerReputations = useMemo(() => {
    if (!allPartners || !allRatings) return [];
    return allPartners.filter(u => u.role === 'printer' || u.role === 'designer').map(p => {
      const pRatings = allRatings.filter(r => r.partnerId === p.uid);
      const avg = pRatings.length > 0 ? pRatings.reduce((acc, r) => acc + r.score, 0) / pRatings.length : 0;
      return { ...p, avgScore: avg, totalRatings: pRatings.length };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [allPartners, allRatings]);

  const handleAssignPartner = async (pId: string) => {
    try {
      const partner = allPartners?.find(p => (p.uid || p.id) === pId);
      const commission = partner?.partnerDetails?.commissionPercentage || 80;
      const earnings = Math.round((order?.totalPrice || 0) * (commission / 100));

      await dbService.orders.save({
        id: orderId!,
        partnerId: pId,
        partner_id: pId, // Explicitly set both
        partnerEarnings: order?.partnerEarnings ? order.partnerEarnings : earnings,
        updatedAt: new Date()
      });
      toast.success('Partenaire assigné et revenus calculés !');
      setIsAssigningPartner(false);
    } catch (err) {
      toast.error('Erreur lors de l\'assignation.');
    }
  };

  const orderData = useLiveQuery(() => db.orders.where('id').equals(orderId || '').toArray(), []) || [];
  const dynamicServices = useLiveQuery(() => db.services.toArray(), []) || [];
  const allUsers = useLiveQuery(() => db.users.toArray(), []) || [];
  
  const orderLoading = false; // Simplified
  const orderError = null; // Simplified

  const order = orderData?.[0] || null;

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  const service = useMemo(() => {
    if (!order) return null;
    if (order.serviceId === 'custom') {
      return {
        id: 'custom',
        name: order.details?.projectType || 'Devis Personnalisé',
        description: order.details?.description || 'Projet sur mesure',
        price: order.totalPrice || 0,
        category: 'Custom',
        features: [],
        image: ''
      } as Service;
    }
    return allServices.find(s => s.id === order.serviceId);
  }, [order, allServices]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch (e) {
      return dateStr;
    }
  };

  const handlePaymentSuccess = useCallback(async (type?: 'deposit' | 'balance' | 'full', stripePaymentIntentId?: string) => {
    if (!order) return;
    try {
      const currentType = type || paymentType;
      const payDunyaToken = searchParams.get('token');
      const isPayDunya = !!payDunyaToken;
      
      // Check if this payment was already recorded to avoid duplicates
      const transactionId = stripePaymentIntentId || (isPayDunya ? `paydunya_${payDunyaToken}` : null);
      if (transactionId && order.payments?.some(p => p.transactionId === transactionId)) {
        console.log('Payment already recorded:', transactionId);
        return;
      }

      const isDeposit = currentType === 'deposit';
      const isBalance = currentType === 'balance';
      const isFull = currentType === 'full';
      
      // Apply dynamic discount to total price for calculations
      const discountedTotal = getOrderDiscountedTotal(order, service);

      const newPayment: PaymentRecord = {
        id: Math.random().toString(36).substr(2, 9),
        amount: isFull ? discountedTotal : discountedTotal * 0.5,
        method: isPayDunya ? 'paydunya' as any : 'stripe',
        type: currentType,
        paidAt: new Date(),
        transactionId: transactionId || (`manual_${Math.random().toString(36).substr(2, 9)}`)
      };

      await dbService.orders.save({
        ...order,
        paid: isBalance || isFull,
        depositPaid: isDeposit || isFull || order.depositPaid,
        depositAmount: isDeposit ? discountedTotal * 0.5 : (isFull ? discountedTotal * 0.5 : order.depositAmount),
        depositPaidAt: (isDeposit || isFull) ? new Date() : order.depositPaidAt,
        balancePaid: isBalance || isFull || order.balancePaid,
        balanceAmount: isBalance ? discountedTotal * 0.5 : (isFull ? discountedTotal * 0.5 : order.balanceAmount),
        balancePaidAt: (isBalance || isFull) ? new Date() : order.balancePaidAt,
        paidAt: (isBalance || isFull) ? new Date() : order.paidAt,
        paymentMethod: isPayDunya ? 'paydunya' as any : 'stripe',
        payments: [...(order.payments || []), newPayment],
        status: (isDeposit || isFull) && (order.status === 'pending' || order.status === 'confirmed') ? 'in_progress' : order.status,
        clientAccepted: true,
        acceptedAt: order.acceptedAt || new Date(),
        updatedAt: new Date()
      });
      
      toast.success(isDeposit ? 'Acompte payé ! Production lancée.' : isBalance ? 'Reliquat payé ! Merci de votre confiance.' : 'Paiement enregistré avec succès !');
      
      // Clear URL params after processing
      if (transactionId || searchParams.get('payment_success')) {
        navigate(`/order-details/${order.id}`, { replace: true });
      }
    } catch (error: any) {
      console.error('Error updating order after payment:', error);
      const errorMessage = error.message || 'Erreur lors de l\'enregistrement du paiement.';
      toast.error(errorMessage);
    }
  }, [order, service, paymentType, navigate]);

  useEffect(() => {
    const paymentSuccess = searchParams.get('payment_success') === 'true';
    const paymentIntent = searchParams.get('payment_intent');
    const typeFromUrl = searchParams.get('payment_type') as 'deposit' | 'balance' | 'full' | null;

    if (paymentSuccess && order) {
      handlePaymentSuccess(typeFromUrl || undefined, paymentIntent || undefined);
    }
  }, [searchParams, order, handlePaymentSuccess]);

  const client = allUsers.find(u => u.uid === (order?.user_id || order?.userId)) || null;

  const [accepting, setAccepting] = React.useState(false);

  const handleCreatePaymentIntent = async (amount: number, type: 'deposit' | 'balance' | 'full') => {
    console.log('DEBUG: handleCreatePaymentIntent called', { orderId: order?.id, amount, type });
    if (!order) {
      console.error('DEBUG: No order');
      return;
    }
    if (!amount) {
       console.error('DEBUG: Amount is 0 or undefined', { amount, discountedTotal: getOrderDiscountedTotal(order, service) });
       // Proceed anyway to see if it works or fails server-side
    }
    
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      toast.error('Le système de paiement n\'est pas encore configuré.');
      return;
    }

    // If it's a deposit or balance, we pay 50% of the discounted total
    // If it's a full payment, we pay 100% of the discounted total
    const discountedTotal = getOrderDiscountedTotal(order, service);
    const amountToPay = type === 'full' ? discountedTotal : discountedTotal * 0.5;
    
    console.log('DEBUG: Calculated amountToPay', { discountedTotal, amountToPay });

    setPaymentType(type);
    setAmountToPay(amountToPay);
    setPaymentLoading(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountToPay,
          orderId: order.id,
          currency: 'xof'
        }),
      });

      const data = await response.json();
      console.log('DEBUG: server response', data);
      if (data.error) throw new Error(data.error);
      
      setClientSecret(data.clientSecret);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast.error('Impossible d\'initialiser le paiement.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!order) return;

    setAccepting(true);
    try {
      await dbService.orders.save({
        ...order,
        status: 'confirmed',
        clientAccepted: true,
        acceptedAt: new Date()
      });
      // Force sync
      if (user?.uid) {
        await syncService.syncOrders(user.uid);
      }
      toast.success('Contrat accepté ! Vous pouvez maintenant procéder au paiement pour lancer la production.');
    } catch (error) {
      console.error('Error accepting contract:', error);
      toast.error('Une erreur est survenue lors de l\'acceptation du contrat.');
    } finally {
      setAccepting(false);
    }
  };

  const handleAcceptAndPay = async () => {
    if (!order) return;

    setAccepting(true);
    try {
      // Trigger payment intent creation for 50% deposit
      // We don't update the order in DB yet, it will be done in handlePaymentSuccess
      // This ensures the banner stays if the user cancels or navigates away
      await handleCreatePaymentIntent(getOrderDiscountedTotal(order, service), 'deposit');
      
      // We don't show a success toast here because the contract isn't technically "accepted" 
      // in the database until the payment is confirmed.
      toast.loading('Préparation du paiement de l\'acompte (50%)...', { id: 'payment-init' });
      setTimeout(() => toast.dismiss('payment-init'), 3000);
    } catch (error) {
      console.error('Error in handleAcceptAndPay:', error);
      toast.error('Une erreur est survenue.');
    } finally {
      setAccepting(false);
    }
  };

  const handlePayBalance = async () => {
    if (!order) return;
    await handleCreatePaymentIntent(getOrderDiscountedTotal(order, service), 'balance');
  };

  const handleFastPayment = async (type: 'deposit' | 'balance' | 'full' = 'deposit') => {
    if (!order) return;
    setAccepting(true);
    try {
      const isDeposit = type === 'deposit';
      const isBalance = type === 'balance';
      const isFull = type === 'full';
      
      // Apply dynamic discount to total price
      const discountedTotal = getOrderDiscountedTotal(order, service);

      const newPayment: PaymentRecord = {
        id: Math.random().toString(36).substr(2, 9),
        amount: isFull ? discountedTotal : discountedTotal * 0.5,
        method: 'orange_money',
        type,
        paidAt: new Date(),
        transactionId: 'mobile_money_' + Math.random().toString(36).substr(2, 9)
      };

      await dbService.orders.save({
        ...order,
        status: (isDeposit || isFull) && (order.status === 'pending' || order.status === 'confirmed') ? 'in_progress' : order.status,
        clientAccepted: true,
        acceptedAt: order.acceptedAt || new Date(),
        paid: isBalance || isFull,
        depositPaid: isDeposit || isFull || order.depositPaid,
        depositAmount: isDeposit ? discountedTotal * 0.5 : (isFull ? discountedTotal * 0.5 : order.depositAmount),
        depositPaidAt: (isDeposit || isFull) ? new Date() : order.depositPaidAt,
        balancePaid: isBalance || isFull || order.balancePaid,
        balanceAmount: isBalance ? discountedTotal * 0.5 : (isFull ? discountedTotal * 0.5 : order.balanceAmount),
        balancePaidAt: (isBalance || isFull) ? new Date() : order.balancePaidAt,
        paidAt: (isBalance || isFull) ? new Date() : order.paidAt,
        paymentMethod: 'orange_money',
        paymentId: newPayment.transactionId,
        payments: [...(order.payments || []), newPayment],
        updatedAt: new Date()
      });
      
      const successMsg = isDeposit 
        ? 'Acompte de 50% payé ! Production lancée. Le solde de 50% sera dû à la livraison.' 
        : isBalance 
          ? 'Reliquat de 50% payé avec succès ! Merci de votre confiance.' 
          : 'Commande payée avec succès !';
          
      toast.success(successMsg + ' (Simulation Mobile Money)');
    } catch (error) {
      console.error('Fast payment error:', error);
      toast.error('Une erreur est survenue.');
    } finally {
      setAccepting(false);
    }
  };

  const handlePayWithPayDunya = async (type: 'deposit' | 'balance' | 'full' = 'deposit') => {
    if (!order || !service) return;
    setPaymentLoading(true);
    try {
      const discountedTotal = getOrderDiscountedTotal(order, service);
      let amount = discountedTotal;
      let description = `Paiement pour la commande #${order.id}`;

      if (type === 'deposit') {
        amount = Math.round(discountedTotal * 0.5);
        description = `Acompte (50%) pour la commande #${order.id}`;
      } else if (type === 'balance') {
        amount = Math.round(discountedTotal * 0.5);
        description = `Reliquat (50%) pour la commande #${order.id}`;
      }

      const link = await payDunyaService.createPaymentLink({
        amount,
        description,
        orderId: order.id,
        paymentType: type,
        returnUrl: `${window.location.origin}/order-details/${order.id}?payment_success=true&payment_type=${type}`,
        cancelUrl: window.location.href
      });

      // Tentative d'ouverture automatique
      const win = window.open(link, '_blank');
      if (!win) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2 p-1 text-left">
              <span className="font-bold text-gray-900 uppercase tracking-tight">Paiement PayDunya prêt !</span>
              <p className="text-xs text-gray-500">Cliquez sur le lien ci-dessous pour régler votre facture via Orange Money, Wave ou Carte :</p>
              <div className="flex gap-2 mt-2">
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-center flex-1 shadow-lg shadow-primary/20" 
                  onClick={() => toast.dismiss(t.id)}
                >
                  Ouvrir PayDunya
                </a>
              </div>
            </div>
          ),
          { duration: 15000, position: 'top-center' }
        );
      } else {
        toast.success('Redirection vers PayDunya...');
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération du lien PayDunya.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!order) return;

    // Restriction: Cannot confirm without AI analysis
    if (newStatus === 'confirmed' && !order.adminAnalysis) {
      toast.error("Veuillez d'abord effectuer l'analyse de la commande avant de la confirmer.");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await dbService.orders.save({
        ...order,
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Notify client
      await notificationService.notifyStatusChange(order, newStatus, client);
      
      toast.success(`Statut mis à jour : ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      let errorMessage = 'Erreur lors de la mise à jour du statut.';
      try {
        const parsedError = JSON.parse(error instanceof Error ? error.message : '');
        if (parsedError.error) {
          errorMessage = `Erreur: ${parsedError.error} (Path: ${parsedError.path})`;
        }
      } catch (e) {}
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddDeliverable = async () => {
    if (!order || !newDeliverable.title) return;
    setIsSubmittingDeliverable(true);
    try {
      const deliverable = {
        id: Math.random().toString(36).substr(2, 9),
        ...newDeliverable,
        status: 'pending' as const,
        submittedAt: new Date()
      };

      const updatedDeliverables = [...(order.deliverables || []), deliverable];
      
      await dbService.orders.save({
        ...order,
        deliverables: updatedDeliverables,
        updatedAt: new Date()
      });

      setNewDeliverable({ title: '', description: '', fileUrl: '' });
      setShowAddDeliverable(false);
      toast.success('Livrable ajouté !');
    } catch (error) {
      console.error('Error adding deliverable:', error);
      toast.error('Erreur lors de l\'ajout du livrable.');
    } finally {
      setIsSubmittingDeliverable(false);
    }
  };

  const handleUpdateDeliverableStatus = async (deliverableId: string, status: 'to_validate' | 'validated' | 'rejected', comment?: string) => {
    if (!order || !order.deliverables) return;
    
    try {
      const updatedDeliverables = order.deliverables.map(d => {
        if (d.id === deliverableId) {
          return { 
            ...d, 
            status, 
            comment: comment || d.comment,
            validatedAt: status === 'validated' ? new Date() : d.validatedAt,
            submittedAt: status === 'to_validate' ? new Date() : d.submittedAt
          };
        }
        return d;
      });

      await dbService.orders.save({
        ...order,
        deliverables: updatedDeliverables,
        updatedAt: new Date()
      });

      const deliverable = order.deliverables.find(d => d.id === deliverableId);
      if (deliverable) {
        await notificationService.notifyDeliverableUpdate(order, deliverable.title, status, client);
      }

      toast.success('Statut du livrable mis à jour !');
    } catch (error) {
      console.error('Error updating deliverable status:', error);
      toast.error('Erreur lors de la mise à jour du livrable.');
    }
  };

  const handleUpdateFinance = async () => {
    if (!order) return;
    try {
      let updatedEarnings = order.partnerEarnings;
      if (order.partnerId) {
        const partner = allPartners?.find(p => (p.uid || p.id) === order.partnerId);
        const commission = partner?.partnerDetails?.commissionPercentage || 80;
        updatedEarnings = Math.round(tempPrice * (commission / 100));
      }

      await dbService.orders.save({ 
        ...order, 
        totalPrice: tempPrice, 
        couponDiscount: tempCoupon,
        partnerEarnings: updatedEarnings,
        updatedAt: new Date() 
      });
      setIsEditingFinance(false);
      toast.success('Finances et revenus partenaires synchronisés !');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleUpdatePartnerPayout = async () => {
    if (!order) return;
    try {
      await dbService.orders.save({
        id: order.id,
        partnerEarnings: tempPartnerEarnings,
        productionDeadline: tempProductionDeadline ? new Date(tempProductionDeadline) : null,
        updatedAt: new Date()
      });
      setIsEditingPartnerPayout(false);
      toast.success('Rémunération et délai mis à jour !');
    } catch (err) {
      toast.error('Erreur lors de la mise à jour.');
    }
  };

  const handleMarkPartnerAsPaid = async () => {
    if (!order || !order.id) return;
    try {
      await dbService.orders.save({
        id: order.id,
        isPartnerPaid: true,
        partnerPaidAt: new Date(),
        updatedAt: new Date()
      });
      toast.success('Partenaire marqué comme réglé !');
    } catch (err) {
      toast.error('Erreur lors de l\'opération.');
    }
  };

  const handleMarkAsPaid = async () => {
    if (!order) return;
    if (!window.confirm("Voulez-vous vraiment marquer cette commande comme payée intégralement ?")) return;

    try {
      const newPayment = {
        id: Math.random().toString(36).substr(2, 9),
        amount: getOrderDiscountedTotal(order, service),
        method: 'cash' as const,
        type: 'full' as const,
        paidAt: new Date(),
        transactionId: 'MANUAL_ADMIN_' + Date.now()
      };

      await dbService.orders.save({
        ...order,
        paid: true,
        depositPaid: true,
        balancePaid: true,
        paidAt: new Date(),
        updatedAt: new Date(),
        payments: [...(order.payments || []), newPayment]
      });

      toast.success("Commande marquée comme payée !");
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error("Erreur lors de la mise à jour du statut de paiement.");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'En attente', color: 'text-amber-600 bg-amber-50', icon: Clock };
      case 'confirmed': return { label: (order?.clientAccepted || order?.details?.type === 'pos') ? 'Confirmée' : 'Attente Client', color: 'text-blue-600 bg-blue-50', icon: CheckCircle };
      case 'in_progress': return { label: 'En cours', color: 'text-indigo-600 bg-indigo-50', icon: Package };
      case 'completed': return { label: 'Terminée', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle };
      case 'delivered': return { label: 'Livrée', color: 'text-gray-600 bg-gray-50', icon: CheckCircle };
      default: return { label: status, color: 'text-gray-600 bg-gray-50', icon: Info };
    }
  };

  useEffect(() => {
    if (orderError) {
      console.error('Erreur chargement commande :', orderError);
      console.log('orderId reçu depuis l’URL :', orderId);
      console.log('Utilisateur connecté :', user?.uid);
    }
  }, [orderError, orderId, user]);

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-gray-500 font-medium italic">Récupération des détails de la commande...</p>
      </div>
    );
  }

  if (orderError) {
    const isPermissionError = orderError.message.includes('permission-denied') || (orderError as any).code === 'permission-denied' || (orderError as any).code === 'PERMISSION_DENIED';
    const isNotFoundError = orderError.message.includes('not-found') || (orderError as any).code === 'not-found';
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-ink mb-4">
            {isPermissionError ? 'Accès refusé' : 'Erreur de chargement'}
          </h2>
          <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
            {isPermissionError 
              ? 'Vous n’avez pas l’autorisation d’accéder à cette commande.' 
              : isNotFoundError
                ? 'Cette commande est introuvable.'
                : 'Une erreur est survenue lors du chargement de la commande.'}
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 shadow-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-ink mb-4">Commande introuvable</h2>
          <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
            Nous n'avons pas pu trouver les détails de cette commande. Elle n'existe peut-être plus ou vous n'avez pas les permissions nécessaires pour la consulter.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-10 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  const generateWhatsAppLink = () => {
    const adminPhone = "221781030000"; // Numéro Acom Studio
    const text = encodeURIComponent(
      `Bonjour Acom Studio ! 👋\n\nJe vous contacte concernant ma commande #${order?.id?.toUpperCase()}.\n\n` +
      `📦 *Produit:* ${service?.name || order?.details?.projectType || 'Design Sur-mesure'}\n` +
      `💰 *Montant:* ${getOrderDiscountedTotal(order, service).toLocaleString()} FCFA\n` +
      `🔗 *Lien:* ${window.location.href}\n\n` +
      `Je souhaite en discuter avec vous.`
    );
    return `https://wa.me/${adminPhone}?text=${text}`;
  };

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-32 pb-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-primary transition-colors mb-8 group self-start"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Retour
      </button>

      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-xl shadow-black/5 overflow-hidden">
        {/* Header Section */}
        <div className="p-6 sm:p-8 md:p-12 bg-gradient-to-br from-gray-50 to-white border-b border-black/5">
          {/* Pending Validation Message for Client */}
          {order.status === 'pending' && user?.uid === order.userId && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-3xl overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-blue-900 mb-1 uppercase tracking-tight">
                    {order.totalPrice === 0 ? 'Devis en cours d\'étude' : 'Commande en attente de validation'}
                  </h3>
                  <p className="text-sm text-blue-800/80">
                    {order.totalPrice === 0 
                      ? "Notre équipe étudie votre demande pour vous proposer un chiffrage précis. Vous recevrez une notification dès que le devis sera prêt."
                      : "Notre équipe examine votre demande. Une fois confirmée par Acom Technologie, vous pourrez accepter le contrat ici même pour lancer la production."
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Price Not Set Message for Admin */}
          {(isAdmin || isManager) && order.totalPrice === 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-amber-900 mb-1 uppercase tracking-tight">Prix non défini</h3>
                  <p className="text-sm text-amber-800/80 mb-4">
                    Cette demande de devis n'a pas encore de prix fixé. Veuillez définir le montant total pour permettre au client de procéder au paiement.
                  </p>
                  <div className="flex gap-4">
                    <input 
                      type="number"
                      placeholder="Montant Total (FCFA)"
                      className="px-4 py-2 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          if (val > 0) {
                            // Restriction: Cannot confirm without AI analysis
                            if (!order.adminAnalysis) {
                              toast.error("Veuillez d'abord effectuer l'analyse de la commande avant de la confirmer.");
                              return;
                            }

                            try {
                              await dbService.orders.save({ ...order, totalPrice: val, status: 'confirmed' });
                              toast.success('Prix mis à jour et commande confirmée !');
                            } catch (err) {
                              toast.error('Erreur lors de la mise à jour.');
                            }
                          }
                        }
                      }}
                    />
                    <p className="text-[10px] text-amber-600 font-bold self-center italic">Appuyez sur Entrée pour valider</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Contract Acceptance Banner */}
          {order.status === 'confirmed' && order.clientAccepted !== true && order.details?.type !== 'pos' && (user?.uid === order.userId || (!isAdmin && !isManager)) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-3xl overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-amber-900 mb-2 uppercase tracking-tight">Confirmation du Contrat Requise</h3>
                  <p className="text-sm text-amber-800/80 mb-6 leading-relaxed">
                    Acom Technologie a confirmé votre commande. Pour lancer la production, vous devez accepter les conditions du contrat de service.
                  </p>
                  
                  <div className="bg-white/50 rounded-2xl p-6 mb-6 border border-amber-100 max-h-48 overflow-y-auto text-xs text-amber-900/70 space-y-4 font-medium">
                    <p className="font-bold text-amber-900 uppercase tracking-widest text-[10px]">Contrat de Prestation de Service - ACOM Technologie</p>
                    <p>1. Objet : Le présent contrat définit les conditions dans lesquelles ACOM Technologie s'engage à réaliser les prestations décrites dans le devis.</p>
                    <p>2. Délais : Les délais de livraison sont donnés à titre indicatif et commencent à courir dès l'acceptation du présent contrat et le paiement de l'acompte (si applicable).</p>
                    <p>3. Propriété : La propriété des livrables est transférée au client après paiement intégral de la commande.</p>
                    <p>4. Confidentialité : Les deux parties s'engagent à garder confidentielles les informations échangées durant le projet.</p>
                    <p>5. Validation : En cliquant sur "Accepter et Confirmer", vous reconnaissez avoir pris connaissance de l'intégralité des conditions générales de vente.</p>
                  </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={() => handlePayWithPayDunya('deposit')}
                        disabled={accepting || paymentLoading}
                        className="flex-1 flex flex-col items-center justify-center p-4 bg-primary text-white rounded-2xl font-black transition-all shadow-lg shadow-primary/20 disabled:opacity-50 group hover:bg-primary-hover"
                      >
                        <div className="flex items-center mb-1">
                          {paymentLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <Smartphone className="w-5 h-5 mr-2" />
                          )}
                          <span className="text-sm uppercase tracking-widest">MOBIL MONEY</span>
                        </div>
                        <span className="text-[10px] opacity-80 font-medium">Orange Money, Wave, Free Money</span>
                        <span className="mt-2 text-xs">Payer l'Acompte (50%)</span>
                      </button>

                      <button 
                        onClick={handleAcceptAndPay}
                        disabled={accepting || paymentLoading}
                        className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-900 text-white rounded-2xl font-black transition-all shadow-lg shadow-black/20 disabled:opacity-50 group hover:bg-black"
                      >
                        <div className="flex items-center mb-1">
                          {accepting ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          ) : (
                            <LockIcon className="w-5 h-5 mr-2" />
                          )}
                          <span className="text-sm uppercase tracking-widest">CARTE PREPAYE</span>
                        </div>
                        <span className="text-[10px] opacity-80 font-medium">Carte Bancaire (Visa, Mastercard)</span>
                        <span className="mt-2 text-xs">Payer via Stripe</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                      <button 
                        onClick={() => handleFastPayment('deposit')}
                        disabled={accepting}
                        className="flex-1 flex items-center justify-center px-8 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-50"
                      >
                        {accepting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 mr-2" />
                        )}
                        Réglé à la caisse (Simulation)
                      </button>
                    </div>

                  <button 
                    onClick={handleAcceptContract}
                    disabled={accepting}
                    className="mt-4 w-full flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Accepter uniquement (Payer plus tard)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Balance Payment Banner */}
          {order.status === 'delivered' && !order.paid && (user?.uid === order.userId || (!isAdmin && !isManager)) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mb-8 p-6 bg-emerald-50 border border-emerald-200 rounded-3xl overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-900 mb-2 uppercase tracking-tight">Commande Livrée - {order.depositPaid ? 'Reliquat à Payer' : 'Paiement Final'}</h3>
                  <p className="text-sm text-emerald-800/80 mb-6 leading-relaxed">
                    Votre commande a été livrée avec succès ! Pour finaliser la transaction et obtenir la propriété totale des livrables, veuillez régler {order.depositPaid ? 'le reliquat de 50%' : 'la totalité de la commande'}.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => handlePayWithPayDunya(order.depositPaid ? 'balance' : 'full')}
                      disabled={paymentLoading}
                      className="flex-1 flex flex-col items-center justify-center p-4 bg-primary text-white rounded-2xl font-black transition-all shadow-lg shadow-primary/20 disabled:opacity-50 group hover:bg-primary-hover"
                    >
                      <div className="flex items-center mb-1">
                        {paymentLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Smartphone className="w-5 h-5 mr-2" />
                        )}
                        <span className="text-sm uppercase tracking-widest">MOBIL MONEY</span>
                      </div>
                      <span className="text-[10px] opacity-80 font-medium">Orange Money, Wave, Free Money</span>
                      <span className="mt-2 text-xs font-bold">{order.depositPaid ? 'Reliquat (50%) via PayDunya' : 'Payer (100%) via PayDunya'}</span>
                    </button>

                    <button 
                      onClick={order.depositPaid ? handlePayBalance : () => handleCreatePaymentIntent(getOrderDiscountedTotal(order, service), 'full')}
                      disabled={paymentLoading}
                      className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-900 text-white rounded-2xl font-black transition-all shadow-lg shadow-black/20 disabled:opacity-50 group hover:bg-black"
                    >
                      <div className="flex items-center mb-1">
                        {paymentLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <LockIcon className="w-5 h-5 mr-2" />
                        )}
                        <span className="text-sm uppercase tracking-widest">CARTE PREPAYE</span>
                      </div>
                      <span className="text-[10px] opacity-80 font-medium">Carte Bancaire (Visa, Mastercard)</span>
                      <span className="mt-2 text-xs font-bold">Payer via Stripe</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <button 
                      onClick={() => handleFastPayment(order.depositPaid ? 'balance' : 'full')}
                      disabled={accepting}
                      className="flex-1 flex items-center justify-center px-8 py-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-50"
                    >
                      {accepting ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 mr-2" />
                      )}
                      Payé à la caisse (Simulation)
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl flex items-center justify-center shadow-lg shadow-black/5 flex-shrink-0">
                {service?.image ? (
                  <OptimizedImage src={service.image} alt="" width={200} className="w-full h-full object-contain rounded-3xl" />
                ) : (
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight line-clamp-1">
                    {service?.name || order.details?.projectType || 'Service'}
                  </h1>
                  {(isAdmin || isManager) && client && (
                    <div className="flex items-center px-3 py-1 bg-gray-100 rounded-full">
                      <User className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">{client.displayName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {(isAdmin || isManager) && (
                      <div className="relative group/status">
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus)}
                          disabled={isUpdatingStatus}
                          className="appearance-none bg-gray-100 border-none rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors pr-8 focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmée</option>
                          <option value="in_progress">En cours</option>
                          <option value="completed">Terminée</option>
                          <option value="delivered">Livrée</option>
                          <option value="cancelled">Annulée</option>
                        </select>
                        <ChevronLeft className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 pointer-events-none text-gray-400" />
                      </div>
                    )}
                  </div>
                  {order.paid && (
                    <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-600 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Payé
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 font-medium flex flex-wrap items-center gap-x-3">
                  <span>Commande <span className="text-gray-900 ml-1">#{(order.id || '').toUpperCase()}</span></span>
                  {(isAdmin || isManager) && client && (
                    <>
                      <span className="text-gray-400">• <span className="text-gray-900 ml-1">{client.email}</span></span>
                      {client.phoneNumber && (
                        <span className="text-gray-400">• <span className="text-gray-900 ml-1">{client.phoneNumber}</span></span>
                      )}
                      {client.address && (
                        <span className="text-gray-400">• <span className="text-gray-900 ml-1">{client.address}</span></span>
                      )}
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all text-sm sm:text-base whitespace-nowrap shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </a>
              <Link
                to={`/chat/${order.id}`}
                className="flex items-center justify-center px-6 py-3 bg-primary-light text-primary rounded-2xl font-bold hover:bg-primary hover:text-white transition-all text-sm sm:text-base whitespace-nowrap"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Discussion
              </Link>
              <Link
                to={`/quote/${order.id}`}
                className="flex items-center justify-center px-6 py-3 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all text-sm sm:text-base whitespace-nowrap"
              >
                <FileText className="w-5 h-5 mr-2" />
                Devis
              </Link>
              {(order?.aiDraft || order?.serviceId === 'custom') && (
                <a
                  href="#draft"
                  className="flex items-center justify-center px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-100 transition-all text-sm sm:text-base border border-indigo-100 whitespace-nowrap"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Projet
                </a>
              )}
              <Link
                to={`/invoice/${order.id}`}
                className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all text-sm sm:text-base shadow-lg shadow-primary/20 whitespace-nowrap"
              >
                <Receipt className="w-5 h-5 mr-2" />
                Facture
              </Link>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 md:p-12 flex flex-col lg:flex-row gap-8 md:gap-12 items-start">
          {/* Left Column: Details */}
          <div className="w-full lg:w-2/3 space-y-10">
            {/* AI Analysis Section (Admin Only) */}
            {(isAdmin || isManager) && (
              <OrderAIAnalysis order={order} service={service} />
            )}

            {/* AI Draft Section (Visible to Client and Admin) */}
            {(order?.aiDraft || order?.serviceId === 'custom') && (
              <div id="draft" className="scroll-mt-24">
                {order?.aiDraft ? (
                  <OrderDraftDisplay draft={order.aiDraft} />
                ) : (
                  <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 text-center">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-bold text-indigo-900 mb-2">Projet en attente</h3>
                    <p className="text-sm text-indigo-600">Le détail du projet est en cours de préparation ou n'a pas pu être généré automatiquement.</p>
                  </div>
                )}
              </div>
            )}

            <section>
              <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                Détails du Projet
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {(order?.aiDraft || order?.serviceId === 'custom') && (
                  <a href="#draft" className="p-4 sm:p-6 bg-indigo-50 rounded-3xl border border-indigo-100 group transition-all hover:bg-indigo-100">
                    <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">
                      Projet
                    </span>
                    <div className="flex items-center justify-between">
                      <p className="text-indigo-900 font-bold text-sm sm:text-base">
                        Voir le Projet
                      </p>
                      <Sparkles className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    </div>
                  </a>
                )}
                {Object.entries(order.details || {}).map(([key, value]) => {
                  const isFile = key.toLowerCase().includes('url') || key.toLowerCase().includes('thumbnail') || key.toLowerCase().includes('sheet');
                  const isImage = typeof value === 'string' && (value.startsWith('data:image') || value.match(/\.(jpeg|jpg|png|gif)$/i));
                  const isPdf = typeof value === 'string' && (value.startsWith('data:application/pdf') || value.toLowerCase().endsWith('.pdf'));

                  return (
                    <div key={key} className="p-4 sm:p-6 bg-gray-50 rounded-3xl border border-black/5">
                      <span className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {isImage ? (
                        <div className="mt-2 text-center">
                          <img src={value as string} alt={key} className="max-w-full h-auto max-h-32 rounded-lg" />
                        </div>
                      ) : isPdf ? (
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-sm flex items-center gap-2">
                          Voir le document
                        </a>
                      ) : (
                        <p className="text-gray-900 font-bold text-sm sm:text-base break-all">
                          {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
                {Object.entries(order.customOptions || {}).map(([key, value]) => {
                  const isImage = typeof value === 'string' && (value.startsWith('data:image') || value.match(/\.(jpeg|jpg|png|gif)$/i));
                  const isPdf = typeof value === 'string' && (value.startsWith('data:application/pdf') || value.toLowerCase().endsWith('.pdf'));

                  return (
                    <div key={key} className="p-4 sm:p-6 bg-primary-light/30 rounded-3xl border border-primary/10">
                      <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest block mb-2">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      {isImage ? (
                        <div className="mt-2 text-center">
                          <img src={value as string} alt={key} className="max-w-full h-auto max-h-32 rounded-lg" />
                        </div>
                      ) : isPdf ? (
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary font-bold text-sm flex items-center gap-2">
                          Voir le document
                        </a>
                      ) : (
                        <p className="text-gray-900 font-bold text-sm sm:text-base break-all">
                          {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base sm:text-lg font-black text-gray-900 uppercase tracking-widest flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
                  Espace de Validation des Livrables
                </h2>
                {(isAdmin || isManager) && (
                  <button 
                    onClick={() => setShowAddDeliverable(true)}
                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Add Deliverable Modal/Form */}
              <AnimatePresence>
                {showAddDeliverable && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-8 p-6 bg-gray-50 rounded-3xl border border-black/5 overflow-hidden"
                  >
                    <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Titre du livrable (ex: Maquette Design)"
                        value={newDeliverable.title}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, title: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                      />
                      <textarea 
                        placeholder="Description ou instructions..."
                        value={newDeliverable.description}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium h-24"
                      />
                      <input 
                        type="text" 
                        placeholder="Lien du fichier (Drive, Figma, etc.)"
                        value={newDeliverable.fileUrl}
                        onChange={(e) => setNewDeliverable({ ...newDeliverable, fileUrl: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-black/5 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      />
                      <div className="flex gap-3">
                        <button 
                          onClick={handleAddDeliverable}
                          disabled={isSubmittingDeliverable || !newDeliverable.title}
                          className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all disabled:opacity-50"
                        >
                          {isSubmittingDeliverable ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Ajouter le livrable'}
                        </button>
                        <button 
                          onClick={() => setShowAddDeliverable(false)}
                          className="px-6 py-3 bg-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-300 transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {order.deliverables && order.deliverables.length > 0 ? (
                  order.deliverables.map((d) => (
                    <div key={d.id} className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                            d.status === 'validated' ? 'bg-emerald-100 text-emerald-600' :
                            d.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            d.status === 'to_validate' ? 'bg-amber-100 text-amber-600' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {d.status === 'validated' ? <CheckCircle className="w-6 h-6" /> :
                             d.status === 'rejected' ? <X className="w-6 h-6" /> :
                             d.status === 'to_validate' ? <Eye className="w-6 h-6" /> :
                             <Clock className="w-6 h-6" />}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 uppercase tracking-tight">{d.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{d.description}</p>
                            {d.status === 'validated' && d.validatedAt && (
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-2">
                                Validé le {d.validatedAt.toDate ? format(d.validatedAt.toDate(), 'dd/MM/yyyy', { locale: fr }) : '...'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.fileUrl && (
                            <a 
                              href={d.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
                              title="Voir le livrable"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          )}
                          
                          {/* Admin Actions */}
                          {(isAdmin || isManager) && d.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateDeliverableStatus(d.id, 'to_validate')}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                            >
                              Soumettre au client
                            </button>
                          )}

                          {/* Client Actions */}
                          {user?.uid === order.userId && d.status === 'to_validate' && (
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleUpdateDeliverableStatus(d.id, 'validated')}
                                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Valider
                              </button>
                              <button 
                                onClick={() => {
                                  const reason = window.prompt('Raison du refus (optionnel) :');
                                  handleUpdateDeliverableStatus(d.id, 'rejected', reason || undefined);
                                }}
                                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {d.comment && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-800 italic">
                          <strong>Note :</strong> {d.comment}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium italic">Aucun livrable n'a encore été soumis pour validation.</p>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Historique & Suivi
              </h2>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Commande passée</p>
                    <p className="text-xs text-emerald-600/70">
                      {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : '...'}
                    </p>
                  </div>
                </div>
                {order.clientAccepted && order.details?.type !== 'pos' && (
                  <div className="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Contrat accepté par le client</p>
                      <p className="text-xs text-blue-600/70">
                        {order.acceptedAt?.toDate ? format(order.acceptedAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : '...'}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center p-4 bg-gray-50 rounded-2xl border border-black/5">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Dernière mise à jour</p>
                    <p className="text-xs text-gray-400">
                      {order.updatedAt?.toDate ? format(order.updatedAt.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : '...'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {order.files && order.files.length > 0 && (
              <section>
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Fichiers Attachés
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {order.files.map((file, index) => (
                    <a 
                      key={index}
                      href={file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-4 bg-gray-50 rounded-2xl border border-black/5 hover:bg-white hover:shadow-md transition-all group"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm mr-4 group-hover:bg-primary-light transition-colors">
                        <FileText className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">Document #{index + 1}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Cliquez pour voir</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Summary Card */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="p-6 sm:p-8 bg-gray-900 rounded-[2rem] text-white shadow-xl shadow-black/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/50">Résumé Financier</h3>
                  {(isAdmin || isManager) && !order.paid && (
                    <button 
                      onClick={() => {
                        setTempPrice(order.totalPrice || 0);
                        setTempCoupon(order.couponDiscount || 0);
                        setIsEditingFinance(!isEditingFinance);
                      }}
                      className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                      title="Modifier les montants"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditingFinance ? (
                  <div className="space-y-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Prix Total (HT)</label>
                      <input 
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(Number(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Réduction Négociée</label>
                      <input 
                        type="number"
                        value={tempCoupon}
                        onChange={(e) => setTempCoupon(Number(e.target.value))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={handleUpdateFinance}
                        className="flex-1 py-2 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all"
                      >
                        Enregistrer
                      </button>
                      <button 
                        onClick={() => setIsEditingFinance(false)}
                        className="flex-1 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 mb-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-white/60 text-xs sm:text-sm leading-tight">Montant total de la facture</span>
                      <span className="font-bold text-sm sm:text-base text-right whitespace-nowrap">{(order.totalPrice || 0).toLocaleString()} FCFA</span>
                    </div>
                    {isPromotionActive(service) && (order.discountPercentage || 0) > 0 && (
                      <div className="flex flex-col gap-1 text-primary">
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs sm:text-sm font-bold italic leading-tight">Offre Spéciale (-{order.discountPercentage || 0}%)</span>
                          {order.promotionStartDate && order.promotionEndDate && (
                            <span className="text-[10px] text-white/40 italic mt-1">
                              Valable du {formatDate(order.promotionStartDate)} au {formatDate(order.promotionEndDate)}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-sm sm:text-base text-right whitespace-nowrap">-{((order.totalPrice || 0) * (order.discountPercentage || 0) / 100).toLocaleString()} FCFA</span>
                      </div>
                    )}
                    {(order.couponDiscount || 0) > 0 && (
                      <div className="flex flex-col gap-1 text-primary">
                        <span className="text-xs sm:text-sm font-bold italic leading-tight">Réduction négociée</span>
                        <span className="font-bold text-sm sm:text-base text-right whitespace-nowrap">-{(order.couponDiscount || 0).toLocaleString()} FCFA</span>
                      </div>
                    )}
                    <div className={`flex flex-col gap-1 ${order.depositPaid ? 'text-emerald-400' : 'text-emerald-400/60'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs sm:text-sm leading-tight">Acompte (50%)</span>
                        {order.depositPaid && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-sm sm:text-base text-right whitespace-nowrap">{(getOrderDiscountedTotal(order, service) * 0.5).toLocaleString()} FCFA</span>
                        {order.depositPaid && <span className="text-[10px] font-black uppercase tracking-tighter">PAYÉ</span>}
                      </div>
                    </div>
                    <div className={`flex flex-col gap-1 ${order.balancePaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs sm:text-sm leading-tight">Solde (50%)</span>
                        {order.balancePaid && <CheckCircle className="w-3 h-3 flex-shrink-0" />}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-sm sm:text-base text-right whitespace-nowrap">{(getOrderDiscountedTotal(order, service) * 0.5).toLocaleString()} FCFA</span>
                        {order.balancePaid && <span className="text-[10px] font-black uppercase tracking-tighter">PAYÉ</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-white/60 text-xs sm:text-sm leading-tight">TVA (0%)</span>
                      <span className="font-bold text-sm sm:text-base text-right whitespace-nowrap">0 FCFA</span>
                    </div>
                    {order.paid && (
                      <div className="flex flex-col gap-1 text-emerald-400">
                        <span className="text-xs sm:text-sm leading-tight">Statut</span>
                        <span className="font-bold text-xs sm:text-sm flex items-center justify-end whitespace-nowrap">
                          <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                          PAYÉ
                        </span>
                      </div>
                    )}
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex flex-col gap-2">
                      <span className="text-white/60 text-xs sm:text-sm leading-tight">Total TTC</span>
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-primary text-right leading-tight whitespace-nowrap">
                        {getOrderDiscountedTotal(order, service).toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                )}
                {order.paid ? (
                  <div className="w-full py-4 bg-emerald-600/20 text-emerald-400 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest border border-emerald-600/30 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Commande Payée
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(isAdmin || isManager) && (
                      <>
                        <button 
                          onClick={() => setIsAssigningPartner(true)}
                          className="w-full py-3 bg-indigo-600/10 text-indigo-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-indigo-600/20"
                        >
                          <Printer className="w-3 h-3 mr-2" />
                          {order.partnerId ? 'Changer de Partenaire' : 'Assigner un Partenaire'}
                        </button>

                        {order.partnerId && (
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Assigné à</p>
                              <p className="text-xs font-bold text-white truncate">
                                {allPartners.find(p => (p.uid || p.id) === order.partnerId)?.displayName || 'Partenaire ID: ' + (order.partnerId?.slice(0, 8))}
                              </p>
                            </div>
                          </div>
                        )}

                        <button 
                          onClick={handleMarkAsPaid}
                          className="w-full py-3 bg-emerald-600/10 text-emerald-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center border border-emerald-600/20"
                        >
                          <Banknote className="w-3 h-3 mr-2" />
                          Marquer comme Payé (Admin)
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Partner Payout Management (Visible only if partner assigned and not paid) */}
              {(isAdmin || isManager) && order?.partnerId && (
                <div className="mt-8 p-6 bg-gray-900 rounded-[2rem] text-white shadow-xl shadow-black/10">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Gestion Reversement Partenaire</h4>
                      </div>
                      {!order.isPartnerPaid && (
                        <button 
                          onClick={() => {
                            setTempPartnerEarnings(order.partnerEarnings || 0);
                            const deadlineDate = order.productionDeadline?.toDate ? order.productionDeadline.toDate() : (order.productionDeadline ? new Date(order.productionDeadline) : null);
                            setTempProductionDeadline(deadlineDate ? deadlineDate.toISOString().split('T')[0] : '');
                            setIsEditingPartnerPayout(!isEditingPartnerPayout);
                          }}
                          className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                        >
                           <Settings size={14} />
                        </button>
                      )}
                   </div>

                   {isEditingPartnerPayout ? (
                     <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                         <div>
                            <div className="flex justify-between items-center mb-1">
                               <label className="block text-[8px] font-black text-white/40 uppercase tracking-widest">Gains du Partenaire (CFA)</label>
                               <button 
                                 type="button"
                                 onClick={() => {
                                   const partner = allPartners.find(p => (p.uid || p.id) === order?.partnerId);
                                   const comm = partner?.partnerDetails?.commissionPercentage || 80;
                                   setTempPartnerEarnings(Math.round((order?.totalPrice || 0) * (comm / 100)));
                                   toast.success(`Calculé à ${comm}% du total`);
                                 }}
                                 className="text-[8px] font-black text-primary uppercase underline hover:text-primary-light"
                               >
                                 Auto-Sync
                               </button>
                            </div>
                            <input 
                              type="number"
                              value={tempPartnerEarnings}
                              onChange={(e) => setTempPartnerEarnings(Number(e.target.value))}
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 text-white"
                            />
                         </div>

                         <div>
                            <label className="block text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Date Limite de Production</label>
                            <input 
                              type="date"
                              value={tempProductionDeadline}
                              onChange={(e) => setTempProductionDeadline(e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary/40 text-white"
                            />
                         </div>

                        <div className="flex gap-2">
                           <button 
                             onClick={handleUpdatePartnerPayout}
                             className="flex-1 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all"
                           >
                             Valider
                           </button>
                           <button 
                             onClick={() => setIsEditingPartnerPayout(false)}
                             className="flex-1 py-2 bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                           >
                              Fermer
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
                           <div className="min-w-0">
                              <p className="text-[10px] text-white/40 uppercase tracking-widest leading-none mb-1 text-left">
                                Montant Estimé ({allPartners.find(p => (p.uid || p.id) === order.partnerId)?.partnerDetails?.commissionPercentage || 80}%)
                              </p>
                              <p className="text-lg font-black text-white truncate">
                                {order.partnerEarnings ? `${order.partnerEarnings.toLocaleString()} CFA` : 'À définir'}
                              </p>
                           </div>
                           <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${order.isPartnerPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {order.isPartnerPaid ? 'Virement Réglé' : 'En attente'}
                           </div>
                        </div>

                        {order.partnerEarnings && !order.isPartnerPaid && (
                           <button 
                             onClick={handleMarkPartnerAsPaid}
                             className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                           >
                              <Banknote size={16} />
                              Valider le virement effectué
                           </button>
                        )}
                        
                        {order.isPartnerPaid && (
                           <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                Paiement validé le {new Date(order.partnerPaidAt?.seconds * 1000).toLocaleDateString()}
                              </p>
                           </div>
                        )}
                     </div>
                   )}
                </div>
              )}
            </div>

            <div className="p-6 bg-primary-light rounded-3xl border border-primary/10">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 text-primary mr-2" />
                <h4 className="font-black text-gray-900 text-sm uppercase tracking-wider">Mode de Paiement</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">
                <span className="font-bold text-primary block mb-1 underline decoration-primary/20">MOBIL MONEY :</span>
                PayDunya (Orange Money, Wave, Free Money).
                <span className="font-bold text-gray-900 block mt-2 mb-1 underline decoration-gray-900/10">CARTE PREPAYE :</span>
                Cartes Visa & Mastercard via Stripe sécurisé.
              </p>

              {/* Payment History Section */}
              {order.payments && order.payments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-primary/10 space-y-4">
                  <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Historique des Paiements</h5>
                  {order.payments.map((payment) => (
                    <div key={payment.id} className="bg-white/50 p-3 rounded-2xl border border-primary/5">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
                          {payment.type === 'deposit' ? 'Acompte (50%)' : 
                           payment.type === 'balance' ? 'Reliquat (50%)' : 
                           'Paiement Intégral'}
                        </span>
                        <span className="text-[10px] font-black text-primary">
                          {payment.amount.toLocaleString()} FCFA
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                          {payment.method === 'stripe' ? 'Carte Bancaire' : 
                           payment.method === 'orange_money' ? 'Orange Money' : 
                           payment.method === 'wave' ? 'Wave' : 'Espèces'}
                        </span>
                        <span className="text-[9px] text-gray-400">
                          {payment.paidAt?.toDate ? format(payment.paidAt.toDate(), 'dd/MM/yy HH:mm', { locale: fr }) : '...'}
                        </span>
                      </div>
                      {payment.transactionId && (
                        <p className="text-[8px] text-gray-300 mt-1 font-mono truncate">ID: {payment.transactionId}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rating Section - Intelligent Integration */}
        {order.status === 'delivered' && !isAdmin && !isManager && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12"
          >
            <PartnerRatingComponent order={order} />
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isAssigningPartner && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Assigner un Partenaire</h3>
                  <p className="text-sm text-gray-500">Choisissez le meilleur partenaire pour ce projet</p>
                </div>
                <button 
                  onClick={() => setIsAssigningPartner(false)}
                  className="p-3 hover:bg-white rounded-2xl shadow-sm border border-gray-200 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Filtrer les partenaires..."
                    value={partnerSearch}
                    onChange={(e) => setPartnerSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-bold transition-all"
                  />
                </div>

                <div className="space-y-3">
                  {partnerReputations
                    .filter(p => !partnerSearch || p.displayName?.toLowerCase().includes(partnerSearch.toLowerCase()))
                    .map((p, idx) => (
                    <button
                      key={p.uid}
                      onClick={() => handleAssignPartner(p.uid!)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                        order.partnerId === p.uid 
                          ? 'border-primary bg-primary-light/5' 
                          : 'border-gray-50 bg-gray-50 hover:border-primary/30 hover:bg-white'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                          {p.photoURL ? (
                            <img src={p.photoURL} alt={p.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Printer size={20} />
                            </div>
                          )}
                        </div>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1 bg-amber-400 text-white p-0.5 rounded-full border border-white">
                            <Star size={10} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      
                      <div className="text-left flex-1">
                        <h4 className="font-bold text-gray-900 leading-tight">{p.displayName}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase text-primary tracking-widest">{p.role === 'printer' ? 'Imprimeur' : 'Designer'}</span>
                          <span className="text-[10px] text-gray-300">•</span>
                          <div className="flex items-center gap-0.5">
                            <Star size={10} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-bold text-gray-500">{p.avgScore.toFixed(1)} ({p.totalRatings})</span>
                          </div>
                        </div>
                      </div>

                      {order.partnerId === p.uid && (
                        <div className="p-2 bg-primary text-white rounded-lg">
                          <CheckCircle size={16} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showPaymentModal && clientSecret && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Paiement Sécurisé</h3>
                  <p className="text-xs text-gray-500 font-medium">Commande #{(order?.id || '').toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setAccepting(false);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                {paymentType === 'deposit' && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      <span className="font-black uppercase block mb-1">Modalités de paiement</span>
                      Vous réglez actuellement l'acompte de <span className="font-bold">50%</span>. 
                      Le solde restant de <span className="font-bold">50%</span> sera à régler uniquement lors de la livraison finale de votre projet.
                    </p>
                  </div>
                )}
                {stripePromise ? (
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
                    <PaymentForm 
                      amount={amountToPay} 
                      totalAmount={getOrderDiscountedTotal(order, service)}
                      originalTotal={order?.totalPrice}
                      discountPercentage={isPromotionActive(service) ? (order?.discountPercentage || 0) : 0}
                      orderId={order?.id || ''} 
                      paymentType={paymentType}
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => {
                    setShowPaymentModal(false);
                    setAccepting(false);
                  }}
                    />
                  </Elements>
                ) : (
                  <div className="p-6 text-center bg-red-50 text-red-600 rounded-2xl">
                    Le système de paiement n'est pas configuré. Veuillez contacter l'administrateur.
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

export default OrderDetails;
