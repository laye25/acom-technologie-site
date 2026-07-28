// src/ai-demo/components/ActionConfirmationModal.tsx
// High-fidelity security confirmation dialog for SENSIBLE actions

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationGuard, PendingConfirmationRequest } from '../SaaSGateway/ConfirmationGuard';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export const ActionConfirmationModal: React.FC = () => {
  const [pendingRequest, setPendingRequest] = useState<PendingConfirmationRequest | null>(null);

  useEffect(() => {
    ConfirmationGuard.registerHandler((req) => {
      setPendingRequest(req);
    });

    return () => {
      ConfirmationGuard.unregisterHandler();
    };
  }, []);

  if (!pendingRequest) return null;

  const handleConfirm = () => {
    if (pendingRequest) {
      pendingRequest.resolve(true);
      setPendingRequest(null);
    }
  };

  const handleCancel = () => {
    if (pendingRequest) {
      pendingRequest.resolve(false);
      setPendingRequest(null);
    }
  };

  const { action, params, context } = pendingRequest;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 overflow-hidden relative"
        >
          {/* Top Banner */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                SÉCURITÉ SAAS — ACTION SENSIBLE
              </span>
              <h3 className="text-lg font-bold text-white">Confirmation Requise</h3>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <p>
              L'intelligence de gestion Acom IA s'apprête à exécuter une opération sensible sur le SaaS <strong className="text-white uppercase">{context.activeSaaS}</strong> :
            </p>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Action :</span>
                <span className="font-mono text-amber-300">{action.id}</span>
              </div>
              <div className="font-semibold text-base text-white">{action.name}</div>
              <p className="text-xs text-slate-400">{action.description}</p>
            </div>

            {/* Parameters */}
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-1">Paramètres de l'opération :</span>
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>

            <p className="text-xs text-slate-400 italic">
              Veuillez vérifier rigoureusement les montants et les paramètres avant de confirmer.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4 text-slate-400" />
              Refuser / Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Autoriser & Exécuter
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
