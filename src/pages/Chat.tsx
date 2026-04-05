import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dbService as db } from '../services/firebaseDbService';
import { Message, Order, Service } from '../types';
import { useFirebaseData, CollectionName } from '../hooks/useFirebase';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Paperclip, Clock, User, ShieldCheck, MessageSquare, ChevronLeft, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SERVICES as STATIC_SERVICES } from '../constants';
import { notificationService } from '../services/notificationService';
import { UserProfile } from '../types';

const Chat = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAdmin, isManager } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatOptions = useMemo(() => {
    if (!user || !orderId) return { collectionName: 'messages' as CollectionName, skip: true };
    
    const filters = [{ column: 'orderId', value: orderId }];
    if (!isAdmin && !isManager) {
      filters.push({ column: 'clientUid', value: user.uid });
    }
    
    return {
      collectionName: 'messages' as CollectionName,
      filters,
      skip: false
    };
  }, [orderId, user, isAdmin, isManager]);

  const orderOptions = useMemo(() => {
    if (!user || !orderId) return { collectionName: 'orders' as CollectionName, skip: true };
    
    const filters = [{ column: 'id', value: orderId }];
    if (!isAdmin && !isManager) {
      filters.push({ column: 'userId', value: user.uid });
    }
    
    return {
      collectionName: 'orders' as CollectionName,
      filters,
      skip: false
    };
  }, [orderId, user, isAdmin, isManager]);

  const serviceOptions = useMemo(() => ({
    collectionName: 'services' as CollectionName
  }), []);

  const { data: messages, loading: messagesLoading, error: messagesError } = useFirebaseData<Message>(chatOptions);
  const { data: orderData, loading: orderLoading, error: orderError } = useFirebaseData<Order>(orderOptions);
  const { data: dynamicServices } = useFirebaseData<Service>(serviceOptions);

  const order = orderData?.[0] || null;

  const userProfileOptions = useMemo(() => ({
    collectionName: 'users' as CollectionName,
    filters: order ? [{ column: 'uid', value: order.userId }] : [],
    skip: !order || !(isAdmin || isManager)
  }), [order, isAdmin, isManager]);

  const { data: userProfiles } = useFirebaseData<UserProfile>(userProfileOptions);
  const client = userProfiles?.[0] || null;

  const allServices = useMemo(() => {
    const combined = [...STATIC_SERVICES];
    dynamicServices.forEach(ds => {
      if (!combined.find(s => s.id === ds.id)) {
        combined.push(ds);
      }
    });
    return combined;
  }, [dynamicServices]);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Chat state:', { 
      orderId, 
      messagesLoading, 
      messagesCount: messages?.length, 
      orderLoading,
      orderFound: !!order
    });
    if (messagesError || orderError) {
      console.error('Chat error details:', messagesError || orderError);
      setError("Erreur lors du chargement de la discussion. Vérifiez votre connexion ou les index Firestore.");
    }
  }, [messagesError, orderError, messages, messagesLoading, orderLoading, order, orderId]);

  const sortedMessages = useMemo(() => {
    if (!messages) return [];
    return [...messages].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages]);

  useEffect(() => {
    if (!orderId || !user) return;

    const clearUnread = async () => {
      if ((isAdmin || isManager) && order?.unreadByAdmin) {
        await db.orders.save({ id: orderId, unreadByAdmin: false });
      } else if (!(isAdmin || isManager) && order?.unreadByClient) {
        await db.orders.save({ id: orderId, unreadByClient: false });
      }
    };

    clearUnread();
  }, [orderId, user, isAdmin, isManager, order?.unreadByAdmin, order?.unreadByClient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to send message...', { inputText, orderId, userId: user?.uid });
    if (!inputText.trim() || !user || !orderId || isSending) {
      console.log('Send blocked:', { 
        empty: !inputText.trim(), 
        noUser: !user, 
        noOrderId: !orderId, 
        alreadySending: isSending 
      });
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const clientUid = (isAdmin || isManager) ? order?.userId : user.uid;
      console.log('Saving message to Firestore...');
      
      const messageId = await db.messages.save({
        orderId: orderId,
        senderId: user.uid,
        senderName: profile?.displayName || user.email?.split('@')[0] || 'Utilisateur',
        text: inputText,
        isAdmin: isAdmin || isManager || false,
        clientUid: clientUid
      });
      console.log('Message saved successfully, ID:', messageId);
      
      // Clear input immediately on message success
      setInputText('');

      try {
        console.log('Updating order status...');
        // Update order's updatedAt and unread flags
        await db.orders.save({
          id: orderId,
          unreadByAdmin: !(isAdmin || isManager),
          unreadByClient: (isAdmin || isManager)
        });
        console.log('Order updated successfully');

        // Trigger notifications
        if (order) {
          const senderName = profile?.displayName || user.email?.split('@')[0] || 'Utilisateur';
          if (isAdmin || isManager) {
            // Admin sending to Client
            if (client?.email) {
              await notificationService.notifyNewMessage(order, senderName, order.userId, client.email, inputText);
            }
          } else {
            // Client sending to Admin
            // In a real app, you'd fetch the admin email from settings or a specific admin user
            const adminEmail = 'contact.abdoulayendiaye@gmail.com'; // Default admin email
            await notificationService.notifyNewMessage(order, senderName, 'admin', adminEmail, inputText);
          }
        }
      } catch (orderErr) {
        // Log but don't block UI if order update fails but message succeeded
        console.warn('Order status update failed (likely permission issue), but message was sent:', orderErr);
      }
      
    } catch (err: any) {
      console.error('Send message error details:', err);
      setError("Impossible d'envoyer le message. Veuillez vérifier votre connexion ou les règles de sécurité.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // In a real app, we would upload to Firebase Storage
    // For now, we'll simulate it with a message
    alert(`Simulation d'envoi de fichier: ${file.name}\n(L'intégration Firebase Storage n'est pas encore configurée)`);
  };

  const service = order ? allServices.find(s => s.id === order.serviceId) : null;

  if (orderError || messagesError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          {orderError?.message || messagesError?.message || "Nous n'avons pas pu charger cette conversation. Vérifiez vos permissions ou votre connexion."}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all"
          >
            Réessayer
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  if ((messagesLoading && messages.length === 0) || orderLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Chargement de la discussion...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-32 pb-6 h-[calc(100vh-20px)] flex flex-col">
      {/* Header */}
      <div className="bg-white rounded-t-3xl border border-black/5 p-4 md:p-6 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors md:hidden"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-light rounded-2xl flex items-center justify-center shrink-0">
            {service?.image ? (
              <img src={service.image} alt="" className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
            ) : (
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold text-gray-900 line-clamp-1">
              {service?.name || 'Discussion Projet'}
            </h1>
            <p className="text-[10px] md:text-xs text-gray-400">Commande #{orderId?.slice(0, 8)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {(isAdmin || isManager) && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-primary-light text-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              <span>{isAdmin ? 'Admin' : 'Gestionnaire'}</span>
            </div>
          )}
          <div className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`} title="En ligne" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-grow overflow-y-auto bg-gray-50/50 p-4 md:p-6 space-y-6 scrollbar-hide" ref={scrollRef}>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-medium flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}
        {sortedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="w-8 h-8 text-gray-200" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Démarrez la conversation</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Posez vos questions ou envoyez vos fichiers ici. Notre équipe vous répondra dans les plus brefs délais.
            </p>
          </div>
        ) : (
          sortedMessages.map((msg, i) => {
            const isMe = msg.senderId === user?.uid;
            const showDateSeparator = i === 0 || !isSameDay(
              msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(),
              sortedMessages[i-1].createdAt?.toDate ? sortedMessages[i-1].createdAt.toDate() : new Date()
            );

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-8">
                    <span className="px-4 py-1 bg-gray-200/50 text-gray-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'dd MMMM yyyy', { locale: fr }) : 'Aujourd\'hui'}
                    </span>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                    {!isMe && (
                      <p className="text-[10px] font-bold text-gray-400 mb-1 ml-1 flex items-center">
                        {msg.isAdmin ? (
                          <span className="flex items-center text-primary">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            Support {msg.isAdmin ? 'Admin' : 'Equipe'}
                          </span>
                        ) : (
                          msg.senderName || 'Client'
                        )}
                      </p>
                    )}
                    
                    <div className={`group relative px-4 py-3 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20' 
                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.text}
                      
                      {/* Message Status/Time Overlay on hover or small */}
                      <div className={`mt-1 text-[9px] flex items-center ${isMe ? 'text-white/70 justify-end' : 'text-gray-400 justify-start'}`}>
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm', { locale: fr }) : '...'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white rounded-b-3xl border border-black/5 p-4 shadow-sm">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-primary hover:bg-primary-light rounded-2xl transition-all"
            title="Joindre un fichier"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <div className="flex-grow relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Écrivez votre message..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-12"
            />
            {inputText.trim() && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/40 uppercase tracking-tighter pointer-events-none">
                Entrée
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className={`p-3 rounded-2xl transition-all shadow-md flex items-center justify-center ${
              !inputText.trim() || isSending
                ? 'bg-gray-100 text-gray-400 shadow-none'
                : 'bg-primary text-white hover:bg-primary-hover shadow-primary/20'
            }`}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        
        <div className="mt-2 flex items-center justify-center space-x-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
          <span className="flex items-center"><ImageIcon className="w-3 h-3 mr-1" /> Images</span>
          <span className="flex items-center"><FileText className="w-3 h-3 mr-1" /> Documents</span>
          <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Support 24/7</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
