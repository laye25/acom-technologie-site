// src/ai-demo/pages/AIDemoMainPage.tsx
// Main page container for ACOM AI Demo integrated inside Acom Technologie

import React, { useState, useEffect } from 'react';
import { DemoProject } from '../types';
import { DemoManager } from '../services/DemoManager';
import { DemoDashboardView } from '../components/DemoDashboardView';
import { DemoListView } from '../components/DemoListView';
import { DemoCreatorView } from '../components/DemoCreatorView';
import { DemoHistoryView } from '../components/DemoHistoryView';
import { DemoVoiceView } from '../components/DemoVoiceView';
import { DemoExportView } from '../components/DemoExportView';
import { DemoDocView } from '../components/DemoDocView';
import { DemoSettingsView } from '../components/DemoSettingsView';
import { DemoTemplatesView } from '../components/DemoTemplatesView';
import { DemoPublishView } from '../components/DemoPublishView';
import { DemoPlayerModal } from '../components/DemoPlayerModal';
import { TemplateEngine } from '../templates/TemplateEngine';
import { PlatformControlCenter } from '../components/PlatformControlCenter';
import { ExperienceWorkspace } from '../components/ExperienceWorkspace';
import { ProductPlatformStudio } from '../components/ProductPlatformStudio';
import { SaiEventBus } from '../services/SaiEventBus';
import { 
  Video, LayoutDashboard, List, PlusCircle, History, Mic, Download, 
  BookOpen, Settings, Layers, Share2, Sparkles, ChevronRight, Home, Cpu, Sparkle, Workflow
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export type AIDemoTab = 
  | 'dashboard' 
  | 'product_studio'
  | 'experience'
  | 'platform'
  | 'list' 
  | 'create' 
  | 'history' 
  | 'voice' 
  | 'export' 
  | 'doc' 
  | 'settings' 
  | 'templates' 
  | 'publish';

export const AIDemoMainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AIDemoTab>('dashboard');
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [activeProject, setActiveProject] = useState<DemoProject | null>(null);
  const [searchParams] = useSearchParams();

  const reloadData = () => {
    const list = DemoManager.getAllProjects();
    setProjects(list);
  };

  useEffect(() => {
    reloadData();

    // Check if URL specifies a project to play
    const projId = searchParams.get('project');
    if (projId) {
      const found = DemoManager.getProjectById(projId);
      if (found) {
        setActiveProject(found);
      }
    }

    const unsub = SaiEventBus.subscribe('sai:scenario_updated', (payload?: any) => {
      reloadData();
      if (payload && payload.scenarioId) {
        const found = DemoManager.getProjectById(payload.scenarioId);
        if (found) {
          setActiveProject(found);
        }
      }
    });

    return () => unsub();
  }, [searchParams]);

  const tabs: Array<{ id: AIDemoTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'product_studio', label: 'Plateforme Produit (Workflow & Rôles)', icon: <Workflow className="w-4 h-4 text-amber-500" /> },
    { id: 'experience', label: 'Espace Produit (4 Workspaces)', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    { id: 'platform', label: 'Centre de Contrôle (Pipeline & Tests)', icon: <Cpu className="w-4 h-4 text-amber-500" /> },
    { id: 'list', label: 'Mes démonstrations', icon: <List className="w-4 h-4" /> },
    { id: 'create', label: 'Créer une démonstration', icon: <PlusCircle className="w-4 h-4" /> },
    { id: 'history', label: 'Historique', icon: <History className="w-4 h-4" /> },
    { id: 'voice', label: 'Voix', icon: <Mic className="w-4 h-4" /> },
    { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
    { id: 'doc', label: 'Documentation', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'settings', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <Layers className="w-4 h-4" /> },
    { id: 'publish', label: 'Publication', icon: <Share2 className="w-4 h-4" /> }
  ];

  const handleSelectTemplate = (templateId: string) => {
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Administration</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-indigo-600 font-bold">ACOM AI Demo</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">ACOM AI Demo</h1>
              <p className="text-xs text-slate-500 font-medium">Génération automatique de démonstrations, tutoriels, voix off & documentation IA</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg hover:shadow-indigo-500/25 cursor-pointer transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Nouveau Tutoriel</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Header */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab View Container */}
      <div className="pt-2">
        {activeTab === 'dashboard' && (
          <DemoDashboardView
            projects={projects}
            onSelectProject={(p) => setActiveProject(p)}
            onCreateNew={() => setActiveTab('create')}
          />
        )}

        {activeTab === 'product_studio' && <ProductPlatformStudio />}

        {activeTab === 'experience' && <ExperienceWorkspace />}

        {activeTab === 'platform' && <PlatformControlCenter />}

        {activeTab === 'list' && (
          <DemoListView
            projects={projects}
            onSelectProject={(p) => setActiveProject(p)}
            onRefresh={reloadData}
          />
        )}

        {activeTab === 'create' && (
          <DemoCreatorView
            onProjectCreated={(p) => {
              reloadData();
              setActiveProject(p);
            }}
          />
        )}

        {activeTab === 'history' && (
          <DemoHistoryView
            projects={projects}
            onSelectProject={(p) => setActiveProject(p)}
          />
        )}

        {activeTab === 'voice' && <DemoVoiceView />}

        {activeTab === 'export' && <DemoExportView projects={projects} />}

        {activeTab === 'doc' && <DemoDocView projects={projects} />}

        {activeTab === 'settings' && <DemoSettingsView />}

        {activeTab === 'templates' && (
          <DemoTemplatesView onSelectTemplate={handleSelectTemplate} />
        )}

        {activeTab === 'publish' && <DemoPublishView projects={projects} />}
      </div>

      {/* Interactive Player Modal */}
      {activeProject && (
        <DemoPlayerModal
          project={activeProject}
          onClose={() => setActiveProject(null)}
        />
      )}
    </div>
  );
};

export default AIDemoMainPage;
