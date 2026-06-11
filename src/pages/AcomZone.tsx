import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Store, Building2, ChevronRight, MapPin, Search, Star, ArrowRight, Home, ShoppingBag, Utensils, Scissors, Car, Target,
  Briefcase, HeartPulse, GraduationCap, Truck, HardHat, SquareActivity, Shirt, Map as MapIcon, Grid
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { Merchant } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Default center: Dakar, Senegal
const DEFAULT_CENTER = { lat: 14.6928, lng: -17.4467 };

const categories = [
  { id: 'all', name: 'Tout', icon: MapPin, keywords: [] },
  { id: 'boutique', name: 'Commerces & Stock', icon: ShoppingBag, keywords: ['boutique', 'commerce', 'magasin', 'stock'] },
  { id: 'medical', name: 'Santé & Médical', icon: SquareActivity, keywords: ['medical', 'santé', 'clinique', 'pharmacie'] },
  { id: 'transport', name: 'Transport & Logistique', icon: Truck, keywords: ['transport', 'logistique', 'flotte'] },
  { id: 'scolaire', name: 'Écoles & Formations', icon: GraduationCap, keywords: ['scolaire', 'école', 'formation', 'université'] },
  { id: 'chantier', name: 'BTP & Construction', icon: HardHat, keywords: ['chantier', 'btp', 'construction'] },
  { id: 'service', name: 'Services & RH', icon: Briefcase, keywords: ['service', 'rh', 'entreprise', 'agence'] },
  { id: 'restaurant', name: 'Restauration', icon: Utensils, keywords: ['restaurant', 'restauration', 'café'] },
  { id: 'pressing', name: 'Pressing & Linge', icon: Shirt, keywords: ['pressing', 'blanchisserie', 'linge', 'nettoyage'] },
];

function MerchantMarker({ merchant }: { merchant: Merchant }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);
  
  // Use merchant lat/lng or apply a slight predictable offset based on ID to scatter them around default center if missing
  const pos = merchant.lat && merchant.lng 
    ? { lat: merchant.lat, lng: merchant.lng }
    : { 
        lat: DEFAULT_CENTER.lat + ((merchant.name.length % 10) * 0.005) - 0.02, 
        lng: DEFAULT_CENTER.lng + ((merchant.id.length % 10) * 0.005) - 0.02 
      };

  return (
    <>
      <AdvancedMarker ref={markerRef} position={pos} onClick={() => setOpen(!open)}>
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-2 bg-primary/30 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative w-10 h-10 bg-white rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.15)] border-2 border-primary flex items-center justify-center overflow-hidden transform transition-transform duration-300 group-hover:scale-110 z-10">
            {merchant.logo ? (
              <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-black text-lg">{merchant.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-primary rotate-45 z-0"></div>
        </div>
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 max-w-[220px] font-sans">
            <div className="flex items-center gap-2 mb-2">
              {merchant.logo ? (
                <img src={merchant.logo} className="w-8 h-8 rounded-full border border-gray-100 object-cover" alt="" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">{merchant.name.charAt(0)}</div>
              )}
              <h4 className="font-bold text-gray-900 leading-tight">{merchant.name}</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3 truncate flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {merchant.address || 'Adresse non spécifiée'}
            </p>
            <Link 
              to={`/acomzone/${merchant.id}`}
              className="block w-full text-center py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-primary transition-colors duration-300"
            >
              Voir la fiche
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function AcomZone() {
  const { data: cloudMerchants, loading: cloudLoading } = useFirestoreData<Merchant>({
    tableName: 'merchants',
    realtime: true
  });
  
  const localMerchants = useLiveQuery(() => db.merchants.toArray()) || [];
  
  const merchants = cloudMerchants.length > 0 ? cloudMerchants : localMerchants;
  const loading = cloudLoading && merchants.length === 0;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('map');

  // Extract unique zones from existing merchants' addresses
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    merchants.forEach(m => {
      if (m.address) {
        const parts = m.address.split(',');
        const zoneStr = parts[parts.length - 1].trim();
        if (zoneStr) zones.add(zoneStr);
      }
    });
    return Array.from(zones).sort();
  }, [merchants]);

  // Filter merchants based on search, zone, and category
  const filteredMerchants = useMemo(() => {
    return merchants.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchZone = selectedZone ? (m.address?.toLowerCase().includes(selectedZone.toLowerCase())) : true;
      
      let matchCategory = selectedCategory === 'all';
      if (!matchCategory && m.type) {
        const cat = categories.find(c => c.id === selectedCategory);
        if (cat) {
          matchCategory = cat.keywords.some(kw => m.type!.toLowerCase().includes(kw));
        }
      }
      
      const isActive = m.status !== 'suspended';

      return matchSearch && matchZone && matchCategory && isActive;
    });
  }, [merchants, searchQuery, selectedZone, selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 max-w-7xl mx-auto mb-10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl opacity-60 pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-6 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight"
          >
            Explorez <span className="text-primary">AcomZone</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 leading-relaxed"
          >
            La carte interactive de nos partenaires. Découvrez les meilleures boutiques, commerces et services près de chez vous.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white p-2 rounded-full shadow-lg border border-gray-100 flex flex-col md:flex-row gap-2 max-w-2xl mx-auto"
          >
            <div className="flex-1 relative flex items-center px-4">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="Rechercher un partenaire..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full py-3 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <div className="w-px h-8 bg-gray-200 hidden md:block self-center mx-2" />
            <div className="flex-1 relative flex items-center px-4">
              <MapPin className="w-5 h-5 text-gray-400 mr-3" />
              <select 
                value={selectedZone}
                onChange={e => setSelectedZone(e.target.value)}
                className="w-full py-3 bg-transparent text-sm outline-none text-gray-800 cursor-pointer appearance-none"
              >
                <option value="">Toutes les zones</option>
                {availableZones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Control Bar: Categories & View Toggle */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          
          {/* Categories Scrollable */}
          <div className="flex-1 w-full overflow-x-auto py-2 px-1 custom-scrollbar">
            <div className="flex gap-2 min-w-max px-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                      isSelected 
                        ? 'bg-gray-900 text-white shadow-md' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'map' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Carte
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              Liste
            </button>
          </div>
        </div>
      </section>

      {/* Results Content */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun partenaire trouvé</h3>
            <p className="text-gray-500 text-lg">
              Nous n'avons trouvé aucune enseigne correspondant à votre recherche. Essayez de modifier vos filtres.
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedZone(''); setSelectedCategory('all'); }}
              className="mt-8 px-6 py-3 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-primary transition-colors inline-flex items-center gap-2"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-sm font-bold text-gray-500">
              <span>{filteredMerchants.length} {filteredMerchants.length > 1 ? 'partenaires trouvés' : 'partenaire trouvé'}</span>
            </div>

            {viewMode === 'map' ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[600px] relative">
                {!hasValidKey ? (
                  <div className="absolute inset-0 bg-[#e5e3df] overflow-hidden" style={{ backgroundImage: 'radial-gradient(#d1cfcb 2px, transparent 2px)', backgroundSize: '30px 30px' }}>
                    <div className="absolute inset-x-0 top-0 bg-yellow-100/90 backdrop-blur-sm border-b border-yellow-200 text-yellow-800 text-sm font-bold p-3 text-center z-20 flex items-center justify-center gap-2">
                       Mode Aperçu (Clé API Google Maps manquante)
                       <MapIcon className="w-4 h-4 opacity-70" />
                    </div>
                    {filteredMerchants.map((merchant, i) => {
                      // Pseudo-random position for the mock map based on merchant name length and index
                      const top = 10 + (((merchant.name.length * 17) + (i * 23)) % 75);
                      const left = 10 + (((merchant.name.length * 29) + (i * 11)) % 80);
                      return (
                        <div key={merchant.id} className="absolute flex flex-col items-center group cursor-pointer" style={{ top: `${top}%`, left: `${left}%` }}>
                          <div className="absolute -inset-3 bg-primary/20 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                          <div className="w-12 h-12 bg-white rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.2)] border-2 border-primary flex items-center justify-center overflow-hidden transform transition-transform duration-300 group-hover:scale-110 z-10 relative">
                            {merchant.logo ? (
                              <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-primary font-black text-xl">{merchant.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="absolute top-full -mt-2 w-3 h-3 bg-primary rotate-45 z-[5]"></div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute top-14 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-1 bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 z-30 pointer-events-none min-w-[150px] text-center">
                            <h4 className="font-bold text-gray-900 text-sm whitespace-nowrap mb-1">{merchant.name}</h4>
                            <p className="text-xs text-gray-500 truncate flex items-center justify-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {merchant.address || 'Adresse inconnue'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <APIProvider apiKey={API_KEY} version="weekly">
                    <Map
                      defaultCenter={DEFAULT_CENTER}
                      defaultZoom={13}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                    >
                      {filteredMerchants.map((merchant) => (
                        <MerchantMarker key={merchant.id} merchant={merchant} />
                      ))}
                    </Map>
                  </APIProvider>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMerchants.map((merchant, idx) => (
                  <motion.div
                    key={merchant.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col"
                  >
                    <div className="h-40 bg-gray-50 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                      {merchant.logo ? (
                        <img src={merchant.logo} alt={merchant.name} className="w-24 h-24 object-contain p-3 bg-white rounded-2xl shadow-md z-10 group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-2xl flex items-center justify-center text-4xl font-black z-10 shadow-md group-hover:scale-110 transition-transform duration-500 border border-white">
                          {merchant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {merchant.type && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-[10px] font-black uppercase tracking-wider text-gray-800 px-3 py-1.5 rounded-full border border-gray-200 z-10 shadow-sm">
                          {merchant.type}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">{merchant.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <MapPin className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate">{merchant.address || 'Aucune adresse'}</span>
                      </div>
                      
                      {merchant.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-1">
                          {merchant.description}
                        </p>
                      )}
                      
                      <div className="pt-4 mt-auto border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                          <Star className="w-4 h-4 fill-current" />
                          <span>4.9</span>
                        </div>
                        <Link 
                          to={`/acomzone/${merchant.id}`}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white group-hover:bg-primary transition-all transform group-hover:-translate-y-1 group-hover:shadow-lg"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
