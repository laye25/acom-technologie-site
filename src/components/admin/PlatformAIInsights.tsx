import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Lightbulb, Target, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzePlatformPerformance } from '../../lib/gemini';

interface PlatformAIInsightsProps {
  orders: any[];
  services: any[];
  expenses: any[];
}

interface InsightsData {
  overview: string;
  trends: string;
  recommendations: string[];
  sentiment: string;
}

export const PlatformAIInsights: React.FC<PlatformAIInsightsProps> = ({ orders, services, expenses }) => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      if (orders.length === 0 && services.length === 0) return;
      
      setLoading(true);
      try {
        const result = await analyzePlatformPerformance(orders, services, expenses);
        if (result) {
          setInsights(result);
        }
      } catch (err) {
        console.error('Failed to fetch platform insights:', err);
        setError('Impossible d\'analyser les performances de la plateforme.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [orders.length, services.length, expenses.length]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-sm mb-12">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-100 rounded w-1/4" />
            <div className="h-3 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!insights && !error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden mb-12"
    >
      <div className="p-8 border-b border-gray-50 bg-indigo-50/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Analyses Stratégiques IA</h3>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Performance Globale de la Plateforme</p>
          </div>
        </div>
        <div className="px-4 py-1.5 bg-white rounded-full border border-indigo-100 text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          Gemini 3.0 Flash
        </div>
      </div>

      <div className="p-8">
        {error ? (
          <div className="flex items-center gap-3 text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : insights && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Vue d'ensemble</h4>
                </div>
                <p className="text-gray-700 leading-relaxed font-medium">
                  {insights.overview}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-indigo-500" />
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Tendances & Marché</h4>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-sm text-gray-600 italic">
                    "{insights.trends}"
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Sentiment:</span>
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-full border border-indigo-50">
                      {insights.sentiment}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recommandations Prioritaires</h4>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {insights.recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 p-5 bg-white border border-black/5 rounded-3xl hover:border-indigo-200 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <span className="text-xs font-black">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                      {rec}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
