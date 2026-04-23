import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { geminiService } from '../../services/geminiService';
import { Brain, Loader2 } from 'lucide-react';

export const BusinessInsights = () => {
    const orders = useLiveQuery(() => db.orders.toArray()) || [];
    const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const runAnalysis = async () => {
        setLoading(true);
        const result = await geminiService.analyzeBusinessPerformance(orders, expenses);
        setAnalysis(result);
        setLoading(false);
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-primary" />
                    Insights IA Acom
                </h3>
                <button
                    onClick={runAnalysis}
                    disabled={loading || orders.length === 0}
                    className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyser la performance'}
                </button>
            </div>
            {analysis && (
                <div className="p-4 bg-gray-50 rounded-2xl text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {analysis}
                </div>
            )}
            {orders.length === 0 && <p className="text-gray-400 text-sm">Données insuffisantes pour l'analyse.</p>}
        </div>
    );
};
