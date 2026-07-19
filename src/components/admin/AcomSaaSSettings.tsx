import React, { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { Save, Plus, Trash2, Image as ImageIcon, Layout, Type, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OptimizedImage } from '../OptimizedImage';
import toast from 'react-hot-toast';
import { SaaSPageContent, SaaSSolutionContent } from '../../types';

export const AcomSaaSSettings = () => {
  const [settings, setSettings] = useState<SaaSPageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultSettings: SaaSPageContent = {
    bannerImage: "https://picsum.photos/seed/saas-banner/1920/1080",
    heroTitle1: "Pilotez votre entreprise",
    heroTitle2: "en toute simplicité.",
    heroDescription: "Une gamme de solutions SaaS dédiées pour optimiser chaque domaine de votre activité. Pensées pour les entrepreneurs ambitieux, ces solutions vous accompagnent dans votre croissance au quotidien.",
    solutions: [
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
      },
      {
        title: "Gestion de pressing (Pressings / Vente)",
        description: "Gérez vos commandes, le cycle de nettoyage et boostez vos ventes de produits additionnels.",
        iconName: "WashingMachine",
        color: "bg-cyan-500",
        image: "https://picsum.photos/seed/laundry/800/600",
        link: "/merchant/saas?type=pressing"
      },
      {
        title: "Gestion d'ateliers de couture (professionnels de la mode)",
        description: "Gérez l'ensemble des activités de votre atelier de couture ou maison de mode : mesures, commandes sur mesure, prêt-à-porter et suivi en temps réel.",
        iconName: "Scissors",
        color: "bg-pink-500",
        image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=800&h=600",
        link: "/merchant/saas?type=tailleur"
      },
      {
        title: "Acom Creative Studio",
        description: "Plateforme intelligente de conception et de production textile : numérisation de motifs par IA, génération automatique de points (Tatami, Satin, Zigzag), compilation machines et simulation physique réaliste.",
        iconName: "Cpu",
        color: "bg-violet-600",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800&h=600",
        link: "/merchant/saas?type=broderie"
      }
    ]
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // @ts-ignore
      const data = await dbService.settings.get('default');
      if (data && data.saasContent) {
        let content = { ...data.saasContent };
        if (content.solutions) {
          const hasTailleur = content.solutions.some((s: any) => s.link && s.link.includes('type=tailleur'));
          if (!hasTailleur) {
            const tailleurSol = defaultSettings.solutions.find((s: any) => s.link && s.link.includes('type=tailleur'));
            if (tailleurSol) {
              content.solutions = [...content.solutions, tailleurSol];
            }
          }
           const hasBroderie = content.solutions.some((s: any) => s.link && s.link.includes('type=broderie'));
          if (!hasBroderie) {
            const broderieSol = defaultSettings.solutions.find((s: any) => s.link && s.link.includes('type=broderie'));
            if (broderieSol) {
              content.solutions = [...content.solutions, broderieSol];
            }
          }
          // Map solutions to auto-update type=broderie name/description/signature
          content.solutions = content.solutions.map((s: any) => {
            if (s.link && s.link.includes('type=broderie')) {
              return {
                ...s,
                title: "Acom Creative Studio",
                description: "Plateforme intelligente de conception et de production textile : numérisation de motifs par IA, génération automatique de points (Tatami, Satin, Zigzag), compilation machines et simulation physique réaliste."
              };
            }
            return s;
          });
        }
        setSettings(content);
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Erreur lors du chargement de la configuration.');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      // @ts-ignore
      const currentSettings = await dbService.settings.get('default') || {};
      
      // @ts-ignore
      await dbService.settings.save('default', {
        ...currentSettings,
        saasContent: settings
      });
      toast.success('Configuration sauvegardée avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addSolution = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      solutions: [
        ...settings.solutions,
        {
          title: "Nouvelle Solution",
          description: "Description de la solution",
          iconName: "Package",
          color: "bg-blue-500",
          image: "https://picsum.photos/seed/new/800/600",
          link: "/merchant/saas?type=nouveau"
        }
      ]
    });
  };

  const updateSolution = (index: number, field: string, value: string) => {
    if (!settings) return;
    const newSolutions = [...settings.solutions];
    (newSolutions[index] as any)[field] = value;
    setSettings({ ...settings, solutions: newSolutions });
  };

  const removeSolution = (index: number) => {
    if (!settings) return;
    const newSolutions = settings.solutions.filter((_, i) => i !== index);
    setSettings({ ...settings, solutions: newSolutions });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div>
          <h3 className="font-bold text-gray-900">Apparence SaaS</h3>
          <p className="text-sm text-gray-500">Configurez l'aspect de la page des solutions SaaS</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center"
        >
          {saving ? <div className="mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Enregistrer les modifications
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <h4 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Bannière Principale</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Image de couverture (Bannière)</label>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-full md:w-1/3 aspect-[21/9] rounded-xl overflow-hidden bg-gray-100 relative shrink-0">
                <OptimizedImage
                  src={settings.bannerImage}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={settings.bannerImage}
                    onChange={(e) => setSettings({ ...settings, bannerImage: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="URL de l'image (unsplash, imgur, etc.)"
                  />
                </div>
                <p className="text-xs text-gray-500">Utilisez une image au format paysage (1920x1080 recommandé) pour un rendu optimal de la bannière.</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Titre Principal (Partie 1)</label>
              <input
                type="text"
                value={settings.heroTitle1}
                onChange={(e) => setSettings({ ...settings, heroTitle1: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Titre Principal (Partie 2)</label>
              <input
                type="text"
                value={settings.heroTitle2}
                onChange={(e) => setSettings({ ...settings, heroTitle2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Sous-titre / Description de la bannière</label>
              <textarea
                value={settings.heroDescription}
                onChange={(e) => setSettings({ ...settings, heroDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-primary min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h4 className="text-lg font-bold text-gray-900">Cartes des Services Proposés</h4>
          <button
            onClick={addSolution}
            className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un service
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {settings.solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                className="p-5 border border-gray-200 rounded-xl bg-gray-50 relative group"
              >
                <button
                  onClick={() => removeSolution(index)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Supprimer ce service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4 flex flex-col gap-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Image de couverture</label>
                    <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-200 relative">
                       <OptimizedImage
                         src={solution.image}
                         alt={solution.title}
                         className="w-full h-full object-cover"
                       />
                    </div>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={solution.image}
                        onChange={(e) => updateSolution(index, 'image', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="URL de l'image"
                      />
                    </div>
                  </div>
                  
                  <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Titre du service</label>
                       <input
                        type="text"
                        value={solution.title}
                        onChange={(e) => updateSolution(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary font-bold"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Description courte</label>
                       <textarea
                        value={solution.description}
                        onChange={(e) => updateSolution(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary min-h-[60px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
                        <Type className="w-3 h-3 mr-1" /> Icône (Nom Lucide)
                      </label>
                       <input
                        type="text"
                        value={solution.iconName}
                        onChange={(e) => updateSolution(index, 'iconName', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="Package, Settings, Truck..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center">
                        <Palette className="w-3 h-3 mr-1" /> Couleur du badge (Classe Tailwind)
                      </label>
                       <input
                        type="text"
                        value={solution.color}
                        onChange={(e) => updateSolution(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                        placeholder="bg-blue-500, bg-red-500..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
