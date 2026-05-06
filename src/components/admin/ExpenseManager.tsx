import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbService } from '../../services/dbService';
import { Expense } from '../../types';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  'Salaires',
  'Loyer',
  'Logiciels/SaaS',
  'Matériel',
  'Marketing',
  'Logistique',
  'Impôts/Taxes',
  'Autres'
];

interface ExpenseManagerProps {
  startDate?: string;
  endDate?: string;
  categoryFilter?: string;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  onCategoryChange?: (val: string) => void;
  onStartDateChange?: (val: string) => void;
  onEndDateChange?: (val: string) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  startDate,
  endDate,
  categoryFilter: externalCategoryFilter,
  searchTerm: externalSearchTerm,
  onSearchChange,
  onCategoryChange,
  onStartDateChange,
  onEndDateChange
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Local states for when used without props (standalone)
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localCategoryFilter, setLocalCategoryFilter] = useState('Tous');

  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : localSearchTerm;
  const categoryFilter = externalCategoryFilter !== undefined ? externalCategoryFilter : localCategoryFilter;

  const setSearchTerm = (val: string) => {
    if (onSearchChange) onSearchChange(val);
    else setLocalSearchTerm(val);
  };

  const setCategoryFilter = (val: string) => {
    if (onCategoryChange) onCategoryChange(val);
    else setLocalCategoryFilter(val);
  };

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Autres',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await dbService.expenses.getAll();
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Erreur lors du chargement des d\u00E9penses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.title || !newExpense.amount) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    try {
      await dbService.expenses.save({
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        date: new Date(newExpense.date)
      });
      toast.success('D\u00E9pense ajout\u00E9e avec succ\u00E8s');
      setShowAddModal(false);
      setNewExpense({
        title: '',
        amount: '',
        category: 'Autres',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: ''
      });
      fetchExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Erreur lors de l\'ajout de la d\u00E9pense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('\u00CAtes-vous s\u00FBr de vouloir supprimer cette d\u00E9pense ?')) return;

    try {
      await dbService.expenses.delete(id);
      toast.success('D\u00E9pense supprim\u00E9e');
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    // Local date filtering logic if props are provided
    if (startDate || endDate) {
      const expDateStr = typeof exp.date === 'string' ? exp.date : 
                         exp.date?.toDate ? exp.date.toDate().toISOString() : 
                         new Date(exp.date).toISOString();
      
      const time = new Date(expDateStr).getTime();
      if (startDate && time < new Date(startDate + 'T00:00:00').getTime()) return false;
      if (endDate && time > new Date(endDate + 'T23:59:59').getTime()) return false;
    }

    const matchesSearch = exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Tous' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());

  const totalExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des D\u00E9penses</h2>
          <p className="text-gray-500">Suivez et g\u00E9rez toutes les charges de l'entreprise</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle D\u00E9pense
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Total Charges</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalExpenses.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-400 mt-1">Sur la p\u00E9riode s\u00E9lectionn\u00E9e</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 bg-gray-50/50 p-4 rounded-2xl border border-black/5 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une d\u00E9pense..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-600 outline-none"
            />
            <span className="text-gray-300">|</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-600 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-gray-600 outline-none focus:ring-0 cursor-pointer"
            >
              <option value="Tous">Toutes les cat\u00E9gories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('Tous');
              onStartDateChange?.(format(subDays(new Date(), 180), 'yyyy-MM-dd'));
              onEndDateChange?.(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-primary transition-colors shadow-sm"
            title="R\u00E9initialiser les filtres"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Titre / Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-gray-500">Chargement des dépenses...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500">Aucune dépense trouvée</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {expense.date?.toDate ? format(expense.date.toDate(), 'dd MMM yyyy', { locale: fr }) : format(new Date(expense.date), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{expense.title}</span>
                        {expense.description && (
                          <span className="text-xs text-gray-400 line-clamp-1">{expense.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">
                        <Tag className="w-3 h-3 mr-1" />
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-red-600">
                        -{expense.amount.toLocaleString()} FCFA
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Ajouter une dépense</h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Plus className="w-6 h-6 rotate-45 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Titre de la dépense *</label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={newExpense.title}
                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary"
                        placeholder="Ex: Loyer Mars 2024"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Montant (FCFA) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          required
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          required
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Catégorie *</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary appearance-none"
                      >
                        {EXPENSE_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description (Optionnel)</label>
                    <textarea
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary h-24 resize-none"
                      placeholder="Détails supplémentaires..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                  >
                    Enregistrer la dépense
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
