import React, { useState, useEffect, useRef } from 'react';
import { Message, UserProfile } from '../../types';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Send, User, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PartnerChatProps {
  partnerId: string;
  adminId: string;
  partnerName?: string;
  isAdminView?: boolean;
}

export const PartnerChat: React.FC<PartnerChatProps> = ({ 
  partnerId, 
  adminId, 
  partnerName = 'Partenaire',
  isAdminView = false 
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Deterministic chatId for this pair
  const chatId = `chat_${[partnerId, adminId].sort().join('_')}`;

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        chatService.connect();
        chatService.joinRoom(chatId);
        
        // Load history
        const history = await chatService.getMessages(chatId);
        setMessages(history);
        
        // Listen for new messages
        chatService.onMessage((msg) => {
          if (msg.chatId === chatId) {
            setMessages(prev => {
              // Avoid duplicates if Firestore listener also triggered something
              if (prev.find(m => m.id === msg.id || (m.timestamp === msg.timestamp && m.text === msg.text))) {
                 return prev;
              }
              return [...prev, msg];
            });
          }
        });
      } catch (error) {
        console.error("Chat init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      // socket off is handled in service or we can add off here if needed
    };
  }, [chatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !user) return;

    const msgData: Partial<Message> = {
      senderId: user.uid,
      receiverId: isAdminView ? partnerId : adminId,
      text: newMessage.trim(),
      chatId,
      timestamp: new Date().toISOString(),
      read: false
    };

    chatService.sendMessage(msgData);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden border-2 border-black/5">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">
              {isAdminView ? partnerName : 'Support Acom Technologie'}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400">En ligne</span>
            </div>
          </div>
        </div>
        <MessageCircle className="text-gray-300 w-5 h-5" />
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Chargement de la discussion...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">Aucun message pour le moment.</p>
            <p className="text-xs text-gray-400 mt-1">Commencez la conversation en envoyant un message ci-dessous.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div 
                key={idx}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`px-4 py-3 rounded-2xl text-sm font-medium shadow-sm transition-all hover:scale-[1.02] ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-black uppercase text-gray-400 mt-1.5 px-1 tracking-widest">
                    {format(new Date(msg.timestamp), 'HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-50/50 border-t border-gray-100">
        <div className="relative">
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            className="w-full pl-6 pr-14 py-4 bg-white border border-black/5 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-sm"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-2 bottom-2 px-4 bg-primary text-white rounded-xl hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};
