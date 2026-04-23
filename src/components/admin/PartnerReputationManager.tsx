import React, { useMemo } from 'react';
import { useFirestoreData } from '../../hooks/useFirestoreData';
import { UserProfile, PartnerRating, Order } from '../../types';
import { motion } from 'motion/react';
import { Star, TrendingUp, Users, Award, MessageSquare, Clock, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const PartnerReputationManager = () => {
  const { data: users } = useFirestoreData<UserProfile>({
    tableName: 'users'
  });

  const { data: ratings } = useFirestoreData<PartnerRating>({
    tableName: 'partner_ratings'
  });

  const { data: orders } = useFirestoreData<Order>({
    tableName: 'orders'
  });

  const partners = useMemo(() => {
    return users.filter(u => u.role === 'printer' || u.role === 'designer');
  }, [users]);

  const partnerStats = useMemo(() => {
    return partners.map(partner => {
      const partnerRatings = ratings.filter(r => r.partnerId === partner.uid || r.partnerId === (partner as any).id);
      const partnerOrders = orders.filter(o => o.partnerId === partner.uid || (o as any).partner_id === partner.uid);
      
      const avgScore = partnerRatings.length > 0 
        ? partnerRatings.reduce((acc, r) => acc + r.score, 0) / partnerRatings.length 
        : 0;

      return {
        ...partner,
        avgScore,
        totalRatings: partnerRatings.length,
        totalOrders: partnerOrders.length,
        recentRatings: partnerRatings.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        }).slice(0, 3)
      };
    }).sort((a, b) => b.avgScore - a.avgScore);
  }, [partners, ratings, orders]);

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Partenaires Actifs</p>
              <p className="text-2xl font-black text-gray-900">{partners.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Note Moyenne Réseau</p>
              <p className="text-2xl font-black text-gray-900">
                {(partnerStats.reduce((acc, p) => acc + p.avgScore, 0) / (partnerStats.filter(p => p.avgScore > 0).length || 1)).toFixed(1)}/5
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Retours Clients</p>
              <p className="text-2xl font-black text-gray-900">{ratings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Classement Qualité Partenaires</h3>
          <Award className="text-primary w-6 h-6" />
        </div>
        
        <div className="divide-y divide-gray-50">
          {partnerStats.map((partner, index) => (
            <div key={partner.uid || partner.id || index} className="p-8 hover:bg-gray-50/50 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Identity */}
                <div className="flex items-center gap-4 min-w-[250px]">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shadow-inner">
                      {partner.photoURL ? (
                        <img src={partner.photoURL} alt={partner.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Printer size={32} />
                        </div>
                      )}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1 rounded-full shadow-lg border-2 border-white">
                        <Award size={16} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-lg leading-tight">{partner.displayName || 'Partenaire Anonyme'}</h4>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{partner.role === 'printer' ? 'Imprimeur' : 'Designer'}</p>
                  </div>
                </div>

                {/* Score */}
                <div className="flex flex-col items-center lg:items-start lg:w-48">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star 
                        key={s} 
                        size={16} 
                        className={s <= Math.round(partner.avgScore) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} 
                      />
                    ))}
                    <span className="ml-2 font-black text-gray-900">{partner.avgScore.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{partner.totalRatings} avis reçus</p>
                </div>

                {/* Performance */}
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-gray-400" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Volume</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">{partner.totalOrders} commandes</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare size={14} className="text-gray-400" />
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dernier avis</p>
                    </div>
                    <p className="text-sm font-black text-gray-900 truncate">
                      {partner.recentRatings[0]?.comment || 'Pas d\'avis'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Reviews Expandable */}
              {partner.recentRatings.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  {partner.recentRatings.map((r, i) => (
                    <div key={i} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm italic text-xs text-gray-600 relative">
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} size={10} className={s <= r.score ? 'text-amber-400 fill-amber-400' : 'text-gray-100'} />
                        ))}
                        <span className="ml-auto text-[8px] font-bold text-gray-300">
                          {format(r.createdAt?.toDate?.() || new Date(r.createdAt), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </div>
                      "{r.comment || 'Sans commentaire'}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
