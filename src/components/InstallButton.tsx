import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Vérifier si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast('Pour installer l\'application, utilisez le menu de votre navigateur et sélectionnez "Ajouter à l\'écran d\'accueil".', {
        icon: '📱',
        duration: 5000,
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center space-x-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-hover transition-all shadow-lg shadow-primary/20"
      title="Installer l'application"
    >
      <Download className="w-4 h-4" />
      <span className="hidden md:inline">Installer l'app</span>
    </button>
  );
};
