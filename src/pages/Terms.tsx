import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, ShieldCheck, Scale, AlertCircle, Loader2 } from 'lucide-react';
import { Translate } from '../context/LanguageContext';
import { dbService as db } from '../services/firebaseDbService';

const Terms = () => {
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
      title: 'Acceptation des Conditions',
      content: 'En accédant à ce site web et en utilisant nos services, vous acceptez d\'être lié par les présentes conditions d\'utilisation, toutes les lois et réglementations applicables, et acceptez que vous êtes responsable du respect de toutes les lois locales applicables.',
      icon: ShieldCheck
    },
    {
      title: 'Utilisation des Services',
      content: 'Nos services de communication, d\'impression et de développement numérique sont fournis pour un usage professionnel et personnel légal. Toute utilisation abusive ou frauduleuse de nos services entraînera la résiliation immédiate de votre accès.',
      icon: Scale
    },
    {
      title: 'Propriété Intellectuelle',
      content: 'Tous les contenus présents sur ce site, y compris les textes, graphiques, logos, icônes et images, sont la propriété exclusive d\'Acom Technologie ou de ses fournisseurs de contenu et sont protégés par les lois internationales sur le droit d\'auteur.',
      icon: FileText
    },
    {
      title: 'Limitation de Responsabilité',
      content: 'Acom Technologie ne pourra être tenu responsable des dommages directs, indirects, consécutifs ou spéciaux résultant de l\'utilisation ou de l\'impossibilité d\'utiliser nos services, même si nous avons été informés de la possibilité de tels dommages.',
      icon: AlertCircle
    }
  ];

  const sections = (settings?.termsContent || defaultSections).map((section: any, index: number) => ({
    ...section,
    icon: index === 0 ? ShieldCheck : index === 1 ? Scale : index === 2 ? FileText : AlertCircle
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
      <section className="bg-gray-50 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <Scale className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-6"
          >
            <Translate>Conditions d'Utilisation</Translate>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto"
          >
            <Translate>Dernière mise à jour : 28 Mars 2026. Veuillez lire attentivement ces conditions avant d'utiliser nos services.</Translate>
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
                  <section.icon className="w-7 h-7 text-primary" />
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

            <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Modifications des Conditions</h3>
              <p className="text-gray-600 leading-relaxed">
                Acom Technologie se réserve le droit de réviser ces conditions d'utilisation à tout moment et sans préavis. En utilisant ce site web, vous acceptez d'être lié par la version alors en vigueur de ces conditions d'utilisation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Terms;
