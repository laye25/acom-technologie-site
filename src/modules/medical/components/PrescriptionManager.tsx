import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { dbService } from '../../../services/dbService';
import { Merchant } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Printer, Search, FileCheck, X, Loader2, Calendar, User, Eye, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface MedicineRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export const PrescriptionManager = ({ merchant }: { merchant: Merchant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [currentPrescription, setCurrentPrescription] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [prescriptionLimit, setPrescriptionLimit] = useState(10);

  // Dynamic Medicines Rows for New/Edit form
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  // Load Prescriptions from Dexie
  const prescriptions = useLiveQuery(() => 
    db.table('prescriptions')
      .where('merchantId')
      .equals(merchant.id)
      .reverse()
      .sortBy('updatedAt')
  , [merchant.id]) || [];

  // Load Patients to allow dynamic drop-down selection
  const patients = useLiveQuery(() => 
    db.patients.where('merchantId').equals(merchant.id).toArray()
  , [merchant.id]) || [];

  const handleAddMedicineRow = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: keyof MedicineRow, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPrescription.patientId) {
      toast.error('Veuillez sélectionner un patient');
      return;
    }

    const patient = patients.find(p => p.id === currentPrescription.patientId);
    if (!patient) {
      toast.error('Patient introuvable');
      return;
    }

    // Filter out completely empty medicine rows
    const validMedicines = medicines.filter(m => m.name.trim() !== '');
    if (validMedicines.length === 0) {
      toast.error('Veuillez ajouter au moins un médicament valide');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...currentPrescription,
        patientName: `${patient.firstName} ${patient.lastName}`,
        medicines: validMedicines,
        date: currentPrescription.date || new Date().toISOString().split('T')[0],
        merchantId: merchant.id
      };

      await dbService.prescriptions.save(dataToSave);
      toast.success('Ordonnance enregistrée avec succès');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast.error("Erreur lors de l'enregistrement de l'ordonnance");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette ordonnance ?')) return;
    try {
      await dbService.prescriptions.delete(id);
      toast.success('Ordonnance supprimée');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const triggerPrint = (presc: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression. Veuillez autoriser les fenêtres pop-up.');
      return;
    }

    const patient = patients.find(p => p.id === presc.patientId);
    const dobFormatted = patient?.dateOfBirth ? format(new Date(patient.dateOfBirth), 'dd/MM/yyyy') : '---';

    const medicinesHtml = presc.medicines.map((m: any, idx: number) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; font-weight: bold; color: #1e293b; font-size: 15px;">
          ${idx + 1}. ${m.name} <span style="font-weight: normal; color: #64748b; font-size: 13px;">(${m.dosage})</span>
        </td>
        <td style="padding: 12px 0; color: #334155; font-size: 14px;">${m.frequency}</td>
        <td style="padding: 12px 0; color: #334155; font-size: 14px;">${m.duration}</td>
        <td style="padding: 12px 0; color: #64748b; font-size: 13px; font-style: italic;">${m.instructions || '---'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ordonnance_Medicale_${presc.id?.substring(0, 8)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            background: #fff;
          }
          .prescription-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            border-radius: 8px;
            position: relative;
            min-height: 900px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header {
            border-bottom: 3px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .clinic-name {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.02em;
          }
          .clinic-sub {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-top: 4px;
          }
          .clinic-details {
            font-size: 12px;
            color: #475569;
            text-align: right;
            line-height: 1.6;
          }
          .meta-section {
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
            background: #f8fafc;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
          }
          .meta-title {
            font-size: 10px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 4px;
          }
          .meta-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          .rx-symbol {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 20px;
          }
          .medicines-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            margin-bottom: 40px;
          }
          .medicines-table th {
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            font-size: 11px;
            font-weight: bold;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .notes-section {
            margin-top: auto;
            padding-top: 20px;
            border-top: 1px dashed #e2e8f0;
          }
          .notes-title {
            font-size: 12px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 6px;
          }
          .notes-content {
            font-size: 13px;
            color: #64748b;
            line-height: 1.6;
          }
          .footer-signature {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .doctor-sign-box {
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            width: 200px;
            text-align: center;
            font-size: 12px;
            color: #475569;
          }
          @media print {
            body { padding: 0; }
            .prescription-container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="prescription-container">
          <div>
            <div class="header">
              <div>
                <div class="clinic-name">${merchant.name}</div>
                <div class="clinic-sub">Secteur Médical / Clinique</div>
              </div>
              <div class="clinic-details">
                ${merchant.phone ? `Tél: ${merchant.phone}<br/>` : ''}
                ${merchant.email ? `Email: ${merchant.email}<br/>` : ''}
                ${merchant.address ? `Adresse: ${merchant.address}` : ''}
              </div>
            </div>

            <div class="meta-section">
              <div>
                <div>
                  <div class="meta-title">Patient</div>
                  <div class="meta-value">${presc.patientName}</div>
                </div>
                <div style="margin-top: 12px;">
                  <div class="meta-title">Date de Naissance Sexe</div>
                  <div class="meta-value">${dobFormatted} (${patient?.gender === 'M' ? 'Masculin' : 'Féminin'})</div>
                </div>
              </div>
              <div style="text-align: right;">
                <div>
                  <div class="meta-title">Date de Prescription</div>
                  <div class="meta-value">${format(new Date(presc.date), 'dd MMMM yyyy', { locale: fr })}</div>
                </div>
                <div style="margin-top: 12px;">
                  <div class="meta-title">Réf Ordonnance</div>
                  <div class="meta-value" style="font-family: monospace; font-size: 12px; color: #64748b;">${presc.id?.toUpperCase().substring(0, 12)}</div>
                </div>
              </div>
            </div>

            <div class="rx-symbol">℞</div>

            <table class="medicines-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Médicament & Dosage</th>
                  <th style="width: 20%;">Fréquence</th>
                  <th style="width: 15%;">Durée</th>
                  <th style="width: 25%;">Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${medicinesHtml}
              </tbody>
            </table>

            ${presc.notes ? `
              <div class="notes-section">
                <div class="notes-title">Recommandations & Notes d'utilisation :</div>
                <div class="notes-content">${presc.notes}</div>
              </div>
            ` : ''}
          </div>

          <div class="footer-signature">
            <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">Généré via Acom Medical</div>
            <div class="doctor-sign-box">
              Signature & Cachet<br/>
              <strong style="color: #0f172a; display: block; margin-top: 5px;">Dr. ${presc.doctorName || 'Médecin Praticien'}</strong>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.patientName.toLowerCase().includes(q) ||
      (p.doctorName && p.doctorName.toLowerCase().includes(q)) ||
      p.id?.toLowerCase().includes(q) ||
      p.medicines.some((m: any) => m.name.toLowerCase().includes(q))
    );
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Gestion des Ordonnances</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Total ordonnances: {prescriptions.length.toString().padStart(3, '0')}
          </p>
        </div>
        <button 
          onClick={() => {
            setMedicines([{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
            setCurrentPrescription({
              patientId: '',
              patientName: '',
              doctorName: '',
              date: new Date().toISOString().split('T')[0],
              notes: ''
            });
            setIsEditing(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Ordonnance</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par patient, médicament, médecin..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-black/5 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          />
        </div>
      </div>

      {/* Main Grid Or List */}
      <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Réf / Date</th>
                <th className="px-8 py-5">Patient</th>
                <th className="px-8 py-5">Médecin Prescripteur</th>
                <th className="px-8 py-5">Médicaments</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrescriptions.slice(0, prescriptionLimit).map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-mono text-[11px] font-black text-ink uppercase">ORD-{p.id?.substring(0, 8).toUpperCase()}</span>
                      <span className="flex items-center text-[10px] text-gray-400 font-mono mt-0.5">
                        <Calendar className="w-3 h-3 mr-1 opacity-40" /> {format(new Date(p.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-[10px] font-black text-rose-600 border border-rose-100">
                        {p.patientName?.[0]}
                      </div>
                      <span className="text-sm font-black text-ink">{p.patientName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-semibold text-gray-700">Dr. {p.doctorName || 'Praticien'}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {p.medicines?.map((m: any, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold rounded-lg uppercase">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => { setSelectedPrescription(p); setIsPreviewing(true); }}
                        className="p-2.5 hover:bg-gray-100 text-gray-600 rounded-xl border border-transparent hover:border-gray-200"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => triggerPrint(p)}
                        className="p-2.5 hover:bg-primary/10 text-primary rounded-xl border border-transparent hover:border-primary/20"
                        title="Imprimer l'ordonnance"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="p-2.5 hover:bg-rose-50 text-rose-600 rounded-xl border border-transparent hover:border-rose-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrescriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 font-medium">
                    Aucune ordonnance trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {filteredPrescriptions.length > prescriptionLimit && (
            <div className="p-4 flex justify-center border-t border-gray-100">
              <button 
                onClick={() => setPrescriptionLimit(prev => prev + 10)}
                className="px-6 py-2 bg-gray-50 text-gray-600 font-bold text-[10px] rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
              >
                Voir plus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New/Edit Ordonnance */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Rédiger une Ordonnance Médicale</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Prescription certifiée & traçable</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Patient</label>
                    <select 
                      required 
                      value={currentPrescription.patientId} 
                      onChange={e => setCurrentPrescription({...currentPrescription, patientId: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold"
                    >
                      <option value="">-- Choisir un patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Médecin Prescripteur</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="ex: Dr. Diallo" 
                      value={currentPrescription.doctorName} 
                      onChange={e => setCurrentPrescription({...currentPrescription, doctorName: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Date d'ordonnance</label>
                    <input 
                      type="date" 
                      required 
                      value={currentPrescription.date} 
                      onChange={e => setCurrentPrescription({...currentPrescription, date: e.target.value})} 
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 font-mono-bold" 
                    />
                  </div>
                </div>

                {/* Medicines List Sub-Form */}
                <div className="pt-4 border-t border-dashed border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Médicaments Prescrits</h4>
                    <button 
                      type="button" 
                      onClick={handleAddMedicineRow} 
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-[10px] rounded-xl uppercase tracking-wider transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Ajouter une ligne</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {medicines.map((med, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 bg-gray-50/40 p-4 rounded-2xl border border-gray-100/60 items-end">
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Nom du Médicament</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="ex: Doliprane 1g" 
                            value={med.name} 
                            onChange={e => handleMedicineChange(idx, 'name', e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Dosage</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="ex: 1 comprimé" 
                            value={med.dosage} 
                            onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Fréquence</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="ex: 3 fois par jour" 
                            value={med.frequency} 
                            onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                        <div className="w-full md:w-32">
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Durée</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="ex: 7 jours" 
                            value={med.duration} 
                            onChange={e => handleMedicineChange(idx, 'duration', e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Instructions spéciales</label>
                          <input 
                            type="text" 
                            placeholder="ex: Après les repas" 
                            value={med.instructions || ''} 
                            onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)} 
                            className="w-full px-3.5 py-2.5 bg-white border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-primary/20" 
                          />
                        </div>
                        <button 
                          type="button" 
                          disabled={medicines.length === 1}
                          onClick={() => handleRemoveMedicineRow(idx)}
                          className="p-3 bg-white text-rose-600 hover:bg-rose-50 border border-gray-100 hover:border-rose-100 rounded-xl transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-dashed border-gray-100">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-2">Notes d'utilisation / Recommandations complémentaires</label>
                  <textarea 
                    value={currentPrescription.notes} 
                    onChange={e => setCurrentPrescription({...currentPrescription, notes: e.target.value})} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-primary/20 bg-gray-50/30 text-sm min-h-[80px]" 
                    placeholder="Saisissez d'autres détails ou contre-indications..." 
                  />
                </div>
              </form>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex space-x-4">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-white transition-colors border-none">Annuler</button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer la prescription'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View Details */}
      <AnimatePresence>
        {isPreviewing && selectedPrescription && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-ink">Ordonnance Médicale</h3>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Détails et Consultation</p>
                </div>
                <button onClick={() => setIsPreviewing(false)} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-black/5">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 space-y-6 flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Patient</span>
                    <p className="font-bold text-ink text-sm">{selectedPrescription.patientName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Médecin Prescripteur</span>
                    <p className="font-bold text-ink text-sm">Dr. {selectedPrescription.doctorName || 'Médecin Praticien'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Date</span>
                    <p className="font-bold text-ink text-sm">{format(new Date(selectedPrescription.date), 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase text-gray-400 tracking-wider">Réf Ordonnance</span>
                    <p className="font-mono text-xs font-semibold text-gray-500">{selectedPrescription.id?.toUpperCase()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black font-mono uppercase tracking-[0.2em] text-gray-400">Médicaments Prescrits</h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                    {selectedPrescription.medicines?.map((med: any, idx: number) => (
                      <div key={idx} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:bg-gray-50/50">
                        <div>
                          <p className="font-bold text-ink text-sm">{idx + 1}. {med.name}</p>
                          <span className="text-xs text-gray-400 font-medium mt-0.5 inline-block">Dosage: {med.dosage}</span>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs font-bold text-ink">{med.frequency}</p>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">Durée: {med.duration}</p>
                          {med.instructions && (
                            <span className="text-[11px] text-gray-500 italic mt-1 block font-medium">({med.instructions})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPrescription.notes && (
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-black font-mono uppercase tracking-[0.2em] text-gray-400">Notes complémentaires</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed font-medium">
                      {selectedPrescription.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                <button 
                  onClick={() => setIsPreviewing(false)} 
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-bold rounded-2xl"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => { triggerPrint(selectedPrescription); setIsPreviewing(false); }}
                  className="flex-1 py-4 bg-primary text-white hover:bg-primary-hover transition-all font-bold rounded-2xl shadow-lg shadow-primary/15 flex items-center justify-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer l'ordonnance</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
