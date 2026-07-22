import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/dbService';
import { db } from '../db/db';
import { getSaasRouteConfig, logSaasNavigation } from '../utils/saasRoutes';
import AcomZoneMerchant from '../pages/AcomZoneMerchant';

interface SaaSRouterProps {
  defaultType?: string;
}

export const SaaSRouter: React.FC<SaaSRouterProps> = ({ defaultType }) => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const routeMerchantId = searchParams.get('merchantId');
  const queryType = searchParams.get('type') || searchParams.get('saas') || defaultType;
  const config = getSaasRouteConfig(queryType);

  const [targetMerchantId, setTargetMerchantId] = useState<string | null>(routeMerchantId);
  const [loading, setLoading] = useState(!routeMerchantId);

  useEffect(() => {
    let isMounted = true;
    if (!routeMerchantId) {
      const resolveMerchant = async () => {
        try {
          // 1. Try local Dexie database
          const localMerchants = await db.merchants.toArray();
          if (localMerchants && localMerchants.length > 0) {
            if (isMounted) {
              setTargetMerchantId(localMerchants[0].id);
              setLoading(false);
            }
            return;
          }
          // 2. Try dbService user lookup
          if (user) {
            const merchant = await dbService.merchants.getByOwner(user.uid);
            if (merchant && isMounted) {
              setTargetMerchantId(merchant.id);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error('[SaaSRouter] Error resolving merchant:', e);
        }
        // Fallback default merchant ID
        if (isMounted) {
          setTargetMerchantId('demo_merchant_default');
          setLoading(false);
        }
      };
      resolveMerchant();
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [routeMerchantId, user]);

  useEffect(() => {
    if (targetMerchantId) {
      logSaasNavigation(
        user?.displayName || user?.email || 'Administrateur',
        config.type,
        'Établissement Principal',
        `${config.dashboardRoute}?merchantId=${targetMerchantId}&type=${config.type}`
      );
    }
  }, [targetMerchantId, config, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
            Chargement de l'interface client {config.label}...
          </p>
        </div>
      </div>
    );
  }

  return <AcomZoneMerchant overrideMerchantId={targetMerchantId || undefined} overrideSaasType={config.type} />;
};

export default SaaSRouter;
