import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, TrendingUp, ShieldAlert, Lightbulb, Flag } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeOrder, generateOrderDraft } from '../../lib/gemini';
import { Order, Service } from '../../types';
import { dbService } from '../../services/dbService';
import { toast } from 'react-hot-toast';

interface OrderAIAnalysisProps {
  order: Order;
  service: Service | null;
}

export const OrderAIAnalysis: React.FC<OrderAIAnalysisProps> = ({ order, service }) => {
  const [analysis, setAnalysis] = useState<any>(order.adminAnalysis || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order.adminAnalysis) {
      setAnalysis(order.adminAnalysis);
    }
  }, [order.adminAnalysis]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeOrder(order, service);
      console.log('DEBUG: Analysis result:', result);
      if (result) {
        // Also generate client draft if missing to fulfill user request
        let draft = order.aiDraft;
        if (!draft) {
          draft = await generateOrderDraft(order, service);
        }

        await dbService.orders.save({
          id: order.id,
          adminAnalysis: result,
          ...(draft ? { aiDraft: draft } : {})
        });

        setAnalysis(result);
        toast.success('Analyse générée et enregistrée définitivement !');
      } else {
        console.error('DEBUG: Analysis returned null/undefined');
        setError('Impossible de générer l\'analyse (résultat vide).');
      }
    } catch (err) {
      console.error('DEBUG: Analysis error details:', err);
      setError(`Une erreur est survenue lors de l'analyse : ${err instanceof Error ? err.message : 'inconnue'}`);
      toast.error("Erreur lors de l'enregistrement de l'analyse.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Analyse Intelligente</h3>
            <p className="text-xs text-gray-500 font-medium">Insights stratégiques générés par IA</p>
          </div>
        </div>
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyser la commande
          </button>
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium italic">L'IA analyse les détails du projet...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed italic">
                "{analysis.summary}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Risks */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="w-3 h-3 text-red-500" />
                  Risques Potentiels
                </h4>
                <ul className="space-y-2">
                  {analysis.risks?.map((risk: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1 h-1 bg-red-400 rounded-full mt-1.5 shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upsell */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Opportunités Upsell
                </h4>
                <ul className="space-y-2">
                  {analysis.upsell?.map((item: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Advice */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-3 h-3 text-amber-500" />
                  Conseils Techniques
                </h4>
                <ul className="space-y-2">
                  {analysis.advice?.map((adv: string, i: number) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                      <span className="w-1 h-1 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                      {adv}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Flag className="w-3 h-3 text-primary" />
                  Priorité Stratégique
                </h4>
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                      analysis.priority?.includes('Haute') ? 'bg-red-100 text-red-600' : 
                      analysis.priority?.includes('Moyenne') ? 'bg-amber-100 text-amber-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {analysis.priority?.split(' ')[0] || 'Moyenne'}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium leading-tight">
                    {analysis.priority}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center justify-center gap-2 border-t border-gray-50 pt-4"
            >
              <Sparkles className="w-3 h-3" />
              Actualiser l'analyse
            </button>
          </motion.div>
        )}

        {!analysis && !loading && !error && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Cliquez sur le bouton pour générer une analyse stratégique de cette commande.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
