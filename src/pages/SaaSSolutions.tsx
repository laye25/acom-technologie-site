import React from 'react';
import { motion } from 'motion/react';
import { 
  Package, 
  Settings, 
  Construction, 
  Truck, 
  Users, 
  GraduationCap, 
  Hospital,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

const solutions = [
  {
    title: "Gestion de stock",
    description: "Optimisez votre inventaire, suivez vos ventes en temps réel et automatisez vos réapprovisionnements.",
    icon: Package,
    color: "bg-blue-500",
    image: "https://picsum.photos/seed/stock/800/600",
    link: "/merchant/saas?type=boutique"
  },
  {
    title: "Gestion des services",
    description: "Planifiez vos interventions, gérez vos techniciens et suivez la satisfaction client de bout en bout.",
    icon: Settings,
    color: "bg-purple-500",
    image: "https://picsum.photos/seed/services/800/600",
    link: "/merchant/saas?type=entreprise"
  },
  {
    title: "Gestion de chantier (BTP)",
    description: "Suivez l'avancement de vos travaux, gérez vos ressources et maîtrisez vos coûts de construction.",
    icon: Construction,
    color: "bg-orange-500",
    image: "https://picsum.photos/seed/construction/800/600",
    link: "/merchant/saas?type=chantier"
  },
  {
    title: "Gestion de transport et de flotte",
    description: "Gérez vos véhicules, optimisez vos trajets et suivez la consommation de carburant en temps réel.",
    icon: Truck,
    color: "bg-emerald-500",
    image: "https://picsum.photos/seed/transport/800/600",
    link: "/merchant/saas?type=transport"
  },
  {
    title: "Gestion des ressources humaines (RH)",
    description: "Simplifiez la paie, gérez les congés et suivez le développement des compétences de vos collaborateurs.",
    icon: Users,
    color: "bg-rose-500",
    image: "https://picsum.photos/seed/hr/800/600",
    link: "/merchant/saas?type=rh"
  },
  {
    title: "Gestion scolaire (écoles / universités)",
    description: "Gérez les inscriptions, les emplois du temps et la communication entre parents, élèves et enseignants.",
    icon: GraduationCap,
    color: "bg-indigo-500",
    image: "https://picsum.photos/seed/school/800/600",
    link: "/merchant/saas?type=scolaire"
  },
  {
    title: "Gestion médicale (cliniques / hôpitaux)",
    description: "Gérez les dossiers patients, les rendez-vous et la facturation médicale en toute sécurité.",
    icon: Hospital,
    color: "bg-red-500",
    image: "https://picsum.photos/seed/medical/800/600",
    link: "/merchant/saas?type=medical"
  }
];

const SaaSSolutions = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-ink pt-40 pb-24">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/saas-banner/1920/1080" 
            alt="SaaS Solutions Banner" 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
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
            Pilotez votre entreprise <br />
            <span className="text-primary italic">en toute simplicité.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/90 text-lg md:text-xl max-w-3xl font-light leading-relaxed"
          >
            Une gamme de solutions SaaS dédiées pour optimiser chaque domaine de votre activité. 
            Pensées pour les entrepreneurs ambitieux, ces solutions vous accompagnent dans votre croissance au quotidien.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {solutions.map((solution, i) => (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-gray-100 flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={solution.image} 
                  alt={solution.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`absolute top-4 left-4 w-12 h-12 ${solution.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                  <solution.icon className="w-6 h-6" />
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
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <CheckCircle2 className="w-5 h-5 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-12 bg-ink rounded-[3rem] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/20 rounded-full" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-primary/10 rounded-full" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">Prêt à booster votre activité ?</h2>
            <p className="text-white/60 mb-10 max-w-xl mx-auto font-light">
              Nos experts sont là pour vous aider à choisir la solution la plus adaptée à vos besoins spécifiques.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-transform"
              >
                Contactez-nous
              </Link>
              <Link
                to="/prix"
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SaaSSolutions;
