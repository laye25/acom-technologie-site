import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, TrendingUp, Lightbulb, BarChart3, PieChart } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzePlatformPerformance } from '../../lib/gemini';
import { Order, Service, Expense } from '../../types';

interface PlatformAIInsightsProps {
  orders: Order[];
  services: Service[];
  expenses: Expense[];
}

export const PlatformAIInsights: React.FC<PlatformAIInsightsProps> = ({ orders, services, expenses }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzePlatformPerformance(orders, services, expenses);
      if (result) {
        setInsights(result);
      } else {
        setError('Impossible de générer les insights.');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la génération des insights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Analyse Stratégique IA</h3>
            <p className="text-xs text-gray-500 font-medium">Performance globale et recommandations</p>
          </div>
        </div>
        {!insights && !loading && (
          <button
            onClick={handleGenerateInsights}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Générer Insights
          </button>
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium italic">L'IA analyse les données de la plateforme...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {insights && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Overview */}
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Santé Financière
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {insights.overview}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Trends */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Tendances & Marché
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                      {insights.trends}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 w-fit">
                    <PieChart className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                      Sentiment: {insights.sentiment}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Actions Recommandées
                </h4>
                <div className="space-y-3">
                  {insights.recommendations?.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-2xl border border-amber-100">
                      <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-xs font-black text-amber-600">{i + 1}</span>
                      </div>
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateInsights}
              className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2 border-t border-gray-50 pt-4"
            >
              <Sparkles className="w-3 h-3" />
              Actualiser les insights
            </button>
          </motion.div>
        )}

        {!insights && !loading && !error && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Générez une analyse stratégique basée sur vos commandes, services et dépenses récents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
