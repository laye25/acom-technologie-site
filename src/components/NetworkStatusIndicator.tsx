import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  position?: 'bottom-right' | 'top-center' | 'inline';
}

export const NetworkStatusIndicator = ({ position = 'bottom-right' }: NetworkStatusIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (position === 'inline') {
    return (
      <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`} title={isOnline ? "Connexion établie" : "Connexion perdue"}>
        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        <span className="hidden md:inline">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
      </div>
    );
  }

  const positionClasses = position === 'top-center' 
    ? 'top-4 left-1/2 -translate-x-1/2 z-50' 
    : 'bottom-4 right-4 z-50';

  return (
    <div className={`fixed ${positionClasses} flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider transition-all ${isOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>En ligne</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Hors-ligne</span>
        </>
      )}
    </div>
  );
};
