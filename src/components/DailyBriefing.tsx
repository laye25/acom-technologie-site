import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { generateDailyBriefing } from '../lib/gemini';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DailyBriefingProps {
  merchantId?: string;
  data: {
    sales: any[];
    products: any[];
    expenses: any[];
    orders?: any[];
  };
}

export const DailyBriefing: React.FC<DailyBriefingProps> = ({ merchantId, data }) => {
  const { profile } = useAuth();
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBriefing = async () => {
      setLoading(true);
      try {
        const result = await generateDailyBriefing(profile?.displayName || 'Utilisateur', data);
        setBriefing(result);
      } catch (err) {
        console.error('Failed to generate briefing:', err);
        setError('Impossible de générer le briefing matinal.');
      } finally {
        setLoading(false);
      }
    };

    if (data.sales.length > 0 || data.products.length > 0) {
      fetchBriefing();
    }
  }, [profile?.displayName, data]);

  if (loading) {
    return (
      <div className="bg-white/50 backdrop-blur-sm border border-primary/10 rounded-[2rem] p-8 mb-8">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!briefing && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-white border border-black/5 rounded-[2.5rem] p-8 mb-12 shadow-sm group hover:shadow-md transition-all"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Sparkles className="w-32 h-32 text-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Briefing Matinal • {format(new Date(), 'EEEE d MMMM', { locale: fr })}</h3>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-3 text-red-500 text-sm font-medium">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xl font-display font-bold text-gray-900 leading-relaxed">
              {briefing}
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover flex items-center transition-colors">
                Voir le rapport détaillé
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
