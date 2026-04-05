import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { PortfolioItem } from '../types';
import { useFirebaseData, CollectionName } from '../hooks/useFirebase';
import { ArrowRight, ExternalLink, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PORTFOLIO_ITEMS } from '../constants';

const Portfolio = () => {
  const projectMapper = useMemo(() => (p: any) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    image: p.image || p.image_url || `https://picsum.photos/seed/${p.id}/800/600`,
    order: p.display_order
  }), []);

  const portfolioOptions = useMemo(() => ({
    collectionName: 'portfolio' as CollectionName,
    order: { column: 'display_order' as const },
    mapper: projectMapper,
    limit: 50
  }), [projectMapper]);

  const { data: dbProjects, loading } = useFirebaseData<PortfolioItem>(portfolioOptions);
  const { data: settingsData } = useFirebaseData<any>({ collectionName: 'settings' as CollectionName });
  const settings = settingsData?.[0];

  const displayProjects = useMemo(() => {
    if (!loading && dbProjects.length === 0) {
      return PORTFOLIO_ITEMS;
    }
    return dbProjects.length > 0 ? dbProjects : PORTFOLIO_ITEMS;
  }, [dbProjects, loading]);

  const portfolioSettings = settings?.portfolioSection || {
    badge: "Portfolio",
    title: "Nos Réalisations",
    subtitle: "Découvrez comment nous aidons nos clients à atteindre leurs objectifs grâce à des solutions digitales innovantes et un design d'exception.",
    ctaTitle: "Votre Projet Mérite L'Excellence.",
    ctaButton: "Discutons de votre Vision"
  };

  return (
    <div className="bg-paper min-h-screen">
      {/* Hero Section - Editorial (Recipe 2) */}
      <section className="pt-24 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 mb-4"
          >
            <div className="w-12 h-px bg-primary" />
            <span className="text-xs font-mono text-primary uppercase tracking-[0.4em] font-bold">{portfolioSettings.badge}</span>
          </motion.div>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-12">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl md:text-9xl font-display font-bold text-ink leading-[0.85] tracking-tighter"
            >
              {portfolioSettings.title.split(' ').map((word: string, i: number) => (
                <React.Fragment key={i}>
                  {i === portfolioSettings.title.split(' ').length - 1 ? (
                    <span className="text-primary italic">{word}</span>
                  ) : (
                    <>{word} </>
                  )}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-gray-500 max-w-md font-light leading-relaxed mb-4 lg:mb-6"
            >
              {portfolioSettings.subtitle}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Projects Grid - Dark Luxury (Recipe 4) */}
      <section className="pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {loading && dbProjects.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[4/5] bg-gray-100 rounded-[3rem] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              {displayProjects.map((project, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 2) * 0.1 }}
                  className={`group relative ${i % 2 === 1 ? 'md:mt-16' : ''}`}
                >
                  <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden bg-gray-100 shadow-2xl transition-transform duration-700 group-hover:scale-[0.98]">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/seed/${project.id}/800/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/40 transition-colors duration-500" />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transform scale-50 group-hover:scale-100 transition-transform duration-500">
                        <Plus className="w-8 h-8 text-ink" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-start px-4">
                    <div>
                      <span className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] font-bold mb-2 block">
                        {project.category}
                      </span>
                      <h3 className="text-3xl font-display font-bold text-ink group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-7xl mx-auto bg-ink rounded-[4rem] p-10 md:p-16 text-center relative overflow-hidden"
        >
          <h2 className="text-4xl md:text-7xl font-display font-bold text-white mb-6 leading-[0.9] tracking-tighter">
            {portfolioSettings.ctaTitle.split(' ').map((word: string, i: number) => (
              <React.Fragment key={i}>
                {i === portfolioSettings.ctaTitle.split(' ').length - 1 ? (
                  <span className="text-primary italic">{word}</span>
                ) : (
                  <>{word} </>
                )}
                {i === 2 && <br />}
              </React.Fragment>
            ))}
          </h2>
          <Link 
            to="/quote-request"
            className="inline-block px-12 py-6 bg-primary text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-primary/40"
          >
            {portfolioSettings.ctaButton}
          </Link>
        </motion.div>
      </section>
    </div>
  );
};

export default Portfolio;
