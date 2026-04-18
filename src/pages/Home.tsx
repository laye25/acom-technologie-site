import React, { useState, useMemo, useEffect } from 'react';
import { SERVICES as STATIC_SERVICES } from '../constants';
import ServiceCard from '../components/ServiceCard';
import HeroBanner from '../components/HeroBanner';
import Hero from '../components/Hero';
import { Service, ServiceCategory, SiteSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight, CheckCircle2, Star, Users, Briefcase, Award, Filter, Clock, Sparkles, Rocket, Palette, Layout, Smartphone, Globe, Megaphone, PenTool, Code, Package, FileText, BarChart3, Construction, Hospital, Truck, GraduationCap, Settings } from 'lucide-react';
import { useFirestoreData, TableName } from '../hooks/useFirestoreData';
import { Link } from 'react-router-dom';
import { Translate, useTranslation } from '../context/LanguageContext';
import { dbService as db } from '../services/dbService';
import { OptimizedImage } from '../components/OptimizedImage';

const iconMap: { [key: string]: any } = {
  Briefcase, Users, Award, Star, CheckCircle2, Clock, Sparkles, Rocket, Palette, Layout, Smartphone, Globe, Megaphone, PenTool, Code
};

// Helper Component to fix hook violation
function SubCategorySection({ subCat, subServices }: { subCat: string, subServices: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleServices = showAll ? subServices : subServices.slice(0, 6);

  return (
    <div className="space-y-6">
      <h4 className="text-lg font-bold text-gray-700">{subCat}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleServices.map((service, index) => (
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
        ))}
      </div>
      {subServices.length > 6 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="text-primary font-bold hover:underline"
        >
          {showAll ? 'Voir moins' : 'Voir plus'}
        </button>
      )}
    </div>
  );
}

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
    subCategory: s.subCategory,
    pillar: s.pillar,
    image: s.image || s.image_url || `https://picsum.photos/seed/${s.id}/800/600`,
    features: s.features || [],
    promotion: s.promotion
  }), []);

  const serviceOptions = useMemo(() => ({
    tableName: 'services' as TableName,
    order: { column: 'name' as const },
    mapper: serviceMapper,
    limit: 50
  }), [serviceMapper]);

  const { data: dbServices, loading } = useFirestoreData<Service>(serviceOptions);

  const [activePillar, setActivePillar] = useState<'saas' | 'studio' | 'all'>('all');
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
    const matchesPillar = activePillar === 'all' || service.pillar === activePillar;
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    const matchesSearch = service.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    return matchesPillar && matchesCategory && matchesSearch;
  }).sort((a, b) => {
    // Sort by category first, then by name
    const catA = (a.category || '').toLowerCase();
    const catB = (b.category || '').toLowerCase();
    if (catA < catB) return -1;
    if (catA > catB) return 1;
    return a.name.localeCompare(b.name);
  });

  const groupedServices = useMemo(() => {
    const groups: { [category: string]: { [subCategory: string]: Service[] } } = {
      'digital': {},
      'design': {}
    };

    // Define subcategory order
    const subCatOrder: { [key: string]: string[] } = {
      'digital': ['Développement Logiciel', 'Web & Plateformes'],
      'design': ['Impression & Marquage', 'Signalétique']
    };

    filteredServices.forEach(service => {
      const cat = service.category?.toLowerCase() || 'autres';
      const subCat = service.subCategory || 'Autres';
      
      if (!groups[cat]) groups[cat] = {};
      if (!groups[cat][subCat]) groups[cat][subCat] = [];
      groups[cat][subCat].push(service);
    });

    // Sort subcategories within each category based on defined order
    const sortedGroups: { category: string, subCategories: { name: string, services: Service[] }[] }[] = [];
    
    const catOrder = ['digital', 'design'];
    catOrder.forEach(cat => {
      if (groups[cat] && Object.keys(groups[cat]).length > 0) {
        const subCats: { name: string, services: Service[] }[] = [];
        const order = subCatOrder[cat] || [];
        
        // Add ordered subcategories
        order.forEach(subName => {
          if (groups[cat][subName]) {
            subCats.push({ name: subName, services: groups[cat][subName] });
            delete groups[cat][subName];
          }
        });
        
        // Add remaining subcategories
        Object.entries(groups[cat]).forEach(([name, services]) => {
          subCats.push({ name, services });
        });
        
        sortedGroups.push({ category: cat, subCategories: subCats });
      }
    });

    return sortedGroups;
  }, [filteredServices]);

  const categories = useMemo(() => {
    const currentServices = activePillar === 'all' ? services : services.filter(s => s.pillar === activePillar);
    const cats = currentServices.map(s => s.category);
    const uniqueCats = Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b));
    return [
      { id: 'all', label: 'Tous' },
      ...uniqueCats.map(cat => ({
        id: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
    ];
  }, [services, activePillar]);

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

  return (
    <div className="bg-paper min-h-screen">
      <HeroBanner />

      {/* Dual Pillar Section - The "Two Worlds" Design */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-ink mb-6 tracking-tighter">
              {settings?.expertiseSection?.titlePart1 || "Une Expertise,"} <span className="text-primary">{settings?.expertiseSection?.titlePart2 || "Deux Univers."}</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
              {settings?.expertiseSection?.subtitle || "Découvrez nos deux pôles d'excellence conçus pour répondre à l'intégralité de vos besoins digitaux et physiques."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Pillar 1 */}
            <motion.div
              whileHover={{ y: -10, borderColor: `${settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e'}66` }}
              animate={{
                borderColor: activePillar === 'saas' ? (settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e') : '#f3f4f6',
                boxShadow: activePillar === 'saas' ? `0 25px 50px -12px ${settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e'}40` : 'none'
              }}
              className="relative group cursor-pointer overflow-hidden rounded-[3rem] p-12 min-h-[500px] flex flex-col justify-end border-2 transition-all duration-500 bg-white"
              onClick={() => setActivePillar('saas')}
            >
              <div className="absolute inset-0 z-0">
                <OptimizedImage 
                  src={settings?.expertiseSection?.universes?.[0]?.image || "https://picsum.photos/seed/saas-tech/1200/800"} 
                  alt="Acom SaaS"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Base Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/80 to-ink/40" />
                
                {/* Active Colored Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{ 
                    opacity: activePillar === 'saas' ? 1 : 0, 
                    background: `linear-gradient(to top, ${settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e'}E6 0%, rgba(15,23,42,0.9) 40%, rgba(15,23,42,0.4) 100%)` 
                  }} 
                />
                
                {/* Hover Colored Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  style={{ 
                    opacity: activePillar === 'saas' ? 0 : '',
                    background: `linear-gradient(to top, ${settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e'}B3 0%, rgba(15,23,42,0.9) 40%, rgba(15,23,42,0.4) 100%)` 
                  }} 
                />
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-white/10">
                  <Code className="w-8 h-8" style={{ color: settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e' }} />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">{settings?.expertiseSection?.universes?.[0]?.title || "Acom SaaS"}</h3>
                <p className="text-white/70 mb-8 leading-relaxed">
                  {settings?.expertiseSection?.universes?.[0]?.description || "Solutions logicielles métiers 100% cloud pour piloter votre activité. Une suite d'outils puissants adaptés à chaque secteur."}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-10">
                  {(settings?.expertiseSection?.universes?.[0]?.features || [
                    'Gestion de stock',
                    'Gestion des services',
                    'Gestion de chantier (BTP)',
                    'Gestion de transport & flotte',
                    'Ressources Humaines (RH)',
                    'Gestion scolaire',
                    'Gestion médicale'
                  ]).map((item, i) => (
                    <li key={i} className="flex items-center text-xs font-medium text-white/80">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2 flex-shrink-0" style={{ color: settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={settings?.expertiseSection?.universes?.[0]?.linkUrl || "/solutions-saas"} className="inline-flex items-center font-bold text-white group-hover:gap-4 transition-all gap-2" onClick={(e) => e.stopPropagation()}>
                  {settings?.expertiseSection?.universes?.[0]?.linkText || "Explorer les solutions SaaS"} <ArrowRight className="w-5 h-5" style={{ color: settings?.expertiseSection?.universes?.[0]?.baseColor || '#8e008e' }} />
                </Link>
              </div>
            </motion.div>

            {/* Pillar 2 */}
            <motion.div
              whileHover={{ y: -10, borderColor: `${settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981'}66` }}
              animate={{
                borderColor: activePillar === 'studio' ? (settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981') : '#f3f4f6',
                boxShadow: activePillar === 'studio' ? `0 25px 50px -12px ${settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981'}40` : 'none'
              }}
              className="relative group cursor-pointer overflow-hidden rounded-[3rem] p-12 min-h-[500px] flex flex-col justify-end border-2 transition-all duration-500 bg-white"
              onClick={() => setActivePillar('studio')}
            >
              <div className="absolute inset-0 z-0">
                <OptimizedImage 
                  src={settings?.expertiseSection?.universes?.[1]?.image || "https://picsum.photos/seed/studio-design/1200/800"} 
                  alt="Acom Studio"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Base Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/80 to-ink/40" />
                
                {/* Active Colored Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{ 
                    opacity: activePillar === 'studio' ? 1 : 0, 
                    background: `linear-gradient(to top, ${settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981'}E6 0%, rgba(15,23,42,0.9) 40%, rgba(15,23,42,0.4) 100%)` 
                  }} 
                />
                
                {/* Hover Colored Overlay */}
                <div 
                  className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  style={{ 
                    opacity: activePillar === 'studio' ? 0 : '',
                    background: `linear-gradient(to top, ${settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981'}B3 0%, rgba(15,23,42,0.9) 40%, rgba(15,23,42,0.4) 100%)` 
                  }} 
                />
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-white/10">
                  <Palette className="w-8 h-8" style={{ color: settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981' }} />
                </div>
                <h3 className="text-3xl font-display font-bold text-white mb-4">{settings?.expertiseSection?.universes?.[1]?.title || "Acom Studio"}</h3>
                <p className="text-white/70 mb-8 leading-relaxed">
                  {settings?.expertiseSection?.universes?.[1]?.description || "L'excellence du design et de l'impression. Personnalisez et commandez vos supports physiques avec une qualité irréprochable."}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-10">
                  {(settings?.expertiseSection?.universes?.[1]?.features || [
                    'Goodies',
                    'Marketing & Publicité',
                    'Papeterie & Bureautique',
                    'Signalétique'
                  ]).map((item, i) => (
                    <li key={i} className="flex items-center text-xs font-medium text-white/80">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-2 flex-shrink-0" style={{ color: settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981' }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={settings?.expertiseSection?.universes?.[1]?.linkUrl || "/merchants"} className="inline-flex items-center font-bold text-white group-hover:gap-4 transition-all gap-2" onClick={(e) => e.stopPropagation()}>
                  {settings?.expertiseSection?.universes?.[1]?.linkText || "Explorer Acom Studio"} <ArrowRight className="w-5 h-5" style={{ color: settings?.expertiseSection?.universes?.[1]?.baseColor || '#10b981' }} />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section - Dynamic Filtering */}
      <section id="services" className="py-20 lg:py-32 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl font-display font-bold text-ink mb-4 tracking-tight">
                Services <span className="text-primary">Sur Mesure</span>
              </h2>
              <p className="text-gray-500">
                {activePillar === 'saas' ? 'Solutions logicielles et plateformes digitales pour transformer votre entreprise.' : 
                 activePillar === 'studio' ? 'Design créatif et impression haute qualité pour votre communication.' :
                 'Explorez l\'intégralité de nos solutions digitales et physiques.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                    activeCategory === cat.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t(cat.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-12">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un service (ex: Site web, Cartes de visite...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-5 bg-gray-50 border border-gray-100 rounded-[2rem] text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>

          <div className="space-y-20">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-[500px] bg-gray-50 animate-pulse rounded-[3rem]" />
                  ))}
                </div>
              ) : (
                <div className="space-y-24">
                  {groupedServices.map((group) => (
                    <div key={group.category} className="space-y-12">
                      <div className="relative inline-block">
                        <h3 className="text-2xl font-display font-bold text-ink uppercase tracking-wider">
                          {group.category}
                        </h3>
                        <div className="absolute -bottom-2 left-0 w-full h-1 bg-primary rounded-full" />
                      </div>
                      
                      <div className="space-y-16">
                        {group.subCategories.map((sub) => (
                          <SubCategorySection key={sub.name} subCat={sub.name} subServices={sub.services} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>

          {!loading && filteredServices.length === 0 && (
            <div className="text-center py-32">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-200" />
              </div>
              <p className="text-gray-400 text-lg">Aucun service trouvé pour cette recherche.</p>
              <button 
                onClick={() => { setActiveCategory('all'); setActivePillar('all'); setSearchQuery(''); }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
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
