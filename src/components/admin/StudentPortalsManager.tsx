import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { dbService } from '../../services/dbService';
import {
  Search, Key, ShieldAlert, Edit2, X, Plus, Users, GraduationCap, Check, HelpCircle,
  Smartphone, Eye, Trash2, Database, Download, Mail, Phone, ArrowRight, Share2, EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { StudentPortalSimulation } from '../StudentPortalSimulation';

interface StudentPortalsManagerProps {
  merchant: any;
}

export const StudentPortalsManager = ({ merchant }: StudentPortalsManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Fetch all students
  const students = useLiveQuery(() => 
    db.students?.where('merchantId').equals(merchant.id || '').toArray()
  , [merchant.id]) || [];

  // Fetch classes for filtering
  const classes = useLiveQuery(() => 
    db.classes?.where('merchantId').equals(merchant.id || '').toArray()
  , [merchant.id]) || [];

  // Process and automatically guarantee credentials exist for students
  const processedStudents = React.useMemo(() => {
    return students.map((s: any) => {
      let updated = false;
      const copy = { ...s };

      if (!copy.studentUsername && !copy.username) {
        const cleanStudentName = ((copy.firstName || '') + (copy.lastName || ''))
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
        const randSuffix = Math.floor(100 + Math.random() * 900);
        const generatedStudentUsername = `e_${cleanStudentName || 'eleve'}${randSuffix}`;
        copy.studentUsername = generatedStudentUsername;
        copy.username = generatedStudentUsername;
        updated = true;
      }

      if (!copy.studentPassword && !copy.password) {
        const generatedStudentPassword = Math.floor(100000 + Math.random() * 900000).toString();
        copy.studentPassword = generatedStudentPassword;
        copy.password = generatedStudentPassword;
        updated = true;
      }

      if (updated) {
        dbService.students.save({
          ...s,
          studentUsername: copy.studentUsername || copy.username,
          username: copy.studentUsername || copy.username,
          studentPassword: copy.studentPassword || copy.password,
          password: copy.studentPassword || copy.password,
          updatedAt: new Date()
        }).catch(err => console.error("Error auto-generating student credentials FL:", err));
      }

      return copy;
    });
  }, [students]);

  // Filter students based on search and selected class
  const filteredStudents = React.useMemo(() => {
    return processedStudents.filter((student: any) => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const login = (student.studentUsername || student.username || '').toLowerCase();
      const matchSearch = fullName.includes(searchTerm.toLowerCase()) || login.includes(searchTerm.toLowerCase());
      const matchClass = selectedClass === 'all' || student.grade === selectedClass;
      return matchSearch && matchClass;
    });
  }, [processedStudents, searchTerm, selectedClass]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié avec succès !`);
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await dbService.students.save({
        ...editingStudent,
        studentUsername: studentUsername.trim().toLowerCase(),
        username: studentUsername.trim().toLowerCase(),
        studentPassword: studentPassword.trim(),
        password: studentPassword.trim(),
        updatedAt: new Date()
      });
      toast.success("Codes d'accès mis à jour avec succès !");
      setEditingStudent(null);
    } catch (err) {
      console.error("Error updating credentials:", err);
      toast.error("Erreur lors de la mise à jour des identifiants");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink">Portails Élèves</h2>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">
            Suivi des accès individuels des apprenants • Actifs: {processedStudents.length}
          </p>
        </div>
      </div>

      {/* Info card */}
      <div className="p-5 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 border border-indigo-100 rounded-2xl flex items-start gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl shrink-0">
          <Key className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-indigo-950 text-sm">Gestion des Accès Élève</h4>
          <p className="text-xs text-indigo-900/85 leading-relaxed">
            Chaque élève créé dispose instantanément d'identifiants de portail générés automatiquement (<code className="bg-white/70 px-1 py-0.5 rounded text-indigo-600 font-mono font-bold">e_prenomnom123</code>). Les élèves peuvent se connecter depuis l'écran de connexion principal pour consulter leur cahier de texte, leurs notes, retards, et emploi du temps.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom d'élève, identifiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-sans font-bold"
          >
            <option value="all">Toutes les classes</option>
            {classes.map((c: any) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List / Table */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <GraduationCap className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aucun élève trouvé.</p>
          <p className="text-xs text-slate-400 mt-1">Créez votre dossier académique pour générer automatiquement son accès portail.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-black/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-mono font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-5">Élève & Classe</th>
                  <th className="px-8 py-5">Identifiant Unique (Login)</th>
                  <th className="px-8 py-5">Code PIN d'Accès</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredStudents.map((student: any) => {
                  const studentLogin = student.studentUsername || student.username || 'Inconnu';
                  const studentPin = student.studentPassword || student.password || '---';
                  const fullName = `${student.firstName || ''} ${student.lastName || ''}`;

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center font-black text-xs shrink-0">
                            {student.firstName?.charAt(0) || '?'}{student.lastName?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{fullName}</p>
                            <p className="text-xs text-indigo-600 font-bold mt-0.5">Classe: {student.grade || 'Non spécifiée'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-black bg-indigo-50/70 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100/40">
                          <span>{studentLogin}</span>
                          <button
                            onClick={() => handleCopy(studentLogin, "Identifiant")}
                            className="text-indigo-400 hover:text-indigo-800 text-[10px] uppercase font-bold shrink-0 ml-1 cursor-pointer"
                          >
                            Copier
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-black bg-slate-50 text-gray-800 px-3 py-1 rounded-xl border border-gray-100">
                          <span>{studentPin}</span>
                          <button
                            onClick={() => handleCopy(studentPin, "Code PIN")}
                            className="text-slate-400 hover:text-slate-800 text-[10px] uppercase font-bold shrink-0 ml-1 cursor-pointer"
                          >
                            Copier
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2 flex justify-end items-center">
                        <button
                          onClick={() => {
                            const shareText = `Bonjour ${fullName}. Voici tes accès pour te connecter sur ton Portail Élève :\n🌐 Lien: ${window.location.origin}/login\n👤 Identifiant: *${studentLogin}*\n🔑 Code PIN: *${studentPin}*\n\nBon fonctionnement !`;
                            const encoded = encodeURIComponent(shareText);
                            const targetPhone = student.whatsApp || student.phone || student.fatherPhone || student.motherPhone || student.guardianPhone || student.parentContact || '';
                            const cleanPhone = targetPhone.replace(/[^0-9+]/g, '');
                            const target = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`;
                            window.open(target, '_blank');
                            toast.success("WhatsApp préparé avec les identifiants de l'élève !");
                          }}
                          className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-100 rounded-xl transition-all cursor-pointer inline-flex"
                          title="Envoyer les accès du portail par WhatsApp à l'Élève"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingStudent(student);
                            setStudentUsername(studentLogin);
                            setStudentPassword(studentPin);
                          }}
                          className="p-2 bg-slate-55 hover:bg-slate-200 text-slate-600 border border-slate-100 rounded-xl transition-all cursor-pointer inline-flex"
                          title="Modifier les identifiants d'accès"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-3 py-2 bg-indigo-600 hover:bg-slate-900 text-white font-extrabold rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Simuler et tester immédiatement l'espace de cet élève"
                        >
                          <span>Simuler</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Portal Simulation Overlay */}
      {selectedStudent && (
        <StudentPortalSimulation
          student={selectedStudent}
          merchant={merchant}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Edit Student Access Dialog Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 bg-slate-50 border-b border-gray-100 flex justify-between items-center font-sans">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">Modifier Accès Élève</h3>
                </div>
                <button onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveStudentEdit} className="p-6 space-y-4 font-sans">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Élève ciblé</label>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-800 text-sm">
                    {editingStudent.firstName} {editingStudent.lastName}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Identifiant Élève (Username)</label>
                  <input 
                    type="text" 
                    required
                    value={studentUsername}
                    onChange={e => setStudentUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-gray-400">Exemple: e_diop223 (Utilisez de préférence des lettres minuscules, chiffres ou souligné)</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Code PIN de sécurité</label>
                  <input 
                    type="text" 
                    required
                    maxLength={10}
                    value={studentPassword}
                    onChange={e => setStudentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold font-sans outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase tracking-widest font-black rounded-xl cursor-pointer shadow-md mt-6"
                >
                  Valider et Enregistrer
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
