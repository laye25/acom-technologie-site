import React, { useState, useEffect, useCallback } from 'react';
import { AcomAlertPopup, AcomAlertPopupProps } from './AcomAlertPopup';

export const AcomAlertEventProvider: React.FC = () => {
  const [queue, setQueue] = useState<AcomAlertPopupProps[]>([]);
  const [currentPopup, setCurrentPopup] = useState<AcomAlertPopupProps | null>(null);

  useEffect(() => {
    const handleShowAlert = (e: any) => {
      const detail = e.detail;
      if (!detail) return;

      const newItem: AcomAlertPopupProps = {
        isOpen: true,
        onClose: () => {},
        title: detail.title,
        message: detail.message,
        type: detail.type || 'info',
        subtitle: detail.subtitle,
        showCancel: detail.showCancel,
        confirmText: detail.confirmText || "D'ACCORD",
        onConfirm: detail.onConfirm
      };

      setQueue(prevQueue => [...prevQueue, newItem]);
    };

    window.addEventListener('SHOW_ACOM_ALERT', handleShowAlert);
    return () => window.removeEventListener('SHOW_ACOM_ALERT', handleShowAlert);
  }, []);

  useEffect(() => {
    if (!currentPopup && queue.length > 0) {
      const nextAlert = queue[0];
      setQueue(prev => prev.slice(1));
      setCurrentPopup(nextAlert);
    }
  }, [queue, currentPopup]);

  const handleClose = useCallback(() => {
    setCurrentPopup(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (currentPopup?.onConfirm) {
      try {
        currentPopup.onConfirm();
      } catch (err) {
        console.error("Error in alert onConfirm callback:", err);
      }
    }
    setCurrentPopup(null);
  }, [currentPopup]);

  if (!currentPopup) return null;

  return (
    <AcomAlertPopup
      {...currentPopup}
      isOpen={true}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );
};

export const triggerAcomAlert = (
  title: string,
  message: string,
  type: 'success' | 'warning' | 'error' | 'info' = 'info',
  subtitle?: string,
  showCancel = false,
  confirmText = "D'ACCORD",
  onConfirm?: () => void
) => {
  const event = new CustomEvent('SHOW_ACOM_ALERT', {
    detail: { title, message, type, subtitle, showCancel, confirmText, onConfirm }
  });
  window.dispatchEvent(event);
};

// Global override hook
export const useAcomToastOverride = () => {
  return {
    success: (msg: string) => triggerAcomAlert('Succès', msg, 'success', 'TRANSACTION RÉUSSIE'),
    error: (msg: string) => triggerAcomAlert('Alerte', msg, 'error', 'ATTENTION'),
    warning: (msg: string) => triggerAcomAlert('Attention', msg, 'warning', 'SYSTÈME'),
    info: (msg: string) => triggerAcomAlert('Information', msg, 'info', 'NOTIFICATION'),
    loading: (msg: string) => msg, // Return something to not break toast.loading, although actual toast loading can safely stay as standard toast
  };
};
