// src/ai-demo/components/DemoCreatorView.tsx
// Form to configure and generate a demo video & documentation via AI or live recording

import React, { useState } from 'react';
import { DemoProject, DemoLanguage } from '../types';
import { DemoManager } from '../services/DemoManager';
import { AiEngine } from '../engines/AiEngine';
import { UIAnalyzer } from '../engines/UIAnalyzer';
import { Sparkles, Play, Video, Globe, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface DemoCreatorViewProps {
  onProjectCreated: (p: DemoProject) => void;
}

export const DemoCreatorView: React.FC<DemoCreatorViewProps> = ({ onProjectCreated }) => {
  const [selectedModule, setSelectedModule] = useState('Gestion Couture');
  const [selectedPage, setSelectedPage] = useState('Clients & Mesures');
  const [demoTitle, setDemoTitle] = useState('');
  const [demoDescription, setDemoDescription] = useState('');
  const [language, setLanguage] = useState<DemoLanguage>('fr');
  const [isGenerating, setIsGenerating] = useState(false);

  const availableModules = [
    { name: 'Gestion Couture', pages: ['Clients & Mesures', 'Commandes & Devis', 'Catalogue Tissus', 'Broderie AEE'] },
    { name: 'Gestion Scolaire', pages: ['Saisie des Notes', 'Cahier de Texte', 'Paiement Scolarité', 'Portail Parent'] },
    { name: 'Gestion RH', pages: ['Fiches de Paye', 'Gestion des Congés', 'Contrats & Présences', 'Recrutement'] },
    { name: 'Gestion Médicale', pages: ['Consultations & Dossiers', 'Ordonnances', 'Rendez-vous', 'Facturation'] },
    { name: 'Gestion Stock', pages: ['Mouvements de Stock', 'Inventaire', 'Fournisseurs', 'Bons de Commande'] },
    { name: 'Gestion Chantier', pages: ['Suivi de Projet', 'Consommation Matériaux', 'Equipes BTP', 'Facturation Chantier'] },
    { name: 'Gestion Transport', pages: ['Flotte de Véhicules', 'Entretien & Pannes', 'Chauffeurs & Trajets', 'Carburant'] },
    { name: 'Gestion Pressing', pages: ['Dépôt & Reçus', 'Pressing Tarifs', 'Livraison Client', 'Clôture Caisse'] }
  ];

  const handleModuleChange = (modName: string) => {
    setSelectedModule(modName);
    const mod = availableModules.find(m => m.name === modName);
    if (mod && mod.pages.length > 0) {
      setSelectedPage(mod.pages[0]);
    }
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('Génération automatique par l\'IA ACOM Demo...');

    try {
      const uiAnalysis = UIAnalyzer.analyzeCurrentUI(selectedModule, selectedPage);

      const aiResult = await AiEngine.synthesizeDemoContent(
        selectedModule,
        selectedPage,
        [], // empty raw events -> trigger auto scenario
        uiAnalysis,
        language
      );

      const newProject = DemoManager.createNewProject(
        selectedModule,
        selectedPage,
        demoTitle || aiResult.title,
        demoDescription || aiResult.description
      );

      newProject.timelineSteps = aiResult.timelineSteps;
      newProject.documentation = aiResult.documentation;

      DemoManager.saveProject(newProject);
      toast.dismiss(toastId);
      toast.success('Démonstration créée avec succès !');
      onProjectCreated(newProject);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('Erreur lors de la génération IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const activePages = availableModules.find(m => m.name === selectedModule)?.pages || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Studio de Création IA</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Créer une nouvelle démonstration</h2>
          <p className="text-xs text-slate-500">
            Sélectionnez un SaaS de la plateforme pour générer automatiquement une vidéo, une voix off et un guide d'utilisation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Module SaaS Cible :</label>
            <select
              value={selectedModule}
              onChange={(e) => handleModuleChange(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableModules.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Page Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Page / Fonctionnalité :</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {activePages.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Custom Title */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Titre personnalisé (Optionnel) :</label>
            <input
              type="text"
              placeholder={`Ex: Démonstration complète ${selectedModule} - ${selectedPage}`}
              value={demoTitle}
              onChange={(e) => setDemoTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Langue de Narration & Doc :</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as DemoLanguage)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="fr">🇫🇷 Français (Studio)</option>
              <option value="en">🇬🇧 English (Global)</option>
              <option value="es">🇪🇸 Español</option>
              <option value="ar">🇸🇦 العربية</option>
              <option value="wo">🇸🇳 Wolof (Dakar)</option>
              <option value="pt">🇵🇹 Português</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Description / Objectif :</label>
            <textarea
              rows={3}
              placeholder="Décrivez l'objectif du tutoriel pour orienter la voix off IA..."
              value={demoDescription}
              onChange={(e) => setDemoDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-xl hover:shadow-indigo-500/30 cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
            <span>Générer automatiquement avec l'IA</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
