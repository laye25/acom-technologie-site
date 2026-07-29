// src/ai-demo/components/VoiceOrbIndicator.tsx
// Visual State Indicator (Voice Orb) displaying real-time AI Assistant voice states

import React from 'react';
import { motion } from 'framer-motion';
import { VoiceSessionInfo, VoiceSessionManager } from '../Assistant/VoiceSessionManager';
import { ConfirmationGuard } from '../SaaSGateway/ConfirmationGuard';
import { Mic, Volume2, ShieldAlert, AlertTriangle, X, Check, Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface VoiceOrbIndicatorProps {
  sessionInfo: VoiceSessionInfo;
  onStop: () => void;
}

export const VoiceOrbIndicator: React.FC<VoiceOrbIndicatorProps> = ({ sessionInfo, onStop }) => {
  const { state, statusText, transcript, errorMessage, pendingConfirmation } = sessionInfo;

  // Determine colors & icons based on state
  const getStateMeta = () => {
    switch (state) {
      case 'listening':
        return {
          title: 'MODE CONVERSATION VOCALE',
          badge: 'ÉCOUTE ACTIVE',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          ringColor: 'border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.3)]',
          glowBg: 'from-cyan-600/30 via-indigo-600/20 to-emerald-600/30',
          icon: <Mic className="w-6 h-6 text-cyan-300 animate-pulse" />
        };
      case 'speech_detected':
      case 'transcribing':
        return {
          title: 'DÉTECTION VOCALE',
          badge: 'RÉCEPTION...',
          badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          ringColor: 'border-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.4)]',
          glowBg: 'from-cyan-500/40 via-blue-600/30 to-purple-600/30',
          icon: <Sparkles className="w-6 h-6 text-cyan-200 animate-spin" />
        };
      case 'understanding':
      case 'processing':
        return {
          title: 'COMPRÉHENSION & TRAITEMENT',
          badge: 'ANALYSE NLU',
          badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          ringColor: 'border-purple-500/70 shadow-[0_0_40px_rgba(168,85,247,0.4)]',
          glowBg: 'from-purple-600/40 via-indigo-600/40 to-cyan-600/30',
          icon: <Loader2 className="w-6 h-6 text-purple-300 animate-spin" />
        };
      case 'speaking':
        return {
          title: 'NARRATION VOCALE',
          badge: 'PAROLE ACOM IA',
          badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
          ringColor: 'border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.4)]',
          glowBg: 'from-blue-600/40 via-cyan-500/30 to-indigo-600/40',
          icon: <Volume2 className="w-6 h-6 text-blue-200 animate-bounce" />
        };
      case 'awaiting_confirmation':
        return {
          title: 'CONFIRMATION SÉCURISÉE REQUISE',
          badge: 'ACTION SENSIBLE',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          ringColor: 'border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.5)]',
          glowBg: 'from-amber-600/40 via-orange-600/30 to-amber-500/30',
          icon: <ShieldAlert className="w-6 h-6 text-amber-300 animate-pulse" />
        };
      case 'error':
        return {
          title: 'ANOMALIE VOCALE',
          badge: 'ERREUR',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          ringColor: 'border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)]',
          glowBg: 'from-rose-600/30 to-slate-900',
          icon: <AlertTriangle className="w-6 h-6 text-rose-400" />
        };
      default:
        return {
          title: 'MODE VOCAL',
          badge: 'EN ATTENTE',
          badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
          ringColor: 'border-slate-700 shadow-none',
          glowBg: 'from-slate-800 to-slate-900',
          icon: <Mic className="w-6 h-6 text-slate-400" />
        };
    }
  };

  const meta = getStateMeta();

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 my-2 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Glow background */}
      <div className={`absolute inset-0 bg-gradient-to-r ${meta.glowBg} opacity-25 pointer-events-none transition-all duration-700`} />

      {/* Top Header */}
      <div className="flex justify-between items-center relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wider ${meta.badgeBg}`}>
            {meta.badge}
          </span>
          <span className="text-xs font-semibold text-slate-200">{meta.title}</span>
        </div>

        <button
          onClick={onStop}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700 flex items-center gap-1 text-xs font-medium"
          title="Quitter la conversation vocale"
        >
          <X className="w-3.5 h-3.5" />
          <span>Arrêter</span>
        </button>
      </div>

      {/* Center Animated Orb */}
      <div className="flex flex-col items-center justify-center py-4 relative z-10">
        <div className="relative flex items-center justify-center">
          {/* Animated Outer Pulse Ring */}
          {(state === 'listening' || state === 'speaking' || state === 'awaiting_confirmation') && (
            <motion.div
              animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: state === 'speaking' ? 1.2 : 2.0, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full border-2 ${meta.ringColor}`}
            />
          )}

          {/* Orb Sphere */}
          <div className={`w-16 h-16 rounded-full border-2 ${meta.ringColor} bg-slate-900/90 flex items-center justify-center relative z-10 shadow-lg`}>
            {meta.icon}
          </div>
        </div>

        {/* Audio Visualizer Waves if speaking or listening */}
        {(state === 'speaking' || state === 'listening' || state === 'speech_detected') && (
          <div className="flex items-center gap-1 mt-3">
            {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.8].map((val, idx) => (
              <motion.div
                key={idx}
                animate={{ scaleY: [0.3, val, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6 + idx * 0.1,
                  ease: 'easeInOut'
                }}
                className={`w-1 rounded-full ${
                  state === 'speaking'
                    ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                    : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                }`}
                style={{ height: '16px' }}
              />
            ))}
          </div>
        )}

        {/* Status Text / Speech Prompt */}
        <p className="mt-3 text-sm font-medium text-slate-100 text-center max-w-sm px-2 leading-relaxed">
          {statusText || 'Conversation active'}
        </p>

        {/* Manual Send Voice Chunk Button */}
        {(state === 'listening' || state === 'speech_detected') && (
          <button
            onClick={() => VoiceSessionManager.triggerSendVoiceChunk()}
            className="mt-2 py-1 px-3 rounded-full bg-cyan-600/80 hover:bg-cyan-500 text-white font-semibold text-[11px] shadow transition flex items-center gap-1.5 border border-cyan-400/40"
          >
            <Mic className="w-3 h-3 animate-pulse text-cyan-200" />
            <span>Envoyer la parole maintenant</span>
          </button>
        )}

        {/* Transcript preview */}
        {transcript && state !== 'speaking' && (
          <div className="mt-2 text-xs font-mono text-cyan-300/90 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 max-w-xs truncate">
            « {transcript} »
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <p className="mt-2 text-xs text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 text-center">
            {errorMessage}
          </p>
        )}
      </div>

      {/* Retry Button if Error State */}
      {state === 'error' && (
        <div className="mt-2 pt-3 border-t border-slate-800 flex gap-2 relative z-10">
          <button
            onClick={() => VoiceSessionManager.retrySession()}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer la connexion micro</span>
          </button>
        </div>
      )}

      {/* Confirmation Quick Action Buttons if Awaiting Confirmation */}
      {state === 'awaiting_confirmation' && pendingConfirmation && (
        <div className="mt-2 pt-3 border-t border-slate-800 flex gap-2 relative z-10">
          <button
            onClick={() => ConfirmationGuard.resolvePendingRequest(false)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Refuser (Non)</span>
          </button>
          <button
            onClick={() => ConfirmationGuard.resolvePendingRequest(true)}
            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Autoriser (Oui)</span>
          </button>
        </div>
      )}
    </div>
  );
};
