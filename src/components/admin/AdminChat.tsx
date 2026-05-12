import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { geminiService } from '../../services/geminiService';
import { MessageSquare, Loader2, Send } from 'lucide-react';

export const AdminChat = () => {
    const orders = useLiveQuery(() => db.orders.toArray(), []) || [];
    const expenses = useLiveQuery(() => db.expenses.toArray(), []) || [];
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = input.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInput('');
        setLoading(true);

        const response = await geminiService.chatBusinessPerformance(orders, expenses, userMessage, 'session-1');
        
        setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        setLoading(false);
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-primary" />
                Chat Business IA
            </h3>
            <div className="h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary/10 text-primary ml-auto w-max max-w-[80%]' : 'bg-gray-100 text-gray-800 w-max max-w-[80%]'}`}>
                        {msg.text}
                    </div>
                ))}
                {loading && (
                    <div className="p-3 bg-gray-100 rounded-2xl w-max">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Posez une question sur vos données..."
                    className="flex-1 p-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
                <button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
