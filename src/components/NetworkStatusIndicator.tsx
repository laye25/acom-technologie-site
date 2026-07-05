import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, HardDrive } from 'lucide-react';
import { db } from '../db/db';

interface NetworkStatusIndicatorProps {
  position?: 'bottom-right' | 'top-center' | 'inline';
  plan?: string;
}

const isDesktopMode = typeof window !== 'undefined' && (
  ('__TAURI__' in window) || 
  (window.process && (window.process as any).type) || 
  (navigator && navigator.userAgent && navigator.userAgent.toLowerCase().includes('electron')) || 
  (window.location && window.location.protocol && !['http:', 'https:'].includes(window.location.protocol))
);

const formatRelativeTime = (isoString: string | null) => {
  if (!isoString) return 'Aucune écriture';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return "À l'instant";
  if (diffSec < 60) return `Il y a ${diffSec} s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Il y a ${diffHrs} h`;
  return new Date(isoString).toLocaleDateString();
};

export const NetworkStatusIndicator = ({ position = 'bottom-right', plan }: NetworkStatusIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('last_sqlite_sync_timestamp'));
  const [relativeText, setRelativeText] = useState(() => formatRelativeTime(lastSyncTime));

  const isLocalPlan = plan === 'LOCAL' || isDesktopMode;
  const showQuotaExceeded = isQuotaExceeded && !isLocalPlan;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and periodic polling for pending status and quota
    const checkStatus = async () => {
      // Check quota status
      const quotaExceededStr = localStorage.getItem('firebase_quota_exceeded');
      if (quotaExceededStr) {
        const exceededAt = parseInt(quotaExceededStr, 10);
        if (Date.now() - exceededAt < 3600000) {
          setIsQuotaExceeded(true);
        } else {
          setIsQuotaExceeded(false);
          localStorage.removeItem('firebase_quota_exceeded');
        }
      } else {
        setIsQuotaExceeded(false);
      }

      try {
        const pendingSales = await db.sales.where('syncStatus').equals('pending').count();
        const pendingProducts = await db.products.where('syncStatus').equals('pending').count();
        const pendingExpenses = await db.expenses.where('syncStatus').equals('pending').count();
        setPendingCount(pendingSales + pendingProducts + pendingExpenses);
      } catch (e) {
        // Silently fail if table structure doesn't support syncStatus yet
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    // Subscribe to custom event for real-time SQLite writes
    const handleSyncCompleted = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.timestamp) {
        setLastSyncTime(customEvent.detail.timestamp);
      }
    };
    window.addEventListener('sqlite-sync-completed', handleSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sqlite-sync-completed', handleSyncCompleted);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const updateText = () => {
      setRelativeText(formatRelativeTime(lastSyncTime));
    };
    updateText();
    const interval = setInterval(updateText, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  if (position === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <div 
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
            showQuotaExceeded
              ? 'bg-rose-50 text-rose-600 border border-rose-100'
              : isLocalPlan 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                : isOnline 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-rose-50 text-rose-600'
          }`} 
          title={showQuotaExceeded ? "Quota Firestore Exceeded" : isLocalPlan ? "Licence Locale" : isOnline ? "Cloud Connecté" : "Cloud Déconnecté"}
        >
          {showQuotaExceeded ? <CloudOff className="w-4 h-4" /> : isLocalPlan ? <HardDrive className="w-4 h-4" /> : isOnline ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
          <span className="hidden md:inline">
            {showQuotaExceeded ? 'Quota Épuisé (Offline)' : isLocalPlan ? 'Mode Local' : isOnline ? 'Sync Cloud' : 'Mode Local'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[11px] font-black uppercase tracking-widest border border-gray-100 transition-all hover:bg-gray-100/50" title="Dernière écriture physique SQLite sur le disque">
          <HardDrive className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-600 font-bold">Écrit. Disque : {relativeText}</span>
        </div>
        
        {pendingCount > 0 && !showQuotaExceeded && (
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
      {showQuotaExceeded && (
        <div className="bg-rose-600 text-white px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
          <CloudOff className="w-3 h-3" />
          Quota Firestore épuisé - Mode Lecture seule
        </div>
      )}
      {pendingCount > 0 && !showQuotaExceeded && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          {pendingCount} modifications locales non synchronisées
        </div>
      )}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200 shadow-gray-100/30">
        <HardDrive className="w-3.5 h-3.5 text-gray-400" />
        <span>Dernière écriture disque : {relativeText}</span>
      </div>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider transition-all ${showQuotaExceeded ? 'bg-rose-700 text-white' : (isLocalPlan ? 'bg-emerald-600 text-white' : isOnline ? 'bg-blue-500 text-white' : 'bg-rose-500 text-white')}`}>
        {showQuotaExceeded ? (
          <>
            <CloudOff className="w-4 h-4" />
            <span>Quota Épuisé</span>
          </>
        ) : isLocalPlan ? (
          <>
            <HardDrive className="w-4 h-4" />
            <span>Mode Local</span>
          </>
        ) : isOnline ? (
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
