import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

export const NetworkStatusIndicator = () => {
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

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-xs font-bold uppercase tracking-wider transition-all ${isOnline ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
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
