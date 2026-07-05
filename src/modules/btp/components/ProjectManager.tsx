import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Loader2, MapPin, Search, Edit2, Trash2, X, 
  ChevronDown, ChevronRight, FileText, CheckCircle2, 
  Clock, AlertTriangle, ArrowRight, Banknote, 
  HardHat as Construction, Sun, Cloud, CloudRain, Wind, 
  Activity, TrendingUp, DollarSign, Calendar, User, ListTodo
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';
import { Task, ConstructionLog, BudgetItem, BtpProject } from '../types';

export const ProjectManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [projectLimit, setProjectLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-tab selection for the selected project
  const [projectTab, setProjectTab] = useState<'overview' | 'tasks' | 'journal' | 'budget'>('overview');

  // Form states for Journal entries & Budget items
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLog, setNewLog] = useState<Partial<ConstructionLog>>({
    date: new Date().toISOString().split('T')[0],
    weather: 'sunny',
    notes: '',
    incidents: '',
    workersCount: 1,
    author: ''
  });

  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState<Partial<BudgetItem>>({
    category: 'materials',
    description: '',
    allocated: 0,
    spent: 0,
    date: new Date().toISOString().split('T')[0]
  });

  // Load Projects from Dexie
  const projects = useLiveQuery(() => 
    db.table('projects')
      .where('merchantId')
      .equals(merchant.id)
      .reverse()
      .sortBy('updatedAt')
  , [merchant.id]) || [];

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        ...currentProject,
        merchantId: merchant.id,
        tasks: currentProject.tasks || [],
        logs: currentProject.logs || [],
        budgets: currentProject.budgets || []
      };

      const id = await dbService.projects.save(dataToSave);
      toast.success('Projet enregistré avec succès');
      setIsEditing(false);

      if (selectedProject?.id === currentProject.id || !selectedProject) {
        setSelectedProject({ ...dataToSave, id });
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Erreur lors de l\'enregistrement du projet');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setSaving(true);
    try {
      await dbService.projects.delete(id);
      toast.success('Projet supprimé');
      setDeleteConfirm(null);
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  };

  // Task Operations
  const handleAddTask = async (columnId: 'todo' | 'doing' | 'done') => {
    const title = prompt('Titre de la tâche:');
    if (!title) return;
    
    const newTask: Task = { 
      id: crypto.randomUUID(), 
      title, 
      status: columnId, 
      createdAt: Date.now() 
    };

    const updatedProject = {
      ...selectedProject,
      tasks: [...(selectedProject.tasks || []), newTask]
    };

    setSaving(true);
    try {
      await dbService.projects.save(updatedProject);
      setSelectedProject(updatedProject);
      toast.success('Tâche ajoutée');
    } catch (e) {
      toast.error('Erreur lors de l\'ajout de la tâche');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'todo' | 'doing' | 'done') => {
    if (!selectedProject?.tasks) return;
    
    const updatedTasks = selectedProject.tasks.map((t: Task) => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );

    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks
    };

    setSelectedProject(updatedProject);
    await dbService.projects.save(updatedProject);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProject?.tasks) return;
    
    const updatedTasks = selectedProject.tasks.filter((t: Task) => t.id !== taskId);
    const updatedProject = {
      ...selectedProject,
      tasks: updatedTasks
    };

    setSelectedProject(updatedProject);
    await dbService.projects.save(updatedProject);
    toast.success('Tâche supprimée');
  };

  // Journal Operations
  const handleAddJournalLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.notes || !newLog.author) {
      toast.error('Veuillez remplir les champs obligatoires (Auteur, Notes)');
      return;
    }

    const logEntry: ConstructionLog = {
      id: crypto.randomUUID(),
      date: newLog.date || new Date().toISOString().split('T')[0],
      weather: (newLog.weather as any) || 'sunny',
      notes: newLog.notes,
      incidents: newLog.incidents || '',
      workersCount: Number(newLog.workersCount) || 1,
      author: newLog.author,
      createdAt: Date.now()
    };

    const updatedProject = {
      ...selectedProject,
      logs: [logEntry, ...(selectedProject.logs || [])]
    };

    setSaving(true);
    try {
      await dbService.projects.save(updatedProject);
      setSelectedProject(updatedProject);
      setIsAddingLog(false);
      setNewLog({
        date: new Date().toISOString().split('T')[0],
        weather: 'sunny',
        notes: '',
        incidents: '',
        workersCount: 1,
        author: ''
      });
      toast.success('Entrée de journal enregistrée');
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJournalLog = async (logId: string) => {
    if (!window.confirm('Supprimer cette entrée du journal ?')) return;
    const updatedLogs = (selectedProject.logs || []).filter((l: ConstructionLog) => l.id !== logId);
    
    const updatedProject = {
      ...selectedProject,
      logs: updatedLogs
    };

    try {
      await dbService.projects.save(updatedProject);
      setSelectedProject(updatedProject);
      toast.success('Entrée supprimée');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Budget Operations
  const handleAddBudgetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.description || newBudget.allocated === undefined) {
      toast.error('Veuillez spécifier une description et un budget prévu');
      return;
    }

    const budgetEntry: BudgetItem = {
      id: crypto.randomUUID(),
      category: (newBudget.category as any) || 'materials',
      description: newBudget.description,
      allocated: Number(newBudget.allocated) || 0,
      spent: Number(newBudget.spent) || 0,
      date: newBudget.date || new Date().toISOString().split('T')[0]
    };

    const updatedProject = {
      ...selectedProject,
      budgets: [...(selectedProject.budgets || []), budgetEntry]
    };

    setSaving(true);
    try {
      await dbService.projects.save(updatedProject);
      setSelectedProject(updatedProject);
      setIsAddingBudget(false);
      setNewBudget({
        category: 'materials',
        description: '',
        allocated: 0,
        spent: 0,
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Ligne budgétaire ajoutée');
    } catch (err) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudgetItem = async (budgetId: string) => {
    if (!window.confirm('Supprimer cette ligne budgétaire ?')) return;
    const updatedBudgets = (selectedProject.budgets || []).filter((b: BudgetItem) => b.id !== budgetId);
    
    const updatedProject = {
      ...selectedProject,
      budgets: updatedBudgets
    };

    try {
      await dbService.projects.save(updatedProject);
      setSelectedProject(updatedProject);
      toast.success('Ligne budgétaire supprimée');
    } catch (err) {
      toast.error('Erreur');
    }
  };

  // Weather icon mapper
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'cloudy': return <Cloud className="w-5 h-5 text-gray-400" />;
      case 'rainy': return <CloudRain className="w-5 h-5 text-blue-400" />;
      case 'windy': return <Wind className="w-5 h-5 text-teal-400" />;
      default: return <Sun className="w-5 h-5 text-amber-500" />;
    }
  };

  // Weather label mapper
  const getWeatherLabel = (weather: string) => {
    switch (weather) {
      case 'sunny': return 'Ensoleillé';
      case 'cloudy': return 'Nuageux';
      case 'rainy': return 'Pluvieux';
      case 'windy': return 'Venteux';
      case 'stormy': return 'Orageux';
      default: return 'Inconnu';
    }
  };

  // Budget category translation
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'materials': return 'Matériaux & Fournitures';
      case 'labor': return 'Main d\'œuvre';
      case 'equipment': return 'Engins & Équipements';
      case 'subcontracting': return 'Sous-traitance';
      case 'other': return 'Autres frais';
      default: return category;
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  // SELECTED PROJECT DETAIL VIEW
  if (selectedProject) {
    const project = projects.find(p => p.id === selectedProject.id) || selectedProject;
    const tasks = project.tasks || [];
    const logs = project.logs || [];
    const budgets = project.budgets || [];

    // Calculations
    const totalSpent = budgets.reduce((acc: number, item: BudgetItem) => acc + (item.spent || 0), 0);
    const totalAllocated = budgets.reduce((acc: number, item: BudgetItem) => acc + (item.allocated || 0), 0) || project.budget || 1;
    const budgetUsagePercent = Math.min(Math.round((totalSpent / totalAllocated) * 100), 100);

    const completedTasksCount = tasks.filter((t: Task) => t.status === 'done').length;
    const totalTasksCount = tasks.length;
    const taskCompletionPercent = totalTasksCount ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    const columns: { id: 'todo' | 'doing' | 'done'; title: string; color: string; textColor: string; dot: string; border: string }[] = [
      { id: 'todo', title: 'À Faire', color: 'bg-amber-50/50', textColor: 'text-amber-600', dot: 'bg-amber-500', border: 'border-amber-200' },
      { id: 'doing', title: 'En Cours', color: 'bg-blue-50/50', textColor: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' },
      { id: 'done', title: 'Terminé', color: 'bg-emerald-50/50', textColor: 'text-emerald-600', dot: 'bg-emerald-500', border: 'border-emerald-200' }
    ];

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Detail Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedProject(null)} 
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors border border-black/5"
              title="Retour aux projets"
            >
              <ArrowRight className="w-5 h-5 text-gray-500 rotate-180" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-ink">{project.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${
                  project.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  project.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {project.status === 'planned' ? 'Planifié' : project.status === 'active' ? 'En Cours' : project.status === 'on-hold' ? 'En Pause' : 'Terminé'}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400 mt-1">
                <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-primary" /> {project.location}</span>
                <span className="flex items-center"><Banknote className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Budget de Réf: {Number(project.budget || 0).toLocaleString()} {merchant.currency}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setCurrentProject(project); setIsEditing(true); }} 
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold transition-colors uppercase tracking-widest"
            >
              Modifier Projet
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto space-x-2 border-b border-gray-100 pb-px">
          {[
            { id: 'overview', label: 'Tableau de bord', icon: Activity },
            { id: 'tasks', label: 'Suivi de Tâches', icon: ListTodo },
            { id: 'journal', label: 'Journal de Chantier', icon: FileText },
            { id: 'budget', label: 'Suivi Budgétaire', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            const active = projectTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setProjectTab(tab.id as any)}
                className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                  active 
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl font-black' 
                    : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Sub-tab content */}
        <div className="pt-2">
          {projectTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Budget Widget */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">BUDGET</span>
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Dépenses engagées</h4>
                  <p className="text-2xl font-black text-ink mt-1">
                    {totalSpent.toLocaleString()} <span className="text-xs font-mono font-bold text-gray-400">{merchant.currency}</span>
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Sur un budget estimé de {totalAllocated.toLocaleString()} {merchant.currency}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Progression</span>
                    <span>{budgetUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${budgetUsagePercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${budgetUsagePercent}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Tasks Progress */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                    <ListTodo className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">TÂCHES</span>
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Avancement des tâches</h4>
                  <p className="text-2xl font-black text-ink mt-1">
                    {completedTasksCount} / {totalTasksCount} <span className="text-xs font-medium text-gray-400">Tâches</span>
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {tasks.filter((t: Task) => t.status === 'doing').length} tâche(s) en cours de traitement
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Avancement</span>
                    <span>{taskCompletionPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${taskCompletionPercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Card 3: Last Journal Log */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">DERNIER RAPPORT</span>
                  </div>
                  {logs.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between text-xs font-mono font-black text-gray-400 mb-1">
                        <span>PAR: {logs[0].author.toUpperCase()}</span>
                        <span>{logs[0].date}</span>
                      </div>
                      <p className="text-sm font-bold text-ink line-clamp-2">
                        {logs[0].notes}
                      </p>
                      {logs[0].incidents && (
                        <div className="mt-2 flex items-center text-xs text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                          Incident signalé
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-xs font-medium">
                      Aucun rapport journalier enregistré pour le moment.
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setProjectTab('journal')} 
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-xl border border-gray-150 transition-colors"
                >
                  Consulter le journal
                </button>
              </div>
            </div>
          )}

          {projectTab === 'tasks' && (
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar min-h-[500px]">
              {columns.map(col => {
                const columnTasks = tasks.filter((t: Task) => t.status === col.id);
                return (
                  <div 
                    key={col.id} 
                    className={`flex-shrink-0 w-80 flex flex-col rounded-3xl ${col.color} border ${col.border} snap-start`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const taskId = e.dataTransfer.getData('taskId');
                      if (taskId) handleUpdateTaskStatus(taskId, col.id);
                    }}
                  >
                    <div className="p-5 border-b border-black/5 flex justify-between items-center bg-white/50 rounded-t-3xl backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${col.dot}`} />
                        <h3 className={`font-black text-sm uppercase tracking-widest ${col.textColor}`}>{col.title}</h3>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-1 bg-white rounded-lg opacity-70">{columnTasks.length}</span>
                    </div>
                    
                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                      {columnTasks.map((task: Task) => (
                        <div 
                          key={task.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                          className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group/item"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-sm text-ink leading-tight">{task.title}</p>
                            <button 
                              onClick={() => handleDeleteTask(task.id)} 
                              className="text-gray-400 hover:text-rose-600 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-rose-50 rounded-lg"
                              title="Supprimer la tâche"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-[10px] text-gray-400 font-mono">
                            <span># {task.id.substring(0, 5).toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                      
                      <button 
                        onClick={() => handleAddTask(col.id)} 
                        className={`w-full py-3.5 rounded-xl border-2 border-dashed ${col.border} text-xs font-black uppercase tracking-wider text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all flex items-center justify-center gap-2`}
                      >
                        <Plus className="w-4 h-4" /> Ajouter une Tâche
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {projectTab === 'journal' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Timeline List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-ink">Historique du Journal</h3>
                  <button 
                    onClick={() => setIsAddingLog(!isAddingLog)} 
                    className="flex items-center space-x-1 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouvelle Entrée</span>
                  </button>
                </div>

                <div className="relative border-l border-gray-200 pl-6 ml-3 space-y-8 py-4">
                  {logs.map((log: ConstructionLog) => (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-white border-2 border-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      </div>

                      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-black text-ink">{log.date}</span>
                            <span className="text-xs text-gray-400">|</span>
                            <span className="flex items-center text-xs font-mono font-black text-gray-500 uppercase tracking-wider">
                              <User className="w-3.5 h-3.5 mr-1" /> {log.author}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                              {getWeatherIcon(log.weather)}
                              <span className="ml-1">{getWeatherLabel(log.weather)}</span>
                            </span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                              💼 {log.workersCount} Ouvrier(s)
                            </span>
                            <button 
                              onClick={() => handleDeleteJournalLog(log.id)}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Supprimer l'entrée"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">{log.notes}</p>

                        {log.incidents && (
                          <div className="mt-4 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                            <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs mb-1">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                              Rapport d'incident :
                            </div>
                            <p className="text-xs text-amber-800 font-medium">{log.incidents}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {logs.length === 0 && (
                    <div className="text-center py-12 text-gray-400 font-medium bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl">
                      Aucune entrée dans le journal de chantier.
                    </div>
                  )}
                </div>
              </div>

              {/* Add Entry Form Box */}
              <div>
                {isAddingLog ? (
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-md sticky top-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <h3 className="font-bold text-ink text-md">Saisie Journal de Chantier</h3>
                      <button onClick={() => setIsAddingLog(false)} className="p-1 hover:bg-gray-50 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>

                    <form onSubmit={handleAddJournalLog} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date du rapport</label>
                        <input 
                          type="date" 
                          required 
                          value={newLog.date} 
                          onChange={e => setNewLog({...newLog, date: e.target.value})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Météo</label>
                          <select 
                            value={newLog.weather} 
                            onChange={e => setNewLog({...newLog, weather: e.target.value as any})} 
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="sunny">Ensoleillé</option>
                            <option value="cloudy">Nuageux</option>
                            <option value="rainy">Pluvieux</option>
                            <option value="windy">Venteux</option>
                            <option value="stormy">Orageux</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ouvriers actifs</label>
                          <input 
                            type="number" 
                            min="1" 
                            required 
                            value={newLog.workersCount} 
                            onChange={e => setNewLog({...newLog, workersCount: Number(e.target.value)})} 
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Auteur du rapport</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Chef de chantier, conducteur..." 
                          value={newLog.author} 
                          onChange={e => setNewLog({...newLog, author: e.target.value})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Observations / Notes (Obligatoire)</label>
                        <textarea 
                          required 
                          rows={4}
                          placeholder="Détaillez l'avancement des travaux, matériaux reçus, travaux effectués..." 
                          value={newLog.notes} 
                          onChange={e => setNewLog({...newLog, notes: e.target.value})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 min-h-[100px]" 
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Incidents, blocages (Optionnel)</label>
                        <input 
                          type="text" 
                          placeholder="ex: Panne de grue, retard livraison béton..." 
                          value={newLog.incidents} 
                          onChange={e => setNewLog({...newLog, incidents: e.target.value})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Valider l\'entrée de journal'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-3xl border border-black/5 text-center space-y-2 sticky top-6">
                    <p className="text-xs text-gray-500 font-bold">Remplir un rapport d'activité ?</p>
                    <button 
                      onClick={() => setIsAddingLog(true)} 
                      className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                    >
                      Saisir rapport du jour
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {projectTab === 'budget' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cost Sheet / Budget Table */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-ink">Lignes de Dépenses & Approvisionnement</h3>
                  <button 
                    onClick={() => setIsAddingBudget(!isAddingBudget)} 
                    className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:scale-105 transition-transform"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter une dépense</span>
                  </button>
                </div>

                <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                          <th className="px-6 py-4">Désignation</th>
                          <th className="px-6 py-4">Catégorie</th>
                          <th className="px-6 py-4 text-right">Prévu</th>
                          <th className="px-6 py-4 text-right">Réel</th>
                          <th className="px-6 py-4 text-right">Écart</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {budgets.map((b: BudgetItem) => {
                          const diff = b.allocated - b.spent;
                          const isOver = diff < 0;
                          return (
                            <tr key={b.id} className="hover:bg-gray-50/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-ink">{b.description}</span>
                                  <span className="text-[10px] text-gray-400 font-mono mt-0.5">{b.date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-gray-50 text-[10px] font-bold text-gray-600 rounded-lg uppercase tracking-wider">
                                  {getCategoryLabel(b.category)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-xs font-bold text-gray-700">
                                {b.allocated.toLocaleString()} {merchant.currency}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-xs font-bold text-ink">
                                {b.spent.toLocaleString()} {merchant.currency}
                              </td>
                              <td className={`px-6 py-4 text-right font-mono text-xs font-black ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {isOver ? '-' : '+'}{Math.abs(diff).toLocaleString()} {merchant.currency}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  onClick={() => handleDeleteBudgetItem(b.id)} 
                                  className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {budgets.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                              Aucune ligne budgétaire enregistrée.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Add Cost Form / Category distribution */}
              <div>
                {isAddingBudget ? (
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-md sticky top-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <h3 className="font-bold text-ink text-md">Enregistrer un poste de coût</h3>
                      <button onClick={() => setIsAddingBudget(false)} className="p-1 hover:bg-gray-50 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>

                    <form onSubmit={handleAddBudgetItem} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Catégorie budgétaire</label>
                        <select 
                          value={newBudget.category} 
                          onChange={e => setNewBudget({...newBudget, category: e.target.value as any})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="materials">Matériaux & Fournitures</option>
                          <option value="labor">Main d'œuvre</option>
                          <option value="equipment">Engins & Équipements</option>
                          <option value="subcontracting">Sous-traitance</option>
                          <option value="other">Autres frais</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description / Désignation</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="ex: Achat de 20 tonnes de ciment, briques..." 
                          value={newBudget.description} 
                          onChange={e => setNewBudget({...newBudget, description: e.target.value})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Budget prévu ({merchant.currency})</label>
                          <input 
                            type="number" 
                            min="0"
                            required 
                            value={newBudget.allocated} 
                            onChange={e => setNewBudget({...newBudget, allocated: Number(e.target.value)})} 
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Dépensé réel ({merchant.currency})</label>
                          <input 
                            type="number" 
                            min="0"
                            required 
                            value={newBudget.spent} 
                            onChange={e => setNewBudget({...newBudget, spent: Number(e.target.value)})} 
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date d'opération</label>
                        <input 
                          type="date" 
                          required 
                          value={newBudget.date} 
                          onChange={e => setNewBudget({...newBudget, date: e.target.value})} 
                          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                        />
                      </div>

                      <button 
                        type="submit" 
                        disabled={saving}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer la ligne de coût'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-3xl border border-black/5 text-center space-y-2 sticky top-6">
                    <p className="text-xs text-gray-500 font-bold">Ajouter un coût / une dépense ?</p>
                    <button 
                      onClick={() => setIsAddingBudget(true)} 
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider"
                    >
                      Créer un poste de dépenses
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ALL PROJECTS GRID LIST VIEW
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Chantiers & Projets</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Projets enregistrés: {projects.length.toString().padStart(2, '0')}
          </p>
        </div>
        <button 
          onClick={() => {
            setCurrentProject({ name: '', location: '', status: 'planned', budget: 0, startDate: '', endDate: '' });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Projet BTP</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un chantier par nom, localisation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.slice(0, projectLimit).map((project: any) => {
          const tasks = project.tasks || [];
          const budgets = project.budgets || [];
          const totalSpent = budgets.reduce((acc: number, b: BudgetItem) => acc + (b.spent || 0), 0);
          const completionTasks = tasks.length ? Math.round((tasks.filter((t: Task) => t.status === 'done').length / tasks.length) * 100) : 0;

          return (
            <div 
              key={project.id} 
              onClick={() => setSelectedProject(project)}
              className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-sm hover:shadow-2xl transition-all group/card relative overflow-hidden cursor-pointer flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover/card:scale-110 transition-transform"></div>
              
              <div>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 group-hover/card:scale-110 transition-transform">
                    <Construction className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover/card:opacity-100 transition-all">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setCurrentProject(project); setIsEditing(true); }} 
                      className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20 transition-all shadow-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }} 
                      className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl border border-transparent hover:border-rose-200 transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-ink mb-2 leading-tight relative z-10 tracking-tight">{project.name}</h3>
                <div className="flex items-center text-[10px] text-gray-400 font-mono font-black uppercase tracking-[0.2em] mb-6 relative z-10">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-primary animate-pulse" /> 
                  {project.location}
                </div>

                {/* Micro indicators */}
                <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <span className="text-[9px] font-mono font-black text-gray-400 uppercase">Tâches Finies</span>
                    <p className="text-sm font-black text-ink mt-0.5">{completionTasks}% ({tasks.filter((t: Task) => t.status === 'done').length}/{tasks.length})</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-black text-gray-400 uppercase">Frais Réels</span>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">{totalSpent.toLocaleString()} {merchant.currency}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-6 border-t border-gray-100 relative z-10">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${
                  project.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                  project.status === 'active' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}>
                  {project.status === 'planned' ? 'PLANIFIÉ' : project.status === 'active' ? 'EN COURS' : project.status === 'on-hold' ? 'EN PAUSE' : 'TERMINÉ'}
                </span>
                <div className="text-right">
                  <p className="text-[9px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Budget Total</p>
                  <p className="font-black text-xl text-ink tracking-tighter">
                    {project.budget?.toLocaleString() || '0'} 
                    <span className="text-[10px] text-gray-400 font-mono ml-1 uppercase">{merchant.currency}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 font-medium">
            Aucun projet ou chantier trouvé.
          </div>
        )}
      </div>

      {filteredProjects.length > projectLimit && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setProjectLimit(prev => prev + 10)}
            className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
          >
            Voir plus
          </button>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-bold text-ink">Configuration du Projet</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Saisie des données de référence</p>
              </div>
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Nom du Projet</label>
                  <input type="text" required value={currentProject.name} onChange={e => setCurrentProject({...currentProject, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Localisation</label>
                  <input type="text" required value={currentProject.location} onChange={e => setCurrentProject({...currentProject, location: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed border-gray-100">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Budget Estimé Global</label>
                  <div className="relative">
                    <input type="number" required value={currentProject.budget} onChange={e => setCurrentProject({...currentProject, budget: Number(e.target.value)})} className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono font-bold" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">{merchant.currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Statut Initial</label>
                  <select value={currentProject.status} onChange={e => setCurrentProject({...currentProject, status: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold">
                    <option value="planned">Planifié</option>
                    <option value="active">En cours</option>
                    <option value="on-hold">En pause</option>
                    <option value="completed">Terminé</option>
                  </select>
                </div>
              </div>
            </form>

            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors border-none">Annuler</button>
              <button onClick={handleSaveProject} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer le projet'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer le projet ?</h3>
              <p className="text-sm text-gray-500 mb-6">Toutes les données associées (tâches, budgets, journaux) seront définitivement effacées de la base de données locale et cloud.</p>
              <div className="flex space-x-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 border-none">Annuler</button>
                <button onClick={() => handleDeleteProject(deleteConfirm)} disabled={saving} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectManager;
