import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Scissors, Palette, DollarSign, Calendar, Clock, 
  CheckCircle2, AlertCircle, Plus, Trash2, Edit, Save, Search, 
  ArrowLeft, Filter, Wallet, Receipt, CreditCard, ChevronRight, Check,
  UserCheck, History, Award, Info, Landmark, HelpCircle, X, Printer, Download
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
  specialty: string;
  status: 'Disponible' | 'Occupé' | 'En congé';
  notes?: string;
  createdAt: string;
  remunerationType?: 'Pièce' | 'Salarié' | 'Mensuel' | 'Hebdomadaire' | 'Journalier';
  monthlySalary?: number;
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

interface SalaryPayment {
  id: string;
  artisanId: string;
  artisanName: string;
  amount: number;
  month: string; // e.g. "2026-06"
  paymentDate: string;
  paymentMethod: 'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Autre';
  notes?: string;
}

interface TailleurArtisansManagerProps {
  merchant: Merchant;
}

const SPECIALTIES = [
  'Couturier(e) Principal',
  'Couturier(e)',
  'Brodeur',
  'Apprenti',
  'Finisseur',
  'Styliste'
] as const;

const isSalariedType = (type?: string) => {
  return type === 'Salarié' || type === 'Mensuel' || type === 'Hebdomadaire' || type === 'Journalier';
};

const getProfileBadge = (type?: string) => {
  if (type === 'Hebdomadaire') {
    return {
      label: 'Hebdomadaire',
      desc: 'Il est payé chaque semaine',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }
  if (type === 'Journalier') {
    return {
      label: 'Journalier',
      desc: 'Il est payé chaque jour',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
    };
  }
  if (type === 'Mensuel' || type === 'Salarié') {
    return {
      label: 'Mensuel',
      desc: 'Il est payé chaque mois',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }
  return {
    label: 'Rémunération à la pièce',
    desc: 'Il est payé à la tâche',
    bg: 'bg-violet-50 text-violet-700 border-violet-200',
  };
};

const getArtisanCategoryKey = (remunerationType?: string): 'piece' | 'mensuel' | 'hebdomadaire' | 'journalier' => {
  if (remunerationType === 'Hebdomadaire') return 'hebdomadaire';
  if (remunerationType === 'Journalier') return 'journalier';
  if (remunerationType === 'Mensuel' || remunerationType === 'Salarié') return 'mensuel';
  return 'piece';
};

const ARTISAN_CATEGORIES = [
  {
    key: 'piece' as const,
    label: 'Rémunération à la pièce',
    shortLabel: 'À la pièce',
    desc: 'Il est payé à la tâche',
    bg: 'bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100/50',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-100',
    ringColor: 'focus:ring-violet-500',
    activeBg: 'bg-violet-600 text-white shadow-sm'
  },
  {
    key: 'mensuel' as const,
    label: 'Mensuel',
    shortLabel: 'Mensuel',
    desc: 'Il est payé chaque mois',
    bg: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100/50',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
    ringColor: 'focus:ring-blue-500',
    activeBg: 'bg-blue-600 text-white shadow-sm'
  },
  {
    key: 'hebdomadaire' as const,
    label: 'Hebdomadaire',
    shortLabel: 'Hebdomadaire',
    desc: 'Il est payé chaque semaine',
    bg: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100/50',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
    ringColor: 'focus:ring-amber-500',
    activeBg: 'bg-amber-600 text-white shadow-sm'
  },
  {
    key: 'journalier' as const,
    label: 'Journalier',
    shortLabel: 'Journalier',
    desc: 'Il est payé chaque jour',
    bg: 'bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100/50',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-100',
    ringColor: 'focus:ring-teal-500',
    activeBg: 'bg-teal-600 text-white shadow-sm'
  }
];

const getProfilePaymentLabel = (type?: string) => {
  if (type === 'Pièce') return 'Rémunération à la pièce';
  if (type === 'Hebdomadaire') return 'Rémunération hebdomadaire';
  if (type === 'Journalier') return 'Rémunération journalière';
  if (type === 'Salarié') return 'Rémunération mensuelle (Salarié)';
  return 'Rémunération mensuelle';
};

const getSalaryLabel = (type?: string) => {
  if (type === 'Hebdomadaire') return 'Salaire Hebdomadaire';
  if (type === 'Journalier') return 'Tarif Journalier';
  return 'Salaire Mensuel';
};

const getPeriodLabel = (type?: string) => {
  if (type === 'Hebdomadaire') return 'Semaine concernée';
  if (type === 'Journalier') return 'Jour concerné';
  return 'Mois concerné';
};

const getPeriodInputType = (type?: string) => {
  if (type === 'Journalier' || type === 'Hebdomadaire') return 'date';
  return 'month';
};

export const TailleurArtisansManager = ({ merchant }: TailleurArtisansManagerProps) => {
  const currency = merchant.currency || 'FCFA';

  // Base list states
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [payments, setPayments] = useState<ArtisanPayment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<'artisans' | 'assignments' | 'payments' | 'fiche_artisan' | 'salaries_mensuel' | 'salaries_hebdomadaire' | 'salaries_journalier'>('artisans');
  
  // Selection / Detail state
  const [selectedArtisanId, setSelectedArtisanId] = useState<string | null>(null);

  // Modals state
  const [isArtisanModalOpen, setIsArtisanModalOpen] = useState(false);
  const [editingArtisan, setEditingArtisan] = useState<Artisan | null>(null);
  
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TaskAssignment | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedPiecePayment, setSelectedPiecePayment] = useState<ArtisanPayment | null>(null);
  const [selectedSalaryPayment, setSelectedSalaryPayment] = useState<SalaryPayment | null>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Form Fields - Artisan
  const [artisanName, setArtisanName] = useState('');
  const [artisanPhone, setArtisanPhone] = useState('');
  const [artisanSpecialty, setArtisanSpecialty] = useState<string>('Couturier(e) Principal');
  const [artisanStatus, setArtisanStatus] = useState<Artisan['status']>('Disponible');
  const [artisanNotes, setArtisanNotes] = useState('');
  const [artisanRemunerationType, setArtisanRemunerationType] = useState<Artisan['remunerationType']>('Pièce');
  const [artisanMonthlySalary, setArtisanMonthlySalary] = useState<number>(150000);

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

  // Form Fields - Salary Payment
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [paySalaryArtisanId, setPaySalaryArtisanId] = useState('');
  const [paySalaryAmount, setPaySalaryAmount] = useState(150000);
  const [paySalaryMonth, setPaySalaryMonth] = useState(new Date().toISOString().substring(0, 7));
  const [paySalaryMethod, setPaySalaryMethod] = useState<'Espèces' | 'Wave' | 'Orange Money' | 'Chèque' | 'Autre'>('Espèces');
  const [paySalaryNotes, setPaySalaryNotes] = useState('');

  // Searches & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all');
  const [filterAssignStatus, setFilterAssignStatus] = useState<string>('all');
  const [artisanCategoryFilter, setArtisanCategoryFilter] = useState<'all' | 'piece' | 'mensuel' | 'hebdomadaire' | 'journalier'>('all');

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
            specialty: 'Couturier(e) Principal',
            status: 'Disponible',
            notes: 'Spécialiste du Basin Riche et du drapé haute couture.',
            createdAt: new Date().toISOString(),
            remunerationType: 'Pièce'
          },
          {
            id: 'art-2',
            name: 'Fatou Sow',
            phone: '+221 78 123 45 67',
            specialty: 'Brodeur',
            status: 'Occupé',
            notes: 'Expert broderies fils d\'or et motifs floraux traditionnels.',
            createdAt: new Date().toISOString(),
            remunerationType: 'Pièce'
          },
          {
            id: 'art-3',
            name: 'Ibrahima Ndiaye',
            phone: '+221 70 876 54 32',
            specialty: 'Apprenti',
            status: 'Disponible',
            notes: 'En formation. Assure le surfilage et les découpes de base.',
            createdAt: new Date().toISOString(),
            remunerationType: 'Pièce'
          },
          {
            id: 'art-4',
            name: 'Aminata Diallo',
            phone: '+221 76 998 88 77',
            specialty: 'Finisseur',
            status: 'Disponible',
            notes: 'S\'occupe de la pose des boutons, des ourlets fins et du repassage vapeur.',
            createdAt: new Date().toISOString(),
            remunerationType: 'Pièce'
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

      // Load Salary Payments
      const savedSalaryPayments = localStorage.getItem(`tailleur_salary_payments_${merchant.id}`);
      if (savedSalaryPayments) {
        setSalaryPayments(JSON.parse(savedSalaryPayments));
      } else {
        setSalaryPayments([]);
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

  const syncSalaryPayments = (newSalaryPayments: SalaryPayment[]) => {
    setSalaryPayments(newSalaryPayments);
    localStorage.setItem(`tailleur_salary_payments_${merchant.id}`, JSON.stringify(newSalaryPayments));
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
      setArtisanRemunerationType(artisan.remunerationType || 'Pièce');
      setArtisanMonthlySalary(artisan.monthlySalary || 150000);
    } else {
      setEditingArtisan(null);
      setArtisanName('');
      setArtisanPhone('');
      setArtisanSpecialty('Couturier(e) Principal');
      setArtisanStatus('Disponible');
      setArtisanNotes('');
      setArtisanRemunerationType('Pièce');
      setArtisanMonthlySalary(150000);
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
            notes: artisanNotes,
            remunerationType: artisanRemunerationType,
            monthlySalary: isSalariedType(artisanRemunerationType) ? Number(artisanMonthlySalary) : undefined
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
        remunerationType: artisanRemunerationType,
        monthlySalary: isSalariedType(artisanRemunerationType) ? Number(artisanMonthlySalary) : undefined,
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
    const defaultId = artisanId || (artisans.filter(a => a.remunerationType !== 'Salarié')[0]?.id || artisans[0]?.id || '');
    setPayArtisanId(defaultId);
    
    let defaultAmount = 10000;
    if (defaultId) {
      const stats = getArtisanStats(defaultId);
      if (stats.balance > 0) {
        defaultAmount = stats.balance;
      }
    }
    setPayAmount(defaultAmount);
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

  // Salary Payment Handlers
  const openSalaryForm = (artisanId: string = '') => {
    const salaried = artisans.filter(a => isSalariedType(a.remunerationType));
    const defaultId = artisanId || (salaried.length > 0 ? salaried[0].id : (artisans[0]?.id || ''));
    const selectedArtisan = artisans.find(a => a.id === defaultId);
    
    setPaySalaryArtisanId(defaultId);
    setPaySalaryAmount(selectedArtisan?.monthlySalary || 150000);
    if (selectedArtisan && (selectedArtisan.remunerationType === 'Journalier' || selectedArtisan.remunerationType === 'Hebdomadaire')) {
      setPaySalaryMonth(new Date().toISOString().split('T')[0]);
    } else {
      setPaySalaryMonth(new Date().toISOString().substring(0, 7));
    }
    setPaySalaryMethod('Espèces');
    setPaySalaryNotes('');
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalaryPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySalaryArtisanId) {
      toast.error('Sélectionnez un artisan');
      return;
    }
    if (paySalaryAmount <= 0) {
      toast.error('Le montant de la rémunération doit être positif');
      return;
    }

    const selectedArtisan = artisans.find(a => a.id === paySalaryArtisanId);
    if (!selectedArtisan) {
      toast.error('Artisan introuvable');
      return;
    }

    const formattedPeriod = formatMonthFrench(paySalaryMonth, selectedArtisan.remunerationType);

    const alreadyPaid = salaryPayments.find(p => p.artisanId === paySalaryArtisanId && p.month === paySalaryMonth);
    if (alreadyPaid) {
      if (!confirm(`Un règlement a déjà été enregistré pour ${selectedArtisan.name} pour la période : ${formattedPeriod}. Voulez-vous tout de même enregistrer un versement supplémentaire ?`)) {
        return;
      }
    }

    const newSalaryPay: SalaryPayment = {
      id: 'sal-pay-' + Date.now(),
      artisanId: paySalaryArtisanId,
      artisanName: selectedArtisan.name,
      amount: Number(paySalaryAmount),
      month: paySalaryMonth,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: paySalaryMethod,
      notes: paySalaryNotes.trim() || undefined
    };

    syncSalaryPayments([newSalaryPay, ...salaryPayments]);
    toast.success(`Règlement de ${Number(paySalaryAmount).toLocaleString('fr-FR')} ${currency} enregistré pour ${selectedArtisan.name} (${formattedPeriod})`);
    setIsSalaryModalOpen(false);
  };

  const handleDeleteSalaryPayment = (id: string) => {
    if (confirm('Supprimer ce règlement de salaire ?')) {
      const updated = salaryPayments.filter(p => p.id !== id);
      syncSalaryPayments(updated);
      toast.success('Règlement de salaire supprimé');
    }
  };

  // Payslip helper functions
  const formatMonthFrench = (monthStr: string, type?: string) => {
    if (!monthStr) return '';
    if (type === 'Journalier') {
      try {
        return 'Journée du ' + new Date(monthStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return 'Journée du ' + monthStr;
      }
    }
    if (type === 'Hebdomadaire') {
      try {
        const d = new Date(monthStr);
        return 'Semaine du ' + d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return 'Semaine du ' + monthStr;
      }
    }
    if (!monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const months: Record<string, string> = {
      '01': 'Janvier',
      '02': 'Février',
      '03': 'Mars',
      '04': 'Avril',
      '05': 'Mai',
      '06': 'Juin',
      '07': 'Juillet',
      '08': 'Août',
      '09': 'Septembre',
      '10': 'Octobre',
      '11': 'Novembre',
      '12': 'Décembre',
    };
    return `${months[month] || month} ${year}`;
  };

  const handlePrintPayslip = (slipHtml: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bulletin de Paie</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; background-color: #fff; }
              .container { max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 30px; border-radius: 8px; }
              @media print {
                body { padding: 0; background-color: #fff; }
                .container { border: none; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${slipHtml}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("Impossible d'ouvrir la fenêtre d'impression. Veuillez autoriser les fenêtres surgissantes (popups).");
    }
  };

  const generatePayslipHtml = (isSalary: boolean, payment: any, artisan: any) => {
    let title = "BON DE RÈGLEMENT À LA TÂCHE";
    if (isSalary) {
      if (artisan?.remunerationType === 'Hebdomadaire') {
        title = "BULLETIN DE PAIE HEBDOMADAIRE";
      } else if (artisan?.remunerationType === 'Journalier') {
        title = "BULLETIN DE PAIE JOURNALIER";
      } else {
        title = "BULLETIN DE PAIE MENSUEL";
      }
    }
    const periodLabel = isSalary ? getPeriodLabel(artisan?.remunerationType) : "Date du Versement";
    const periodValue = isSalary ? formatMonthFrench(payment.month, artisan?.remunerationType) : new Date(payment.paymentDate).toLocaleDateString('fr-FR');
    const detailsTitle = isSalary ? "DÉTAILS DU SALAIRE" : "DÉTAILS DU RÈGLEMENT";
    const amountFormatted = payment.amount.toLocaleString('fr-FR') + " " + currency;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fff; color: #1f2937;">
        <div style="text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #7c3aed; font-size: 22px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">${merchant.name}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #4b5563; font-weight: bold;">Atelier de Couture & Haute Couture</p>
          <p style="margin: 2px 0 0; font-size: 10px; color: #9ca3af;">Reçu généré le ${new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <span style="background-color: #f3e8ff; color: #7c3aed; font-weight: 800; font-size: 13px; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px;">
            ${title}
          </span>
        </div>

        <table style="width: 100%; margin-bottom: 25px; border-collapse: collapse; font-size: 12px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px;">
              <h4 style="margin: 0 0 6px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; font-weight: bold; letter-spacing: 0.3px;">Émetteur (Atelier)</h4>
              <p style="margin: 2px 0; font-weight: bold; font-size: 13px; color: #111827;">${merchant.name}</p>
              <p style="margin: 2px 0; font-size: 11px; color: #4b5563;">Gestion d'Atelier</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px;">
              <h4 style="margin: 0 0 6px 0; color: #6b7280; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; font-weight: bold; letter-spacing: 0.3px;">Bénéficiaire (Artisan)</h4>
              <p style="margin: 2px 0; font-weight: bold; font-size: 13px; color: #111827;">${artisan?.name || payment.artisanName}</p>
              <p style="margin: 2px 0; font-size: 11px; color: #4b5563;">Rôle : ${artisan?.specialty || "Artisan"}</p>
              <p style="margin: 2px 0; font-size: 11px; color: #4b5563;">Tél : ${artisan?.phone || "N/A"}</p>
            </td>
          </tr>
        </table>

        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #111827; font-size: 12px; font-weight: bold; text-transform: uppercase; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; letter-spacing: 0.3px;">
            ${detailsTitle}
          </h4>
          <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
            <tr style="height: 26px;">
              <td style="color: #4b5563; font-weight: 500;">Numéro de Reçu :</td>
              <td style="text-align: right; font-weight: bold; color: #111827; font-family: monospace;">${payment.id}</td>
            </tr>
            <tr style="height: 26px;">
              <td style="color: #4b5563; font-weight: 500;">${periodLabel} :</td>
              <td style="text-align: right; font-weight: bold; color: #111827;">${periodValue}</td>
            </tr>
            <tr style="height: 26px;">
              <td style="color: #4b5563; font-weight: 500;">Mode de Règlement :</td>
              <td style="text-align: right; font-weight: bold; color: #111827;">${payment.paymentMethod}</td>
            </tr>
            ${payment.notes ? `
            <tr style="height: 26px;">
              <td style="color: #4b5563; font-weight: 500; vertical-align: top; padding-top: 4px;">Libellé / Notes :</td>
              <td style="text-align: right; color: #111827; font-style: italic; max-width: 250px; word-wrap: break-word; padding-top: 4px;">${payment.notes}</td>
            </tr>
            ` : ''}
            ${isSalary && artisan?.monthlySalary ? `
            <tr style="height: 26px;">
              <td style="color: #4b5563; font-weight: 500;">${getSalaryLabel(artisan.remunerationType)} Contractuel :</td>
              <td style="text-align: right; font-weight: bold; color: #111827;">${artisan.monthlySalary.toLocaleString('fr-FR')} ${currency}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background-color: #f5f3ff; border: 1px dashed #c084fc; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; color: #7c3aed; font-weight: bold; letter-spacing: 0.5px;">Montant Net Payé</p>
          <h3 style="margin: 4px 0 0 0; font-size: 24px; color: #7c3aed; font-weight: 900;">${amountFormatted}</h3>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 11px; color: #4b5563;">
          <div style="width: 45%; border-top: 1px dashed #d1d5db; padding-top: 8px; text-align: center; height: 75px; display: flex; flex-direction: column; justify-content: space-between;">
            <span style="font-weight: bold; color: #1f2937;">Signature de l'Artisan</span>
            <span style="color: #9ca3af; font-style: italic;">Pour acquit</span>
          </div>
          <div style="width: 45%; border-top: 1px dashed #d1d5db; padding-top: 8px; text-align: center; height: 75px; display: flex; flex-direction: column; justify-content: space-between;">
            <span style="font-weight: bold; color: #1f2937;">Pour l'Atelier (L'Employeur)</span>
            <span style="color: #9ca3af; font-style: italic;">Signature & Cachet</span>
          </div>
        </div>
      </div>
    `;
  };

  const loadHtml2Pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          reject(new Error('html2pdf global not found'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load html2pdf from CDN'));
      document.body.appendChild(script);
    });
  };

  const handleDownloadPayslip = async (isSalary: boolean, payment: any, artisanName: string) => {
    const artisan = artisans.find(a => a.id === payment.artisanId);
    const toastId = toast.loading("Génération du PDF...");
    try {
      const html2pdfLib = await loadHtml2Pdf();
      
      // Create a temporary container offscreen but attached to DOM for layout and paint calculations
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '600px';
      container.style.backgroundColor = '#ffffff';
      container.innerHTML = generatePayslipHtml(isSalary, payment, artisan);
      
      document.body.appendChild(container);
      
      // CRITICAL: Wait 350ms to let the browser fully reflow, layout, and paint the new element.
      // Without this, html2canvas captures a blank/empty element with 0 height before it's rendered.
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const fileName = `Bulletin_${artisanName.replace(/\s+/g, '_')}_${isSalary ? payment.month : payment.paymentDate}.pdf`;
      
      const opt = {
        margin:       [12, 12, 12, 12],
        filename:     fileName,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdfLib().from(container).set(opt).save();
      document.body.removeChild(container);
      toast.success("Bulletin de paie téléchargé en PDF !", { id: toastId });
    } catch (error) {
      console.error("Error generating PDF:", error);
      // Remove container if it was appended but failed during generation
      const existingContainer = document.querySelector('div[style*="left: -9999px"]');
      if (existingContainer && existingContainer.parentNode) {
        existingContainer.parentNode.removeChild(existingContainer);
      }
      toast.error("Échec de la génération du PDF. Téléchargement HTML de secours...", { id: toastId });
      
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <title>Bulletin_${artisanName}_${payment.id}</title>
          <style>
            body { background-color: #f3f4f6; padding: 40px; display: flex; justify-content: center; }
            @media print {
              body { background-color: #fff; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${generatePayslipHtml(isSalary, payment, artisan)}
        </body>
        </html>
      `;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fallbackFileName = `Bulletin_${artisanName.replace(/\s+/g, '_')}_${isSalary ? payment.month : payment.paymentDate}.html`;
      link.download = fallbackFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenPayslipPreview = (isSalary: boolean, payment: any) => {
    if (isSalary) {
      setSelectedSalaryPayment(payment);
      setSelectedPiecePayment(null);
    } else {
      setSelectedPiecePayment(payment);
      setSelectedSalaryPayment(null);
    }
    setIsPayslipModalOpen(true);
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
    if (artisanCategoryFilter !== 'all') {
      list = list.filter(a => getArtisanCategoryKey(a.remunerationType) === artisanCategoryFilter);
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
            <Wallet className="w-3.5 h-3.5 inline mr-1.5" /> Rémunération à la pièce
          </button>
          <button
            onClick={() => setSubTab('salaries_mensuel')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'salaries_mensuel' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1.5" /> Rémunération Mensuelle
          </button>
          <button
            onClick={() => setSubTab('salaries_hebdomadaire')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'salaries_hebdomadaire' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1.5" /> Rémunération Hebdomadaire
          </button>
          <button
            onClick={() => setSubTab('salaries_journalier')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${subTab === 'salaries_journalier' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1.5" /> Rémunération Journalière
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

          {/* Sub-tab segment for payment profiles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 p-1.5 bg-gray-50 border border-gray-100 rounded-2xl">
            <button
              onClick={() => setArtisanCategoryFilter('all')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer border text-center ${
                artisanCategoryFilter === 'all' 
                  ? 'bg-white border-violet-200 text-violet-700 shadow-sm font-bold' 
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-900 font-medium'
              }`}
            >
              <Users className="w-5 h-5 mb-1 text-violet-600" />
              <span className="text-xs font-bold">Toute l'équipe</span>
              <span className="text-[9px] text-gray-400 mt-0.5">{artisans.length} membres</span>
            </button>

            {ARTISAN_CATEGORIES.map(cat => {
              const count = artisans.filter(a => getArtisanCategoryKey(a.remunerationType) === cat.key).length;
              const IconComponent = cat.key === 'piece' ? Scissors : cat.key === 'mensuel' ? Calendar : cat.key === 'hebdomadaire' ? Clock : Clock;
              const isActive = artisanCategoryFilter === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setArtisanCategoryFilter(cat.key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer border text-center ${
                    isActive 
                      ? 'bg-white border-violet-200 text-violet-700 shadow-sm font-bold' 
                      : 'bg-transparent border-transparent text-gray-500 hover:text-gray-900 font-medium'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 mb-1 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold truncate max-w-full">{cat.shortLabel}</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">{count} {count > 1 ? 'membres' : 'membre'}</span>
                </button>
              );
            })}
          </div>

          {/* Active Category Header & Desc */}
          <div className="bg-violet-50/20 border border-violet-100 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {artisanCategoryFilter === 'all' ? 'Toute l’Équipe' : ARTISAN_CATEGORIES.find(c => c.key === artisanCategoryFilter)?.label}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {artisanCategoryFilter === 'all' 
                  ? 'Consultez la liste complète des artisans de l’atelier et leur mode de rémunération.' 
                  : ARTISAN_CATEGORIES.find(c => c.key === artisanCategoryFilter)?.desc}
              </p>
            </div>
            <div className="text-xs font-semibold text-gray-600 font-mono bg-white px-3 py-1 rounded-lg border border-gray-100 self-start md:self-auto">
              Total : {filteredArtisans.length} {filteredArtisans.length > 1 ? 'artisans' : 'artisan'}
            </div>
          </div>

          {/* Artisans Grid Cards */}
          {filteredArtisans.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-200 rounded-3xl">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-gray-500 font-bold mb-1">Aucun artisan trouvé</p>
              <p className="text-xs text-gray-400">Modifiez votre recherche, changez de filtre ou recrutez votre premier équipier.</p>
            </div>
          ) : artisanCategoryFilter !== 'all' ? (
            /* Single Category Grid */
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
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider bg-violet-50 px-2 py-0.5 rounded-md">{artisan.specialty}</span>
                          {(() => {
                            const badge = getProfileBadge(artisan.remunerationType);
                            return (
                              <span 
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`} 
                                title={badge.desc}
                              >
                                {badge.label}
                              </span>
                            );
                          })()}
                        </div>
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
          ) : (
            /* Grouped Categories View */
            <div className="space-y-10">
              {ARTISAN_CATEGORIES.map((category) => {
                const categoryArtisans = filteredArtisans.filter(
                  (a) => getArtisanCategoryKey(a.remunerationType) === category.key
                );

                if (categoryArtisans.length === 0) return null;

                return (
                  <div key={category.key} className="space-y-4">
                    {/* Category Title Header */}
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${category.badgeBg}`}>
                        {category.label}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">— {category.desc}</span>
                      <span className="text-[11px] font-mono text-gray-400 ml-auto bg-gray-100 px-2 py-0.5 rounded">
                        {categoryArtisans.length} {categoryArtisans.length > 1 ? 'membres' : 'membre'}
                      </span>
                    </div>

                    {/* Artisans Grid under Category */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {categoryArtisans.map((artisan) => {
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
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="text-[10px] uppercase font-bold text-violet-600 tracking-wider bg-violet-50 px-2 py-0.5 rounded-md">{artisan.specialty}</span>
                                  {(() => {
                                    const badge = getProfileBadge(artisan.remunerationType);
                                    return (
                                      <span 
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`} 
                                        title={badge.desc}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                </div>
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
              {filteredAssignments.map((asg) => {
                const artisanObj = artisans.find(a => a.id === asg.artisanId);
                const isSalaried = artisanObj?.remunerationType === 'Salarié';
                return (
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
                          <p className="text-[10px] text-gray-400 uppercase font-medium">
                            {isSalaried ? 'Type de Contrat' : 'Rémunération'}
                          </p>
                          <p className={`text-xs font-bold mt-0.5 ${isSalaried ? 'text-emerald-600' : 'text-violet-700'}`}>
                            {isSalaried ? 'Salarié (Mensuel)' : `${asg.pieceRateAmount.toLocaleString('fr-FR')} ${currency}`}
                          </p>
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
                          <Check className="w-3.5 h-3.5" /> {isSalaried ? 'Approuver (Travail validé)' : 'Approuver (Prêt à payer)'}
                        </button>
                      )}
                      {asg.status === 'Terminé' && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> {isSalaried ? 'Travail Validé & Clôturé' : 'Validé & Payé à la pièce'}
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
              )})}
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: REMUNERATIONS / HISTORIQUE PAIEMENTS */}
      {subTab === 'payments' && (() => {
        const pieceRateArtisans = artisans.filter(a => !isSalariedType(a.remunerationType));
        const totalEarnedPiece = pieceRateArtisans.reduce((sum, art) => sum + getArtisanStats(art.id).totalEarned, 0);
        const totalPaidPiece = pieceRateArtisans.reduce((sum, art) => sum + getArtisanStats(art.id).totalPaid, 0);
        const totalBalancePiece = pieceRateArtisans.reduce((sum, art) => sum + getArtisanStats(art.id).balance, 0);

        return (
          <div className="space-y-6">
            {/* Header & Payment Action */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Rémunérations à la Pièce</h3>
                <p className="text-xs text-gray-500 font-medium">Gérez le personnel payé par tâche accomplie et enregistrez les acomptes versés.</p>
              </div>
              <button
                onClick={() => openPaymentForm()}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" /> Enregistrer un Paiement
              </button>
            </div>

            {/* Key Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Gains Cumulés (Pièce)</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">{totalEarnedPiece.toLocaleString('fr-FR')} {currency}</p>
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Acomptes Déjà Versés</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">{totalPaidPiece.toLocaleString('fr-FR')} {currency}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Reste à Payer (Dû)</p>
                  <p className={`text-base font-black mt-0.5 ${totalBalancePiece > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{totalBalancePiece.toLocaleString('fr-FR')} {currency}</p>
                </div>
              </div>
            </div>

            {/* List of Piece-Rate Artisans */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <Users className="w-4 h-4 text-violet-600" /> Artisans Rémunérés à la Pièce
              </h4>

              {pieceRateArtisans.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-500 font-bold mb-1">Aucun artisan rémunéré à la pièce</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Tous vos artisans ont été configurés avec des rémunérations régulières. Vous pouvez changer leur type de rémunération en "À la pièce" depuis l'onglet 'Équipe & Statuts'.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pieceRateArtisans.map(art => {
                    const stats = getArtisanStats(art.id);
                    return (
                      <div key={art.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between space-y-4 hover:border-violet-100 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-gray-900 text-sm">{art.name}</h5>
                              <p className="text-[11px] text-gray-500">{art.specialty} • {art.phone}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              art.status === 'Disponible' ? 'bg-emerald-50 text-emerald-700' :
                              art.status === 'Occupé' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {art.status}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-100/50 grid grid-cols-3 gap-2 text-xs font-semibold text-gray-600">
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-medium">Gagné</p>
                              <p className="text-xs font-bold text-gray-800 mt-0.5">{stats.totalEarned.toLocaleString('fr-FR')} F</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-medium">Payé</p>
                              <p className="text-xs font-bold text-emerald-600 mt-0.5">{stats.totalPaid.toLocaleString('fr-FR')} F</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase font-medium">Reste</p>
                              <p className={`text-xs font-bold mt-0.5 ${stats.balance > 0 ? 'text-amber-600' : 'text-gray-500'}`}>{stats.balance.toLocaleString('fr-FR')} F</p>
                            </div>
                          </div>

                          <div className="text-[10px] text-gray-500 flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 font-medium">
                            <span>Assignations terminées :</span>
                            <span className="font-bold text-gray-900">{stats.completedCount} / {stats.assignedCount}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => openPaymentForm(art.id)}
                          className="w-full py-2 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Enregistrer un règlement
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payments Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Historique des Versements et Acomptes
                </h4>
              </div>

              {(() => {
                const pieceRatePayments = payments.filter(p => {
                  const art = artisans.find(a => a.id === p.artisanId);
                  return !art || !isSalariedType(art.remunerationType);
                });

                return pieceRatePayments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/20">
                    <p className="text-gray-400 text-xs italic">Aucun paiement enregistré dans l'historique.</p>
                  </div>
                ) : (
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
                        {pieceRatePayments.map((p) => (
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
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenPayslipPreview(false, p)}
                                  className="p-1.5 text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-lg transition-all cursor-pointer"
                                  title="Voir & Imprimer le bon"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDownloadPayslip(false, p, p.artisanName)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                  title="Télécharger le bulletin"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

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
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Rôle principal & Rémunération</p>
                    <p className="text-sm font-bold text-violet-700">{artisan.specialty} • {getProfilePaymentLabel(artisan.remunerationType)}</p>
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
                              <p className="text-xs font-bold text-violet-700">
                                {isSalariedType(artisan.remunerationType) ? 'Inclus (Régulier)' : `${task.pieceRateAmount.toLocaleString('fr-FR')} ${currency}`}
                              </p>
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

      {/* SUB TAB 5: GESTION DES SALARIÉS ET MENSUALITÉS */}
      {/* SUB TAB 5: GESTION DES SALARIÉS ET MENSUALITÉS */}
      {(subTab === 'salaries_mensuel' || subTab === 'salaries_hebdomadaire' || subTab === 'salaries_journalier') && (() => {
        const activeType = subTab === 'salaries_mensuel' ? 'Mensuel' : subTab === 'salaries_hebdomadaire' ? 'Hebdomadaire' : 'Journalier';
        
        // Filter artisans belonging to this active salary type
        const activeArtisans = artisans.filter(a => {
          if (activeType === 'Mensuel') {
            return a.remunerationType === 'Mensuel' || a.remunerationType === 'Salarié';
          }
          return a.remunerationType === activeType;
        });

        // Filter salary payments belonging to these artisans
        const activeSalaryPayments = salaryPayments.filter(p => {
          const art = artisans.find(a => a.id === p.artisanId);
          if (!art) return false;
          if (activeType === 'Mensuel') {
            return art.remunerationType === 'Mensuel' || art.remunerationType === 'Salarié';
          }
          return art.remunerationType === activeType;
        });

        const activeTitle = subTab === 'salaries_mensuel' ? 'Rémunération Mensuelle' : subTab === 'salaries_hebdomadaire' ? 'Rémunération Hebdomadaire' : 'Rémunération Journalière';
        const activeDesc = subTab === 'salaries_mensuel' ? 'Gérez le personnel payé de façon mensuelle et enregistrez les bulletins de paie.' :
                           subTab === 'salaries_hebdomadaire' ? 'Gérez le personnel payé chaque semaine et enregistrez les règlements hebdomadaires.' :
                           'Gérez le personnel payé de façon journalière et enregistrez les indemnités journalières.';

        return (
          <div className="space-y-6">
            {/* Header & Payment Action */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">{activeTitle}</h3>
                <p className="text-xs text-gray-500 font-medium">{activeDesc}</p>
              </div>
              <button
                onClick={() => openSalaryForm(activeArtisans[0]?.id || '')}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <DollarSign className="w-4 h-4" /> Enregistrer un Versement
              </button>
            </div>

            {/* List of Salaried Artisans */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-50 pb-3">
                <Users className="w-4 h-4 text-violet-600" /> Liste du Personnel ({activeTitle})
              </h4>

              {activeArtisans.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-gray-500 font-bold mb-1">Aucun artisan avec {activeTitle.toLowerCase()}</p>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    Pour ajouter un artisan à cette catégorie, modifiez un membre de votre équipe ou recrutez un nouvel artisan en choisissant {activeTitle.toLowerCase()} dans l'onglet 'Équipe & Statuts'.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeArtisans.map(art => {
                    const artSalaryPayments = activeSalaryPayments.filter(p => p.artisanId === art.id);
                    const totalPaidSal = artSalaryPayments.reduce((sum, p) => sum + p.amount, 0);
                    const lastPayMonth = artSalaryPayments.sort((x, y) => y.month.localeCompare(x.month))[0]?.month;

                    return (
                      <div key={art.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col justify-between space-y-4 hover:border-violet-100 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="font-bold text-gray-900 text-sm">{art.name}</h5>
                              <p className="text-[11px] text-gray-500">{art.specialty} • {art.phone}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              art.status === 'Disponible' ? 'bg-emerald-50 text-emerald-700' :
                              art.status === 'Occupé' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {art.status}
                            </span>
                          </div>

                          <div className="pt-2 border-t border-gray-100/50 grid grid-cols-2 gap-2 text-xs font-semibold text-gray-600">
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase">{getSalaryLabel(art.remunerationType)}</p>
                              <p className="text-sm font-bold text-violet-700 mt-0.5">{(art.monthlySalary || 150000).toLocaleString('fr-FR')} F</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-gray-400 uppercase">Dernière Période</p>
                              <p className="text-xs font-bold text-gray-800 mt-1">
                                {lastPayMonth ? lastPayMonth : <span className="text-gray-400 italic font-normal">Aucun</span>}
                              </p>
                            </div>
                          </div>

                          <div className="text-[10px] text-gray-500 flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-gray-100">
                            <span>Total payé à ce jour :</span>
                            <span className="font-bold text-gray-900">{totalPaidSal.toLocaleString('fr-FR')} F</span>
                          </div>
                        </div>

                        <button
                          onClick={() => openSalaryForm(art.id)}
                          className="w-full py-2 bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Enregistrer un règlement
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Salary Payments Log */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-emerald-600" /> Historique des Versements ({activeTitle})
                </h4>
              </div>

              {activeSalaryPayments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/20">
                  <p className="text-gray-400 text-xs italic">Aucun règlement enregistré dans l'historique de cette catégorie.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="py-4 px-5">Artisan</th>
                        <th className="py-4 px-5">{getPeriodLabel(activeType)}</th>
                        <th className="py-4 px-5">Date de paiement</th>
                        <th className="py-4 px-5">Mode de transaction</th>
                        <th className="py-4 px-5">Notes / Libellé</th>
                        <th className="py-4 px-5 text-right">Montant</th>
                        <th className="py-4 px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                      {activeSalaryPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/30 transition-all">
                          <td className="py-3.5 px-5 font-bold text-gray-900">{p.artisanName}</td>
                          <td className="py-3.5 px-5">
                            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-md text-[10px] font-bold">
                              {(() => {
                                const art = artisans.find(a => a.id === p.artisanId);
                                return formatMonthFrench(p.month, art?.remunerationType);
                              })()}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-mono text-gray-500 text-[11px]">{p.paymentDate}</td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <CreditCard className="w-3.5 h-3.5 text-gray-400" /> {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 max-w-[200px] truncate">{p.notes || <span className="text-gray-400 italic">Aucune note</span>}</td>
                          <td className="py-3.5 px-5 text-right font-bold text-emerald-600">{p.amount.toLocaleString('fr-FR')} {currency}</td>
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenPayslipPreview(true, p)}
                                className="p-1.5 text-violet-600 hover:text-violet-800 hover:bg-violet-50 rounded-lg transition-all cursor-pointer"
                                title="Voir & Imprimer le bulletin"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPayslip(true, p, p.artisanName)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                title="Télécharger le bulletin"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSalaryPayment(p.id)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

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
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Rémunération</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex flex-col p-3 border-2 rounded-2xl cursor-pointer transition-all text-left ${artisanRemunerationType === 'Pièce' ? 'border-violet-600 bg-violet-50/50' : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        name="remunerationType" 
                        value="Pièce" 
                        checked={artisanRemunerationType === 'Pièce'} 
                        onChange={() => setArtisanRemunerationType('Pièce')} 
                        className="sr-only" 
                      />
                      <span className="text-xs font-bold text-gray-900">Rémunération à la pièce</span>
                      <span className="text-[10px] text-gray-500 mt-1">Il est payé à la tâche</span>
                    </label>

                    <label className={`flex flex-col p-3 border-2 rounded-2xl cursor-pointer transition-all text-left ${artisanRemunerationType === 'Mensuel' || artisanRemunerationType === 'Salarié' ? 'border-violet-600 bg-violet-50/50' : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        name="remunerationType" 
                        value="Mensuel" 
                        checked={artisanRemunerationType === 'Mensuel' || artisanRemunerationType === 'Salarié'} 
                        onChange={() => setArtisanRemunerationType('Mensuel')} 
                        className="sr-only" 
                      />
                      <span className="text-xs font-bold text-gray-900">Mensuel</span>
                      <span className="text-[10px] text-gray-500 mt-1">Il est payé chaque mois</span>
                    </label>

                    <label className={`flex flex-col p-3 border-2 rounded-2xl cursor-pointer transition-all text-left ${artisanRemunerationType === 'Hebdomadaire' ? 'border-violet-600 bg-violet-50/50' : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        name="remunerationType" 
                        value="Hebdomadaire" 
                        checked={artisanRemunerationType === 'Hebdomadaire'} 
                        onChange={() => setArtisanRemunerationType('Hebdomadaire')} 
                        className="sr-only" 
                      />
                      <span className="text-xs font-bold text-gray-900">Hebdomadaire</span>
                      <span className="text-[10px] text-gray-500 mt-1">Il est payé chaque semaine</span>
                    </label>

                    <label className={`flex flex-col p-3 border-2 rounded-2xl cursor-pointer transition-all text-left ${artisanRemunerationType === 'Journalier' ? 'border-violet-600 bg-violet-50/50' : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50'}`}>
                      <input 
                        type="radio" 
                        name="remunerationType" 
                        value="Journalier" 
                        checked={artisanRemunerationType === 'Journalier'} 
                        onChange={() => setArtisanRemunerationType('Journalier')} 
                        className="sr-only" 
                      />
                      <span className="text-xs font-bold text-gray-900">Journalier</span>
                      <span className="text-[10px] text-gray-500 mt-1">Il est payé chaque jour</span>
                    </label>
                  </div>
                </div>

                {isSalariedType(artisanRemunerationType) && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{getSalaryLabel(artisanRemunerationType)} ({currency})</label>
                    <input
                      type="number"
                      required
                      value={artisanMonthlySalary}
                      onChange={(e) => setArtisanMonthlySalary(Number(e.target.value))}
                      placeholder="Ex : 150000"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                )}

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
                {(() => {
                  const selectedArtisanInModal = artisans.find(a => a.id === assignArtisanId);
                  const isSalariedInModal = isSalariedType(selectedArtisanInModal?.remunerationType);
                  return (
                    <>
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
                          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            {isSalariedInModal ? "Rémunération" : `Prix à la pièce (${currency})`}
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isSalariedInModal}
                            value={isSalariedInModal ? "Inclus (Régulier)" : assignPieceRate}
                            onChange={(e) => setAssignPieceRate(Number(e.target.value))}
                            placeholder="Ex : 5000"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold disabled:opacity-60 disabled:bg-gray-100 disabled:text-gray-500"
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
                    </>
                  );
                })()}

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
                    {artisans.filter(a => !isSalariedType(a.remunerationType)).map(a => {
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

      {/* 4. SALARY MODAL */}
      <AnimatePresence>
        {isSalaryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl border border-gray-100 text-left"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-violet-50/50">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <DollarSign className="w-5 h-5 text-violet-600" />
                  {(() => {
                    const art = artisans.find(a => a.id === paySalaryArtisanId);
                    return art ? `Régler - ${getProfilePaymentLabel(art.remunerationType)}` : 'Régler une Rémunération Fixe';
                  })()}
                </h4>
                <button
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSalaryPayment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Artisan destinataire</label>
                  <select
                    value={paySalaryArtisanId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setPaySalaryArtisanId(id);
                      const art = artisans.find(a => a.id === id);
                      if (art) {
                        setPaySalaryAmount(art.monthlySalary || 150000);
                        if (art.remunerationType === 'Journalier' || art.remunerationType === 'Hebdomadaire') {
                          setPaySalaryMonth(new Date().toISOString().split('T')[0]);
                        } else {
                          setPaySalaryMonth(new Date().toISOString().substring(0, 7));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                  >
                    <option value="">Sélectionner un artisan...</option>
                    {artisans.filter(a => isSalariedType(a.remunerationType)).map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({getSalaryLabel(a.remunerationType)} : {a.monthlySalary || 150000} F)</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      {(() => {
                        const art = artisans.find(a => a.id === paySalaryArtisanId);
                        return getPeriodLabel(art?.remunerationType);
                      })()}
                    </label>
                    <input
                      type={(() => {
                        const art = artisans.find(a => a.id === paySalaryArtisanId);
                        return getPeriodInputType(art?.remunerationType);
                      })()}
                      required
                      value={paySalaryMonth}
                      onChange={(e) => setPaySalaryMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Montant versé ({currency})</label>
                    <input
                      type="number"
                      required
                      value={paySalaryAmount}
                      onChange={(e) => setPaySalaryAmount(Number(e.target.value))}
                      placeholder="Ex: 150000"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Moyen de transaction</label>
                  <select
                    value={paySalaryMethod}
                    onChange={(e) => setPaySalaryMethod(e.target.value as any)}
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
                    value={paySalaryNotes}
                    onChange={(e) => setPaySalaryNotes(e.target.value)}
                    placeholder="Ex: Salaire complet de Juin 2026"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSalaryModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Confirmer le règlement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. PAYSLIP PREVIEW & ACTIONS MODAL */}
      <AnimatePresence>
        {isPayslipModalOpen && (selectedPiecePayment || selectedSalaryPayment) && (() => {
          const isSalary = !!selectedSalaryPayment;
          const currentPayment = isSalary ? selectedSalaryPayment : selectedPiecePayment;
          const artisan = artisans.find(a => a.id === currentPayment?.artisanId);
          const previewHtml = currentPayment ? generatePayslipHtml(isSalary, currentPayment, artisan) : '';

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl border border-gray-100 text-left flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-violet-50/30 shrink-0">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                      <Receipt className="w-5 h-5 text-violet-600" />
                      {isSalary ? "Bulletin de Paie de Salaire" : "Bon de Règlement à la Pièce"}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium">Aperçu officiel avant impression ou téléchargement</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsPayslipModalOpen(false);
                      setSelectedPiecePayment(null);
                      setSelectedSalaryPayment(null);
                    }}
                    className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview Container */}
                <div className="p-6 overflow-y-auto bg-gray-50/50 flex-1 flex justify-center">
                  <div 
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 max-w-full overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-white shrink-0">
                  <button
                    onClick={() => {
                      setIsPayslipModalOpen(false);
                      setSelectedPiecePayment(null);
                      setSelectedSalaryPayment(null);
                    }}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                  >
                    Fermer
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => currentPayment && handleDownloadPayslip(isSalary, currentPayment, currentPayment.artisanName)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-4 h-4" /> Télécharger (PDF)
                    </button>
                    <button
                      onClick={() => currentPayment && handlePrintPayslip(previewHtml)}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-4 h-4" /> Imprimer le Bulletin
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </motion.div>
  );
};
