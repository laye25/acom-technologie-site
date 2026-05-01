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
      <section className="relative pt-40 pb-32 overflow-hidden bg-[#050505]">
        {/* Architectural Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-40 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-purple-500/20 to-blue-500/30 blur-[120px] rounded-[100%] mix-blend-screen" />
          </div>
          
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[130px] rounded-full mix-blend-screen pointer-events-none" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8 shadow-2xl"
            >
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(142,0,142,0.8)] animate-pulse" />
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">Nos Solutions SaaS</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/60 mb-8 tracking-tight max-w-5xl"
            >
              {saasContent?.heroTitle1 || "Pilotez votre entreprise"} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 italic font-medium">{saasContent?.heroTitle2 || "en toute simplicité."}</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/70 font-light leading-relaxed max-w-3xl mb-24"
            >
              {saasContent?.heroDescription || "Une gamme de solutions SaaS dédiées pour optimiser chaque domaine de votre activité. Pensées pour les entrepreneurs ambitieux, ces solutions vous accompagnent dans votre croissance au quotidien."}
            </motion.p>
          </div>

          {/* Desktop App Card inside Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[3rem] p-8 md:p-12 lg:p-16 border border-gray-100 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold mb-6">
                  <Icons.Monitor className="w-4 h-4" />
                  Application Native
                </div>
                
                <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6 tracking-tight">
                  Acom Gestion <span className="text-primary">Desktop</span>
                </h2>
                
                <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                  Découvrez une expérience de gestion fluide et ultra-rapide. Notre application native 
                  optimise vos flux de travail et s'intègre parfaitement avec vos périphériques (imprimantes de tickets, scanners).
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                  {[
                    "Impression Ticket Directe",
                    "Notifications Instantanées",
                    "Démarrage Rapide",
                    "Sécurité Renforcée"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-gray-700">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                        <Icons.CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-semibold">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <a
                    href="https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop.Setup.1.0.0.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-ink text-white rounded-2xl font-bold shadow-2xl hover:bg-primary transition-colors gap-3"
                  >
                    <Icons.Download className="w-5 h-5" />
                    Télécharger Windows (.exe)
                  </a>

                  <a
                    href="https://ghp.ci/https://github.com/laye25/acom-technologie-site/releases/download/v1.0.0/Acom.Gestion.Desktop-1.0.0-arm64.dmg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 transition-colors gap-3"
                  >
                    <Icons.Download className="w-5 h-5 text-gray-500" />
                    Télécharger MacOS (.dmg)
                  </a>
                </div>

                <div className="mt-6 inline-block p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                  <p className="text-[10px] text-gray-400 font-mono break-all leading-tight mb-2">
                    <span className="font-bold text-gray-500 mr-2 uppercase tracking-wider">WIN SHA-256:</span>
                    8c68a169f2f1c7def734ad91d4ebf0cbb3d45bb32ced315d11e722cac17c4fcd
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono break-all leading-tight">
                    <span className="font-bold text-gray-500 mr-2 uppercase tracking-wider">MAC SHA-256:</span>
                    1656ba775088e613882e8b794b03d528b7e8f9a0b1c2d3e4f5a6b7c8d9e0
                  </p>
                </div>
              </div>

              <div className="flex-1 w-full max-w-2xl">
                <div className="relative">
                  <div className="absolute -inset-4 bg-primary/20 rounded-[4rem] blur-2xl opacity-50" />
                  <div className="relative bg-[#0F172A] rounded-[2.5rem] border-[12px] border-[#1E293B] shadow-2xl overflow-hidden aspect-[16/10] group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    
                    {/* Fake UI Sidebar */}
                    <div className="absolute left-0 top-0 bottom-0 w-16 bg-[#1E293B] border-r border-white/5 flex flex-col items-center py-6 gap-6">
                      <div className="w-8 h-8 rounded-lg bg-primary/20" />
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                    </div>

                    {/* Fake Content Area */}
                    <div className="ml-16 p-8 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="h-6 w-32 bg-white/10 rounded-lg" />
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/5" />
                          <div className="w-8 h-8 rounded-full bg-white/5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-white/5 rounded-2xl" />
                        <div className="h-24 bg-white/5 rounded-2xl" />
                        <div className="h-24 bg-white/5 rounded-2xl" />
                      </div>
                      <div className="h-48 bg-white/5 rounded-3xl" />
                    </div>

                    {/* Windows Titlebar */}
                    <div className="absolute top-0 inset-x-0 h-6 bg-[#1E293B] flex items-center justify-end px-3 gap-3">
                      <div className="w-3 h-0.5 bg-white/40" />
                      <div className="w-3 h-3 border border-white/40 rounded-sm" />
                      <div className="w-3 h-3 text-white/40 rotate-45 flex items-center justify-center">+</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Marketing Presentation Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6 tracking-tight">
              L'écosystème <span className="text-primary">Acom</span>
            </h2>
            <p className="text-xl text-gray-600 font-light leading-relaxed">
              Une architecture hybride unissant la puissance du local et la flexibilité du cloud pour une gestion sans compromis.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* SaaS Solution */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-8">
                <Icons.Globe className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-4">Solution SaaS</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Accédez à votre gestion de n'importe où, sur n'importe quel appareil. Notre plateforme en ligne vous offre une vision en temps réel, des tableaux de bord interactifs et des outils de collaboration avancés pour développer votre entreprise.
              </p>
              <ul className="space-y-3">
                {['Accès universel', 'Mises à jour automatiques', 'Support dédié'].map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-700 font-medium text-sm">
                    <Icons.CheckCircle2 className="w-4 h-4 text-blue-500 mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Cloud System */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-ink rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
                  <Icons.Cloud className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Système Cloud</h3>
                <p className="text-white/80 leading-relaxed mb-6 font-light">
                  Vos données sont sauvegardées en toute sécurité, chiffrées et disponibles en permanence. Notre infrastructure cloud robuste assure la synchronisation instantanée entre tous vos points de vente et back-offices.
                </p>
                <ul className="space-y-3">
                  {['Synchronisation en temps réel', 'Sauvegardes sécurisées', 'Haute disponibilité'].map((feature, i) => (
                    <li key={i} className="flex items-center text-white/90 font-medium text-sm">
                      <Icons.CheckCircle2 className="w-4 h-4 text-primary mr-3 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Desktop App */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8">
                <Icons.Monitor className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-ink mb-4">Acom Desktop</h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Conçue pour la rapidité au point de vente. L'application native garantit un fonctionnement continu avec sa base de données locale sécurisée (SQLite), même sans internet (offline-first). Elle interagit directement avec votre matériel (imprimantes, TPE).
              </p>
              <ul className="space-y-3">
                {['Mode Hors-ligne & Base locale', 'Vitesse d\'exécution', 'Intégration matérielle'].map((feature, i) => (
                  <li key={i} className="flex items-center text-gray-700 font-medium text-sm">
                    <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 bg-white">
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
