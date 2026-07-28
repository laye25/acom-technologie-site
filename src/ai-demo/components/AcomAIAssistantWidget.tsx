// src/ai-demo/components/AcomAIAssistantWidget.tsx
// Embedded & Floating AI Copilot Widget for Acom SaaS Management

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntentEngine } from '../Intelligence/IntentEngine';
import { ActionRouter } from '../SaaSGateway/ActionRouter';
import { ContextEngine } from '../Intelligence/ContextEngine';
import { LanguageEngine } from '../Assistant/LanguageEngine';
import { ConversationContext, ChatMessage } from '../Assistant/ConversationContext';
import { VoiceSessionManager, VoiceSessionInfo } from '../Assistant/VoiceSessionManager';
import { VoiceOrbIndicator } from './VoiceOrbIndicator';
import { Mic, MicOff, Send, Sparkles, Volume2, Globe, Shield, RefreshCw, X, MessageSquare, Radio } from 'lucide-react';

interface WidgetProps {
  embedded?: boolean;
  onClose?: () => void;
}

export const AcomAIAssistantWidget: React.FC<WidgetProps> = ({ embedded = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [language, setLanguage] = useState<'fr' | 'wo'>('fr');
  const [voiceInfo, setVoiceInfo] = useState<VoiceSessionInfo>(VoiceSessionManager.getInfo());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = ConversationContext.subscribe(() => {
      setMessages(ConversationContext.getMessages());
      setLanguage(ConversationContext.getLanguage());
    });
    setMessages(ConversationContext.getMessages());
    setLanguage(ConversationContext.getLanguage());

    const unsubVoice = VoiceSessionManager.subscribe((info) => {
      setVoiceInfo(info);
    });

    return () => {
      unsub();
      unsubVoice();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendPrompt = async (promptToUse?: string) => {
    const text = (promptToUse || inputText).trim();
    if (!text || isProcessing) return;

    setInputText('');
    ConversationContext.addUserMessage(text);
    setIsProcessing(true);

    try {
      const context = ContextEngine.getContext();
      const lowerText = text.toLowerCase().trim();

      // Contextual Question 1: Where am I? ("Où suis-je ?")
      if (lowerText.includes('où suis-je') || lowerText.includes('ou suis je') || lowerText.includes('ou suis-je')) {
        const pageDef = ContextEngine.getActivePageDefinition();
        const msgFr = `Vous êtes actuellement dans le SaaS ${context.merchantName} (${context.activeSaaS.toUpperCase()}), sur la page "${pageDef?.name || context.currentPage}". Purpose: ${pageDef?.purpose || 'Gestion opérationnelle'}.`;
        const msgWo = `Yangi nekk ci SaaS ${context.merchantName} (${context.activeSaaS.toUpperCase()}), ci xët "${pageDef?.name || context.currentPage}".`;
        
        ConversationContext.addAssistantMessage(msgFr, msgWo, 'context.whereAmI', 'success');
        LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
        setIsProcessing(false);
        return;
      }

      // Contextual Question 2: What is this page for? ("À quoi sert cette page ?")
      if (lowerText.includes('a quoi sert') || lowerText.includes('à quoi sert') || lowerText.includes('que permet')) {
        const pageDef = ContextEngine.getActivePageDefinition();
        if (pageDef) {
          const zoneList = pageDef.zones.map(z => z.name).join(', ');
          const msgFr = `La page "${pageDef.name}" permet de : ${pageDef.purpose}. Elle comprend les zones : ${zoneList}.`;
          const msgWo = `Xët bi "${pageDef.name}" dafa am : ${pageDef.purpose}. Zones yi am na : ${zoneList}.`;

          ConversationContext.addAssistantMessage(msgFr, msgWo, 'context.pagePurpose', 'success');
          LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
          setIsProcessing(false);
          return;
        }
      }

      // Contextual Question 3: Which field corresponds to X?
      if (lowerText.includes('quel champ') || lowerText.includes('ou se trouve') || lowerText.includes('où se trouve')) {
        const pageDef = ContextEngine.getActivePageDefinition();
        if (pageDef) {
          let foundEl: any = null;
          let foundZone = '';
          for (const z of pageDef.zones) {
            for (const el of z.elements) {
              if (lowerText.includes('téléphone') || lowerText.includes('phone') || lowerText.includes('telephone')) {
                if (el.semanticId === 'client.phone') {
                  foundEl = el;
                  foundZone = z.name;
                  break;
                }
              } else if (lowerText.includes('nom')) {
                if (el.semanticId === 'client.fullName') {
                  foundEl = el;
                  foundZone = z.name;
                  break;
                }
              }
            }
            if (foundEl) break;
          }

          if (foundEl) {
            const msgFr = `Le champ recherché est "${foundEl.label}" (Identifiant: ${foundEl.acomId}), situé dans la zone "${foundZone}".`;
            const msgWo = `Champ bi mu ngi ci zone "${foundZone}" : "${foundEl.label}" (ID: ${foundEl.acomId}).`;

            ConversationContext.addAssistantMessage(msgFr, msgWo, 'context.fieldQuery', 'success', foundEl);
            LanguageEngine.speak(language === 'wo' ? msgWo : msgFr, language);
            setIsProcessing(false);
            return;
          }
        }
      }
      
      // 1. NLU Intent Parsing
      const intentResult = await IntentEngine.parseIntent(text, context);

      // 2. Business Execution
      const actionResult = await ActionRouter.dispatchIntent(intentResult, context);

      // 3. Add Assistant Message
      ConversationContext.addAssistantMessage(
        actionResult.messageFr,
        actionResult.messageWolof,
        actionResult.actionId,
        actionResult.success ? 'success' : actionResult.error === 'USER_CANCELLED' ? 'pending_confirmation' : 'failed',
        actionResult.data
      );

      // 4. Spoken Narration
      const speechText = language === 'wo' ? actionResult.messageWolof : actionResult.messageFr;
      LanguageEngine.speak(speechText, language);

    } catch (err: any) {
      console.error('[AcomAIWidget] Error handling prompt:', err);
      ConversationContext.addAssistantMessage(
        `Une erreur s'est produite : ${err?.message || 'Erreur inconnue'}`,
        `Am na erreur bu ngen fi am : ${err?.message || 'Erreur'}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleVoiceMode = () => {
    if (voiceInfo.active) {
      VoiceSessionManager.stopSession();
    } else {
      VoiceSessionManager.startSession(language);
    }
  };

  const toggleLanguage = () => {
    const next = language === 'fr' ? 'wo' : 'fr';
    ConversationContext.setLanguage(next);
  };

  const PRESET_PROMPTS = [
    { label: '📥 Nouveau Dépôt Client', promptFr: 'Ajoute un dépôt pour le client Ibou avec un acompte de 2 000 FCFA', promptWo: 'Bindal dépôt bu client Ibou acompte 2 000 FCFA' },
    { label: '🔍 Rechercher Client', promptFr: 'Recherche le client Ibou', promptWo: 'Wut client Ibou' },
    { label: '💰 Enregistrer Versement', promptFr: 'Enregistre un versement de 12 000 FCFA', promptWo: 'Bindal fey bu 12 000 FCFA' },
    { label: '📊 Clôturer la Caisse', promptFr: 'Clôture la caisse avec 15 000 FCFA comptés', promptWo: 'Tëjal caisse bi ak 15 000 FCFA' }
  ];

  const contentMarkup = (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">Acom IA Démo</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Couche Commune
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pilotez vos SaaS en langage naturel (FR / Wolof)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Continuous Voice Mode Toggle Header Button */}
          <button
            onClick={toggleVoiceMode}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 ${
              voiceInfo.active
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title={voiceInfo.active ? 'Arrêter la conversation vocale' : 'Lancer le Mode Conversation Vocale Continu'}
          >
            <Radio className={`w-3.5 h-3.5 ${voiceInfo.active ? 'text-cyan-400 animate-spin' : 'text-slate-400'}`} />
            <span>{voiceInfo.active ? 'Vocal Actif' : 'Mode Vocal'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition flex items-center gap-1.5"
            title="Changer de langue (Français / Wolof)"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === 'fr' ? '🇫🇷 FR' : '🇸🇳 WOLOF'}</span>
          </button>

          <button
            onClick={() => {
              if (voiceInfo.active) VoiceSessionManager.stopSession();
              if (onClose) onClose();
              setIsOpen(false);
            }}
            className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Fermer la fenêtre Acom IA"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Orb Indicator when Continuous Voice Mode is Active */}
      {voiceInfo.active && (
        <div className="px-4 pt-2">
          <VoiceOrbIndicator
            sessionInfo={voiceInfo}
            onStop={() => VoiceSessionManager.stopSession()}
          />
        </div>
      )}

      {/* Quick Preset Buttons */}
      <div className="p-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0">
          Raccourcis :
        </span>
        {PRESET_PROMPTS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(language === 'wo' ? p.promptWo : p.promptFr)}
            disabled={isProcessing}
            className="shrink-0 text-xs bg-slate-800/90 hover:bg-indigo-900/40 text-slate-200 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 px-3 py-1.5 rounded-xl transition font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="text-center my-2">
                <span className="text-xs bg-slate-800/80 border border-slate-700/50 text-slate-300 px-3 py-1 rounded-full inline-block">
                  {language === 'wo' && msg.textWolof ? msg.textWolof : msg.textFr}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Acom IA</span>
                  </div>
                )}

                <p className="whitespace-pre-line text-sm">
                  {language === 'wo' && msg.textWolof ? msg.textWolof : msg.textFr}
                </p>

                {msg.actionId && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Action : {msg.actionId}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold ${
                        msg.actionStatus === 'success'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : msg.actionStatus === 'pending_confirmation'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {msg.actionStatus === 'success' ? 'EXÉCUTÉE' : msg.actionStatus === 'pending_confirmation' ? 'REQUIS' : 'ÉCHEC'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 text-xs text-indigo-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyse NLU et exécution métier en cours...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic Button toggles continuous voice conversation mode */}
          <button
            type="button"
            onClick={toggleVoiceMode}
            className={`p-2.5 rounded-xl transition border ${
              voiceInfo.active
                ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border-slate-700'
            }`}
            title={voiceInfo.active ? 'Mode Vocal Actif - Appuyez pour arrêter' : 'Démarrer le Mode Conversation Vocale Continu'}
          >
            {voiceInfo.active ? <MicOff className="w-4 h-4 text-cyan-200" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === 'wo'
                ? 'Bindal fi ne: "Ajoute un produit...", "Vends 5 Senat"...'
                : 'Saisissez votre commande en langage naturel...'
            }
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2 text-xs focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md transition font-semibold"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="w-full h-[520px]">{contentMarkup}</div>;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9000]">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-96 h-[520px] shadow-2xl"
          >
            {contentMarkup}
          </motion.div>
        ) : (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs rounded-full shadow-2xl border-2 border-indigo-400/50 hover:scale-105 transition group"
            title="Ouvrir l'Assistant IA Acom (FR / Wolof)"
          >
            <div className="p-1.5 bg-indigo-500/30 rounded-full text-amber-300 group-hover:rotate-12 transition">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <span>Acom IA</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping ml-1" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
