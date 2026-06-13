import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { getAiClient, getGeminiModel } from '../lib/gemini';
import { db as dexieDb } from '../db/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Service } from '../types';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Bonjour ! Je suis l'assistant IA d'Acom Technologie. Comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const services = useLiveQuery(() => dexieDb.services.toArray(), []) || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getAiClient();
      if (!ai) {
        setMessages(prev => [...prev, { role: 'model', text: "L'assistant IA n'est pas configuré pour le moment." }]);
        setIsLoading(false);
        return;
      }
      const model = getGeminiModel();
      
      const systemInstruction = `Tu es l'assistant intelligent d'Acom Technologie, une agence digitale basée au Sénégal.
      Ton but est d'aider les clients à comprendre nos services, notre portfolio et à passer commande.
      
      Voici les services que nous proposons actuellement :
      ${services.map(s => `- ${s.name} (${s.category}): ${s.shortDescription || s.description}. Prix: ${s.price} FCFA`).join('\n')}
      
      Informations importantes :
      - Nous sommes spécialisés dans le développement web, mobile, le design et le marketing digital.
      - Les clients peuvent commander directement sur le site.
      - Nous mettons l'accent sur la qualité, l'innovation et la satisfaction client.
      - Sois professionnel, accueillant et utilise un ton moderne.
      - Réponds principalement en français, mais tu peux utiliser quelques mots de wolof si c'est approprié pour saluer ou remercier (ex: "Salaam", "Jërëjëf").
      - Si tu ne connais pas une réponse spécifique, invite le client à nous contacter via la page Contact.
      - Garde tes réponses concises et structurées.`;

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: systemInstruction,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: userMessage });
      const responseText = result.text;

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Désolé, j'ai rencontré une petite erreur technique. Pouvez-vous reformuler votre question ?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 max-md:bottom-4 max-md:left-4 z-[9999] flex flex-col items-start">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? 'auto' : '500px',
            }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-4 flex flex-col w-[calc(100vw-2rem)] max-w-[350px] md:w-[350px] max-md:fixed max-md:bottom-24 max-md:left-4 max-md:right-4 max-md:max-w-none max-md:w-auto"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Assistant Acom</h3>
                  <div className="flex items-center text-[10px] opacity-80">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    En ligne
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-hide"
                >
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        m.role === 'user' 
                          ? 'bg-primary text-white rounded-tr-none' 
                          : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-tl-none'
                      }`}>
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white p-3 rounded-2xl text-sm shadow-sm border border-gray-100 rounded-tl-none flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-gray-400">L'IA réfléchit...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Posez votre question..."
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 text-[10px] text-center text-gray-400 flex items-center justify-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Propulsé par Gemini AI</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-white text-primary' : 'bg-primary text-white'
        }`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm"
          />
        )}
      </motion.button>
    </div>
  );
};

export default AIAssistant;
