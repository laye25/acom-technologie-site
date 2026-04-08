import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { supabase } from '../../lib/supabase';
import { Loader2, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const COLLECTIONS = [
  'users',
  'services',
  'portfolio',
  'blog_posts',
  'settings',
  'messages',
  'orders',
  'products',
  'merchant_sales',
  'merchant_expenses',
  'notifications',
  'design_requests'
];

export default function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState<Record<string, { status: 'pending' | 'migrating' | 'done' | 'error', count: number, error?: string }>>({});

  const handleSingleMigration = async (collectionName: string) => {
    try {
      setProgress(prev => ({ ...prev, [collectionName]: { ...prev[collectionName], status: 'migrating', error: undefined } }));
      
      const querySnapshot = await getDocs(collection(db, collectionName));
      const docs = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to ISO strings and map camelCase to snake_case
        const processedData: any = { id: doc.id };
        for (const [key, value] of Object.entries(data)) {
          // Convert camelCase to snake_case
          let newKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          
          // Special cases
          if (key === 'photoURL') newKey = 'photo_url';
          if (key === 'logoUrl') newKey = 'logo_url';
          if (key === 'coverImage') newKey = 'cover_image';
          if (key === 'previewImage') newKey = 'preview_image';
          if (key === 'additionalImages') newKey = 'additional_images';
          if (key === 'aboutContent') newKey = 'about_content';
          if (key === 'acceptedAt') newKey = 'accepted_at';
          if (key === 'customerName') newKey = 'customer_name';
          if (key === 'orderId') newKey = 'order_id';
          if (key === 'userId') newKey = 'user_id';
          if (key === 'userEmail') newKey = 'user_email';
          if (key === 'userName') newKey = 'user_name';
          if (key === 'previewUrl') newKey = 'preview_url';
          if (key === 'serviceId') newKey = 'service_id';
          if (key === 'serviceName') newKey = 'service_name';
          if (key === 'serviceImage') newKey = 'service_image';
          if (key === 'clientName') newKey = 'client_name';
          if (key === 'clientEmail') newKey = 'client_email';
          if (key === 'discountPercentage') newKey = 'discount_percentage';
          if (key === 'couponDiscount') newKey = 'coupon_discount';
          if (key === 'promotionStartDate') newKey = 'promotion_start_date';
          if (key === 'promotionEndDate') newKey = 'promotion_end_date';
          if (key === 'quoteUrl') newKey = 'quote_url';
          if (key === 'unreadByAdmin') newKey = 'unread_by_admin';
          if (key === 'unreadByClient') newKey = 'unread_by_client';
          if (key === 'clientAccepted') newKey = 'client_accepted';
          if (key === 'depositPaid') newKey = 'deposit_paid';
          if (key === 'depositAmount') newKey = 'deposit_amount';
          if (key === 'depositPaidAt') newKey = 'deposit_paid_at';
          if (key === 'balancePaid') newKey = 'balance_paid';
          if (key === 'balanceAmount') newKey = 'balance_amount';
          if (key === 'balancePaidAt') newKey = 'balance_paid_at';
          if (key === 'paymentId') newKey = 'payment_id';
          if (key === 'paymentMethod') newKey = 'payment_method';
          if (key === 'paidAt') newKey = 'paid_at';
          if (key === 'aiDraft') newKey = 'ai_draft';
          if (key === 'adminAnalysis') newKey = 'admin_analysis';
          if (key === 'senderId') newKey = 'sender_id';
          if (key === 'senderName') newKey = 'sender_name';
          if (key === 'fileUrl') newKey = 'file_url';
          if (key === 'isAdmin') newKey = 'is_admin';

          // Ignore updated_at and created_at if they are coming from firebase as updatedAt/createdAt
          // Supabase handles these automatically if the columns exist, or we can just let the snake_case conversion handle it.
          // The issue is that the schema cache error means the column TRULY doesn't exist or isn't exposed.
          if ((collectionName === 'services' || collectionName === 'design_requests') && (newKey === 'updated_at' || newKey === 'created_at')) {
             continue; // Skip these fields entirely for the services table to bypass the cache error
          }

          if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
            processedData[newKey] = value.toDate().toISOString();
          } else {
            processedData[newKey] = value;
          }
        }
        return processedData;
      });

      if (docs.length > 0) {
        // Insert documents one by one to gracefully handle duplicates or specific row errors
        let successCount = 0;
        let lastError = null;
        
        for (const docData of docs) {
          const { error } = await supabase.from(collectionName).upsert(docData);
          if (error) {
            console.warn(`Erreur ignorée pour le document ${docData.id}:`, error.message);
            lastError = error;
          } else {
            successCount++;
          }
        }

        if (successCount === 0 && lastError) {
          throw lastError; // Throw only if ALL documents failed
        }

        setProgress(prev => ({ 
          ...prev, 
          [collectionName]: { status: 'done', count: successCount } 
        }));
        toast.success(`Migration de ${collectionName} terminée (${successCount}/${docs.length}) !`);
      } else {
        setProgress(prev => ({ 
          ...prev, 
          [collectionName]: { status: 'done', count: 0 } 
        }));
        toast.success(`Migration de ${collectionName} terminée (0 document) !`);
      }

    } catch (error: any) {
      console.error(`Error migrating ${collectionName}:`, error);
      setProgress(prev => ({ 
        ...prev, 
        [collectionName]: { status: 'error', count: 0, error: error.message } 
      }));
      toast.error(`Erreur lors de la migration de ${collectionName}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Migration des données</h2>
          <p className="text-gray-500">Migrez vos collections une par une pour éviter de dépasser les quotas Firebase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {COLLECTIONS.map(col => {
          const status = progress[col]?.status || 'pending';
          const count = progress[col]?.count || 0;
          const error = progress[col]?.error;

          return (
            <div key={col} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 pb-2 border-b border-gray-100">
                <h3 className="text-lg font-semibold flex items-center justify-between">
                  <span className="capitalize">{col.replace('_', ' ')}</span>
                  {status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  {status === 'migrating' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                </h3>
              </div>
              <div className="p-4 pt-2 flex flex-col gap-3">
                <div>
                  {status === 'pending' && <p className="text-sm text-gray-500">Prêt à migrer</p>}
                  {status === 'migrating' && <p className="text-sm text-blue-600">Copie en cours...</p>}
                  {status === 'done' && <p className="text-sm text-green-600">{count} enregistrements migrés</p>}
                  {status === 'error' && (
                    <div className="text-sm text-red-600">
                      <p className="font-semibold">Erreur:</p>
                      <p className="text-xs truncate" title={error}>{error}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleSingleMigration(col)}
                  disabled={status === 'migrating' || status === 'done'}
                  className="w-full py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                >
                  {status === 'migrating' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {status === 'migrating' ? 'En cours...' : status === 'done' ? 'Terminé' : 'Migrer cette table'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
