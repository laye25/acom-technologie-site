import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Store, Building2, ChevronRight, MapPin, Search, Star, ArrowRight, Home, ShoppingBag, Utensils, Scissors, Car, Target,
  Briefcase, HeartPulse, GraduationCap, Truck, HardHat, SquareActivity, Shirt, Map as MapIcon, Grid,
  User, FileText, CheckCircle, XCircle, Eye, Calendar, Phone, ClipboardList, Info, ArrowLeft, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { Merchant, Order } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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

// Helper to render beautiful SaaS purchased content based on the sector/merchantType
function renderSaaSPurchasedContent(order: any, saasType?: string) {
  const type = saasType || order.details?.saasSector || 'boutique';
  const details = order.details || {};

  switch (type) {
    case 'pressing':
      return (
        <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
            <Shirt className="w-4 h-4" />
            <span>Service Pressing &amp; Nettoyage</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName || 'Lavage complet'}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.items && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Vêtements</span>
                <span className="font-bold text-gray-800">{details.items}</span>
              </div>
            )}
            {details.mode && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Lavage</span>
                <span className="font-bold text-gray-800">{details.mode}</span>
              </div>
            )}
          </div>
        </div>
      );
    case 'medical':
      return (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
            <SquareActivity className="w-4 h-4" />
            <span>Rendez-vous Clinique &amp; Santé</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName || 'Consultation'}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.patientName && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Patient</span>
                <span className="font-bold text-gray-800">{details.patientName}</span>
              </div>
            )}
            {details.motif && (
              <div className="col-span-2">
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Motif de Consultation</span>
                <span className="font-bold text-gray-800">{details.motif}</span>
              </div>
            )}
            {details.doctor && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Médecin</span>
                <span className="font-bold text-gray-800">{details.doctor}</span>
              </div>
            )}
          </div>
        </div>
      );
    case 'scolaire':
      return (
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
            <GraduationCap className="w-4 h-4" />
            <span>Dossier Inscription &amp; Écrans Scolaires</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName || 'Candidature Scolaire'}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.student && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Élève / Étudiant</span>
                <span className="font-bold text-gray-800">{details.student}</span>
              </div>
            )}
            {details.level && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Classe / Niveau</span>
                <span className="font-bold text-gray-800">{details.level}</span>
              </div>
            )}
            {details.birthDate && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Date de Naissance</span>
                <span className="font-bold text-gray-800">{details.birthDate}</span>
              </div>
            )}
            {details.parentNotes && (
              <div className="col-span-2">
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Note Parent</span>
                <span className="font-bold text-gray-800">{details.parentNotes}</span>
              </div>
            )}
          </div>
        </div>
      );
    case 'entreprise':
    case 'service':
      return (
        <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-pink-700 font-bold text-xs">
            <Briefcase className="w-4 h-4" />
            <span>Intervention Maintenance &amp; Services</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName || 'Dépannage professionnel'}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.type && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Type d'Assistance</span>
                <span className="font-bold text-gray-800">{details.type}</span>
              </div>
            )}
            {details.tech && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Technicien</span>
                <span className="font-bold text-gray-800">{details.tech}</span>
              </div>
            )}
            <div>
              <span className="block text-gray-400 text-[10px] uppercase font-bold">Urgence</span>
              <span className={`font-bold ${details.urgent ? 'text-red-650' : 'text-gray-800'}`}>
                {details.urgent ? '🚨 Très Urgent' : 'Normal'}
              </span>
            </div>
            {details.notes && (
              <div className="col-span-2">
                <span className="block text-gray-400 text-[10px] uppercase font-bold font-bold">Détails panne</span>
                <span className="font-bold text-gray-800">{details.notes}</span>
              </div>
            )}
          </div>
        </div>
      );
    case 'chantier':
      return (
        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
            <HardHat className="w-4 h-4" />
            <span>Approvisionnement Chantier (BTP)</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName || 'Matériaux Gros-Œuvre'}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.item && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Matériaux / Quantité</span>
                <span className="font-bold text-gray-800">{details.item}</span>
              </div>
            )}
            {details.deliverySite && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Lieu Destination</span>
                <span className="font-bold text-gray-800">{details.deliverySite}</span>
              </div>
            )}
            {details.supervisor && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Superviseur</span>
                <span className="font-bold text-gray-800">{details.supervisor}</span>
              </div>
            )}
          </div>
        </div>
      );
    case 'transport':
      return (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
            <Car className="w-4 h-4" />
            <span>Réservation Trajet &amp; Logistique</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName || 'Déplacement express'}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.from && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Zone Départ</span>
                <span className="font-bold text-gray-800">{details.from}</span>
              </div>
            )}
            {details.to && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Zone Arrivée</span>
                <span className="font-bold text-gray-800">{details.to}</span>
              </div>
            )}
            {details.carModel && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Véhicule</span>
                <span className="font-bold text-gray-800">{details.carModel}</span>
              </div>
            )}
            {details.flightNo && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Vol</span>
                <span className="font-bold text-gray-800">{details.flightNo}</span>
              </div>
            )}
            {details.hours && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Durée</span>
                <span className="font-bold text-gray-800">{details.hours}</span>
              </div>
            )}
          </div>
        </div>
      );
    case 'rh':
      return (
        <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-2 text-left">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <User className="w-4 h-4" />
            <span>Dossier de Recrutement / Statut RH</span>
          </div>
          <p className="text-gray-900 font-black text-sm">{order.serviceName}</p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
            {details.candidate && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Postulé</span>
                <span className="font-bold text-gray-800">{details.candidate}</span>
              </div>
            )}
            {details.diploma && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Diplôme</span>
                <span className="font-bold text-gray-800">{details.diploma}</span>
              </div>
            )}
            {details.experience && (
              <div>
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Expérience</span>
                <span className="font-bold text-gray-800">{details.experience}</span>
              </div>
            )}
            {details.ratingGrade && (
              <div className="col-span-2">
                <span className="block text-gray-400 text-[10px] uppercase font-bold">Évaluation RH</span>
                <span className="font-bold text-gray-800">{details.ratingGrade}</span>
              </div>
            )}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export default function AcomZone() {
  const { data: cloudMerchants, loading: cloudLoading } = useFirestoreData<Merchant>({
    tableName: 'merchants',
    realtime: true
  });
  
  const localMerchants = useLiveQuery(() => db.merchants.toArray()) || [];
  
  const merchants = cloudMerchants.length > 0 ? cloudMerchants : localMerchants;
  const loading = cloudLoading && merchants.length === 0;

  const { user, profile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'client'>('map');

  // Client workspace states
  const [clientSearchInput, setClientSearchInput] = useState('');
  const [submittedSearchToken, setSubmittedSearchToken] = useState('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Retrieve local orders reactively
  const localOrders = useLiveQuery(() => db.orders.toArray()) || [];

  // Logged in user orders auto-discovery
  const userOrders = useMemo(() => {
    if (!user) return [];
    return localOrders.filter(o => {
      const isAcomZoneOrder = o.pillar === 'saas' || !!o.details?.saasSector || !!o.details?.simulated;
      if (!isAcomZoneOrder) return false;

      const isUidMatch = o.userId === user.uid;
      const isEmailMatch = (o.clientEmail && user.email && o.clientEmail.toLowerCase() === user.email.toLowerCase()) || 
                           (o.details?.clientEmail && user.email && o.details.clientEmail.toLowerCase() === user.email.toLowerCase());
      const isPhoneMatch = (profile as any)?.phone && (o.clientPhone === (profile as any).phone || o.details?.clientPhone === (profile as any).phone);
      return isUidMatch || isEmailMatch || isPhoneMatch;
    }).sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
  }, [localOrders, user, profile]);

  // Manually searched orders
  const searchedOrders = useMemo(() => {
    const token = submittedSearchToken.trim().toLowerCase();
    if (!token) return [];
    return localOrders.filter(o => {
      const isAcomZoneOrder = o.pillar === 'saas' || !!o.details?.saasSector || !!o.details?.simulated;
      if (!isAcomZoneOrder) return false;

      const matchId = o.id?.toLowerCase().includes(token);
      const matchEmail = o.clientEmail?.toLowerCase().includes(token) || o.details?.clientEmail?.toLowerCase().includes(token);
      const matchPhone = o.clientPhone?.includes(token) || o.details?.clientPhone?.includes(token);
      const matchName = o.clientName?.toLowerCase().includes(token);
      return matchId || matchEmail || matchPhone || matchName;
    }).sort((a, b) => {
      const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tB - tA;
    });
  }, [localOrders, submittedSearchToken]);

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
            <button
              onClick={() => setViewMode('client')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'client' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Espace Client
            </button>
          </div>
        </div>
      </section>

      {/* Results Content */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto">
        {viewMode === 'client' ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Client Workspace Title Segment */}
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold shadow-sm">
                <ClipboardList className="w-4 h-4 text-violet-600" />
                <span>Espace Client Securisé • Sénégal</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                Suivi de vos commandes & réservations
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto leading-relaxed text-sm sm:text-base font-medium">
                Retrouvez instantanément l'état de toutes vos commandes passées auprès de nos boutiques et partenaires sur AcomZone.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {/* Logged in auto-discovery alert */}
              {user && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">Génération par session active</h4>
                      <p className="text-xs text-gray-400 font-medium leading-normal mt-0.5">
                        Connecté en tant que <strong className="text-emerald-700">{profile?.displayName || user.email}</strong>. Vos commandes AcomZone sont chargées automatiquement.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-black font-mono text-emerald-700 bg-emerald-100/60 px-3 py-1.5 rounded-full w-fit">
                    {userOrders.length} {userOrders.length > 1 ? 'commandes' : 'commande'}
                  </div>
                </div>
              )}

              {/* Search Box Card */}
              <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-48 h-48 bg-violet-100/40 rounded-full blur-2xl opacity-60 pointer-events-none" />
                <h3 className="font-black text-gray-900 text-lg mb-2 flex items-center gap-2 relative z-10">
                  <Search className="w-5 h-5 text-violet-600" />
                  Rechercher manuellement vos commandes
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-6 font-medium relative z-10">
                  Saisissez votre numéro de téléphone, votre e-mail de contact ou l'identifiant exact de votre devis/commande.
                </p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!clientSearchInput.trim()) {
                    toast.error("Veuillez saisir des coordonnées pour lancer la recherche");
                    return;
                  }
                  setSubmittedSearchToken(clientSearchInput);
                  toast.success("Suivi de commandes actualisé");
                }} className="flex flex-col sm:flex-row gap-3 relative z-10">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Ex: 771234567, client@email.sn, ou acom_..."
                      value={clientSearchInput}
                      onChange={(e) => setClientSearchInput(e.target.value)}
                      className="w-full bg-gray-50 p-4 pl-12 rounded-2xl border border-gray-200 text-sm outline-none font-bold text-gray-800 placeholder-gray-400 focus:border-violet-600 focus:bg-white transition-all focus:ring-4 focus:ring-violet-100"
                    />
                    <Phone className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    {clientSearchInput && (
                      <button
                        type="button"
                        onClick={() => { setClientSearchInput(''); setSubmittedSearchToken(''); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="p-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-violet-600 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Search className="w-5 h-5" />
                    <span>Rechercher</span>
                  </button>
                </form>
              </div>

              {/* Combined orders display section */}
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-lg text-gray-900 leading-tight">
                    {submittedSearchToken ? 'Résultats de recherche' : 'Vos commandes récentes'}
                  </h3>
                  {submittedSearchToken && (
                    <button
                      onClick={() => { setSubmittedSearchToken(''); setClientSearchInput(''); }}
                      className="text-xs font-bold text-violet-600 hover:text-violet-800"
                    >
                      Effacer la recherche
                    </button>
                  )}
                </div>
                
                {/* Compute the visible orders */}
                {(() => {
                  const visibleOrders = submittedSearchToken ? searchedOrders : userOrders;
                  
                  if (visibleOrders.length === 0) {
                    return (
                      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <ClipboardList className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm font-bold max-w-md mx-auto">
                          {submittedSearchToken 
                            ? `Aucune commande trouvée pour "${submittedSearchToken}". Assurez-vous d'avoir saisi les coordonnées exactes utilisées lors de l'achat.`
                            : "Aucune commande trouvée pour votre session active. Utilisez le champ ci-dessus avec votre numéro de téléphone."}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 gap-6">
                      {visibleOrders.map((order: Order) => {
                        // Find matching merchant details
                        const matchingMerchant = merchants.find(m => m.id === ((order as any).partnerId || (order as any).merchantId));
                        
                        // Helper status mapping
                        const getStatusDetails = (status: string) => {
                          switch(status) {
                            case 'pending': 
                              return { label: 'En attente', color: 'text-amber-700 bg-amber-50 border border-amber-100', icon: Clock };
                            case 'confirmed': 
                              return { label: 'Confirmée', color: 'text-blue-700 bg-blue-50 border border-blue-100', icon: CheckCircle };
                            case 'completed': 
                              return { label: 'Terminée', color: 'text-emerald-700 bg-emerald-50 border border-emerald-100', icon: CheckCircle };
                            case 'cancelled': 
                              return { label: 'Annulée', color: 'text-red-700 bg-red-50 border border-red-100', icon: XCircle };
                            default: 
                              return { label: 'En cours', color: 'text-indigo-700 bg-indigo-50 border border-indigo-100', icon: Clock };
                          }
                        };
                        
                        const statusInfo = getStatusDetails(order.status);
                        const StatusIcon = statusInfo.icon;
                        
                        const formattedDate = order.createdAt 
                          ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Date inconnue';

                        return (
                          <div key={order.id} className="bg-white rounded-3xl border border-gray-100 p-6 flex flex-col lg:flex-row justify-between gap-6 hover:shadow-md transition-all">
                            <div className="space-y-4 flex-1">
                              {/* Merchant Header */}
                              <div className="flex items-center gap-3">
                                {matchingMerchant?.logo ? (
                                  <img src={matchingMerchant.logo} alt={matchingMerchant.name} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-black">
                                    {matchingMerchant?.name?.charAt(0).toUpperCase() || 'M'}
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-black text-gray-900 text-sm sm:text-base">{matchingMerchant?.name || 'Commerçant Partenaire'}</h4>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{matchingMerchant?.type || 'Boutique'}</p>
                                </div>
                              </div>

                              {/* Order Meta details */}
                              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 bg-gray-50 p-3 sm:p-4 rounded-2xl border border-gray-150 text-xs text-gray-500 font-medium">
                                <div>
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">ID Commande</span>
                                  <span className="font-mono font-bold text-gray-900 truncate">#{order.id?.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-200 hidden sm:block self-center" />
                                <div>
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Date de Commande</span>
                                  <span className="text-gray-900 font-bold">{formattedDate}</span>
                                </div>
                                <div className="w-px h-6 bg-gray-200 hidden sm:block self-center" />
                                <div>
                                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Mode de Retrait</span>
                                  <span className="text-orange-600 font-bold">{order.details?.method || 'Livraison à domicile'}</span>
                                </div>
                              </div>

                              {/* Product item display */}
                              <div className="pt-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Détails de la prestation</span>
                                {(() => {
                                  const saasContent = renderSaaSPurchasedContent(order, matchingMerchant?.type || order.details?.saasSector || 'boutique');
                                  if (saasContent) return saasContent;

                                  if (Array.isArray(order.details?.items)) {
                                    return (
                                      <div className="space-y-1.5">
                                        {order.details.items.map((it: any, i: number) => (
                                          <div key={i} className="flex justify-between items-center text-xs bg-gray-50/50 p-2 rounded-xl border border-gray-100/60 font-medium max-w-sm">
                                            <span className="text-gray-800 font-bold max-w-[200px] truncate">{it.name}</span>
                                            <span className="font-mono text-gray-500 ml-2">x{it.quantity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }

                                  return (
                                    <p className="text-gray-900 text-sm font-bold flex items-center gap-2">
                                      <ShoppingBag className="w-4 h-4 text-violet-500" />
                                      {order.serviceName || order.details?.items || 'Articles divers'}
                                    </p>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* Status, Total & Tracking Actions */}
                            <div className="lg:w-64 shrink-0 flex flex-col justify-between items-start lg:items-end gap-3 lg:text-right border-t lg:border-t-0 border-gray-100 pt-4 lg:pt-0">
                              <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Statut de la demande</span>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-black shadow-sm ${statusInfo.color}`}>
                                  <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                  <span>{statusInfo.label}</span>
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5 animate-pulse">Montant Total</span>
                                <strong className="text-xl font-black text-violet-600 font-mono">
                                  {order.totalPrice?.toLocaleString()} FCFA
                                </strong>
                              </div>

                              <div className="flex flex-wrap gap-2 w-full lg:justify-end pt-2">
                                <button
                                  onClick={() => setSelectedOrderDetails(order)}
                                  className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-50 hover:bg-violet-600 hover:text-white text-violet-700 font-bold text-xs rounded-xl transition-all border border-violet-100"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>Détails</span>
                                </button>
                                
                                {matchingMerchant?.phone && (
                                  <a
                                    href={`https://wa.me/${matchingMerchant.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(matchingMerchant.name)}%2C%20je%20souhaite%20suivre%20ma%20commande%20%23${order.id?.slice(-8).toUpperCase()}`}
                                    target="_blank"
                                    referrerPolicy="no-referrer"
                                    className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs rounded-xl transition-all"
                                  >
                                    <Phone className="w-4 h-4" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        ) : loading ? (
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

      {/* Detail overlay modal */}
      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrderDetails(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative custom-scrollbar border border-gray-150"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-150 pb-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 text-[#7C3AED] rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                    Détails de Commande
                  </div>
                  <h3 className="font-black text-xl text-gray-900 leading-tight">
                    Commande #{selectedOrderDetails.id?.slice(-8).toUpperCase()}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedOrderDetails(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Merchant info block */}
                {(() => {
                  const matchedMerch = merchants.find(m => m.id === ((selectedOrderDetails as any).partnerId || (selectedOrderDetails as any).merchantId));
                  return (
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      {matchedMerch?.logo ? (
                        <img src={matchedMerch.logo} className="w-12 h-12 rounded-xl object-cover border border-gray-200" alt="" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-black text-lg">
                          {matchedMerch?.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-900 text-sm sm:text-base truncate">{matchedMerch?.name || 'Commerçant Partenaire'}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase truncate">{matchedMerch?.address || 'Sénégal'}</p>
                      </div>
                      {matchedMerch?.phone && (
                        <a href={`tel:${matchedMerch.phone}`} className="p-3 bg-white text-violet-700 rounded-xl hover:bg-violet-100 border border-violet-100 transition-colors shadow-sm shrink-0">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  );
                })()}

                {/* Client Info card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">Informations Client</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-gray-400 mb-0.5">Nom complet</span>
                      <span className="text-gray-950 font-bold">{selectedOrderDetails.clientName || 'Client anonyme'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 mb-0.5">Téléphone</span>
                      <span className="text-gray-950 font-bold font-mono">{selectedOrderDetails.details?.clientPhone || (selectedOrderDetails as any).clientPhone || 'Non renseigné'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-gray-400 mb-0.5">Adresse de livraison</span>
                      <span className="text-gray-950 font-bold">{selectedOrderDetails.details?.clientAddress || 'Point de vente / retrait sur place'}</span>
                    </div>
                  </div>
                </div>

                {/* Cart & Items summary */}
                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider text-gray-400">Détails de la prestation</h4>
                  {(() => {
                    const matchedMerch = merchants.find(m => m.id === ((selectedOrderDetails as any).partnerId || (selectedOrderDetails as any).merchantId));
                    const saasContent = renderSaaSPurchasedContent(selectedOrderDetails, matchedMerch?.type || selectedOrderDetails.details?.saasSector || 'boutique');
                    if (saasContent) return saasContent;

                    if (Array.isArray(selectedOrderDetails.details?.items)) {
                      return (
                        <div className="space-y-2">
                          {selectedOrderDetails.details.items.map((it: any, k: number) => (
                            <div key={k} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                              <div>
                                <p className="font-black text-gray-950 text-xs sm:text-sm">{it.name}</p>
                                {it.sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {it.sku}</p>}
                              </div>
                              <div className="text-right font-mono text-xs text-gray-700 ml-4 font-bold">
                                <span>{it.quantity} x {(it.unitPrice || it.price)?.toLocaleString()} FCFA</span>
                                <strong className="block text-gray-955">{(it.subtotal || ((it.unitPrice || it.price) * it.quantity)).toLocaleString()} FCFA</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-violet-500" />
                        {selectedOrderDetails.serviceName || selectedOrderDetails.details?.items || 'Articles divers'}
                      </div>
                    );
                  })()}
                </div>

                {/* Subtotal & Total Pricing Details */}
                <div className="bg-violet-50/50 p-5 rounded-2xl border border-violet-100/50 space-y-2">
                  <div className="flex justify-between text-xs text-gray-500 font-medium">
                    <span>Sous-total</span>
                    <span className="font-mono">{(selectedOrderDetails.totalPrice || 0).toLocaleString()} FCFA</span>
                  </div>
                  <div className="h-px bg-violet-100 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-black text-gray-900 text-sm">Montant Total</span>
                    <span className="text-lg font-black text-[#7C3AED] font-mono">{(selectedOrderDetails.totalPrice || 0).toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Custom/Sector fields display */}
                {(() => {
                  const skipKeys = ['clientPhone', 'clientAddress', 'saasSector', 'simulated', 'items', 'quantity', 'unitPrice', 'method', 'clientEmail'];
                  const customFields = Object.entries(selectedOrderDetails.details || {})
                    .filter(([key]) => !skipKeys.includes(key));
                    
                  if (customFields.length === 0) return null;
                  
                  return (
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                      <h5 className="font-bold text-gray-600 text-[11px] uppercase tracking-wider mb-2">Options personnalisées</h5>
                      <div className="grid grid-cols-1 gap-3.5 text-xs font-medium">
                        {customFields.map(([k, val]) => {
                          const isImage = typeof val === 'string' && (val.startsWith('data:image') || val.match(/\.(jpeg|jpg|png|gif)$/i));
                          const isPdf = typeof val === 'string' && (val.startsWith('data:application/pdf') || val.toLowerCase().endsWith('.pdf'));
                          const isPendingUpload = typeof val === 'string' && val === 'pending_upload';
                          const isObject = typeof val === 'object' && val !== null && !Array.isArray(val);

                          return (
                            <div key={k} className="border-b border-gray-150/40 pb-2.5 last:border-0 last:pb-0">
                              <span className="block text-gray-400 capitalize text-[10px] mb-1">
                                {k.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                              
                              {isImage ? (
                                <div className="mt-1 bg-white p-1 rounded-lg border border-gray-150 inline-block">
                                  <img 
                                    src={val as string} 
                                    alt={k} 
                                    className="max-h-24 max-w-full rounded object-contain cursor-zoom-in"
                                    onClick={() => window.open(val as string, '_blank')}
                                  />
                                </div>
                              ) : isPdf ? (
                                <a 
                                  href={val as string} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center gap-1.5 text-violet-700 font-bold hover:underline bg-white px-2.5 py-1.5 rounded-xl border border-gray-150 text-[11px] transition-all"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Voir le document</span>
                                </a>
                              ) : isPendingUpload ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg font-bold text-[10px]">
                                  <Clock className="w-3 h-3 animate-spin text-amber-500" />
                                  En attente de téléversement
                                </span>
                              ) : isObject ? (
                                <div className="space-y-1.5 mt-1 bg-white p-2.5 rounded-xl border border-gray-150">
                                  {Object.entries(val).map(([subK, subVal]) => (
                                    <div key={subK} className="flex justify-between items-center text-[10px] py-1 border-b border-gray-50 last:border-0 last:py-0">
                                      <span className="text-gray-400 capitalize">{subK.replace(/([A-Z])/g, ' $1').trim()} :</span>
                                      <span className="text-gray-900 font-bold">{typeof subVal === 'boolean' ? (subVal ? 'Oui' : 'Non') : String(subVal)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : Array.isArray(val) ? (
                                <div className="space-y-1.5 mt-1">
                                  {val.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded-xl border border-gray-150 text-[10px] text-gray-900 font-bold">
                                      {typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-900 font-bold block break-all whitespace-pre-wrap leading-relaxed">
                                  {typeof val === 'boolean' ? (val ? 'Oui' : 'Non') : String(val)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs transition-colors"
                >
                  Fermer
                </button>
                <Link
                  to={`/acomzone/${(selectedOrderDetails as any).partnerId || (selectedOrderDetails as any).merchantId || ''}`}
                  className="flex-1 py-3 bg-gray-900 hover:bg-violet-700 text-white font-bold rounded-2xl text-xs text-center transition-colors"
                >
                  Visiter la boutique
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
