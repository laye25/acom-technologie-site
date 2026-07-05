import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, X, Phone, MapPin, Calendar, 
  Clock, CheckCircle2, AlertTriangle, Truck, User, DollarSign, 
  Map, ClipboardList, Send, FileText, Check, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';
import { PressingTicket } from '../types';

interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  vehicle: 'moto' | 'voiture' | 'velo';
  status: 'available' | 'busy' | 'offline';
}

interface DeliveryAssignment {
  id: string;
  ticketId: string;
  ticketNumber: string;
  clientName: string;
  clientPhone: string;
  address: string;
  agentId: string;
  agentName: string;
  fee: number;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';
  date: string;
  notes?: string;
  createdAt: number;
}

export const PressingDeliveryManager = ({ merchant }: { merchant: Merchant }) => {
  // 1. Load tickets from LocalStorage (kept for integration with the rest of Pressing modules)
  const [tickets, setTickets] = useState<PressingTicket[]>([]);

  // 2. Live query for delivery agents from Dexie
  const agents = useLiveQuery(
    () => db.delivery_agents.where('merchantId').equals(merchant.id).toArray(),
    [merchant.id]
  ) || [];

  // 3. Live query for active delivery assignments from Dexie
  const assignments = useLiveQuery(
    () => db.delivery_assignments.where('merchantId').equals(merchant.id).toArray(),
    [merchant.id]
  ) || [];

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<DeliveryAssignment | null>(null);
  
  // Modals / forms
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Partial<DeliveryAgent>>({
    name: '',
    phone: '',
    vehicle: 'moto',
    status: 'available'
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTicket, setAssignTicket] = useState<PressingTicket | null>(null);
  const [assignForm, setAssignForm] = useState({
    agentId: '',
    address: '',
    fee: 1500,
    notes: ''
  });

  // WhatsApp notification modal state
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappClientPhone, setWhatsappClientPhone] = useState('');
  const [whatsappAssignment, setWhatsappAssignment] = useState<DeliveryAssignment | null>(null);
  const [whatsappTemplateType, setWhatsappTemplateType] = useState<'in_transit' | 'delivered' | 'failed'>('in_transit');

  const updateWhatsappMessageTemplate = (assignment: DeliveryAssignment, type: 'in_transit' | 'delivered' | 'failed') => {
    // Find the agent to get their phone if possible
    const agentObj = agents.find(a => a.id === assignment.agentId);
    const agentPhoneStr = agentObj?.phone ? ` (Tél: ${agentObj.phone})` : '';
    
    let msg = '';
    if (type === 'in_transit') {
      msg = `Bonjour ${assignment.clientName},\n\nVotre linge propre (Commande #${assignment.ticketNumber}) est prêt et en cours de livraison ! 🚚\n\nNotre livreur ${assignment.agentName}${agentPhoneStr} est en route pour vous livrer à l'adresse suivante :\n📍 ${assignment.address}\n\nMerci de votre fidélité et à bientôt ! \n- ${merchant.name}`;
    } else if (type === 'delivered') {
      msg = `Bonjour ${assignment.clientName},\n\nBonne nouvelle ! Votre commande #${assignment.ticketNumber} a été livrée avec succès par ${assignment.agentName}. 🎉\n\nNous espérons que nos services vous ont donné entière satisfaction.\n\nMerci et à très bientôt !\n- ${merchant.name}`;
    } else if (type === 'failed') {
      msg = `Bonjour ${assignment.clientName},\n\nNotre livreur ${assignment.agentName} a tenté de livrer votre commande #${assignment.ticketNumber} aujourd'hui mais n'a pas pu finaliser la livraison.\n\nN'hésitez pas à nous recontacter pour reprogrammer le passage du livreur.\n\nCordialement,\n- ${merchant.name}`;
    }
    
    setWhatsappMessage(msg);
    setWhatsappTemplateType(type);
  };

  const handleOpenWhatsapp = (assignment: DeliveryAssignment) => {
    setWhatsappAssignment(assignment);
    setWhatsappClientPhone(assignment.clientPhone || '');
    updateWhatsappMessageTemplate(assignment, 'in_transit');
    setIsWhatsappModalOpen(true);
  };

  // Load tickets on mount & perform migration to Dexie
  useEffect(() => {
    // Tickets
    const savedTickets = localStorage.getItem(`pressing_tickets_${merchant.id}`);
    if (savedTickets) {
      try {
        setTickets(JSON.parse(savedTickets));
      } catch (e) {
        console.error(e);
      }
    }

    const seedAndMigrate = async () => {
      // 1. Migrate agents or seed default agents if none exist
      const localAgents = await db.delivery_agents.where('merchantId').equals(merchant.id).toArray();
      if (localAgents.length === 0) {
        const savedAgents = localStorage.getItem(`pressing_delivery_agents_${merchant.id}`);
        let agentsToPut: any[] = [];
        if (savedAgents) {
          try {
            agentsToPut = JSON.parse(savedAgents);
          } catch (e) {
            console.error(e);
          }
        }
        
        if (agentsToPut.length === 0) {
          agentsToPut = [
            { id: '1', name: 'Moussa Diop', phone: '776543210', vehicle: 'moto', status: 'available' },
            { id: '2', name: 'Abdoulaye Ndiaye', phone: '781234567', vehicle: 'moto', status: 'available' },
            { id: '3', name: 'Dakar Express (Partenaire)', phone: '338240000', vehicle: 'voiture', status: 'available' }
          ];
        }

        const finalAgents = agentsToPut.map(a => ({
          ...a,
          merchantId: merchant.id,
          updatedAt: Date.now()
        }));

        await db.delivery_agents.bulkPut(finalAgents);
        localStorage.removeItem(`pressing_delivery_agents_${merchant.id}`);
      }

      // 2. Migrate assignments from localStorage
      const savedAssignments = localStorage.getItem(`pressing_deliveries_${merchant.id}`);
      if (savedAssignments) {
        try {
          const parsed = JSON.parse(savedAssignments);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const assignmentsToPut = parsed.map(a => ({
              ...a,
              merchantId: merchant.id,
              updatedAt: a.updatedAt || Date.now()
            }));
            await db.delivery_assignments.bulkPut(assignmentsToPut);
            localStorage.removeItem(`pressing_deliveries_${merchant.id}`);
            toast.success('Données de livraison migrées avec succès');
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    seedAndMigrate();
  }, [merchant.id]);

  // Helper to save tickets back to localStorage and trigger sync
  const saveTickets = (updatedTickets: PressingTicket[]) => {
    setTickets(updatedTickets);
    localStorage.setItem(`pressing_tickets_${merchant.id}`, JSON.stringify(updatedTickets));
  };

  // Create or Edit Agent
  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAgent.name || !currentAgent.phone) {
      toast.error('Veuillez remplir le nom et le téléphone');
      return;
    }

    try {
      if (currentAgent.id) {
        await db.delivery_agents.put({
          ...currentAgent,
          merchantId: merchant.id,
          updatedAt: Date.now()
        });
        toast.success('Livreur mis à jour');
      } else {
        const newAg: DeliveryAgent = {
          ...(currentAgent as DeliveryAgent),
          id: crypto.randomUUID(),
          status: 'available'
        };
        await db.delivery_agents.put({
          ...newAg,
          merchantId: merchant.id,
          updatedAt: Date.now()
        });
        toast.success('Nouveau livreur ajouté');
      }

      setIsAgentModalOpen(false);
      setCurrentAgent({ name: '', phone: '', vehicle: 'moto', status: 'available' });
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde du livreur');
    }
  };

  const handleDeleteAgent = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce livreur ?')) {
      try {
        await db.delivery_agents.delete(id);
        toast.success('Livreur supprimé');
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Open assign modal
  const openAssignModal = (ticket: PressingTicket) => {
    setAssignTicket(ticket);
    setAssignForm({
      agentId: agents[0]?.id || '',
      address: ticket.notes || '',
      fee: 1500,
      notes: ''
    });
    setIsAssignModalOpen(true);
  };

  // Create Delivery Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTicket) return;
    if (!assignForm.agentId) {
      toast.error('Veuillez sélectionner un livreur');
      return;
    }

    const agent = agents.find(a => a.id === assignForm.agentId);
    if (!agent) return;

    try {
      // Create delivery record
      const newAssignment: DeliveryAssignment = {
        id: crypto.randomUUID(),
        ticketId: assignTicket.id,
        ticketNumber: assignTicket.ticketNumber,
        clientName: assignTicket.clientName,
        clientPhone: assignTicket.clientPhone,
        address: assignForm.address || 'Non spécifiée',
        agentId: agent.id,
        agentName: agent.name,
        fee: Number(assignForm.fee) || 0,
        status: 'assigned',
        date: new Date().toISOString().split('T')[0],
        notes: assignForm.notes,
        createdAt: Date.now()
      };

      // Save to Dexie
      await db.delivery_assignments.put({
        ...newAssignment,
        merchantId: merchant.id,
        updatedAt: Date.now()
      });

      // Update ticket status to in_progress or ready
      const updatedTickets = tickets.map(t => {
        if (t.id === assignTicket.id) {
          return {
            ...t,
            status: t.status === 'ready' ? 'ready' : 'in_progress',
            deliveryAgentName: agent.name,
            deliveryStatus: 'assigned'
          } as any;
        }
        return t;
      });
      saveTickets(updatedTickets);

      // Set agent status to busy in Dexie
      await db.delivery_agents.update(agent.id, {
        status: 'busy',
        updatedAt: Date.now()
      });

      setIsAssignModalOpen(false);
      setAssignTicket(null);
      toast.success(`Livraison assignée à ${agent.name}`);
    } catch (err) {
      toast.error('Erreur lors de l\'assignation');
    }
  };

  // Update Delivery status
  const handleUpdateDeliveryStatus = async (assignmentId: string, newStatus: DeliveryAssignment['status']) => {
    const targetAss = assignments.find(a => a.id === assignmentId);
    if (!targetAss) return;

    try {
      // Update assignment in Dexie
      await db.delivery_assignments.update(assignmentId, {
        status: newStatus,
        updatedAt: Date.now()
      });

      // Sync ticket status
      const updatedTickets = tickets.map(t => {
        if (t.id === targetAss.ticketId) {
          let ticketStatus = t.status;
          if (newStatus === 'delivered') {
            ticketStatus = 'delivered';
          }
          return {
            ...t,
            status: ticketStatus,
            deliveryStatus: newStatus
          };
        }
        return t;
      });
      saveTickets(updatedTickets);

      // Update agent status based on delivery status
      if (newStatus === 'delivered' || newStatus === 'failed') {
        await db.delivery_agents.update(targetAss.agentId, {
          status: 'available',
          updatedAt: Date.now()
        });
      } else if (newStatus === 'in_transit') {
        await db.delivery_agents.update(targetAss.agentId, {
          status: 'busy',
          updatedAt: Date.now()
        });
      }

      toast.success('Statut de livraison mis à jour');
      if (selectedAssignment && selectedAssignment.id === assignmentId) {
        setSelectedAssignment({ ...selectedAssignment, status: newStatus });
      }
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // Filter deliveries
  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = 
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.address.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return a.status === filterStatus && matchesSearch;
  });

  // Tickets needing delivery but not yet assigned
  const pendingDeliveryTickets = tickets.filter(t => {
    // Has delivery supplement selected
    const hasDeliverySupplement = t.supplements && t.supplements.livraison;
    // Not yet completed / delivered
    const isNotDeliveredYet = t.status !== 'delivered';
    // No active assigned delivery assignment
    const alreadyAssigned = assignments.some(a => a.ticketId === t.id && a.status !== 'failed');
    
    return hasDeliverySupplement && isNotDeliveredYet && !alreadyAssigned;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            <span>Suivi des Livraisons à Domicile</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Supervision logistique & assignation des coursiers
          </p>
        </div>

        <button 
          onClick={() => {
            setCurrentAgent({ name: '', phone: '', vehicle: 'moto', status: 'available' });
            setIsAgentModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Coursier / Livreur</span>
        </button>
      </div>

      {/* Grid: Delivery Agents List & Pending Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Courseurs / Livreurs */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span>Équipe de Livreurs ({agents.length})</span>
            </h3>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {agents.map(agent => (
              <div key={agent.id} className="p-3.5 bg-gray-50/50 rounded-2xl border border-gray-150 flex justify-between items-center group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-ink">{agent.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      agent.status === 'available' ? 'bg-emerald-50 text-emerald-600' :
                      agent.status === 'busy' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {agent.status === 'available' ? 'Disponible' : agent.status === 'busy' ? 'En course' : 'Hors-ligne'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {agent.phone}</span>
                    <span className="uppercase font-bold">🛵 {agent.vehicle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setCurrentAgent(agent);
                      setIsAgentModalOpen(true);
                    }}
                    className="p-1.5 hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 rounded-lg transition-all"
                    title="Modifier"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {agents.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Aucun livreur configuré.</p>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Tickets awaiting delivery assignment */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span>Demandes de Livraison en Attente d'Assignation ({pendingDeliveryTickets.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {pendingDeliveryTickets.map(ticket => (
              <div key={ticket.id} className="p-4 bg-violet-50/20 rounded-2xl border border-violet-100/50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {ticket.ticketNumber}
                      </span>
                      <h4 className="font-bold text-sm text-ink mt-1.5">{ticket.clientName}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      ticket.status === 'ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {ticket.status === 'ready' ? 'PRÊT (LAVÉ)' : 'EN COURS DE TRAITEMENT'}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 space-y-1">
                    <p className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {ticket.clientPhone}
                    </p>
                    {ticket.notes && (
                      <p className="flex items-start gap-1.5 font-medium italic line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {ticket.notes}
                      </p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => openAssignModal(ticket)}
                  className="w-full py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-hover transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Assignation Express
                </button>
              </div>
            ))}

            {pendingDeliveryTickets.length === 0 && (
              <div className="md:col-span-2 text-center py-12 text-gray-400 font-medium">
                Toutes les demandes de livraison sont assignées ou achevées ! 🎉
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Section: Active Delivery Tracker (Kanban / List) */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-ink">Supervision des Courses Actives</h3>
            <p className="text-xs text-gray-400 font-medium">Suivez l'état d'avancement de toutes vos livraisons d'articles de pressing</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Rechercher livraison..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Status */}
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3.5 py-2 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">Tous les statuts</option>
              <option value="assigned">Assigné (En attente de départ)</option>
              <option value="in_transit">En cours de route 🛵</option>
              <option value="delivered">Livré avec succès ✅</option>
              <option value="failed">Échec de livraison ❌</option>
            </select>
          </div>
        </div>

        {/* Deliveries Table / List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-6 py-4">Commande</th>
                <th className="px-6 py-4">Client / Adresse</th>
                <th className="px-6 py-4">Livreur Assigné</th>
                <th className="px-6 py-4">Frais de Course</th>
                <th className="px-6 py-4">Statut de Livraison</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssignments.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-mono font-black text-violet-600">{item.ticketNumber}</span>
                      <span className="text-[9px] text-gray-400 mt-1 font-mono">{item.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-ink">{item.clientName}</span>
                      <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" /> {item.address}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-xs text-ink flex items-center gap-1.5">
                      👤 {item.agentName}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-black text-emerald-600">
                    {item.fee.toLocaleString()} {merchant.currency || 'FCFA'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      item.status === 'assigned' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      item.status === 'in_transit' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      item.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {item.status === 'assigned' ? 'Assigné (Départ imminent)' :
                       item.status === 'in_transit' ? 'En Route 🛵' :
                       item.status === 'delivered' ? 'Livré ✅' : 'Échec / Reporter'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'assigned' && (
                        <button 
                          onClick={() => handleUpdateDeliveryStatus(item.id, 'in_transit')}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                        >
                          Lancer la Course 🛵
                        </button>
                      )}
                      {item.status === 'in_transit' && (
                        <>
                          <button 
                            onClick={() => handleUpdateDeliveryStatus(item.id, 'delivered')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                          >
                            Confirmer Livraison ✅
                          </button>
                          <button 
                            onClick={() => handleUpdateDeliveryStatus(item.id, 'failed')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                          >
                            Échec / Reporter
                          </button>
                        </>
                      )}
                      
                      <button 
                        onClick={() => handleOpenWhatsapp(item)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1"
                        title="Informer le client par WhatsApp"
                      >
                        <span>💬 Notifier</span>
                      </button>
                      
                      <button 
                        onClick={async () => {
                          if (window.confirm('Annuler cette livraison ?')) {
                            try {
                              // If agent was busy, set back to available
                              if (item.agentId) {
                                await db.delivery_agents.update(item.agentId, {
                                  status: 'available',
                                  updatedAt: Date.now()
                                });
                              }

                              // Delete assignment in Dexie
                              await db.delivery_assignments.delete(item.id);

                              // Also clear on ticket
                              const updatedTickets = tickets.map(t => {
                                if (t.id === item.ticketId) {
                                  return {
                                    ...t,
                                    deliveryStatus: undefined,
                                    deliveryAgentName: undefined
                                  } as any;
                                }
                                return t;
                              });
                              saveTickets(updatedTickets);
                              toast.success('Livraison annulée');
                            } catch (err) {
                              toast.error('Erreur lors de l\'annulation');
                            }
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Annuler Livraison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    Aucune course active correspondant aux filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Agent Modal */}
        {isAgentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Fiche Livreur</h3>
                <button onClick={() => setIsAgentModalOpen(false)} className="p-1.5 hover:bg-white rounded-xl transition-all border border-black/5">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveAgent} className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nom complet</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ex: Moussa Diop"
                    value={currentAgent.name} 
                    onChange={e => setCurrentAgent({...currentAgent, name: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Téléphone mobile (WhatsApp)</label>
                  <input 
                    type="tel" 
                    required 
                    placeholder="ex: 77 654 32 10"
                    value={currentAgent.phone} 
                    onChange={e => setCurrentAgent({...currentAgent, phone: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Moyen de transport</label>
                  <select 
                    value={currentAgent.vehicle} 
                    onChange={e => setCurrentAgent({...currentAgent, vehicle: e.target.value as any})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="moto">🛵 Moto de course</option>
                    <option value="voiture">🚗 Camionnette / Voiture</option>
                    <option value="velo">🚲 Vélo / Trottinette</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-100 flex space-x-3">
                  <button type="button" onClick={() => setIsAgentModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/10">
                    Enregistrer livreur
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Assignment Modal */}
        {isAssignModalOpen && assignTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Assignation de Livraison</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Commande : {assignTicket.ticketNumber}</p>
                </div>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-1.5 hover:bg-white rounded-xl transition-all border border-black/5">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Livreur en charge</label>
                  <select 
                    value={assignForm.agentId} 
                    onChange={e => setAssignForm({...assignForm, agentId: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                    required
                  >
                    <option value="">-- Sélectionner un coursier --</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>
                        👤 {a.name} ({a.status === 'available' ? 'Disponible' : 'En course'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Adresse exacte de livraison</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Quartier, Rue, près de..."
                    value={assignForm.address} 
                    onChange={e => setAssignForm({...assignForm, address: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Frais de livraison ({merchant.currency || 'FCFA'})</label>
                  <input 
                    type="number" 
                    min="0"
                    required 
                    value={assignForm.fee} 
                    onChange={e => setAssignForm({...assignForm, fee: Number(e.target.value)})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 font-mono font-bold text-emerald-600" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Remarques ou instructions</label>
                  <textarea 
                    placeholder="Instructions particulières de livraison..."
                    value={assignForm.notes} 
                    onChange={e => setAssignForm({...assignForm, notes: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 min-h-[60px]" 
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex space-x-3">
                  <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/10">
                    Déployer la Course 🛵
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* WhatsApp Custom Notification Modal */}
        {isWhatsappModalOpen && whatsappAssignment && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center text-left">
                <div>
                  <h3 className="font-bold text-emerald-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <span>💬</span> Notification Client WhatsApp
                  </h3>
                  <p className="text-[10px] text-emerald-700 font-mono mt-0.5">Commande : {whatsappAssignment.ticketNumber}</p>
                </div>
                <button onClick={() => setIsWhatsappModalOpen(false)} className="p-1.5 hover:bg-white rounded-xl transition-all border border-black/5">
                  <X className="w-4 h-4 text-emerald-600" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-left">
                {/* Template selection tabs */}
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Choisir un modèle de message :</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateWhatsappMessageTemplate(whatsappAssignment, 'in_transit')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        whatsappTemplateType === 'in_transit' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-black' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-500 font-bold'
                      }`}
                    >
                      🛵 En Route
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWhatsappMessageTemplate(whatsappAssignment, 'delivered')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        whatsappTemplateType === 'delivered' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-black' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-500 font-bold'
                      }`}
                    >
                      ✅ Livré
                    </button>
                    <button
                      type="button"
                      onClick={() => updateWhatsappMessageTemplate(whatsappAssignment, 'failed')}
                      className={`py-2 px-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                        whatsappTemplateType === 'failed' 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-black' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-500 font-bold'
                      }`}
                    >
                      ❌ Échec
                    </button>
                  </div>
                </div>

                {/* Recipient Phone */}
                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Téléphone Client</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex : 77 000 00 00"
                    value={whatsappClientPhone}
                    onChange={e => setWhatsappClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold font-mono"
                  />
                </div>

                {/* Message Content Area */}
                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Corps du message (Modifiable)</label>
                  <textarea
                    rows={6}
                    required
                    value={whatsappMessage}
                    onChange={e => setWhatsappMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold min-h-[120px] leading-relaxed"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex space-x-3">
                  <button type="button" onClick={() => setIsWhatsappModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button 
                    type="button"
                    onClick={() => {
                      const cleanPhone = whatsappClientPhone.replace(/[^0-9]/g, '');
                      const finalPhone = (cleanPhone.length === 9 && (cleanPhone.startsWith('77') || cleanPhone.startsWith('78') || cleanPhone.startsWith('76') || cleanPhone.startsWith('70') || cleanPhone.startsWith('33'))) ? '221' + cleanPhone : cleanPhone;
                      window.open(`https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                      setIsWhatsappModalOpen(false);
                      toast.success('Conversation WhatsApp ouverte !');
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1"
                  >
                    🚀 Ouvrir WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
