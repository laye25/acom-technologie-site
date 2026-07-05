import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Loader2, Search, Edit2, Trash2, X, AlertTriangle, 
  Wrench, Calendar, DollarSign, Car, ShieldCheck, 
  Settings, AlertCircle, Clock, CheckCircle2, TrendingUp, Info
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import toast from 'react-hot-toast';
import { Merchant } from '../../../types';

interface MaintenanceLog {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  type: 'vidange' | 'pneus' | 'freins' | 'moteur' | 'assurance' | 'controle_technique' | 'autre';
  date: string;
  mileage: number;
  cost: number;
  garage: string;
  mechanicPhone?: string;
  nextDueDate?: string;
  nextDueMileage?: number;
  notes?: string;
  status: 'done' | 'scheduled';
}

export const FleetMaintenanceManager = ({ merchant }: { merchant: Merchant }) => {
  // Live query for vehicles
  const vehicles = useLiveQuery(() => 
    db.table('vehicles')
      .where('merchantId')
      .equals(merchant.id)
      .reverse()
      .sortBy('updatedAt')
  , [merchant.id]) || [];

  const maintenanceLogs = useLiveQuery(
    () => db.vehicle_maintenances.where('merchantId').equals(merchant.id).toArray(),
    [merchant.id]
  ) || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [saving, setSaving] = useState(false);

  const [currentLog, setCurrentLog] = useState<Partial<MaintenanceLog>>({
    vehicleId: '',
    type: 'vidange',
    date: new Date().toISOString().split('T')[0],
    mileage: 0,
    cost: 0,
    garage: '',
    notes: '',
    status: 'done',
    nextDueDate: '',
    nextDueMileage: 0
  });

  // Migrate maintenance logs from local storage to Dexie
  useEffect(() => {
    const runMigration = async () => {
      const saved = localStorage.getItem(`transport_maintenance_logs_${merchant.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const logsToMigrate = parsed.map((log: any) => ({
              ...log,
              merchantId: merchant.id,
              updatedAt: log.updatedAt || Date.now()
            }));
            await db.vehicle_maintenances.bulkPut(logsToMigrate);
            localStorage.removeItem(`transport_maintenance_logs_${merchant.id}`);
            toast.success('Données d\'entretien migrées vers la base locale avec succès');
          }
        } catch (e) {
          console.error('Error during maintenance logs migration:', e);
        }
      }
    };
    runMigration();
  }, [merchant.id]);

  // Add/Edit Maintenance Log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLog.vehicleId) {
      toast.error('Veuillez sélectionner un véhicule');
      return;
    }
    if (!currentLog.garage) {
      toast.error('Veuillez spécifier le garage / atelier');
      return;
    }

    setSaving(true);
    try {
      const vehicle = vehicles.find(v => v.id === currentLog.vehicleId);
      if (!vehicle) {
        toast.error('Véhicule introuvable');
        return;
      }

      const logData: MaintenanceLog = {
        ...(currentLog as MaintenanceLog),
        id: currentLog.id || crypto.randomUUID(),
        vehiclePlate: vehicle.plateNumber,
        vehicleModel: vehicle.model,
        mileage: Number(currentLog.mileage) || 0,
        cost: Number(currentLog.cost) || 0,
        nextDueMileage: currentLog.nextDueMileage ? Number(currentLog.nextDueMileage) : undefined
      };

      if (currentLog.id) {
        await db.vehicle_maintenances.put({
          ...logData,
          merchantId: merchant.id,
          updatedAt: Date.now()
        });
        toast.success('Entretien mis à jour');
      } else {
        await db.vehicle_maintenances.put({
          ...logData,
          merchantId: merchant.id,
          updatedAt: Date.now()
        });
        toast.success('Entretien enregistré avec succès');

        // Automatically update the last maintenance date & mileage on the vehicle object in Dexie!
        if (logData.status === 'done') {
          const updatedVehicle = {
            ...vehicle,
            lastMaintenance: logData.date,
            status: 'active', // reset status to active after maintenance is recorded as done
            mileage: Math.max(vehicle.mileage || 0, logData.mileage)
          };
          await dbService.vehicles.save(updatedVehicle);
        }
      }

      setIsLogModalOpen(false);
      setCurrentLog({
        vehicleId: '',
        type: 'vidange',
        date: new Date().toISOString().split('T')[0],
        mileage: 0,
        cost: 0,
        garage: '',
        notes: '',
        status: 'done',
        nextDueDate: '',
        nextDueMileage: 0
      });
    } catch (err) {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Voulez-vous supprimer ce rapport d\'entretien ?')) {
      try {
        await db.vehicle_maintenances.delete(id);
        toast.success('Rapport supprimé');
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  // Helper translations and styles
  const getLogTypeLabel = (type: string) => {
    switch (type) {
      case 'vidange': return 'Vidange moteur';
      case 'pneus': return 'Pneumatiques';
      case 'freins': return 'Système de Freinage';
      case 'moteur': return 'Révision Moteur';
      case 'assurance': return 'Assurance / Taxe';
      case 'controle_technique': return 'Contrôle Technique';
      default: return 'Autre entretien';
    }
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'vidange': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'pneus': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'freins': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'moteur': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'assurance': return 'bg-teal-50 text-teal-600 border-teal-100';
      case 'controle_technique': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  // Calculate stats
  const totalCost = maintenanceLogs
    .filter(l => l.status === 'done')
    .reduce((acc, l) => acc + (l.cost || 0), 0);

  const pendingSchedulesCount = maintenanceLogs.filter(l => l.status === 'scheduled').length;
  const inMaintenanceVehiclesCount = vehicles.filter(v => v.status === 'maintenance').length;

  const filteredLogs = maintenanceLogs.filter(log => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      log.vehiclePlate.toLowerCase().includes(query) ||
      log.vehicleModel.toLowerCase().includes(query) ||
      log.garage.toLowerCase().includes(query) ||
      (log.notes && log.notes.toLowerCase().includes(query));

    if (filterType === 'all') return matchesSearch;
    return log.type === filterType && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Wrench className="w-6 h-6 text-primary" />
            <span>Planification & Entretien Flotte</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Carnet d'entretien numérique, vidanges & contrôles techniques
          </p>
        </div>

        <button 
          onClick={() => {
            setCurrentLog({
              vehicleId: vehicles[0]?.id || '',
              type: 'vidange',
              date: new Date().toISOString().split('T')[0],
              mileage: vehicles[0]?.mileage || 0,
              cost: 0,
              garage: '',
              notes: '',
              status: 'done',
              nextDueDate: '',
              nextDueMileage: (vehicles[0]?.mileage || 0) + 10000
            });
            setIsLogModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition-all shadow-md shadow-primary/10"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer un Entretien</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Expenses */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
              <DollarSign className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-[10px] font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">Budget Entretien</span>
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Dépenses Cumulées</h4>
            <p className="text-2xl font-black text-ink mt-1">
              {totalCost.toLocaleString()} <span className="text-xs font-mono text-gray-400">{merchant.currency || 'FCFA'}</span>
            </p>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Sur l'ensemble des interventions réalisées</p>
          </div>
        </div>

        {/* KPI 2: Active Maintenance */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
              <Wrench className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">Atelier</span>
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Véhicules Immobilisés</h4>
            <p className="text-2xl font-black text-ink mt-1">
              {inMaintenanceVehiclesCount.toString().padStart(2, '0')} <span className="text-xs font-medium text-gray-400">Véhicules</span>
            </p>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Actuellement en cours de réparation / révision</p>
          </div>
        </div>

        {/* KPI 3: Scheduled maintenance */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">Calendrier</span>
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Entretiens Planifiés</h4>
            <p className="text-2xl font-black text-ink mt-1">
              {pendingSchedulesCount.toString().padStart(2, '0')} <span className="text-xs font-medium text-gray-400">Échéances</span>
            </p>
            <p className="text-[10px] text-gray-400 font-semibold mt-1">Vidanges ou contrôles techniques à venir</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Vehicles Alerts & Complete Maintenance Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Overdue Maintenance Alert Flags */}
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
            <h3 className="font-bold text-sm text-ink uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alerte Vidange & Révision</span>
            </h3>
          </div>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {vehicles.map(vehicle => {
              // Find the last completed maintenance log for this vehicle
              const logsForVehicle = maintenanceLogs.filter(l => l.vehicleId === vehicle.id && l.status === 'done');
              const lastLog = logsForVehicle[0]; // because we insert at index 0

              let mileageSinceMaintenance = 0;
              let isOverdue = false;
              let alertText = "En ordre";

              if (lastLog && lastLog.nextDueMileage) {
                mileageSinceMaintenance = vehicle.mileage - lastLog.mileage;
                isOverdue = vehicle.mileage >= lastLog.nextDueMileage;
                if (isOverdue) {
                  alertText = `Vidange en retard de ${(vehicle.mileage - lastLog.nextDueMileage).toLocaleString()} km`;
                } else {
                  alertText = `Prochaine vidange dans ${(lastLog.nextDueMileage - vehicle.mileage).toLocaleString()} km`;
                }
              } else if (vehicle.mileage > 10000 && logsForVehicle.length === 0) {
                isOverdue = true;
                alertText = "Aucune vidange enregistrée sur l'application";
              }

              return (
                <div key={vehicle.id} className={`p-4 rounded-2xl border ${
                  isOverdue ? 'bg-rose-50/40 border-rose-100' : 'bg-gray-50/50 border-gray-150'
                } space-y-3`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-black text-xs text-ink bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        {vehicle.plateNumber}
                      </span>
                      <h4 className="font-bold text-xs text-ink mt-2">{vehicle.model}</h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      vehicle.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                      vehicle.status === 'maintenance' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {vehicle.status === 'active' ? 'Opérationnel' : vehicle.status === 'maintenance' ? 'En Atelier' : 'Hors service'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>Odomètre actuel :</span>
                    <span className="font-bold text-ink">{vehicle.mileage?.toLocaleString() || 0} km</span>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${
                      isOverdue ? 'text-rose-600' : 'text-gray-400'
                    }`}>
                      {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                      <span>{alertText}</span>
                    </span>

                    {vehicle.status !== 'maintenance' && isOverdue && (
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Mettre ${vehicle.plateNumber} en statut 'MAINTENANCE' à l'atelier ?`)) {
                            await dbService.vehicles.save({ ...vehicle, status: 'maintenance' });
                            toast.success('Véhicule envoyé à l\'atelier');
                          }
                        }}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-lg transition-colors"
                      >
                        Atelier ⚙️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {vehicles.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-10">Aucun véhicule enregistré dans la flotte.</p>
            )}
          </div>
        </div>

        {/* Right column: Intervention log sheet */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-ink">Historique des Opérations d'Entretien</h3>
              <p className="text-xs text-gray-400 font-medium">Carnet de suivi technique de la flotte logistique</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <select 
                value={filterType} 
                onChange={e => setFilterType(e.target.value)}
                className="px-3.5 py-2 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">Tous types</option>
                <option value="vidange">Vidange</option>
                <option value="pneus">Pneus</option>
                <option value="freins">Freins</option>
                <option value="moteur">Moteur</option>
                <option value="controle_technique">Contrôle technique</option>
                <option value="assurance">Assurances</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Intervention</th>
                  <th className="px-4 py-3">Atelier / Garage</th>
                  <th className="px-4 py-3 text-right">Odomètre</th>
                  <th className="px-4 py-3 text-right">Coût</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-xs text-ink bg-gray-50 px-2 py-1 rounded-md border border-gray-200 w-fit">
                          {log.vehiclePlate}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1">{log.vehicleModel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border w-fit ${getLogTypeColor(log.type)}`}>
                          {getLogTypeLabel(log.type)}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {log.date}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs font-bold text-ink">{log.garage}</span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-semibold text-gray-600">
                      {log.mileage.toLocaleString()} km
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-xs font-black text-rose-600">
                      {log.cost.toLocaleString()} {merchant.currency || 'FCFA'}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => {
                            setCurrentLog(log);
                            setIsLogModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-gray-50 text-gray-400 hover:text-primary rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      Aucune intervention d'entretien enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Log Entry Modal */}
      <AnimatePresence>
        {isLogModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Saisie d'Intervention d'Entretien</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Suivi de la maintenance de la flotte</p>
                </div>
                <button onClick={() => setIsLogModalOpen(false)} className="p-1.5 hover:bg-white rounded-xl transition-all border border-black/5">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveLog} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Véhicule concerné</label>
                    <select 
                      value={currentLog.vehicleId} 
                      onChange={e => {
                        const vehId = e.target.value;
                        const veh = vehicles.find(v => v.id === vehId);
                        setCurrentLog({
                          ...currentLog, 
                          vehicleId: vehId,
                          mileage: veh ? veh.mileage : 0
                        });
                      }} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                      required
                    >
                      <option value="">-- Sélectionner --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.plateNumber} - {v.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type d'opération</label>
                    <select 
                      value={currentLog.type} 
                      onChange={e => setCurrentLog({...currentLog, type: e.target.value as any})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-gray-600 focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="vidange">Vidange moteur</option>
                      <option value="pneus">Pneumatiques</option>
                      <option value="freins">Système de Freinage</option>
                      <option value="moteur">Révision Moteur</option>
                      <option value="controle_technique">Contrôle Technique</option>
                      <option value="assurance">Assurance / Taxe</option>
                      <option value="autre">Autre entretien</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date de l'opération</label>
                    <input 
                      type="date" 
                      required 
                      value={currentLog.date} 
                      onChange={e => setCurrentLog({...currentLog, date: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Kilométrage (Odomètre)</label>
                    <input 
                      type="number" 
                      min="0"
                      required 
                      placeholder="ex: 120000"
                      value={currentLog.mileage} 
                      onChange={e => setCurrentLog({...currentLog, mileage: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 font-mono" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Coût de l'intervention ({merchant.currency || 'FCFA'})</label>
                    <input 
                      type="number" 
                      min="0"
                      required 
                      placeholder="ex: 35000"
                      value={currentLog.cost} 
                      onChange={e => setCurrentLog({...currentLog, cost: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-bold text-rose-600 focus:ring-2 focus:ring-primary/20 font-mono" 
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Atelier / Garage / Prestataire</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="ex: Garage Central, Total Énergie"
                      value={currentLog.garage} 
                      onChange={e => setCurrentLog({...currentLog, garage: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-150">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Échéance date (Optionnel)</label>
                    <input 
                      type="date" 
                      value={currentLog.nextDueDate || ''} 
                      onChange={e => setCurrentLog({...currentLog, nextDueDate: e.target.value})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Échéance km (Optionnel)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="ex: 130000"
                      value={currentLog.nextDueMileage || ''} 
                      onChange={e => setCurrentLog({...currentLog, nextDueMileage: Number(e.target.value)})} 
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 font-mono" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Remarques / Pièces changées</label>
                  <textarea 
                    placeholder="ex: Changement filtre à huile, filtre à air, marque Helix 5W40..."
                    value={currentLog.notes} 
                    onChange={e => setCurrentLog({...currentLog, notes: e.target.value})} 
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-150 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20 min-h-[60px]" 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">État de l'opération</label>
                  <div className="flex gap-3">
                    {['done', 'scheduled'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setCurrentLog({...currentLog, status: status as any})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          currentLog.status === status 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/10' 
                            : 'bg-white text-gray-400 border-gray-150 hover:border-gray-200'
                        }`}
                      >
                        {status === 'done' ? 'Réalisé ✅' : 'Planifié / À Venir 🗓️'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex space-x-3">
                  <button type="button" onClick={() => setIsLogModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-50 transition-colors">Annuler</button>
                  <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-colors shadow-md shadow-primary/10 flex items-center justify-center">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer Entretien'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
