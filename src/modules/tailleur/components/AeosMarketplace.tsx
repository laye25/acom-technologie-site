import React, { useState } from 'react';
import { Compass, ShoppingBag, Download, CheckCircle, Search, Star, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface MarketplaceItem {
  id: string;
  name: string;
  category: 'font' | 'motif' | 'machine' | 'ai';
  rating: number;
  downloads: string;
  price: string;
  isInstalled: boolean;
  developer: string;
  description: string;
}

export const AeosMarketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'fonts' | 'motifs' | 'machines' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [installingId, setInstallingId] = useState<string | null>(null);

  const [items, setItems] = useState<MarketplaceItem[]>([
    { id: 'm1', name: 'Arabic Calligraphy Classic', category: 'font', rating: 4.9, downloads: '1.2k', price: 'Gratuit', isInstalled: true, developer: 'ACOM Calligraphy Labs', description: 'Police de broderie de calligraphie arabe avec compensation d\'étirement fine.' },
    { id: 'm2', name: 'Herringbone Motif Fill v3', category: 'motif', rating: 4.8, downloads: '950', price: 'Gratuit', isInstalled: false, developer: 'Embroidery Pro', description: 'Motif de remplissage en chevrons texturés pour grands écussons et blasons.' },
    { id: 'm3', name: 'Tajima TMEZ-SC Profile', category: 'machine', rating: 5.0, downloads: '2.4k', price: 'Gratuit', isInstalled: true, developer: 'Tajima Corp', description: 'Profil de tension automatique intelligent de fil de canette pour machine TMEZ.' },
    { id: 'm4', name: 'Flowers & Petals DeepSeg v2', category: 'ai', rating: 4.9, downloads: '1.8k', price: 'Gratuit', isInstalled: false, developer: 'ACOM AI Research', description: 'Modèle de vision spécialisé dans la segmentation de pétales floraux et nervures.' },
    { id: 'm5', name: 'Athlétique Varsity Font', category: 'font', rating: 4.7, downloads: '3.1k', price: 'Gratuit', isInstalled: false, developer: 'Sartorial Fonts', description: 'Police classique double contour pour vestes d\'universités américaines.' },
    { id: 'm6', name: 'Damascus Weave Pattern', category: 'motif', rating: 4.9, downloads: '600', price: 'Gratuit', isInstalled: false, developer: 'Damas Threads', description: 'Motif de broderie complexe imitant la soie de Damas ancienne.' }
  ]);

  const handleInstall = (id: string) => {
    setInstallingId(id);
    setTimeout(() => {
      setItems(prev => prev.map(item => item.id === id ? { ...item, isInstalled: true } : item));
      setInstallingId(null);
    }, 1500);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'fonts' && item.category !== 'font') return false;
    if (activeTab === 'motifs' && item.category !== 'motif') return false;
    if (activeTab === 'machines' && item.category !== 'machine') return false;
    if (activeTab === 'ai' && item.category !== 'ai') return false;
    return matchesSearch;
  });

  return (
    <div id="aeos-marketplace-container" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-white">AEOS App Store (Plugins & Polices & Modèles)</h4>
            <p className="text-[10px] text-gray-400">Installez des ressources certifiées de l'écosystème d'Acom Technologie</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
          {(['all', 'fonts', 'motifs', 'machines', 'ai'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              id={`marketplace-tab-${tab}`}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${activeTab === tab ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {tab === 'all' ? 'Tout' : tab === 'fonts' ? 'Polices' : tab === 'motifs' ? 'Motifs' : tab === 'machines' ? 'Machines' : 'IA'}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher des polices de broderie, motifs de remplissage ou profils de machines..."
          className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder-slate-500"
        />
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <div 
            key={item.id}
            id={`marketplace-item-${item.id}`}
            className="p-4 bg-slate-950 rounded-xl border border-slate-850 flex flex-col justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${item.category === 'font' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : item.category === 'motif' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : item.category === 'machine' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20'}`}>
                  {item.category}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{item.rating}</span>
                </div>
              </div>

              <h5 className="text-xs font-bold text-white leading-tight">{item.name}</h5>
              <p className="text-[10px] text-gray-400 line-clamp-2">{item.description}</p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-900 pt-3">
              <div className="text-[9px]">
                <span className="text-gray-500 block">Par : {item.developer}</span>
                <span className="text-emerald-400 font-bold block">{item.price}</span>
              </div>

              {item.isInstalled ? (
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Installé
                </span>
              ) : (
                <button
                  onClick={() => handleInstall(item.id)}
                  disabled={installingId !== null}
                  id={`install-btn-${item.id}`}
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-800 text-[10px] font-bold text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-lg shadow-violet-500/10"
                >
                  {installingId === item.id ? (
                    <span className="animate-spin text-white">🔄</span>
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Installer</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-gray-500">
            Aucun élément trouvé pour "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
