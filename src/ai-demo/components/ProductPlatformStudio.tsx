// src/ai-demo/components/ProductPlatformStudio.tsx
/**
 * ProductPlatformStudio - Version 2.0 Product Operations Hub
 * Integrates the frozen engine architecture with user-centric product capabilities:
 * 1. Business Lifecycle Workflow Engine (Draft -> Review -> Approved -> Published -> Archived)
 * 2. Role-Based Access & Governance (Author, Reviewer, Trainer, Admin)
 * 3. Reusable Knowledge Library (Objectives, Pro Tips, FAQs, Quiz)
 * 4. Live Interactive Guidance Engine
 * 5. Unified SAI Public API Playground
 * 6. Transverse Usage Hub (Docs, Training, AI Assistance)
 */

import React, { useState } from 'react';
import { ScenarioApplicationIntelligent } from '../types/sai';
import { GOLDEN_PRESSING_SCENARIO } from '../integration-tests/pressing-demo/PressingScenario';
import { WorkflowEngine, SaiWorkflowStatus } from '../services/WorkflowEngine';
import { UserRoleManager, UserRole, UserProfile } from '../services/UserRoleManager';
import { KnowledgeLibrary, KnowledgeItem, KnowledgeCategory } from '../services/KnowledgeLibrary';
import { LiveGuidanceEngine, GuidanceSessionState } from '../services/LiveGuidanceEngine';
import { SaiPublicApi, SaiValidationResult, SaiComparisonDelta } from '../services/SaiPublicApi';
import { ArchitectureBaselineRegistry, ArchitectureComponent, ArchitectureDecisionRecord } from '../services/ArchitectureBaseline';
import { KnowledgeRepositoryEngine, UnifiedKnowledgeItem } from '../services/KnowledgeRepository';
import { KnowledgeAnalyticsEngine, ScenarioKnowledgeAnalytics } from '../services/KnowledgeAnalyticsEngine';
import { PlatformKpiEngine, FunctionalKpiMetric } from '../services/PlatformKpis';
import { I18nEngine, SupportedLanguage } from '../services/I18nEngine';
import { DomainProfileRegistry } from '../services/DomainProfiles';
import {
  Workflow,
  ShieldCheck,
  BookOpen,
  Compass,
  Code2,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Send,
  PlusCircle,
  Search,
  Play,
  RotateCcw,
  Copy,
  GitCompare,
  GraduationCap,
  HelpCircle,
  Lock,
  Layers,
  Server,
  GitCommit,
  Milestone,
  Box,
  Cpu,
  Database,
  Globe,
  BarChart3,
  Rocket,
  History,
  Check
} from 'lucide-react';

export const ProductPlatformStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'roles' | 'knowledge' | 'guidance' | 'api' | 'usage' | 'architecture' | 'repository'>('workflow');
  const [scenario, setScenario] = useState<ScenarioApplicationIntelligent>(GOLDEN_PRESSING_SCENARIO);

  // Multilingual state
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('fr');

  // Pilot Execution simulator state
  const [pilotStatus, setPilotStatus] = useState<'IDLE' | 'CAPTURING' | 'VALIDATING' | 'PUBLISHED'>('IDLE');

  // Workflow state
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('TRAINER');
  const [currentActor, setCurrentActor] = useState<string>('Abdoulaye Ndiaye');
  const [transitionComment, setTransitionComment] = useState<string>('');

  // Knowledge Library state
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'ALL'>('ALL');

  // Live Guidance Engine state
  const [guidanceEngine] = useState(() => new LiveGuidanceEngine());
  const [guidanceState, setGuidanceState] = useState<GuidanceSessionState | null>(null);

  // API Playground state
  const [apiLog, setApiLog] = useState<string[]>([]);
  const [comparisonDelta, setComparisonDelta] = useState<SaiComparisonDelta | null>(null);
  const [validationResult, setValidationResult] = useState<SaiValidationResult | null>(null);

  const permissions = UserRoleManager.getPermissions(currentUserRole);
  const currentStatus: SaiWorkflowStatus = (scenario.metadata.reviewStatus as SaiWorkflowStatus) || 'DRAFT';
  const allowedTransitions = WorkflowEngine.getAllowedTransitions(currentStatus);

  const logApi = (msg: string) => {
    setApiLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const handleTransition = (targetStatus: SaiWorkflowStatus) => {
    const res = WorkflowEngine.transitionScenario(
      scenario,
      targetStatus,
      currentActor,
      currentUserRole,
      transitionComment || `Passage de statut vers ${targetStatus}`
    );

    if (res.success) {
      setScenario(res.scenario);
      setTransitionComment('');
      logApi(`Succès Transition Workflow: -> ${targetStatus}`);
    } else {
      logApi(`Échec Transition: ${res.message}`);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Product Operations Hub v2.0
            </span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Architecture Gelée • Mode Produit Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            ACOM AI Demo — Product Operations Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Gestion des cycles de vie, rôles, bibliothèque sémantique, guidance en direct et contrat API public.
          </p>
        </div>

        {/* User Role Quick Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-medium flex items-center gap-1">
            <UserCheck className="h-3.5 w-3.5 text-blue-400" />
            Rôle Actif:
          </span>
          {(['AUTHOR', 'REVIEWER', 'TRAINER', 'ADMIN'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => {
                setCurrentUserRole(r);
                logApi(`Changement de rôle utilisateur vers ${r}`);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUserRole === r
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {UserRoleManager.getRoleLabel(r).split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('workflow')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'workflow'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Workflow className="h-4 w-4" />
          1. Business Workflow Engine
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'roles'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          2. Rôles & Gouvernance
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'knowledge'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          3. Knowledge Library
        </button>

        <button
          onClick={() => setActiveTab('guidance')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'guidance'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Compass className="h-4 w-4" />
          4. Live Guidance
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'api'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Code2 className="h-4 w-4" />
          5. Public SAI API
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'usage'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="h-4 w-4" />
          6. Usage Hub Transverse
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'architecture'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
          }`}
        >
          <Server className="h-4 w-4" />
          7. Baseline v2.0 & Gouvernance
        </button>

        <button
          onClick={() => setActiveTab('repository')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'repository'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
          }`}
        >
          <Database className="h-4 w-4" />
          8. Knowledge Repository & Pilote Pressing
        </button>
      </div>

      {/* TAB 1: WORKFLOW ENGINE */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-amber-400" />
                  Moteur de Workflow Métier & Approbation
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cycle de vie : Brouillon &rarr; Révision &rarr; Validé &rarr; Publié &rarr; Archivé
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Statut Actuel:</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {currentStatus}
                </span>
              </div>
            </div>

            {/* Lifecycle Visual Stepper */}
            <div className="grid grid-cols-5 gap-2 pt-2">
              {(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as SaiWorkflowStatus[]).map((st) => (
                <div
                  key={st}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    currentStatus === st
                      ? 'bg-amber-600/20 border-amber-500 text-white font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-mono block uppercase">{st}</span>
                  <span className="text-xs font-bold">
                    {st === 'DRAFT' && 'Brouillon'}
                    {st === 'REVIEW' && 'Révision'}
                    {st === 'APPROVED' && 'Validé'}
                    {st === 'PUBLISHED' && 'Publié'}
                    {st === 'ARCHIVED' && 'Archivé'}
                  </span>
                </div>
              ))}
            </div>

            {/* Transition Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 block">Transitions Autorisées pour votre rôle ({currentUserRole}):</span>
              <div className="flex flex-wrap items-center gap-3">
                {allowedTransitions.map((target) => (
                  <button
                    key={target}
                    onClick={() => handleTransition(target)}
                    disabled={
                      (target === 'APPROVED' && !permissions.canApproveScenario) ||
                      (target === 'PUBLISHED' && !permissions.canPublishScenario)
                    }
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 transition-all shadow"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Passer à {target}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Ajouter un commentaire de révision/validation..."
                  value={transitionComment}
                  onChange={(e) => setTransitionComment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Audit Logs */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 block">Historique d'Audibilité du Workflow :</span>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-1.5 font-mono text-xs">
                {(scenario.extensions?.workflowAuditLogs || []).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded bg-slate-900 text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">[{log.actorRole}] {log.actor}</span>
                      <span>{log.fromStatus} &rarr; {log.toStatus}</span>
                      {log.comment && <span className="text-slate-400 italic">("{log.comment}")</span>}
                    </div>
                    <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                {(!scenario.extensions?.workflowAuditLogs || scenario.extensions.workflowAuditLogs.length === 0) && (
                  <p className="text-slate-500 italic">Aucune transition enregistrée dans l'audit log pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & GOVERNANCE */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              Matrice des Rôles & Permissions Plateforme
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-blue-400 font-mono">Profil Utilisateur Connecté</span>
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 block">Nom: <strong className="text-white">{currentActor}</strong></span>
                  <span className="text-slate-400 block">Rôle: <strong className="text-amber-400">{UserRoleManager.getRoleLabel(currentUserRole)}</strong></span>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Capacités Accordées :</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className={`p-2 rounded ${permissions.canCapture ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                      Capture Live: {permissions.canCapture ? 'OUI' : 'NON'}
                    </div>
                    <div className={`p-2 rounded ${permissions.canEditScenario ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                      Édition SAI: {permissions.canEditScenario ? 'OUI' : 'NON'}
                    </div>
                    <div className={`p-2 rounded ${permissions.canApproveScenario ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                      Approbation: {permissions.canApproveScenario ? 'OUI' : 'NON'}
                    </div>
                    <div className={`p-2 rounded ${permissions.canPublishScenario ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                      Publication: {permissions.canPublishScenario ? 'OUI' : 'NON'}
                    </div>
                    <div className={`p-2 rounded ${permissions.canManageCourses ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                      Parcours: {permissions.canManageCourses ? 'OUI' : 'NON'}
                    </div>
                    <div className={`p-2 rounded ${permissions.canManagePlugins ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-600'}`}>
                      Plugins & SDK: {permissions.canManagePlugins ? 'OUI' : 'NON'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Utilisateurs Enregistrés dans le Domaine</span>
                <div className="space-y-2">
                  {UserRoleManager.getDefaultUsers().map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setCurrentActor(u.name);
                        setCurrentUserRole(u.role);
                        logApi(`Changement d'utilisateur actif: ${u.name}`);
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                        currentActor === u.name
                          ? 'bg-blue-600/20 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold block">{u.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{u.email}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE LIBRARY */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-purple-400" />
                  Bibliothèque de Composants Pédagogiques Réutilisables
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Knowledge Engine : Réutilisation prioritaire des objectifs, conseils, astuces et FAQ.
                </p>
              </div>

              <button
                onClick={() => {
                  KnowledgeLibrary.addKnowledgeItem({
                    category: 'PRO_TIP',
                    domainId: 'pressing',
                    title: 'Vérification Puce Thermique',
                    content: 'Assurez-vous que l\'imprimante thermique soit alimentée avant d\'éditer le reçu.',
                    tags: ['imprimante', 'thermique']
                  });
                  logApi('Nouvel élément pédagogique ajouté à la Knowledge Library');
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="h-4 w-4" />
                Ajouter un Élément
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher dans la banque de connaissances..."
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="ALL">Toutes Catégories</option>
                <option value="OBJECTIVE">Objectifs</option>
                <option value="PRO_TIP">Conseils Pro</option>
                <option value="TIME_SAVING_TIP">Astuces Gain de Temps</option>
                <option value="FAQ_ITEM">FAQ Cards</option>
                <option value="QUIZ_ITEM">Questions Quiz</option>
              </select>
            </div>

            {/* Grid of Knowledge Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KnowledgeLibrary.searchKnowledge(knowledgeSearch, 'pressing')
                .filter((item) => selectedCategory === 'ALL' || item.category === selectedCategory)
                .map((item) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">Utilisé {item.usageCount} fois</span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-100">{item.title}</h3>
                    <p className="text-xs text-slate-400">{item.content}</p>

                    <div className="flex items-center gap-1 pt-2 border-t border-slate-800">
                      {item.tags.map((t) => (
                        <span key={t} className="text-[9px] font-mono bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE GUIDANCE ENGINE */}
      {activeTab === 'guidance' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="h-4 w-4 text-emerald-400" />
                  Mode Live Guidance (Apprentissage Interactif en Direct)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Guidage pas-à-pas interactif de l'utilisateur directement dans l'application cible.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    logApi('Session de Contrôle Automatique démarrée');
                    await guidanceEngine.startAutoControlSession(scenario, (st) => setGuidanceState(st));
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg border border-white/10"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                  🤖 Contrôle Automatique & Tutoriel Vidéo
                </button>

                <button
                  onClick={() => {
                    const state = guidanceEngine.startGuidanceSession(scenario);
                    setGuidanceState(state);
                    logApi('Session de Live Guidance démarrée sur le scénario active');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Play className="h-3.5 w-3.5" />
                  Guidance Manuel
                </button>

                <button
                  onClick={() => {
                    guidanceEngine.stopSession();
                    setGuidanceState(null);
                    logApi('Session Live Guidance arrêtée');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Réinitialiser
                </button>
              </div>
            </div>

            {/* Live Interactive Widget Overlay Simulation */}
            {guidanceState ? (
              <div className="bg-slate-950 p-5 rounded-2xl border-2 border-emerald-500/50 space-y-4 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      GUIDANCE ACTIF — ÉTAPE {guidanceState.currentStepIndex + 1} / {guidanceState.totalSteps}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{guidanceState.progressPercentage}% Complété</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-white">{guidanceState.activeStep.title}</h3>
                  <p className="text-xs text-slate-300">{guidanceState.activeStep.intent}</p>

                  <div className="bg-emerald-950/40 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-200">
                    <strong>Action Requise :</strong> {guidanceState.activeStep.narrationText}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${guidanceState.progressPercentage}%` }}
                  />
                </div>

                {/* Guidance Controls */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      const st = guidanceEngine.previousStep();
                      setGuidanceState(st);
                    }}
                    disabled={guidanceState.currentStepIndex === 0}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 text-xs font-bold"
                  >
                    Étape Précédente
                  </button>

                  <button
                    onClick={() => {
                      const st = guidanceEngine.nextStep();
                      setGuidanceState(st);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                  >
                    Valider & Passer à l'Étape Suivante &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center space-y-2">
                <Compass className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Cliquez sur "Démarrer Guidance" pour lancer la simulation interactive du guidage en direct sur l'interface.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PUBLIC SAI API */}
      {activeTab === 'api' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-rose-400" />
              API Publique Unifiée du SAI (Public SAI SDK)
            </h2>

            {/* Methods Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={async () => {
                  const val = SaiPublicApi.validate(scenario);
                  setValidationResult(val);
                  logApi(`Scenario.validate() exécuté -> score: ${val.score}/100, valide: ${val.isValid}`);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left space-y-1 transition-all"
              >
                <span className="text-xs font-mono font-bold text-rose-400 block">Scenario.validate()</span>
                <span className="text-[10px] text-slate-500 block">Vérifier conformité et score</span>
              </button>

              <button
                onClick={async () => {
                  const rep = SaiPublicApi.replay(scenario, 1.25);
                  logApi(`Scenario.replay() exécuté -> durée estimée: ${Math.round(rep.totalDurationSec)}s à 1.25x`);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left space-y-1 transition-all"
              >
                <span className="text-xs font-mono font-bold text-rose-400 block">Scenario.replay()</span>
                <span className="text-[10px] text-slate-500 block">Générer plan de lecture</span>
              </button>

              <button
                onClick={async () => {
                  const cloned = SaiPublicApi.clone(scenario);
                  logApi(`Scenario.clone() créé -> Nouvel ID: ${cloned.id}`);
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left space-y-1 transition-all"
              >
                <span className="text-xs font-mono font-bold text-rose-400 block">Scenario.clone()</span>
                <span className="text-[10px] text-slate-500 block">Dupliquer le scénario</span>
              </button>

              <button
                onClick={async () => {
                  const clone = SaiPublicApi.clone(scenario);
                  clone.timeline[0].title = 'Titre Modifié pour Test Comparison';
                  const delta = SaiPublicApi.compare(scenario, clone);
                  setComparisonDelta(delta);
                  logApi('Scenario.compare() calculé sur version clonée');
                }}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500 text-left space-y-1 transition-all"
              >
                <span className="text-xs font-mono font-bold text-rose-400 block">Scenario.compare()</span>
                <span className="text-[10px] text-slate-500 block">Calculer écarts / delta</span>
              </button>
            </div>

            {/* Validation & Comparison Results */}
            {validationResult && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-mono text-emerald-400 font-bold block">
                  Résultat Validation : Score {validationResult.score}/100 ({validationResult.isValid ? 'VALIDE' : 'NON VALIDE'})
                </span>
                {validationResult.warnings.map((w) => (
                  <div key={w} className="text-amber-400 font-mono text-[11px]">• Avertissement: {w}</div>
                ))}
              </div>
            )}

            {/* API Console Log Output */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              <span className="text-slate-500 text-[10px] block border-b border-slate-800 pb-1">Journaux API Console :</span>
              {apiLog.map((log, idx) => (
                <div key={idx} className="text-slate-400">{log}</div>
              ))}
              {apiLog.length === 0 && <p className="text-slate-600 italic">Cliquez sur une méthode ci-dessus pour tester le contrat public API.</p>}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: USAGE HUB TRANSVERSE */}
      {activeTab === 'usage' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              Plateforme Transverse ACOM AI Demo (3 Usages Cibles)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white">1. Documentation</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Génération automatique de guides utilisateurs réactifs, pages HTML enrichies et manuels PDF imprimables.
                </p>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 block w-fit">
                  Prêt pour Export HTML/PDF
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-white">2. Formation & Certifications</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Vidéos interactives, parcours structurés par chapitres, évaluations par quiz et suivi d'apprentissage.
                </p>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 block w-fit">
                  Parcours de Formation Intégré
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-white">3. Assistance & Helpdesk</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Base de connaissances contextuelle, assistant IA d'aide et Live Guidance interactif en superposition.
                </p>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 block w-fit">
                  Aide Contextuelle Live
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ARCHITECTURE BASELINE V2.0 & GOVERNANCE */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          {/* Baseline Status Header */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 text-xs font-mono font-bold uppercase">
                    Architecture Baseline v2.0
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                    Noyau Figé & Séquencé
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-2">
                  <Server className="h-5 w-5 text-amber-400" />
                  Charte de Gouvernance & Architecture en 5 Couches
                </h2>
                <p className="text-xs text-slate-300 max-w-3xl">
                  Formulation officielle de la Version 2.0 Baseline. Les composants du Noyau (Level 1) sont verrouillés et toute évolution doit faire l'objet d'un Architecture Decision Record (ADR) et d'un RFC validé.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-right">
                <div>
                  <div className="text-xs font-bold text-amber-400 font-mono">5 Couches Métiers</div>
                  <div className="text-[10px] text-slate-400">Layered System Pattern</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Layer Stack Visualization */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-amber-400" />
              1. Empilement Officiel des 5 Couches
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 font-mono text-xs font-bold flex items-center justify-center">5</span>
                  <div>
                    <h4 className="text-xs font-bold text-purple-300">Product Layer</h4>
                    <p className="text-[11px] text-slate-400">Capture • Inspect • Edit • Publish • Train • Assist • Studio</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Depend de Layer 1..4</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-mono text-xs font-bold flex items-center justify-center">4</span>
                  <div>
                    <h4 className="text-xs font-bold text-blue-300">Workflow & Governance Layer</h4>
                    <p className="text-[11px] text-slate-400">Workflow • RBAC • Review • Approval • Audit • Versioning • SDK</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Depend de Layer 1..3</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-300">Execution Layer</h4>
                    <p className="text-[11px] text-slate-400">Replay • Runtime • Scenario Player • Overlay • Renderer</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Depend de Layer 1..2</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-xs font-bold flex items-center justify-center">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-300">Knowledge Layer</h4>
                    <p className="text-[11px] text-slate-400">SAI • Knowledge • AI Teaching • Live Guidance • Library</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Depend de Layer 1</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold flex items-center justify-center">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">Infrastructure Layer</h4>
                    <p className="text-[11px] text-slate-400">Repository • Event Bus • Validator • Migration • Assets</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">Zero Autre Dépendance</span>
              </div>
            </div>
          </div>

          {/* Component Governance Tiers & ADR Registry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tiers List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                2. Classification des Composants
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {ArchitectureBaselineRegistry.getComponents().map((c) => (
                  <div key={c.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono">{c.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        c.tier === 'TIER_1_FROZEN'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : c.tier === 'TIER_2_EVOLVING'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {c.tier === 'TIER_1_FROZEN' ? 'Niveau 1 (Figé)' : c.tier === 'TIER_2_EVOLVING' ? 'Niveau 2 (Évolutif)' : 'Niveau 3 (Extensible)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{c.description}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono text-slate-500">Couche: {c.layer}</span>
                      <span className="text-[10px] font-mono text-slate-500">•</span>
                      <span className="text-[10px] font-mono text-indigo-400">Contrat: {c.stabilityContract}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ADR Registry */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-indigo-400" />
                3. Registre des ADR (Architecture Decision Records)
              </h3>
              <div className="space-y-3">
                {ArchitectureBaselineRegistry.getAdrs().map((adr) => (
                  <div key={adr.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-indigo-400">{adr.id}</span>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                        {adr.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{adr.title}</h4>
                    <p className="text-[11px] text-slate-400">{adr.decision}</p>
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono text-slate-500 block">Conséquences clés:</span>
                      <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
                        {adr.consequences.map((cons, i) => (
                          <li key={i}>{cons}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Release Roadmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Milestone className="h-4 w-4 text-purple-400" />
              4. Feuillets de Route & Horizons de Versioning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 space-y-2">
                <div className="text-xs font-bold text-amber-400 font-mono">v2.0 Baseline (Actuelle)</div>
                <p className="text-[11px] text-slate-400">
                  Noyau gelé, 5 couches établies, workflow d'approbation et public API.
                </p>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 block w-fit">
                  Atteint & Validé
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white font-mono">v2.1 Qualité & SaaS</div>
                <p className="text-[11px] text-slate-400">
                  Tests d'intégration, benchmarks Scenario Player, profils SaaS métier.
                </p>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 block w-fit">
                  Prochain Sprint
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white font-mono">v2.2 Collaboration</div>
                <p className="text-[11px] text-slate-400">
                  Co-édition multi-auteurs, résolutions de conflits et Live Guidance enrichi.
                </p>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 block w-fit">
                  Planifié
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white font-mono">v3.0 IA Adaptative</div>
                <p className="text-[11px] text-slate-400">
                  Raccourcis pédagogiques personnalisés, graphes sémantiques et plugins.
                </p>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 block w-fit">
                  Vision Long Terme
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: UNIFIED KNOWLEDGE REPOSITORY, PROVENANCE, I18N, KPIS & PRESSING PILOT */}
      {activeTab === 'repository' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 text-xs font-mono font-bold uppercase">
                    Knowledge Repository & Pilote Métier
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                    Multi-Language & Traçabilité Provenance
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2 mt-2">
                  <Database className="h-5 w-5 text-emerald-400" />
                  Référentiel Unifié de Connaissances & Pilote Acom Pressing
                </h2>
                <p className="text-xs text-slate-300 max-w-3xl">
                  Centrale de capitalisation des savoirs (Scénarios, Objectifs, FAQ, Narrations, Quizz), traçabilité complète de provenance (Humain vs IA), localisation multilingue et simulation du pilote métier.
                </p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                <Globe className="h-4 w-4 text-emerald-400 ml-1" />
                <span className="text-xs font-mono text-slate-400 mr-2">Langue SAI:</span>
                {I18nEngine.getSupportedLanguages().map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                      selectedLang === lang.code
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 1: Multilingual SAI Preview & KPI Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Multilingual SAI Translation Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-400" />
                  1. Rendu Multilingue du Scénario
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {I18nEngine.getDictionary(selectedLang).flag} {I18nEngine.getDictionary(selectedLang).label}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400">
                  {I18nEngine.translate('scenario.title', selectedLang)}
                </div>
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 block">
                      Étape 1: {I18nEngine.translate('step.1.title', selectedLang)}
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {I18nEngine.translate('step.1.desc', selectedLang)}
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 block">
                      Étape 2: {I18nEngine.translate('step.2.title', selectedLang)}
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {I18nEngine.translate('step.2.desc', selectedLang)}
                    </p>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 block">
                      Étape 3: {I18nEngine.translate('step.3.title', selectedLang)}
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {I18nEngine.translate('step.3.desc', selectedLang)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all">
                    <Play className="h-3.5 w-3.5" />
                    {I18nEngine.translate('button.replay', selectedLang)}
                  </button>
                  <button className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-500 transition-all">
                    <Compass className="h-3.5 w-3.5" />
                    {I18nEngine.translate('button.guidance', selectedLang)}
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Functional Value KPIs */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  2. Indicateurs de Valeur & KPI Plateforme
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Health Score: {PlatformKpiEngine.getOverallHealthScore()}%
                </span>
              </div>

              <div className="space-y-2.5">
                {PlatformKpiEngine.getMetrics().map((m) => (
                  <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{m.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {m.currentValue} {m.unit}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          (Cible: {m.targetValue} {m.unit})
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">{m.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Unified Knowledge Repository with Provenance Audit */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-4 w-4 text-purple-400" />
                3. Unified Knowledge Repository & Provenance Traçabilité
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20">
                  Total Items: {KnowledgeRepositoryEngine.getStats().total}
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  Humain: {KnowledgeRepositoryEngine.getStats().humanOriginCount}
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                  IA: {KnowledgeRepositoryEngine.getStats().aiOriginCount}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {KnowledgeRepositoryEngine.getAllItems().map((item) => (
                <div key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">{item.id}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      item.provenance.origin === 'HUMAN_EXPERT'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}>
                      {item.provenance.origin === 'HUMAN_EXPERT' ? 'Expert Humain' : 'Généré par IA'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-300">{item.content}</p>
                  </div>

                  {/* Provenance Details */}
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 space-y-1 text-[10px] font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>Auteur: <strong className="text-slate-200">{item.provenance.authorName}</strong></span>
                      <span>Version: <strong className="text-indigo-400">{item.provenance.version}</strong></span>
                    </div>
                    <div>
                      Dernière Révision: {new Date(item.provenance.updatedAt).toLocaleString('fr-FR')}
                    </div>
                    <div className="pt-1 text-slate-400 border-t border-slate-800">
                      Applications consommatrices: <span className="text-emerald-400">{item.provenance.consumerApps.join(', ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Pilot Métier Case Study Execution (Acom Pressing) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Rocket className="h-4 w-4 text-amber-400" />
                4. Simulateur du Pilote Métier Réel (Acom Pressing)
              </h3>
              <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                Pilote Réel Phase 1
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Exécution de bout en bout : Captation en atelier blanchisserie &rarr; Validation automatique du SAI &rarr; Publication dans le Knowledge Repository &rarr; Support Live Guidance pour le caissier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
              <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                pilotStatus === 'CAPTURING'
                  ? 'bg-amber-950/40 border-amber-500/50 shadow-lg'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 font-mono">Étape 1: Captation</span>
                  {pilotStatus === 'CAPTURING' && <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Enregistrement du dépôt d'articles & paiement d'acompte.
                </p>
                <button
                  onClick={() => setPilotStatus('CAPTURING')}
                  className="w-full mt-2 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold hover:bg-amber-400 transition-all"
                >
                  Lancer Captation
                </button>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                pilotStatus === 'VALIDATING'
                  ? 'bg-blue-950/40 border-blue-500/50 shadow-lg'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 font-mono">Étape 2: Validation SAI</span>
                  {pilotStatus === 'VALIDATING' && <Clock className="h-3.5 w-3.5 text-blue-400 animate-spin" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Vérification du schéma & génération des métadonnées.
                </p>
                <button
                  onClick={() => setPilotStatus('VALIDATING')}
                  className="w-full mt-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-500 transition-all"
                >
                  Valider le SAI
                </button>
              </div>

              <div className={`p-4 rounded-xl border space-y-2 transition-all ${
                pilotStatus === 'PUBLISHED'
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono">Étape 3: Publication</span>
                  {pilotStatus === 'PUBLISHED' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400">
                  Publication multi-canal (Web, Mobile, Helpdesk).
                </p>
                <button
                  onClick={() => setPilotStatus('PUBLISHED')}
                  className="w-full mt-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-bold hover:bg-emerald-400 transition-all"
                >
                  Publier le Pilote
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-purple-400 font-mono">État du Pilote</div>
                <div className="text-xs font-bold text-white">
                  Statut: <span className="text-emerald-400 font-mono">{pilotStatus}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Prêt pour le déploiement sur les ateliers Acom Pressing Dakar & Thiès.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Knowledge Analytics Engine & Certification Badges */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                5. Knowledge Analytics Engine & Certification Officielle
              </h3>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 font-bold">
                Level: OFFICIAL
              </span>
            </div>

            {(() => {
              const analytics = KnowledgeAnalyticsEngine.getAnalytics('KNOW-SCEN-PRESS-001');
              if (!analytics) return null;
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400">Vues Totales</span>
                      <div className="text-lg font-bold text-emerald-400 font-mono">{analytics.totalViews}</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400">Taux de Complétion</span>
                      <div className="text-lg font-bold text-blue-400 font-mono">{analytics.completionRatePercent}%</div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400">Temps Apprentissage Moyen</span>
                      <div className="text-lg font-bold text-purple-400 font-mono">{analytics.averageLearningDurationMinutes} min</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-amber-400">Recommandations Pédagogiques IA d'Amélioration Continue:</h4>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {analytics.aiRecommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
