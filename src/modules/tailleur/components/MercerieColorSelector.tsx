import React, { useState, useMemo } from 'react';
import { Search, Palette, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { 
  FABRIC_COLOR_PALETTE, 
  FABRIC_COLOR_FAMILIES, 
  findColorInfo, 
  FabricColor 
} from '../data/fabricColors';

interface MercerieColorSelectorProps {
  currentColor?: string;
  currentColorHex?: string;
  secondaryColor?: string;
  onChangeColor: (colorName: string, colorHex: string) => void;
  onChangeSecondaryColor?: (secondaryColor: string) => void;
  onChangeHex?: (colorHex: string) => void;
  onChangeCustomName?: (colorName: string) => void;
}

export const MercerieColorSelector: React.FC<MercerieColorSelectorProps> = ({
  currentColor = '',
  currentColorHex = '#4169E1',
  secondaryColor = '',
  onChangeColor,
  onChangeSecondaryColor,
  onChangeHex,
  onChangeCustomName,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const categoryNavRef = React.useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryNavRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      categoryNavRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const filteredSwatches = useMemo(() => {
    return FABRIC_COLOR_PALETTE.filter(c => {
      const matchesFamily = selectedFamily === 'all' || c.family === selectedFamily;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        c.name.toLowerCase().includes(q) || 
        c.family.toLowerCase().includes(q) || 
        c.hex.toLowerCase().includes(q);
      return matchesFamily && matchesQuery;
    });
  }, [selectedFamily, searchQuery]);

  const activeColorInfo = useMemo(() => {
    return findColorInfo(currentColor);
  }, [currentColor]);

  const activeFamilyName = useMemo(() => {
    const famObj = FABRIC_COLOR_FAMILIES.find(f => f.id === activeColorInfo.family);
    return famObj ? famObj.name : 'Couture';
  }, [activeColorInfo]);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
      {/* Header & Active Color Preview Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
        <div>
          <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
            Couleur Principale *
          </label>
          <span className="text-[10px] text-violet-600 font-bold">Bibliothèque de Couleurs Couture</span>
        </div>

        {/* Selected Color Preview Badge */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span 
            className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
            style={{ backgroundColor: currentColorHex || activeColorInfo.hex || '#4169E1' }}
          />
          <div className="min-w-0">
            <span className="block text-xs font-black text-slate-800 truncate">
              {currentColor || 'Non spécifiée'}
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="font-mono font-bold text-violet-700">
                {currentColorHex || activeColorInfo.hex}
              </span>
              {currentColor && (
                <span className="text-slate-400">• {activeFamilyName}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une couleur (ex: Marine, Doré, Bazin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Scrollable Family Pills */}
        <div className="relative flex items-center group">
          <button
            type="button"
            onClick={() => scrollCategories('left')}
            className="p-1 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 cursor-pointer mr-1 z-10"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <div 
            ref={categoryNavRef}
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
          >
            {FABRIC_COLOR_FAMILIES.map(fam => (
              <button
                key={fam.id}
                type="button"
                onClick={() => setSelectedFamily(fam.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFamily === fam.id
                    ? 'bg-violet-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {fam.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollCategories('right')}
            className="p-1 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs shrink-0 cursor-pointer ml-1 z-10"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Swatches Grid */}
      <div className="max-h-36 overflow-y-auto pr-1 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60">
        {filteredSwatches.map(swatch => {
          const isSelected = currentColor.toLowerCase() === swatch.name.toLowerCase();
          return (
            <button
              key={swatch.id}
              type="button"
              onClick={() => onChangeColor(swatch.name, swatch.hex)}
              title={`${swatch.name} (${swatch.hex})`}
              className={`flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer group ${
                isSelected 
                  ? 'bg-violet-50 border-violet-500 ring-2 ring-violet-400/40' 
                  : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span 
                className="w-5 h-5 rounded-full border border-black/15 shadow-2xs transition-transform group-hover:scale-110"
                style={{ backgroundColor: swatch.hex }}
              />
              <span className="text-[9px] font-bold text-slate-700 truncate w-full text-center mt-1">
                {swatch.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inputs for Custom Color Name, Hex & Secondary Color */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-200/60 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Nom Personnalisé</label>
          <input
            type="text"
            placeholder="ex: Bleu Roi Irisé"
            value={currentColor}
            onChange={(e) => {
              const val = e.target.value;
              if (onChangeCustomName) onChangeCustomName(val);
              else onChangeColor(val, currentColorHex);
            }}
            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Code Hex / Pipette</label>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={currentColorHex || '#4169E1'}
              onChange={(e) => {
                if (onChangeHex) onChangeHex(e.target.value);
                else onChangeColor(currentColor || 'Personnalisé', e.target.value);
              }}
              className="w-7 h-7 p-0 bg-transparent border-0 rounded cursor-pointer"
            />
            <input
              type="text"
              value={currentColorHex}
              onChange={(e) => {
                if (onChangeHex) onChangeHex(e.target.value);
                else onChangeColor(currentColor || 'Personnalisé', e.target.value);
              }}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase">Couleur Secondaire (Optionnel)</label>
          <input
            type="text"
            placeholder="ex: Reflets Dorés"
            value={secondaryColor}
            onChange={(e) => {
              if (onChangeSecondaryColor) onChangeSecondaryColor(e.target.value);
            }}
            className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>
    </div>
  );
};
