import React, { useState, useMemo, useEffect } from 'react';
import { SERVICES as STATIC_SERVICES } from '../constants';
import ServiceCard from '../components/ServiceCard';
import HeroBanner from '../components/HeroBanner';
import { Service, ServiceCategory, SiteSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, CheckCircle2, Star, Users, Briefcase, Award, Filter, Clock, Sparkles, Rocket, Palette, Layout, Smartphone, Globe, Megaphone, PenTool, Code, Package, FileText, BarChart3, Construction, Hospital, Truck, GraduationCap, Settings } from 'lucide-react';
import { useSupabaseData, TableName } from '../hooks/useSupabase';
import { Link } from 'react-router-dom';
import { Translate, useTranslation } from '../context/LanguageContext';
import { dbService as db } from '../services/dbService';
import { OptimizedImage } from '../components/OptimizedImage';

const iconMap: { [key: string]: any } = {
  Briefcase, Users, Award, Star, CheckCircle2, Clock, Sparkles, Rocket, Palette, Layout, Smartphone, Globe, Megaphone, PenTool, Code
};

const Home = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await db.settings.get('global');
        if (data) setSettings(data as SiteSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const serviceMapper = useMemo(() => (s: any) => ({
    id: s.id,
    name: s.name,
    shortDescription: s.shortDescription,
    description: s.description,
    price: s.price,
    category: s.category,
    image: s.image || s.image_url || `https://picsum.photos/seed/${s.id}/800/600`,
    features: s.features || [],
    promotion: s.promotion
  }), []);

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName,
    order: { column: 'name' as const },
    mapper: serviceMapper,
    limit: 20
  }), [serviceMapper]);

  const { data: dbServices, loading } = useSupabaseData<Service>(serviceOptions);

  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Point 8: Debounce search to avoid unnecessary re-renders/logic (Global Strategy)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const services = useMemo(() => {
    if (!loading && dbServices.length === 0) {
      return STATIC_SERVICES;
    }
    return dbServices.length > 0 ? dbServices : STATIC_SERVICES;
  }, [dbServices, loading]);

  const filteredServices = services.filter(service => {
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = useMemo(() => {
    const cats = services.map(s => s.category);
    const uniqueCats = Array.from(new Set(cats));
    return [
      { id: 'all', label: 'Tous' },
      ...uniqueCats.map(cat => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
    ];
  }, [services]);

  const stats = settings?.statsSection || [
    { label: t('Projets Terminés'), value: '500+', iconName: 'Briefcase' },
    { label: t('Clients Satisfaits'), value: '200+', iconName: 'Users' },
    { label: t('Années d\'Expérience'), value: '10+', iconName: 'Award' },
    { label: t('Avis Positifs'), value: '4.9/5', iconName: 'Star' },
  ];

  const whyUs = settings?.whyUsSection || {
    title: t("L'Excellence Technique au Service de votre Vision"),
    image: "https://picsum.photos/seed/team/1200/800",
    points: [
      { title: t('Qualité Premium'), description: t('Nous utilisons les meilleures technologies et matériaux pour des résultats irréprochables.'), iconName: 'CheckCircle2' },
      { title: t('Accompagnement Dédié'), description: t('Une équipe d\'experts à votre écoute pour transformer vos idées en réalité.'), iconName: 'CheckCircle2' },
      { title: t('Délais Respectés'), description: t('Nous comprenons l\'importance du temps dans vos projets de communication.'), iconName: 'CheckCircle2' },
    ]
  };

  const cta = settings?.ctaSection || {
    title: t('Prêt à Propulser'),
    subtitle: t('Votre Projet ?'),
    description: t('Contactez-nous dès aujourd\'hui pour discuter de vos besoins et obtenir un devis personnalisé gratuit.'),
    primaryButtonText: t('Démarrer un Projet'),
    primaryButtonLink: '/quote-request',
    secondaryButtonText: t('Voir nos Travaux'),
    secondaryButtonLink: '/portfolio'
  };

  const expertise = settings?.expertiseSection || {
    badge: t('Acom Studio'),
    title: t('Solutions'),
    subtitle1: t('Créatives'),
    subtitle2: t('pour Marques Ambitieuses'),
    description: t('Nous transformons vos idées en réalités numériques et physiques avec une précision artisanale et une vision stratégique.'),
    searchPlaceholder: t('Rechercher un service ou un produit...'),
    noResultsText: t('Aucun service ne correspond à votre recherche.'),
    resetFiltersText: t('Réinitialiser les filtres')
  };

  return (
    <div className="bg-paper min-h-screen">
      <HeroBanner />

      {/* Stats Section - Clean Utility (Recipe 8) */}
      <section className="py-12 bg-ink text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12">
            {stats.map((stat, i) => {
              const Icon = iconMap[stat.iconName] || Briefcase;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center p-3 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5"
                >
                  <div className="inline-flex items-center justify-center w-6 h-6 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-primary/10 mb-2 md:mb-6">
                    <Icon className="w-3 h-3 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-1 md:mb-2 tracking-tighter text-white">{stat.value}</div>
                  <div className="text-[7px] md:text-[10px] font-mono text-white/40 uppercase tracking-widest leading-tight">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section - Editorial (Recipe 11) */}
      <section id="services" className="py-20 lg:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 order-2 lg:order-1"
            >
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-primary/10 rounded-full">
                <Palette className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{expertise.badge}</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-display font-bold text-ink leading-[1.1] tracking-tighter">
                <Translate>{expertise.title}</Translate> <Translate>{expertise.subtitle1}</Translate> <br />
                <span className="text-primary italic"><Translate>{expertise.subtitle2}</Translate></span>
              </h2>
              
              <p className="text-gray-500 text-lg font-light leading-relaxed max-w-md">
                <Translate>{expertise.description}</Translate>
              </p>

              <div className="pt-4">
                <Link
                  to="/design-editor?select=true"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-ink text-white rounded-2xl font-bold hover:bg-primary transition-all group"
                >
                  <span>Créer et commander</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-1 lg:order-2 mb-8 lg:mb-0"
            >
              {/* Stylized Creative Studio Mockup */}
              <div className="relative bg-gray-50 rounded-[2.5rem] shadow-2xl border border-gray-100 p-4 md:p-8 aspect-[4/3] overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-primary/40" />
                    <div className="w-3 h-3 rounded-full bg-primary/20" />
                    <div className="w-3 h-3 rounded-full bg-primary/10" />
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Acom Studio v2.0</div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Palette className="w-5 h-5 text-primary" />
                      </div>
                      <div className="h-2 w-20 bg-gray-100 rounded-full mb-2" />
                      <div className="h-2 w-12 bg-gray-50 rounded-full" />
                    </div>
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                        <Layout className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="h-2 w-16 bg-gray-100 rounded-full mb-2" />
                      <div className="h-2 w-24 bg-gray-50 rounded-full" />
                    </div>
                  </div>
                  <div className="pt-12 space-y-6">
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 transform rotate-2 group-hover:rotate-0 transition-transform duration-500">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                        <Code className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div className="h-2 w-24 bg-gray-100 rounded-full mb-2" />
                      <div className="h-2 w-16 bg-gray-50 rounded-full" />
                    </div>
                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 transform -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                        <Package className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="h-2 w-12 bg-gray-100 rounded-full mb-2" />
                      <div className="h-2 w-20 bg-gray-50 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/5 rounded-full blur-3xl" 
                />
              </div>

              {/* Decorative background elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>

          {/* Exploration Section - Categories & Search */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 pt-12 border-t border-gray-100"
          >
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                  {categories.filter(c => c.id !== 'all').map((cat, i) => (
                    <div key={i} className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveCategory(cat.id as any)}>
                      <div className={`w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-150 ${activeCategory === cat.id ? 'bg-primary scale-150' : 'bg-gray-300'}`} />
                      <span className={`text-sm font-medium ${activeCategory === cat.id ? 'text-primary' : 'text-gray-600'}`}>{t(cat.label)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={expertise.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  {activeCategory !== 'all' && (
                    <button 
                      onClick={() => setActiveCategory('all')}
                      className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-all"
                    >
                      {t('Tous les services')}
                    </button>
                  )}
                </div>
              </div>
              <div className="hidden lg:block">
                {/* Empty space to maintain alignment with the left column width */}
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-[500px] bg-gray-100 animate-pulse" />
                ))
              ) : (
                filteredServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <ServiceCard service={service} />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {!loading && filteredServices.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-32 bg-white border border-dashed border-gray-200"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Filter className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">{expertise.noResultsText}</p>
              <button 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                {expertise.resetFiltersText}
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Merchant SaaS Promotion Section - Split Layout (Recipe 11) */}
      <section className="py-20 lg:py-32 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="inline-flex items-center space-x-3 px-4 py-2 bg-primary/10 rounded-full">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Nouveau : Nos Solutions SaaS</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-display font-bold text-ink leading-[1.1] tracking-tighter">
                Pilotez votre entreprise <br />
                <span className="text-primary italic">en toute simplicité.</span>
              </h2>
              
              <p className="text-gray-500 text-lg font-light leading-relaxed max-w-md">
                Une gamme de solutions SaaS dédiées pour optimiser chaque domaine de votre activité :
              </p>

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                {[
                  "Gestion de stock",
                  "Gestion des services",
                  "Gestion de chantier (BTP)",
                  "Gestion de transport et de flotte",
                  "Gestion des ressources humaines (RH)",
                  "Gestion scolaire (écoles / universités)",
                  "Gestion médicale (cliniques / hôpitaux)"
                ].map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 transition-transform" />
                    <span className="text-sm font-medium text-gray-600">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-gray-400 text-sm font-light leading-relaxed max-w-md italic">
                Pensées pour les entrepreneurs ambitieux, ces solutions vous accompagnent dans votre croissance au quotidien.
              </p>

              <div className="pt-4">
                <Link
                  to="/solutions-saas"
                  className="inline-flex items-center space-x-3 px-8 py-4 bg-ink text-white rounded-2xl font-bold hover:bg-primary transition-all group"
                >
                  <span>Découvrir nos Solutions SaaS</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Stylized UI Mockup */}
              <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-4 md:p-8 aspect-[4/3] overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="h-2 w-32 bg-gray-100 rounded-full" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="h-24 bg-blue-50 rounded-2xl border border-blue-100 p-4">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg mb-2 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="h-2 w-12 bg-blue-500/20 rounded-full" />
                  </div>
                  <div className="h-24 bg-purple-50 rounded-2xl border border-purple-100 p-4">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-lg mb-2 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="h-2 w-12 bg-purple-500/20 rounded-full" />
                  </div>
                  <div className="h-24 bg-orange-50 rounded-2xl border border-orange-100 p-4">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg mb-2 flex items-center justify-center">
                      <Construction className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="h-2 w-12 bg-orange-500/20 rounded-full" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-12 bg-gray-50 rounded-xl border border-gray-100" />
                  <div className="h-12 bg-gray-50 rounded-xl border border-gray-100" />
                  <div className="h-32 bg-gray-50 rounded-2xl border border-gray-100" />
                </div>

                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-1/4 -right-4 bg-white shadow-xl rounded-2xl p-4 border border-gray-100 flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Intervention</p>
                    <p className="text-sm font-bold text-ink">Terminée</p>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                  className="absolute bottom-1/4 -left-4 bg-white shadow-xl rounded-2xl p-4 border border-gray-100 flex items-center space-x-3"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                    <Construction className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Chantier</p>
                    <p className="text-sm font-bold text-ink">85% Complété</p>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                  className="absolute top-1/2 -right-8 bg-white shadow-xl rounded-2xl p-4 border border-gray-100 flex items-center space-x-3 z-20"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <Hospital className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Médical</p>
                    <p className="text-sm font-bold text-ink">Nouveau Patient</p>
                  </div>
                </motion.div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary rounded-full -z-10 blur-3xl opacity-10" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary rounded-full -z-10 blur-3xl opacity-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Us Section - Hardware/Specialist (Recipe 3) */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                <OptimizedImage
                  src={whyUs.image}
                  alt="Notre équipe"
                  width={1200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-primary rounded-[3rem] -z-10 blur-3xl opacity-20" />
            </motion.div>

            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center space-x-3 mb-3"
              >
                <div className="w-12 h-px bg-primary" />
                <span className="text-xs font-mono text-primary uppercase tracking-[0.4em] font-bold">Pourquoi Nous ?</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-display font-bold text-ink mb-2 leading-tight tracking-tighter"
              >
                <Translate>{whyUs.title}</Translate>
              </motion.h2>
              <div className="space-y-2">
                {whyUs.points.map((item, i) => {
                  const Icon = iconMap[item.iconName] || CheckCircle2;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start space-x-6"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-ink mb-2">{item.title}</h3>
                        <p className="text-gray-500 leading-relaxed">{item.description}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Brutalist (Recipe 5) */}
      <section className="py-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-ink rounded-[4rem] p-12 md:p-24 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          
          <h2 className="text-4xl md:text-7xl font-display font-bold text-white mb-2 leading-[0.9] tracking-tighter">
            <Translate>{cta.title}</Translate> <br />
            <span className="text-primary italic"><Translate>{cta.subtitle}</Translate></span>
          </h2>
          <p className="text-lg md:text-xl text-white/60 mb-4 max-w-2xl mx-auto font-light leading-relaxed">
            <Translate>{cta.description}</Translate>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to={cta.primaryButtonLink}
              className="px-12 py-6 bg-primary text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-primary/40"
            >
              <Translate>{cta.primaryButtonText}</Translate>
            </Link>
            <Link
              to={cta.secondaryButtonLink}
              className="px-12 py-6 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all"
            >
              <Translate>{cta.secondaryButtonText}</Translate>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
