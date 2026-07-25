// src/ai-demo/components/DemoSettingsView.tsx
// Configuration settings view for ACOM AI Demo (Branding, Voice defaults, Resolution, Privacy)

import React, { useState } from 'react';
import { Settings, Shield, Palette, Volume2, Video, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export const DemoSettingsView: React.FC = () => {
  const [appName, setAppName] = useState('Acom Technologie');
  const [author, setAuthor] = useState('Équipe Acom Technologie');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [autoMaskPasswords, setAutoMaskPasswords] = useState(true);
  const [autoBlurBanking, setAutoBlurBanking] = useState(true);
  const [defaultResolution, setDefaultResolution] = useState('1080p');
  const [defaultFps, setDefaultFps] = useState('30');

  const handleSave = () => {
    toast.success('Paramètres ACOM AI Demo sauvegardés !');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Paramètres Généraux ACOM AI Demo</h2>
          <p className="text-xs text-slate-500">Personnalisez le branding, la sécurité, la résolution et les filtres de confidentialité</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Branding */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>Branding & Identité Visuelle</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Nom de l'application / Plateforme :</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Auteur par défaut :</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Couleur Thème Principale :</label>
              <div className="flex items-center gap-3 mt-1.5">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border-0"
                />
                <span className="font-mono text-xs text-slate-600 font-bold">{primaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confidentiality & Security */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Confidentialité & Masquage Automatique (RGPD)</span>
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoMaskPasswords}
                onChange={(e) => setAutoMaskPasswords(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Masquer automatiquement les mots de passe et clés secrètes lors de la saisie</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoBlurBanking}
                onChange={(e) => setAutoBlurBanking(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Flouter les numéros de cartes bancaires, IBAN et dossiers médicaux</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les paramètres</span>
          </button>
        </div>
      </div>
    </div>
  );
};
