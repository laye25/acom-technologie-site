import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Scissors, Palette, DollarSign, Calendar, Clock, 
  CheckCircle2, AlertCircle, Plus, Trash2, Edit, Save, Search, 
  ArrowLeft, Filter, Wallet, Receipt, CreditCard, ChevronRight, Check,
  UserCheck, History, Award, Info, Landmark, HelpCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface Merchant {
  id: string;
  name: string;
  currency?: string;
}

interface Artisan {
  id: string;
  name: string;
  phone: string;
  specialty: 'Couturier Principal' | 'Brodeur' | 'Apprenti' | 'Finisseur' | 'Styliste';
  status: 'Disponible' | 'Occupé' | 'En congé';
  notes?: string;
  createdAt: string;
}

interface TaskAssignment {
  id: string;
  orderId: string;
  orderClientName: string;
  orderModelName: string;
  artisanId: string;
  artisanName: string;
  taskDescription: string;
  pieceRateAmount: number; // Rémunération à la pièce
  status: 'A faire' | 'En cours' | 'A valider' | 'Terminé';
  dueDate: string;
  payoutStatus: 'Non payé' | 'Payé';
  createdAt: string;
  completedAt?: string;
}

interface ArtisanPayment {
  id: string;
  artisanId: string;
  artisanName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Autre';
  notes?: string;
}

interface TailleurArtisansManagerProps {
  merchant: Merchant;
}

const SPECIALTIES = [
  'Couturier Principal',
  'Brodeur',
  'Apprenti',
  'Finisseur',
  'Styliste'
] as const;

export const TailleurArtisansManager = ({ merchant }: TailleurArtisansManagerProps) => {
  const currency = merchant.currency || 'FCFA';

  // Base list states
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [payments, setPayments] = useState<ArtisanPayment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<'artisans' | 'assignments' | 'payments' | 'fiche_artisan'>('artisans');
  
  // Selection / Detail state
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(null);

  // Modals state
  const [isArtisanModalOpen, setIsArtisanModalOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<Artisan | null>(null);
  
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TaskAssignment | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Form Fields - Artisan
  const [artisanName, setArtisanName] = useState('');
  const [artisanPhone, setArtisanPhone] = useState('');
  const [artisanSpecialty, setArtisanSpecialty] = useState<Artisan['specialty']>('Couturier Principal');
  const [artisanStatus, setArtisanStatus] = useState<Artisan['status']>('Disponible');
  const [artisanNotes, setArtisanNotes] = useState('');

  // Form Fields - Assignment
  const [assignOrderId, setAssignOrderId] = useState('');
  const [assignArtisanId, setAssignArtisanId] = useState('');
  const [assignTaskDesc, setAssignTaskDesc] = useState('');
  const [assignPieceRate, setAssignPieceRate] = useState(5000);
  const [assignDueDate, setAssignDueDate] = useState('');
  const [assignStatus, setAssignStatus] = useState<TaskAssignment['status']>('A faire');

  // Form Fields - Payment
  const [payArtisanId, setPayArtisanId] = useState('');
  const [payAmount, setPayAmount] = useState(10000);
  const [payMethod, setPayMethod] = useState<ArtisanPayment['paymentMethod']>('Espèces');
  const [payNotes, setPayNotes] = useState('');

  // Searches & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterAssignStatus, setFilterAssignStatus] = useState<string>('all');

  // Load Data
  useEffect(() => {
    try {
      // Load Artisans
      const savedArtisans = localStorage.getItem(`tailleur_artisans_${merchant.id}`);
      if (savedArtisans) {
        setArtisans(JSON.parse(savedArtisans));
      } else {
        // Initialize with default template artisans for a beautiful start
        const defaultArtisans: Artisan[] = [
          {
            id: 'art-1',
            name: 'Moustapha Diop',
            phone: '+221 77 543 21 09',
            specialty: 'Couturier Principal',
            status: 'Disponible',
            notes: 'Spécialiste du Basin Riche et du drapé haute couture.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'art-2',
            name: 'Fatou Sow',
            phone: '+221 78 123 45 67',
            specialty: 'Brodeur',
            status: 'Occupé',
            notes: 'Expert broderies fils d\'or et motifs floraux traditionnels.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'art-3',
            name: 'Ibrahima Ndiaye',
            phone: '+221 70 876 54 32',
            specialty: 'Apprenti',
            status: 'Disponible',
            notes: 'En formation. Assure le surfilage et les découpes de base.',
            createdAt: new Date().toISOString()
          },
          {
            id: 'art-4',
            name: 'Aminata Diallo',
            phone: '+221 76 998 88 77',
            specialty: 'Finisseur',
            status: 'Disponible',
            notes: 'S\'occupe de la pose des boutons, des ourlets fins et du repassage vapeur.',
            createdAt: new Date().toISOString()
          }
        ];
        setArtisans(defaultArtisans);
        localStorage.setItem(`tailleur_artisans_${merchant.id}`, JSON.stringify(defaultArtisans));
      }

      // Load Assignments
      const savedAssignments = localStorage.getItem(`tailleur_assignments_${merchant.id}`);
      if (savedAssignments) {
        setAssignments(JSON.parse(savedAssignments));
      } else {
        // Default assignments
        const defaultAssignments: TaskAssignment[] = [
          {
            id: 'asg-1',
            orderId: 'dummy-o1',
            orderClientName: 'Mariama Ba',
            orderModelName: 'Grand Boubou Brodé',
            artisanId: 'art-2',
            artisanName: 'Fatou Sow',
            taskDescription: 'Broderie complète en col et manches',
            pieceRateAmount: 25000,
            status: 'En cours',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
            payoutStatus: 'Non payé',
            createdAt: new Date().toISOString()
          },
          {
            id: 'asg-2',
            orderId: 'dummy-o2',
            orderClientName: 'Cheikh Fall',
            orderModelName: 'Ensemble Veste Wax',
            artisanId: 'art-1',
            artisanName: 'Moustapha Diop',
            taskDescription: 'Assemblage veste croisée doublée',
            pieceRateAmount: 15000,
            status: 'Terminé',
            dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            payoutStatus: 'Non payé',
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }
        ];
        setAssignments(defaultAssignments);
        localStorage.setItem(`tailleur_assignments_${merchant.id}`, JSON.stringify(defaultAssignments));
      }

      // Load Payments
      const savedPayments = localStorage.getItem(`tailleur_artisan_payments_${merchant.id}`);
      if (savedPayments) {
        setPayments(JSON.parse(savedPayments));
      } else {
        const defaultPayments: ArtisanPayment[] = [
          {
            id: 'pay-1',
            artisanId: 'art-1',
            artisanName: 'Moustapha Diop',
            amount: 10000,
            paymentDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
            paymentMethod: 'Espèces',
            notes: 'Acompte sur montage veste'
          }
        ];
        setPayments(defaultPayments);
        localStorage.setItem(`tailleur_artisan_payments_${merchant.id}`, JSON.stringify(defaultPayments));
      }

      // Load existing tailleur orders to bind them to tasks
      const savedOrders = localStorage.getItem(`tailleur_orders_${merchant.id}`);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (e) {
      console.error('Error loading Tailleur artisans data:', e);
    }
  }, [merchant.id]);

  // Sync utilities
  const syncArtisans = (newArtisans: Artisan[]) => {
    setArtisans(newArtisans);
    localStorage.setItem(`tailleur_artisans_${merchant.id}`, JSON.stringify(newArtisans));
  };

  const syncAssignments = (newAssignments: TaskAssignment[]) => {
    setAssignments(newAssignments);
    localStorage.setItem(`tailleur_assignments_${merchant.id}`, JSON.stringify(newAssignments));
  };

  const syncPayments = (newPayments: ArtisanPayment[]) => {
    setPayments(newPayments);
    localStorage.setItem(`tailleur_artisan_payments_${merchant.id}`, JSON.stringify(newPayments));
  };

  // Calculations
  const getArtisanStats = (artisanId: string) => {
    const artisanTasks = assignments.filter(a => a.artisanId === artisanId);
    const completedTasks = artisanTasks.filter(a => a.status === 'Terminé');
    
    // Total piece-rate earned for completed tasks
    const totalEarned = completedTasks.reduce((sum, t) => sum + t.pieceRateAmount, 0);
    
    // Total payments already made to this artisan
    const totalPaid = payments
      .filter(p => p.artisanId === artisanId)
      .reduce((sum, p) => sum + p.amount, 0);
      
    const balance = totalEarned - totalPaid;

    return {
      assignedCount: artisanTasks.length,
      completedCount: completedTasks.length,
      inProgressCount: artisanTasks.filter(a => a.status === 'En cours').length,
      todoCount: artisanTasks.filter(a => a.status === 'A faire').length,
      totalEarned,
      totalPaid,
      balance
    };
  };

  // Financial Dashboard Stats
  const totalEarnedAll = assignments
    .filter(a => a.status === 'Terminé')
    .reduce((sum, a) => sum + a.pieceRateAmount, 0);

  const totalPaidAll = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingDueAll = totalEarnedAll - totalPaidAll;

  // Artisan Modal Handlers
  const openArtisanForm = (artisan: Artisan | null = null) => {
    if (artisan) {
      setEditingArtisan(artisan);
      setArtisanName(artisan.name);
      setArtisanPhone(artisan.phone);
      setArtisanSpecialty(artisan.specialty);
      setArtisanStatus(artisan.status);
      setArtisanNotes(artisan.notes || '');
    } else {
      setEditingArtisan(null);
      setArtisanName('');
      setArtisanPhone('');
      setArtisanSpecialty('Couturier Principal');
      setArtisanStatus('Disponible');
      setArtisanNotes('');
    }
    setIsArtisanModalOpen(true);
  };

  const handleSaveArtisan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artisanName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    if (editingArtisan) {
      const updated = artisans.map(art => {
        if (art.id === editingArtisan.id) {
          return {
            ...art,
            name: artisanName,
            phone: artisanPhone,
            specialty: artisanSpecialty,
            status: artisanStatus,
            notes: artisanNotes
          };
        }
        return art;
      });
      syncArtisans(updated);
      
      // Update artisanName on historical assignments
      const updatedAssignments = assignments.map(a => 
        a.artisanId === editingArtisan.id ? { ...a, artisanName } : a
      );
      syncAssignments(updatedAssignments);

      // Update artisanName on historical payments
      const updatedPayments = payments.map(p => 
        p.artisanId === editingArtisan.id ? { ...p, artisanName } : p
      );
      syncPayments(updatedPayments);

      toast.success('Artisan modifié avec succès');
    } else {
      const newArtisan: Artisan = {
        id: 'art-' + Date.now(),
        name: artisanName,
        phone: artisanPhone,
        specialty: artisanSpecialty,
        status: artisanStatus,
        notes: artisanNotes,
        createdAt: new Date().toISOString()
      };
      syncArtisans([newArtisan, ...artisans]);
      toast.success('Nouvel artisan ajouté au personnel');
    }
    setIsArtisanModalOpen(false);
  };

  const handleDeleteArtisan = (id: string) => {
    if (confirm('Voulez-vous vraiment retirer cet artisan ? Les historiques de paiement seront préservés.')) {
      const updated = artisans.filter(a => a.id !== id);
      syncArtisans(updated);
      toast.success('Artisan retiré');
      if (selectedArtisanId === id) {
        setSelectedArtisanId(null);
      }
    }
  };

  // Assignment Modal Handlers
  const openAssignmentForm = (asg: TaskAssignment | null = null) => {
    if (asg) {
      setEditingAssignment(asg);
      setAssignOrderId(asg.orderId);
      setAssignArtisanId(asg.artisanId);
      setAssignTaskDesc(asg.taskDescription);
      setAssignPieceRate(asg.pieceRateAmount);
      setAssignDueDate(asg.dueDate);
      setAssignStatus(asg.status);
    } else {
      setEditingAssignment(null);
      setAssignOrderId('');
      setAssignArtisanId(artisans[0]?.id || '');
      setAssignTaskDesc('');
      setAssignPieceRate(5000);
      setAssignDueDate(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
      setAssignStatus('A faire');
    }
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignArtisanId) {
      toast.error('Veuillez affecter un artisan');
      return;
    }
    if (!assignTaskDesc.trim()) {
      toast.error('La description de la tâche est obligatoire');
      return;
    }

    const selectedArtisan = artisans.find(a => a.id === assignArtisanId);
    if (!selectedArtisan) {
      toast.error('Artisan introuvable');
      return;
    }

    let orderClient = 'Client Externe';
    let orderModel = 'Modèle Sur-Mesure';

    if (assignOrderId) {
      const foundOrder = orders.find(o => o.id === assignOrderId);
      if (foundOrder) {
        orderClient = foundOrder.clientName || 'Client';
        orderModel = foundOrder.model || 'Modèle';
      }
    }

    if (editingAssignment) {
      const updated = assignments.map(a => {
        if (a.id === editingAssignment.id) {
          const isMarkedCompletedNow = assignStatus === 'Terminé' && a.status !== 'Terminé';
          return {
            ...a,
            orderId: assignOrderId || 'ext-task',
            orderClientName: orderClient,
            orderModelName: orderModel,
            artisanId: assignArtisanId,
            artisanName: selectedArtisan.name,
            taskDescription: assignTaskDesc,
            pieceRateAmount: Number(assignPieceRate),
            status: assignStatus,
            dueDate: assignDueDate,
            completedAt: isMarkedCompletedNow ? new Date().toISOString() : a.completedAt,
            payoutStatus: assignStatus === 'Terminé' ? a.payoutStatus : 'Non payé' // reset payout if status set back
          };
        }
        return a;
      });
      syncAssignments(updated);
      toast.success('Assignation mise à jour');
    } else {
      const newAsg: TaskAssignment = {
        id: 'asg-' + Date.now(),
        orderId: assignOrderId || 'ext-task',
        orderClientName: orderClient,
        orderModelName: orderModel,
        artisanId: assignArtisanId,
        artisanName: selectedArtisan.name,
        taskDescription: assignTaskDesc,
        pieceRateAmount: Number(assignPieceRate),
        status: assignStatus,
        dueDate: assignDueDate,
        payoutStatus: 'Non payé',
        createdAt: new Date().toISOString(),
        completedAt: assignStatus === 'Terminé' ? new Date().toISOString() : undefined
      };
      syncAssignments([newAsg, ...assignments]);
      
      // Auto switch artisan status to Occupé if busy task assigned
      if (selectedArtisan.status === 'Disponible' && assignStatus === 'En cours') {
        const updatedArtisans = artisans.map(art => 
          art.id === selectedArtisan.id ? { ...art, status: 'Occupé' as const } : art
        );
        syncArtisans(updatedArtisans);
      }

      toast.success('Tâche assignée avec succès');
    }
    setIsAssignmentModalOpen(false);
  };

  const handleUpdateAsgStatus = (id: string, nextStatus: TaskAssignment['status']) => {
    const updated = assignments.map(a => {
      if (a.id === id) {
        const isCompleted = nextStatus === 'Terminé';
        return {
          ...a,
          status: nextStatus,
          completedAt: isCompleted ? new Date().toISOString() : a.completedAt
        };
      }
      return a;
    });
    syncAssignments(updated);
    toast.success(`Statut mis à jour : ${nextStatus}`);
  };

  const handleDeleteAssignment = (id: string) => {
    if (confirm('Voulez-vous supprimer cette assignation ?')) {
      const updated = assignments.filter(a => a.id !== id);
      syncAssignments(updated);
      toast.success('Assignation supprimée');
    }
  };

  // Payment Modal Handlers
  const openPaymentForm = (artisanId: string = '') => {
    setPayArtisanId(artisanId || artisans[0]?.id || '');
    setPayAmount(10000);
    setPayMethod('Espèces');
    setPayNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payArtisanId) {
      toast.error('Sélectionnez un artisan');
      return;
    }
    if (payAmount <= 0) {
      toast.error('Le montant doit être positif');
      return;
    }

    const selectedArtisan = artisans.find(a => a.id === payArtisanId);
    if (!selectedArtisan) {
      toast.error('Artisan introuvable');
      return;
    }

    const newPay: ArtisanPayment = {
      id: 'pay-' + Date.now(),
      artisanId: payArtisanId,
      artisanName: selectedArtisan.name,
      amount: Number(payAmount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: payMethod,
      notes: payNotes.trim() || undefined
    };

    syncPayments([newPay, ...payments]);
    toast.success(`Paiement de ${Number(payAmount).toLocaleString('fr-FR')} ${currency} enregistré pour ${selectedArtisan.name}`);
    setIsPaymentModalOpen(false);
  };

  const handleDeletePayment = (id: string) => {
    if (confirm('Supprimer ce versement d\'acompte ?')) {
      const updated = payments.filter(p => p.id !== id);
      syncPayments(updated);
      toast.success('Versement annulé');
    }
  };

  // Filtering lists
  const getFilteredArtisans = () => {
    let list = [...artisans];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.phone.includes(query) ||
        a.specialty.toLowerCase().includes(query)
      );
    }
    if (filterSpecialty !== 'all') {
      list = list.filter(a => a.specialty === filterSpecialty);
    }
    return list;
  };

  const getFilteredAssignments = () => {
    let list = [...assignments];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(a => 
        a.artisanName.toLowerCase().includes(query) ||
        a.taskDescription.toLowerCase().includes(query) ||
        a.orderClientName.toLowerCase().includes(query) ||
        a.orderModelName.toLowerCase().includes(query)
      );
    }
    if (filterAssignStatus !== 'all') {
      list = list.filter(a => a.status === filterAssignStatus);
    }
    return list;
  };

  const filteredArtisans = getFilteredArtisans();
  const filteredAssignments = getFilteredAssignments();

  return (
    <motion.div 
      id="tailleur-artisans-container"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 text-left font-sans"
    >
      {/* Upper Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Atelier & Artisans</h2>
            <p className="text-xs text-gray-500 font-medium">Gérez votre personnel couture, assignez les tâches aux commandes et suivez les paiements à la pièce.</p>
          </div>
        </div>

        {/* Local Tab Navigation */}
        <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl self-start md:self-center gap-1">
          <button
            onClick={() => { setSubTab('artisans'); setSelectedArtisanId(null); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'artisans' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <UserCheck className="w-3.5 h-3.5 inline mr-1.5" /> Équipe & Statuts
          </button>
          <button
            onClick={() => setSubTab('assignments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'assignments' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Scissors className="w-3.5 h-3.5 inline mr-1.5" /> Plan de Travail (Assignations)
          </button>
          <button
            onClick={() => setSubTab('payments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'payments' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Wallet className="w-3.5 h-3.5 inline mr-1.5" /> Rémunérations à la Pièce
          </button>
        </div>
      </div>

      {/* Mini Financial Dashboard banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Terminé (À payer)</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{totalEarnedAll.toLocaleString('fr-FR')} <span className="text-xs text-gray-500">{currency}</span></p>
          </div>
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wider">Acomptes versés</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{totalPaidAll.toLocaleString('fr-FR')} <span className="text-xs text-gray-500">{currency}</span></p>
          </div>
          <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border flex items-center justify-between ${remainingDueAll > 0 ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${remainingDueAll > 0 ? 'text-amber-700' : 'text-gray-500'}`}>Solde dû restant</span>
            <p className="text-xl font-bold text-gray-900 mt-1">{remainingDueAll.toLocaleString('fr-FR')} <span className="text-xs text-gray-500">{currency}</span></p>
          </div>
          <div className={`p-2.5 rounded-xl ${remainingDueAll > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
            <History className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SUB TAB 1: ARTISANS LIST & MANAGEMENT */}
      {subTab === 'artisans' && (
        <div className="space-y-6">
          {/* Filters & Actions row */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 md:flex-initial min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un artisan (Nom, tél)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="all">Toutes les spécialités</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={() => openArtisanForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer self-stretch md:self-auto justify-center"
            >
              <UserPlus className="w-4 h-4" /> Recruter un Artisan
            </button>
          </div>

          {/* Artisans Grid Cards */}
          {filteredArtisans.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucun artisan trouvé</p>
              <p className="text-xs text-gray-400">Modifiez votre recherche ou recrutez votre premier équipier.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredArtisans.map((artisan) => {
                const stats = getArtisanStats(artisan.id);
                return (
                  <div
                    key={artisan.id}
                    className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                  >
                    {/* Status corner tag */}
                    <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      artisan.status === 'Disponible' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      artisan.status === 'Occupé' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      ● {artisan.status}
                    </span>

                    <div className="space-y-4">
                      {/* Name & Specialty */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider bg-violet-50 px-2 py-0.5 rounded-md">{artisan.specialty}</span>
                        <h4 className="font-bold text-gray-900 text-sm mt-2">{artisan.name}</h4>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{artisan.phone}</p>
                      </div>

                      {/* Brief description */}
                      {artisan.notes && (
                        <p className="text-xs text-gray-600 italic line-clamp-2 h-8 leading-relaxed">
                          "{artisan.notes}"
                        </p>
                      )}

                      {/* Mini stats table */}
                      <div className="grid grid-cols-3 gap-1 pt-3 border-t border-gray-100 text-center text-gray-600">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Assigné</p>
                          <p className="text-xs font-bold text-gray-800">{stats.assignedCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">En cours</p>
                          <p className="text-xs font-bold text-amber-600">{stats.inProgressCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Solde Dû</p>
                          <p className={`text-xs font-bold ${stats.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{stats.balance.toLocaleString('fr-FR')} F</p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-50">
                      <button
                        onClick={() => {
                          setSelectedArtisanId(artisan.id);
                          setSubTab('fiche_artisan');
                        }}
                        className="flex-1 py-2 text-center bg-gray-50 hover:bg-violet-50 hover:text-violet-700 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                      >
                        Voir Fiche de Paie
                      </button>
                      <button
                        onClick={() => openArtisanForm(artisan)}
                        className="p-2 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteArtisan(artisan.id)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: ASSIGNMENTS / PLAN DE TRAVAIL */}
      {subTab === 'assignments' && (
        <div className="space-y-6">
          {/* Controls row */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 md:flex-initial min-w-[240px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par artisan, tâche, client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                <select
                  value={filterAssignStatus}
                  onChange={(e) => setFilterAssignStatus(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                >
                  <option value="all">Tous les statuts de tâche</option>
                  <option value="A faire">À faire</option>
                  <option value="En cours">En cours</option>
                  <option value="A valider">À valider</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => openAssignmentForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer self-stretch md:self-auto justify-center"
            >
              <Plus className="w-4 h-4" /> Assigner un Travail
            </button>
          </div>

          {/* Assignments table or card list */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucune assignation en cours</p>
              <p className="text-xs text-gray-400">Distribuez du travail en cliquant sur 'Assigner un Travail'.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssignments.map((asg) => (
                <div
                  key={asg.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow relative text-left flex flex-col justify-between"
                >
                  {/* Status ribbon */}
                  <span className={`absolute top-4 right-4 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    asg.status === 'A faire' ? 'bg-gray-100 text-gray-600' :
                    asg.status === 'En cours' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    asg.status === 'A valider' ? 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {asg.status}
                  </span>

                  <div className="space-y-4">
                    {/* Artisan */}
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Artisan Affecté</span>
                      <h4 className="font-bold text-gray-900 text-sm mt-0.5">{asg.artisanName}</h4>
                    </div>

                    {/* Task Info */}
                    <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 space-y-1.5">
                      <p className="text-xs font-bold text-gray-800 line-clamp-1">{asg.taskDescription}</p>
                      
                      {/* Linked order info */}
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                        <Info className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">Pour {asg.orderClientName} ({asg.orderModelName})</span>
                      </div>
                    </div>

                    {/* Financial rate & due date */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Rémunération</p>
                        <p className="text-xs font-bold text-violet-700 mt-0.5">{asg.pieceRateAmount.toLocaleString('fr-FR')} {currency}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">Date limite</p>
                        <p className="text-xs font-bold text-gray-800 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-pink-500" /> {asg.dueDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons inside assignment card */}
                  <div className="flex items-center justify-between gap-2 border-t border-gray-50 mt-4 pt-4">
                    {/* Fast Status cycle actions */}
                    {asg.status === 'A faire' && (
                      <button
                        onClick={() => handleUpdateAsgStatus(asg.id, 'En cours')}
                        className="flex-1 py-1.5 text-center bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Démarrer
                      </button>
                    )}
                    {asg.status === 'En cours' && (
                      <button
                        onClick={() => handleUpdateAsgStatus(asg.id, 'A valider')}
                        className="flex-1 py-1.5 text-center bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Soumettre validation
                      </button>
                    )}
                    {asg.status === 'A valider' && (
                      <button
                        onClick={() => handleUpdateAsgStatus(asg.id, 'Terminé')}
                        className="flex-1 py-1.5 text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approuver (Prêt à payer)
                      </button>
                    )}
                    {asg.status === 'Terminé' && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Validé & Payé à la pièce
                      </span>
                    )}

                    {/* Secondary menu */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openAssignmentForm(asg)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: REMUNERATIONS / HISTORIQUE PAIEMENTS */}
      {subTab === 'payments' && (
        <div className="space-y-6">
          {/* Header & Payment Action */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h3 className="text-base font-bold text-gray-900">Historique des Versements et Acomptes</h3>
            <button
              onClick={() => openPaymentForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" /> Enregistrer un Paiement
            </button>
          </div>

          {/* Payments Table */}
          {payments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucun paiement enregistré</p>
              <p className="text-xs text-gray-400">Enregistrez les acomptes versés aux tailleurs de votre équipe.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="py-4 px-5">Artisan</th>
                      <th className="py-4 px-5">Date</th>
                      <th className="py-4 px-5">Moyen de Paiement</th>
                      <th className="py-4 px-5">Notes / Objet</th>
                      <th className="py-4 px-5 text-right">Montant</th>
                      <th className="py-4 px-5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-gray-900">{p.artisanName}</td>
                        <td className="py-3.5 px-5 font-mono">{p.paymentDate}</td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[10px]">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400" /> {p.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 max-w-[200px] truncate">{p.notes || <span className="text-gray-400 italic">Aucune note</span>}</td>
                        <td className="py-3.5 px-5 text-right font-bold text-emerald-600">{p.amount.toLocaleString('fr-FR')} {currency}</td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 4: FICHE ARTISAN INDIVIDUELLE */}
      {subTab === 'fiche_artisan' && (
        <div className="space-y-6">
          {/* Artisan selection */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSubTab('artisans'); setSelectedArtisanId(null); }}
                className="p-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-base font-bold text-gray-900">Fiche de Règlement Individuelle</h3>
                <p className="text-xs text-gray-500 font-medium">Bilan comptable à la pièce pour un artisan de votre choix.</p>
              </div>
            </div>

            {/* Selection dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-600 shrink-0">Artisan :</label>
              <select
                value={selectedArtisanId || ''}
                onChange={(e) => setSelectedArtisanId(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="">Sélectionner un artisan...</option>
                {artisans.map(art => <option key={art.id} value={art.id}>{art.name} ({art.specialty})</option>)}
              </select>
            </div>
          </div>

          {/* Selected Artisan summary info */}
          {selectedArtisanId ? (() => {
            const artisan = artisans.find(a => a.id === selectedArtisanId);
            if (!artisan) return <p className="text-xs text-gray-500">Artisan non trouvé.</p>;

            const stats = getArtisanStats(selectedArtisanId);
            const artisanTasks = assignments.filter(a => a.artisanId === selectedArtisanId);
            const artisanPayouts = payments.filter(p => p.artisanId === selectedArtisanId);

            return (
              <div className="space-y-6">
                {/* Visual statistics badge */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Rôle principal</p>
                    <p className="text-sm font-bold text-violet-700">{artisan.specialty}</p>
                    <p className="text-[11px] text-gray-500">Recruté le {new Date(artisan.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Travaux Validés</p>
                    <p className="text-lg font-bold text-emerald-600 mt-1">{stats.completedCount} / {stats.assignedCount}</p>
                    <p className="text-[10px] text-gray-500 font-medium">confections terminées</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Total Dû (Cumulé)</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{stats.totalEarned.toLocaleString('fr-FR')} {currency}</p>
                    <p className="text-[10px] text-gray-500 font-medium">pour travaux livrés</p>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Solde restant dû</p>
                    <p className={`text-lg font-bold mt-1 ${stats.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {stats.balance.toLocaleString('fr-FR')} {currency}
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium">prêt pour versement</p>
                  </div>
                </div>

                {/* Grid for two list sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-left">
                  {/* Left Column: Tasks / Works list */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <Scissors className="w-4 h-4 text-violet-500" /> Tâches et Confections
                      </h4>
                      <button
                        onClick={() => {
                          openAssignmentForm();
                          setAssignArtisanId(selectedArtisanId);
                        }}
                        className="text-[11px] font-bold text-violet-700 hover:underline cursor-pointer"
                      >
                        + Assigner tâche
                      </button>
                    </div>

                    {artisanTasks.length === 0 ? (
                      <p className="text-xs text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">Aucune tâche assignée à cet artisan.</p>
                    ) : (
                      <div className="space-y-3">
                        {artisanTasks.map(task => (
                          <div key={task.id} className="p-3.5 border border-gray-100 rounded-xl bg-white hover:border-violet-200 transition-all flex items-center justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-gray-800">{task.taskDescription}</p>
                              <p className="text-[10px] text-gray-500 font-medium">Pour {task.orderClientName} • {task.orderModelName}</p>
                              <span className={`inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                                task.status === 'Terminé' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {task.status}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-violet-700">{task.pieceRateAmount.toLocaleString('fr-FR')} {currency}</p>
                              <p className="text-[10px] text-gray-400 mt-1">Limite : {task.dueDate}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Historical Payments & Advances */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-emerald-500" /> Historique des Paiements
                      </h4>
                      <button
                        onClick={() => openPaymentForm(selectedArtisanId)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        + Verser acompte
                      </button>
                    </div>

                    {artisanPayouts.length === 0 ? (
                      <p className="text-xs text-gray-500 py-6 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">Aucun versement n'a encore été enregistré.</p>
                    ) : (
                      <div className="space-y-3">
                        {artisanPayouts.map(pay => (
                          <div key={pay.id} className="p-3.5 border border-gray-100 rounded-xl bg-white hover:border-emerald-200 transition-all flex items-center justify-between gap-2">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-emerald-700">Versement de fonds</p>
                              <p className="text-[10px] text-gray-500 font-medium">Via {pay.paymentMethod} {pay.notes ? `• ${pay.notes}` : ''}</p>
                              <p className="text-[9px] text-gray-400 font-mono">{pay.paymentDate}</p>
                            </div>
                            <div className="text-right shrink-0 flex items-center gap-2">
                              <p className="text-xs font-bold text-emerald-600">-{pay.amount.toLocaleString('fr-FR')} {currency}</p>
                              <button
                                onClick={() => handleDeletePayment(pay.id)}
                                className="p-1 text-gray-400 hover:text-rose-500 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Sélectionnez un artisan pour commencer</p>
              <p className="text-xs text-gray-400">Choisissez un artisan dans la liste déroulante ci-dessus pour examiner son solde, ses acomptes et ses tâches.</p>
            </div>
          )}
        </div>
      )}

      {/* --- MODALS SECTION --- */}

      {/* 1. ARTISAN MODAL */}
      <AnimatePresence>
        {isArtisanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl border border-gray-100 text-left"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-violet-50/50">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <UserCheck className="w-5 h-5 text-violet-600" />
                  {editingArtisan ? 'Modifier l\'artisan' : 'Embaucher un artisan'}
                </h4>
                <button
                  onClick={() => setIsArtisanModalOpen(false)}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveArtisan} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={artisanName}
                    onChange={(e) => setArtisanName(e.target.value)}
                    placeholder="Ex : Modou Fall"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">N° Téléphone</label>
                  <input
                    type="tel"
                    value={artisanPhone}
                    onChange={(e) => setArtisanPhone(e.target.value)}
                    placeholder="Ex : +221 77 123 45 67"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Spécialité</label>
                    <select
                      value={artisanSpecialty}
                      onChange={(e) => setArtisanSpecialty(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold cursor-pointer"
                    >
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Disponibilité</label>
                    <select
                      value={artisanStatus}
                      onChange={(e) => setArtisanStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold cursor-pointer"
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="Occupé">Occupé</option>
                      <option value="En congé">En congé</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Notes internes / Expérience</label>
                  <textarea
                    value={artisanNotes}
                    onChange={(e) => setArtisanNotes(e.target.value)}
                    placeholder="Ajoutez des détails sur ses compétences (ex: expert broderie, tailleur veste)..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-medium h-20 resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsArtisanModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" /> Enregistrer l'artisan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ASSIGNMENT MODAL */}
      <AnimatePresence>
        {isAssignmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl border border-gray-100 text-left"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-violet-50/50">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Scissors className="w-5 h-5 text-violet-600" />
                  {editingAssignment ? 'Modifier l\'assignation' : 'Assigner une tâche à la pièce'}
                </h4>
                <button
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Attribuer à un artisan</label>
                  <select
                    value={assignArtisanId}
                    onChange={(e) => setAssignArtisanId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="">Sélectionner l'artisan...</option>
                    {artisans.map(a => <option key={a.id} value={a.id}>{a.name} ({a.specialty})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Associer à une commande client (Optionnel)</label>
                  <select
                    value={assignOrderId}
                    onChange={(e) => setAssignOrderId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="">-- Confection hors commande client --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>{o.clientName} - {o.model} ({o.status})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Description du travail requis</label>
                  <input
                    type="text"
                    required
                    value={assignTaskDesc}
                    onChange={(e) => setAssignTaskDesc(e.target.value)}
                    placeholder="Ex: Assemblage de la robe de mariage et fermeture éclair"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Prix à la pièce ({currency})</label>
                    <input
                      type="number"
                      required
                      value={assignPieceRate}
                      onChange={(e) => setAssignPieceRate(Number(e.target.value))}
                      placeholder="Ex : 5000"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Date de rendu limite</label>
                    <input
                      type="date"
                      required
                      value={assignDueDate}
                      onChange={(e) => setAssignDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Statut initial de la tâche</label>
                  <select
                    value={assignStatus}
                    onChange={(e) => setAssignStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="A faire">À faire (To Do)</option>
                    <option value="En cours">En cours (In Progress)</option>
                    <option value="A valider">À valider (Review)</option>
                    <option value="Terminé">Terminé (Done & Approved)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAssignmentModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Save className="w-4 h-4" /> Enregistrer la tâche
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. PAYMENT MODAL */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl border border-gray-100 text-left"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Régler un Artisan (Acompte / Solde)
                </h4>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Artisan destinataire</label>
                  <select
                    value={payArtisanId}
                    onChange={(e) => setPayArtisanId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="">Sélectionner l'artisan...</option>
                    {artisans.map(a => {
                      const stats = getArtisanStats(a.id);
                      return (
                        <option key={a.id} value={a.id}>{a.name} (Solde dû: {stats.balance} F)</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Montant versé ({currency})</label>
                  <input
                    type="number"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    placeholder="Ex: 10000"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Moyen de transaction</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="Espèces">Espèces</option>
                    <option value="Wave">Wave</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Notes ou libellé (Optionnel)</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Ex: Avance sur robe d'apparat du 24/06"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Confirmer le paiement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
