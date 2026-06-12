import React from 'react';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';

interface MailSuccessToastProps {
  toastId: string;
  message: string;
}

export const MailSuccessToastComponent: React.FC<MailSuccessToastProps> = ({ toastId, message }) => {
  return (
    <div
      id="mail_success_custom_toast"
      className="max-w-xs w-72 bg-white shadow-[0_20px_50px_rgba(30,41,59,0.18)] rounded-[32px] pointer-events-auto flex flex-col items-center p-6 border border-slate-100 text-center relative mt-14 transform transition-all duration-300 ease-out"
    >
      {/* 3D Bell/Mail Notification Header Icon from the Image Design */}
      <div id="toast_icon_container" className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
        {/* Shadowed circular container */}
        <div className="relative bg-white rounded-full p-2 text-center flex items-center justify-center shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-slate-100">
          
          {/* Wave/Signal Sound wave indicators left and right */}
          <div className="absolute left-[-14px] top-1/2 -translate-y-1/2 flex gap-[2px] items-center text-indigo-400 select-none">
            <svg width="4" height="10" viewBox="0 0 6 12" fill="none" className="opacity-40">
              <path d="M5 1C3 4 3 8 5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <svg width="6" height="16" viewBox="0 0 8 18" fill="none" className="opacity-70">
              <path d="M6 1C2 5.5 2 12.5 6 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <div className="absolute right-[-14px] top-1/2 -translate-y-1/2 flex gap-[2px] items-center text-indigo-400 flex-row-reverse select-none">
            <svg width="4" height="10" viewBox="0 0 6 12" fill="none" className="opacity-40">
              <path d="M1 1C3 4 3 8 1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <svg width="6" height="16" viewBox="0 0 8 18" fill="none" className="opacity-70">
              <path d="M2 1C6 5.5 6 12.5 2 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Icon Inner wrapper with beautiful deep blue styling matching the design */}
          <div className="bg-gradient-to-tr from-indigo-50/80 to-[#E8EEFF] text-indigo-500 rounded-full p-3.5 flex items-center justify-center relative shadow-inner">
            <Mail className="w-8 h-8 text-[#5C7CFA]" />
            
            {/* Red Circle badge with "1" */}
            <span className="absolute -top-1 -right-1 bg-[#FF3B30] text-white font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white shadow-[0_2px_6px_rgba(255,59,48,0.3)]">
              1
            </span>
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div id="toast_body" className="mt-7 mb-4">
        <h4 className="text-[16px] font-black text-[#1E293B] tracking-tight font-sans">
          Notification Gérant
        </h4>
        <p className="text-[10px] font-bold text-slate-400 mt-2 max-w-[210px] mx-auto leading-relaxed uppercase tracking-wider">
          Envoi d&apos;e-mail
        </p>
        <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-[210px] mx-auto leading-normal">
          {message}
        </p>
      </div>

      {/* Red/Coral Pill button matching the "Open" button */}
      <button
        id="toast_dismiss_button"
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="w-full py-2 bg-gradient-to-r from-[#FF4D4D] to-[#FF3B30] hover:from-[#FF3B30] hover:to-[#E02424] active:scale-[0.97] text-white text-[11px] font-extrabold rounded-full transition-all duration-200 shadow-[0_4px_12px_rgba(255,59,48,0.25)] hover:shadow-[0_6px_16px_rgba(255,59,48,0.35)] tracking-wide uppercase"
      >
        D&apos;accord
      </button>
    </div>
  );
};

export const showMailSuccessToast = (message: string = "Ce mail envoyé en arrière-plan avec succès !") => {
  toast.custom(
    (t) => <MailSuccessToastComponent toastId={t.id} message={message} />,
    {
      duration: 6000,
      position: 'top-center',
    }
  );
};
