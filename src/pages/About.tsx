import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Target, Award, Rocket, CheckCircle2, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import { Translate } from '../context/LanguageContext';
import { dbService as db } from '../services/firebaseDbService';

const About = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await db.settings.get('global');
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const defaultAbout = {
    heroTitle: "Votre Partenaire Digital de Confiance au Sénégal",
    heroSubtitle: "Acom Technologie est une agence de communication et de services numériques basée à Touba, dédiée à l'accompagnement des entreprises dans leur transformation digitale.",
    missionTitle: "Notre Mission",
    missionDescription: "Notre mission est de démocratiser l'accès aux technologies numériques de pointe pour les entreprises sénégalaises, quelle que soit leur taille.",
    missionPoints: [
      'Innovation constante dans nos solutions',
      'Qualité d\'impression et de design irréprochable',
      'Accompagnement personnalisé pour chaque client',
      'Respect des délais et des engagements'
    ],
    stats: [
      { label: 'Clients Satisfaits', value: '500+', icon: Users },
      { label: 'Projets Terminés', value: '1200+', icon: Rocket },
      { label: 'Années d\'Expérience', value: '8+', icon: Award },
      { label: 'Experts Dédiés', value: '15+', icon: Target },
    ]
  };

  const content = settings?.aboutContent || defaultAbout;
  
  // Map icons back to stats if they come from settings (which don't store icons)
  const statsWithIcons = content.stats.map((stat: any, index: number) => ({
    ...stat,
    icon: index === 0 ? Users : index === 1 ? Rocket : index === 2 ? Award : Target
  }));

  if (loading) {
    return (
      <div className="pt-24 pb-20 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full mb-6"
            >
              <Translate>À Propos de Nous</Translate>
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6"
            >
              <Translate>{content.heroTitle}</Translate>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-600 leading-relaxed"
            >
              <Translate>{content.heroSubtitle}</Translate>
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsWithIcons.map((stat: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium"><Translate>{stat.label}</Translate></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-8">
                <Translate>{content.missionTitle}</Translate>
              </h2>
              <div className="space-y-6">
                <p className="text-gray-600 leading-relaxed">
                  <Translate>{content.missionDescription}</Translate>
                </p>
                <ul className="space-y-4">
                  {content.missionPoints.map((item: string, i: number) => (
                    <li key={i} className="flex items-center text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      <Translate>{item}</Translate>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" 
                  alt="Team working" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary rounded-full blur-3xl opacity-20 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-display font-bold mb-6">
                  <Translate>Prêt à lancer votre projet ?</Translate>
                </h2>
                <p className="text-white/80 text-lg mb-8">
                  <Translate>Venez nous rendre visite ou contactez-nous pour discuter de vos besoins en communication et technologie.</Translate>
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <MapPin className="w-6 h-6 text-white/60" />
                    <span>Touba Khaira, Sénégal</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Phone className="w-6 h-6 text-white/60" />
                    <span>+221 77 795 19 19</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Mail className="w-6 h-6 text-white/60" />
                    <span>contact@acomtechnologie.com</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <button className="px-10 py-5 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-white/90 transition-all shadow-xl">
                  <Translate>Nous Contacter</Translate>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
