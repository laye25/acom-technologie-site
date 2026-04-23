import React from 'react';
import { motion } from 'motion/react';
import { FileText, Shield, Clock, CreditCard, Scale, CheckCircle2 } from 'lucide-react';

const PartnerTerms = () => {
  const sections = [
    {
      title: "1. Engagement de Qualité",
      icon: Shield,
      content: "Le partenaire s'engage à fournir des prestations d'impression et de façonnage conformes aux standards de qualité d'Acom Technologie. Chaque commande doit faire l'objet d'un contrôle qualité rigoureux avant expédition ou mise à disposition."
    },
    {
      title: "2. Respect des Délais",
      icon: Clock,
      content: "Le respect des dates d'échéance indiquées sur le portail est impératif. Tout retard prévisible doit être signalé immédiatement via le chat de commande. Des retards répétés non justifiés peuvent entraîner une suspension du compte partenaire."
    },
    {
      title: "3. Tarification et Paiements",
      icon: CreditCard,
      content: "Les tarifs sont convenus lors de l'acceptation de la commande. Le règlement des factures s'effectue selon le cycle de facturation standard (mensuel ou bimensuel) après validation de la livraison conforme par le client final."
    },
    {
      title: "4. Confidentialité des Données",
      icon: Scale,
      content: "Les fichiers et données clients transmis sont strictement confidentiels. Le partenaire s'interdit d'utiliser ces données à d'autres fins que la réalisation de la commande ou de les transmettre à des tiers."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-primary px-8 py-12 text-white relative overflow-hidden">
            <div className="relative z-10 text-center">
              <FileText className="w-16 h-16 mx-auto mb-6 opacity-80" />
              <h1 className="text-3xl md:text-4xl font-bold mb-4">Conditions Générales de Partenariat</h1>
              <p className="text-primary-light/80 text-lg max-w-2xl mx-auto">
                Cadre contractuel pour une collaboration transparente et performante entre Acom Technologie et ses ateliers partenaires.
              </p>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-dark/20 rounded-full -ml-32 -mb-32 blur-3xl"></div>
          </div>

          <div className="p-8 md:p-12">
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-600 mb-12">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              <div className="grid gap-12">
                {sections.map((section, index) => (
                  <motion.section 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex gap-6"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <section.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
                      <p className="text-gray-600 leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  </motion.section>
                ))}
              </div>

              <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Acceptation des conditions
                </h3>
                <p className="text-sm text-gray-600 italic">
                  En devenant partenaire d'Acom Technologie, vous acceptez pleinement et sans réserve ces conditions. Tout manquement grave peut entraîner une rupture immédiate de la collaboration. Nous privilégions toujours la communication et la résolution mutuelle des problèmes en premier lieu.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
              <p className="text-gray-500 text-sm text-center md:text-left">
                Vous avez des questions sur ce contrat ? <br />
                Contactez notre responsable partenaire à <span className="text-primary font-medium">partenariat@acom.tg</span>
              </p>
              <button 
                onClick={() => window.print()}
                className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                Imprimer le contrat
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PartnerTerms;
