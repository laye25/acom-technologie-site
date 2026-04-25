import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { db } from '../db/db';

interface NetworkStatusIndicatorProps {
  position?: 'bottom-right' | 'top-center' | 'inline';
}

export const NetworkStatusIndicator = ({ position = 'bottom-right' }: NetworkStatusIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and periodic polling for pending status
    const checkPending = async () => {
      try {
        const pendingSales = await db.sales.where('syncStatus').equals('pending').count();
        const pendingProducts = await db.products.where('syncStatus').equals('pending').count();
        const pendingExpenses = await db.expenses.where('syncStatus').equals('pending').count();
        setPendingCount(pendingSales + pendingProducts + pendingExpenses);
      } catch (e) {
        // Silently fail if table structure doesn't support syncStatus yet
      }
    };

    checkPending();
    const interval = setInterval(checkPending, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (position === 'inline') {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isOnline ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`} title={isOnline ? "Cloud Connecté" : "Cloud Déconnecté"}>
          {isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          <span className="hidden md:inline">{isOnline ? 'Sync Cloud' : 'Mode Local'}</span>
        </div>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[11px] font-black uppercase tracking-widest animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>{pendingCount} En attente</span>
          </div>
        )}
      </div>
    );
  }

  const positionClasses = position === 'top-center' 
    ? 'top-4 left-1/2 -translate-x-1/2 z-50' 
    : 'bottom-4 right-4 z-50';

  return (
    <div className={`fixed ${positionClasses} flex flex-col gap-2 items-end`}>
      {pendingCount > 0 && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {pendingCount} modifications locales non synchronisées
        </div>
      )}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider transition-all ${isOnline ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white'}`}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Connecté</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Mode Hors-ligne</span>
          </>
        )}
      </div>
    </div>
  );
};
