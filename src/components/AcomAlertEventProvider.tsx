import React, { useState, useEffect } from 'react';
import { AcomAlertPopup, AcomAlertPopupProps } from './AcomAlertPopup';

export const AcomAlertEventProvider: React.FC = () => {
  const [popup, setPopup] = useState<AcomAlertPopupProps>({
    isOpen: false,
    onClose: () => setPopup(prev => ({ ...prev, isOpen: false })),
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    const handleShowAlert = (e: any) => {
      setPopup({
        isOpen: true,
        onClose: () => setPopup(prev => ({ ...prev, isOpen: false })),
        title: e.detail.title,
        message: e.detail.message,
        type: e.detail.type || 'info',
        subtitle: e.detail.subtitle,
        showCancel: e.detail.showCancel,
        confirmText: e.detail.confirmText || "D'ACCORD",
        onConfirm: e.detail.onConfirm
      });
    };

    window.addEventListener('SHOW_ACOM_ALERT', handleShowAlert);
    return () => window.removeEventListener('SHOW_ACOM_ALERT', handleShowAlert);
  }, []);

  return <AcomAlertPopup {...popup} />;
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
