import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useAuth } from '../../context/AuthContext';
import { syncService } from '../../services/syncService';
import { UserProfile } from '../../types';
import { dbService } from '../../services/dbService';
import { 
  Search, UserPlus, Mail, Shield, 
  Printer, Palette, User, MoreVertical,
  CheckCircle, XCircle, Loader2, Globe,
  Facebook, Instagram, Linkedin, Percent
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

import { notificationService } from '../../services/notificationService';

export const UserManager: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const users = useLiveQuery(() => db.users.toArray().then(users => users as UserProfile[])) || [];
  const loading = false; // Simplified

  useEffect(() => {
    if (user?.uid) {
      syncService.syncUsers('global');
    }
  }, [user?.uid]);

  const settingsData = useLiveQuery(() => db.settings.toArray()) || [];
  
  useEffect(() => {
    if (user?.uid) {
      syncService.syncSettings(user.uid);
    }
  }, [user?.uid]);
  const globalSettings = settingsData?.find(s => s.id === 'global') || {};
  const defaultComm = globalSettings.defaultPartnerCommission || 80;

  const handleUpdateStatus = async (userId: string, newStatus: UserProfile['partnerStatus']) => {
    setIsUpdating(userId);
    try {
      if (!userId) {
        toast.error('Identifiant utilisateur manquant');
        return;
      }
      
      const user = users.find(u => (u.id || u.uid) === userId);
      const updateData: any = { partnerStatus: newStatus };
      
      if (newStatus === 'approved') {
        updateData.partnerDetails = {
          ...(user?.partnerDetails || {}),
          commissionPercentage: user?.partnerDetails?.commissionPercentage || defaultComm
        };
        // Forcer le rôle à printer si ce n'est pas déjà un partenaire designer
        if (user?.role !== 'printer' && user?.role !== 'designer') {
          updateData.role = 'printer'; 
        }
      }

      await dbService.users.update(userId, updateData);
      
      // Send notifications
      if (user) {
        if (newStatus === 'approved') {
          await notificationService.notifyPartnerApproval(user);
        } else if (newStatus === 'rejected') {
          await notificationService.notifyPartnerRejection(user);
        }
      }

      toast.success(newStatus === 'approved' ? 'Partenaire approuvé ! Email envoyé.' : 'Candidature refusée. Email envoyé.');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserProfile['role']) => {
    setIsUpdating(userId);
    try {
      if (!userId) {
        toast.error('Identifiant utilisateur manquant');
        return;
      }

      const updateData: any = { role: newRole };
      
      // If we are promoting to a partner role directly from the UI, 
      // we need to set them as approved to avoid the "Accès Restreint" screen
      if (newRole === 'printer' || newRole === 'designer') {
        const user = users.find(u => (u.id || u.uid) === userId);
        updateData.partnerStatus = 'approved';
        updateData.partnerDetails = {
          ...(user?.partnerDetails || {}),
          commissionPercentage: user?.partnerDetails?.commissionPercentage || defaultComm
        };
      } else if (newRole === 'client') {
        // Optionnel: On peut retirer le statut de partenaire si on le repasse en simple client.
        updateData.partnerStatus = 'rejected';
      }

      await dbService.users.update(userId, updateData);
      toast.success('Rôle mis à jour avec succès');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateCommission = async (userId: string, percentage: number) => {
    setIsUpdating(userId);
    try {
      await dbService.users.update(userId, { 
        partnerDetails: { 
          ...users.find(u => (u.id || u.uid) === userId)?.partnerDetails!,
          commissionPercentage: percentage 
        } 
      });
      toast.success('Taux de commission mis à jour !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setIsUpdating(null);
    }
  };

  const pendingUsers = users.filter(u => u.partnerStatus === 'pending');
  
  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} className="text-rose-500" />;
      case 'manager': return <Shield size={14} className="text-amber-500" />;
      case 'printer': return <Printer size={14} className="text-blue-500" />;
      case 'designer': return <Palette size={14} className="text-purple-500" />;
      default: return <User size={14} className="text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'manager': return 'Gestionnaire';
      case 'printer': return 'Imprimeur Partenaire';
      case 'designer': return 'Designer Partenaire';
      default: return 'Client';
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Chargement des utilisateurs...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pending Applications Alerts */}
      {pendingUsers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingUsers.map(u => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={u.id || u.uid}
              className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                  {u.role === 'printer' ? <Printer size={20} /> : <Palette size={20} />}
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-tight">{u.displayName}</p>
                  <p className="text-[10px] text-blue-600 font-bold opacity-70 uppercase tracking-widest">Postule comme {u.role === 'printer' ? 'Imprimeur' : 'Designer'}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(u)}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                Examiner
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Gestion des Utilisateurs</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
            Configurez les rôles pour activer les espaces partenaires
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium"
            />
          </div>
          {/* Mock button for creating inviting user if needed */}
          <button className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rôle Actuel</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Comm. (%)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions de Promotion</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.id || u.uid} className="hover:bg-gray-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                             <User size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{u.displayName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Mail size={10} /> {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full">
                      {getRoleIcon(u.role)}
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider">
                        {getRoleLabel(u.role)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(u.role === 'printer' || u.role === 'designer') ? (
                      <div className="flex items-center justify-center gap-2">
                        <input 
                          type="number"
                          defaultValue={u.partnerDetails?.commissionPercentage || 80}
                          onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (val !== u.partnerDetails?.commissionPercentage) {
                              handleUpdateCommission((u.id || u.uid)!, val);
                            }
                          }}
                          className="w-16 px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-center focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        <span className="text-[10px] font-bold text-gray-400">%</span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Only show promotion buttons if not already that role */}
                      {u.role !== 'printer' && (
                        <button 
                          onClick={() => handleUpdateRole((u.id || u.uid)!, 'printer')}
                          disabled={isUpdating === (u.id || u.uid)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all disabled:opacity-50"
                        >
                          Devenir Imprimeur
                        </button>
                      )}
                      {u.role !== 'designer' && (
                        <button 
                          onClick={() => handleUpdateRole((u.id || u.uid)!, 'designer')}
                          disabled={isUpdating === (u.id || u.uid)}
                          className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-100 transition-all disabled:opacity-50"
                        >
                          Devenir Designer
                        </button>
                      )}
                      {u.role !== 'client' && (
                        <button 
                          onClick={() => handleUpdateRole((u.id || u.uid)!, 'client')}
                          disabled={isUpdating === (u.id || u.uid)}
                          className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
                        >
                          Réinitialiser Client
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-bold text-gray-400">
                      {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-gray-400 font-bold italic">Aucun utilisateur ne correspond à votre recherche</p>
            </div>
          )}
        </div>
      </div>

      {/* Partner Application Review Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 lg:p-10 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                    {selectedUser.role === 'printer' ? <Printer size={28} /> : <Palette size={28} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Candidature {selectedUser.role === 'printer' ? 'Imprimeur' : 'Designer'}</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{selectedUser.displayName} • {selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <XCircle size={24} className="text-gray-400" />
                </button>
              </div>

              <div className="p-8 lg:p-10 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
                {/* Details Sections */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Gérant</p>
                    <p className="text-sm font-bold text-gray-900">{selectedUser.partnerDetails?.managerName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Entreprise</p>
                    <p className="text-sm font-bold text-gray-900">{selectedUser.partnerDetails?.companyName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Contact</p>
                    <p className="text-sm font-bold text-gray-900">{selectedUser.partnerDetails?.phone || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Adresse</p>
                    <p className="text-sm font-bold text-gray-900">{selectedUser.partnerDetails?.address || '-'}</p>
                  </div>
                </div>

                {/* Digital Signature Proof */}
                {selectedUser.partnerDetails?.signatureInfo && (
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1">Contrat Signé Numériquement</h4>
                      <p className="text-[10px] text-emerald-700 font-bold mb-3 uppercase opacity-70">Preuve d'acceptation des CGP enregistrée</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[8px] font-black text-emerald-600/60 uppercase">Date de Signature</p>
                          <p className="text-[10px] font-bold text-emerald-900">
                            {selectedUser.partnerDetails.signatureInfo.signedAt?.toDate 
                              ? selectedUser.partnerDetails.signatureInfo.signedAt.toDate().toLocaleString() 
                              : new Date(selectedUser.partnerDetails.signatureInfo.signedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-emerald-600/60 uppercase">Adresse IP</p>
                          <p className="text-[10px] font-bold text-emerald-900 font-mono">{selectedUser.partnerDetails.signatureInfo.ip}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-[8px] font-black text-emerald-600/60 uppercase">User-Agent / Navigateur</p>
                          <p className="text-[10px] font-bold text-emerald-900 truncate opacity-80" title={selectedUser.partnerDetails.signatureInfo.userAgent}>
                            {selectedUser.partnerDetails.signatureInfo.userAgent}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filiation & Historique</p>
                  <div className="bg-gray-50 p-4 rounded-2xl text-sm font-medium text-gray-600 leading-relaxed italic border border-black/5">
                    "{selectedUser.partnerDetails?.companyFiliations || 'Aucun détail fourni'}"
                  </div>
                </div>

                <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Configuration Financière</p>
                    <Percent size={14} className="text-indigo-400" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase">Taux de Commission (% Partenaire)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={selectedUser.partnerDetails?.commissionPercentage || defaultComm}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSelectedUser({
                            ...selectedUser,
                            partnerDetails: {
                              ...selectedUser.partnerDetails!,
                              commissionPercentage: val
                            }
                          });
                        }}
                        className="w-24 px-4 py-2 bg-white border border-indigo-200 rounded-xl font-black text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                      <p className="text-xs text-indigo-700 font-medium italic">
                        Ce taux sera appliqué par défaut à toutes ses futures commandes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Liens Web & Sociaux</p>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.partnerDetails?.website && (
                      <a href={selectedUser.partnerDetails.website} target="_blank" className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl hover:bg-primary/5 transition-colors group">
                        <Globe size={14} className="text-gray-400 group-hover:text-primary" />
                        <span className="text-xs font-bold text-gray-600">Site Web</span>
                      </a>
                    )}
                    {selectedUser.partnerDetails?.facebook && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <Facebook size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{selectedUser.partnerDetails.facebook}</span>
                      </div>
                    )}
                    {selectedUser.partnerDetails?.instagram && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <Instagram size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{selectedUser.partnerDetails.instagram}</span>
                      </div>
                    )}
                    {selectedUser.partnerDetails?.linkedin && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <Linkedin size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-600">{selectedUser.partnerDetails.linkedin}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 lg:p-10 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleUpdateStatus((selectedUser.id || selectedUser.uid)!, 'rejected')}
                  disabled={isUpdating === (selectedUser.id || selectedUser.uid)}
                  className="py-4 bg-white border border-red-100 text-red-500 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  Refuser
                </button>
                <button 
                  onClick={() => handleUpdateStatus((selectedUser.id || selectedUser.uid)!, 'approved')}
                  disabled={isUpdating === (selectedUser.id || selectedUser.uid)}
                  className="py-4 bg-ink text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-ink/20"
                >
                  Approuver
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManager;
