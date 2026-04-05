import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    name: 'FREE',
    price: '0',
    description: 'Pour débuter votre activité',
    features: [
      'Gestion de stock basique',
      '10 ventes par jour',
      '1 utilisateur',
      'Reçus numériques',
      'Support par email'
    ],
    gradient: 'from-[#00f2fe] to-[#7c3aed]',
    buttonColor: 'bg-[#00f2fe]'
  },
  {
    name: 'BASIC',
    price: '10\u00A0000',
    description: 'Pour les petites boutiques',
    features: [
      'Gestion de stock avancée',
      'Ventes illimitées',
      '3 utilisateurs',
      'Facturation PDF',
      'Rapports mensuels'
    ],
    gradient: 'from-[#3b82f6] to-[#7c3aed]',
    buttonColor: 'bg-[#3b82f6]'
  },
  {
    name: 'STANDARD',
    price: '25\u00A0000',
    recommended: true,
    description: 'Pour les commerces en croissance',
    features: [
      'Multi-boutiques (jusqu\'à 3)',
      'Gestion des fournisseurs',
      'Analytique avancée',
      'Audit de stock complet',
      'Support prioritaire'
    ],
    gradient: 'from-[#1e40af] to-[#7c3aed]',
    buttonColor: 'bg-[#1e40af]'
  },
  {
    name: 'PREMIUM',
    price: '45\u00A0000',
    description: 'La solution complète sans limites',
    features: [
      'Boutiques illimitées',
      'API personnalisée',
      'Gestion multi-devises',
      'Comptabilité automatisée',
      'Account Manager dédié'
    ],
    gradient: 'from-[#7c3aed] to-[#c026d3]',
    buttonColor: 'bg-[#7c3aed]'
  }
];

const Pricing = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-bold text-ink mb-6 tracking-tighter"
          >
            Choisissez le plan adapté <br />
            <span className="text-primary italic">à votre croissance.</span>
          </motion.h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
            Des outils puissants pour gérer votre inventaire, vos ventes et votre comptabilité, quel que soit la taille de votre commerce.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-[2rem] shadow-xl overflow-hidden flex flex-col border ${plan.recommended ? 'border-primary ring-2 ring-primary/20 scale-105 z-10' : 'border-gray-100'}`}
            >
              {/* Header */}
              <div className={`p-8 text-center text-white bg-gradient-to-br ${plan.gradient} relative`}>
                {plan.recommended && (
                  <div className="absolute top-4 right-4 bg-white text-primary text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                    RECOMMANDÉ
                  </div>
                )}
                <h3 className="text-xl font-bold tracking-widest mb-4">{plan.name}</h3>
                <div className="flex items-center justify-center gap-2 flex-nowrap">
                  <span className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter whitespace-nowrap leading-none">
                    {plan.price}
                  </span>
                  <div className="flex flex-col items-start text-left leading-tight shrink-0">
                    <span className="text-lg sm:text-xl font-bold">FCFA</span>
                    <span className="text-xs sm:text-sm font-medium opacity-80">/mois</span>
                  </div>
                </div>
                <p className="text-[10px] opacity-80 mt-4 uppercase tracking-wider">{plan.description}</p>
                
                {/* Triangle Notch */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-inherit rotate-45" style={{ background: 'inherit' }} />
              </div>

              {/* Features */}
              <div className="p-8 flex-grow">
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center space-x-3 text-sm text-gray-600 border-b border-gray-50 pb-3 last:border-0">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center">
                        <Check className="w-3 h-3 text-gray-400" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action */}
              <div className="p-8 pt-0">
                <Link
                  to={user ? "/merchant" : "/login"}
                  className={`w-full py-4 ${plan.buttonColor} text-white rounded-full font-bold text-sm hover:scale-105 transition-transform flex items-center justify-center space-x-2 shadow-lg shadow-black/5`}
                >
                  <span>{user ? "TABLEAU DE BORD" : "S'INSCRIRE"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-gray-400 text-sm">
            Besoin d'une solution sur mesure ? <Link to="/contact" className="text-primary font-bold hover:underline">Contactez notre équipe commerciale</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
