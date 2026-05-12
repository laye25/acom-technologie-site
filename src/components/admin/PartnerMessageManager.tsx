import React, { useMemo, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { syncService } from '../../services/syncService';
import { UserProfile } from '../../types';
import { MessageSquare, User, Loader2, Search, ArrowRight } from 'lucide-react';
import { PartnerChat } from '../chat/PartnerChat';
import { motion, AnimatePresence } from 'motion/react';

export const PartnerMessageManager = () => {
    const { user, isAdmin, isManager } = useAuth();
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (isAdmin || isManager) {
            syncService.syncUsers('');
        }
    }, [isAdmin, isManager]);

    const partners = useLiveQuery(() => 
        db.users.where('role').anyOf(['printer', 'designer']).toArray()
    , []) || [];

    const loading = !partners && (isAdmin || isManager);

    const filteredPartners = useMemo(() => {
        return partners.filter(p => 
            p.displayName?.toLowerCase().includes(search.toLowerCase()) ||
            p.partnerDetails?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
            p.email?.toLowerCase().includes(search.toLowerCase())
        );
    }, [partners, search]);

    if (loading && partners.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Chargement des partenaires...</p>
            </div>
        );
    }

    const selectedPartner = partners.find(p => p.uid === selectedPartnerId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)]">
            {/* Sidebar: Partners List */}
            <div className="lg:col-span-4 flex flex-col space-y-6 bg-white rounded-[2.5rem] border border-black/5 p-6 shadow-sm overflow-hidden">
                <div className="space-y-4">
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Partenaires</h3>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Rechercher un partenaire..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all text-xs font-bold"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                    {filteredPartners.map(partner => (
                        <button
                            key={partner.uid}
                            onClick={() => setSelectedPartnerId(partner.uid)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                                selectedPartnerId === partner.uid 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                                : 'hover:bg-gray-50 text-gray-700 hover:scale-[1.01]'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                                selectedPartnerId === partner.uid ? 'bg-white/20 border-white/20' : 'bg-primary/5 border-primary/10'
                            }`}>
                                <User size={20} className={selectedPartnerId === partner.uid ? 'text-white' : 'text-primary'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black truncate text-sm uppercase tracking-tight">
                                    {partner.partnerDetails?.companyName || partner.displayName || 'Sans Nom'}
                                </p>
                                <p className={`text-[10px] font-bold uppercase tracking-widest truncate ${
                                    selectedPartnerId === partner.uid ? 'text-white/60' : 'text-gray-400'
                                }`}>
                                    {partner.role === 'printer' ? 'Imprimeur' : 'Producteur'}
                                </p>
                            </div>
                            {selectedPartnerId === partner.uid && <ArrowRight size={16} />}
                        </button>
                    ))}

                    {filteredPartners.length === 0 && (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-xs font-bold uppercase">Aucun partenaire trouvé</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-8 bg-white rounded-[3rem] border border-black/5 shadow-xl overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    {selectedPartnerId ? (
                        <motion.div 
                            key={selectedPartnerId}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            <PartnerChat 
                                partnerId={selectedPartnerId}
                                adminId={user?.uid || ''}
                                partnerName={selectedPartner?.partnerDetails?.companyName || selectedPartner?.displayName || 'Partenaire'}
                                isAdminView={true}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6"
                        >
                            <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center text-primary">
                                <MessageSquare size={48} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Messagerie Partenaires</h3>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-sm mt-2">
                                    Sélectionnez un partenaire dans la colonne de gauche pour démarrer une conversation en direct.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
