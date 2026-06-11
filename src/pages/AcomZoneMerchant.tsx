import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Star, Package, Check, Share2, Info, ArrowRight } from 'lucide-react';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { Merchant, MerchantProduct } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function AcomZoneMerchant() {
  const { merchantId } = useParams<{ merchantId: string }>();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  
  // Use dexie fallback for merchants
  const localMerchants = useLiveQuery(() => db.merchants.toArray()) || [];
  const localProducts = useLiveQuery(() => merchantId ? db.products.where('merchantId').equals(merchantId).toArray() : []) || [];
  
  const { data: merchants, loading: loadingMerchants } = useFirestoreData<Merchant>({
    tableName: 'merchants',
    realtime: true
  });

  const { data: products, loading: loadingProducts } = useFirestoreData<MerchantProduct>({
    tableName: 'merchant_products',
    realtime: true,
    where: merchantId ? [['merchantId', '==', merchantId]] : undefined
  });

  useEffect(() => {
    // Prefer cloud if loaded, otherwise fallback to local Dexie
    const sourceMerchants = merchants.length > 0 ? merchants : localMerchants;
    if (sourceMerchants && sourceMerchants.length > 0) {
      const found = sourceMerchants.find(m => m.id === merchantId);
      if (found) {
        setMerchant(found);
      }
    }
  }, [merchants, localMerchants, merchantId]);

  // Merge products from cloud and Dexie fallback
  const sourceProducts = products.length > 0 ? products : localProducts;
  const merchantProducts = sourceProducts.filter(p => p.merchantId === merchantId);
  
  // Loading takes into account if we have local products
  const isLoading = (loadingMerchants || loadingProducts) && merchants.length === 0 && localMerchants.length === 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!merchant && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 px-6 text-center">
        <h1 className="text-3xl font-black text-gray-900 mb-4">Boutique introuvable</h1>
        <p className="text-gray-600 mb-8">Nous n'avons pas pu trouver cette enseigne sur AcomZone.</p>
        <Link to="/acomzone" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold">
          <ArrowLeft className="w-5 h-5" />
          <span>Retour à AcomZone</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      {/* Header Banner */}
      <div className="h-64 md:h-80 w-full relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 opacity-40">
          {merchant?.logo ? (
             <img src={merchant.logo} alt="" className="w-full h-full object-cover blur-3xl scale-125" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-blue-900" />
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
      </div>

      <div className="px-6 md:px-12 max-w-7xl mx-auto -mt-32 relative z-10">
        <Link to="/acomzone" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6 text-sm font-medium backdrop-blur-sm bg-black/20 px-4 py-2 rounded-full">
          <ArrowLeft className="w-4 h-4" />
          Retour à AcomZone
        </Link>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-8 mb-12">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-3xl bg-gray-50 border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center -mt-16 md:-mt-24 mx-auto md:mx-0 relative z-20">
            {merchant?.logo ? (
              <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain p-4 bg-white" />
            ) : (
              <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-5xl font-black">
                {merchant?.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{merchant?.name}</h1>
                  {merchant?.type && (
                    <span className="bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      {merchant.type}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-lg">{merchant?.description || 'Aucune description fournie.'}</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 pt-4 border-t border-gray-50">
              {merchant?.address && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{merchant.address}</span>
                </div>
              )}
              {merchant?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{merchant.phone}</span>
                </div>
              )}
              {merchant?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{merchant.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="space-y-12">
          {/* Products Section */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-primary" />
                Catalogue Produits
              </h2>
            </div>

            {merchantProducts.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun produit disponible</h3>
                <p className="text-gray-500">Cette boutique n'a pas encore ajouté de produits à son catalogue public.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {merchantProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all shadow-sm flex flex-col"
                  >
                    <div className="h-48 bg-gray-50 relative overflow-hidden flex items-center justify-center p-6">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <Package className="w-16 h-16 text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                      )}
                      {(product.stockQuantity || 0) <= 0 && (
                        <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                          Rupture
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      {product.category && (
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                          {product.category}
                        </div>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="text-xl font-black text-gray-900">
                          {product.price.toLocaleString()} <span className="text-sm text-gray-500 font-medium">{merchant?.currency || 'FCFA'}</span>
                        </div>
                        <button 
                          className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                          title="Commander"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
