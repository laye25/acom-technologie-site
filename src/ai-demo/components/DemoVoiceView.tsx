// src/ai-demo/components/DemoVoiceView.tsx
// Voice management view allowing voice testing, intonation, rate, and multilingual preview

import React, { useState } from 'react';
import { VoiceEngine } from '../voice/VoiceEngine';
import { VoiceConfig, DemoLanguage } from '../types';
import { Mic, Volume2, Play, Square, Sparkles, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export const DemoVoiceView: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<DemoLanguage>('fr');
  const voices = VoiceEngine.getAvailableVoices(selectedLang);
  const [activeVoice, setActiveVoice] = useState<VoiceConfig>(voices[0] || VoiceEngine.getAvailableVoices()[0]);
  const [sampleText, setSampleText] = useState('Bienvenue sur Acom Technologie. Nous allons découvrir comment utiliser l\'application.');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTestVoice = () => {
    setIsPlaying(true);
    VoiceEngine.speakText(sampleText, activeVoice, () => {
      setIsPlaying(false);
    });
    toast.success(`Test de la voix : ${activeVoice.voiceName}`);
  };

  const handleStopVoice = () => {
    VoiceEngine.stopSpeech();
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
        <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Moteur de Voix Off & Narration IA</h2>
          <p className="text-xs text-slate-500">Configurez la voix, le débit, l'intonation et les langues de synthèse vocale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Voices List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-violet-600" />
            <span>Sélectionner la Langue :</span>
          </label>
          <select
            value={selectedLang}
            onChange={(e) => {
              const l = e.target.value as DemoLanguage;
              setSelectedLang(l);
              const available = VoiceEngine.getAvailableVoices(l);
              if (available[0]) setActiveVoice(available[0]);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="ar">🇸🇦 العربية</option>
            <option value="wo">🇸🇳 Wolof</option>
            <option value="pt">🇵🇹 Português</option>
          </select>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Voix Disponibles :</span>
            {voices.map((v) => (
              <div
                key={v.voiceId}
                onClick={() => setActiveVoice(v)}
                className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${v.voiceId === activeVoice.voiceId ? 'bg-violet-50 border-violet-500 font-bold text-violet-900 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span>{v.voiceName}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 bg-violet-100 text-violet-700 rounded font-bold">
                    {v.gender}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Fournisseur : {v.provider}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Parameters & Audio Playground */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">
            Paramètres & Test audio en direct
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase">Texte d'essai :</label>
              <textarea
                rows={3}
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Vitesse de diction (Rate) :</span>
                  <span>{activeVoice.rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={activeVoice.rate}
                  onChange={(e) => setActiveVoice({ ...activeVoice, rate: parseFloat(e.target.value) })}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Intonation (Pitch) :</span>
                  <span>{activeVoice.pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={activeVoice.pitch}
                  onChange={(e) => setActiveVoice({ ...activeVoice, pitch: parseFloat(e.target.value) })}
                  className="w-full accent-violet-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              {!isPlaying ? (
                <button
                  onClick={handleTestVoice}
                  className="px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Tester la voix en direct</span>
                </button>
              ) : (
                <button
                  onClick={handleStopVoice}
                  className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Arrêter l'écoute</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
