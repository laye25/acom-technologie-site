import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Command, 
  X, 
  ShoppingBag, 
  Users, 
  Settings, 
  Store,
  Package,
  Plus,
  ArrowRight,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    { id: 'orders', title: 'Voir les commandes', icon: ShoppingBag, category: 'Navigation', shortcut: 'G O', action: () => navigate('/admin?tab=orders') },
    { id: 'users', title: 'Gérer les utilisateurs', icon: Users, category: 'Navigation', shortcut: 'G U', action: () => navigate('/admin?tab=users') },
    { id: 'services', title: 'Services & Tarifs', icon: Package, category: 'Navigation', shortcut: 'G S', action: () => navigate('/admin?tab=services') },
    { id: 'merchants', title: 'Portail Marchands', icon: Store, category: 'Navigation', shortcut: 'G M', action: () => navigate('/merchant/saas') },
    { id: 'new-service', title: 'Ajouter un service', icon: Plus, category: 'Actions', action: () => navigate('/admin?tab=services&action=new') },
    { id: 'messages', title: 'Messages clients', icon: MessageSquare, category: 'Actions', action: () => navigate('/admin?tab=messages') },
    { id: 'settings', title: 'Paramètres système', icon: Settings, category: 'Système', action: () => navigate('/admin?tab=settings') },
  ];

  const filteredActions = query === '' 
    ? actions 
    : actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const executeAction = (action: typeof actions[0]) => {
    action.action();
    setIsOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        executeAction(filteredActions[selectedIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center px-6 py-5 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 mr-4" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher une action, une commande, un utilisateur..."
                className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium placeholder:text-gray-400"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
              />
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg border border-gray-200">
                <Command className="w-3 h-3 text-gray-500" />
                <span className="text-[10px] font-bold text-gray-500">K</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {filteredActions.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Aucun résultat pour "{query}"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    filteredActions.reduce((acc, action) => {
                      if (!acc[action.category]) acc[action.category] = [];
                      acc[action.category].push(action);
                      return acc;
                    }, {} as Record<string, typeof actions>)
                  ).map(([category, categoryActions]) => (
                    <div key={category}>
                      <h3 className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        {category}
                      </h3>
                      <div className="space-y-1">
                        {categoryActions.map((action) => {
                          const index = filteredActions.indexOf(action);
                          const isSelected = index === selectedIndex;
                          
                          return (
                            <div
                              key={action.id}
                              onClick={() => executeAction(action)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                                isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  isSelected ? 'bg-white/20' : 'bg-gray-100'
                                }`}>
                                  <action.icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                </div>
                                <span className="font-bold text-sm">{action.title}</span>
                              </div>
                              {action.shortcut && !isSelected && (
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                  {action.shortcut}
                                </span>
                              )}
                              {isSelected && <ArrowRight className="w-4 h-4 animate-pulse" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500 shadow-sm">↑↓</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Naviguer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500 shadow-sm">Enter</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sélectionner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-500 shadow-sm">Esc</div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fermer</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Studio ACOM v2.0</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
