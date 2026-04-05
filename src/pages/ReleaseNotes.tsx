import React from 'react';
import { motion } from 'motion/react';
import { 
  Layout, 
  MousePointer2, 
  Palette, 
  Layers, 
  ShoppingCart, 
  Database, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const ReleaseNotes = () => {
  const modules = [
    {
      id: 'design-editor',
      title: 'Éditeur de Design',
      icon: <Layout className="w-8 h-8 text-blue-600" />,
      color: 'bg-blue-50',
      borderColor: 'border-blue-200',
      improvements: [
        {
          title: 'Multi-sélection Intelligente',
          description: 'Sélectionnez plusieurs éléments à la fois par cliquer-glisser sur le canevas.',
          icon: <MousePointer2 className="w-5 h-5 text-blue-500" />
        },
        {
          title: 'Gestion de l\'Arrière-plan',
          description: 'Personnalisez la couleur de fond de vos designs (Recto/Verso) en un clic.',
          icon: <Palette className="w-5 h-5 text-blue-500" />
        },
        {
          title: 'Manipulation de Groupe',
          description: 'Déplacez et redimensionnez des groupes d\'éléments simultanément.',
          icon: <Layers className="w-5 h-5 text-blue-500" />
        }
      ]
    },
    {
      id: 'pos-system',
      title: 'Système de Caisse (POS)',
      icon: <ShoppingCart className="w-8 h-8 text-green-600" />,
      color: 'bg-green-50',
      borderColor: 'border-green-200',
      improvements: [
        {
          title: 'Correction de Types',
          description: 'Résolution des erreurs de compilation liées à l\'intégration Firebase.',
          icon: <Database className="w-5 h-5 text-green-500" />
        },
        {
          title: 'Stabilité Accrue',
          description: 'Optimisation des appels à la base de données pour une meilleure réactivité.',
          icon: <Zap className="w-5 h-5 text-green-500" />
        }
      ]
    },
    {
      id: 'core-infra',
      title: 'Infrastructure & Sécurité',
      icon: <ShieldCheck className="w-8 h-8 text-purple-600" />,
      color: 'bg-purple-50',
      borderColor: 'border-purple-200',
      improvements: [
        {
          title: 'Validation de Schéma',
          description: 'Mise à jour du blueprint Firebase pour une intégrité des données renforcée.',
          icon: <CheckCircle2 className="w-5 h-5 text-purple-500" />
        },
        {
          title: 'Performance UI',
          description: 'Réduction des re-rendus inutiles dans les composants complexes.',
          icon: <Zap className="w-5 h-5 text-purple-500" />
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-gray-900 sm:text-5xl"
          >
            Synthèse des Évolutions
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-xl text-gray-600"
          >
            Aperçu visuel des dernières améliorations apportées à la plateforme Acom Technologie.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection Lines (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2" />
          
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-8 rounded-3xl border-2 ${module.borderColor} ${module.color} shadow-xl hover:shadow-2xl transition-shadow duration-300`}
            >
              <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm mb-6 mx-auto">
                {module.icon}
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
                {module.title}
              </h2>

              <div className="space-y-6">
                {module.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 mt-1">
                      {imp.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{imp.title}</h3>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{imp.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {index < modules.length - 1 && (
                <div className="md:hidden flex justify-center my-8">
                  <ArrowRight className="w-6 h-6 text-gray-300 transform rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm text-center"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Prochaines Étapes</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nous continuons d'optimiser l'expérience utilisateur avec l'ajout prochain de modèles de design pré-remplis et une gestion avancée des stocks pour le module SaaS.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/design-editor'}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Tester l'Éditeur
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Voir le Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ReleaseNotes;
