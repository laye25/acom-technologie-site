import React, { useState, useCallback } from 'react';
import { Info, CheckCircle, AlertCircle } from 'lucide-react';

export interface AcomAlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
}

export const AcomAlertPopup: React.FC<AcomAlertPopupProps> = ({
  isOpen,
  onClose,
  title,
  subtitle = 'ALERTE SYSTÈME',
  message,
  type = 'info',
  onConfirm,
  confirmText = "D'ACCORD",
  showCancel = false
}) => {
  if (!isOpen) return null;

  let colorBg = 'bg-indigo-50';
  let colorText = 'text-indigo-600';
  let btnColors = 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25';
  let IconComponent = Info;

  if (type === 'success') {
    colorBg = 'bg-indigo-50';
    colorText = 'text-indigo-600';
    btnColors = 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25';
    IconComponent = CheckCircle;
  } else if (type === 'error') {
    colorBg = 'bg-rose-50';
    colorText = 'text-rose-600';
    btnColors = 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25';
    IconComponent = AlertCircle;
  } else if (type === 'warning') {
    colorBg = 'bg-amber-50';
    colorText = 'text-amber-600';
    btnColors = 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/25';
    IconComponent = AlertCircle;
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative max-w-sm w-full bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl p-8 pt-16 text-center space-y-6 mt-10 transition-all transform scale-100">
        
        {/* Floating Circle Overlay */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100/50">
          <div className={`w-20 h-20 ${colorBg} ${colorText} rounded-full flex items-center justify-center shadow-inner relative`}>
            {type === 'success' ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            ) : (
              <IconComponent className="w-10 h-10 stroke-[2.5]" />
            )}
            {type === 'success' && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-6 h-6 text-xs font-black flex items-center justify-center border-2 border-white shadow-sm">1</span>
            )}
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          {subtitle && (
            <span className="text-[10px] tracking-widest font-black uppercase text-gray-400 block">{subtitle}</span>
          )}
          <h4 className="text-lg font-black text-slate-800 leading-tight">{title}</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed px-1 whitespace-pre-line">{message}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 pt-2">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-100 rounded-2xl active:scale-95 transition-all outline-none"
            >
              ANNULER
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              }
              onClose();
            }}
            className={`flex-1 py-4 text-xs font-black text-white rounded-2xl active:scale-95 transition-all outline-none ${btnColors}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};



export const useAcomAlert = () => {
  const [popup, setPopup] = useState<AcomAlertPopupProps>({
    isOpen: false,
    onClose: () => setPopup(prev => ({ ...prev, isOpen: false })),
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = useCallback((
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    subtitle?: string,
    showCancel = false,
    confirmText = "D'ACCORD",
    onConfirm?: () => void
  ) => {
    setPopup({
      isOpen: true,
      onClose: () => setPopup(prev => ({ ...prev, isOpen: false })),
      title,
      message,
      type,
      subtitle,
      showCancel,
      confirmText,
      onConfirm
    });
  }, []);

  const hideAlert = useCallback(() => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  }, []);

  const AlertComponent = useCallback(() => <AcomAlertPopup {...popup} />, [popup]);

  return { showAlert, hideAlert, AlertComponent, popup };
};
