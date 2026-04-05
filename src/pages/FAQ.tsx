import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, HelpCircle, MessageCircle, Loader2 } from 'lucide-react';
import { Translate } from '../context/LanguageContext';
import { dbService as db } from '../services/firebaseDbService';

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);
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

  const categories = ['Général', 'Impression', 'Digital', 'Paiement'];

  const defaultFaqs = [
    {
      category: 'Général',
      question: 'Quels sont vos horaires d\'ouverture ?',
      answer: 'Nous sommes ouverts du lundi au samedi, de 8h30 à 18h30. Notre équipe de support en ligne est également disponible pour répondre à vos questions via le chat.'
    },
    {
      category: 'Général',
      question: 'Où se trouve votre agence ?',
      answer: 'Notre agence principale est située à Touba Khaira, Sénégal. Vous pouvez nous trouver facilement sur Google Maps.'
    },
    {
      category: 'Impression',
      question: 'Quels types de supports d\'impression proposez-vous ?',
      answer: 'Nous proposons une large gamme de supports : cartes de visite, flyers, dépliants, affiches grand format, bâches, autocollants, et bien plus encore.'
    },
    {
      category: 'Impression',
      question: 'Quel est le délai moyen pour une commande d\'impression ?',
      answer: 'Le délai varie selon la complexité et la quantité. En général, les petites commandes sont prêtes en 24-48h, tandis que les projets plus importants peuvent prendre 3 à 5 jours ouvrables.'
    },
    {
      category: 'Digital',
      question: 'Proposez-vous la création de sites web ?',
      answer: 'Oui, nous créons des sites vitrines, des boutiques en ligne (e-commerce) et des applications web sur mesure adaptées à vos besoins spécifiques.'
    },
    {
      category: 'Digital',
      question: 'Gérez-vous les réseaux sociaux pour les entreprises ?',
      answer: 'Absolument. Nous proposons des services de community management pour booster votre présence sur Facebook, Instagram et LinkedIn.'
    },
    {
      category: 'Paiement',
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons les paiements en espèces à l\'agence, ainsi que les transferts via Orange Money, Wave et Free Money pour plus de commodité.'
    },
    {
      category: 'Paiement',
      question: 'Dois-je payer la totalité à la commande ?',
      answer: 'Pour la plupart des projets, nous demandons un acompte de 50% à la commande et le solde à la livraison ou à la fin du projet.'
    }
  ];

  const faqs = settings?.faqContent || defaultFaqs;

  const filteredFaqs = faqs.filter((faq: any) => 
    (activeCategory === 'Tous' || faq.category === activeCategory) &&
    (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
     faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <section className="bg-primary py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <HelpCircle className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-6"
          >
            <Translate>Comment pouvons-nous vous aider ?</Translate>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
            />
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['Tous', ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeCategory === cat
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Translate>{cat}</Translate>
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-bold text-gray-900 pr-8">{faq.question}</span>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      openIndex === index ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                      >
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Aucun résultat trouvé pour votre recherche.</p>
              </div>
            )}
          </div>

          {/* Still have questions? */}
          <div className="mt-20 p-10 bg-emerald-50 rounded-[3rem] border border-emerald-100 text-center">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Vous avez encore des questions ?</h3>
            <p className="text-gray-600 mb-6">Notre équipe est là pour vous aider à tout moment.</p>
            <button className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-200">
              Contactez-nous
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
