import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, Rocket, Palette, Layout, Smartphone, Globe, Megaphone, PenTool, Code, ChevronRight, Tag, Briefcase, Users, Award, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { dbService as db } from '../services/dbService';
import { Translate, useTranslation } from '../context/LanguageContext';
import { OptimizedImage } from './OptimizedImage';

const iconMap: { [key: string]: any } = {
  Sparkles, Rocket, Palette, Layout, Smartphone, Globe, Megaphone, PenTool, Code, Briefcase, Users, Award, Star
};

const DEFAULT_SLIDES = [
  {
    title: "Impression Numérique & Offset",
    subtitle: "Qualité supérieure pour tous vos supports de communication : brochures, dépliants, et plus.",
    iconName: "Palette",
    color: "from-[#8e008e] via-[#b000b0] to-[#ff00ff]",
    image: "https://picsum.photos/seed/print/1200/800",
    badge: "SUPER PROMO"
  },
  {
    title: "Solutions Digitales Innovantes",
    subtitle: "Développement web et mobile sur mesure pour propulser votre présence en ligne.",
    iconName: "Rocket",
    color: "from-primary-900 via-indigo-800 to-primary-600",
    image: "https://picsum.photos/seed/digital/1200/800"
  },
  {
    title: "Marketing & Stratégie",
    subtitle: "Donnez de l'élan à votre marque avec des campagnes publicitaires percutantes.",
    iconName: "Sparkles",
    color: "from-purple-900 via-primary-800 to-fuchsia-700",
    image: "https://picsum.photos/seed/marketing/1200/800"
  }
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [brandName, setBrandName] = useState('Acom Technologie');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await db.settings.get('global');

        if (data) {
          if (data.heroSlides) {
            const mappedSlides = data.heroSlides.map((slide: any, i: number) => ({
              ...slide,
              image: slide.image || `https://picsum.photos/seed/hero-${i}/1200/800`
            }));
            setSlides(mappedSlides);
          }
          if (data.brandName) {
            setBrandName(data.brandName);
          }
          if (data.logoUrl) {
            setLogoUrl(data.logoUrl);
          }
          if (data.statsSection) {
            setStats(data.statsSection);
          } else {
            setStats([
              { label: 'Projets Terminés', value: '500+', iconName: 'Briefcase' },
              { label: 'Clients Satisfaits', value: '200+', iconName: 'Users' },
              { label: 'Années d\'Expérience', value: '10+', iconName: 'Award' },
              { label: 'Avis Positifs', value: '4.9/5', iconName: 'Star' },
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const currentSlide = slides[current] || slides[0];
  const Icon = currentSlide ? (iconMap[currentSlide.iconName] || Sparkles) : Sparkles;

  return (
    <div className="relative w-full overflow-hidden bg-ink">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="relative w-full min-h-[800px] lg:min-h-[900px] flex items-center"
        >
          {/* Background Image with Parallax effect */}
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            className="absolute inset-0 z-0"
          >
            <OptimizedImage
              src={currentSlide.image}
              alt=""
              width={1200}
              className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
            />
          </motion.div>

          {/* Gradient Overlays */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.color} mix-blend-multiply opacity-60 z-0`} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent z-0" />

          {/* Content Container */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-40 pb-20 lg:pt-56 lg:pb-32 flex flex-col justify-center min-h-[800px] lg:min-h-[900px]">
            <div className="grid lg:grid-cols-2 gap-12 items-center w-full mb-16 lg:mb-24">
              {/* Text Content */}
              <div className="max-w-2xl">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-3 mb-6"
                >
                  <div className="w-12 h-px bg-primary" />
                  <span className="text-xs font-mono text-primary uppercase tracking-[0.4em] font-bold">{brandName}</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-display font-bold text-white leading-[1.1] sm:leading-[0.9] mb-8 tracking-tighter"
                >
                  <Translate>{currentSlide.title}</Translate>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-base sm:text-lg lg:text-xl text-white/70 mb-10 leading-relaxed max-w-lg font-light"
                >
                  <Translate>{currentSlide.subtitle}</Translate>
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap gap-4"
                >
                  <Link
                    to="/solutions-saas"
                    className="group relative px-8 py-4 bg-primary text-white rounded-full font-bold overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30"
                  >
                    <span className="relative z-10 flex items-center">
                      <Translate>Nos Solutions de Gestions</Translate>
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                  <Link
                    to="/quote-request"
                    className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-full font-bold hover:bg-white/10 transition-all"
                  >
                    <Translate>Devis personnalisé</Translate>
                  </Link>
                </motion.div>
              </div>

              {/* Visual Element */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="hidden lg:block relative ml-auto"
              >
                <div className="relative z-10 w-[380px] xl:w-[420px] aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 bg-white/5 group flex items-center justify-center">
                  <OptimizedImage 
                    src={currentSlide.image} 
                    alt="" 
                    width={800}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                  
                  {currentSlide.badge && (
                    <div className="absolute top-6 right-6">
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="px-5 py-2 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-[0.2em] shadow-2xl border border-primary/20 flex items-center gap-2"
                      >
                        <Tag className="w-3 h-3" />
                        <Translate>{currentSlide.badge}</Translate>
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Floating Info Card */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute bottom-6 left-6 right-6 p-5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="pr-4">
                        <p className="text-[9px] font-mono text-primary uppercase tracking-widest mb-1"><Translate>Acom Studio</Translate></p>
                        <p className="text-white font-bold text-sm truncate"><Translate>{currentSlide.title}</Translate></p>
                      </div>
                      <div className="flex-shrink-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Decorative Elements - Adjusted to be more subtle and not overlap */}
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full animate-pulse" />
                <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-primary/10 rounded-full animate-pulse" />
              </motion.div>
            </div>

            {/* Stats Section in the flow */}
            <div className="w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                {stats.map((stat, i) => {
                  if (!stat) return null;
                  const StatIcon = iconMap[stat.iconName] || Briefcase;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + (i * 0.1) }}
                      className="text-center p-3 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <div className="inline-flex items-center justify-center w-6 h-6 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-primary/10 mb-2 md:mb-4">
                        <StatIcon className="w-3 h-3 md:w-6 md:h-6 text-primary" />
                      </div>
                      <div className="text-lg sm:text-2xl md:text-3xl font-display font-bold mb-0.5 tracking-tighter text-white">{stat.value}</div>
                      <div className="text-[6px] md:text-[10px] font-mono text-white/40 uppercase tracking-widest leading-tight">
                        <Translate>{stat.label}</Translate>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute top-1/2 -translate-y-1/2 left-6 md:left-12 flex flex-col space-y-4 z-20 hidden xl:flex">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="group flex items-center space-x-4"
          >
            <div className={`h-px transition-all duration-500 ${
              current === i ? 'w-12 bg-primary' : 'w-6 bg-white/20 group-hover:bg-white/40'
            }`} />
            <span className={`text-[10px] font-mono transition-colors ${
              current === i ? 'text-white' : 'text-white/20 group-hover:text-white/40'
            }`}>0{i + 1}</span>
          </button>
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-12 right-6 md:right-12 z-20 hidden lg:block"
      >
        <div className="w-px h-24 bg-gradient-to-b from-white/20 to-transparent flex items-end justify-center">
          <div className="w-1 h-1 bg-white rounded-full mb-2" />
        </div>
      </motion.div>
    </div>
  );
};

export default HeroBanner;
