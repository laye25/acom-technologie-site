// src/ai-demo/components/ExperienceWorkspace.tsx
/**
 * ExperienceWorkspace Component
 * Complete Product Experience Layer structured around the 4 core workspaces:
 * 1. Capture Workspace (Live Event Recorder & Snapshot Stream)
 * 2. Inspect Workspace (Hierarchical SAI Inspector & Node Explorer)
 * 3. Edit Workspace (Pedagogical Content Editor & Overlay Tuning)
 * 4. Publish Workspace (Multi-channel Publishing Hub & Approval Workflow)
 * + Central Library & Course Project Manager
 */

import React, { useState } from 'react';
import { ScenarioApplicationIntelligent, SaiTimelineStep } from '../types/sai';
import { GOLDEN_PRESSING_SCENARIO } from '../integration-tests/pressing-demo/PressingScenario';
import { DomainProfileRegistry, AcomDomainId } from '../services/DomainProfiles';
import { ProjectManager, DemoCourseProject } from '../services/ProjectManager';
import { SaaSPageRecognizer } from '../services/SaaSPageRecognizer';
import {
  Video,
  Search,
  Edit3,
  Send,
  Library,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Eye,
  ZoomIn,
  Mic,
  FileText,
  Lock,
  MessageSquare,
  Globe,
  Share2,
  Download,
  ShieldCheck,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export const ExperienceWorkspace: React.FC = () => {
  const [activeWorkspace, setActiveWorkspace] = useState<'capture' | 'inspect' | 'edit' | 'publish' | 'library'>('edit');
  const [scenario, setScenario] = useState<ScenarioApplicationIntelligent>(GOLDEN_PRESSING_SCENARIO);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number>(0);
  const [selectedDomain, setSelectedDomain] = useState<AcomDomainId>('pressing');
  const [courses, setCourses] = useState<DemoCourseProject[]>([
    ProjectManager.createCourse({
      title: 'Parcours Complet Réception & Caisse Pressing',
      description: 'Formation initiale pour les nouveaux agents d\'accueil en atelier pressing.',
      domainId: 'pressing',
      author: 'Acom Training Team',
      targetAudience: 'Employés de caisse & Chefs d\'atelier',
      scenarios: [GOLDEN_PRESSING_SCENARIO]
    })
  ]);

  const activeStep = scenario.timeline[selectedStepIndex] || scenario.timeline[0];
  const activeProfile = DomainProfileRegistry.getProfile(selectedDomain);

  const handleUpdateStep = (updates: Partial<SaiTimelineStep>) => {
    const newTimeline = [...scenario.timeline];
    newTimeline[selectedStepIndex] = {
      ...newTimeline[selectedStepIndex],
      ...updates
    };
    setScenario({ ...scenario, timeline: newTimeline });
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Experience Layer v1.0
            </span>
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              Domaine: {activeProfile.name}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Espace Produit Utilisateur
          </h1>
          <p className="text-slate-400 text-sm">
            Création, inspection, édition pédagogique et publication multi-canal.
          </p>
        </div>

        {/* Domain Profile Selector & Live Dynamic DOM Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const liveScen = SaaSPageRecognizer.generateLiveScenario(activeProfile.name, 'Réception & Dépôt');
              setScenario(liveScen);
              setSelectedStepIndex(0);
            }}
            className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Passer en Mode Live DOM (Dynamique)</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 px-2 font-medium">Profil Métier:</span>
            {DomainProfileRegistry.getAllProfiles().map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedDomain(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDomain === p.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveWorkspace('capture')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeWorkspace === 'capture'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Video className="h-4 w-4" />
          1. Capture Workspace
        </button>

        <button
          onClick={() => setActiveWorkspace('inspect')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeWorkspace === 'inspect'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Search className="h-4 w-4" />
          2. Inspect Workspace
        </button>

        <button
          onClick={() => setActiveWorkspace('edit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeWorkspace === 'edit'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Edit3 className="h-4 w-4" />
          3. Edit Workspace
        </button>

        <button
          onClick={() => setActiveWorkspace('publish')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeWorkspace === 'publish'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Send className="h-4 w-4" />
          4. Publish Workspace
        </button>

        <button
          onClick={() => setActiveWorkspace('library')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeWorkspace === 'library'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Library className="h-4 w-4" />
          Bibliothèque & Parcours
        </button>
      </div>

      {/* WORKSPACE 1: CAPTURE WORKSPACE */}
      {activeWorkspace === 'capture' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3.5 w-3.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-sm font-bold text-slate-100">Poste Enregistreur Live - Signal Capté</h2>
              </div>
              <span className="font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded border border-slate-800">
                Qualité du signal: 100% (60 FPS)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">Événements en cours</span>
                <div className="text-xl font-bold text-blue-400">{scenario.events.length}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">Snapshots visuels</span>
                <div className="text-xl font-bold text-emerald-400">{scenario.snapshots.length}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-slate-500">Horodatage continu</span>
                <div className="text-xl font-bold text-purple-400">00:09.200</div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Flux d'événements capturés en direct :</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                {scenario.events.map((evt) => (
                  <div key={evt.id} className="flex items-center justify-between p-2 rounded bg-slate-900 text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-rose-400 font-bold">[{evt.type}]</span>
                      <span>{evt.action}</span>
                    </div>
                    <span className="text-slate-500">{evt.timestamp}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 2: INSPECT WORKSPACE */}
      {activeWorkspace === 'inspect' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Search className="h-4 w-4 text-blue-400" />
              Navigateur Hiérarchique de Scénario (SAI Inspector)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left Column: Tree */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-2">
                  Arborescence Scénario {scenario.id}
                </div>
                {scenario.timeline.map((step, idx) => (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-between ${
                      selectedStepIndex === idx
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>Étape {step.stepNumber}: {step.title}</span>
                    <span className="text-[10px] opacity-80">{step.durationSec}s</span>
                  </div>
                ))}
              </div>

              {/* Right Column: Node Metadata */}
              <div className="md:col-span-2 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-blue-400 font-mono">Détails du Nœud Sélectionné</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Titre de l'étape:</span>
                    <span className="text-slate-100 font-semibold">{activeStep.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Type d'action:</span>
                    <span className="text-emerald-400 font-mono font-bold">{activeStep.actionType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Niveau de Zoom:</span>
                    <span className="text-purple-400 font-mono">{activeStep.zoomLevel}x</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Effet Overlay:</span>
                    <span className="text-amber-400 font-mono">{activeStep.effectOverlay}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">Texte de Narration Voix-Off:</span>
                  <div className="bg-slate-900 p-2.5 rounded text-xs text-slate-300 italic">
                    "{activeStep.narrationText}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 3: EDIT WORKSPACE */}
      {activeWorkspace === 'edit' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-emerald-400" />
                Éditeur Pédagogique du Scénario
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                Modification sans impact sur le SAI brut
              </span>
            </div>

            {/* Step Selection Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {scenario.timeline.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedStepIndex === idx
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Étape {step.stepNumber}: {step.title}
                </button>
              ))}
            </div>

            {/* Form Fields for Active Step */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Titre de l'étape</label>
                <input
                  type="text"
                  value={activeStep.title}
                  onChange={(e) => handleUpdateStep({ title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Intention / Objectif Métier</label>
                <input
                  type="text"
                  value={activeStep.intent}
                  onChange={(e) => handleUpdateStep({ intent: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-400 font-bold block">Texte Narration Synthèse Vocale</label>
                <textarea
                  rows={2}
                  value={activeStep.narrationText}
                  onChange={(e) => handleUpdateStep({ narrationText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Conseil Pro ({activeProfile.name})</label>
                <input
                  type="text"
                  value={activeStep.proAdvice || ''}
                  onChange={(e) => handleUpdateStep({ proAdvice: e.target.value })}
                  placeholder={activeProfile.pedagogicalRules.mandatoryProTips[0]}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Astuce Gain de Temps</label>
                <input
                  type="text"
                  value={activeStep.timeSavingTip || ''}
                  onChange={(e) => handleUpdateStep({ timeSavingTip: e.target.value })}
                  placeholder="Ex: Utiliser le raccourci F2 pour aller plus vite"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Niveau Zoom Cible</label>
                <select
                  value={activeStep.zoomLevel}
                  onChange={(e) => handleUpdateStep({ zoomLevel: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={1.0}>1.0x (Normal / Vue d'ensemble)</option>
                  <option value={1.25}>1.25x (Focus modéré)</option>
                  <option value={1.5}>1.5x (Focus fort)</option>
                  <option value={1.8}>1.8x (Macro / Précision)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold block">Halo / Overlay Visuel</label>
                <select
                  value={activeStep.effectOverlay}
                  onChange={(e) => handleUpdateStep({ effectOverlay: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="none">Aucun overlay</option>
                  <option value="green_halo">Halo Vert (Validation)</option>
                  <option value="red_halo">Halo Rouge (Alerte / Attention)</option>
                  <option value="arrow_pointer">Flèche Cible</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 4: PUBLISH WORKSPACE */}
      {activeWorkspace === 'publish' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-400" />
              Interface de Publication & Distribution Multi-Canal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-purple-400">Bibliothèque Acom</span>
                <p className="text-xs text-slate-400">
                  Rendre le tutoriel accessible dans le catalogue central de tous les modules {activeProfile.name}.
                </p>
                <button className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                  Publier dans le Catalogue
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-blue-400">Portail de Formation</span>
                <p className="text-xs text-slate-400">
                  Associer ce scénario à un parcours d'intégration de nouveaux collaborateurs.
                </p>
                <button className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                  Associer au Parcours
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400">Espace Documentaire (PDF/HTML)</span>
                <p className="text-xs text-slate-400">
                  Générer et exporter le manuel au format web réactif ou guide imprimable.
                </p>
                <button className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                  Exporter la Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKSPACE 5: LIBRARY & COURSE PROJECT MANAGER */}
      {activeWorkspace === 'library' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Library className="h-4 w-4 text-amber-400" />
                  Bibliothèque Centrale & Parcours de Formation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gestionnaires de projets de formation (Projet &rarr; Chapitres &rarr; Scénarios).
                </p>
              </div>
              <button
                onClick={() => {
                  const newProj = ProjectManager.createCourse({
                    title: `Nouveau Parcours ${activeProfile.name}`,
                    description: 'Parcours de formation métier personnalisé.',
                    domainId: selectedDomain,
                    author: 'Chef de Projet',
                    targetAudience: 'Utilisateurs du module',
                    scenarios: [scenario]
                  });
                  setCourses([...courses, newProj]);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="h-4 w-4" />
                Créer un Nouveau Parcours
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                        {course.domainId} • {course.totalDurationMin} min
                      </span>
                      <h3 className="text-sm font-bold text-slate-100 mt-0.5">{course.title}</h3>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                      {course.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{course.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-xs font-bold text-slate-300 block">Chapitres du Parcours :</span>
                    {course.chapters.map((chap) => (
                      <div key={chap.id} className="flex items-center justify-between p-2 rounded bg-slate-900 text-xs font-mono">
                        <span>Chapitre {chap.chapterNumber}: {chap.title}</span>
                        <span className="text-slate-500">{chap.estimatedDurationMin} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
