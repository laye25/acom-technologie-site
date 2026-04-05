import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Eye, Database, Bell, Loader2 } from 'lucide-react';
import { Translate } from '../context/LanguageContext';
import { dbService as db } from '../services/firebaseDbService';

const Privacy = () => {
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

  const defaultSections = [
    {
      title: 'Collecte des Données',
      content: 'Nous collectons les informations que vous nous fournissez directement, notamment votre nom, adresse e-mail, numéro de téléphone et détails de commande, afin de traiter vos demandes et d\'améliorer nos services.',
      icon: Database
    },
    {
      title: 'Utilisation des Données',
      content: 'Vos données sont utilisées pour traiter vos commandes, communiquer avec vous sur l\'état de vos projets, et vous envoyer des informations pertinentes sur nos services si vous y avez consenti.',
      icon: Eye
    },
    {
      title: 'Sécurité des Données',
      content: 'Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, perte ou destruction.',
      icon: Lock
    },
    {
      title: 'Vos Droits',
      content: 'Vous avez le droit d\'accéder à vos données personnelles, de les rectifier ou de demander leur suppression à tout moment. Contactez-nous pour exercer ces droits.',
      icon: ShieldCheck
    }
  ];

  const sections = (settings?.privacyContent || defaultSections).map((section: any, index: number) => ({
    ...section,
    icon: index === 0 ? Database : index === 1 ? Eye : index === 2 ? Lock : ShieldCheck
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
      <section className="bg-emerald-50 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6"
          >
            <Translate>Politique de Confidentialité</Translate>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto"
          >
            <Translate>Chez Acom Technologie, nous prenons la protection de vos données personnelles très au sérieux. Voici comment nous traitons vos informations.</Translate>
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col md:flex-row gap-8 items-start"
              >
                <div className="w-14 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <section.icon className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    <Translate>{section.title}</Translate>
                  </h2>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    <Translate>{section.content}</Translate>
                  </p>
                </div>
              </motion.div>
            ))}

            <div className="p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 flex items-start space-x-6">
              <Bell className="w-8 h-8 text-emerald-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mises à jour de la politique</h3>
                <p className="text-gray-600 leading-relaxed">
                  Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement important en publiant la nouvelle politique sur cette page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;
