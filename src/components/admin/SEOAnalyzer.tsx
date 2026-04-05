import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, Search, Globe, FileText, CheckCircle2, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeSEO } from '../../lib/gemini';

interface SEOAnalyzerProps {
  type: 'service' | 'blog';
  content: any;
}

export const SEOAnalyzer: React.FC<SEOAnalyzerProps> = ({ type, content }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeSEO(type, content);
      if (result) {
        setAnalysis(result);
      } else {
        setError('Impossible de générer l\'analyse SEO.');
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'analyse SEO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Search className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Optimisation SEO IA</h3>
            <p className="text-xs text-gray-500 font-medium">Analyse et suggestions de mots-clés</p>
          </div>
        </div>
        {!analysis && !loading && (
          <button
            onClick={handleAnalyze}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Analyser SEO
          </button>
        )}
      </div>

      <div className="p-6">
        {loading && (
          <div className="py-12 text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500 font-medium italic">L'IA analyse votre contenu pour le SEO...</p>
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
            {/* Meta Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Globe className="w-3 h-3 text-blue-500" />
                  Balise Titre (Title Tag)
                </h4>
                <p className="text-sm font-bold text-gray-900 leading-tight">
                  {analysis.titleTag}
                </p>
                <div className="mt-2 text-[9px] text-gray-400 font-medium">
                  {analysis.titleTag.length} / 60 caractères
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <FileText className="w-3 h-3 text-purple-500" />
                  Méta Description
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {analysis.metaDescription}
                </p>
                <div className="mt-2 text-[9px] text-gray-400 font-medium">
                  {analysis.metaDescription.length} / 160 caractères
                </div>
              </div>
            </div>

            {/* Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mots-clés Principaux</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.primaryKeywords?.map((kw: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Mots-clés Secondaires</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.secondaryKeywords?.map((kw: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-full border border-gray-100">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Local Optimization */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Globe className="w-3 h-3" />
                Optimisation Locale (Sénégal)
              </h4>
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                {analysis.localOptimization}
              </p>
            </div>

            {/* Content Suggestions */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Suggestions de Contenu
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {analysis.contentSuggestions?.map((sug: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                      {sug}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              className="w-full py-2 text-[10px] font-bold text-gray-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 border-t border-gray-50 pt-4"
            >
              <Sparkles className="w-3 h-3" />
              Relancer l'analyse SEO
            </button>
          </motion.div>
        )}

        {!analysis && !loading && !error && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-400 font-medium">
              Analysez votre contenu pour obtenir des recommandations SEO stratégiques.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
