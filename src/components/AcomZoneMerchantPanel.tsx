import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { dbService } from '../services/dbService';
import { Merchant, Order, OrderStatus } from '../types';
import { toast } from 'react-hot-toast';
import { 
  Store, ShoppingCart, ShieldCheck, Clock, CheckCircle2, XCircle, ArrowRight, Wrench, 
  HardHat, Car, Users, GraduationCap, Stethoscope, Briefcase, Shirt, Sparkles, Filter, 
  Trash2, Phone, Mail, MapPin, DollarSign, Calendar, RefreshCw, Send, Plus, Search, Info, Check
} from 'lucide-react';

interface AcomZoneMerchantPanelProps {
  merchant: Merchant;
}

// Pre-defined realistic test data template for simulations
const SENEGALESE_CLIENTS = [
  { name: "Fatou Diop", phone: "+221 77 543 21 09", email: "fatou.diop@example.sn", address: "Mermoz, Dakar" },
  { name: "Moustapha Ndiaye", phone: "+221 76 890 12 34", email: "moustapha.ndiaye@example.sn", address: "Gaston Berger, Saint-Louis" },
  { name: "Abdoulaye Sow", phone: "+221 78 230 45 67", email: "abdoulaye.sow@example.sn", address: "Almadies, Dakar" },
  { name: "Mariama Diallo", phone: "+221 70 765 43 21", email: "mariama.diallo@example.sn", address: "Parcelles Assainies, Dakar" },
  { name: "Cheikh Tidiane Kane", phone: "+221 77 123 45 67", email: "cheikh.kane@example.sn", address: "Sacre-Coeur, Dakar" },
  { name: "Aicha Tall", phone: "+221 76 345 67 89", email: "aicha.tall@example.sn", address: "Hlm Grand Yoff, Dakar" }
];

export const AcomZoneMerchantPanel: React.FC<AcomZoneMerchantPanelProps> = ({ merchant }) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'delivered' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch real orders associated with this merchant from local IndexedDB (Dexie)
  const orders = useLiveQuery(async () => {
    try {
      const all = await db.orders.toArray();
      // Filter orders belonging to this merchant or partner
      return all.filter(o => o.merchantId === merchant.id || o.partnerId === merchant.id);
    } catch (e) {
      console.error("Error retrieving orders from Dexie:", e);
      return [];
    }
  }, [merchant.id]) || [];

  const saasType = merchant.type || 'boutique';

  // Sector specifications
  const sectorMeta = useMemo(() => {
    switch (saasType) {
      case 'pressing':
        return {
          title: "Service Pressing & Nettoyage",
          icon: Shirt,
          bgColor: "bg-teal-50 text-teal-600 border-teal-200",
          itemLabel: "Linge / Vêtement",
          statusPending: "Fichier Reçu",
          statusConfirmed: "En Lavage",
          statusCompleted: "Prêt",
          simulatedServices: [
            { name: "Lavage complet & Repassage - Costumes", price: 12000, details: { items: "2 Costumes complets, 1 Cravate", mode: "Nettoyage à sec" } },
            { name: "Nettoyage Express - Robe de mariée", price: 25000, details: { items: "1 Robe de mariage perlée", mode: "Traitement délicat" } },
            { name: "Forfait Linge Quotidien", price: 8000, details: { items: "Sac 5kg, T-shirts & Jeans", mode: "Lavage standard" } }
          ]
        };
      case 'medical':
        return {
          title: "Rendez-vous Clinique & Santé",
          icon: Stethoscope,
          bgColor: "bg-emerald-50 text-emerald-600 border-emerald-200",
          itemLabel: "Patient",
          statusPending: "Demande RDV",
          statusConfirmed: "Confirmé",
          statusCompleted: "Consulté",
          simulatedServices: [
            { name: "Consultation Généraliste", price: 15000, details: { patientName: "Aicha Ndiaye (Enfant)", motif: "Fièvre et toux persistante", doctor: "Dr. Diallo" } },
            { name: "Bilan Sanguin Complet", price: 32000, details: { patientName: "Mamadou Sow", motif: "Check-up annuel", doctor: "Rendez-vous Laboratoire" } },
            { name: "Consultation Dentaire", price: 20000, details: { patientName: "Ousmane Cayor", motif: "Rage de dents / Extraction", doctor: "Dr. Diop" } }
          ]
        };
      case 'scolaire':
        return {
          title: "Dossiers d'Inscriptions Élèves",
          icon: GraduationCap,
          bgColor: "bg-blue-50 text-blue-600 border-blue-200",
          itemLabel: "Élève / Inscription",
          statusPending: "Candidature",
          statusConfirmed: "Admis",
          statusCompleted: "Inscrit",
          simulatedServices: [
            { name: "Demande d'Admission Primaire CM1", price: 50000, details: { student: "Abdou Ndiaye Jr.", level: "CM1", birthDate: "12/04/2016", parentNotes: "Transfert d'école publique" } },
            { name: "Pré-Inscription Jardin d'Enfants (Maternelle)", price: 40000, details: { student: "Sira Tall", level: "Petite Section", birthDate: "05/09/2022", parentNotes: "Régime cantine souhaité" } },
            { name: "Inscription Collège - Classe de 6ème", price: 75000, details: { student: "Babacar Diop", level: "6ème M1", birthDate: "30/11/2014", parentNotes: "Sera transporté par le bus scolaire" } }
          ]
        };
      case 'entreprise':
        return {
          title: "Demandes d'Interventions et Services",
          icon: Wrench,
          bgColor: "bg-pink-50 text-pink-600 border-pink-200",
          itemLabel: "Prestation / Panne",
          statusPending: "Demande reçue",
          statusConfirmed: "Planifiée",
          statusCompleted: "Résolue",
          simulatedServices: [
            { name: "Dépannage Électricité Réseau", price: 35000, details: { type: "Court-circuit", tech: "Éric Gomis", urgent: true, notes: "Disjoncteur général saute au démarrage" } },
            { name: "Maintenance Climatisation Centrale", price: 45000, details: { type: "Nettoyage filtres et recharge", tech: "Assane Sy", urgent: false, notes: "Climatiseur LG 24000 BTU" } },
            { name: "Audit Informatique Bureautique", price: 150000, details: { type: "Installation réseau RJ45", tech: "Ingénieur Réseau", urgent: false, notes: "10 postes de travail à connecter" } }
          ]
        };
      case 'chantier':
        return {
          title: "Commandes Approvisionnement BTP",
          icon: HardHat,
          bgColor: "bg-amber-50 text-amber-600 border-amber-200",
          itemLabel: "Demande Matériel/Lot",
          statusPending: "Demande de prix",
          statusConfirmed: "En Transit",
          statusCompleted: "Livré sur site",
          simulatedServices: [
            { name: "Approvisionnement Ciment SOCOCIM", price: 850000, details: { item: "10 Tonnes Ciment (200 sacs CPJ 35)", deliverySite: "Chantier Ngor Virage", supervisor: "Ing. Fall" } },
            { name: "Lot de Fer à Béton Diamètre 12", price: 420000, details: { item: "50 Barres de fer de 12", deliverySite: "Villa R+2 Hann Maristes", supervisor: "Contremaître Sarr" } },
            { name: "Sable de Dune pour Finitions", price: 120000, details: { item: "2 Camions - Sable fin", deliverySite: "Chantier Diamniadio", supervisor: "Chef de Chantier Wade" } }
          ]
        };
      case 'transport':
        return {
          title: "Réservations Flottes et Chauffeurs",
          icon: Car,
          bgColor: "bg-indigo-50 text-indigo-600 border-indigo-200",
          itemLabel: "Course / Trajet",
          statusPending: "En attente",
          statusConfirmed: "Chauffeur Assigné",
          statusCompleted: "Course Terminée",
          simulatedServices: [
            { name: "Navette Aéroport Blaise Diagne (AIBD)", price: 20000, details: { from: "Dakar Centre", to: "Aérooport AIBD", carModel: "Peugeot 508", flightNo: "AF718" } },
            { name: "Mise à Disposition Journalière SUV", price: 80000, details: { from: "Dakar & Alentours", to: "Multi-arrêts", carModel: "Toyota Prado TXL", hours: "8 heures" } },
            { name: "Course Express Inter-urbaine Dakar-Mbour", price: 45000, details: { from: "Dakar Liberté 6", to: "Mbour Saly", carModel: "Hyundai Accent", passengerCount: 3 } }
          ]
        };
      case 'rh':
        return {
          title: "Candidatures / Entretiens Recrutement",
          icon: Users,
          bgColor: "bg-purple-50 text-purple-600 border-purple-200",
          itemLabel: "Postulateur / Profil",
          statusPending: "Candidature reçue",
          statusConfirmed: "Entretien planifié",
          statusCompleted: "Décision prise",
          simulatedServices: [
            { name: "Poste : Comptable Senior", price: 0, details: { candidate: "Moussa Sagna", diploma: "Master 2 CCA", experience: "5 ans d'expérience", ratingGrade: "Excellent profil analytique" } },
            { name: "Poste : Agent Service Client Pressing", price: 0, details: { candidate: "Aida Diallo", diploma: "DESS Secrétariat", experience: "2 ans dans le commerce", ratingGrade: "Excellente élocution Wolof/Français" } },
            { name: "Poste : Conducteur Routier Poids Lourds", price: 0, details: { candidate: "Oumar Thiam", diploma: "Permis C/D à jour", experience: "10 ans d'expérience", ratingGrade: "Casier judiciaire néant, rigoureux" } }
          ]
        };
      default: // boutique / commerce
        return {
          title: "Commandes de Produits Boutique",
          icon: ShoppingCart,
          bgColor: "bg-orange-50 text-orange-600 border-orange-200",
          itemLabel: "Articles Commandés",
          statusPending: "En attente",
          statusConfirmed: "Expédiée",
          statusCompleted: "Livrée",
          simulatedServices: [
            { name: "Panier - Smartphones & Accessoires", price: 165000, details: { items: "1x Samsung Galaxy A35, 1x Écouteurs sans-fil", method: "Livraison à domicile" } },
            { name: "Commande Prêt-à-porter Chic", price: 54000, details: { items: "2x Robe d'été Lin, 1x Sac assorti beige", method: "Click & Collect Boutique" } },
            { name: "Assortiment Beauté & Cosmétiques", price: 30000, details: { items: "Kit de Maquillage Pro, Spray parfumé", method: "Livraison Point Relais" } }
          ]
        };
    }
  }, [saasType]);

  // Generate and save a realistic simulated client order
  const generateSimulatedOrder = async () => {
    setIsSimulating(true);
    try {
      const client = SENEGALESE_CLIENTS[Math.floor(Math.random() * SENEGALESE_CLIENTS.length)];
      const service = sectorMeta.simulatedServices[Math.floor(Math.random() * sectorMeta.simulatedServices.length)];
      
      const newOrder: any = {
        userId: "simulated_client_" + Math.random().toString(36).substr(2, 9),
        merchantId: merchant.id,
        partnerId: merchant.id,
        status: 'pending',
        serviceId: "acom_zone_simul_" + Math.random().toString(36).substr(2, 9),
        serviceName: service.name,
        totalPrice: service.price,
        clientName: client.name,
        clientEmail: client.email,
        pillar: 'saas',
        unreadByAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        details: {
          clientPhone: client.phone,
          clientAddress: client.address,
          ...service.details,
          simulated: true,
          saasSector: saasType
        }
      };

      const newId = await dbService.orders.save(newOrder);
      toast.success(`Nouvelle commande simulée de ${client.name} reçue !`);
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors de la simulation de la commande");
    } finally {
      setIsSimulating(false);
    }
  };

  // Switch Order Status
  const updateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await dbService.orders.save({
        id: orderId,
        status: nextStatus,
        updatedAt: new Date()
      });
      toast.success(`Statut mis à jour avec succès : ${nextStatus}`);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: nextStatus } : null);
      }
    } catch (e) {
      toast.error("Impossible de mettre à jour le statut.");
    }
  };

  // Delete simulated order safely
  const deleteOrder = async (orderId: string) => {
    if (confirm("Voulez-vous supprimer cette commande ?")) {
      try {
        await db.orders.delete(orderId);
        toast.success("Commande supprimée avec succès.");
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
      } catch (e) {
        toast.error("Échec de la suppression");
      }
    }
  };

  // Filtered list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return o.status === 'pending';
      if (statusFilter === 'confirmed') return o.status === 'confirmed' || o.status === 'confirmed_by_partner';
      if (statusFilter === 'delivered') return o.status === 'delivered' || o.status === 'completed';
      if (statusFilter === 'cancelled') return o.status === 'cancelled' || o.status === 'rejected';
      return true;
    });
  }, [orders, statusFilter]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const completed = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'rejected')
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    return { total, pending, completed, totalRevenue };
  }, [orders]);

  const CategoryIcon = sectorMeta.icon;

  return (
    <div id="acom-zone-merchant-panel" className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-slate-900 text-white rounded-[2rem] p-8 md:p-10 shadow-2xl border border-gray-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3.5 rounded-2xl ${sectorMeta.bgColor} border shadow-lg flex items-center justify-center`}>
                <CategoryIcon className="w-7 h-7" />
              </div>
              <div>
                <span className="bg-primary/20 text-primary-200 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30">
                  Canal Public Map - AcomZone
                </span>
                <h1 className="text-3xl font-black tracking-tight mt-1">Espace Receveur AcomZone</h1>
              </div>
            </div>
            <p className="text-gray-300 text-sm max-w-xl leading-relaxed">
              Vos clients vous découvrent et commandent directement via la carte interactive <span className="font-bold text-white">AcomZone</span>. 
              Cette interface est configurée pour le secteur <span className="font-bold text-primary-300 underline">{sectorMeta.title}</span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={generateSimulatedOrder}
              disabled={isSimulating}
              className="flex items-center gap-2 px-6 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary-600 active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>{isSimulating ? "Génération..." : "Simuler un Client AcomZone"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Bento Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Reçues</p>
            <p className="text-3xl font-black text-gray-900">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-gray-50 text-gray-700 rounded-2xl flex items-center justify-center border border-gray-100">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">En attente</p>
            <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Traitées/Livrées</p>
            <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Volume d'Affaire</p>
            <p className="text-xl font-black text-gray-900">
              {stats.totalRevenue.toLocaleString()} <span className="text-[10px] text-gray-500 font-medium">FCFA</span>
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-50 text-gray-700 rounded-2xl flex items-center justify-center border border-gray-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Content Split: List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Order List */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
          
          {/* List Toolbar / Filters */}
          <div className="p-6 border-b border-gray-50 flex items-center justify-between flex-wrap gap-4">
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Historique des Commandes ({filteredOrders.length})
            </h3>
            
            <div className="flex bg-gray-100 p-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-500">
              {(['all', 'pending', 'confirmed', 'delivered', 'cancelled'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg transition-all duration-300 ${statusFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'hover:text-gray-900'}`}
                >
                  {f === 'all' ? 'Toutes' : f === 'pending' ? 'Attente' : f === 'confirmed' ? 'En cours' : f === 'delivered' ? 'Prêt' : 'Annulé'}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Feed */}
          {filteredOrders.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <Store className="w-12 h-12 mx-auto text-gray-200 mb-4" />
              <p className="font-bold text-gray-900 mb-1">Aucune transaction trouvée</p>
              <p className="text-xs">Utilisez le bouton "Simuler un Client AcomZone" pour peupler instantanément ce tableau.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {filteredOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const statusMeta = getStatusBadge(order.status || 'pending', sectorMeta);
                
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 transition-all ${isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900 text-sm truncate">{order.clientName || "Client Anonyme"}</span>
                        {order.unreadByAdmin && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                        <span className="text-gray-900 font-bold truncate max-w-[200px]">{order.serviceName}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Segment Spec Preview */}
                      {renderShortSpec(order, saasType)}

                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className="font-black text-gray-900 text-sm">
                        {order.totalPrice > 0 ? `${order.totalPrice.toLocaleString()} FCFA` : "Gratuit / Devis"}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${statusMeta.className}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Side: Detailed Focus Screen */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-xl p-6 space-y-6 relative border-t-4 border-t-primary"
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-gray-50 pb-5">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      Détails de Demande
                    </span>
                    <h4 className="font-black text-gray-900 text-xl mt-2">Dossier client</h4>
                  </div>
                  
                  <button 
                    onClick={() => deleteOrder(selectedOrder.id)}
                    className="p-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-500 transition-colors"
                    title="Supprimer la commande"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Patient / Pupil / Dry washer specific custom display */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
                    <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Informations Contact</h5>
                    
                    <div className="space-y-2 text-sm text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-bold">{selectedOrder.clientName || 'Inconnu'}</span>
                      </div>
                      {selectedOrder.details?.clientPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${selectedOrder.details.clientPhone}`} className="hover:text-primary transition-colors underline">{selectedOrder.details.clientPhone}</a>
                        </div>
                      )}
                      {selectedOrder.clientEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{selectedOrder.clientEmail}</span>
                        </div>
                      )}
                      {selectedOrder.details?.clientAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{selectedOrder.details.clientAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fully Adapted Sector Fields Specifications */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
                    <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-primary" />
                      Détails de Service : {selectedOrder.serviceName}
                    </h5>

                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                      
                      {saasType === 'pressing' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Vêtement(s)</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.items || 'Articles standards'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Mode de Traitement</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.mode || 'Normal'}</span>
                          </div>
                        </>
                      )}

                      {saasType === 'medical' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Motif Médical</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.motif || 'Consultation de routine'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Médecin assigné</span>
                            <span className="text-gray-900 font-bold text-emerald-600">{selectedOrder.details?.doctor || 'Non affecté'}</span>
                          </div>
                        </>
                      )}

                      {saasType === 'scolaire' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5 font-bold">Élève ID</span>
                            <span className="text-gray-900 font-bold block">{selectedOrder.details?.student || 'Non renseigné'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Classe de niveau</span>
                            <span className="text-gray-900 font-bold text-blue-600">{selectedOrder.details?.level || 'Non spécifié'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 block mb-0.5">Notes ou Demandes Spéciales</span>
                            <span className="text-gray-900 font-bold bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 block text-xs leading-relaxed">
                              {selectedOrder.details?.parentNotes || "Pas de remarques particulières."}
                            </span>
                          </div>
                        </>
                      )}

                      {saasType === 'entreprise' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Nature de la Panne</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.type || 'Inconnue'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Technicien</span>
                            <span className="text-gray-900 font-bold text-pink-600">{selectedOrder.details?.tech || 'À affecter'}</span>
                          </div>
                          {selectedOrder.details?.urgent && (
                            <div className="col-span-2 flex items-center gap-1.5 p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 uppercase tracking-widest font-black text-[9px] w-fit">
                              ⚠️ Dépannage urgent
                            </div>
                          )}
                        </>
                      )}

                      {saasType === 'chantier' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Matériaux Commandés</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.item || 'Sable/Gravier/Ciment'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Lieu du Chantier</span>
                            <span className="text-gray-900 font-bold text-amber-600 truncate block">{selectedOrder.details?.deliverySite || 'Adresse non communiquée'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 block mb-1">Superviseur Réceptionnaire</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.supervisor || 'Chef d\'équipe'}</span>
                          </div>
                        </>
                      )}

                      {saasType === 'transport' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Point de départ</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.from || 'Dakar'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Destination de course</span>
                            <span className="text-gray-900 font-bold text-indigo-600">{selectedOrder.details?.to || 'Dakar'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Modèle Véhicule</span>
                            <span className="text-gray-900 font-bold bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 text-center block">
                              {selectedOrder.details?.carModel || 'Standard'}
                            </span>
                          </div>
                        </>
                      )}

                      {saasType === 'rh' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Candidat</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.candidate || 'Anonyme'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Expérience</span>
                            <span className="text-gray-900 font-bold text-purple-600">{selectedOrder.details?.experience || 'Débutant'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-400 block mb-0.5">Notes du pré-recrutement</span>
                            <span className="text-gray-900 font-bold block bg-purple-50/50 p-2.5 rounded-xl border border-purple-100/50 font-mono text-[11px]">
                              {selectedOrder.details?.ratingGrade || 'En attente d\'examen du CV'}
                            </span>
                          </div>
                        </>
                      )}

                      {saasType !== 'pressing' && saasType !== 'medical' && saasType !== 'scolaire' && saasType !== 'entreprise' && saasType !== 'chantier' && saasType !== 'transport' && saasType !== 'rh' && (
                        <>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Panier de produits</span>
                            <span className="text-gray-900 font-bold">{selectedOrder.details?.items || 'Articles'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Mode de retrait</span>
                            <span className="text-gray-900 font-bold text-orange-600">{selectedOrder.details?.method || 'Livraison à domicile'}</span>
                          </div>
                        </>
                      )}

                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-xs text-gray-500 font-bold">Total Facturation :</span>
                    <span className="text-lg font-black text-gray-900">
                      {selectedOrder.totalPrice > 0 ? `${selectedOrder.totalPrice.toLocaleString()} FCFA` : "Devis en attente"}
                    </span>
                  </div>

                  {/* Dynamic Action Controls */}
                  <div className="space-y-2 pt-4 border-t border-gray-50">
                    <h5 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">Actions et Transition de Phase</h5>
                    
                    {selectedOrder.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                          className="py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all text-white rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Valider ({sectorMeta.statusConfirmed})
                        </button>
                        <button
                          onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                          className="py-3 bg-red-50 hover:bg-red-100 active:scale-95 transition-all text-red-600 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeter
                        </button>
                      </div>
                    )}

                    {selectedOrder.status === 'confirmed' && (
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                        className="w-full py-4 bg-gray-900 hover:bg-black active:scale-95 transition-all text-white rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-gray-900/10"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Finaliser ({sectorMeta.statusCompleted})
                      </button>
                    )}

                    {(selectedOrder.status === 'delivered' || selectedOrder.status === 'completed') && (
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-3.5 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Dossier clos, traité avec succès !
                      </div>
                    )}

                    {selectedOrder.status === 'cancelled' && (
                      <div className="bg-red-50 text-red-700 border border-red-100 rounded-xl p-3.5 text-xs font-bold text-center flex items-center justify-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        Cette transaction a été annulée.
                      </div>
                    )}

                  </div>

                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-lg text-gray-400 py-20 min-h-[460px] flex flex-col justify-center border-dashed">
                <Store className="w-16 h-16 mx-auto text-gray-200 mb-4 animate-bounce" />
                <h4 className="font-bold text-gray-900 mb-2">Sélectionnez une commande</h4>
                <p className="text-xs max-w-[240px] mx-auto leading-relaxed">
                  Cliquez sur un dossier de l'historique de gauche pour visualiser les champs et détails spécifiques à votre SaaS.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
};

// Help helper for statuses
function getStatusBadge(status: string, meta: any) {
  switch (status) {
    case 'pending':
      return { label: meta.statusPending, className: "bg-amber-100 text-amber-700 font-black border-amber-200" };
    case 'confirmed':
    case 'confirmed_by_partner':
      return { label: meta.statusConfirmed, className: "bg-blue-100 text-blue-700 font-bold border-blue-200" };
    case 'delivered':
    case 'completed':
      return { label: meta.statusCompleted, className: "bg-emerald-100 text-emerald-700 font-black border-emerald-200" };
    case 'cancelled':
    case 'rejected':
      return { label: "Annulée", className: "bg-red-100 text-red-700 font-bold border-red-200" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700 border-gray-200" };
  }
}

// Inline metadata description summary
function renderShortSpec(order: Order, type: string) {
  const details = order.details || {};
  switch (type) {
    case 'pressing':
      return (
        <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🧺 {details.items || "Articles à laver"}
        </span>
      );
    case 'medical':
      return (
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🩺 Client/Patient: {details.motif || "Bilan de santé"}
        </span>
      );
    case 'scolaire':
      return (
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🎓 Inscription: {details.student || "Demande élève"} ({details.level || "Classe"})
        </span>
      );
    case 'entreprise':
      return (
        <span className="text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🔧 Panne: {details.type || "Intervention technique"}
        </span>
      );
    case 'chantier':
      return (
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🏗️ Chantier: {details.item || "Matériaux BTP"}
        </span>
      );
    case 'transport':
      return (
        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🚗 Course: {details.from || 'Départ'} ➔ {details.to || 'Destination'}
        </span>
      );
    case 'rh':
      return (
        <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          👥 Candidat: {details.candidate || "Profil Rh"}
        </span>
      );
    default:
      return (
        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded w-fit float-left mt-1">
          🛍️ Boutique: {details.items || "Commande boutique"}
        </span>
      );
  }
}
