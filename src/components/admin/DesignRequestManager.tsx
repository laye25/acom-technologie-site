import React from 'react';
import { useSupabaseData } from '../../hooks/useSupabase';
import { motion } from 'motion/react';
import { Clock, CheckCircle, XCircle, Eye, User, Mail, Calendar, Palette, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '../OptimizedImage';

interface DesignRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  sides: any;
  previewUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

const DesignRequestManager = () => {
  const navigate = useNavigate();
  const { data: requests, loading, refresh } = useSupabaseData<DesignRequest>({
    tableName: 'design_requests',
    order: { column: 'createdAt', direction: 'desc' }
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('design_requests').update({ status }).eq('id', id);
      if (error) throw error;
      toast.success(`Statut mis à jour : ${status}`);
      refresh();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erreur lors de l'envoi du statut.");
    }
  };

  const openInEditor = (request: DesignRequest) => {
    navigate('/design-editor', { state: { design: { sides: request.sides } } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">Demandes de Design</h2>
          <p className="text-gray-500 mt-1">Gérez les personnalisations envoyées par les clients pour tirage.</p>
        </div>
        <div className="bg-primary/10 px-4 py-2 rounded-xl">
          <span className="text-primary font-bold">{requests.length} demandes</span>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-20 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Palette className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune demande</h3>
          <p className="text-gray-500">Les designs envoyés par les clients apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-primary/5 transition-all"
            >
              <div className="aspect-[1.7/1] bg-gray-100 relative overflow-hidden">
                <OptimizedImage 
                  src={request.previewUrl} 
                  alt="Preview" 
                  width={600}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                    request.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                    request.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {request.status === 'pending' ? 'En attente' :
                     request.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-none">{request.userName}</h4>
                    <p className="text-xs text-gray-500 mt-1">{request.userEmail}</p>
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-400 mb-6">
                  <Calendar className="w-3 h-3 mr-1" />
                  {request.createdAt?.toDate ? format(request.createdAt.toDate(), 'dd MMMM yyyy HH:mm', { locale: fr }) : 'Date inconnue'}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                  <button
                    onClick={() => updateStatus(request.id, 'approved')}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all text-xs font-bold"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approuver</span>
                  </button>
                  <button
                    onClick={() => updateStatus(request.id, 'rejected')}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-xs font-bold"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rejeter</span>
                  </button>
                  <button
                    onClick={() => openInEditor(request)}
                    className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all"
                    title="Ouvrir dans l'éditeur"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignRequestManager;
