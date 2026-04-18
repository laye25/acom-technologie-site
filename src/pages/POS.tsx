import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { firestoreService } from '../services/firestoreService';
import { Service } from '../types';
import { useFirestoreData, TableName } from '../hooks/useFirestoreData';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { OptimizedImage } from '../components/OptimizedImage';
import { motion } from 'motion/react';
import { ShoppingBag, Clock, CheckCircle, Package, Send, FileText, MessageSquare, User, Sparkles, Palette, Trash2, ExternalLink, Plus, Loader2, CreditCard, Lock as LockIcon, ArrowRight, Download, Receipt, Banknote, Smartphone, Calculator, Search, Minus, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const POS = () => {
  const { user, isManager, isAdmin } = useAuth();
  const [cart, setCart] = useState<{ serviceId: string, quantity: number, price: number }[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isDeposit, setIsDeposit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Point 8: Debounce search to avoid unnecessary re-renders/logic (Global Strategy)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [couponDiscount, setCouponDiscount] = useState(0);

  const categories = ['Tous', 'Digital', 'Marketing', 'Design', 'Event'];

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName,
    limit: 100
  }), []);

  const { data: dynamicServices, loading: servicesLoading } = useFirestoreData<Service>(serviceOptions);

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  const filteredServices = useMemo(() => {
    return allServices.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           s.category?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Tous' || 
                             s.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [allServices, debouncedSearchTerm, selectedCategory]);

  const addToCart = (service: Service) => {
    setCart(prev => {
      const existing = prev.find(item => item.serviceId === service.id);
      if (existing) {
        return prev.map(item => 
          item.serviceId === service.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { serviceId: service.id, quantity: 1, price: service.price || 0 }];
    });
  };

  const removeFromCart = (serviceId: string) => {
    setCart(prev => prev.filter(item => item.serviceId !== serviceId));
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.serviceId === serviceId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cart]);

  const finalTotal = useMemo(() => {
    return Math.max(0, total - couponDiscount);
  }, [total, couponDiscount]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      toast.error('Veuillez remplir au moins le nom et le téléphone du client.');
      return;
    }
    setIsSubmitting(true);
    try {
      const now = new Date();
      let remainingCoupon = couponDiscount;
      
      const ordersToInsert = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        
        // Apply coupon to items sequentially
        const itemCoupon = Math.min(itemTotal, remainingCoupon);
        remainingCoupon -= itemCoupon;
        
        const finalItemTotal = itemTotal - itemCoupon;
        const amountPaid = isDeposit ? finalItemTotal * 0.5 : finalItemTotal;

        return {
          user_id: user?.uid || 'pos-customer',
          service_id: item.serviceId,
          status: isDeposit ? 'confirmed' : 'completed',
          total_price: itemTotal,
          original_price: itemTotal,
          coupon_discount: itemCoupon,
          paid: !isDeposit,
          deposit_paid: isDeposit,
          deposit_amount: isDeposit ? amountPaid : undefined,
          deposit_paid_at: isDeposit ? now.toISOString() : undefined,
          payment_method: 'cash',
          paid_at: !isDeposit ? now.toISOString() : undefined,
          details: {
            quantity: item.quantity,
            type: 'pos',
            processed_by: user?.email,
            full_name: customerName,
            address: customerAddress,
            phone: customerPhone,
            payment_type: isDeposit ? 'deposit' : 'full'
          },
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          payments: [{
            id: Math.random().toString(36).substr(2, 9),
            amount: amountPaid,
            method: 'cash',
            type: isDeposit ? 'deposit' : 'full',
            paid_at: now.toISOString(),
            transaction_id: 'POS_CASH_' + Date.now()
          }]
        };
      });
      
      await firestoreService.add('orders', ordersToInsert);

      setCart([]);
      setCustomerName('');
      setCustomerAddress('');
      setCustomerPhone('');
      setCouponDiscount(0);
      setIsDeposit(false);
      setSuccess(true);
      toast.success('Commande enregistrée avec succès !');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erreur lors de la validation de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayDunyaLink = async () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      toast.error('Veuillez remplir au moins le nom et le téléphone du client.');
      return;
    }
    setIsSubmitting(true);
    try {
      const now = new Date();
      const amountToPay = isDeposit ? finalTotal * 0.5 : finalTotal;
      const desc = `Vente POS #${Date.now()} - ${customerName}`;

      const { payDunyaService } = await import('../services/payDunyaService');
      
      // We create the order record first (unpaid)
      const orderId = 'POS_' + Math.random().toString(36).substr(2, 9);
      const ordersToInsert = cart.map((item, idx) => ({
        id: idx === 0 ? orderId : undefined,
        user_id: user?.uid || 'pos-customer',
        service_id: item.serviceId,
        status: 'pending',
        total_price: item.price * item.quantity,
        paid: false,
        details: {
          quantity: item.quantity,
          type: 'pos',
          processed_by: user?.email,
          full_name: customerName,
          address: customerAddress,
          phone: customerPhone
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      }));

      await firestoreService.add('orders', ordersToInsert);

      const link = await payDunyaService.createPaymentLink({
        amount: amountToPay,
        description: desc,
        orderId,
        returnUrl: window.location.origin + '/dashboard?tab=orders&payment_success=true',
        cancelUrl: window.location.href
      });

      // Show link to admin to share
      navigator.clipboard.writeText(link);
      toast.success(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-bold">Lien PayDunya généré !</span>
            <p className="text-xs">Le lien est copié dans le presse-papier. Partagez-le avec le client.</p>
            <div className="flex gap-2">
              <a href={link} target="_blank" rel="noreferrer" className="px-4 py-2 bg-primary text-white text-[10px] font-bold rounded-xl text-center flex-1" onClick={() => toast.dismiss(t.id)}>
                Vérifier
              </a>
            </div>
          </div>
        ),
        { duration: 15000 }
      );

      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
    } catch (error) {
      console.error('PayDunya POS error:', error);
      toast.error('Erreur lors de la génération du lien.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isManager && !isAdmin) {
    return <div className="p-20 text-center font-bold text-red-500">Accès refusé</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 pt-32 pb-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Services Selection */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Vente en présence (Caisse)</h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {servicesLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => addToCart(service)}
                  className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {service.image ? (
                        <OptimizedImage src={service.image} alt={service.name} width={100} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{service.name}</h3>
                      <p className="text-sm text-primary font-bold">{(service.price || 0).toLocaleString()} FCFA</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart / Checkout */}
        <div className="w-full lg:w-96">
          <div className="bg-white rounded-3xl border border-black/5 shadow-lg p-6 sticky top-32">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-primary" />
              Panier
            </h2>

            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Le panier est vide</p>
                </div>
              ) : (
                cart.map((item) => {
                  const service = allServices.find(s => s.id === item.serviceId);
                  return (
                    <div key={item.serviceId} className="flex items-center justify-between group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{service?.name}</p>
                        <p className="text-xs text-gray-400">{(item.price * item.quantity).toLocaleString()} FCFA</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                          <button onClick={() => updateQuantity(item.serviceId, -1)} className="p-1 hover:bg-white rounded-md transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.serviceId, 1)} className="p-1 hover:bg-white rounded-md transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.serviceId)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-4">
              {/* Customer Info Form */}
              <div className="space-y-3 mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Infos Client</p>
                <input
                  type="text"
                  placeholder="Nom Complet"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  placeholder="Adresse de livraison"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsDeposit(!isDeposit)}
                    className={`w-10 h-6 rounded-full p-1 transition-all relative ${isDeposit ? 'bg-amber-500' : 'bg-gray-200'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isDeposit ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-tight">Acompte (50%)</span>
                </div>
                {isDeposit && (
                  <span className="text-[10px] font-black text-amber-600 bg-white px-2 py-0.5 rounded-full border border-amber-200">ACTIF</span>
                )}
              </div>

              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-gray-400 text-xs">
                  <span>Sous-total</span>
                  <span>{total.toLocaleString()} FCFA</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-primary text-xs font-bold">
                    <span>Coupon de réduction</span>
                    <span>-{couponDiscount.toLocaleString()} FCFA</span>
                  </div>
                )}
                {isDeposit && (
                  <div className="flex items-center justify-between text-amber-600 text-xs font-bold">
                    <span>Acompte à payer (50%)</span>
                    <span>-{(finalTotal * 0.5).toLocaleString()} FCFA</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-gray-500 font-medium">Total à encaisser</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {(isDeposit ? finalTotal * 0.5 : finalTotal).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Réduction négociée (Montant manuel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={couponDiscount || ''}
                    onChange={(e) => setCouponDiscount(Number(e.target.value) || 0)}
                    placeholder="Somme à déduire"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isSubmitting}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center transition-all ${
                    success 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-black/20 disabled:opacity-50 disabled:shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : success ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Enregistré !
                    </>
                  ) : (
                    <>
                      <Banknote className="w-5 h-5 mr-2" />
                      Espèces / Chèque
                    </>
                  )}
                </button>

                <button
                  onClick={handlePayDunyaLink}
                  disabled={cart.length === 0 || isSubmitting}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5 mr-2" />
                      MOBIL MONEY (OM/Wave)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
