import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../components/OptimizedImage';
import { dbService } from '../services/dbService';
import { SaaSPageContent } from '../types';

const defaultSolutions = [
  {
    title: "Gestion de stock",
    description: "Optimisez votre inventaire, suivez vos ventes en temps réel et automatisez vos réapprovisionnements.",
    iconName: "Package",
    color: "bg-blue-500",
    image: "https://picsum.photos/seed/stock/800/600",
    link: "/merchant/saas?type=boutique"
  },
  {
    title: "Gestion des services",
    description: "Planifiez vos interventions, gérez vos techniciens et suivez la satisfaction client de bout en bout.",
    iconName: "Settings",
    color: "bg-purple-500",
    image: "https://picsum.photos/seed/services/800/600",
    link: "/merchant/saas?type=entreprise"
  },
  {
    title: "Gestion de chantier (BTP)",
    description: "Suivez l'avancement de vos travaux, gérez vos ressources et maîtrisez vos coûts de construction.",
    iconName: "Construction",
    color: "bg-orange-500",
    image: "https://picsum.photos/seed/construction/800/600",
    link: "/merchant/saas?type=chantier"
  },
  {
    title: "Gestion de transport et de flotte",
    description: "Gérez vos véhicules, optimisez vos trajets et suivez la consommation de carburant en temps réel.",
    iconName: "Truck",
    color: "bg-emerald-500",
    image: "https://picsum.photos/seed/transport/800/600",
    link: "/merchant/saas?type=transport"
  },
  {
    title: "Gestion des ressources humaines (RH)",
    description: "Simplifiez la paie, gérez les congés et suivez le développement des compétences de vos collaborateurs.",
    iconName: "Users",
    color: "bg-rose-500",
    image: "https://picsum.photos/seed/hr/800/600",
    link: "/merchant/saas?type=rh"
  },
  {
    title: "Gestion scolaire (écoles / universités)",
    description: "Gérez les inscriptions, les emplois du temps et la communication entre parents, élèves et enseignants.",
    iconName: "GraduationCap",
    color: "bg-indigo-500",
    image: "https://picsum.photos/seed/school/800/600",
    link: "/merchant/saas?type=scolaire"
  },
  {
    title: "Gestion médicale (cliniques / hôpitaux)",
    description: "Gérez les dossiers patients, les rendez-vous et la facturation médicale en toute sécurité.",
    iconName: "Hospital",
    color: "bg-red-500",
    image: "https://picsum.photos/seed/medical/800/600",
    link: "/merchant/saas?type=medical"
  }
];

const SaaSSolutions = () => {
  const [saasContent, setSaasContent] = useState<SaaSPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await dbService.settings.get('default');
        if (data && data.saasContent) {
          setSaasContent(data.saasContent);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const solutions = saasContent?.solutions && saasContent.solutions.length > 0 ? saasContent.solutions : defaultSolutions;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-ink pt-40 pb-24">
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            src={saasContent?.bannerImage || "https://picsum.photos/seed/saas-banner/1920/1080"} 
            alt="SaaS Solutions Banner" 
            width={1920}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/90 via-ink/40 to-ink/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/20 border border-primary/20 rounded-full mb-8"
          >
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Nos Solutions SaaS</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-7xl font-display font-bold text-white mb-8 tracking-tighter leading-[1.1]"
          >
            {saasContent?.heroTitle1 || "Pilotez votre entreprise"} <br />
            <span className="text-primary italic">{saasContent?.heroTitle2 || "en toute simplicité."}</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/90 text-lg md:text-xl max-w-3xl font-light leading-relaxed"
          >
            {saasContent?.heroDescription || "Une gamme de solutions SaaS dédiées pour optimiser chaque domaine de votre activité. Pensées pour les entrepreneurs ambitieux, ces solutions vous accompagnent dans votre croissance au quotidien."}
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, i) => {
            const Icon = (Icons as any)[solution.iconName || 'Box'] || Icons.Box;
            return (
            <motion.div
              key={solution.title + i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-gray-100 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <OptimizedImage 
                  src={solution.image} 
                  alt={solution.title}
                  width={600}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`absolute top-4 left-4 w-12 h-12 ${solution.color || 'bg-primary'} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div className="p-8 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-ink mb-4 group-hover:text-primary transition-colors">{solution.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-light flex-grow">
                  {solution.description}
                </p>
                
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <Link 
                    to={solution.link} 
                    className="text-xs font-bold text-ink hover:text-primary transition-colors flex items-center space-x-2"
                  >
                    <span>DÉMARRER L'OFFRE GRATUIT</span>
                    <Icons.ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      </div>
    </div>
  );
};

export default SaaSSolutions;
